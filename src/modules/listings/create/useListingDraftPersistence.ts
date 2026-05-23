import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ListingFormState } from './types';

const PREFIX = '@culturepass_listing_draft';

function key(userId?: string | null, entityHint?: string) {
  return `${PREFIX}:${userId ?? 'guest'}:${entityHint ?? 'default'}`;
}

type Options = {
  form: ListingFormState;
  userId?: string | null;
  entityHint: string;
  onHydrateDraft: (draft: Partial<ListingFormState>) => void;
  /** Skip AsyncStorage load on first mount (e.g. editing an existing community from server). */
  skipLocalDraftLoad?: boolean;
  /** Disable AsyncStorage save entirely. */
  disableLocalDraftSave?: boolean;
};

export function useListingDraftPersistence({
  form,
  userId,
  entityHint,
  onHydrateDraft,
  skipLocalDraftLoad = false,
  disableLocalDraftSave = false,
}: Options) {
  const [draftHydrated, setDraftHydrated] = useState(() => skipLocalDraftLoad);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const lastDraftSnapshotRef = useRef('');

  useEffect(() => {
    if (skipLocalDraftLoad) {
      setDraftHydrated(true);
    }
  }, [skipLocalDraftLoad]);

  useEffect(() => {
    if (skipLocalDraftLoad || draftHydrated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(key(userId, entityHint));
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as Partial<ListingFormState>;
          onHydrateDraft(parsed);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setDraftHydrated(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [skipLocalDraftLoad, draftHydrated, userId, entityHint, onHydrateDraft]);

  useEffect(() => {
    if (disableLocalDraftSave || !draftHydrated) return;
    const timer = setTimeout(() => {
      const snapshot = JSON.stringify(form);
      if (snapshot === lastDraftSnapshotRef.current) return;
      lastDraftSnapshotRef.current = snapshot;
      AsyncStorage.setItem(key(userId, entityHint), snapshot).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [form, draftHydrated, userId, entityHint, disableLocalDraftSave]);

  const saveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      await AsyncStorage.setItem(key(userId, entityHint), JSON.stringify(form));
    } finally {
      setIsSavingDraft(false);
    }
  }, [form, userId, entityHint]);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(key(userId, entityHint));
    lastDraftSnapshotRef.current = '';
  }, [userId, entityHint]);

  return { draftHydrated, isSavingDraft, saveDraft, clearDraft };
}
