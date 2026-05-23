import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { M3Typography } from '@/design-system/tokens/theme';
import { M3Button } from '@/design-system/ui/M3Button';
import type { EventData } from '@/shared/schema';

interface DetailsSectionProps {
  event: EventData;
  countdown: { ended: boolean; days: number; hours: number; minutes: number } | null;
  capacityPercent: number;
  distanceKm: number | null;
  cultureTags: string[];
  languageTags: string[];
  accessibilityTags: string[];
  artistSummary: string | string[] | null;
  sponsorNames: string[];
  isPlus: boolean;
  colors: ColorTheme;
  s?: Record<string, unknown>;
  displayCategory?: string;
  displayCommunity?: string;
  description?: string;
  openMap?: () => void;
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const m3Colors = useM3Colors();
  return (
    <View style={ds.row}>
      <View style={[ds.iconCircle, { backgroundColor: m3Colors.primaryContainer }]}>
        <Ionicons name={icon} size={18} color={m3Colors.onPrimaryContainer} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[ds.label, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
        <Text style={[ds.value, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{value}</Text>
      </View>
    </View>
  );
}

export function DetailsSection({
  event,
  countdown,
  capacityPercent,
  distanceKm,
  cultureTags,
  openMap,
  description,
}: DetailsSectionProps) {
  const m3Colors = useM3Colors();
  const venue = event.venue ?? '';
  const date = event.date ?? '';
  const time = event.time ?? '';
  const address = event.address ?? '';

  const countdownStr = countdown
    ? countdown.ended ? 'Event has ended' : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
    : null;

  return (
    <View style={ds.container}>
      {description ? (
        <Text style={[ds.description, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>
          {description}
        </Text>
      ) : null}

      <View style={ds.grid}>
        {date ? <Row icon="calendar-outline" label="Date" value={`${date}${time ? ` at ${time}` : ''}`} /> : null}
        {venue ? (
          <View style={{ gap: 12 }}>
            <Row icon="location-outline" label="Venue" value={`${venue}${address ? `, ${address}` : ''}`} />
            {openMap && (
              <View style={{ marginLeft: 52 }}>
                <M3Button
                    variant="tonal"
                    leftIcon="map-outline"
                    onPress={openMap}
                >
                    View on Map
                </M3Button>
              </View>
            )}
          </View>
        ) : null}
        {countdownStr ? <Row icon="timer-outline" label="Starts in" value={countdownStr} /> : null}
        {capacityPercent > 0 ? <Row icon="people-outline" label="Capacity" value={`${capacityPercent}% filled`} /> : null}
        {distanceKm != null ? <Row icon="navigate-outline" label="Distance" value={`${distanceKm.toFixed(1)} km away`} /> : null}
        {cultureTags.length > 0 ? <Row icon="globe-outline" label="Culture" value={cultureTags.join(', ')} /> : null}
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  container: { gap: 24 },
  description: {
    lineHeight: 24,
  },
  grid: { gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: {},
});
