import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { M3Button } from '@/design-system/ui';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';
import { toSafeDateKey, MONTHS_SHORT, formatPrice } from './utils';

export function EventRow({
  event,
  colors,
  isAuthenticated,
  isWeb,
  onAddToDevice,
  isAddingToDevice,
}: {
  event: EventData;
  colors: ReturnType<typeof useColors>;
  isAuthenticated: boolean;
  isWeb: boolean;
  onAddToDevice?: (event: EventData) => void;
  isAddingToDevice?: boolean;
}) {
  const isDark = useIsDark();
  const safeDate = toSafeDateKey(event.date);
  const dayNum = safeDate ? new Date(`${safeDate}T00:00:00`).getDate() : null;
  const monthAbbr = safeDate ? MONTHS_SHORT[new Date(`${safeDate}T00:00:00`).getMonth()] : 'TBA';
  const dateLabel = formatEventDateTime(event.date, event.time, event.country);

  const isCouncilEvent =
    event.category === 'council' || event.category === 'Council' || event.category === 'civic';
  const isFree = (event.priceCents ?? 0) === 0;

  const accentColor = isCouncilEvent ? CultureTokens.teal : CultureTokens.gold;

  const handlePress = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/e/[id]', params: { id: event.id } });
  };

  const handleBuyTicket = () => {
    router.push({ pathname: '/e/[id]', params: { id: event.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
            android: { elevation: 2, shadowColor: '#000' },
            web: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
          }),
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Left date block */}
      <BlurView intensity={isDark ? 30 : 50} tint="dark" style={[s.dateBlock, { backgroundColor: accentColor + '22' }]}>
        {dayNum !== null ? (
          <>
            <Text style={[s.dateDay, { color: accentColor }]}>{dayNum}</Text>
            <Text style={[s.dateMonth, { color: accentColor + 'CC' }]}>{monthAbbr}</Text>
          </>
        ) : (
          <Text style={[s.dateTba, { color: accentColor }]}>TBA</Text>
        )}
      </BlurView>

      {/* Content */}
      <View style={s.content}>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.eventDate} />
          <Text style={[s.meta, { color: colors.eventDate }]} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
        {(event.venue || event.city) ? (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[s.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.venue || event.city}
            </Text>
          </View>
        ) : null}
        <View style={s.bottomBand}>
          <View style={s.badgeRow}>
            <View
              style={[
                s.priceBadge,
                isFree
                  ? { backgroundColor: CultureTokens.teal + '18', borderColor: CultureTokens.teal + '40' }
                  : { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '40' },
              ]}
            >
              <Text
                style={[
                  s.priceText,
                  { color: isFree ? CultureTokens.teal : CultureTokens.indigo },
                ]}
              >
                {formatPrice(event.priceCents ?? 0)}
              </Text>
            </View>
            {event.category ? (
              <View style={[s.catChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                <Text style={[s.catText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {event.category}
                </Text>
              </View>
            ) : null}
            {typeof event.attending === 'number' && event.attending > 0 ? (
              <View style={[s.goingChip, { borderColor: colors.borderLight }]}>
                <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.goingText, { color: colors.textSecondary }]}>{event.attending} going</Text>
              </View>
            ) : null}
          </View>

          <View style={s.actionRow}>
            {onAddToDevice ? (
              <M3Button
                variant="tonal"
                leftIcon={isWeb ? 'download-outline' : 'calendar-outline'}
                loading={isAddingToDevice}
                onPress={(pressEvent) => {
                  pressEvent.stopPropagation?.();
                  onAddToDevice(event);
                }}
                accessibilityLabel={`Add ${event.title} to device calendar`}
                style={s.actionButton}
                labelStyle={s.actionButtonLabel}
              >
                Add
              </M3Button>
            ) : null}
            <M3Button
              variant="filled"
              leftIcon="ticket-outline"
              onPress={(pressEvent) => {
                pressEvent.stopPropagation?.();
                handleBuyTicket();
              }}
              accessibilityLabel={`Buy ticket for ${event.title}`}
              style={s.actionButton}
              labelStyle={s.actionButtonLabel}
            >
              Buy
            </M3Button>
          </View>
        </View>
      </View>

      {/* Thumbnail */}
      {event.imageUrl ? (
        <View style={[s.thumbFrame, { backgroundColor: colors.backgroundSecondary }]}>
          <Image
            source={{ uri: event.imageUrl }}
            style={s.thumb}
            contentFit="cover"
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
  },
  dateBlock: {
    width: 60,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 2,
  },
  dateDay: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 26,
  },
  dateMonth: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTba: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    flex: 1,
  },
  bottomBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  priceText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  catText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  goingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  goingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  actionButtonLabel: {
    fontSize: 11,
    letterSpacing: 0,
  },
  thumbFrame: {
    width: 94,
    alignSelf: 'stretch',
    marginVertical: 10,
    marginRight: 10,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 112,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
