import React, { useEffect, useMemo, useState, Suspense } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useColors, useIsDark } from '@/hooks/useColors';
import { createLazyComponent } from '@/lib/lazy';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Radius } from '@/design-system/tokens/theme';
import { GlassView, LuxeText } from '@/design-system/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { hostApi } from '@/modules/host/api';
import {
  HostspaceCreateFormPanel,
  invalidateCultureMarketListings,
} from '@/modules/host/components/HostspaceCreateFormPanel';

import type { EventData, ShopListing, ShopListingType } from '@/shared/schema';

import {
  findCategory,
  getCategoryDataflow,
  getCreateLabCatalogCategories,
  type CategoryGroup,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';
import {
  filterHostPagesForCategory,
  isOrgCommunityHostPage,
} from '@/modules/host/lib/hostspaceCreateParents';

import {
  navigateOnCategorySelect,
  navigateToCreate,
  navigateToEditEvent,
  navigateToEditHostPage,
} from '@/lib/creationRouting';
import { captureCreationCatalogView, captureCreationCategorySelect } from '@/lib/creationAnalytics';

const LazyHostspaceCreateListingsColumn = createLazyComponent(
  () => import('./HostspaceCreateListingsColumn'),
  'HostspaceCreateListingsColumn'
);
const LazyHostspaceCreateVerifyCard = createLazyComponent(
  () => import('./HostspaceCreateVerifyCard'),
  'HostspaceCreateVerifyCard'
);
const LazyHostspaceCreateTopChrome = createLazyComponent(
  () => import('./HostspaceCreateTopChrome'),
  'HostspaceCreateTopChrome'
);
const LazyHostspaceCreateCategoryGrid = createLazyComponent(
  () => import('./HostspaceCreateCategoryGrid'),
  'HostspaceCreateCategoryGrid'
);
const LazyHostspaceCreateCategorySidebar = createLazyComponent(
  () => import('./HostspaceCreateCategorySidebar'),
  'HostspaceCreateCategorySidebar'
);

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

export function HostspaceCreatePanel({
  initialCategory,
  embedded = false,
}: {
  initialCategory?: string;
  /** When true, parent HostspaceCreateShell owns chrome and hero. */
  embedded?: boolean;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { hPad, isDesktop } = useLayout();
  const initialSelected = useMemo(() => findCategory(initialCategory), [initialCategory]);
  const catalogCategories = useMemo(() => getCreateLabCatalogCategories(), []);
  const [selectedId, setSelectedId] = useState(() => initialSelected.id);
  const selected = useMemo(
    () => catalogCategories.find((item) => item.id === selectedId) ?? catalogCategories[0],
    [catalogCategories, selectedId],
  );
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [activeGroups, setActiveGroups] = useState<CategoryGroup[]>(['all']);
  const [navMinimized, setNavMinimized] = useState(false);
  const canMinimizeNav = Platform.OS === 'web' && isDesktop;

  const [marketWizardOpen, setMarketWizardOpen] = useState(false);
  const [marketWizardEditId, setMarketWizardEditId] = useState<string | null>(null);
  const [marketWizardSeedType, setMarketWizardSeedType] = useState<ShopListingType | undefined>(undefined);
  const [marketWizardSession, setMarketWizardSession] = useState(0);
  const [hostInfoVerified, setHostInfoVerified] = useState(false);
  const [selectedParentHostPageId, setSelectedParentHostPageId] = useState<string | null>(null);

  const [showSelector, setShowSelector] = useState(Platform.OS !== 'web' && !initialCategory);

  useEffect(() => {
    setSelectedId(initialSelected.id);
  }, [initialSelected]);

  useEffect(() => {
    captureCreationCatalogView('creation_lab');
  }, []);

  useEffect(() => {
    if (!canMinimizeNav) setNavMinimized(false);
  }, [canMinimizeNav]);

  useEffect(() => {
    if (selected.group !== 'market') {
      setMarketWizardOpen(false);
      setMarketWizardEditId(null);
      setMarketWizardSeedType(undefined);
    }
  }, [selected.group]);

  const sideWidth = Platform.OS === 'web' ? (navMinimized ? 88 : 340) : '100%';

  const toggleGroup = (groupId: CategoryGroup) => {
    haptic();
    if (groupId === 'all') {
      setActiveGroups(['all']);
      return;
    }
    setActiveGroups((prev) => {
      const filtered = prev.filter((g) => g !== 'all');
      if (filtered.includes(groupId)) {
        const next = filtered.filter((g) => g !== groupId);
        return next.length === 0 ? ['all'] : next;
      }
      return [...filtered, groupId];
    });
  };

  const openMarketWizard = (opts?: { editId?: string | null; seedType?: ShopListingType }) => {
    setMarketWizardEditId(opts?.editId ?? null);
    setMarketWizardSeedType(opts?.seedType);
    setMarketWizardSession((s) => s + 1);
    setMarketWizardOpen(true);
  };

  const closeMarketWizard = () => {
    setMarketWizardOpen(false);
    setMarketWizardEditId(null);
    setMarketWizardSeedType(undefined);
  };

  const selectCategory = (category: CreateCategory) => {
    haptic();
    setSelectedId(category.id);
    setShowSelector(false);
    if (embedded) {
      const flow = getCategoryDataflow(category);
      captureCreationCategorySelect({
        categoryId: category.id,
        categoryLabel: category.label,
        layer: flow.layer,
        wizard: flow.wizard,
        storage: flow.storage,
        manageTab: flow.manageTab,
        source: 'creation_lab_select',
        entityType: category.entityType,
        subCategory: category.subCategory,
      });
      return;
    }
    navigateOnCategorySelect(category, 'creation_lab_select');
  };

  const { data: myHostPages = [], isLoading: hostPagesLoading } = useQuery({
    queryKey: ['hostspace-my-host-pages'],
    queryFn: () => hostApi.hostPages.my(),
    staleTime: 30_000,
  });

  const orgHostPages = useMemo(
    () => myHostPages.filter(isOrgCommunityHostPage),
    [myHostPages],
  );

  const { data: hostApplicationData } = useQuery({
    queryKey: ['host-application', 'me'],
    queryFn: () => api.hostApplications.myApplication(),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!selectedParentHostPageId && orgHostPages.length > 0) {
      setSelectedParentHostPageId(orgHostPages[0].id);
    }
  }, [orgHostPages, selectedParentHostPageId]);

  useEffect(() => {
    setHostInfoVerified(false);
  }, [user?.id]);

  const { data: myShopData, isLoading: shopListingsLoading } = useQuery({
    queryKey: ['culture-market-my-listings'],
    queryFn: () => api.cultureShop.getListings({ mine: true, limit: 48 }),
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: myEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['hostspace-create-my-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as EventData[];
      const response = await hostApi.events.list(user.id);
      return response.events ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const liveListingCount = useMemo(() => {
    const shop = myShopData?.listings?.length ?? 0;
    return myHostPages.length + shop;
  }, [myHostPages.length, myShopData?.listings?.length]);

  const listingCountLoading = !!user && (hostPagesLoading || shopListingsLoading);

  const deleteShopListingMutation = useMutation({
    mutationFn: (id: string) => api.cultureShop.deleteListing(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['culture-market-my-listings'] });
    },
  });

  const selectedParentHostPage = useMemo(
    () => orgHostPages.find((page) => page.id === selectedParentHostPageId) ?? null,
    [orgHostPages, selectedParentHostPageId],
  );
  const requiresParentHostPage = selected.orgCatalogKind === 'host-listing' || selected.requiresParent === true;
  const canCreateSelected = hostInfoVerified && (!requiresParentHostPage || !!selectedParentHostPage);
  const hostApplication = hostApplicationData?.application ?? null;
  const hostInfoRows = useMemo(
    () => [
      { label: 'Host name', value: user?.displayName ?? user?.username ?? hostApplication?.fullName ?? 'Not provided' },
      { label: 'Email', value: user?.email ?? 'Not provided' },
      { label: 'Phone', value: user?.phone ?? 'Not provided' },
      { label: 'CulturePass ID', value: user?.culturePassId ?? user?.handle ?? user?.id ?? 'Not provided' },
      { label: 'City', value: [user?.city, user?.state, user?.country].filter(Boolean).join(', ') || hostApplication?.city || 'Not provided' },
      { label: 'Approved host type', value: hostApplication?.hostType ?? 'Cultural host' },
      { label: 'Business / organisation', value: hostApplication?.businessName ?? 'Not provided' },
      { label: 'Website', value: user?.website ?? hostApplication?.websiteUrl ?? 'Not provided' },
    ],
    [hostApplication, user],
  );

  const filteredHostPages = useMemo(
    () => filterHostPagesForCategory(myHostPages, selected),
    [myHostPages, selected],
  );

  const filteredEvents = useMemo(() => {
    if (selected.id !== 'event') return [];
    if (!selectedParentHostPageId) return myEvents;
    return myEvents.filter(
      (event) =>
        event.publisherProfileId === selectedParentHostPageId ||
        event.organizerId === selectedParentHostPageId,
    );
  }, [myEvents, selected.id, selectedParentHostPageId]);

  const marketTypeFilter = useMemo((): ShopListingType | null => {
    if (selected.group !== 'market') return null;
    if (selected.id === 'market-product') return 'product';
    if (selected.id === 'market-service') return 'service';
    if (selected.id === 'market-link') return 'link';
    return null;
  }, [selected.group, selected.id]);

  const filteredShopListings = useMemo(() => {
    const rows = myShopData?.listings ?? [];
    if (!marketTypeFilter) return rows;
    return rows.filter((l) => l.type === marketTypeFilter);
  }, [myShopData?.listings, marketTypeFilter]);

  const isEventListing = selected.id === 'event';
  const outputItemCount = selected.group === 'market'
    ? filteredShopListings.length
    : isEventListing
      ? filteredEvents.length
      : filteredHostPages.length;

  const showOutputColumn = selected.group !== 'market' || shopListingsLoading || filteredShopListings.length > 0;

  const openCreateFlow = () => {
    haptic();
    if (!hostInfoVerified) {
      Alert.alert('Verify host information', 'Please review and verify your information before creating anything.');
      return;
    }
    if (requiresParentHostPage && !selectedParentHostPage) {
      Alert.alert('Select a host page', 'Please select or create an org/community host page first.');
      return;
    }
    if (selected.group === 'market' || selected.contentKind === 'market') {
      const subType = selected.subCategory as ShopListingType | undefined;
      openMarketWizard({
        seedType: subType && ['product', 'service', 'link'].includes(subType) ? subType : undefined,
      });
      return;
    }
    navigateToCreate(selected, {
      source: 'creation_lab_launch',
      parentHostPageId: selectedParentHostPage?.id,
      trackSelect: false,
    });
  };

  const onEditEvent = (event: EventData) => {
    haptic();
    navigateToEditEvent(event.id, 'creation_lab_edit_event', event.publisherProfileId ?? selectedParentHostPageId ?? undefined);
  };

  const onEditShopListing = (listing: ShopListing) => {
    haptic();
    openMarketWizard({ editId: listing.id });
  };

  const onDeleteShopListing = (listing: ShopListing) => {
    Alert.alert('Remove listing', `Remove "${listing.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void deleteShopListingMutation.mutateAsync(listing.id) },
    ]);
  };

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogCategories.filter((item) => {
      if (!activeGroups.includes('all') && !activeGroups.includes(item.group)) return false;
      if (!q) return true;
      const haystack = `${item.label} ${item.purpose} ${item.description} ${item.aliases.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalogCategories, query, activeGroups]);

  const body = (
    <>
        {!embedded ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.introBlock}>
            <LuxeText variant="body" style={{ color: colors.textSecondary, textAlign: 'center', maxWidth: 640 }}>
              Five creation paths — Orgs & Communities (pages + listings), Venues, Businesses, CultureMarket, and Templates.
            </LuxeText>

            <GlassView intensity={10} style={[styles.unificationCallout, { borderColor: colors.borderLight, borderWidth: 1 }]}>
              <View style={[styles.calloutIconBox, { backgroundColor: CultureTokens.teal + '18' }]}>
                <Ionicons name="people-outline" size={14} color={CultureTokens.teal} />
              </View>
              <LuxeText variant="caption" style={{ color: colors.textSecondary, fontFamily: Radius.sm ? 'Poppins_600SemiBold' : 'System' }}>
                Organisations & Communities use one form — pick your type from the dropdown (Community through Club or Society).
              </LuxeText>
            </GlassView>
          </Animated.View>
        ) : null}

        <Suspense fallback={null}>
            <LazyHostspaceCreateVerifyCard
                hostInfoVerified={hostInfoVerified}
                onToggleVerified={() => setHostInfoVerified((prev) => !prev)}
                hostInfoRows={hostInfoRows}
            />
        </Suspense>

        {showSelector && !isDesktop ? (
          <Suspense fallback={null}>
            <LazyHostspaceCreateCategoryGrid
                categories={filteredCategories}
                activeGroups={activeGroups}
                onGroupToggle={toggleGroup}
                onSelect={selectCategory}
                query={query}
                onQueryChange={setQuery}
            />
          </Suspense>
        ) : (
          <View style={[styles.workspace, isDesktop && styles.workspaceDesktop]}>
            <Suspense fallback={null}>
                <LazyHostspaceCreateCategorySidebar
                    width={sideWidth}
                    navMinimized={navMinimized}
                    canMinimizeNav={canMinimizeNav}
                    onToggleNavMinimized={() => setNavMinimized((prev) => !prev)}
                    query={query}
                    onQueryChange={setQuery}
                    activeGroups={activeGroups}
                    onGroupToggle={toggleGroup}
                    categories={filteredCategories}
                    selectedId={selected.id}
                    onSelectCategory={selectCategory}
                />
            </Suspense>

            <HostspaceCreateFormPanel
              selected={selected}
              marketWizardOpen={marketWizardOpen}
              marketWizardSession={marketWizardSession}
              marketWizardEditId={marketWizardEditId}
              marketWizardSeedType={marketWizardSeedType}
              onCloseMarketWizard={closeMarketWizard}
              onListingPublished={() => {
                invalidateCultureMarketListings(queryClient);
                closeMarketWizard();
              }}
              canCreateSelected={canCreateSelected}
              requiresParentHostPage={requiresParentHostPage}
              orgHostPages={orgHostPages}
              selectedParentHostPageId={selectedParentHostPageId}
              onSelectParentHostPageId={setSelectedParentHostPageId}
              selectedParentHostPage={selectedParentHostPage}
              hostInfoVerified={hostInfoVerified}
              onOpenCreateFlow={openCreateFlow}
            />

            {showOutputColumn ? (
              <Suspense fallback={null}>
                <LazyHostspaceCreateListingsColumn
                    selected={selected}
                    isMarket={selected.group === 'market'}
                    isEventListing={isEventListing}
                    itemCount={outputItemCount}
                    shopListingsLoading={shopListingsLoading}
                    hostPagesLoading={hostPagesLoading}
                    eventsLoading={eventsLoading}
                    userSignedIn={!!user}
                    filteredShopListings={filteredShopListings}
                    filteredHostPages={filteredHostPages}
                    filteredEvents={filteredEvents}
                    onOpenCreateFlow={openCreateFlow}
                    onEditHostPage={(page) => {
                      haptic();
                      navigateToEditHostPage(page.entityType, page.id, 'creation_lab_edit_host_page');
                    }}
                    onEditEvent={onEditEvent}
                    onEditShopListing={onEditShopListing}
                    onDeleteShopListing={onDeleteShopListing}
                />
              </Suspense>
            ) : null}
          </View>
        )}
    </>
  );

  if (embedded) {
    return (
      <View style={styles.embeddedRoot}>
        <Stack.Screen options={{ title: 'HostSpace · Create', headerShown: false }} />
        {body}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Host Workspace | CulturePass', headerShown: false }} />
      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
        style={StyleSheet.absoluteFill}
      />

      <Suspense fallback={null}>
        <LazyHostspaceCreateTopChrome liveListingCount={liveListingCount} listingCountLoading={listingCountLoading} />
      </Suspense>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: hPad,
            maxWidth: 1280,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  embeddedRoot: { gap: 24, paddingTop: 8, paddingBottom: 48 },
  scroll: {
    paddingTop: 32,
    paddingBottom: 120,
    gap: 40,
  },
  scrollFlex: { flex: 1 },
  introBlock: { alignItems: 'center', gap: 16 },
  workspace: { gap: 24 },
  workspaceDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  unificationCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
  },
  calloutIconBox: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});