import { randomUUID } from 'node:crypto';
import type {
  SupportTicketDepartment,
  SupportTicketStatus,
  SupportTicketStatusHistoryItem,
} from '../../../../shared/schema';
import type { AdminRepo } from '../../repositories/adminRepo';

export type CreateSupportTicketInput = {
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  department: SupportTicketDepartment;
  toEmail?: string;
  subject?: string;
  message: string;
  appVersion?: string;
  platform?: string;
};

export async function createSupportTicket(
  repo: AdminRepo,
  input: CreateSupportTicketInput,
) {
  const now = new Date().toISOString();
  const status: SupportTicketStatus = 'new';
  const statusHistory: SupportTicketStatusHistoryItem[] = [
    { status, at: now, by: input.userId, note: 'Ticket created' },
  ];

  const id = randomUUID();
  const payload = {
    userId: input.userId,
    userEmail: input.userEmail ?? undefined,
    userName: input.userName ?? undefined,
    userRole: input.userRole ?? undefined,
    department: input.department,
    toEmail: input.toEmail ?? `${input.department}@culturepass.app`,
    subject: input.subject?.trim() || 'Support request',
    message: input.message.trim(),
    appVersion: input.appVersion ?? undefined,
    platform: input.platform ?? undefined,
    source: 'contact-screen',
    status,
    priority: 'medium',
    statusHistory,
    assigneeId: null,
    assigneeName: null,
    firstResponseAt: undefined,
    dueAt: undefined,
    internalNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  await repo.createSupportTicket(id, payload);
  const ticket = await repo.getSupportTicketById(id);
  if (!ticket) throw new Error('Failed to read created support ticket');
  return { id, ticket: { id, ...ticket } };
}
