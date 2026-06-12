/**
 * @deprecated Use HostspaceStickyBar from @/components/hostspace/HostspaceStickyBar.
 * Kept for lazy-loaded workspace imports during the Phase 2 migration.
 */
import React from 'react';

import { HostspaceStickyBar } from '@/components/hostspace/HostspaceStickyBar';
import { useLayout } from '@/hooks/useLayout';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';

export function HostspaceCreateTopChrome({
  liveListingCount,
  listingCountLoading,
}: {
  liveListingCount: number;
  listingCountLoading: boolean;
}) {
  const insets = useSafeAreaInsetsWeb();
  const { hPad } = useLayout();

  return (
    <HostspaceStickyBar
      mode="create"
      topInset={insets.top}
      hPad={hPad}
      liveListingCount={liveListingCount}
      listingCountLoading={listingCountLoading}
    />
  );
}