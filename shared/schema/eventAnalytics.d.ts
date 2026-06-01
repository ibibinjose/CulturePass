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
//# sourceMappingURL=eventAnalytics.d.ts.map