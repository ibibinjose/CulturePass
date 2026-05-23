import type { AdminRepo, SupportTicketRecord, SupportTicketStatus } from '../../repositories/adminRepo';

type PlatformStats = {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  verifiedCouncils: number;
  pendingHandlesUsers: number;
  pendingHandlesProfiles: number;
  newUsersThisWeek: number;
  organizerAccounts: number;
  pendingReports: number;
  openSupportTickets: number;
  breachedSupportSla: number;
};

function deriveSupportMetrics(supportTickets: SupportTicketRecord[], nowMs: number) {
  const openStatuses: SupportTicketStatus[] = ['new', 'in_progress', 'waiting_on_user'];
  const openSupportTickets = supportTickets.filter((t) =>
    openStatuses.includes((t['status'] as SupportTicketStatus | undefined) ?? 'new'),
  ).length;

  const breachedSupportSla = supportTickets.filter((t) => {
    const status = (t['status'] as SupportTicketStatus | undefined) ?? 'new';
    if (!openStatuses.includes(status)) return false;
    const dueAt = t['dueAt'];
    if (typeof dueAt !== 'string' || dueAt.length === 0) return false;
    const dueMs = Date.parse(dueAt);
    return Number.isFinite(dueMs) && dueMs < nowMs;
  }).length;

  return { openSupportTickets, breachedSupportSla };
}

export async function getPlatformStats(repo: AdminRepo): Promise<PlatformStats> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoIso = oneWeekAgo.toISOString();

  const [
    totalUsers,
    totalEvents,
    totalTickets,
    verifiedCouncils,
    pendingHandlesUsers,
    pendingHandlesProfiles,
    newUsersThisWeek,
    organizerAccounts,
    pendingReports,
    supportTickets,
  ] = await Promise.all([
    repo.countUsers(),
    repo.countPublishedEvents(),
    repo.countTickets(),
    repo.countVerifiedCouncils(),
    repo.countPendingUserHandles(),
    repo.countPendingProfileHandles(),
    repo.countNewUsersSince(oneWeekAgoIso),
    repo.countOrganizerUsers(),
    repo.countPendingReports(),
    repo.listSupportTickets(),
  ]);

  const { openSupportTickets, breachedSupportSla } = deriveSupportMetrics(supportTickets, Date.now());

  return {
    totalUsers,
    totalEvents,
    totalTickets,
    verifiedCouncils,
    pendingHandlesUsers,
    pendingHandlesProfiles,
    newUsersThisWeek,
    organizerAccounts,
    pendingReports,
    openSupportTickets,
    breachedSupportSla,
  };
}
