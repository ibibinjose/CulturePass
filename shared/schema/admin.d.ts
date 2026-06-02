export interface AdminStats {
    users: number;
    events: number;
    tickets: number;
    revenue: number;
    multiOrganizerProfiles?: number;
    activeOrganizers?: number;
    signupTrends?: {
        date: string;
        count: number;
    }[];
    newProfiles30d?: number;
    newEvents30d?: number;
    multiOrganizerCommunities?: number;
    multiOrganizerBusinesses?: number;
    organizerRoleCounts?: Record<string, number>;
    signupsLast90Days?: number;
}
export interface AuditLog {
    id: string;
    action: string;
    userId: string;
    userName: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}
//# sourceMappingURL=admin.d.ts.map