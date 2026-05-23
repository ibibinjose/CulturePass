// lib/firebase/explore.ts
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export const getExploreItems = async (filters: any) => {
  if (!db) {
    return { events: [] };
  }

  let q = query(
    collection(db, 'events'),
    orderBy('culturalRelevanceScore', 'desc'),
    orderBy('startDate', 'asc'),
    limit(50)
  );

  if (filters.categories?.length) {
    q = query(q, where('categories', 'array-contains-any', filters.categories));
  }
  if (filters.cultureTags?.length) {
    q = query(q, where('cultureTags', 'array-contains-any', filters.cultureTags));
  }

  const snapshot = await getDocs(q);
  return {
    events: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
};
