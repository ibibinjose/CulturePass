import { db } from '../admin';
import type { CultureTodayEntry } from '../../../shared/schema/cultureToday';

const COL = 'cultureTodayEntries';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toDayKey(month: number, day: number): string {
  return `${pad2(month)}-${pad2(day)}`;
}

function parseDoc(id: string, data: FirebaseFirestore.DocumentData): CultureTodayEntry {
  return {
    id,
    dayKey: String(data.dayKey ?? ''),
    month: Number(data.month ?? 0),
    day: Number(data.day ?? 0),
    title: String(data.title ?? ''),
    subtitle: data.subtitle != null ? String(data.subtitle) : undefined,
    body: data.body != null ? String(data.body) : undefined,
    learnMoreUrl: data.learnMoreUrl != null ? String(data.learnMoreUrl) : undefined,
    scopeType: (data.scopeType as CultureTodayEntry['scopeType']) ?? 'global',
    countryCode: data.countryCode != null ? String(data.countryCode) : undefined,
    countryName: data.countryName != null ? String(data.countryName) : undefined,
    stateRegion: data.stateRegion != null ? String(data.stateRegion) : undefined,
    cultureLabel: data.cultureLabel != null ? String(data.cultureLabel) : undefined,
    sortOrder: Number(data.sortOrder ?? 0),
    published: Boolean(data.published),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

export const cultureTodayCalendarService = {
  async getById(id: string): Promise<CultureTodayEntry | null> {
    const snap = await db.collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return parseDoc(snap.id, snap.data() ?? {});
  },

  async listByDayKey(dayKey: string, publishedOnly: boolean): Promise<CultureTodayEntry[]> {
    const snap = await db.collection(COL).where('dayKey', '==', dayKey).limit(200).get();
    let rows = snap.docs.map((d) => parseDoc(d.id, d.data()));
    if (publishedOnly) rows = rows.filter((r) => r.published);
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    return rows;
  },

  async listByMonth(month: number, publishedOnly: boolean): Promise<CultureTodayEntry[]> {
    const snap = await db.collection(COL).where('month', '==', month).limit(500).get();
    let rows = snap.docs.map((d) => parseDoc(d.id, d.data()));
    if (publishedOnly) rows = rows.filter((r) => r.published);
    rows.sort((a, b) => a.day - b.day || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    return rows;
  },

  async listAllForAdmin(): Promise<CultureTodayEntry[]> {
    const snap = await db.collection(COL).limit(2000).get();
    const rows = snap.docs.map((d) => parseDoc(d.id, d.data()));
    rows.sort(
      (a, b) =>
        a.month - b.month || a.day - b.day || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
    );
    return rows;
  },

  async upsert(id: string | undefined, payload: Omit<CultureTodayEntry, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string }): Promise<CultureTodayEntry> {
    const now = new Date().toISOString();
    const ref = id ? db.collection(COL).doc(id) : db.collection(COL).doc();
    const existing = id ? await ref.get() : null;
    const createdAt = existing?.exists ? String((existing.data() as { createdAt?: string })?.createdAt ?? now) : now;
    const raw: Record<string, unknown> = {
      ...payload,
      dayKey: toDayKey(payload.month, payload.day),
      createdAt,
      updatedAt: now,
    };
    const row = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined && v !== null),
    ) as Record<string, unknown>;
    await ref.set(row, { merge: Boolean(id) });
    const out = await ref.get();
    return parseDoc(ref.id, out.data() ?? {});
  },

  async delete(id: string): Promise<void> {
    await db.collection(COL).doc(id).delete();
  },
};
