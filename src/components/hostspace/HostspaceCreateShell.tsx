import React, { type ReactNode, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { HostspaceHeroShell } from '@/components/hostspace/HostspaceHeroShell';
import { HostspaceStickyBar } from '@/components/hostspace/HostspaceStickyBar';
import {
  hostspaceCreateHeroHeight,
  hostspaceScrollBottom,
  type HostspaceShellMode,
} from '@/components/hostspace/hostspaceLayout';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { navigateToCreateById } from '@/lib/creationRouting';
import { findCategory } from '@/modules/host/config/hostspaceCreateCategories.config';

interface HostspaceCreateShellProps {
  children: ReactNode;
  /** Page Pro wizard, category form, or catalog selector */
  flow: 'catalog' | 'category' | 'wizard';
  categoryId?: string;
}

export function HostspaceCreateShell({ children, flow, categoryId }: HostspaceCreateShellProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsetsWeb();
  const { hPad, isDesktop, contentWidth } = useLayout();
  const { user } = useAuth();

  const mode: HostspaceShellMode =
    flow === 'wizard' ? 'wizard' : flow === 'category' ? 'create' : 'create-page';

  const categoryLabel = categoryId ? findCategory(categoryId).label : undefined;
  const showHero = flow !== 'wizard';
  const heroHeight = hostspaceCreateHeroHeight(isDesktop);

  const { data: listingData, isLoading: listingCountLoading } = useQuery({
    queryKey: ['hostspace-create-live-count'],
    queryFn: async () => {
      const [profiles, shop] = await Promise.all([
        api.profiles.my(),
        api.cultureShop.getListings({ mine: true, limit: 48 }),
      ]);
      return {
        profiles: profiles?.length ?? 0,
        shop: shop?.listings?.length ?? 0,
      };
    },
    enabled: !!user && flow !== 'wizard',
    staleTime: 30_000,
  });

  const liveListingCount = (listingData?.profiles ?? 0) + (listingData?.shop ?? 0);

  const stats = useMemo(
    () => [
      { icon: 'document-text-outline' as const, value: listingData?.profiles ?? '—', label: 'Profiles', color: Luxe.colors.indigo },
      { icon: 'storefront-outline' as const, value: listingData?.shop ?? '—', label: 'Market', color: Luxe.colors.emerald },
      { icon: 'calendar-outline' as const, value: '—', label: 'Events', color: Luxe.colors.appBlue },
      { icon: 'people-outline' as const, value: '—', label: 'Communities', color: Luxe.colors.plum },
    ],
    [listingData],
  );

  const quickActions = useMemo(
    () => [
      {
        key: 'event',
        label: 'New event',
        icon: 'calendar-outline' as const,
        color: Luxe.colors.appBlue,
        onPress: () => navigateToCreateById('event', { source: 'hostspace_create_shell_event' }),
      },
      {
        key: 'community',
        label: 'Community',
        icon: 'people-outline' as const,
        color: Luxe.colors.plum,
        onPress: () => navigateToCreateById('community', { source: 'hostspace_create_shell_community' }),
      },
      {
        key: 'market',
        label: 'CultureMarket',
        icon: 'bag-handle-outline' as const,
        color: Luxe.colors.emerald,
        onPress: () => navigateToCreateById('market-product', { source: 'hostspace_create_shell_market' }),
      },
      {
        key: 'manage',
        label: 'Manage',
        icon: 'grid-outline' as const,
        color: Luxe.colors.indigo,
        onPress: () => router.push('/hostspace' as never),
      },
    ],
    [],
  );

  const headline =
    flow === 'catalog'
      ? 'Create a Page'
      : flow === 'category'
        ? categoryLabel ?? 'Create'
        : 'HostSpace';

  const subtitle =
    flow === 'catalog'
      ? 'Your Page is your home on CulturePass — communities, venues, businesses, and creators.'
      : 'Draft events, listings, offers, and marketplace products from one studio.';

  if (flow === 'wizard') {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <HostspaceStickyBar mode="wizard" topInset={insets.top} hPad={hPad} compact />
        {children}
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
        style={StyleSheet.absoluteFill}
      />
      <HostspaceStickyBar
        mode={mode}
        topInset={insets.top}
        hPad={hPad}
        categoryLabel={categoryLabel}
        liveListingCount={liveListingCount}
        listingCountLoading={listingCountLoading}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: hostspaceScrollBottom(insets.bottom) },
          (isDesktop) && { maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        {showHero ? (
          <HostspaceHeroShell
            mode={mode}
            heroHeight={heroHeight}
            topInset={0}
            hPad={hPad}
            headline={headline}
            subtitle={subtitle}
            stats={stats}
            quickActions={quickActions}
          />
        ) : null}
        <View style={{ paddingHorizontal: hPad }}>{children}</View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});