/**
 * EventCard — premium dispatcher (Luxe Heritage 2026 rebuild).
 *
 * Defaults to LuxeEventCard for best-in-class visual quality, cultural warmth, and smooth interactions.
 * Falls back to V2 (flag) or V1 for compatibility during transition.
 * Use feature flag 'eventcard-v2' or 'eventcard-luxe' to A/B in dev.
 */

import React from 'react';
import { useFlagOverride } from '@/lib/feature-flags';
import EventCardV1 from './EventCardV1';
import EventCardV2 from './EventCardV2';
import { LuxeEventCard } from './LuxeEventCard';

type EventCardProps = React.ComponentProps<typeof EventCardV1> & { event: any };

export default function EventCard(props: EventCardProps) {
  const { value: v2 } = useFlagOverride('eventcard-v2');
  const { value: luxe } = useFlagOverride('eventcard-luxe');
  if (luxe) {
    return <LuxeEventCard event={props.event} />;
  }
  // Rebuild default: V2 (polished Mode-C with full props/layout support) for best balance of features + visuals
  // V1 legacy; Luxe for pure luxe heritage (may simplify some rail props)
  return v2 || true ? <EventCardV2 {...props} /> : <EventCardV1 {...props} />;
}
