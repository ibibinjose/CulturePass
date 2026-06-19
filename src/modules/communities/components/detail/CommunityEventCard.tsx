import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useM3Colors } from '@/hooks/useM3Colors';
import { pressableA11yRole } from '@/lib/webPressable';

import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { formatEventTime } from '@/lib/dateUtils';
import { routeEvent } from '@/lib/publicPaths';
import { withAlpha } from '@/lib/withAlpha';
import type { EventData } from '@/shared/schema';
import { getEventCoverImageUrl } from '@/modules/events/utils/eventCoverImage';
import { formatEventLocation } from '@/lib/presentation';
import {
  communityDetailHaptic,
  communityEventPriceLabel,
  formatCommunityEventDate,
  formatCommunityEventDateLong,
} from '@/modules/communities/components/detail/communityDetailUtils';
import {
  externalTicketProviderLabel,
  usesExternalTicketing,
} from '@/modules/events/utils/externalTicketing';

const haptic = communityDetailHaptic;

export type CommunityEventCardVariant = 'featured' | 'card' | 'compact';

export type CommunityEventCardProps = {
  event: EventData;
  accent: string;
  variant?: CommunityEventCardVariant;
};

function DateBadge({
  date,
  time,
  accent,
  large,
}: {
  date: string;
  time?: string;
  accent: string;
  large?: boolean;
}) {
  const short = formatCommunityEventDate(date);
  const timeLabel = formatEventTime(time);

  return (
    <View
      style={[
        styles.dateBadge,
        large && styles.dateBadgeLarge,
        { backgroundColor: withAlpha(accent, 0.92), borderColor: withAlpha('#FFFFFF', 0.25) },
      ]}
    >
      <Text style={[styles.dateBadgeDay, large && styles.dateBadgeDayLarge]}>{short}</Text>
      {timeLabel ? (
        <Text style={[styles.dateBadgeTime, { color: withAlpha('#FFFFFF', 0.9) }]}>{timeLabel}</Text>
      ) : null}
    </View>
  );
}

