import { getPlatformStats } from './getPlatformStats';
import type { AdminRepo } from '../../repositories/adminRepo';

describe('getPlatformStats use-case', () => {
  it('computes open and breached support metrics correctly', async () => {
    const pastDue = new Date(Date.now() - 60_000).toISOString();
    const futureDue = new Date(Date.now() + 60_000).toISOString();
    const repo: AdminRepo = {
      countUsers: async () => 10,
      countPublishedEvents: async () => 8,
      countTickets: async () => 50,
      countVerifiedCouncils: async () => 4,
      countPendingUserHandles: async () => 2,
      countPendingProfileHandles: async () => 3,
      countNewUsersSince: async () => 5,
      countOrganizerUsers: async () => 6,
      countPendingReports: async () => 7,
      listSupportTickets: async () => [
        { status: 'new', dueAt: pastDue },
        { status: 'in_progress', dueAt: futureDue },
        { status: 'waiting_on_user' },
        { status: 'resolved', dueAt: pastDue },
      ],
      createSupportTicket: async () => {},
      getSupportTicketById: async () => null,
    };

    const stats = await getPlatformStats(repo);

    expect(stats.totalUsers).toBe(10);
    expect(stats.pendingHandlesUsers).toBe(2);
    expect(stats.pendingHandlesProfiles).toBe(3);
    expect(stats.openSupportTickets).toBe(3);
    expect(stats.breachedSupportSla).toBe(1);
  });
});
