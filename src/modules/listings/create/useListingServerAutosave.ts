import { useEffect, useRef } from 'react';
import { modulesApi } from '@/modules/api';
import type { ListingFormState } from './types';
import { formToProfilePayload } from './payload';

/**
 * Debounced Firestore sync via PUT api/profiles/:id after a directory draft exists.
 */
export function useListingServerAutosave(form: ListingFormState, enabled: boolean) {
  const lastSent = useRef<string>('');

  useEffect(() => {
    if (!enabled || !form.draftProfileId || form.entityType === 'community') return;
    const id = form.draftProfileId;
    const timer = setTimeout(() => {
      const snapshot = JSON.stringify(form);
      if (snapshot === lastSent.current) return;
      lastSent.current = snapshot;
      const payload = formToProfilePayload(form, 'draft');
      void modulesApi.profiles.update(id, payload as Record<string, unknown>).catch(() => {
        lastSent.current = '';
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [form, enabled]);
}
