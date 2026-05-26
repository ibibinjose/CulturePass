/**
 * Network Screen — Professional social graph and connections UI.
 * Upgraded with Liquid Glass and high-fidelity interactions.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { api, type SocialUserMini } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, FontFamily } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { GlassView } from '@/design-system/ui/GlassView';
import { useSafeBack } from '@/lib/navigation';

type Segment = 'added' | 'followers' | 'following' | 'suggestions';

function normalizeTab(raw: string | undefined): Segment {
  const t = (raw ?? '').toLowerCase();
  if (t === 'added' || t === 'inbound') return 'added';
  if (t === 'followers') return 'followers';
  if (t === 'following') return 'following';
  if (t === 'suggestions' || t === 'foryou' || t === 'discover') return 'suggestions';
  return 'followers';
}

function avatarLetters(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0]![0]! + p[1]![0]!).toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
}

export default function NetworkScreen() {
  const colors = useColors();
  const goBack = useSafeBack();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 26 : insets.bottom;
  const { tab } = useLocalSearchParams<{ tab?: string | string[] }>();
  const [segment, setSegment] = useState<Segment>('followers');
  const queryClient = useQueryClient();

  useEffect(() => {
    const raw = Array.isArray(tab) ? tab[0] : tab;
    if (raw) setSegment(normalizeTab(raw));
  }, [tab]);

  const inboundQ = useQuery({
    queryKey: ['social', 'contact-inbound'],
    queryFn: () => api.social.contactInbound(50),
  });
  const followersQ = useQuery({
    queryKey: ['social', 'followers'],
    queryFn: () => api.social.followers(100),
  });
  const followingQ = useQuery({
    queryKey: ['social', 'following-users'],
    queryFn: () => api.social.followingUsers(100),
  });
  const suggestQ = useQuery({
    queryKey: ['social', 'suggestions'],
    queryFn: () => api.social.suggestions(24),
  });

  const followingSet = useMemo(() => {
    const users = followingQ.data?.users ?? [];
    return new Set(users.map((u) => u.id));
  }, [followingQ.data?.users]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['social'] }),
    ]);
  }, [queryClient]);

  const followMut = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      if (action === 'follow') await api.social.follow('user', userId);
      else await api.social.unfollow('user', userId);
    },
    onSuccess: async () => {
      await refresh();
    },
  });

  const onToggleFollow = useCallback(
    (userId: string, isFollowing: boolean) => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      followMut.mutate({ userId, action: isFollowing ? 'unfollow' : 'follow' });
    },
    [followMut],
  );

  const currentLoading =
    segment === 'added'
      ? inboundQ.isLoading
      : segment === 'followers'
        ? followersQ.isLoading
        : segment === 'following'
          ? followingQ.isLoading
          : suggestQ.isLoading;

  const refreshing =
    inboundQ.isFetching || followersQ.isFetching || followingQ.isFetching || suggestQ.isFetching;

  const emptyHint =
    segment === 'added'
      ? 'When someone saves your contact, they appear here.'
      : segment === 'followers'
        ? 'Accounts following you will show up here.'
        : segment === 'following'
          ? 'Accounts you follow appear here.'
          : 'Members from your city will be suggested here.';

  type RowModel = { key: string; user: SocialUserMini; savedAt?: string };

  const flatData: RowModel[] = useMemo(() => {
    if (segment === 'added') {
      return (inboundQ.data?.items ?? []).map((it) => ({
        key: it.user.id + it.createdAt,
        user: it.user,
        savedAt: it.createdAt,
      }));
    }
    if (segment === 'followers') {
      return (followersQ.data?.users ?? []).map((u) => ({ key: u.id, user: u }));
    }
    if (segment === 'following') {
      return (followingQ.data?.users ?? []).map((u) => ({ key: u.id, user: u }));
    }
    return (suggestQ.data?.users ?? []).map((u) => ({ key: u.id, user: u }));
  }, [segment, inboundQ.data?.items, followersQ.data?.users, followingQ.data?.users, suggestQ.data?.users]);

  const renderItem = useCallback(
    ({ item, index }: { item: RowModel, index: number }) => {
      const u = item.user;
      const isFollowing = followingSet.has(u.id);
      const showFollow = segment === 'followers' || segment === 'added' || segment === 'suggestions';
      const handle = u.handle ? `@${u.handle}` : u.username ? `@${u.username}` : 'Member';

      return (
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(index * 40).springify()}>
          <GlassView style={styles.rowOuter} contentStyle={{ padding: 0 }}>
            <Pressable
              onPress={() => router.push(`/user/${u.id}`)}
              style={({ pressed }) => [styles.rowInner, pressed && { backgroundColor: colors.primarySoft }]}
            >
              <View style={[styles.avatarWrap, { backgroundColor: colors.primarySoft }]}>
                {u.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{avatarLetters(u.displayName)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.rowBody}>
                <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{u.displayName}</Text>
                <Text style={[styles.rowHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {handle}{u.city ? ` · ${u.city}` : ''}
                </Text>
                {item.savedAt && (
                   <View style={styles.rowMetaBadge}>
                     <Ionicons name="checkmark-circle" size={10} color={CultureTokens.teal} />
                     <Text style={[styles.rowMeta, { color: CultureTokens.teal }]}>
                       Saved you · {new Date(item.savedAt).toLocaleDateString()}
                     </Text>
                   </View>
                )}
              </View>

              {showFollow && (
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  size="sm"
                  loading={followMut.isPending && followMut.variables?.userId === u.id}
                  onPress={() => onToggleFollow(u.id, isFollowing)}
                  style={styles.followBtn}
                  labelStyle={{ fontSize: 13 }}
                >
                  {isFollowing ? 'Following' : segment === 'followers' || segment === 'added' ? 'Follow back' : 'Follow'}
                </Button>
              )}
            </Pressable>
          </GlassView>
        </Animated.View>
      );
    },
    [colors, followingSet, followMut, onToggleFollow, segment, reducedMotion],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <GlassView
        intensity={20}
        style={[
            styles.header,
            {
                paddingTop: topInset + 16,
                backgroundColor: colors.background + 'B3',
                borderBottomColor: colors.borderLight,
                borderBottomWidth: 1,
            }
        ]}
      >
        <View style={[styles.headerContent, { paddingHorizontal: 16 }, { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
            <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.headBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
            >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
            <View style={styles.headerTitleBlock}>
                <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>SOCIAL GRAPH</Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Circle</Text>
            </View>
            <Pressable
                onPress={() => router.push('/search/index')}
                style={({ pressed }) => [styles.headBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
            >
                <Ionicons name="search" size={20} color={colors.primary} />
            </Pressable>
        </View>

        <View style={[styles.segmentContainer, { paddingHorizontal: 16 }, { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
            <GlassView intensity={10} style={[styles.segmentRow, { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.borderLight, borderWidth: 1 }]}>
               {(['added', 'followers', 'following', 'suggestions'] as Segment[]).map((id) => {
                 const active = segment === id;
                 const labels = { added: 'Added', followers: 'Followers', following: 'Following', suggestions: 'For you' };
                 return (
                   <Pressable
                     key={id}
                     onPress={() => { setSegment(id); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
                     style={[styles.segmentPill, active && { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 }]}
                   >
                     <Text style={[styles.segmentLabel, { color: active ? colors.text : colors.textTertiary, fontFamily: active ? FontFamily.bold : FontFamily.medium }]}>{labels[id]}</Text>
                   </Pressable>
                 );
               })}
            </GlassView>
        </View>
      </GlassView>

      <View style={styles.flex}>
        {currentLoading && !flatData.length ? (
          <View style={[styles.loading, { paddingHorizontal: 16 }, { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={80} borderRadius={20} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={flatData}
            keyExtractor={(i) => i.key}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
            }
            contentContainerStyle={[
              styles.listContent,
              { paddingHorizontal: 16, paddingBottom: bottomInset + 100 },
              { maxWidth: 800, alignSelf: 'center', width: '100%' }
            ]}
            ListEmptyComponent={
              <View style={styles.empty}>
                 <GlassView contentStyle={{ padding: 40, alignItems: 'center', gap: 16 }}>
                    <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="people" size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing to show</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyHint}</Text>
                 </GlassView>
              </View>
            }
            renderItem={renderItem}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingBottom: 16,
    zIndex: 10,
    gap: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.5, opacity: 0.8 },
  headBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  segmentContainer: {},
  segmentRow: { flexDirection: 'row', padding: 4, borderRadius: 16, gap: 4 },
  segmentPill: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontSize: 13 },

  listContent: { paddingTop: 24 },
  rowOuter: { marginBottom: 12 },
  rowInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  avatarWrap: { width: 56, height: 56, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  avatarText: { fontSize: 20, fontFamily: FontFamily.bold },
  rowBody: { flex: 1, gap: 3 },
  rowName: { fontSize: 16, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  rowHandle: { fontSize: 13, fontFamily: FontFamily.medium, opacity: 0.9 },
  rowMetaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rowMeta: { fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  followBtn: { minWidth: 104, height: 40 },

  loading: { paddingTop: 32 },
  empty: { paddingTop: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  emptyText: { fontSize: 15, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
});
