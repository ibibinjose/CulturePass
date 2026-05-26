import React, { useEffect, useMemo, useState } from 'react';
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

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Spacing, Radius, TextStyles } from '@/design-system/tokens/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  HostspaceCreateFormPanel,
  invalidateCultureMarketListings,
} from '@/modules/host/components/HostspaceCreateFormPanel';
import { HostspaceCreateListingsColumn } from '@/modules/host/components/HostspaceCreateListingsColumn';
import { HostspaceCreateVerifyCard } from '@/modules/host/components/HostspaceCreateVerifyCard';
import { HostspaceCreateTopChrome } from '@/modules/host/components/HostspaceCreateTopChrome';
import { HostspaceCreateCategoryGrid } from '@/modules/host/components/HostspaceCreateCategoryGrid';
import { HostspaceCreateCategorySidebar } from '@/modules/host/components/HostspaceCreateCategorySidebar';
import type { Profile, ShopListing, ShopListingType } from '@/shared/schema';

import {
  CREATE_CATEGORIES,
  findCategory,
  type CategoryGroup,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';
import { CREATE_LAB_PATHNAME } from '@/constants/navigation/createNav';

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

export function HostspaceCreateWorkspace({ initialCategory }: { initialCategory?: string }) {
  const colors = useColors();
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

    // Creator Trust + Phase 1 Unification:
    // Rich persistent profiles (community, venue, business, organiser, etc.) must go through the full FormWizard.
    // The workspace is now a launcher/orchestrator for quick content, not the form host for profiles.
    const RICH_PROFILE_TYPES = ['community', 'organiser', 'venue', 'business', 'artist', 'professional'];
    if (RICH_PROFILE_TYPES.includes(category.entityType as string)) {
      router.push(`/hostspace/create?profileType=${category.entityType}` as never);
      return;
    }

    if (category.group === 'market') {
      router.replace({ pathname: CREATE_LAB_PATHNAME, params: { category: category.id } } as never);
      return;
    }
    router.replace(category.route as never);
  };

  const openCreateFlow = () => {
    haptic();
    if (!hostInfoVerified) {
      Alert.alert('Verify host information', 'Please review and verify your exported host information before creating anything in HostSpace.');
      return;
    }
    if (requiresParentProfile && !selectedParentProfile) {
      Alert.alert(
        'Create a host profile first',
        'Create a community, association, organisation, business, venue, charity, government, council, club, or society before adding events, activities, offers, shopping, dining, travel, art, movies, or other listings under it.',
      );
      return;
    }
    if (selected.entityType === 'event') {
      router.push({
        pathname: '/event/create',
        params: selectedParentProfile ? { publisherProfileId: selectedParentProfile.id } : {},
      } as never);
      return;
    }
    if (selected.group === 'market' || selected.contentKind === 'market') {
      const subType = selected.subCategory as ShopListingType | undefined;
      openMarketWizard({
        seedType: subType && ['product', 'service', 'link'].includes(subType) ? subType : undefined,
      });
      return;
    }
    const params: Record<string, string> = {
      listingEntityType: selected.entityType,
    };
    if (selected.subCategory) {
      params.listingSubCategory = selected.subCategory;
    }
    if (selectedParentProfile) {
      params.publisherProfileId = selectedParentProfile.id;
    }
    router.push({
      pathname: '/(domain)/listing/create',
      params,
    } as never);
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
    router.push({
      pathname: '/(domain)/listing/create',
      params: { listingEntityType: profile.entityType, editId: profile.id },
    });
  };

  const onDeleteListing = (profile: Profile) => {
    Alert.alert(
      'Delete listing',
      `Delete "${profile.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteProfileMutation.mutateAsync(profile.id);
          },
        },
      ],
    );
  };

  const onEditShopListing = (listing: ShopListing) => {
    haptic();
    openMarketWizard({ editId: listing.id });
  };

  const onDeleteShopListing = (listing: ShopListing) => {
    Alert.alert(
      'Remove listing',
      `Remove "${listing.title}" from CultureMarket? Buyers will no longer see it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void deleteShopListingMutation.mutateAsync(listing.id);
          },
        },
      ],
    );
  };

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CREATE_CATEGORIES.filter((item) => {
      if (!activeGroups.includes('all') && !activeGroups.includes(item.group)) return false;
      if (!q) return true;
      const haystack = `${item.label} ${item.purpose} ${item.description} ${item.aliases.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeGroups]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Culture Business Hub | CulturePass', headerShown: false }} />
      <LinearGradient
        colors={[CultureTokens.indigo + '12', CultureTokens.teal + '06', colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <HostspaceCreateTopChrome liveListingCount={liveListingCount} listingCountLoading={listingCountLoading} />

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: hPad,
            maxWidth: isDesktop ? 1280 : undefined,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(600)} style={styles.introBlock}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            First verify your host information, then create the community, association, organisation, business, venue,
            charity, government, council, club, or society that will own your events and listings.
          </Text>

          {/* Phase 1 Unification + Creator Trust callout: Rich profiles use the full guided wizard */}
          <View style={[styles.unificationCallout, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <LinearGradient
              colors={[CultureTokens.indigo, CultureTokens.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="shield-checkmark" size={14} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.unificationCalloutText, { color: colors.textSecondary }]}>
              Rich profiles use the guided 6-step creation wizard.
            </Text>
          </View>
        </Animated.View>

        <HostspaceCreateVerifyCard
          hostInfoVerified={hostInfoVerified}
          onToggleVerified={() => setHostInfoVerified((prev) => !prev)}
          hostInfoRows={hostInfoRows}
        />

        {showSelector && !isDesktop ? (
          <HostspaceCreateCategoryGrid
            categories={filteredCategories}
            activeGroups={activeGroups}
            onGroupToggle={toggleGroup}
            onSelect={selectCategory}
            query={query}
            onQueryChange={setQuery}
          />
        ) : (
          <View style={[styles.workspace, isDesktop && styles.workspaceDesktop]}>
            <HostspaceCreateCategorySidebar
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
              <HostspaceCreateListingsColumn
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
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingTop: 48,
    paddingBottom: 120,
    gap: 40,
  },
  scrollFlex: {
    flex: 1,
  },
  introBlock: {
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
    maxWidth: 600,
    opacity: 0.8,
  },
  workspace: {
    gap: 24,
  },
  workspaceDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },

  // Phase 1 Unification callout — sets clear expectation that rich profiles use the wizard
  unificationCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  unificationCalloutText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
