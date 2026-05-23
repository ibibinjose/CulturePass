import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { useLayout } from '@/hooks/useLayout';
import { useM3Colors } from '@/hooks/useM3Colors';
import { modulesApi } from '@/modules/api';
import { M3Card } from '@/design-system/ui';
import { FontFamily } from '@/design-system/tokens/theme';

type InlineSearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  route: string;
  isVerified?: boolean;
  attending?: number;
};

interface InlineSearchResultsProps {
  query: string;
  city: string;
  country: string;
}

export function InlineSearchResults({ query, city, country }: InlineSearchResultsProps) {
  const m3Colors = useM3Colors();
  const { hPad } = useLayout();

  const { data, isLoading } = useQuery({
    queryKey: ['discover-inline-search', query, city, country],
    queryFn: async () => {
      const res = await modulesApi.search.query({
        q: query,
        city: city || undefined,
        country: country || undefined,
        pageSize: 20,
      });
      const results: InlineSearchResult[] = [];
      for (const e of res.events ?? []) {
        results.push({
          id: e.id,
          type: 'Event',
          title: e.title,
          subtitle: [e.city, e.date].filter(Boolean).join(' · '),
          route: `/e/${e.id}`,
          isVerified: (e.organizerReputationScore ?? 0) > 0 || e.isFeatured,
          attending: e.attending || e.rsvpGoing,
        });
      }
      for (const p of res.profiles ?? []) {
        results.push({
          id: p.id,
          type: p.entityType ?? 'Profile',
          title: p.name,
          subtitle: p.city ?? '',
          route: `/profile/${p.id}`,
          isVerified: p.isVerified,
        });
      }
      for (const m of res.movies ?? []) {
        results.push({
          id: m.id,
          type: 'Movie',
          title: m.title,
          subtitle: Array.isArray(m.genre) ? m.genre.join(', ') : m.genre ?? '',
          route: `/movies/${m.id}`,
        });
      }
      return results;
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  if (query.trim().length < 2) {
    return (
      <View style={[fs.emptyWrap, { paddingHorizontal: hPad }]}>
        <Ionicons name="search-outline" size={36} color={m3Colors.onSurfaceVariant} />
        <Text style={[fs.emptyText, { color: m3Colors.onSurfaceVariant }]}>
          Type at least 2 characters to search
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[fs.emptyWrap, { paddingHorizontal: hPad }]}>
        <ActivityIndicator size="small" color={m3Colors.primary} />
        <Text style={[fs.emptyText, { color: m3Colors.onSurfaceVariant }]}>Searching...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={[fs.emptyWrap, { paddingHorizontal: hPad }]}>
        <Ionicons name="alert-circle-outline" size={36} color={m3Colors.onSurfaceVariant} />
        <Text style={[fs.emptyText, { color: m3Colors.onSurfaceVariant }]}>
          No results for &ldquo;{query}&rdquo;
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: hPad, gap: 10, paddingTop: 16 }}>
      <Text style={[fs.count, { color: m3Colors.onSurfaceVariant }]}>
        {data.length} result{data.length !== 1 ? 's' : ''}
      </Text>
      {data.map((item, i) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(Math.min(i * 40, 300)).springify().damping(18)}
        >
          <M3Card
            variant="filled"
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.route as never);
            }}
            style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={[fs.typeBadge, { backgroundColor: m3Colors.primaryContainer }]}>
              <Text style={[fs.typeText, { color: m3Colors.onPrimaryContainer }]}>
                {item.type.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[fs.title, { color: m3Colors.onSurface }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color={m3Colors.primary} />
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.subtitle ? (
                  <Text style={[fs.sub, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
                {!!item.attending && item.attending > 0 && (
                  <>
                    <Text style={[fs.sub, { color: m3Colors.onSurfaceVariant }]}>·</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="people" size={12} color={m3Colors.onSurfaceVariant} />
                      <Text style={[fs.sub, { color: m3Colors.onSurfaceVariant }]}>
                        {item.attending.toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View style={[fs.typePill, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
              <Text style={[fs.typePillText, { color: m3Colors.onSurfaceVariant }]}>{item.type}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={m3Colors.onSurfaceVariant} />
          </M3Card>
        </Animated.View>
      ))}
    </View>
  );
}

const fs = StyleSheet.create({
  emptyWrap: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 14, fontFamily: FontFamily.regular, textAlign: 'center' },
  count: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 4,
  },
  typeBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  typeText: { fontSize: 16, fontFamily: FontFamily.bold },
  title: { fontSize: 15, fontFamily: FontFamily.semibold },
  sub: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 1 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  typePillText: { fontSize: 10, fontFamily: FontFamily.semibold, textTransform: 'uppercase' },
});
