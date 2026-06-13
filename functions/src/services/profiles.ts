import { db } from '../admin';

export interface FirestoreProfile {
  id: string;
  name: string;
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organisation' | 'council' | 'government' | 'charity';
  /** Short tagline / card subtitle */
  title?: string;
  description?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  gallery?: string[];
  avatarUrl?: string;
  bio?: string;
  address?: string;
  councilId?: string;
  lgaCode?: string;
  city?: string;
  state?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country?: string;
  category?: string;
  tags?: string[];
  // Cultural identity (typed IDs; shared schema)
  nationalityId?: string;
  cultureIds?: string[];
  languageIds?: string[];
  diasporaGroupIds?: string[];
  isVerified?: boolean;
  memberCount?: number;
  followerCount?: number;
  ownerId?: string;
  socialLinks?: Record<string, string>;
  contactEmail?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  spotify?: string;
  /** AirPal / similar profile link */
  airpal?: string;
  twitter?: string;
  telegram?: string;
  cultureTags?: string[];
  languages?: string[];
  indigenousTags?: string[];
  countryOfOrigin?: string;
  isIndigenous?: boolean;
  joinMode?: 'open' | 'request' | 'invite';
  status?: 'draft' | 'published' | 'suspended';
  handle?: string;
  handleStatus?: 'pending' | 'approved' | 'rejected';
  viewCount?: number;
  metadata?: Record<string, any>;
  /** Unified listing wizard extended fields */
  listingProfile?: Record<string, unknown>;
  /** Stripe Connect Express account (Phase 4 marketplace) */
  stripeConnectAccountId?: string;
  stripeConnectOnboardingStatus?: 'not_started' | 'pending' | 'restricted' | 'complete';
  payoutsEnabled?: boolean;
  // ── Registry fields ──────────────────────────────────────────────────────
  /** Links this business/venue/brand to a parent community */
  communityId?: string;
  foundedDate?: string;
  foundedLocation?: string;
  foundingStory?: string;
  legalStatus?: string;
  registrationNumber?: string;
  governingStructure?: string;
  leadership?: {
    id: string;
    name: string;
    roleTitle: string;
    userId?: string;
    avatarUrl?: string;
    email?: string;
    isCurrent?: boolean;
    startDate?: string;
  }[];
  partners?: {
    id: string;
    name: string;
    partnerType: 'partner' | 'supporter' | 'sponsor' | 'funder';
    logoUrl?: string;
    website?: string;
    description?: string;
  }[];
  /** Source host page when synced from Page Pro Wizard */
  hostPageId?: string;
  activityLevel?: 'new' | 'steady' | 'active' | 'thriving';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const profilesCol = () => db.collection('profiles');

/** Normalise @handle / casing variants for Firestore equality queries. */
export function communityHandleLookupCandidates(param: string): string[] {
  let s = String(param ?? '').trim();
  if (!s) return [];
  if (s.startsWith('@')) s = s.slice(1).trim();
  if (!s) return [];
  const lower = s.toLowerCase();
  return [...new Set([s, lower])];
}

export function isPublicCommunityHub(profile: FirestoreProfile): boolean {
  if (profile.entityType === 'community' && profile.status !== 'suspended') return true;
  if (
    profile.entityType === 'organisation' &&
    profile.handleStatus === 'approved' &&
    profile.status === 'published'
  ) {
    return true;
  }
  return false;
}

export const profilesService = {
  async getById(id: string): Promise<FirestoreProfile | null> {
    const snap = await profilesCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreProfile;
  },

  /**
   * Resolve a community hub by Firestore document id or public handle (slug).
   * Matches directory visibility: communities (non-suspended) + approved published organisations.
   */
  async getPublicCommunityHubByIdOrHandle(param: string): Promise<FirestoreProfile | null> {
    const trimmed = String(param ?? '').trim();
    if (!trimmed) return null;

    const byId = await this.getById(trimmed);
    if (byId && isPublicCommunityHub(byId)) return byId;

    return this.findPublicCommunityHubByHandleParam(trimmed);
  },

  async findPublicCommunityHubByHandleParam(param: string): Promise<FirestoreProfile | null> {
    const candidates = communityHandleLookupCandidates(param);
    if (candidates.length === 0) return null;

    const collected = new Map<string, FirestoreProfile>();
    for (const c of candidates) {
      const snap = await profilesCol().where('handle', '==', c).limit(25).get();
      for (const doc of snap.docs) {
        const row = { id: doc.id, ...doc.data() } as FirestoreProfile;
        collected.set(row.id, row);
      }
    }

    const rows = [...collected.values()].filter(isPublicCommunityHub);
    if (rows.length === 0) return null;

    rows.sort((a, b) => {
      const score = (p: FirestoreProfile) => {
        let s = 0;
        if (p.entityType === 'community') s += 2;
        const hNorm = (p.handle ?? '').trim().toLowerCase();
        if (hNorm && candidates.some((c) => c.toLowerCase() === hNorm)) s += 1;
        return s;
      };
      return score(b) - score(a);
    });

    return rows[0] ?? null;
  },

  async list(
    filters: { city?: string; country?: string; entityType?: string; ownerId?: string } = {},
  ): Promise<FirestoreProfile[]> {
    let query: FirebaseFirestore.Query = profilesCol();

    if (filters.ownerId) {
      query = query.where('ownerId', '==', filters.ownerId);
      const snap = await query.limit(100).get();
      let rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreProfile[];
      if (filters.entityType) {
        rows = rows.filter((p) => p.entityType === filters.entityType);
      }
      if (filters.city) rows = rows.filter((p) => p.city === filters.city);
      if (filters.country) rows = rows.filter((p) => p.country === filters.country);
      return rows;
    }

    if (filters.entityType) query = query.where('entityType', '==', filters.entityType);
    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.country) query = query.where('country', '==', filters.country);

    const snap = await query.limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreProfile[];
  },

  async create(data: Omit<FirestoreProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreProfile> {
    const now = new Date().toISOString();
    const ref = profilesCol().doc();
    const profile: FirestoreProfile = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(profile);
    return profile;
  },

  async update(id: string, data: Partial<FirestoreProfile>): Promise<FirestoreProfile | null> {
    const ref = profilesCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    
    const updates = { ...data, updatedAt: new Date().toISOString() };
    await ref.update(updates);
    
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreProfile;
  },

  async delete(id: string): Promise<void> {
    await profilesCol().doc(id).delete();
  },
};
