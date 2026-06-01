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

  // Classes & Fitness rich fields (forward-compatible)
  recurrence?: string;
  difficulty?: string;
  instructorName?: string;
  scheduleText?: string;
  maxParticipants?: string | number;
  locationType?: string;
  primaryCulture?: string;
  visibility?: string;
  ageGroup?: string;
  duration?: string;
  priceLabel?: string;
  highlights?: string[];
  location?: string;
}

const activitiesCol = () => db.collection('activities');

export const activitiesService = {
  async getById(id: string): Promise<FirestoreActivity | null> {
    const snap = await activitiesCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreActivity;
  },

  async list(filters: { 
    city?: string; 
    country?: string;
    category?: string; 
    status?: 'published' | 'draft' | 'archived' | 'all';
    /** Simple server-side hint for fitness/wellness classes (client can also filter) */
    fitness?: boolean;
  } = {}): Promise<FirestoreActivity[]> {
    let query: FirebaseFirestore.Query = activitiesCol();

    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.country) query = query.where('country', '==', filters.country);
    if (filters.category) query = query.where('category', '==', filters.category);

    // Default to published for public discovery surfaces
    const wantStatus = filters.status ?? 'published';
    if (wantStatus !== 'all') {
      query = query.where('status', '==', wantStatus);
    }

    const snap = await query.limit(100).get();
    let results = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreActivity[];

    // Optional post-filter for fitness-oriented categories when fitness=true
    if (filters.fitness) {
      const fitnessKeywords = ['wellness', 'yoga', 'fitness', 'dance', 'pilates', 'meditation', 'gym', 'sports', 'training', 'class', 'workout', 'zumba', 'boxing', 'martial'];
      results = results.filter((a) => {
        const hay = [a.category, a.name, a.description, ...(a.highlights ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return fitnessKeywords.some((k) => hay.includes(k));
      });
    }

    return results;
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
