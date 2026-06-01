import type { ReportStatus } from './common';
export interface ContentReport {
    id: string;
    reporterId?: string;
    reporterUserId?: string;
    targetId: string;
    targetType: 'event' | 'profile' | 'community' | 'post' | 'user' | 'comment';
    reason: string;
    details?: string;
    status: ReportStatus;
    reviewedBy?: string;
    reviewedAt?: string;
    createdAt: string;
}
export interface ModerationTargetSnapshot {
    id: string;
    type: ContentReport['targetType'];
    exists: boolean;
    title: string;
    subtitle?: string;
    ownerId?: string;
    ownerName?: string;
    status?: string;
    imageUrl?: string;
    route?: string;
    fields: Record<string, unknown>;
}
export interface ModerationReportContext {
    report: ContentReport;
    target: ModerationTargetSnapshot | null;
    reporter: {
        id: string;
        displayName?: string;
        email?: string;
        role?: string;
        status?: string;
    } | null;
}
//# sourceMappingURL=moderation.d.ts.map