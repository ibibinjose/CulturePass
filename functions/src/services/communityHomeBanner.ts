import { db } from '../admin';
import { nowIso } from '../handlers/utils';

const COLLECTION = 'communityHomeBanners';

export interface CommunityHomeBannerRecord {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaRoute: string;
  imageUrl?: string;
  revision: number;
  isActive: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

const DEFAULT_BANNER: CommunityHomeBannerRecord = {
  id: 'default',
  title: 'Your community needs a home',
  subtitle: 'A gathering place for culture and connection—not just another feed.',
  ctaLabel: 'Explore',
  ctaRoute: '/(tabs)/community',
  revision: 1,
  isActive: true,
  publishedAt: nowIso(),
  createdAt: nowIso(),
  updatedAt: nowIso(),
};

function mapDoc(id: string, data: FirebaseFirestore.DocumentData): CommunityHomeBannerRecord {
  return {
    id,
    title: String(data.title ?? ''),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    ctaLabel: String(data.ctaLabel ?? 'Explore'),
    ctaRoute: String(data.ctaRoute ?? '/(tabs)/community'),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    revision: Number(data.revision ?? 1),
    isActive: Boolean(data.isActive),
    publishedAt: data.publishedAt ? String(data.publishedAt) : undefined,
    createdAt: String(data.createdAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

function pickActiveBanner(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
): CommunityHomeBannerRecord | null {
  if (docs.length === 0) return null;
  const mapped = docs.map((d) => mapDoc(d.id, d.data()));
  mapped.sort((a, b) => {
    const pub = (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
    if (pub !== 0) return pub;
    return b.revision - a.revision;
  });
  return mapped[0] ?? null;
}

export async function getActiveCommunityHomeBanner(): Promise<CommunityHomeBannerRecord> {
  const snap = await db.collection(COLLECTION).where('isActive', '==', true).limit(8).get();
  const active = pickActiveBanner(snap.docs);
  if (active) return active;
  return { ...DEFAULT_BANNER, updatedAt: nowIso() };
}

export async function listCommunityHomeBanners(): Promise<CommunityHomeBannerRecord[]> {
  const snap = await db.collection(COLLECTION).orderBy('updatedAt', 'desc').limit(50).get();
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function createCommunityHomeBanner(
  input: {
    title: string;
    subtitle?: string;
    ctaLabel: string;
    ctaRoute: string;
    imageUrl?: string;
  },
  userId: string,
): Promise<CommunityHomeBannerRecord> {
  const ts = nowIso();
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    ctaLabel: input.ctaLabel.trim() || 'Explore',
    ctaRoute: input.ctaRoute.trim() || '/(tabs)/community',
    imageUrl: input.imageUrl?.trim() || null,
    revision: 1,
    isActive: false,
    publishedAt: null,
    createdAt: ts,
    updatedAt: ts,
    createdBy: userId,
    updatedBy: userId,
  };
  await ref.set(payload);
  return mapDoc(ref.id, payload);
}

export async function updateCommunityHomeBanner(
  id: string,
  input: Partial<{
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaRoute: string;
    imageUrl: string;
  }>,
  userId: string,
): Promise<CommunityHomeBannerRecord> {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error('Banner not found');

  const patch: Record<string, unknown> = { updatedAt: nowIso(), updatedBy: userId };
  if (typeof input.title === 'string') patch.title = input.title.trim();
  if (typeof input.subtitle === 'string') patch.subtitle = input.subtitle.trim() || null;
  if (typeof input.ctaLabel === 'string') patch.ctaLabel = input.ctaLabel.trim();
  if (typeof input.ctaRoute === 'string') patch.ctaRoute = input.ctaRoute.trim();
  if (typeof input.imageUrl === 'string') patch.imageUrl = input.imageUrl.trim() || null;

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return mapDoc(updated.id, updated.data() ?? {});
}

async function deactivateAllBanners(exceptId?: string): Promise<void> {
  const snap = await db.collection(COLLECTION).where('isActive', '==', true).get();
  const batch = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    if (exceptId && doc.id === exceptId) continue;
    batch.update(doc.ref, { isActive: false, updatedAt: nowIso() });
    count += 1;
  }
  if (count > 0) await batch.commit();
}

export async function publishCommunityHomeBanner(
  id: string,
  userId: string,
): Promise<CommunityHomeBannerRecord> {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error('Banner not found');

  await deactivateAllBanners(id);
  const ts = nowIso();
  const currentRevision = Number(existing.data()?.revision ?? 0);
  await ref.set(
    {
      isActive: true,
      revision: currentRevision + 1,
      publishedAt: ts,
      updatedAt: ts,
      updatedBy: userId,
    },
    { merge: true },
  );
  const updated = await ref.get();
  return mapDoc(updated.id, updated.data() ?? {});
}

/** Re-show banner to users who dismissed an earlier revision (active banner only). */
export async function triggerCommunityHomeBanner(
  id: string,
  userId: string,
): Promise<CommunityHomeBannerRecord> {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error('Banner not found');

  const data = existing.data() ?? {};
  const ts = nowIso();
  const nextRevision = Number(data.revision ?? 0) + 1;

  if (!data.isActive) {
    await deactivateAllBanners(id);
  }

  await ref.set(
    {
      isActive: true,
      revision: nextRevision,
      publishedAt: data.publishedAt ?? ts,
      updatedAt: ts,
      updatedBy: userId,
    },
    { merge: true },
  );

  const updated = await ref.get();
  return mapDoc(updated.id, updated.data() ?? {});
}

export async function deleteCommunityHomeBanner(id: string): Promise<void> {
  if (id === 'default') throw new Error('Cannot delete default banner');
  await db.collection(COLLECTION).doc(id).delete();
}
