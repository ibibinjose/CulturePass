import { db } from '../admin';

export interface FirestoreActivity {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  country: string;
  imageUrl?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  ownerId: string;
  isPromoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

const activitiesCol = () => db.collection('activities');

export const activitiesService = {
  async getById(id: string): Promise<FirestoreActivity | null> {
    const snap = await activitiesCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreActivity;
  },

  async list(filters: { city?: string; category?: string } = {}): Promise<FirestoreActivity[]> {
    let query: FirebaseFirestore.Query = activitiesCol();
    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.category) query = query.where('category', '==', filters.category);
    
    const snap = await query.limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreActivity[];
  },

  async create(data: Omit<FirestoreActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreActivity> {
    const now = new Date().toISOString();
    const ref = activitiesCol().doc();
    const activity: FirestoreActivity = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(activity);
    return activity;
  },

  async update(id: string, data: Partial<FirestoreActivity>): Promise<FirestoreActivity | null> {
    const ref = activitiesCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    
    const updates = { ...data, updatedAt: new Date().toISOString() };
    await ref.update(updates);
    
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreActivity;
  },

  async delete(id: string): Promise<void> {
    await activitiesCol().doc(id).delete();
  },
};
