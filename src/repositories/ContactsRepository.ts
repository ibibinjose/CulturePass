import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedContact {
  cpid: string;
  name: string;
  username?: string;
  tier?: string;
  org?: string;
  avatarUrl?: string;
  city?: string;
  country?: string;
  bio?: string;
  email?: string;
  phone?: string;
  savedAt: string; // ISO string
  userId?: string;
  fromPhone?: boolean;
  pinned?: boolean;
  interests?: string[];
  communities?: string[];
  notes?: string;
  tags?: string[];
  lastTouchedAt?: string;
  stage?: 'new' | 'active' | 'dormant';
}

/** Merge two contacts with the same cpid */
function mergeSavedContacts(a: SavedContact, b: SavedContact): SavedContact {
  const ta = new Date(a.lastTouchedAt ?? a.savedAt).getTime();
  const tb = new Date(b.lastTouchedAt ?? b.savedAt).getTime();

  const newer = ta >= tb ? a : b;
  const older = ta >= tb ? b : a;

  const tags = [...new Set([...(older.tags ?? []), ...(newer.tags ?? [])])];

  const notesA = (older.notes ?? '').trim();
  const notesB = (newer.notes ?? '').trim();
  const notes =
    notesA && notesB && notesA !== notesB
      ? `${notesA}\n\n${notesB}`
      : notesA || notesB || undefined;

  return {
    ...older,
    ...newer,
    savedAt: older.savedAt < newer.savedAt ? older.savedAt : newer.savedAt,
    pinned: !!(older.pinned || newer.pinned),
    tags: tags.length ? tags : undefined,
    notes,
    // Preserve the most recent touch
    lastTouchedAt: newer.lastTouchedAt || older.lastTouchedAt,
  };
}

/** Deduplicate by cpid, keeping the best merged record */
export function dedupeContactsByCpid(contacts: SavedContact[]): SavedContact[] {
  const map = new Map<string, SavedContact>();

  for (const contact of contacts) {
    const cpid = contact.cpid?.trim();
    if (!cpid) continue;

    const existing = map.get(cpid);
    if (existing) {
      map.set(cpid, mergeSavedContacts(existing, contact));
    } else {
      map.set(cpid, { ...contact });
    }
  }

  return Array.from(map.values());
}

// =============================================
// Repository
// =============================================

const INDEX_KEY = '@culturepass_contacts_index';
const CHUNK_PREFIX = '@culturepass_contacts_chunk_';
const CHUNK_SIZE = 100; // Increased — better balance for RN
const INVITED_CONTACTS_KEY = '@culturepass_invited_contacts';
const LEGACY_KEY = '@culturepass_saved_contacts';

export class ContactsRepository {
  private getChunkKey(index: number): string {
    return `${CHUNK_PREFIX}${index}`;
  }

  private async storageMultiGet(keys: string[]): Promise<[string, string | null][]> {
    const maybeMultiGet = (AsyncStorage as unknown as { multiGet?: (input: string[]) => Promise<[string, string | null][]> }).multiGet;
    if (typeof maybeMultiGet === 'function') {
      return maybeMultiGet.call(AsyncStorage, keys);
    }
    const values = await Promise.all(keys.map(async (key) => [key, await AsyncStorage.getItem(key)] as [string, string | null]));
    return values;
  }

  private async storageMultiSet(entries: [string, string][]): Promise<void> {
    const maybeMultiSet = (AsyncStorage as unknown as { multiSet?: (input: [string, string][]) => Promise<void> }).multiSet;
    if (typeof maybeMultiSet === 'function') {
      await maybeMultiSet.call(AsyncStorage, entries);
      return;
    }
    await Promise.all(entries.map(([key, value]) => AsyncStorage.setItem(key, value)));
  }

  private async storageMultiRemove(keys: string[]): Promise<void> {
    const maybeMultiRemove = (AsyncStorage as unknown as { multiRemove?: (input: string[]) => Promise<void> }).multiRemove;
    if (typeof maybeMultiRemove === 'function') {
      await maybeMultiRemove.call(AsyncStorage, keys);
      return;
    }
    await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
  }

