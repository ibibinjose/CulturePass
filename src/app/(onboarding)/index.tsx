import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';

import {
  CultureTokens,
  Radius,
  M3Typography,
  FontFamily,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { CulturalButton } from '@/design-system/ui';
import { SocialButton } from '@/design-system/ui/SocialButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useM3Colors } from '@/hooks/useM3Colors';
import { THEME_COLOR_WEB } from '@/lib/app-meta';
import { withAlpha } from '@/lib/withAlpha';

// ---------------------------------------------------------------------------
// Slide definitions
// ---------------------------------------------------------------------------

type Slide = {
  id: string;
  eyebrow: string;
  headline: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: readonly [string, string, ...string[]];
};

const SLIDES: Slide[] = [
  {
    id: 'discover',
    eyebrow: 'EVENTS & CULTURE',
    headline: 'Discover your\ncultural world',
    sub: 'Find events, food, and cultural experiences — curated for your city.',
    icon: 'calendar',
    gradientColors: [CultureTokens.terracottaGlow, CultureTokens.deepSaffron],
  },
  {
    id: 'connect',
    eyebrow: 'COMMUNITY',
    headline: 'Find your\ncommunity',
    sub: 'Connect with people who share your culture, language, and story.',
    icon: 'people',
    gradientColors: [CultureTokens.emeraldHarmony, CultureTokens.richIndigo],
  },
  {
    id: 'belong',
    eyebrow: 'MEMBER PERKS',
    headline: 'Belong\nanywhere.',
    sub: 'Exclusive perks from businesses that understand your culture.',
    icon: 'gift',
    gradientColors: [CultureTokens.heritageGold, CultureTokens.deepSaffron],
  },
];

const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 24;
// Fixed sheet inner height — keeps FlatList height stable across all slides
const ACTION_AREA_HEIGHT = 224;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(style).catch(() => {});
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function WelcomeScreen() {
  const m3Colors = useM3Colors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { completeOnboarding } = useOnboarding();
  const pathname = usePathname();

  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList<Slide>>(null);

  const splashOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      splashOpacity.value = withSpring(0, { damping: 22 });
      contentOpacity.value = withDelay(300, withSpring(1, { damping: 22 }));
      setTimeout(() => setShowSplash(false), 900);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ flex: 1, opacity: contentOpacity.value }));

  const isLast = currentIndex === SLIDES.length - 1;

  const goNext = useCallback(() => {
    tap();
    const next = currentIndex + 1;
    flatRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    tap();
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding]);

  const handleGetStarted = useCallback(() => {
    tap(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/(onboarding)/signup', params: { redirectTo: pathname } });
  }, [pathname]);

  const handleSignIn = useCallback(() => {
    tap();
    router.push({ pathname: '/(onboarding)/login', params: { redirectTo: pathname } });
  }, [pathname]);

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <LinearGradient
        colors={item.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.slide, { width, paddingTop: topInset + 56 }]}
      >
        <View style={s.iconRing}>
          <Ionicons name={item.icon} size={56} color="#FFFFFF" />
        </View>
        <Text style={s.eyebrow}>{item.eyebrow}</Text>
        <Text style={s.headline}>{item.headline}</Text>
        <Text style={s.sub}>{item.sub}</Text>
      </LinearGradient>
    ),
    [width, topInset],
  );

  return (
    <View style={s.root}>
      {showSplash && (
        <Animated.View
          style={[StyleSheet.absoluteFill, s.splash, { backgroundColor: THEME_COLOR_WEB }, splashStyle]}
        >
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={s.splashLogo}
            contentFit="contain"
          />
        </Animated.View>
      )}

      <Animated.View style={contentStyle}>
        {/* Slide pager fills all space above the bottom sheet */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          scrollEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(idx);
          }}
        />

        {/* Bottom sheet — fixed height so slides never resize */}
        <View
          style={[
            s.sheet,
            {
              backgroundColor: m3Colors.surface,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Pagination dots */}
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  {
                    backgroundColor:
                      i === currentIndex
                        ? CultureTokens.heritageGold
                        : withAlpha(m3Colors.onSurface, 0.18),
                    width: i === currentIndex ? DOT_ACTIVE_WIDTH : DOT_SIZE,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action area — fixed height, content swaps on last slide */}
          <View style={[s.actionArea, { height: ACTION_AREA_HEIGHT }]}>
            {isLast ? (
              <Animated.View entering={FadeIn.duration(220)} style={s.ctaFull}>
                <CulturalButton
                  variant="filled"
                  fullWidth
                  rightIcon="arrow-forward"
                  onPress={handleGetStarted}
                  style={s.ctaBtn}
                >
                  Get Started
                </CulturalButton>

                <CulturalButton variant="tonal" fullWidth onPress={handleSignIn} style={s.ctaBtn}>
                  Sign In
                </CulturalButton>

                <View style={s.divider}>
                  <View style={[s.divLine, { backgroundColor: m3Colors.outlineVariant }]} />
                  <Text
                    style={[M3Typography.labelSmall, s.divLabel, { color: m3Colors.onSurfaceVariant }]}
                  >
                    or
                  </Text>
                  <View style={[s.divLine, { backgroundColor: m3Colors.outlineVariant }]} />
                </View>

                <View style={s.socialRow}>
                  <SocialButton provider="google" onPress={() => {}} />
                  <SocialButton provider="apple" onPress={() => {}} />
                </View>
              </Animated.View>
            ) : (
              <View style={s.nextWrap}>
                <CulturalButton variant="filled" fullWidth rightIcon="arrow-forward" onPress={goNext}>
                  Next
                </CulturalButton>
              </View>
            )}
          </View>

          {/* Skip — always visible */}
          <Pressable onPress={handleSkip} style={s.skipRow} hitSlop={12}>
            <Text style={[M3Typography.labelMedium, { color: m3Colors.onSurfaceVariant }]}>
              Skip — explore as guest
            </Text>
            <Ionicons name="chevron-forward" size={14} color={m3Colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  splash: { zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 120, height: 120 },

  // Slide
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
    paddingBottom: 24,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FontFamily.bold,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.80)',
    maxWidth: 320,
  },

  // Bottom sheet
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 0,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    ...Platform.select({
      web: { boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },

  // Action area
  actionArea: {
    justifyContent: 'flex-start',
  },
  ctaFull: { gap: 12 },
  ctaBtn: { height: 52 },
  nextWrap: { paddingTop: 4 },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  divLine: { flex: 1, height: 1 },
  divLabel: { marginHorizontal: 12 },

  // Social
  socialRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },

  // Skip
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 16,
    paddingBottom: 4,
  },
});