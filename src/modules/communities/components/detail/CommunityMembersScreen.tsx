import React, { useMemo, useState } from 'react';
import { useSafeBack } from '@/lib/navigation';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Head from 'expo-router/head';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { M3TopAppBar, M3Card } from '@/design-system/ui';
import { useCommunity, useCommunityMembers } from '@/modules/communities/hooks/useCommunities';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { getCommunityAccent, getCommunityMemberCount, getCommunityProfilePathId } from '@/lib/community';
import { siteUrl, canonicalCommunityPath, routeUser } from '@/lib/publicPaths';

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberItem = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  country?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haptic() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

function showUnavailableProfileNotice() {
  const message = 'This member has not set up a public profile yet.';
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
    return;
  }
  Alert.alert('Profile unavailable', message);
}

function memberMatchesSearch(m: MemberItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    m.name.toLowerCase().includes(q) ||
    (m.username?.toLowerCase().includes(q) ?? false) ||
    (m.city?.toLowerCase().includes(q) ?? false)
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MembersSkeleton({ topInset }: { topInset: number }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ height: 260 + topInset, backgroundColor: colors.backgroundSecondary }} />
      <View style={{ padding: 16, gap: 12 }}>
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} width="100%" height={68} borderRadius={14} />
        ))}
      </View>
    </View>
  );
}

