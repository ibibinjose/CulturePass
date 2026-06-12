import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { M3Button, M3Card, M3SectionHeader } from '@/design-system/ui';
import { M3CommunityCard } from '@/modules/communities/components/M3CommunityCard';
import { M3Typography } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { Community } from '@/shared/schema';

const CARD_W = 272;

interface RailProps {
  title: string;
  subtitle: string;
  communities: Community[];
  hPad: number;
  compact?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyCta?: string;
  onEmptyPress?: () => void;
}

function CommunityRail({
  title,
  subtitle,
  communities,
  hPad,
  compact = false,
  emptyTitle,
  emptyBody,
  emptyCta,
  onEmptyPress,
}: RailProps) {
  const m3Colors = useM3Colors();
  const pad = compact ? 0 : hPad;

  if (communities.length === 0 && !emptyTitle) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={s.block}>
      <View style={{ paddingHorizontal: pad }}>
        <M3SectionHeader title={title} subtitle={subtitle} />
      </View>
      {communities.length === 0 ? (
        <M3Card variant="outlined" style={[s.emptyCard, { marginHorizontal: pad }]}>
          <Ionicons name="people-outline" size={32} color={m3Colors.onSurfaceVariant} />
          <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface, textAlign: 'center' }]}>{emptyTitle}</Text>
          {emptyBody ? (
            <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>{emptyBody}</Text>
          ) : null}
          {emptyCta && onEmptyPress ? (
            <M3Button variant="tonal" onPress={onEmptyPress} style={{ marginTop: 4 }}>
              {emptyCta}
            </M3Button>
          ) : null}
        </M3Card>
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.row, { paddingHorizontal: pad, paddingRight: pad + 32 }]}
        >
          {communities.map((c) => (
            <View key={c.id} style={{ width: CARD_W }}>
              <M3CommunityCard community={c} variant="elevated" />
            </View>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

interface CommunityHubRailsProps {
  hPad: number;
  joined: Community[];
  following: Community[];
  recommended: Community[];
  compact?: boolean;
}

export function CommunityHubRails({ hPad, joined, following, recommended, compact = false }: CommunityHubRailsProps) {
  return (
    <View style={s.wrap}>
      <CommunityRail
        title="Your hubs"
        subtitle={`${joined.length} joined`}
        communities={joined.slice(0, 8)}
        hPad={hPad}
        compact={compact}
        emptyTitle="No hubs yet"
        emptyBody="Join cultural communities to see their events and updates here."
        emptyCta="Discover hubs"
        onEmptyPress={() => router.push('/(tabs)/community')}
      />
      <CommunityRail
        title="Following"
        subtitle="Hubs you follow without joining"
        communities={following.slice(0, 6)}
        hPad={hPad}
        compact={compact}
      />
      <CommunityRail
        title="Recommended for you"
        subtitle="Based on your culture interests"
        communities={recommended.slice(0, 6)}
        hPad={hPad}
        compact={compact}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 20 },
  block: { gap: 8 },
  row: { gap: 14, paddingVertical: 8 },
  emptyCard: { padding: 24, alignItems: 'center', gap: 10, marginBottom: 8 },
});