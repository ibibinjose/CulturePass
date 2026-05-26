import { createSupportTicket } from './createSupportTicket';
import type { AdminRepo } from '../../repositories/adminRepo';

describe('createSupportTicket use-case', () => {
  it('builds defaults and persists ticket', async () => {
    let created: { id: string; payload: Record<string, unknown> } | null = null;
    const repo: AdminRepo = {
      countUsers: async () => 0,
      countPublishedEvents: async () => 0,
      countTickets: async () => 0,
      countVerifiedCouncils: async () => 0,
      countPendingUserHandles: async () => 0,
      countPendingProfileHandles: async () => 0,
      countNewUsersSince: async () => 0,
      countOrganizerUsers: async () => 0,
      countPendingReports: async () => 0,
      listSupportTickets: async () => [],
      createSupportTicket: async (id, payload) => {
        created = { id, payload };
      },
      getSupportTicketById: async (id) => {
        if (!created || created.id !== id) return null;
        return created.payload;
      },
    };

    const result = await createSupportTicket(repo, {
      userId: 'u_123',
      department: 'support',
      message: 'Need help with my event listing.',
    });

    expect(result.id).toBeTruthy();
    expect(result.ticket).toEqual(
      expect.objectContaining({
        id: result.id,
        userId: 'u_123',
        department: 'support',
        subject: 'Support request',
        toEmail: 'support@culturepass.app',
        status: 'new',
      }),
    );
  });
});