function memberPublicProfileSegment(m: MemberItem): string | null {
  const uname = (m.username ?? '').trim();
  const uid = (m.id ?? '').trim();
  return uname || uid || null;
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberCard({
  item,
}: {
  item: MemberItem;
}) {
  const m3Colors = useM3Colors();
  const initials = item.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const meta = [
    item.username ? `@${item.username}` : null,
    item.city,
    item.country,
  ].filter(Boolean).join(' · ');
  const hrefSegment = memberPublicProfileSegment(item);
  const tappable = !!hrefSegment;
  const openProfile = () => {
    if (!hrefSegment) {
      showUnavailableProfileNotice();
      return;
    }
    haptic();
    router.push(routeUser({ id: hrefSegment, handle: hrefSegment, handleStatus: 'approved' }) as never);
  };

  return (
    <M3Card
      variant="outlined"
      onPress={openProfile}
      style={mc.card}
    >
      {/* Avatar */}
      <View style={[mc.avatar, { backgroundColor: m3Colors.primaryContainer }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[mc.initials, { color: m3Colors.onPrimaryContainer }]}>{initials}</Text>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[mc.name, M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={1}>{item.name}</Text>
        {meta ? (
          <Text style={[mc.meta, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>{meta}</Text>
        ) : (
          <Text style={[mc.meta, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>CulturePass member</Text>
        )}
      </View>

      {tappable && <Ionicons name="chevron-forward" size={16} color={m3Colors.onSurfaceVariant} />}
    </M3Card>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CommunityMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m3Colors = useM3Colors();
  const { isDesktop, hPad, windowSizeClass } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 30 : insets.bottom;
  const [search, setSearch] = useState('');
  const isExpanded = windowSizeClass === 'expanded';

  const communityQuery = useCommunity(id ?? '');
  const community = communityQuery.data;
  const docId = community?.id ?? '';
  const membersQuery = useCommunityMembers(docId, { enabled: !!docId });
  const members: MemberItem[] = useMemo(() => membersQuery.data?.members ?? [], [membersQuery.data]);

  const accent = useMemo(() => getCommunityAccent(community ?? {}), [community]);
  const pathId = community ? getCommunityProfilePathId(community) : id;
  const membersBackFallback = `/c/${pathId ?? id ?? ''}`;
  const handleHeroBack = useSafeBack(membersBackFallback);
  const totalCount = getCommunityMemberCount(community ?? {});

  const filtered = useMemo(() => members.filter((m) => memberMatchesSearch(m, search)), [members, search]);

  const pageUrl = community ? siteUrl(`${canonicalCommunityPath(community)}/members`) : '';
  const isLoading = communityQuery.isLoading || (membersQuery.isLoading && !!docId);

  if (isLoading) return <MembersSkeleton topInset={topInset} />;

  return (
    <ErrorBoundary>
      {community && (
        <Head>
          <title>{`${community.name} Members | CulturePass`}</title>
          <meta name="description" content={`Meet the members of ${community.name} on CulturePass.`} />
          {pageUrl ? <link rel="canonical" href={pageUrl} /> : null}
        </Head>
      )}

      <View style={[s.root, { backgroundColor: m3Colors.background }]}>
        <M3TopAppBar
            title="Members"
            onBack={handleHeroBack}
            variant={isExpanded ? 'large' : 'medium'}
            titleLeading={
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
                contentFit="contain"
              />
            }
            actions={[
                { icon: 'share-outline', onPress: () => {} }
            ]}
        />
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={[s.hero, { height: isExpanded ? 280 : 220 }]}>
          {community?.coverImageUrl ? (
            <Image
              pointerEvents="none"
              source={{ uri: community.coverImageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              pointerEvents="none"
              colors={[accent, m3Colors.surfaceContainerLowest]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Content */}
          <View style={[s.heroBody, { paddingHorizontal: hPad }]}>
            <Text style={[s.heroTitle, M3Typography.headlineLarge, { color: '#fff' }]}>Members</Text>
            <Text style={[s.heroSub, M3Typography.bodyLarge, { color: 'rgba(255,255,255,0.8)' }]}>
              {community?.name ?? 'Community'}{totalCount > 0 ? ` · ${totalCount.toLocaleString()} total` : ''}
            </Text>

            <View style={s.heroStats}>
              <View style={s.heroStat}>
                <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={[s.heroStatText, M3Typography.labelSmall, { color: 'rgba(255,255,255,0.82)' }]}>{members.length} visible</Text>
              </View>
              <View style={[s.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={s.heroStat}>
                <Ionicons name="sparkles-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={[s.heroStatText, M3Typography.labelSmall, { color: 'rgba(255,255,255,0.82)' }]}>Culture-led network</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <View style={[s.searchRow, { paddingHorizontal: hPad, backgroundColor: m3Colors.background }]}>
          <View style={[s.searchBox, { backgroundColor: m3Colors.surfaceContainerHigh, borderWidth: 0, height: 56, borderRadius: 28 }]}>
            <Ionicons name="search" size={24} color={m3Colors.onSurfaceVariant} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search members…"
              placeholderTextColor={m3Colors.onSurfaceVariant}
              style={[s.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {search.length > 0 && Platform.OS !== 'ios' && (
              <Pressable onPress={() => setSearch('')} hitSlop={10}>
                <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Member list ──────────────────────────────────────────────── */}
        {membersQuery.isLoading && !!docId ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator color={m3Colors.primary} />
            <Text style={[s.loaderText, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Loading members…</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              s.listContent,
              { paddingHorizontal: hPad, paddingBottom: bottomInset + 28 },
              isDesktop && s.listContentDesktop,
            ]}
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop' : 'mobile'}
            columnWrapperStyle={isDesktop ? { gap: 12 } : undefined}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <View style={isDesktop ? { flex: 1 } : undefined}>
                <MemberCard item={item} />
              </View>
            )}
            ListEmptyComponent={<M3Card variant="outlined" style={es.wrap}>
                <Ionicons name={search ? 'search-outline' : 'people-outline'} size={42} color={m3Colors.onSurfaceVariant} />
                <Text style={[es.title, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{search ? 'No results found' : 'No visible members yet'}</Text>
                <Text style={[es.sub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                    {search ? `No members match "${search}".` : 'Members will appear here as people join.'}
                </Text>
            </M3Card>}
            onRefresh={() => membersQuery.refetch()}
            refreshing={membersQuery.isRefetching}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: { minHeight: 220, overflow: 'hidden', paddingBottom: 24, justifyContent: 'center' },
  heroNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  heroNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.3)',
    maxWidth: 240,
  },
  heroNavAvatar: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  heroNavAvatarText: { fontSize: 12, fontFamily: FontFamily.bold },
  heroNavName: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#fff' },
  heroBody: { alignItems: 'center' },
  heroKicker: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroTitle: { color: '#fff' },
  heroSub: { marginTop: 4, color: 'rgba(255,255,255,0.8)' },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
  },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { color: 'rgba(255,255,255,0.82)' },
  heroStatDivider: { width: 1, height: 14 },

  // Search
  searchRow: { paddingTop: 16, paddingBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 56,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  resultCount: { fontSize: 12, fontFamily: FontFamily.medium, paddingHorizontal: 4 },

  // Loader
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { },

  // List
  listContent: { paddingTop: 10 },
  listContentDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%' },
});

// ─── Member card styles ────────────────────────────────────────────────────────

const mc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 20, fontFamily: FontFamily.bold },
  name: {},
  meta: {},
});

const es = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
    marginTop: 24,
    gap: 12,
  },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center' },
});
