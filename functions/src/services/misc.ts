import { db } from '../admin';

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface FirestoreReport {
  id: string;
  targetType: 'event' | 'community' | 'profile' | 'post' | 'user';
  targetId: string;
  reason: string;
  details?: string;
  reporterUserId: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedAt?: string;
  reviewedBy?: string;
  moderationNotes?: string;
  createdAt: string;
}

const reportsCol = () => db.collection('reports');

export const reportsService = {
  async create(data: Omit<FirestoreReport, 'id' | 'createdAt' | 'status'>): Promise<FirestoreReport> {
    const now = new Date().toISOString();
    const ref = reportsCol().doc();
    const report: FirestoreReport = { ...data, id: ref.id, createdAt: now, status: 'pending' };
    await ref.set(report);
    return report;
  },

  async list(limit = 100): Promise<FirestoreReport[]> {
    const snap = await reportsCol().orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreReport[];
  },

  async review(
    id: string,
    status: FirestoreReport['status'],
    reviewedBy: string,
    moderationNotes?: string
  ): Promise<FirestoreReport | null> {
    const ref = reportsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    
    const update = { status, reviewedAt: new Date().toISOString(), reviewedBy, ...(moderationNotes && { moderationNotes }) };
    await ref.update(update);
    
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreReport;
  },
};

// ---------------------------------------------------------------------------
// Event Feedback
// ---------------------------------------------------------------------------

export interface FirestoreEventFeedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

const eventFeedbackCol = () => db.collection('eventFeedback');

export const eventFeedbackService = {
  async upsert(data: Omit<FirestoreEventFeedback, 'id' | 'createdAt'>): Promise<FirestoreEventFeedback> {
    const now = new Date().toISOString();
    const existing = await eventFeedbackCol()
      .where('userId', '==', data.userId)
      .where('eventId', '==', data.eventId)
      .limit(1)
      .get();
      
    if (!existing.empty) {
      const ref = existing.docs[0].ref;
      await ref.update({ rating: data.rating, comment: data.comment, updatedAt: now });
      const snap = await ref.get();
      return { id: ref.id, ...snap.data() } as FirestoreEventFeedback;
    }
    
    const ref = eventFeedbackCol().doc();
    const feedback: FirestoreEventFeedback = { ...data, id: ref.id, createdAt: now };
    await ref.set(feedback);
    return feedback;
  },

  async listForEvent(eventId: string): Promise<FirestoreEventFeedback[]> {
    const snap = await eventFeedbackCol()
      .where('eventId', '==', eventId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreEventFeedback[];
  },
};

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface FirestoreMedia {
  id: string;
  targetType: string;
  targetId: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  uploadedBy?: string;
  createdAt: string;
}

const mediaCol = () => db.collection('media');

export const mediaService = {
  async attach(data: Omit<FirestoreMedia, 'id' | 'createdAt'>): Promise<FirestoreMedia> {
    const now = new Date().toISOString();
    const ref = mediaCol().doc();
    const media: FirestoreMedia = { ...data, id: ref.id, createdAt: now };
    await ref.set(media);
    return media;
  },

  async listForTarget(targetType: string, targetId: string): Promise<FirestoreMedia[]> {
    const snap = await mediaCol()
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreMedia[];
  },
};

// ---------------------------------------------------------------------------
// Payment Methods
// ---------------------------------------------------------------------------

export interface FirestorePaymentMethod {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'paypal' | 'apple_pay' | 'google_pay';
  label: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  stripePaymentMethodId?: string;
  isDefault: boolean;
  createdAt: string;
}

const paymentMethodsCol = () => db.collection('paymentMethods');

export const paymentMethodsService = {
  async listForUser(userId: string): Promise<FirestorePaymentMethod[]> {
    const snap = await paymentMethodsCol()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestorePaymentMethod[];
  },

  async create(data: Omit<FirestorePaymentMethod, 'id' | 'createdAt'>): Promise<FirestorePaymentMethod> {
    const now = new Date().toISOString();
    const ref = paymentMethodsCol().doc();
    const method: FirestorePaymentMethod = { ...data, id: ref.id, createdAt: now };
    await ref.set(method);
    return method;
  },

  async setDefault(userId: string, methodId: string): Promise<void> {
    const snap = await paymentMethodsCol().where('userId', '==', userId).get();
    const batch = db.batch();
    snap.docs.forEach((doc) =>
      batch.update(doc.ref, { isDefault: doc.id === methodId })
    );
    await batch.commit();
  },

  async delete(id: string): Promise<void> {
    await paymentMethodsCol().doc(id).delete();
  },
};

// ---------------------------------------------------------------------------
// Scan Events
// ---------------------------------------------------------------------------

export interface FirestoreScanEvent {
  id: string;
  ticketId: string;
  eventId?: string;
  userId?: string;
  scannedBy: string;
  outcome: 'accepted' | 'duplicate' | 'rejected';
  reason?: string;
  scannedAt: string;
}

const scanEventsCol = () => db.collection('scanEvents');

export const scanEventsService = {
  async record(data: Omit<FirestoreScanEvent, 'id' | 'scannedAt'>): Promise<FirestoreScanEvent> {
    const now = new Date().toISOString();
    const ref = scanEventsCol().doc();
    const event: FirestoreScanEvent = { ...data, id: ref.id, scannedAt: now };
    await ref.set(event);
    return event;
  },

  async listForEvent(eventId: string): Promise<FirestoreScanEvent[]> {
    const snap = await scanEventsCol()
      .where('eventId', '==', eventId)
      .orderBy('scannedAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreScanEvent[];
  },

  async listForTicket(ticketId: string): Promise<FirestoreScanEvent[]> {
    const snap = await scanEventsCol()
      .where('ticketId', '==', ticketId)
      .orderBy('scannedAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreScanEvent[];
  },
};
