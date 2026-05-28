export interface AdminStats {
  users: number;
  events: number;
  tickets: number;
  revenue: number;

  // Extended team/organizer monitoring fields
  multiOrganizerProfiles?: number;   // Communities + Businesses with >0 additional organizers
  activeOrganizers?: number;         // Total unique people with organizer roles

  // Signup trends (last 30 days)
  signupTrends?: Array<{
    date: string;   // YYYY-MM-DD
    count: number;
  }>;

  // Optional additional signals
  newProfiles30d?: number;
  newEvents30d?: number;

  // Granular team data from pre-aggregation
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
