/**
 * Admin Communities Directory
 * ============================
 * Browse all communities on the platform. Follows the same visual patterns
 * as admin/users.tsx: header with title + count pill, GlassView list rows,
 * loading / empty / error states.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, FontFamily } from '@/design-system/tokens/theme';
import { CultureTokens } from '@/design-system/tokens/colors';
import { GlassView } from '@/design-system/ui/GlassView';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Community } from '@/shared/schema';

export default function AdminCommunitiesScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const contentPad = isDesktop ? Math.max(14, hPad - 12) : hPad;

  const { data: communities, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'communities'],
    queryFn: () => api.communities.list(),
  });

  const list = communities ?? [];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
        </View>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading communities…</Text>
        </View>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
        </View>
        <View style={styles.centeredState}>
          <Ionicons name="cloud-offline-outline" size={48} color={CultureTokens.coral} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Failed to load communities</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Check your connection and try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityLabel="Retry loading communities"
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
          <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontSize: 11, fontFamily: FontFamily.bold }}>
              {list.length} LOADED
            </Text>
          </View>
        </View>
      </View>

      {/* List */}
      <View style={[styles.body, { paddingHorizontal: contentPad }]}>
        <FlatList<Community>
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: isDesktop ? 8 : 12, paddingVertical: isDesktop ? 12 : 20 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-circle-outline" size={56} color={colors.textTertiary} />
              <Text style={[styles.stateTitle, { color: colors.text }]}>No communities found</Text>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                There are no communities registered on the platform yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => <CommunityRow community={item} colors={colors} />}
        />
      </View>
    </View>
  );
}

// ── Community row ────────────────────────────────────────────────────────────

interface CommunityRowProps {
  community: Community;
  colors: ReturnType<typeof useColors>;
}

function CommunityRow({ community, colors }: CommunityRowProps) {
  const entityLabel = community.entityType
    ? community.entityType.charAt(0).toUpperCase() + community.entityType.slice(1)
    : 'Community';

  const locationParts = [community.city, community.country].filter(Boolean);
  const locationLabel = locationParts.length > 0 ? locationParts.join(', ') : null;

  const memberCount = community.memberCount ?? community.membersCount;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Community: ${community.name}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
    >
      <GlassView contentStyle={styles.rowContent}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: CultureTokens.violet + '18' }]}>
          <Ionicons name="people-circle" size={24} color={CultureTokens.violet} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.communityName, { color: colors.text }]} numberOfLines={1}>
            {community.name}
          </Text>
          {locationLabel ? (
            <Text style={[styles.communityLocation, { color: colors.textTertiary }]} numberOfLines={1}>
              {locationLabel}
            </Text>
          ) : null}
          {memberCount != null ? (
            <Text style={[styles.communityMeta, { color: colors.textSecondary }]}>
              {memberCount.toLocaleString()} members
            </Text>
          ) : null}
        </View>

        {/* Entity type badge */}
        <View style={[styles.entityBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.entityBadgeText, { color: colors.primary }]}>
            {entityLabel.toUpperCase()}
          </Text>
        </View>
      </GlassView>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    minHeight: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    gap: 20,
    flexWrap: 'wrap',
    paddingVertical: Platform.OS === 'web' ? 8 : 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  countPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  body: { flex: 1 },

  rowContent: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityName: { fontSize: 15, fontFamily: FontFamily.bold },
  communityLocation: { fontSize: 12, fontFamily: FontFamily.medium },
  communityMeta: { fontSize: 12, fontFamily: FontFamily.medium },
  entityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  entityBadgeText: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.5 },

  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 60,
    opacity: 0.7,
  },
  stateTitle: { fontSize: 18, fontFamily: FontFamily.bold, textAlign: 'center' },
  stateText: { fontSize: 14, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 20 },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: FontFamily.bold },
});
