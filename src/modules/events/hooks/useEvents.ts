import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { eventsApi } from '@/modules/events/api';
import type { EventListParams } from '@/modules/events/api';
import type { EventData, PaginatedEventsResponse } from '@/shared/schema';
import { eventKeys } from './keys';

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * Paginated event list. Supports filters from EventListParams.
 * Used by: explore.tsx, events.tsx, calendar.tsx.
 */
export function useEventsList(params: EventListParams = {}) {
  return useQuery<PaginatedEventsResponse>({
    queryKey: eventKeys.list(params as Record<string, unknown>),
    queryFn: () => eventsApi.events.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Infinite-scroll variant. Used by feeds and discover rails where
 * the user loads more as they scroll.
 */
export function useEventsInfinite(params: Omit<EventListParams, 'page'> = {}) {
  return useInfiniteQuery<PaginatedEventsResponse>({
    queryKey: eventKeys.list({ ...params, _infinite: true }),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      eventsApi.events.list({ ...params, page: pageParam as number, pageSize: 10 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

/** @deprecated Use useEventsInfinite. Kept for backward compatibility. */
export const useEvents = (city: string, filters: string[] = []) =>
  useEventsInfinite({
    city,
    category: filters.length > 0 ? filters[0].toLowerCase() : undefined,
  });

// ─── Detail ───────────────────────────────────────────────────────────────────

export function useEvent(id: string) {
  return useQuery<EventData>({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.events.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Nearby ───────────────────────────────────────────────────────────────────

export function useNearbyEvents(params: {
  lat: number;
  lng: number;
  radius?: number;
  pageSize?: number;
}) {
  const locationAvailable = Number.isFinite(params.lat) && Number.isFinite(params.lng);
  return useQuery({
    queryKey: eventKeys.nearby(params as Record<string, unknown>),
    queryFn: () => eventsApi.events.nearby(params),
    enabled: locationAvailable,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────

export function useMyRsvp(eventId: string) {
  return useQuery({
    queryKey: eventKeys.myRsvp(eventId),
    queryFn: () => eventsApi.events.myRsvp(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRsvpEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      status,
    }: {
      eventId: string;
      status: 'going' | 'maybe' | 'not_going';
    }) => eventsApi.events.rsvp(eventId, status),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.myRsvp(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EventData>) => eventsApi.events.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventData> }) =>
      eventsApi.events.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.events.publish(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

// ─── Optimistic Attend Toggle ─────────────────────────────────────────────────

/**
 * Optimistically updates the attending count on a cached event list page
 * while the real mutation (save/RSVP) fires in the background.
 *
 * Usage:
 *   const toggleAttend = useOptimisticAttend();
 *   toggleAttend({ eventId, listParams, increment: true });
 */
export function useOptimisticAttend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: { eventId: string; listParams: EventListParams; increment: boolean }) =>
      Promise.resolve(),
    onMutate: async ({ eventId, listParams, increment }) => {
      const key = eventKeys.list(listParams as Record<string, unknown>);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old: PaginatedEventsResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          events: old.events.map((e: EventData) =>
            e.id === eventId
              ? { ...e, attending: Math.max(0, (e.attending ?? 0) + (increment ? 1 : -1)) }
              : e,
          ),
        };
      });

      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
  });
}

/** @deprecated Use useOptimisticAttend instead. */
export const useEventOptimisticLike = () => {
  const queryClient = useQueryClient();
  return async (eventId: string, city: string, filters: string[], isLiked: boolean) => {
    const key = eventKeys.list({ city, category: filters[0] ?? undefined } as Record<string, unknown>);
    await queryClient.cancelQueries({ queryKey: key });
    const previousEvents = queryClient.getQueryData(key);
    queryClient.setQueryData(key, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages?.map((page: any) => ({
          ...page,
          events: page.events.map((e: EventData) =>
            e.id === eventId
              ? { ...e, attending: Math.max(0, (e.attending ?? 0) + (isLiked ? 1 : -1)) }
              : e,
          ),
        })),
        events: old.events?.map((e: EventData) =>
          e.id === eventId
            ? { ...e, attending: Math.max(0, (e.attending ?? 0) + (isLiked ? 1 : -1)) }
            : e,
        ),
      };
    });
    return { previousEvents };
  };
};
