export interface AdminStats {
  users: number;
  events: number;
  tickets: number;
  revenue: number;

  // Extended team/organizer monitoring fields
  multiOrganizerProfiles?: number;   // Communities + Businesses with >0 additional organizers
  activeOrganizers?: number;         // Total unique people with organizer roles

  // Signup trends (last 30 days)
  signupTrends?: {
    date: string;   // YYYY-MM-DD
    count: number;
  }[];

  // Optional additional signals
  newProfiles30d?: number;
  newEvents30d?: number;

  // Granular team data from pre-aggregation
  multiOrganizerCommunities?: number;
  multiOrganizerBusinesses?: number;
  organizerRoleCounts?: Record<string, number>;
  signupsLast90Days?: number;

  /** CulturePass+ members (membershipTier === plus) */
  plusMembers?: number;
  /** Host onboarding queue */
  pendingHostApplications?: number;
  pendingVerificationTasks?: number;
  publishedHostPages?: number;
  /** Sum of signups in signupTrends window */
  signupDelta30?: number;
}

export interface HostspaceAdminOverview {
  generatedAt: string;
  counts: {
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    pendingVerification: number;
    inReviewVerification: number;
    publishedHostPages: number;
    draftHostPages: number;
    blockedHostPages: number;
    publishedEvents: number;
    draftEvents: number;
    activeOrganizers: number;
  };
  recentApplications: Array<{
    id: string;
    fullName: string;
    businessName: string;
    city: string;
    hostType: string;
    status: string;
    createdAt: string;
  }>;
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
