import React, { useEffect, useMemo, useState, Suspense } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useColors, useIsDark } from '@/hooks/useColors';
import { createLazyComponent } from '@/lib/lazy';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { GlassView, LuxeText, LuxeButton } from '@/design-system/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  HostspaceCreateFormPanel,
  invalidateCultureMarketListings,
} from '@/modules/host/components/HostspaceCreateFormPanel';
 
import type { Profile, ShopListing, ShopListingType } from '@/shared/schema';

import {
  CREATE_CATEGORIES,
  findCategory,
  type CategoryGroup,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';

import { navigateOnCategorySelect, navigateToCreate, navigateToEditListing } from '@/lib/creationRouting';
import { captureCreationCatalogView } from '@/lib/creationAnalytics';
 
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
  const [selectedId, setSelectedId] = useState(() => initialSelected.id);
  const selected = useMemo(
    () => CREATE_CATEGORIES.find((item) => item.id === selectedId) ?? CREATE_CATEGORIES[0],
    [selectedId],
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
  const [selectedParentProfileId, setSelectedParentProfileId] = useState<string | null>(null);

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
    navigateOnCategorySelect(category, 'creation_lab_select');
  };

  const openCreateFlow = () => {
    haptic();
    if (!hostInfoVerified) {
      Alert.alert('Verify host information', 'Please review and verify your information before creating anything.');
      return;
    }
    if (requiresParentProfile && !selectedParentProfile) {
      Alert.alert('Select a profile', 'Please select or create a host profile first.');
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
      parentProfileId: selectedParentProfile?.id,
      trackSelect: false,
    });
  };

  const { data: myProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['hostspace-my-profiles'],
    queryFn: () => api.profiles.my(),
    staleTime: 30_000,
  });

  const { data: hostApplicationData } = useQuery({
    queryKey: ['host-application', 'me'],
    queryFn: () => api.hostApplications.myApplication(),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!selectedParentProfileId && myProfiles.length > 0) {
      setSelectedParentProfileId(myProfiles[0].id);
    }
  }, [myProfiles, selectedParentProfileId]);

  useEffect(() => {
    setHostInfoVerified(false);
  }, [user?.id]);

  const { data: myShopData, isLoading: shopListingsLoading } = useQuery({
    queryKey: ['culture-market-my-listings'],
    queryFn: () => api.cultureShop.getListings({ mine: true, limit: 48 }),
    enabled: !!user,
    staleTime: 30_000,
  });

  const liveListingCount = useMemo(() => {
    const shop = myShopData?.listings?.length ?? 0;
    return myProfiles.length + shop;
  }, [myProfiles.length, myShopData?.listings?.length]);

  const listingCountLoading = !!user && (profilesLoading || shopListingsLoading);

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => api.profiles.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hostspace-my-profiles'] });
    },
  });

  const deleteShopListingMutation = useMutation({
    mutationFn: (id: string) => api.cultureShop.deleteListing(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['culture-market-my-listings'] });
    },
  });

  const selectedEntityType = selected.entityType;
  const selectedParentProfile = useMemo(
    () => myProfiles.find((profile) => profile.id === selectedParentProfileId) ?? null,
    [myProfiles, selectedParentProfileId],
  );
  const requiresParentProfile = selected.requiresParent === true || selected.kind === 'content';
  const canCreateSelected = hostInfoVerified && (!requiresParentProfile || !!selectedParentProfile);
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
  const filteredListings = useMemo(() => {
    return myProfiles.filter((profile) => {
      if (profile.entityType !== selectedEntityType) return false;
      return true;
    });
  }, [myProfiles, selectedEntityType]);

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
  const showOutputColumn = selected.group !== 'market' || shopListingsLoading || filteredShopListings.length > 0;

  const onEditListing = (profile: Profile) => {
    haptic();
    navigateToEditListing(profile.id, profile.entityType, 'creation_lab_edit_listing', {
      subCategory: profile.subCategory ?? profile.category,
    });
  };

  const onDeleteListing = (profile: Profile) => {
    Alert.alert('Delete listing', `Delete "${profile.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteProfileMutation.mutateAsync(profile.id) },
    ]);
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
    const RICH_PROFILE_TYPES = ['community', 'organiser', 'venue', 'business', 'artist', 'professional'];
    return CREATE_CATEGORIES.filter((item) => {
      if (!activeGroups.includes('all') && !activeGroups.includes(item.group)) return false;
      if (RICH_PROFILE_TYPES.includes(item.entityType as string)) return false;
      if (!q) return true;
      const haystack = `${item.label} ${item.purpose} ${item.description} ${item.aliases.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeGroups]);

  const body = (
    <>
        {!embedded ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.introBlock}>
            <LuxeText variant="body" style={{ color: colors.textSecondary, textAlign: 'center', maxWidth: 640 }}>
              Launch your cultural presence. Create profiles, events, and marketplace listings to connect with your community.
            </LuxeText>

            <GlassView intensity={10} style={[styles.unificationCallout, { borderColor: colors.borderLight, borderWidth: 1 }]}>
              <View style={[styles.calloutIconBox, { backgroundColor: Luxe.colors.indigo + '18' }]}>
                <Ionicons name="sparkles" size={14} color={Luxe.colors.indigo} />
              </View>
              <LuxeText variant="caption" style={{ color: colors.textSecondary, fontFamily: Radius.sm ? 'Poppins_600SemiBold' : 'System' }}>
                Rich profiles use the guided 6-step creation studio.
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
              requiresParentProfile={requiresParentProfile}
              myProfiles={myProfiles}
              selectedParentProfileId={selectedParentProfileId}
              onSelectParentProfileId={setSelectedParentProfileId}
              selectedParentProfile={selectedParentProfile}
              hostInfoVerified={hostInfoVerified}
              onOpenCreateFlow={openCreateFlow}
            />

            {showOutputColumn ? (
              <Suspense fallback={null}>
                <LazyHostspaceCreateListingsColumn
                    selected={selected}
                    isMarket={selected.group === 'market'}
                    itemCount={selected.group === 'market' ? filteredShopListings.length : filteredListings.length}
                    shopListingsLoading={shopListingsLoading}
                    profilesLoading={profilesLoading}
                    userSignedIn={!!user}
                    filteredShopListings={filteredShopListings}
                    filteredListings={filteredListings}
                    onOpenCreateFlow={openCreateFlow}
                    onEditShopListing={onEditShopListing}
                    onDeleteShopListing={onDeleteShopListing}
                    onEditListing={onEditListing}
                    onDeleteListing={onDeleteListing}
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
