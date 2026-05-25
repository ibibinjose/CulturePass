import { db } from '../admin';
import { logger } from 'firebase-functions';

export interface EventDailyMetric {
  day: string;
  views: number;
  saves: number;
  ticketSales: number;
  revenueCents: number;
}

export interface EventAnalyticsData {
  eventId: string;
  totals: {
    views: number;
    saves: number;
    shares: number;
    ticketSales: number;
    revenueCents: number;
    attending: number;
  };
  trend: EventDailyMetric[];
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
}

export const eventAnalyticsService = {
  async getAnalytics(eventId: string): Promise<EventAnalyticsData> {
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) {
      throw new Error('Event not found');
    }

    const eventData = eventSnap.data()!;

    const [ticketsSnap, activitySnap, savesSnap] = await Promise.all([
      db.collection('tickets').where('eventId', '==', eventId).get(),
      db.collection('activities').where('eventId', '==', eventId).limit(5000).get(),
      db.collection('eventFavorites').where('eventId', '==', eventId).get(),
    ]);

    const tickets = ticketsSnap.docs.map(d => d.data());
    const paidTickets = tickets.filter(t => t.paymentStatus === 'paid' || t.status === 'paid');
    const revenueCents = paidTickets.reduce((sum, t) => sum + (t.totalPriceCents ?? t.priceCents ?? 0), 0);

    const activities = activitySnap.docs.map(d => d.data());
    const views = activities.filter(a => a.action === 'event_view' || a.action === 'view_event').length;
    const shares = activities.filter(a => a.action === 'event_share' || a.action === 'share_event').length;

    const byDay = new Map<string, EventDailyMetric>();

    // Process views
    activities.forEach(a => {
      if (a.action === 'event_view' || a.action === 'view_event') {
        const day = a.createdAt?.slice(0, 10);
        if (day) {
          const metric = byDay.get(day) || this.emptyMetric(day);
          metric.views += 1;
          byDay.set(day, metric);
        }
      }
    });

    // Process tickets
    paidTickets.forEach(t => {
      const day = t.createdAt?.slice(0, 10);
      if (day) {
        const metric = byDay.get(day) || this.emptyMetric(day);
        metric.ticketSales += 1;
        metric.revenueCents += (t.totalPriceCents ?? t.priceCents ?? 0);
        byDay.set(day, metric);
      }
    });

    // Process saves
    savesSnap.docs.forEach(d => {
      const day = d.data().createdAt?.slice(0, 10);
      if (day) {
        const metric = byDay.get(day) || this.emptyMetric(day);
        metric.saves += 1;
        byDay.set(day, metric);
      }
    });

    const trend = Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));

    // Traffic sources (mocked for now based on activity metadata if available)
    const trafficSources = {
      direct: 0,
      search: 0,
      social: 0,
      referral: 0,
    };

    activities.forEach(a => {
      const source = (a.metadata?.source || 'direct').toLowerCase();
      if (source.includes('search')) trafficSources.search++;
      else if (source.includes('social') || source.includes('instagram') || source.includes('facebook')) trafficSources.social++;
      else if (source.includes('referral')) trafficSources.referral++;
      else trafficSources.direct++;
    });

    return {
      eventId,
      totals: {
        views,
        saves: savesSnap.size,
        shares,
        ticketSales: paidTickets.length,
        revenueCents,
        attending: eventData.attending || 0,
      },
      trend,
      trafficSources,
    };
  },

  emptyMetric(day: string): EventDailyMetric {
    return {
      day,
      views: 0,
      saves: 0,
      ticketSales: 0,
      revenueCents: 0,
    };
  }
};
