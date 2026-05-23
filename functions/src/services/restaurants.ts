// @tag:restaurant
import { db } from '../admin';
import { RestaurantData, RestaurantInput } from '../../../shared/schema';

const restaurantsCol = () => db.collection('restaurants');

export const restaurantsService = {
  async getById(id: string): Promise<RestaurantData | null> {
    const snap = await restaurantsCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as RestaurantData;
  },

  async list(filters: { city?: string; country?: string; cuisine?: string; status?: string } = {}): Promise<RestaurantData[]> {
    let query: FirebaseFirestore.Query = restaurantsCol();

    if (filters.status) query = query.where('status', '==', filters.status);
    else query = query.where('status', '==', 'active');

    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.country) query = query.where('country', '==', filters.country);
    if (filters.cuisine) query = query.where('cuisine', '==', filters.cuisine);

    const snap = await query.limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as RestaurantData[];
  },

  async create(data: RestaurantInput): Promise<RestaurantData> {
    const now = new Date().toISOString();
    const ref = restaurantsCol().doc();
    const restaurant: RestaurantData = {
      ...data,
      id: ref.id,
      status: data.status ?? 'active',
      deals: data.deals ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(restaurant);
    return restaurant;
  },

  async update(id: string, data: Partial<RestaurantInput>): Promise<RestaurantData | null> {
    const ref = restaurantsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const updates = { ...data, updatedAt: new Date().toISOString() };
    await ref.update(updates);

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as RestaurantData;
  },

  async delete(id: string): Promise<void> {
    await restaurantsCol().doc(id).delete();
  },

  async setPromoted(id: string, isPromoted: boolean): Promise<RestaurantData | null> {
    const ref = restaurantsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    await ref.update({ isPromoted, updatedAt: new Date().toISOString() });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as RestaurantData;
  },
};
