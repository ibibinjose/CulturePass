import { db } from '../admin';

export interface TaxonomyCategory {
  id: string;
  title: string;
  tags: string[];
  accentColor: string;
  updatedAt: string;
}

const taxonomyCol = () => db.collection('taxonomy');

// Fallback seed data if Firestore is empty
const SEED_CATEGORIES = [
  { id: 'cultural', title: 'Cultural & Community', accentColor: '#FFC857', tags: ['Cultural Festivals', 'Indian Events', 'South Asian Events'] },
  { id: 'arts', title: 'Arts & Entertainment', accentColor: '#FF5E5B', tags: ['Live Music', 'DJ & Nightlife', 'Theatre'] },
  { id: 'food', title: 'Food & Lifestyle', accentColor: '#FFC857', tags: ['Food Festivals', 'Street Food', 'Indian Restaurants'] },
  { id: 'business', title: 'Business & Networking', accentColor: '#4F46E5', tags: ['Startup Events', 'Business Networking'] },
];

export const taxonomyService = {
  async getCategories(): Promise<TaxonomyCategory[]> {
    const snap = await taxonomyCol().get();
    if (snap.empty) {
      return SEED_CATEGORIES.map(cat => ({
        ...cat,
        updatedAt: new Date().toISOString(),
      }));
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaxonomyCategory));
  },

  async getCategory(id: string): Promise<TaxonomyCategory | null> {
    const snap = await taxonomyCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as TaxonomyCategory;
  },

  async updateCategory(id: string, tags: string[], userId: string): Promise<TaxonomyCategory> {
    const now = new Date().toISOString();
    const doc = taxonomyCol().doc(id);
    const existing = await doc.get();
    
    const updates = {
      tags,
      lastUpdatedBy: userId,
      updatedAt: now,
    };
    
    if (existing.exists) {
      await doc.update(updates);
    } else {
      // Find title from seed or use default
      const seedCat = SEED_CATEGORIES.find(c => c.id === id);
      await doc.set({
        title: seedCat?.title || id,
        accentColor: seedCat?.accentColor || '#666',
        ...updates
      });
    }
    
    return (await this.getCategory(id))!;
  }
};
