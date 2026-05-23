import { db } from '../admin';

export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

const notificationsCol = () => db.collection('notifications');

export const notificationsService = {
  async getById(id: string): Promise<FirestoreNotification | null> {
    const snap = await notificationsCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreNotification;
  },

  async listForUser(userId: string, limit = 50): Promise<FirestoreNotification[]> {
    const snap = await notificationsCol()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreNotification[];
  },

  async unreadCount(userId: string): Promise<number> {
    const snap = await notificationsCol()
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .count()
      .get();
    return snap.data().count;
  },

  async markRead(id: string): Promise<void> {
    await notificationsCol().doc(id).update({ isRead: true });
  },

  async markAllRead(userId: string): Promise<void> {
    const snap = await notificationsCol().where('userId', '==', userId).where('isRead', '==', false).get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.update(doc.ref, { isRead: true }));
    await batch.commit();
  },

  async delete(id: string): Promise<void> {
    await notificationsCol().doc(id).delete();
  },

  async create(data: Omit<FirestoreNotification, 'id' | 'isRead' | 'createdAt'>): Promise<FirestoreNotification> {
    const now = new Date().toISOString();
    const ref = notificationsCol().doc();
    const notification: FirestoreNotification = { 
      ...data, 
      id: ref.id, 
      isRead: false, 
      createdAt: now 
    };
    await ref.set(notification);
    return notification;
  },
};
