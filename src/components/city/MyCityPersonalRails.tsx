import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { M3Button, M3Card, M3SectionHeader } from '@/design-system/ui';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { M3CommunityCard } from '@/modules/communities/components/M3CommunityCard';
import { M3Typography, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { useM3Colors } from '@/hooks/useM3Colors';
import { PopularEventsRail } from '@/components/city/PopularEventsRail';
import type { Community, EventData } from '@/shared/schema';

const ORBIT_CARD_W = 260;
const COMMUNITY_CARD_W = 280;

interface MyCityPersonalRailsProps {
  hPad: number;
  cityName: string;
  cityCountry: string;
  orbitIds: string[];
  orbitEvents: EventData[];
  exploreNearby: Community[];
  compact?: boolean;
}

function EmptyOrbitCard({ onDiscover }: { onDiscover: () => void }) {
  const m3Colors = useM3Colors();
  return (
    <M3Card variant="filled" style={s.emptyOrbit}>
      <View style={[s.emptyIcon, { backgroundColor: Luxe.colors.indigo + '18' }]}>
        <Ionicons name="people-outline" size={24} color={Luxe.colors.indigo} />
      </View>
      <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface, textAlign: 'center' }]}>Connect with hubs</Text>
      <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>
        Join communities to see their events in your orbit.
      </Text>
      <M3Button variant="tonal" onPress={onDiscover} style={{ marginTop: 8 }}>
        Find hubs
      </M3Button>
    </M3Card>
  );
}

export function MyCityPersonalRails({
  hPad,
  cityName,
  cityCountry,
  orbitIds,
  orbitEvents,
  exploreNearby,
  compact = false,
}: MyCityPersonalRailsProps) {
  const m3Colors = useM3Colors();
  const pad = compact ? 0 : hPad;

  return (
    <View style={s.wrap}>
      <Animated.View entering={FadeInDown.delay(120).springify()} style={s.block}>
        <View style={{ paddingHorizontal: pad }}>
          <M3SectionHeader
            title="From your orbit"
            subtitle="Updates from communities you follow"
            onAction={() => router.push('/(tabs)/calendar')}
          />
        </View>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.row, { paddingHorizontal: pad, paddingRight: pad + 32 }]}
        >
          {orbitIds.length === 0 ? (
            <EmptyOrbitCard onDiscover={() => router.push('/(tabs)/community')} />
          ) : orbitEvents.length === 0 ? (
            <M3Card variant="filled" style={s.emptyOrbit}>
              <Ionicons name="calendar-outline" size={32} color={m3Colors.onSurfaceVariant} />
              <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]}>Quiet in your orbit</Text>
              <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>
                No upcoming events from your hubs right now.
              </Text>
            </M3Card>
          ) : (
            orbitEvents.map((ev) => (
              <View key={ev.id} style={{ width: ORBIT_CARD_W }}>
                <M3EventCard event={ev} variant="elevated" />
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>

      <PopularEventsRail city={cityName} country={cityCountry} hPad={pad} />

      {exploreNearby.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(180).springify()} style={s.block}>
          <View style={{ paddingHorizontal: pad }}>
            <M3SectionHeader
              title="Nearby hubs"
              subtitle="Local groups in your city"
              onAction={() => router.push('/(tabs)/community')}
            />
          </View>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.row, { paddingHorizontal: pad, paddingRight: pad + 32 }]}
          >
            {exploreNearby.map((c) => (
              <View key={c.id} style={{ width: COMMUNITY_CARD_W }}>
                <M3CommunityCard community={c} />
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 20 },
  block: { gap: 8 },
  row: { gap: 16, paddingVertical: 8 },
  emptyOrbit: { width: ORBIT_CARD_W, padding: 24, alignItems: 'center', gap: 12 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});