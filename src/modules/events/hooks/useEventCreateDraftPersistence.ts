import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_STORAGE_PREFIX = '@culturepass_event_draft';

const getDraftStorageKey = (userId?: string | null) => `${DRAFT_STORAGE_PREFIX}:${userId ?? 'guest'}`;

type Options<TForm> = {
  form: TForm;
  userId?: string | null;
  isEditing: boolean;
  onHydrateDraft: (draft: Partial<TForm>) => void;
};

export function useEventCreateDraftPersistence<TForm>({
  form,
  userId,
  isEditing,
  onHydrateDraft,
}: Options<TForm>) {
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const lastDraftSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (isEditing || draftHydrated) return;
    let cancelled = false;
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(getDraftStorageKey(userId));
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as Partial<TForm>;
          onHydrateDraft(parsed);
        }
      } catch {
        // Ignore corrupt/unavailable draft state.
      } finally {
        if (!cancelled) setDraftHydrated(true);
      }
    };
    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, [isEditing, draftHydrated, userId, onHydrateDraft]);

  useEffect(() => {
    if (isEditing || !draftHydrated) return;
    const timer = setTimeout(() => {
      const snapshot = JSON.stringify(form);
      if (snapshot === lastDraftSnapshotRef.current) return;
      lastDraftSnapshotRef.current = snapshot;
      AsyncStorage.setItem(getDraftStorageKey(userId), snapshot).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [form, isEditing, draftHydrated, userId]);

  const saveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      await AsyncStorage.setItem(getDraftStorageKey(userId), JSON.stringify(form));
    } finally {
      setIsSavingDraft(false);
    }
  }, [form, userId]);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(getDraftStorageKey(userId));
  }, [userId]);

  return {
    draftHydrated,
    isSavingDraft,
    saveDraft,
    clearDraft,
  };
}
