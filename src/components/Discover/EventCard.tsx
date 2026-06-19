import React from 'react';
import {
  Animated,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, CultureTokens, TextStyles, LiquidGlassTokens } from '@/design-system/tokens/theme';
import { CultureTagRow, mergeCultureTagFields } from '@/design-system/ui/CultureTag';
import { EventPublisherLine } from '@/modules/events/components/list/EventPublisherLine';
import { EventPublisherLogo } from '@/modules/events/components/list/EventPublisherLogo';
import { useColors } from '@/hooks/useColors';
import { useLikes } from '@/contexts/LikesContext';
import { GlassView } from '@/design-system/ui/GlassView';
import { LikeToggle } from '@/design-system/ui/LikeToggle';
import {
  DISCOVER_EVENT_LIVE_WINDOW_MS,
  formatEventDateTimeBadge,
  formatStartsInCountdown,
  parseEventStartMs,
} from '@/lib/dateUtils';
import { USE_NATIVE_DRIVER } from '@/design-system/tokens/animations';
import { CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';
import { pressableA11yRole } from '@/lib/webPressable';
import { formatEventLocation, formatEventPriceLabel, isFallbackValue } from '@/lib/presentation';

/** RN Animated avoids Reanimated host/JSI init during Expo web SSR (HostFunction crashes). */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RAIL_CARD_WIDTH = 256;
const RAIL_IMAGE_HEIGHT = 168;

function isFreePriceLabel(label: string | undefined): boolean {
  return Boolean(label && label.trim().toLowerCase() === 'free');
}

function eventInvitesCultureExplore(event: EventCardProps['event']): boolean {
  const cx = CULTUREX_EXPLORES_CULTURE_TAG.toLowerCase();
  const tags = mergeCultureTagFields(event.cultureTag, event.cultureTags);
  return tags.some((t) => String(t).toLowerCase() === cx);
}

function CultureXInviteBadge({ stacked }: { stacked?: boolean }) {
  return (
    <GlassView
      intensity={30}
      colorScheme="dark"
      style={[
        styles.cxBadge,
        stacked && styles.cxBadgeStacked,
      ]}
      accessibilityRole="text"
      accessibilityLabel="CultureX — inviting Culture Explores"
    >
      <Text style={styles.cxBadgeCulture}>Culture</Text>
      <Text style={styles.cxBadgeX}>X</Text>
    </GlassView>
  );
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time?: string;
    venue?: string;
    city?: string;
    state?: string;
    address?: string;
    imageUrl?: string;
    communityId?: string;
    attending?: number;
    priceLabel?: string;
    priceCents?: number;
    isFree?: boolean;
    isFeatured?: boolean;
    distanceKm?: number;
    cultureTag?: string[];
    cultureTags?: string[];
    publisherProfileId?: string;
  };
  highlight?: boolean;
  index?: number;
  isLive?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  /** `stacked` = image on top, text below (Discover rails). `overlay` = full-bleed hero (e.g. city grid). */
  layout?: 'overlay' | 'stacked';
  /**
   * When `live_and_countdown` + stacked: show LIVE (within window after start) or a ticking “Starts in …” timer.
   * Ignores `isLive` for badge logic.
   */
  schedulingMode?: 'default' | 'live_and_countdown';
}

function StackedLiveSoonSchedule({ event }: { event: EventCardProps['event'] }) {
  const [, setTick] = React.useState(0);
  const startMs = React.useMemo(() => parseEventStartMs(event.date, event.time), [event.date, event.time]);
  const colors = useColors();

  React.useEffect(() => {
    if (startMs == null) return;
    const bump = () => setTick((x) => x + 1);
    bump();
    const left = startMs - Date.now();
    const intervalMs = left > 3600000 ? 30000 : 1000;
    const id = setInterval(bump, intervalMs);
    return () => clearInterval(id);
  }, [startMs, event.id]);

  if (startMs == null) {
    return (
      <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.indigo }]}>
        <Text style={styles.statusBadgeTextDark}>Starting soon</Text>
      </View>
    );
  }

  const now = Date.now();
  const endLive = startMs + DISCOVER_EVENT_LIVE_WINDOW_MS;

  if (now >= startMs && now < endLive) {
    return (
      <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.error }]}>
        <View style={styles.pulseDot} />
        <Text style={styles.statusBadgeTextDark}>LIVE</Text>
      </View>
    );
  }

  if (now < startMs) {
    return (
      <GlassView
        intensity={10}
        style={[
          styles.countdownRow,
          { backgroundColor: colors.primarySoft, borderColor: colors.borderLight },
        ]}
        accessibilityRole="timer"
        accessibilityLabel={`Starts in ${formatStartsInCountdown(startMs - now)}`}
      >
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={[styles.countdownLabel, { color: colors.primary }]} numberOfLines={1}>
          Starts in {formatStartsInCountdown(startMs - now)}
        </Text>
      </GlassView>
    );
  }

  return null;
}

