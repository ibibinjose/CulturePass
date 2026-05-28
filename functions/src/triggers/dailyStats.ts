/**
 * Daily Stats Aggregation Trigger
 *
 * Runs once per day and computes platform metrics, storing them in the
 * `dailyStats` collection for fast retrieval by the admin dashboard.
 *
 * This avoids expensive on-demand aggregations at scale.
 */

import { scheduler } from 'firebase-functions/v2';
import { db } from '../admin';
import { nowIso } from '../handlers/utils';

const REGION = 'australia-southeast1';

/**
 * Scheduled function - runs every day at 00:30 Australia/Sydney time.
 */
export const dailyStatsAggregation = scheduler.onSchedule(
  {
    schedule: '30 0 * * *',           // 00:30 every day
    timeZone: 'Australia/Sydney',
    region: REGION,
  },
  async () => {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const stats = await computeDailyStats();

      await db.collection('dailyStats').doc(dateKey).set({
        ...stats,
        date: dateKey,
        computedAt: nowIso(),
      });

      console.log(`[dailyStats] Aggregated stats for ${dateKey}`);
    } catch (err) {
      console.error('[dailyStats] Aggregation failed:', err);
    }
  }
);

/**
 * Computes the daily snapshot.
 * This can also be called manually from an admin endpoint.
 */
export async function computeDailyStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Basic counts
  const [usersCount, eventsCount, profilesSnap] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('events').count().get(),
    db.collection('profiles').get(),
  ]);

  // Multi-organizer + Role breakdown
  let multiOrganizerCommunities = 0;
  let multiOrganizerBusinesses = 0;
  let totalActiveOrganizers = 0;
  const organizerSet = new Set<string>();
  const roleCounts: Record<string, number> = {};

  profilesSnap.forEach((doc) => {
    const data = doc.data();
    const et = data.entityType;
    const organizers: any[] = data.organizers || [];

    const hasMultiple = organizers.length > 0;

    if (et === 'community' && hasMultiple) multiOrganizerCommunities++;
    if (et === 'business' && hasMultiple) multiOrganizerBusinesses++;

    if (data.ownerId) organizerSet.add(data.ownerId);
    organizers.forEach((o: any) => {
      if (o.userId) organizerSet.add(o.userId);
      const role = o.role || 'unknown';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // Treat primary owner as lead_organizer if not explicitly listed
    if (data.ownerId && !organizers.some((o: any) => o.userId === data.ownerId)) {
      roleCounts['lead_organizer'] = (roleCounts['lead_organizer'] || 0) + 1;
    }
  });

  totalActiveOrganizers = organizerSet.size;

  // Role breakdown is already populated inside the profiles loop above as `roleCounts`

  // Recent signups (last 90 days for historical trends)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const recentUsersSnap = await db.collection('users')
    .where('createdAt', '>=', ninetyDaysAgo.toISOString())
    .get();

  const signupsByDay: Record<string, number> = {};
  recentUsersSnap.forEach((doc) => {
    const ca = doc.data().createdAt;
    if (ca) {
      const d = new Date(ca).toISOString().split('T')[0];
      signupsByDay[d] = (signupsByDay[d] || 0) + 1;
    }
  });

  // Revenue (simplified - last 30d paid tickets)
  let revenue30d = 0;
  const paidRecent = await db.collection('tickets')
    .where('paymentStatus', '==', 'paid')
    .where('createdAt', '>=', thirtyDaysAgo.toISOString())
    .get();

  paidRecent.forEach((doc) => {
    revenue30d += doc.data().amountCents || 0;
  });

  // === 90-day signup trends (we store the map; consumer can slice) ===
  const signupsByDay90d: Record<string, number> = { ...signupsByDay };

  // (We already queried 30 days. For true 90-day we would extend the query,
  // but for now we keep the pattern and let the dashboard request more days if needed.)

  return {
    totalUsers: usersCount.data().count,
    totalEvents: eventsCount.data().count,
    totalProfiles: profilesSnap.size,

    multiOrganizerCommunities,
    multiOrganizerBusinesses,
    activeOrganizers: totalActiveOrganizers,

    // Role breakdown (e.g. { lead_organizer: 124, co_organizer: 87, manager: 31, ... })
    organizerRoleCounts: roleCounts,

    signupsLast30Days: Object.entries(signupsByDay)
      .filter(([date]) => new Date(date) >= thirtyDaysAgo)
      .reduce((sum, [, count]) => sum + count, 0),

    signupsLast90Days: Object.values(signupsByDay).reduce((a, b) => a + b, 0),

    // Full historical maps for the dashboard
    signupsByDay30d: Object.fromEntries(
      Object.entries(signupsByDay).filter(([date]) => new Date(date) >= thirtyDaysAgo)
    ),
    signupsByDay90d: signupsByDay,

    revenueLast30DaysCents: revenue30d,
  };
}
