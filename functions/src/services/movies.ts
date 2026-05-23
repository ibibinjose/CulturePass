import { db } from '../admin';
import { MovieData, MovieInput } from '../../../shared/schema';

const moviesCol = () => db.collection('movies');

export const moviesService = {
  async getById(id: string): Promise<MovieData | null> {
    const snap = await moviesCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as MovieData;
  },

  async list(filters: { city?: string; country?: string; genre?: string; status?: string } = {}): Promise<MovieData[]> {
    let query: FirebaseFirestore.Query = moviesCol();
    
    if (filters.status) query = query.where('status', '==', filters.status);
    else query = query.where('status', '==', 'active');

    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.country) query = query.where('country', '==', filters.country);
    
    // Genre filter (array contains)
    if (filters.genre) query = query.where('genre', 'array-contains', filters.genre);
    
    const snap = await query.limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as MovieData[];
  },

  async create(data: MovieInput): Promise<MovieData> {
    const now = new Date().toISOString();
    const ref = moviesCol().doc();
    const movie: MovieData = { 
      ...data, 
      id: ref.id, 
      status: data.status ?? 'active',
      createdAt: now, 
      updatedAt: now 
    };
    await ref.set(movie);
    return movie;
  },

  async update(id: string, data: Partial<MovieInput>): Promise<MovieData | null> {
    const ref = moviesCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    
    const updates = { ...data, updatedAt: new Date().toISOString() };
    await ref.update(updates);
    
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as MovieData;
  },

  async delete(id: string): Promise<void> {
    await moviesCol().doc(id).delete();
  },
};