function OverlayCardContent({
  event,
  highlight,
  colors,
  isLive,
}: Pick<EventCardProps, 'event' | 'highlight' | 'isLive'> & { colors: ReturnType<typeof useColors> }) {
  const now = new Date();
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isStartingNext = !isLive && isToday;
  const locationDisplay = formatEventLocation(event);
  const locationMuted = isFallbackValue(locationDisplay, 'Location TBC');
  const priceDisplay = formatEventPriceLabel(event);

  return (
    <View style={styles.centeredContent}>
      {isLive ? (
        <GlassView intensity={40} colorScheme="dark" style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.6)' }]}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusBadgeText}>now live</Text>
        </GlassView>
      ) : isStartingNext ? (
        <GlassView intensity={40} colorScheme="dark" style={[styles.statusBadge, { backgroundColor: 'rgba(0, 102, 204, 0.6)' }]}>
          <Text style={styles.statusBadgeText}>Starting next</Text>
        </GlassView>
      ) : null}

      <Text
        style={[styles.titleText, highlight && styles.titleHighlight]}
        numberOfLines={2}
      >
        {event.title}
      </Text>

      <Text style={[styles.dateText, { color: colors.eventDateOnMedia }, highlight && styles.dateHighlight]}>
        {formatEventDateTimeBadge(event.date, event.time)}
      </Text>

      <View style={styles.metaRowCentered}>
        <Ionicons name="location" size={12} color={`${colors.textInverse}CC`} />
        <Text
          style={[
            styles.locationText,
            {
              color: locationMuted ? `${colors.textInverse}99` : `${colors.textInverse}E6`,
              fontStyle: locationMuted ? 'italic' : 'normal',
            },
          ]}
          numberOfLines={1}
        >
          {locationDisplay}
        </Text>
      </View>

      {event.publisherProfileId ? (
        <EventPublisherLine profileId={event.publisherProfileId} variant="onDark" />
      ) : null}

      <GlassView
        intensity={30}
        colorScheme="dark"
        style={[
          styles.pricePill,
          isFreePriceLabel(priceDisplay) && {
            backgroundColor: 'rgba(46, 196, 182, 0.4)',
            borderColor: 'rgba(46, 196, 182, 0.6)',
          },
        ]}
      >
        <Text style={styles.pricePillText}>{priceDisplay}</Text>
      </GlassView>
    </View>
  );
}