function PriceChip({ event, accent }: { event: EventData; accent: string }) {
  const m3Colors = useM3Colors();
  const label = communityEventPriceLabel(event);

  const isFree = label.toLowerCase() === 'free';
  return (
    <View
      style={[
        styles.priceChip,
        {
          backgroundColor: isFree ? m3Colors.tertiaryContainer : withAlpha(accent, 0.12),
          borderColor: isFree ? 'transparent' : withAlpha(accent, 0.28),
        },
      ]}
    >
      <Text
        style={[
          styles.priceChipText,
          { color: isFree ? m3Colors.onTertiaryContainer : accent },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ExternalTicketChip({ event }: { event: EventData }) {
  const m3Colors = useM3Colors();
  if (!usesExternalTicketing(event)) return null;
  const provider = externalTicketProviderLabel(event);
  return (
    <View style={[styles.externalChip, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
      <Ionicons name="open-outline" size={11} color={m3Colors.primary} />
      <Text style={[styles.externalChipText, { color: m3Colors.onSurfaceVariant }]}>
        Tickets on {provider}
      </Text>
    </View>
  );
}

function LocationLine({ event, light }: { event: EventData; light?: boolean }) {
  const m3Colors = useM3Colors();
  const location = formatEventLocation(event);
  const isTbc = location === 'Location TBC';
  const iconColor = light ? 'rgba(255,255,255,0.75)' : m3Colors.onSurfaceVariant;
  const textColor = light
    ? (isTbc ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.88)')
    : (isTbc ? m3Colors.outline : m3Colors.onSurfaceVariant);
  return (
    <View style={styles.metaRow}>
      <Ionicons name="location-outline" size={13} color={iconColor} />
      <Text style={[M3Typography.bodySmall, { color: textColor, flex: 1 }]} numberOfLines={2}>
        {location}
      </Text>
    </View>
  );
}

export function CommunityEventCard({ event, accent, variant = 'card' }: CommunityEventCardProps) {
  const m3Colors = useM3Colors();
  const coverImageUrl = getEventCoverImageUrl(event);

  const openEvent = () => {
    haptic();
    router.push(routeEvent(event) as never);
  };

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={openEvent}
        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
          styles.compactRow,
          {
            backgroundColor: m3Colors.surface,
            borderColor: m3Colors.outlineVariant,
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.99 : hovered && Platform.OS === 'web' ? 1.01 : 1 }],
          },
          Platform.OS === 'web' && (hovered
            ? ({ boxShadow: `0 8px 24px ${withAlpha(accent, 0.14)}` } as object)
            : ({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as object)),
        ]}
        accessibilityRole={pressableA11yRole('button')}
        accessibilityLabel={`View event ${event.title}`}
      >
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.compactThumb} contentFit="cover" />
        ) : (
          <View style={[styles.compactThumb, styles.thumbFallback, { backgroundColor: withAlpha(accent, 0.15) }]}>
            <Ionicons name="calendar-outline" size={20} color={accent} />
          </View>
        )}
        <View style={styles.compactBody}>
          <Text
            style={[M3Typography.titleSmall, { color: m3Colors.onSurface, lineHeight: 20 }]}
            numberOfLines={2}
          >
            {event.title}
          </Text>
          <Text
            style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, lineHeight: 18 }]}
            numberOfLines={1}
          >
            {formatCommunityEventDateLong(event.date)}
            {event.time ? ` · ${formatEventTime(event.time)}` : ''}
          </Text>
          <View style={styles.compactChips}>
            <PriceChip event={event} accent={accent} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={m3Colors.onSurfaceVariant} />
      </Pressable>
    );
  }

  if (variant === 'featured') {
    return (
      <Pressable
        onPress={openEvent}
        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
          styles.featuredWrap,
          {
            borderColor: m3Colors.outlineVariant,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.995 : hovered && Platform.OS === 'web' ? 1.008 : 1 }],
          },
          Platform.OS === 'web' && ({ boxShadow: `0 12px 40px ${withAlpha(accent, 0.18)}` } as object),
        ]}
        accessibilityRole={pressableA11yRole('button')}
        accessibilityLabel={`Featured event ${event.title}`}
      >
        <View style={styles.featuredImageWrap}>
          {coverImageUrl ? (
            <Image source={{ uri: coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={[withAlpha(accent, 0.55), withAlpha(accent, 0.15)]}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.featuredImageTop}>
            <View style={[styles.featuredPill, { backgroundColor: withAlpha(accent, 0.9) }]}>
              <Text style={styles.featuredPillText}>Next up</Text>
            </View>
            <DateBadge date={event.date} time={event.time} accent={accent} large />
          </View>
          <View style={styles.featuredImageBottom}>
            <Text style={[M3Typography.headlineSmall, styles.featuredTitle]} numberOfLines={3}>
              {event.title}
            </Text>
            <LocationLine event={event} light />
            <View style={styles.featuredChips}>
              <PriceChip event={event} accent={accent} />
              <ExternalTicketChip event={event} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  // Standard card — Pressable (not M3Card onPress) avoids RN Web <button> remapping issues.
  return (
    <Pressable
      onPress={openEvent}
      accessibilityRole={pressableA11yRole('button')}
      accessibilityLabel={`View event ${event.title}`}
      style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
        styles.card,
        styles.cardPressable,
        {
          borderColor: m3Colors.outlineVariant,
          backgroundColor: m3Colors.surface,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.995 : hovered && Platform.OS === 'web' ? 1.008 : 1 }],
        },
        Platform.OS === 'web' && ({ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' } as object),
      ]}
    >
      <View style={styles.cardImageWrap}>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <View style={[styles.cardImage, styles.thumbFallback, { backgroundColor: withAlpha(accent, 0.12) }]}>
            <Ionicons name="calendar-outline" size={28} color={accent} />
          </View>
        )}
        <View style={styles.cardDateOverlay}>
          <DateBadge date={event.date} time={event.time} accent={accent} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text
          style={[M3Typography.titleMedium, { color: m3Colors.onSurface, lineHeight: 24 }]}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <LocationLine event={event} />
        <View style={styles.cardChips}>
          <PriceChip event={event} accent={accent} />
          <ExternalTicketChip event={event} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 56,
  },
  dateBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 68,
  },
  dateBadgeDay: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dateBadgeDayLarge: {
    fontSize: 13,
  },
  dateBadgeTime: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    marginTop: 2,
  },
  priceChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  priceChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  externalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  externalChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  compactThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  compactBody: {
    flex: 1,
    gap: 6,
  },
  compactChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  featuredWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  featuredImageWrap: {
    minHeight: 220,
    justifyContent: 'space-between',
  },
  featuredImageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  featuredPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  featuredPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  featuredImageBottom: {
    padding: 18,
    gap: 8,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  featuredChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 0,
  },
  cardPressable: {
    borderWidth: 1,
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardDateOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
});