/**
 * Host Application — submitted by users who want to become organisers / hosts
 * on CulturePass. Reviewed by the team; approval upgrades the user's role to
 * 'organizer' and unlocks the Hostspace creation lab.
 */
export type HostType = 'creator' | 'business' | 'organizer' | 'venue' | 'community';
export type HostApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface HostApplication {
    id: string;
    userId: string;
    hostType: HostType;
    /** Full name of the applicant */
    fullName: string;
    /** Business / organisation / stage name (optional) */
    businessName?: string | null;
    /** One-paragraph description of what they do */
    description: string;
    city?: string | null;
    country?: string | null;
    websiteUrl?: string | null;
    instagramHandle?: string | null;
    /** Why they want to list on CulturePass */
    motivation?: string | null;
    status: HostApplicationStatus;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    reviewNote?: string | null;
    createdAt: string;
    updatedAt: string;
}
export declare const HOST_TYPE_OPTIONS: {
    id: HostType;
    label: string;
    desc: string;
    icon: string;
}[];
//# sourceMappingURL=hostApplication.d.ts.map