  async getAllContacts(): Promise<SavedContact[]> {
    try {
      // Migrate legacy if exists
      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as SavedContact[];
        await this.saveAllContacts(parsed); // migrate + dedupe
        await AsyncStorage.removeItem(LEGACY_KEY);
        return dedupeContactsByCpid(parsed);
      }

      const indexStr = await AsyncStorage.getItem(INDEX_KEY);
      if (!indexStr) return [];

      const numChunks = parseInt(indexStr, 10);
      if (isNaN(numChunks) || numChunks <= 0) return [];

      const keys = Array.from({ length: numChunks }, (_, i) => this.getChunkKey(i));

      const values = await this.storageMultiGet(keys);
      let contacts: SavedContact[] = [];

      for (const [, value] of values) {
        if (value) {
          try {
            contacts = contacts.concat(JSON.parse(value));
          } catch (e) {
            console.warn('Failed to parse contact chunk:', e);
          }
        }
      }

      return dedupeContactsByCpid(contacts); // Always dedupe on read
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return [];
    }
  }

  async saveAllContacts(contacts: SavedContact[]): Promise<void> {
    if (!contacts.length) {
      await this.clearAllContacts();
      return;
    }

    try {
      const deduped = dedupeContactsByCpid(contacts);

      const chunks: SavedContact[][] = [];
      for (let i = 0; i < deduped.length; i += CHUNK_SIZE) {
        chunks.push(deduped.slice(i, i + CHUNK_SIZE));
      }

      const saveOperations: [string, string][] = chunks.map((chunk, i) => [
        this.getChunkKey(i),
        JSON.stringify(chunk),
      ]);

      // Update index
      saveOperations.push([INDEX_KEY, chunks.length.toString()]);

      // Cleanup old chunks if list shrank
      const oldIndexStr = await AsyncStorage.getItem(INDEX_KEY);
      const oldNum = oldIndexStr ? parseInt(oldIndexStr, 10) : 0;

      if (oldNum > chunks.length) {
        const keysToDelete = Array.from(
          { length: oldNum - chunks.length },
          (_, i) => this.getChunkKey(chunks.length + i)
        );
        await this.storageMultiRemove(keysToDelete);
      }

      await this.storageMultiSet(saveOperations);
    } catch (error) {
      console.error('Failed to save contacts:', error);
      throw error; // Let caller decide whether to retry
    }
  }

  async clearAllContacts(): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(INDEX_KEY);
      const numChunks = indexStr ? parseInt(indexStr, 10) : 0;

      const keysToRemove = [INDEX_KEY, LEGACY_KEY];

      for (let i = 0; i < numChunks; i++) {
        keysToRemove.push(this.getChunkKey(i));
      }

      await this.storageMultiRemove(keysToRemove);
    } catch (error) {
      console.error('Failed to clear contacts:', error);
    }
  }

  // ==================== Invited Contacts ====================

  async getInvitedIds(): Promise<Set<string>> {
    try {
      const stored = await AsyncStorage.getItem(INVITED_CONTACTS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  async addInvitedId(id: string): Promise<Set<string>> {
    try {
      const set = await this.getInvitedIds();
      set.add(id);
      await AsyncStorage.setItem(INVITED_CONTACTS_KEY, JSON.stringify(Array.from(set)));
      return set;
    } catch {
      const fallback = new Set([id]);
      await AsyncStorage.setItem(INVITED_CONTACTS_KEY, JSON.stringify([id]));
      return fallback;
    }
  }

  async removeInvitedId(id: string): Promise<Set<string>> {
    try {
      const set = await this.getInvitedIds();
      set.delete(id);
      await AsyncStorage.setItem(INVITED_CONTACTS_KEY, JSON.stringify(Array.from(set)));
      return set;
    } catch {
      return new Set();
    }
  }
}

export const contactsRepository = new ContactsRepository();