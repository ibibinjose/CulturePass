import React, { useMemo } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';

import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { M3SectionHeader } from '@/design-system/ui';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import type { EventData, ActivityData } from '@/shared/schema';

 

 
import { createLazyComponent } from '@/lib/lazy';

import ContinueBrowsingRail from '@/components/Discover/ContinueBrowsingRail';
import CommunityEventsRail from '@/components/Discover/CommunityEventsRail';
import UpcomingTicketCard from '@/components/Discover/UpcomingTicketCard';
import OnboardingBanner from '@/components/Discover/OnboardingBanner';

import {
  DiscoverCultureTodayCard,
  SuperAppLinks,
  HeroCarousel,
  EventRail,
  M3EventRail,
  CultureCardRail,
  IndigenousSpotlight,
  CategoryRail,
  PreviewRail,
  CultureHubRail,
  InlineSearchResults,
  DiscoverShopRail,
  ActivityRail,
} from './index';

import { useDiscoverData } from '../hooks/useDiscoverData';
import { useKeralaScoping } from '../hooks/useKeralaScoping';
import { communityScopeSubtitle, scopeSubtitle } from '@/lib/locationFallback';
 

import type { DiscoverFilter } from '@/components/Discover/DiscoverFilterModal';

const CityRail = createLazyComponent(() => import('@/components/Discover/CityRail'));
const LazyCommunityRail = createLazyComponent(() => import('@/components/Discover/CommunityRail'));

interface DiscoverContentProps {
  activeFilter: DiscoverFilter;
  searchQuery: string;
  onboardingState: { city?: string; country?: string; cultureIds?: string[] };
  d: ReturnType<typeof useDiscoverData>;
  s: ReturnType<typeof useKeralaScoping>;
  recommendedFromFeature: EventData[];
  keralaDomain: boolean;
  /** Steps the user skipped during onboarding (for the banner). */
  skippedOnboardingSteps?: ('cultures' | 'location' | 'communities')[];
}

