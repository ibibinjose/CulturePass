import { db } from '../admin';
import type { FieldValue } from 'firebase-admin/firestore';

export interface FirestoreUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  postcode?: number;
  country?: string;
  avatarUrl?: string;
  /** ISO timestamp — bumps client image caches when avatar changes */
  avatarUpdatedAt?: string;
  /** ISO timestamp — Apple/Google Wallet pass revision signal */
  walletPassUpdatedAt?: string;
  bio?: string;
  website?: string;
  location?: string;
  role: 'user' | 'organizer' | 'business' | 'sponsor' | 'cityAdmin' | 'platformAdmin' | 'moderator' | 'admin' | 'superAdmin';
  culturePassId: string;
  isSydneyVerified?: boolean;
  interests?: string[];
  communities?: string[];
  languages?: string[];
  ethnicityText?: string;
  interestCategoryIds?: string[];
  membership?: {
    tier: 'free' | 'plus' | 'elite' | 'pro' | 'premium' | 'vip';
    expiresAt?: string;
    isActive?: boolean;
  };
  socialLinks?: Record<string, string>;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  /** CulturePass handle — canonical identifier shown as +handle */
  handle?: string;
  /** Admin approval gate for handle visibility in public listings */
  handleStatus?: 'pending' | 'approved' | 'rejected';

  // Modern Data Architecture / Analytics Fields
  lastActiveAt?: string;
  authProvider?: string;
  deviceTokens?: string[];
  marketingOptIn?: boolean;
  dataProcessingConsent?: boolean;
  calendarSettings?: {
    autoAddTickets?: boolean;
    showPersonalEvents?: boolean;
    deviceConnected?: boolean;
    lastSyncedAt?: string;
  };
  metadata?: Record<string, any>;

  /** Australian LGA — location attribute (see councils collection). */
  lgaCode?: string;
  /** Firestore councils/{id} when user chose an LGA. */
  councilId?: string;

  /** First CulturePass+ Stripe subscription checkout completed — blocks repeat intro coupon. */
  premiumIntroDiscountUsedAt?: string;
  /** Allows organisers to curate CultureShop Daily Deals when true. */
  approvedMarketplacePublisher?: boolean;

  /** Account moderation — suspended users should be blocked at auth / API layer when enforced */
  status?: 'active' | 'suspended';

  createdAt: string;
  updatedAt: string;
}

const usersCol = () => db.collection('users');

export const usersService = {
  async getById(id: string): Promise<FirestoreUser | null> {
    const snap = await usersCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreUser;
  },

  async getByEmail(email: string): Promise<FirestoreUser | null> {
    const snap = await usersCol().where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreUser;
  },

  async list(limit = 100): Promise<FirestoreUser[]> {
    const snap = await usersCol().limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreUser));
  },

  async update(id: string, data: Partial<FirestoreUser>): Promise<FirestoreUser | null> {
    const ref = usersCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const now = new Date().toISOString();
    await ref.update({ ...data, updatedAt: now });
    
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreUser;
  },

  async getByHandle(handle: string): Promise<FirestoreUser | null> {
    let snap = await usersCol().where('handle', '==', handle.toLowerCase()).limit(1).get();
    if (snap.empty) {
      snap = await usersCol().where('username', '==', handle.toLowerCase()).limit(1).get();
    }
    if (snap.empty) {
      snap = await usersCol().where('username', '==', handle).limit(1).get();
    }
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreUser;
  },

  async upsert(id: string, data: Partial<FirestoreUser>): Promise<FirestoreUser> {
    const ref = usersCol().doc(id);
    const existing = await ref.get();
    const now = new Date().toISOString();

    if (existing.exists) {
      await ref.update({ ...data, updatedAt: now });
    } else {
      await ref.set({ ...data, id, createdAt: now, updatedAt: now });
    }

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreUser;
  },
};
