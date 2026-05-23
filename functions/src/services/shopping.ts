import { db } from '../admin';
import { ShopData, ShopInput } from '../../../shared/schema';

const shopsCol = () => db.collection('shops');

export const shoppingService = {
  async getById(id: string): Promise<ShopData | null> {
    const snap = await shopsCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as ShopData;
  },

  async list(filters: { city?: string; country?: string; category?: string; status?: string } = {}): Promise<ShopData[]> {
    let query: FirebaseFirestore.Query = shopsCol();

    if (filters.status) query = query.where('status', '==', filters.status);
    else query = query.where('status', '==', 'active');

    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.country) query = query.where('country', '==', filters.country);
    if (filters.category) query = query.where('category', '==', filters.category);

    const snap = await query.limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ShopData[];
  },

  async create(data: ShopInput): Promise<ShopData> {
    const now = new Date().toISOString();
    const ref = shopsCol().doc();
    const shop: ShopData = {
      ...data,
      id: ref.id,
      status: data.status ?? 'active',
      deals: data.deals ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(shop);
    return shop;
  },

  async update(id: string, data: Partial<ShopInput>): Promise<ShopData | null> {
    const ref = shopsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const updates = { ...data, updatedAt: new Date().toISOString() };
    await ref.update(updates);

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as ShopData;
  },

  async delete(id: string): Promise<void> {
    await shopsCol().doc(id).delete();
  },

  async setPromoted(id: string, isPromoted: boolean): Promise<ShopData | null> {
    const ref = shopsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    await ref.update({ isPromoted, updatedAt: new Date().toISOString() });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as ShopData;
  },
};
