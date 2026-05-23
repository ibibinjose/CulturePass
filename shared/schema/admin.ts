export interface AdminStats {
  users: number;
  events: number;
  tickets: number;
  revenue: number;
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
