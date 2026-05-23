import { useMemo } from 'react';
import { useLayout } from '@/hooks/useLayout';

/** Trailing padding so the next card peeks on horizontal rails */
const RAIL_END_BLEED = 28;

/**
 * Horizontal insets for Discover horizontal rails.
 * Desktop web: `0` — the scroll column is already inset via `contentWidth` centering.
 * Native / mobile web: matches `hPad` (16 / 24 / 32).
 */
export function useDiscoverRailInsets() {
  const { hPad, isDesktop, vPad } = useLayout();

  return useMemo(() => {
    const pad = isDesktop ? 0 : hPad;
    return {
      pad,
      padEnd: pad + RAIL_END_BLEED,
      vPad,
      headerPadStyle: { paddingHorizontal: pad },
      scrollPadStyle: { paddingHorizontal: pad, paddingRight: pad + RAIL_END_BLEED },
    };
  }, [hPad, isDesktop, vPad]);
}
