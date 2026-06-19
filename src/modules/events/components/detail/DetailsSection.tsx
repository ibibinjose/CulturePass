import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { M3Typography } from '@/design-system/tokens/theme';
import { M3Button } from '@/design-system/ui/M3Button';
import type { EventData } from '@/shared/schema';
import {
  DISPLAY_FALLBACK,
  displayOrFallback,
  formatEventLocation,
  isFallbackValue,
  joinDisplayParts,
} from '@/lib/presentation';

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

function Row({
  icon,
  label,
  value,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  muted?: boolean;
}) {
  const m3Colors = useM3Colors();
  return (
    <View style={ds.row}>
      <View style={[ds.iconCircle, { backgroundColor: m3Colors.primaryContainer }]}>
        <Ionicons name={icon} size={18} color={m3Colors.onPrimaryContainer} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[ds.label, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
        <Text
          style={[
            ds.value,
            M3Typography.titleSmall,
            { color: muted ? m3Colors.onSurfaceVariant : m3Colors.onSurface },
            muted && ds.valueFallback,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function formatArtistSummary(summary: string | string[] | null): string {
  if (Array.isArray(summary)) {
    const clean = summary.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
    return clean.length > 0 ? clean.join(', ') : '';
  }
  return typeof summary === 'string' ? summary.trim() : '';
}

export function DetailsSection({
  event,
  countdown,
  capacityPercent,
  distanceKm,
  cultureTags,
  languageTags,
  accessibilityTags,
  artistSummary,
  sponsorNames,
  displayCategory,
  displayCommunity,
  openMap,
  description,
}: DetailsSectionProps) {
  const m3Colors = useM3Colors();

  const datePart = displayOrFallback(event.date, DISPLAY_FALLBACK.date);
  const timePart = event.time?.trim();
  const dateValue = joinDisplayParts(
    [datePart, timePart ? `at ${timePart}` : null],
    ' ',
    DISPLAY_FALLBACK.date,
  );
  const dateMuted = isFallbackValue(datePart, DISPLAY_FALLBACK.date);

  const locationValue = formatEventLocation(event, { includeAddress: true });
  const locationMuted = isFallbackValue(locationValue, DISPLAY_FALLBACK.location);
  const hasMappableLocation = Boolean(event.venue || event.address || event.city);

  const countdownStr = countdown
    ? countdown.ended
      ? 'Event has ended'
      : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
    : DISPLAY_FALLBACK.notListed;

  const capacityValue =
    capacityPercent > 0 ? `${capacityPercent}% filled` : DISPLAY_FALLBACK.notListed;

  const distanceValue =
    distanceKm != null ? `${distanceKm.toFixed(1)} km away` : DISPLAY_FALLBACK.notListed;

  const cultureValue = cultureTags.length > 0 ? cultureTags.join(', ') : DISPLAY_FALLBACK.notListed;
  const languageValue = languageTags.length > 0 ? languageTags.join(', ') : DISPLAY_FALLBACK.notListed;
  const accessibilityValue =
    accessibilityTags.length > 0 ? accessibilityTags.join(', ') : DISPLAY_FALLBACK.notListed;

  const artistValue = displayOrFallback(formatArtistSummary(artistSummary), DISPLAY_FALLBACK.notListed);
  const sponsorValue =
    sponsorNames.length > 0 ? sponsorNames.join(', ') : DISPLAY_FALLBACK.notListed;

  const categoryValue = displayOrFallback(displayCategory, DISPLAY_FALLBACK.category);
  const communityValue = displayOrFallback(displayCommunity, DISPLAY_FALLBACK.community);

  const descriptionText = description?.trim();

  return (
    <View style={ds.container}>
      <Text
        style={[
          ds.description,
          M3Typography.bodyLarge,
          {
            color: descriptionText ? m3Colors.onSurfaceVariant : m3Colors.outline,
            fontStyle: descriptionText ? 'normal' : 'italic',
          },
        ]}
      >
        {descriptionText || 'No event description yet — organisers may add more details closer to the date.'}
      </Text>

      <View style={ds.grid}>
        <Row icon="calendar-outline" label="Date" value={dateValue} muted={dateMuted} />

        <View style={{ gap: 12 }}>
          <Row icon="location-outline" label="Location" value={locationValue} muted={locationMuted} />
          {openMap && hasMappableLocation ? (
            <View style={{ marginLeft: 52 }}>
              <M3Button variant="tonal" leftIcon="map-outline" onPress={openMap}>
                View on Map
              </M3Button>
            </View>
          ) : null}
        </View>

        <Row
          icon="timer-outline"
          label="Starts in"
          value={countdownStr}
          muted={countdownStr === DISPLAY_FALLBACK.notListed}
        />
        <Row
          icon="people-outline"
          label="Capacity"
          value={capacityValue}
          muted={capacityPercent <= 0}
        />
        <Row
          icon="navigate-outline"
          label="Distance"
          value={distanceValue}
          muted={distanceKm == null}
        />
        <Row
          icon="globe-outline"
          label="Culture"
          value={cultureValue}
          muted={cultureTags.length === 0}
        />
        <Row
          icon="language-outline"
          label="Languages"
          value={languageValue}
          muted={languageTags.length === 0}
        />
        <Row
          icon="accessibility-outline"
          label="Accessibility"
          value={accessibilityValue}
          muted={accessibilityTags.length === 0}
        />
        <Row
          icon="musical-notes-outline"
          label="Artists"
          value={artistValue}
          muted={artistValue === DISPLAY_FALLBACK.notListed}
        />
        <Row
          icon="ribbon-outline"
          label="Sponsors"
          value={sponsorValue}
          muted={sponsorNames.length === 0}
        />
        <Row icon="pricetag-outline" label="Category" value={categoryValue} muted={!displayCategory?.trim()} />
        <Row
          icon="people-circle-outline"
          label="Community"
          value={communityValue}
          muted={!displayCommunity?.trim()}
        />
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
  valueFallback: { fontStyle: 'italic' },
});