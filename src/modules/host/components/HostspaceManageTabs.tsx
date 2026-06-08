/**
 * Unified HostSpace manage tabs — Pages, Events, Listings, Offers, Market
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { M3FilterChip } from '@/design-system/ui';
import { Spacing } from '@/design-system/tokens/theme';
import type { EventData, HostPage, Profile, ShopListing } from '@/shared/schema';

import type { HostspaceManageTab } from '@shared/creation/dataflow';

export type { HostspaceManageTab };

export const HOSTSPACE_MANAGE_TABS: { id: HostspaceManageTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pages', label: 'Pages' },
  { id: 'events', label: 'Events' },
  { id: 'listings', label: 'Listings' },
  { id: 'offers', label: 'Offers' },
  { id: 'market', label: 'Market' },
];

export function isOfferProfile(profile: Profile): boolean {
  const sub = (profile.subCategory ?? profile.category ?? '').toLowerCase();
  return sub.includes('offer') || sub.includes('perk') || sub.includes('deal');
}

export function isListingProfile(profile: Profile): boolean {
  if (profile.entityType === 'community') return false;
  return !isOfferProfile(profile);
}

export interface HostspaceManageTabsProps {
  activeTab: HostspaceManageTab;
  onTabChange: (tab: HostspaceManageTab) => void;
  colors: { onSurface: string; onSurfaceVariant: string };
}

export function HostspaceManageTabs({ activeTab, onTabChange, colors }: HostspaceManageTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabRow}
      testID="hostspace-manage-tabs"
    >
      {HOSTSPACE_MANAGE_TABS.map((tab) => (
        <M3FilterChip
          key={tab.id}
          label={tab.label}
          selected={activeTab === tab.id}
          onPress={() => onTabChange(tab.id)}
        />
      ))}
    </ScrollView>
  );
}

export interface HostspaceManageFilterInput {
  tab: HostspaceManageTab;
  pages: HostPage[];
  events: EventData[];
  profiles: Profile[];
  shopListings: ShopListing[];
}

export function filterHostspaceManageItems({
  tab,
  pages,
  events,
  profiles,
  shopListings,
}: HostspaceManageFilterInput) {
  const communities = profiles.filter((p) => p.entityType === 'community');
  const listings = profiles.filter(isListingProfile);
  const offers = profiles.filter(isOfferProfile);

  switch (tab) {
    case 'pages':
      return { pages, events: [], profiles: [], shopListings: [], communities: [] };
    case 'events':
      return { pages: [], events, profiles: [], shopListings: [], communities: [] };
    case 'listings':
      return { pages: [], events: [], profiles: listings, shopListings: [], communities };
    case 'offers':
      return { pages: [], events: [], profiles: offers, shopListings: [], communities: [] };
    case 'market':
      return { pages: [], events: [], profiles: [], shopListings, communities: [] };
    case 'all':
    default:
      return { pages, events, profiles: listings, shopListings, communities, offers };
  }
}

export function HostspaceManageTabHint({ tab }: { tab: HostspaceManageTab }) {
  const hints: Record<HostspaceManageTab, string> = {
    all: 'Everything you publish on CulturePass',
    pages: 'Facebook-style Pages with verification',
    events: 'Ticketed and free events',
    listings: 'Directory profiles — venues, businesses, artists',
    offers: 'Deals, perks, and promotions',
    market: 'CultureMarket products and services',
  };

  return (
    <Text style={styles.hint}>{hints[tab]}</Text>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
  },
  hint: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
});