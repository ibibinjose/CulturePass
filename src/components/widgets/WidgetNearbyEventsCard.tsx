import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CardTokens, CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import type { WidgetNearbyEventItem } from '@/lib/api';

interface WidgetNearbyEventsCardProps {
  events: WidgetNearbyEventItem[];
}

function formatStart(date: string, time?: string): string {
  const base = `${date}T${time?.trim().length ? time.trim() : '00:00'}:00`;
  const parsed = new Date(base);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ACCENT_COLORS = [
  CultureTokens.indigo,
  CultureTokens.teal,
  CultureTokens.coral,
  CultureTokens.violet,
];

export function WidgetNearbyEventsCard({ events }: WidgetNearbyEventsCardProps) {
  const colors = useColors();

  if (events.length === 0) {
    return (
      <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <View style={styles.emptyWrap}>
          <Ionicons name="location-outline" size={28} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No nearby events yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
      {events.map((event, idx) => {
        const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
        return (
          <Pressable
            key={event.id}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                borderTopWidth: idx > 0 ? StyleSheet.hairlineWidth : 0,
                borderTopColor: colors.divider,
              },
            ]}
            onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Open event: ${event.title}`}
          >
            {/* Left accent strip */}
            <View style={[styles.accentStrip, { backgroundColor: accent }]} />

            {/* Event thumbnail */}
            {event.imageUrl ? (
              <Image
                source={event.imageUrl}
                style={[styles.thumb, { backgroundColor: colors.backgroundSecondary }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: accent + '20' }]}>
                <Ionicons name="calendar-outline" size={16} color={accent} />
              </View>
            )}

            {/* Text content */}
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={[styles.meta, { color: accent }]} numberOfLines={1}>
                {formatStart(event.date, event.time)}
              </Text>
              {event.venue ? (
                <Text style={[styles.venue, { color: colors.textTertiary }]} numberOfLines={1}>
                  {event.venue}
                </Text>
              ) : null}
            </View>

            {/* Price badge */}
            <View style={[styles.priceBadge, {
              backgroundColor: event.isFree ? CultureTokens.teal + '18' : CultureTokens.gold + '18',
            }]}>
              <Text style={[styles.price, {
                color: event.isFree ? CultureTokens.teal : CultureTokens.gold,
              }]}>
                {event.isFree ? 'Free' : `$${Math.round((event.priceCents ?? 0) / 100)}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10,
  },
  accentStrip: {
    width: 3,
    height: 36,
    borderRadius: 99,
    flexShrink: 0,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  venue: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
  },
  price: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});
