/**
 * EventCard — feature-flagged dispatcher.
 *
 * Reads `eventcard-v2` via useFlagOverride. Defaults to V1.
 * Flip in dev with the queryClient.setQueryData trick or via server-side flag entry.
 * Once V2 is at 100% rollout, delete EventCardV1.tsx and replace this dispatcher
 * with a direct re-export of EventCardV2.
 */

import React from 'react';
import { useFlagOverride } from '@/lib/feature-flags';
import EventCardV1 from './EventCardV1';
import EventCardV2 from './EventCardV2';

type EventCardProps = React.ComponentProps<typeof EventCardV1>;

export default function EventCard(props: EventCardProps) {
  const { value: v2 } = useFlagOverride('eventcard-v2');
  return v2 ? <EventCardV2 {...props} /> : <EventCardV1 {...props} />;
}
