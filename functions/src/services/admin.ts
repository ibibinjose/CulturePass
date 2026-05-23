import { db } from '../admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { AdminStats, AuditLog } from '../../../shared/schema/admin';
import type { ContentReport, ModerationReportContext, ModerationTargetSnapshot } from '../../../shared/schema/moderation';
import { logger } from 'firebase-functions';

/**
 * Admin Service
 * Handles platform-wide statistics, audit logging, and administrative configuration.
 */
export const adminService = {
  /**
   * Aggregate high-level platform stats.
   * In a real production system, these might be cached or pulled from a pre-aggregated collection.
   */
  async getStats(): Promise<AdminStats> {
    try {
      const [usersSnap, eventsSnap, ticketsSnap] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('events').count().get(),
        db.collection('tickets').count().get(),
      ]);

      // Calculate revenue (sum of amountCents in paid tickets)
      // For performance in large datasets, this should be a rolling aggregate.
      const paidTicketsSnap = await db.collection('tickets')
        .where('paymentStatus', '==', 'paid')
        .get();

      let revenue = 0;
      paidTicketsSnap.forEach((doc: QueryDocumentSnapshot) => {
        revenue += (doc.data().amountCents || 0);
      });

      return {
        users: usersSnap.data().count,
        events: eventsSnap.data().count,
        tickets: ticketsSnap.data().count,
        revenue,
      };
    } catch (error) {
      logger.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  /**
   * Log an administrative action to the audit trail.
   */
  async logAction(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await db.collection('auditLogs').add({
      ...log,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Retrieve recent audit logs.
   */
  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const snap = await db.collection('auditLogs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as AuditLog));
  },

  /**
   * Retrieve moderation reports.
   */
  async getReports(status: string, limit = 50): Promise<ContentReport[]> {
    let query = db.collection('reports') as FirebaseFirestore.Query;

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snap = await query.orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentReport));
  },

  /**
   * Retrieve a report with enough target/reporter context for a real review.
   */
  async getReportContext(reportId: string): Promise<ModerationReportContext | null> {
    const reportSnap = await db.collection('reports').doc(reportId).get();
    if (!reportSnap.exists) return null;

    const report = { id: reportSnap.id, ...reportSnap.data() } as ContentReport;
    const target = await getModerationTargetSnapshot(report);
    const reporterId = report.reporterUserId ?? report.reporterId;
    const reporter = reporterId ? await getReporterSnapshot(reporterId) : null;

    return { report, target, reporter };
  },

  /**
   * Resolve a moderation report.
   */
  async resolveReport(reportId: string, reviewedBy: string, action: string): Promise<void> {
    const reportRef = db.collection('reports').doc(reportId);
    const report = await reportRef.get();

    if (!report.exists) {
      throw new Error('Report not found');
    }

    const data = report.data() as ContentReport & { reporterUserId?: string };

    const nextStatus = action === 'dismissed' ? 'dismissed' : 'resolved';
    await reportRef.update({
      status: nextStatus,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      resolutionAction: action,
    });

    if (action === 'dismissed' || action === 'keep_content') {
      return;
    }

    if (action === 'remove_item') {
      if (data.targetType === 'event') {
        await db.collection('events').doc(data.targetId).update({ status: 'cancelled' });
      } else if (data.targetType === 'profile') {
        await db.collection('profiles').doc(data.targetId).update({ status: 'suspended' });
      } else if (data.targetType === 'community') {
        await db.collection('communities').doc(data.targetId).update({ status: 'suspended' });
      } else if (data.targetType === 'post') {
        await db.collection('feedItems').doc(data.targetId).update({ status: 'removed' });
      }
    } else if (action === 'ban_user') {
      const targetSnapshot = data.targetType === 'user' ? null : await getModerationTargetSnapshot(data);
      const userId = data.targetType === 'user' ? data.targetId : ((data as { targetOwnerId?: string }).targetOwnerId ?? targetSnapshot?.ownerId);
      if (userId) {
        await db.collection('users').doc(userId).update({ status: 'suspended', updatedAt: new Date().toISOString() });
      }
    }
  },

  /**
   * Get global platform configuration.
   */
  async getPlatformConfig() {
    const doc = await db.collection('systemConfig').doc('global').get();
    if (!doc.exists) {
      return {
        maintenanceMode: false,
        readOnlyMode: false,
        feeBps: 1000,
        minimumPayoutThresholdCents: 5000,
      };
    }
    return doc.data();
  },

  /**
   * Update global platform configuration.
   */
  async updatePlatformConfig(updates: any): Promise<void> {
    await db.collection('systemConfig').doc('global').set(updates, { merge: true });
  },

  /**
   * Update user status or role (Admin action).
   */
  async updateUser(userId: string, updates: any): Promise<void> {
    await db.collection('users').doc(userId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Update featured cities list.
   */
  async updateFeaturedCity(cityId: string, updates: any): Promise<void> {
    await db.collection('cities').doc(cityId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Add a new slide to the home carousel.
   */
  async addCarouselSlide(slide: any): Promise<string> {
    const res = await db.collection('heroCarousel').add({
      ...slide,
      createdAt: new Date().toISOString(),
    });
    return res.id;
  },

  /**
   * Remove a carousel slide.
   */
  async removeCarouselSlide(slideId: string): Promise<void> {
    await db.collection('heroCarousel').doc(slideId).delete();
  },

  /**
   * List recent transactions for finance terminal.
   */
  async getRecentTransactions(limit = 100) {
    const snap = await db.collection('tickets')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        eventId: data.eventId,
        eventTitle: data.eventTitle || 'Unknown Event',
        amountCents: data.amountCents || 0,
        paymentStatus: data.paymentStatus || 'unknown',
        status: data.status || 'unknown',
        createdAt: data.createdAt,
      };
    });
  }
};

function textField(data: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return fallback;
}

function numberField(data: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function targetCollection(type: ContentReport['targetType']): string | null {
  switch (type) {
    case 'event':
      return 'events';
    case 'profile':
      return 'profiles';
    case 'community':
      return 'communities';
    case 'post':
    case 'comment':
      return 'feedItems';
    case 'user':
      return 'users';
    default:
      return null;
  }
}

function targetRoute(type: ContentReport['targetType'], id: string): string | undefined {
  switch (type) {
    case 'event':
      return `/event/${id}`;
    case 'profile':
      return `/profile/${id}`;
    case 'community':
      return `/community/${id}`;
    case 'user':
      return `/user/${id}`;
    default:
      return undefined;
  }
}

async function getModerationTargetSnapshot(report: ContentReport): Promise<ModerationTargetSnapshot | null> {
  const collection = targetCollection(report.targetType);
  if (!collection) return null;

  const snap = await db.collection(collection).doc(report.targetId).get();
  if (!snap.exists) {
    return {
      id: report.targetId,
      type: report.targetType,
      exists: false,
      title: 'Deleted or unavailable item',
      fields: {},
    };
  }

  const data = snap.data() as Record<string, unknown>;
  const ownerId = textField(data, ['ownerId', 'organizerId', 'userId', 'createdBy']);
  const startsAt = textField(data, ['startDate', 'date', 'createdAt']);
  const city = textField(data, ['city', 'state', 'country']);
  const priceCents = numberField(data, ['priceCents', 'totalPriceCents', 'amountCents']);
  const subtitleParts = [city, startsAt].filter(Boolean);

  return {
    id: snap.id,
    type: report.targetType,
    exists: true,
    title: textField(data, ['title', 'name', 'displayName', 'username'], `${report.targetType} ${snap.id}`),
    subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
    ownerId: ownerId || undefined,
    ownerName: textField(data, ['ownerName', 'organizerName', 'hostName']),
    status: textField(data, ['status', 'paymentStatus', 'publishStatus']),
    imageUrl: textField(data, ['imageUrl', 'coverImageUrl', 'heroImageUrl', 'avatarUrl']),
    route: targetRoute(report.targetType, snap.id),
    fields: {
      category: data.category,
      city: data.city,
      country: data.country,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      priceCents,
      ownerId: ownerId || undefined,
    },
  };
}

async function getReporterSnapshot(userId: string): Promise<ModerationReportContext['reporter']> {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return { id: userId };
  const data = snap.data() as Record<string, unknown>;
  return {
    id: userId,
    displayName: textField(data, ['displayName', 'username', 'handle']),
    email: textField(data, ['email']),
    role: textField(data, ['role']),
    status: textField(data, ['status']),
  };
}
