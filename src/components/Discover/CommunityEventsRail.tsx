/**
 * CommunityEventsRail — shows upcoming events from the user's joined communities
 * within a 7-day window, sorted by soonest start date, capped at 10.
 *
 * Positioned on Discover below the Continue Browsing rail and above the general
 * event rails. Hidden when the user has no joined communities or no matching events.
 *
 * Requirements: 1.2
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { EventRail } from './EventRail';
import { flowKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { useSaved } from '@/contexts/SavedContext';
import type { EventData } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Pure filter function — exported for property-based testing
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Filters and sorts a list of events to show only those belonging to joined
 * communities that start within 7 days of `now`.
 *
 * @param joinedCommunityIds - IDs of communities the user has joined
 * @param events - All candidate events
 * @param now - Reference time (use new Date() in production; injectable for testing)
 * @param maxItems - Cap on returned items (default 10)
 * @returns Events sorted by date ascending, limited to maxItems
 */
export function getCommunityEventsRail(
  joinedCommunityIds: string[],
  events: EventData[],
  now: Date,
  maxItems = 10,
): EventData[] {
  if (joinedCommunityIds.length === 0) return [];

  const joinedSet = new Set(joinedCommunityIds);
  const windowEnd = now.getTime() + SEVEN_DAYS_MS;

  return events
    .filter((event) => {
      if (!event.communityId || !joinedSet.has(event.communityId)) return false;
      const eventTime = new Date(event.date).getTime();
      return eventTime >= now.getTime() && eventTime <= windowEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxItems);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommunityEventsRailProps {
  onSeeAll?: () => void;
}

export default function CommunityEventsRail({ onSeeAll }: CommunityEventsRailProps) {
  const { joinedCommunities } = useSaved();

  const { data, isLoading, error, refetch } = useQuery<EventData[]>({
    queryKey: flowKeys.communityEvents(joinedCommunities.join(',')),
    queryFn: async () => {
      const response = await api.discoverFlow.communityEvents();
      return response.events ?? [];
    },
    enabled: joinedCommunities.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const items = data
    ? getCommunityEventsRail(joinedCommunities, data, new Date())
    : [];

  // Render skeletons while loading (show skeleton IDs so EventRail displays placeholders)
  const railData: (EventData | string)[] = isLoading
    ? ['skeleton-1', 'skeleton-2', 'skeleton-3']
    : items;

  if (!isLoading && items.length === 0 && !error) return null;

  return (
    <EventRail
      title="From Your Communities"
      data={railData}
      isLoading={isLoading}
      onSeeAll={onSeeAll}
      errorMessage={error ? 'Could not load community events.' : null}
      onRetry={refetch}
    />
  );
}
