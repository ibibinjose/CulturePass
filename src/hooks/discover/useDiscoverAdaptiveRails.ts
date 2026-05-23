import { useMemo } from 'react';
import type { AdaptiveCultureRail, Community, CultureCardModel, EventData, RestaurantData } from '@/shared/schema';
import { formatEventDateTimeBadge } from '@/lib/dateUtils';
import { getCommunityProfilePathId } from '@/lib/community';

function isWeekendDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isTonightEvent(event: EventData): boolean {
  const date = new Date(event.date);
  const now = new Date();
  if (date.toDateString() !== now.toDateString()) return false;
  if (!event.time) return true;
  const [hours] = event.time.split(':').map(Number);
  return Number.isFinite(hours) && hours >= 17;
}

function eventLooksFamilyFriendly(event: EventData): boolean {
  const haystack = [
    event.title,
    event.description,
    event.category,
    ...(event.tags ?? []),
    ...(event.cultureTag ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /family|kids|child|all ages|community day|workshop|festival/.test(haystack);
}

function eventIsPremium(event: EventData): boolean {
  if (typeof event.priceCents === 'number') return event.priceCents >= 5000;
  const numeric = Number.parseFloat((event.priceLabel ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) && numeric >= 50;
}

type UseDiscoverAdaptiveRailsParams = {
  allEvents: EventData[];
  restaurantsRaw: RestaurantData[];
  allCommunities: Community[];
};

export function useDiscoverAdaptiveRails({
  allEvents,
  restaurantsRaw,
  allCommunities,
}: UseDiscoverAdaptiveRailsParams) {
  const unifiedCultureCards = useMemo((): CultureCardModel[] => {
    const eventCards: CultureCardModel[] = allEvents.slice(0, 12).map((event) => ({
      id: `event-${event.id}`,
      entityType: 'event',
      title: event.title,
      subtitle: event.venue ?? event.city,
      imageUrl: event.imageUrl,
      meta: formatEventDateTimeBadge(event.date, event.time),
      trust: {
        isVerified: (event.organizerReputationScore ?? 0) >= 80,
        socialProof:
          typeof event.attending === 'number' && event.attending > 0
            ? `${event.attending} attending`
            : undefined,
        qualityRank: Math.min(100, Math.max(1, (event.attending ?? 0) + (event.isFeatured ? 25 : 0))),
      },
      primaryAction: {
        kind: 'book',
        label: event.entryType === 'free_open' || event.priceLabel?.toLowerCase() === 'free' ? 'Join Free' : 'Get Ticket',
        route: `/event/${event.id}`,
      },
    }));

    const businessCards: CultureCardModel[] = restaurantsRaw.slice(0, 6).map((biz) => ({
      id: `business-${biz.id}`,
      entityType: 'business',
      title: biz.name,
      subtitle: `${biz.cuisine} · ${biz.priceRange}`,
      imageUrl: biz.imageUrl,
      meta: biz.city,
      trust: {
        isVerified: biz.rating >= 4.6,
        socialProof:
          typeof biz.reviewsCount === 'number' && biz.reviewsCount > 0
            ? `${biz.reviewsCount} reviews`
            : undefined,
        qualityRank: Math.round((biz.rating ?? 0) * 20),
      },
      primaryAction: {
        kind: 'directions',
        label: 'Directions',
        route: `/r/${biz.id}`,
      },
    }));

    const communityCards: CultureCardModel[] = allCommunities.slice(0, 8).map((community) => {
      const members = typeof community.membersCount === 'number' ? community.membersCount : community.memberCount;
      const upcoming = community.communityHealth?.upcomingEventsCount;
      return {
        id: `community-${community.id}`,
        entityType: 'community',
        title: community.name,
        subtitle: community.headline ?? community.city,
        imageUrl: community.imageUrl,
        meta: community.city,
        trust: {
          isVerified: Boolean(community.isVerified),
          socialProof:
            typeof members === 'number' && members > 0 ? `${members} members` : undefined,
          qualityRank: Math.min(100, Math.max(1, (upcoming ?? 0) * 10 + (community.isVerified ? 20 : 0))),
        },
        primaryAction: {
          kind: 'message',
          label: 'Join Community',
          route: `/c/${getCommunityProfilePathId(community)}`,
        },
      };
    });

    const seen = new Set<string>();
    return [...eventCards, ...businessCards, ...communityCards].filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    });
  }, [allEvents, restaurantsRaw, allCommunities]);

  const adaptiveCultureRails = useMemo((): AdaptiveCultureRail[] => {
    const eventCards = allEvents.map((event) => ({
      card: unifiedCultureCards.find((item) => item.id === `event-${event.id}`),
      event,
    }));

    const tonight = eventCards
      .filter(({ event, card }) => card && isTonightEvent(event))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const weekend = eventCards
      .filter(({ event, card }) => card && isWeekendDate(event.date))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const family = eventCards
      .filter(({ event, card }) => card && eventLooksFamilyFriendly(event))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const free = eventCards
      .filter(({ event, card }) => card && (event.entryType === 'free_open' || event.priceLabel?.toLowerCase() === 'free'))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const premium = eventCards
      .filter(({ event, card }) => card && eventIsPremium(event))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);

    const rails: AdaptiveCultureRail[] = [
      { id: 'tonight', title: 'Tonight', subtitle: 'Right now and later this evening', items: tonight },
      { id: 'weekend', title: 'This Weekend', subtitle: 'Plan your cultural weekend', items: weekend },
      { id: 'family', title: 'Family-friendly', subtitle: 'Designed for all ages', items: family },
      { id: 'free', title: 'Free', subtitle: 'No-cost culture nearby', items: free },
      { id: 'premium', title: 'Premium', subtitle: 'High-demand signature experiences', items: premium },
    ];
    return rails.filter((rail) => rail.items.length > 0);
  }, [allEvents, unifiedCultureCards]);

  return {
    unifiedCultureCards,
    adaptiveCultureRails,
  };
}