export function DiscoverContent({
  activeFilter,
  searchQuery,
  onboardingState,
  d,
  s,
  recommendedFromFeature,
  keralaDomain,
  skippedOnboardingSteps = [],
}: DiscoverContentProps) {
  const { hPad, isExpanded, contentWidth, isDesktop } = useLayout();
  const colors = useM3Colors();

  // Real fitness / classes activities from the dedicated Activities collection (preferred source)
  const fitnessActivities = useMemo(() => {
    const raw = (d as any).allActivities ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return [] as ActivityData[];

    const fitnessKeywords = [
      'wellness', 'yoga', 'fitness', 'dance', 'pilates', 'meditation', 'gym',
      'sports', 'training', 'workout', 'zumba', 'boxing', 'martial', 'class',
      'tango', 'aerobics', 'tai chi',
    ];

    const filtered = raw.filter((a: ActivityData) => {
      if (!a || a.status === 'draft' || a.status === 'archived') return false;
      const hay = [
        a.category,
        a.name,
        a.description,
        a.primaryCulture,
        ...(a.highlights ?? []),
        a.instructorName,
        a.difficulty,
      ].filter(Boolean).join(' ').toLowerCase();
      return fitnessKeywords.some((kw) => hay.includes(kw));
    });

    // Dedupe + limit for rail
    const seen = new Set<string>();
    const out: ActivityData[] = [];
    for (const a of filtered) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      out.push(a);
      if (out.length >= 12) break;
    }
    return out;
  }, [d]);

  // Legacy event-based fallback (kept only for CultureWheel modal + transitional empty states)
  const classEvents = useMemo(() => {
    const combined = [...s.nearby, ...s.popular, ...s.soon, ...s.forYou];
    const seen = new Set<string>();
    const out: EventData[] = [];
    for (const item of combined) {
      if (typeof item === 'string') continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (isClassEvent(item)) {
        out.push(item);
      }
    }
    return out;
  }, [s.nearby, s.popular, s.soon, s.forYou]);

  // Match the page-level side padding used on web desktop (modest gutter next to sticky sidebar)
  const sidePad = isDesktop && Platform.OS === 'web' ? 16 : hPad;

  const show = (sections: DiscoverFilter[]) => {
    return activeFilter === 'all' || sections.includes(activeFilter);
  };

  const goEvents = () => router.push('/events');
  const goCommunities = () => router.push('/(tabs)/community');

  const userCity = d.effectiveCity || onboardingState.city || '';
  const userCountry = d.effectiveCountry || onboardingState.country || 'Australia';

  const nearbyRailResolved = s.nearby.filter((i) => typeof i !== 'string') as EventData[];
  const showNearbyRail = d.nearbyLoading || nearbyRailResolved.length > 0 || !!d.nearbyRailError;
  const nearbySubtitle =
    scopeSubtitle(d.nearbyScope, userCity, userCountry) ??
    (d.location?.isGps ? `Upcoming near ${d.locationDisplayLabel}` : 'Trending in your area');

  const popularRailResolved = s.popular.filter((i) => typeof i !== 'string') as EventData[];
  const showPopularRail = d.eventsLoading || popularRailResolved.length > 0 || !!d.eventsRailError;

  const communitiesSubtitle =
    communityScopeSubtitle(d.communitiesScope, userCity, userCountry) ??
    (keralaDomain ? 'Malayalee groups & cultural circles' : 'Connect with your culture');

  if (activeFilter === 'search') {
    return (
      <InlineSearchResults
        query={searchQuery}
        city={onboardingState.city || ''}
        country={onboardingState.country || ''}
      />
    );
  }

  return (
    <>
      {/* Upcoming ticket cards — events within 24h (Req 4.3) */}
      {show(['all', 'events']) && <UpcomingTicketCard />}

      {/* Incomplete onboarding banner (Req 2.3, 2.4) */}
      {show(['all']) && skippedOnboardingSteps.length > 0 && (
        <OnboardingBanner skippedSteps={skippedOnboardingSteps} />
      )}

      {/* Continue Browsing rail — recent visits since last launch (Req 1.1) */}
      {show(['all', 'events', 'hubs']) && <ContinueBrowsingRail />}

      {/* Community Events rail — events from joined communities (Req 1.2) */}
      {show(['all', 'events']) && (
        <CommunityEventsRail
          onSeeAll={() => router.push('/events')}
        />
      )}

      {show(['events', 'art']) && <HeroCarousel events={s.featured} />}

      {show(['all']) && <DiscoverCultureTodayCard />}

      {show(['all']) && <SuperAppLinks />}

      {/* CultureMarket listings rail — shown on 'all', 'offers', and 'shopping' */}
      {show(['all', 'offers', 'shopping']) && (
        <DiscoverShopRail
          title="CultureMarket"
          subtitle="Products, services & offers from cultural businesses"
        />
      )}

      {show(['events', 'art']) && recommendedFromFeature.length > 0 && (
        <M3EventRail
          title="Recommended For You"
          subtitle="Ranked by quality, trust, and cultural fit"
          data={recommendedFromFeature}
          onSeeAll={goEvents}
        />
      )}

      {show(['all', 'events', 'art']) &&
        d.adaptiveCultureRails.map((rail) => (
          <CultureCardRail
            key={rail.id}
            title={rail.title}
            subtitle={rail.subtitle}
            items={rail.items}
          />
        ))}

      {show(['events', 'art']) && (
        <EventRail
          title="Starting Soon"
          subtitle={
            d.localUpcomingEvents?.length
              ? `Happening around ${d.locationDisplayLabel || userCity} today`
              : 'Grab your spot before they start'
          }
          data={d.eventsLoading && s.soon.length === 0 ? ['sk1', 'sk2', 'sk3'] : s.soon}
          isLoading={d.eventsLoading}
          schedulingMode="live_and_countdown"
          onSeeAll={goEvents}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {show(['all', 'events', 'art']) && showNearbyRail &&
        (isExpanded ? (
          <View style={{ paddingHorizontal: sidePad, marginVertical: 24 }}>
            <M3SectionHeader
              title="Popular Near You"
              subtitle={nearbySubtitle}
              onAction={goEvents}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {(d.nearbyLoading && nearbyRailResolved.length === 0
                ? (['sk1', 'sk2', 'sk3', 'sk4'] as const)
                : nearbyRailResolved.slice(0, 4)
              ).map((event) =>
                typeof event === 'string' ? (
                  <View key={event} style={{ width: (contentWidth - 16) / 2, height: 280 }} />
                ) : (
                  <View key={event.id} style={{ width: (contentWidth - 16) / 2 }}>
                    <M3EventCard event={event} />
                  </View>
                ),
              )}
            </View>
          </View>
        ) : (
          <EventRail
            title="Popular Near You"
            subtitle={nearbySubtitle}
            data={d.nearbyLoading && nearbyRailResolved.length === 0 ? ['s1', 's2', 's3', 's4'] : s.nearby}
            isLoading={d.nearbyLoading}
            onSeeAll={goEvents}
            errorMessage={d.nearbyRailError}
            onRetry={() => void d.refetchEvents()}
          />
        ))}

      {show(['all', 'events', 'art']) && showPopularRail && (
        <EventRail
          title="Popular Events"
          subtitle={
            d.nearbyScope !== 'local'
              ? `Trending across ${userCountry}`
              : 'What people are attending'
          }
          data={d.eventsLoading && popularRailResolved.length === 0 ? ['s1', 's2', 's3', 's4'] : s.popular}
          isLoading={d.eventsLoading}
          onSeeAll={goEvents}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {show(['all', 'events', 'art']) && d.council && d.councilEvents.length > 0 && (
        <EventRail
          title={`In ${d.council.name}`}
          subtitle={
            d.location?.councilMatchMethod === 'coordinate' && d.location.councilDistanceKm != null
              ? `Your local council · ${Math.round(d.location.councilDistanceKm)} km away`
              : 'Events in your council area'
          }
          data={d.councilEvents}
          onSeeAll={() =>
            router.push({
              pathname: '/events',
              params: {
                councilId: d.council!.id,
                lgaCode: d.council!.lgaCode || undefined,
              },
            })
          }
          isLoading={d.eventsLoading}
        />
      )}

      {show(['all', 'events', 'art']) && (s.forYou.length > 0 || d.eventsLoading || showPopularRail) && (
        <EventRail
          title="For Your Culture"
          subtitle={
            s.forYou.length > 0
              ? 'Personalised to your heritage'
              : 'Showing popular events while we learn your tastes'
          }
          data={d.eventsLoading && s.forYou.length === 0 ? ['s1', 's2', 's3'] : s.forYou}
          isLoading={d.eventsLoading}
          onSeeAll={goEvents}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {show(['all', 'directory']) && <CategoryRail />}

      {show(['indigenous']) && (
        <IndigenousSpotlight
          land={d.land}
          organisations={d.indigenousOrganisations}
          festivals={[]}
          businesses={[]}
        />
      )}

      {show(['events', 'hubs']) && <CultureHubRail />}

      {show(['all', 'hubs']) && (
        <LazyCommunityRail
          title="Communities"
          subtitle={communitiesSubtitle}
          data={d.communitiesLoading ? ['s1', 's2', 's3', 's4'] : s.communities}
          isLoading={d.communitiesLoading}
          onSeeAll={goCommunities}
          errorMessage={d.communitiesRailError}
          onRetry={() => void d.refetchCommunities()}
        />
      )}

      {show(['travel']) && <CityRail />}

      {show(['movies']) && d.moviePreviewItems.length > 0 && (
        <PreviewRail
          title="Movies"
          subtitle="Now screening near you"
          accentColor={CultureTokens.heritageGold}
          icon="film-outline"
          items={
            d.moviesLoading ? (['skeleton', 'skeleton', 'skeleton'] as const) : d.moviePreviewItems
          }
          isLoading={d.moviesLoading}
          seeAllRoute="/movies"
        />
      )}

      {show(['dining']) && d.restaurantPreviewItems.length > 0 && (
        <PreviewRail
          title="Dining"
          subtitle="Cultural flavours near you"
          accentColor={CultureTokens.deepSaffron}
          icon="restaurant-outline"
          items={
            d.restaurantsLoading
              ? (['skeleton', 'skeleton', 'skeleton'] as const)
              : d.restaurantPreviewItems
          }
          isLoading={d.restaurantsLoading}
          seeAllRoute="/restaurants"
        />
      )}

      {show(['shopping']) && d.shoppingPreviewItems.length > 0 && (
        <PreviewRail
          title="Shopping Directory"
          subtitle="Cultural goods and specialty stores"
          accentColor={CultureTokens.emeraldHarmony}
          icon="bag-handle-outline"
          items={
            d.shoppingLoading
              ? (['skeleton', 'skeleton', 'skeleton'] as const)
              : d.shoppingPreviewItems
          }
          isLoading={d.shoppingLoading}
          seeAllRoute="/shopping"
        />
      )}

      {/* CultureMarket category sub-rails on shopping filter */}
      {show(['shopping']) && (
        <DiscoverShopRail
          category="fashion"
          title="Fashion & Beauty"
          subtitle="Cultural fashion and beauty businesses"
        />
      )}
      {show(['shopping']) && (
        <DiscoverShopRail
          category="food"
          title="Food & Groceries"
          subtitle="Cultural food products and catering"
        />
      )}

      {show(['offers']) && d.perksPreviewItems.length > 0 && (
        <PreviewRail
          title="Offers & Perks"
          subtitle="Exclusive deals for members"
          accentColor={CultureTokens.richIndigo}
          icon="pricetag-outline"
          items={
            d.perksLoading ? (['skeleton', 'skeleton', 'skeleton'] as const) : d.perksPreviewItems
          }
          isLoading={d.perksLoading}
          seeAllRoute="/perks"
        />
      )}

      {/* ── CLASSES & FITNESS AROUND YOU (real Activities data) ── */}
      {show(['classes', 'activities', 'all']) && (
        <>
          {fitnessActivities.length > 0 ? (
            <ActivityRail
              title="Classes & Fitness Around You"
              subtitle="Yoga, dance, meditation, gyms & cultural fitness near you"
              data={fitnessActivities}
              onSeeAll={() => router.push('/activities?category=Classes')}
            />
          ) : classEvents.length > 0 ? (
            // Transitional fallback while hosts migrate to the real Activities flow
            <M3EventRail
              title="Classes & Fitness Around You"
              subtitle="Yoga, tango, dance, meditation, gyms & workouts near you"
              data={classEvents}
              onSeeAll={goEvents}
            />
          ) : (
            <View style={{ paddingHorizontal: sidePad, marginVertical: 20 }}>
              <M3SectionHeader 
                title="Classes & Fitness Around You" 
                onAction={() => router.push('/activities')}
              />
              <View style={{ padding: 24, alignItems: 'center', gap: 12, backgroundColor: colors.surfaceVariant, borderRadius: Radius.lg }}>
                <Ionicons name="fitness-outline" size={36} color={CultureTokens.coral} />
                <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', fontFamily: FontFamily.medium, fontSize: 14 }}>
                  No classes listed near you yet. Be the first to host one or browse all activities.
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Pressable 
                    onPress={() => router.push('/hostspace')} 
                    style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: CultureTokens.indigo, borderRadius: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Open HostSpace to create a class"
                  >
                    <Text style={{ color: 'white', fontFamily: FontFamily.medium, fontSize: 13 }}>Host a class</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => router.push('/activities')} 
                    style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant }}
                    accessibilityRole="button"
                    accessibilityLabel="Browse all activities"
                  >
                    <Text style={{ color: colors.onSurface, fontFamily: FontFamily.medium, fontSize: 13 }}>Browse all</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
}

export function isClassEvent(event: EventData): boolean {
  const category = (event.category ?? '').toLowerCase();
  const eventType = (event.eventType ?? '').toLowerCase();
  const tags = (event.tags ?? []).map((t) => t.toLowerCase());
  const title = (event.title ?? '').toLowerCase();
  const desc = (event.description ?? '').toLowerCase();

  const keywords = [
    'yoga',
    'tango',
    'dance',
    'meditation',
    'gym',
    'workout',
    'class',
    'fitness',
    'pilates',
    'aerobics',
    'zumba',
    'boxing',
    'martial arts',
    'tai chi',
  ];

  if (
    [
      'classes',
      'wellness',
      'fitness',
      'workouts',
      'dance',
      'yoga',
      'tango',
      'meditation',
      'gym',
      'sports',
      'activities',
    ].includes(category)
  ) {
    return true;
  }
  
  if (['workshop', 'wellness', 'dance', 'sports'].includes(eventType)) {
    return keywords.some(
      (kw) => title.includes(kw) || desc.includes(kw) || tags.some((t) => t.includes(kw))
    );
  }

  return keywords.some((kw) => title.includes(kw) || tags.some((t) => t.includes(kw)));
}