function StackedCardContent({
  event,
  highlight,
  colors,
  isLive,
  schedulingMode = 'default',
}: Pick<EventCardProps, 'event' | 'highlight' | 'isLive' | 'schedulingMode'> & { colors: ReturnType<typeof useColors> }) {
  const now = new Date();
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isStartingNext = !isLive && isToday;

  const liveOrNextBadge = schedulingMode === 'live_and_countdown' ? (
    <StackedLiveSoonSchedule event={event} />
  ) : isLive ? (
    <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.error }]}>
      <View style={styles.pulseDot} />
      <Text style={styles.statusBadgeTextDark}>now live</Text>
    </View>
  ) : isStartingNext ? (
    <View style={[styles.statusBadgeStacked, { backgroundColor: colors.primary }]}>
      <Text style={styles.statusBadgeTextDark}>Starting next</Text>
    </View>
  ) : null;

  const tags = mergeCultureTagFields(event.cultureTag, event.cultureTags);
  const cxLower = CULTUREX_EXPLORES_CULTURE_TAG.toLowerCase();
  const displayTags = tags.filter((t) => String(t).toLowerCase() !== cxLower);
  const locationDisplay = formatEventLocation(event);
  const locationMuted = isFallbackValue(locationDisplay, 'Location TBC');
  const priceDisplay = formatEventPriceLabel(event);

  return (
    <View style={styles.stackedBody}>
      {liveOrNextBadge}
      <Text
        style={[TextStyles.eventCardTitle, { color: colors.text, minHeight: 44 }, highlight && styles.stackedTitleHi]}
        numberOfLines={2}
      >
        {event.title}
      </Text>
      <View style={styles.stackedDateRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.eventDate} />
        <Text style={[TextStyles.eventCardDate, { color: colors.eventDate }]} numberOfLines={1}>
          {formatEventDateTimeBadge(event.date, event.time)}
        </Text>
      </View>
      <View style={styles.stackedMetaRow}>
        <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
        <Text
          style={[
            TextStyles.eventCardMeta,
            {
              color: locationMuted ? colors.textTertiary : colors.textSecondary,
              fontStyle: locationMuted ? 'italic' : 'normal',
            },
          ]}
          numberOfLines={1}
        >
          {locationDisplay}
        </Text>
      </View>
      {event.publisherProfileId ? (
        <View style={styles.stackedPublisherRow}>
          <EventPublisherLine profileId={event.publisherProfileId} variant="compact" />
        </View>
      ) : null}
      <View style={[styles.stackedFooter, { borderTopColor: colors.borderLight }]}>
        <View style={styles.stackedFooterLeft}>
          <GlassView
            intensity={10}
            style={[
              styles.stackedPricePill,
              { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary },
              isFreePriceLabel(priceDisplay) && {
                backgroundColor: CultureTokens.teal + '1A',
                borderColor: CultureTokens.teal + '33',
              },
            ]}
          >
            <Text style={[styles.stackedPriceText, { color: colors.text }]}>{priceDisplay}</Text>
          </GlassView>
          {displayTags.length > 0 ? <CultureTagRow tags={displayTags} max={1} /> : null}
        </View>
      </View>
    </View>
  );
}

