import { db } from '../admin';

export interface FirestoreTicket {
  id: string;
  eventId: string;
  userId: string;
  tierId?: string;
  tierName?: string;
  quantity?: number;
  priceCents: number;
  totalPriceCents?: number;
  status: 'confirmed' | 'used' | 'cancelled' | 'expired';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  paymentIntentId?: string;
  stripePaymentIntentId?: string;
  cashbackCents?: number;
  cashbackCreditedAt?: string;
  rewardPointsEarned?: number;
  rewardPointsAwardedAt?: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  imageColor?: string;
  qrCode: string;
  cpTicketId: string;
  history: { action: string; timestamp: string; actorId?: string }[];
  
  paymentMethodType?: string;
  promotionalCode?: string;
  discountCents?: number;
  sourceMedium?: string;
  metadata?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
}

const ticketsCol = () => db.collection('tickets');

export const ticketsService = {
  async getById(id: string): Promise<FirestoreTicket | null> {
    const snap = await ticketsCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreTicket;
  },

  async listForUser(userId: string): Promise<FirestoreTicket[]> {
    try {
      const snap = await ticketsCol()
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreTicket[];
    } catch (err: any) {
      // Graceful fallback for missing composite indexes (common in new rollouts)
      if (err?.message?.includes('index') || err?.code === 9) {
        console.warn(`[ticketsService] Index missing for userId+createdAt. Falling back to in-memory sort for ${userId}.`);
        const snap = await ticketsCol().where('userId', '==', userId).get();
        const tickets = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreTicket[];
        return tickets.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      }
      throw err;
    }
  },

  async listAll(limit = 100): Promise<FirestoreTicket[]> {
    const snap = await ticketsCol().orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreTicket));
  },

  async create(data: Omit<FirestoreTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreTicket> {
    const now = new Date().toISOString();
    const ref = ticketsCol().doc();
    const ticket: FirestoreTicket = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(ticket);
    return ticket;
  },

  async updateStatus(
    id: string,
    status: FirestoreTicket['status'],
    actorId?: string
  ): Promise<FirestoreTicket | null> {
    const ref = ticketsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const existing = snap.data() as FirestoreTicket;
    const historyEntry = { action: `status_${status}`, timestamp: new Date().toISOString(), actorId };

    await ref.update({
      status,
      history: [...(existing.history ?? []), historyEntry],
      updatedAt: new Date().toISOString(),
    });

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreTicket;
  },

  async getByQrCode(qrCode: string): Promise<FirestoreTicket | null> {
    const snap = await ticketsCol().where('qrCode', '==', qrCode).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreTicket;
  },

  async update(id: string, data: Partial<FirestoreTicket>): Promise<FirestoreTicket | null> {
    const ref = ticketsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    await ref.update({ ...data, updatedAt: new Date().toISOString() });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreTicket;
  },
};
