import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CultureTokens, CardTokens } from '@/design-system/tokens/theme';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

// ─── UI UX Pro Max: Modern Dark (Cinema Mobile) design system
// Style: Deep backgrounds, ambient glow, BlurView glassmorphism,
//        spring physics (damping:20 stiffness:90), haptic-linked press,
//        bezier(0.16,1,0.3,1) easing, hairline border rgba(255,255,255,0.08)

const CINEMA_SPRING = { damping: 20, stiffness: 90, mass: 1 } as const;
const CINEMA_EASING = Easing.bezier(0.16, 1, 0.3, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Glassmorphic badge — BlurView on iOS, semi-opaque fallback on Android
function GlassBadge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.glassBadge, style]}>
      {Platform.OS !== 'android' ? (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidGlass]} />
      )}
      {children}
    </View>
  );
}

// Ambient pulsing glow — subtle scale/opacity oscillation behind card
function AmbientGlow({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.18);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2800, easing: CINEMA_EASING }),
        withTiming(1.0, { duration: 2800, easing: CINEMA_EASING }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 2800, easing: CINEMA_EASING }),
        withTiming(0.18, { duration: 2800, easing: CINEMA_EASING }),
      ),
      -1,
      false,
    );
  }, [opacity, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.ambientGlow, { backgroundColor: color }, glowStyle]}
      pointerEvents="none"
    />
  );
}

export interface SpotlightItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  /** Cultural category label shown in badge */
  category?: string;
}

interface SpotlightCardProps {
  item: SpotlightItem;
  index?: number;
  /** Accent color for ambient glow + category badge */
  accentColor?: string;
}

function SpotlightCard({
  item,
  accentColor = CultureTokens.coral,
}: SpotlightCardProps) {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  // ✅ UI UX Pro Max: spring physics on press (scale 0.97 → 1.0)
  const handlePressIn = () => {
    scale.value = withSpring(0.97, CINEMA_SPRING);
    elevation.value = withTiming(1, { duration: 120, easing: CINEMA_EASING });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, CINEMA_SPRING);
    elevation.value = withTiming(0, { duration: 200, easing: CINEMA_EASING });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeLabel = item.category || (item.type === 'event' ? 'Event' : 'Community');

  return (
    <View style={styles.wrapper}>
      {/* ✅ UI UX Pro Max: ambient glow blob behind card (slow oscillation) */}
      <AmbientGlow color={accentColor} />

      <AnimatedPressable
        style={[animatedStyle, styles.card]}
        onPress={() => {
          if (item.type === 'event') {
            router.push({ pathname: '/e/[id]', params: { id: item.id } });
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        // ✅ UI UX Pro Max: accessibility role + label on all interactive elements
        accessibilityRole="button"
        accessibilityLabel={`${badgeLabel}: ${item.title}${item.description ? '. ' + item.description : ''}`}
        accessibilityHint={item.type === 'event' ? 'Double tap to view event details' : undefined}
        {...(Platform.OS === 'web' ? ({ style: styles.webCursor } as any) : {})}
      >
        {/* Hero image — expo-image for disk caching (CLAUDE.md rule) */}
        <Image
          source={{ uri: normalizeRemoteImageUri(item.imageUrl) ?? undefined }}
          style={styles.fill}
          contentFit="cover"
          transition={200}
          accessibilityLabel=""
          accessible={false}
        />

        {/* ✅ Cinema Dark: 3-stop gradient — transparent → slight veil → deep dark */}
        <LinearGradient
          colors={['transparent', 'rgba(2,2,3,0.20)', 'rgba(2,2,3,0.88)']}
          locations={[0, 0.45, 1]}
          style={styles.fill}
        />

        {/* Category badge — top-left, glassmorphic */}
        <GlassBadge style={styles.categoryBadge}>
          <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
          <Text style={styles.categoryText}>{badgeLabel}</Text>
        </GlassBadge>

        {/* Content — bottom-pinned with glassmorphic ribbons */}
        <View style={styles.content}>
          <GlassBadge style={styles.titleRibbon}>
            <Text
              style={styles.title}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </GlassBadge>

          {item.description ? (
            <GlassBadge style={styles.descRibbon}>
              <Text
                style={styles.description}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            </GlassBadge>
          ) : null}
        </View>

        {/* ✅ Cinema Dark: hairline border for card depth */}
        <View style={styles.borderOverlay} pointerEvents="none" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wrapper: {
    // Reserve space for ambient glow bleed
    padding: 6,
  },
  card: {
    width: 280,
    height: 180,
    borderRadius: CardTokens.radius + 8, // 24px — cinematic rounding
    overflow: 'hidden',
    backgroundColor: '#050506', // ✅ Cinema Dark base (no pure #000)
  },
  // ✅ Cinema Dark: hairline border rgba(255,255,255,0.08)
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: CardTokens.radius + 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  // Ambient glow blob
  ambientGlow: {
    position: 'absolute',
    width: 200,
    height: 120,
    borderRadius: 100,
    top: -10,
    left: 20,
    // opacity + scale driven by Reanimated
  },

  // Glassmorphic badge base
  glassBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
    // iOS: BlurView fills this; Android: androidGlass fills this
    backgroundColor: Platform.OS === 'ios' ? 'rgba(11,11,20,0.45)' : 'transparent',
  },
  androidGlass: {
    backgroundColor: 'rgba(11,11,20,0.82)',
  },

  // Category badge
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Bottom content stack
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 6,
  },
  titleRibbon: {
    // inherits glassBadge styles
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  descRibbon: {
    // inherits glassBadge styles
  },
  description: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 16,
  },

  // Web cursor
  webCursor: {
    cursor: 'pointer',
  } as any,
});

export default React.memo(SpotlightCard);
