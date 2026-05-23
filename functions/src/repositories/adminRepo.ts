import { db } from '../admin';

export type SupportTicketStatus =
  | 'new'
  | 'in_progress'
  | 'waiting_on_user'
  | 'resolved'
  | 'closed';

export type SupportTicketRecord = Record<string, unknown>;

export interface AdminRepo {
  countUsers(): Promise<number>;
  countPublishedEvents(): Promise<number>;
  countTickets(): Promise<number>;
  countVerifiedCouncils(): Promise<number>;
  countPendingUserHandles(): Promise<number>;
  countPendingProfileHandles(): Promise<number>;
  countNewUsersSince(isoDate: string): Promise<number>;
  countOrganizerUsers(): Promise<number>;
  countPendingReports(): Promise<number>;
  listSupportTickets(): Promise<SupportTicketRecord[]>;
  createSupportTicket(id: string, payload: SupportTicketRecord): Promise<void>;
  getSupportTicketById(id: string): Promise<SupportTicketRecord | null>;
}

async function runCount(query: FirebaseFirestore.Query): Promise<number> {
  const snap = await query.count().get();
  return snap.data().count ?? 0;
}

export const firestoreAdminRepo: AdminRepo = {
  countUsers: () => runCount(db.collection('users')),
  countPublishedEvents: () => runCount(db.collection('events').where('status', '==', 'published')),
  countTickets: () => runCount(db.collection('tickets')),
  countVerifiedCouncils: () => runCount(db.collection('councils').where('verificationStatus', '==', 'verified')),
  countPendingUserHandles: () => runCount(db.collection('users').where('handleStatus', '==', 'pending')),
  countPendingProfileHandles: () => runCount(db.collection('profiles').where('handleStatus', '==', 'pending')),
  countNewUsersSince: (isoDate: string) => runCount(db.collection('users').where('createdAt', '>=', isoDate)),
  countOrganizerUsers: () =>
    runCount(db.collection('users').where('role', 'in', ['organizer', 'admin', 'cityAdmin', 'platformAdmin'])),
  countPendingReports: () => runCount(db.collection('reports').where('status', '==', 'pending')),
  listSupportTickets: async () => {
    const snap = await db.collection('supportTickets').get();
    return snap.docs.map((d) => d.data() ?? {});
  },
  createSupportTicket: async (id: string, payload: SupportTicketRecord) => {
    await db.collection('supportTickets').doc(id).set(payload);
  },
  getSupportTicketById: async (id: string) => {
    const snap = await db.collection('supportTickets').doc(id).get();
    if (!snap.exists) return null;
    return snap.data() ?? null;
  },
};