function EventCard({
  event,
  highlight,
  index = 0,
  isLive,
  containerWidth,
  containerHeight,
  layout = 'overlay',
  schedulingMode = 'default',
}: EventCardProps) {
  const colors = useColors();
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(event.id);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => () => scaleAnim.stopAnimation(), [scaleAnim]);

  const animatedStyle = { transform: [{ scale: scaleAnim }] };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 6,
      tension: 400,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 7,
      tension: 140,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const cardWidth = containerWidth ?? (layout === 'stacked' ? RAIL_CARD_WIDTH : 240);
  const showCultureXBadge = eventInvitesCultureExplore(event);
  const imageUri = normalizeRemoteImageUri(
    event.heroImageUrl ?? event.imageUrl,
  );

  if (layout === 'stacked') {
    return (
      <View style={{ width: cardWidth }}>
        <AnimatedPressable
          style={[
            styles.stackedCard,
            { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 },
            highlight && styles.stackedHighlight,
            animatedStyle,
            Platform.OS === 'web' && { cursor: 'pointer' as const },
            isHovered && Platform.OS === 'web' && {
              transform: [{ scale: 1.02 }],
              boxShadow: '0px 12px 28px rgba(0,0,0,0.14)',
            },
            Platform.OS !== 'web' && Colors.shadows.medium,
          ]}
          onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...({
            onHoverIn: () => setIsHovered(true),
            onHoverOut: () => setIsHovered(false),
          } as Record<string, unknown>)}
          accessibilityRole={pressableA11yRole('button')}
          accessibilityLabel={`${event.title}, ${formatEventDateTimeBadge(event.date, event.time)}`}
          accessibilityHint="Opens event details"
        >
          <View style={{ position: 'relative' }}>
            <Image
              source={imageUri ? { uri: imageUri } : undefined}
              style={[styles.stackedImage, { height: RAIL_IMAGE_HEIGHT, backgroundColor: colors.backgroundSecondary }]}
              contentFit="cover"
              contentPosition="top"
              transition={300}
            />
            {showCultureXBadge ? <CultureXInviteBadge stacked /> : null}
            {event.publisherProfileId ? (
              <View style={styles.publisherLogoWrap} pointerEvents="box-none">
                <EventPublisherLogo profileId={event.publisherProfileId} size={42} />
              </View>
            ) : null}
            <View style={styles.likeToggleStacked} pointerEvents="box-none">
              <LikeToggle
                liked={liked}
                onToggle={() => toggleLike(event.id)}
                tone="glass"
                size="sm"
              />
            </View>
          </View>
          <StackedCardContent
            event={event}
            highlight={highlight}
            colors={colors}
            isLive={isLive}
            schedulingMode={schedulingMode}
          />
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View>
      <AnimatedPressable
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 },
          containerWidth ? { width: containerWidth } : null,
          containerHeight ? { height: containerHeight, minHeight: 280 } : null,
          highlight && styles.highlight,
          animatedStyle,
          Platform.OS === 'web' && {
            cursor: 'pointer' as const,
            transition: 'all 0.3s ease',
          },
          isHovered &&
            Platform.OS === 'web' && {
              transform: [{ scale: 1.02 }],
              boxShadow: '0px 12px 30px rgba(0,0,0,0.25)',
            },
          Platform.OS !== 'web' && Colors.shadows.medium,
        ]}
        onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...({
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        } as Record<string, unknown>)}
        accessibilityRole={pressableA11yRole('button')}
        accessibilityLabel={`${event.title}, ${formatEventDateTimeBadge(event.date, event.time)}`}
        accessibilityHint="Opens event details"
      >
        <Image
          source={imageUri ? { uri: imageUri } : undefined}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
          transition={300}
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {showCultureXBadge ? <CultureXInviteBadge /> : null}

        {event.publisherProfileId ? (
          <View style={styles.publisherLogoWrapOverlay} pointerEvents="box-none">
            <EventPublisherLogo profileId={event.publisherProfileId} size={44} />
          </View>
        ) : null}

        <View style={styles.likeToggleOverlay} pointerEvents="box-none">
          <LikeToggle
            liked={liked}
            onToggle={() => toggleLike(event.id)}
            tone="glass"
            size="md"
          />
        </View>

        <View style={styles.contentContainer}>
          <OverlayCardContent event={event} highlight={highlight} colors={colors} isLive={isLive} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    height: 260,
    borderRadius: LiquidGlassTokens.corner.mainCard,
    overflow: 'hidden',
  },
  stackedCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 2,
    height: 380,
  },
  stackedHighlight: {
    borderWidth: 2,
    borderColor: CultureTokens.coral,
  },
  stackedImage: {
    width: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  stackedBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'flex-start',
    gap: 6,
    flex: 1,
  },
  stackedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    marginTop: 2,
  },
  stackedTitleHi: {
    fontSize: 17,
    lineHeight: 24,
  },
  stackedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
  stackedFooter: {
    alignSelf: 'stretch',
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stackedFooterLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  stackedPublisherRow: {
    alignSelf: 'stretch',
    marginTop: -2,
    marginBottom: 2,
  },
  publisherLogoWrap: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  publisherLogoWrapOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  stackedPricePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
    overflow: 'hidden',
  },
  stackedPriceText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  statusBadgeStacked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2,
  },
  statusBadgeTextDark: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  countdownLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  highlight: {
    width: '100%',
    height: 320,
    borderWidth: 2,
    borderColor: CultureTokens.coral,
  },
  cxBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cxBadgeStacked: {
    top: 10,
    right: 10,
  },
  likeToggleStacked: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 5,
  },
  likeToggleOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 5,
  },
  cxBadgeCulture: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cxBadgeX: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.coral,
    marginLeft: 1,
    letterSpacing: -0.5,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 32,
  },
  centeredContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    overflow: 'hidden',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  dateText: {
    ...TextStyles.eventCardDate,
    marginBottom: 4,
    textAlign: 'center',
  },
  dateHighlight: {
    fontSize: 13,
  },
  titleText: {
    ...TextStyles.eventCardTitle,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  titleHighlight: {
    fontSize: 20,
    lineHeight: 26,
  },
  metaRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    maxWidth: '90%',
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  pricePillText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
});

export default React.memo(EventCard);
