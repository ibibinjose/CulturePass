import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  type DimensionValue,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { luxeDark } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { LuxeFilterChip } from '@/design-system/ui/LuxeFilterChip';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { useInterestsSelection } from '@/hooks/useInterestsSelection';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import { sanitizeInternalRedirect } from '@/lib/routes';
import {
  interestCategories,
  popularInterestsSydney,
  interestIcons,
} from '@/constants/onboardingInterests';

const CATEGORY_EMOJI: Record<string, string> = {
  cultural: '🎭',
  arts:     '🎨',
  food:     '🍛',
  business: '💼',
  family:   '👨‍👩‍👧',
  civic:    '🏙️',
  wellness: '🧘',
  format:   '🎟️',
};

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function InterestsScreen() {
  const m3Colors = useM3Colors();
  const { isDesktop, windowSizeClass } = useLayout();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const isExpanded = windowSizeClass === 'expanded';
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const {
    selected,
    expanded,
    isSubmitting,
    selectedSet,
    isReady,
    remaining,
    MIN_REQUIRED,
    destinationLabel,
    toggle,
    toggleAll,
    toggleSection,
    handleFinish: handleFinishHook
  } = useInterestsSelection();

  const handleFinish = async () => {
    if (!isReady) {
      Alert.alert('Select more interests', `Please select at least ${MIN_REQUIRED} interests to continue.`);
      return;
    }
    const res = await handleFinishHook();
    if (res?.success === false) {
      Alert.alert('Could not finish onboarding', 'Please try again.');
    }
  };

  const progressPct = `${Math.min(1, selected.length / MIN_REQUIRED) * 100}%` as DimensionValue;

  return (
    <View style={[s.root, { backgroundColor: m3Colors.background }]}>

      <M3TopAppBar
        title="Interests"
        onBack={() => router.canGoBack() ? router.back() : router.replace('/(onboarding)/communities')}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <OnboardingProgressHeader currentStep="interests" redirectTo={redirectTo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: bottomInset + 130 },
        ]}
      >
        <Animated.View
          entering={FadeInUp.springify().damping(16).delay(100)}
        >
          {redirectTo ? (
            <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" />
          ) : null}

          {/* Title */}
          <View style={s.titleBlock}>
            <LuxeText variant="display" style={[s.title, { color: luxeDark.text }]}>What interests you?</LuxeText>
            <LuxeText variant="body" style={[s.subtitle, { color: luxeDark.textSecondary }]}>
              Pick at least {MIN_REQUIRED} to personalise your feed.
            </LuxeText>
          </View>

          {/* Progress bar */}
          <Animated.View entering={FadeInDown.springify().damping(15).delay(150)} style={s.progressBlock}>
            <View style={[s.progressTrack, { backgroundColor: luxeDark.surfaceElevated }]}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: progressPct,
                    backgroundColor: isReady ? luxeDark.primary : luxeDark.secondary,
                  },
                ]}
              />
            </View>
            <LuxeText variant="badgeCaps" style={{ color: isReady ? luxeDark.primary : luxeDark.textSecondary, minWidth: 90, textAlign: 'right' }}>
              {isReady ? `${selected.length} SELECTED` : `${selected.length} / ${MIN_REQUIRED}`}
            </LuxeText>
          </Animated.View>

          {/* Popular picks */}
          <Animated.View entering={FadeInDown.springify().damping(15).delay(200)} style={s.section}>
            <LuxeText variant="badgeCaps" style={{ color: luxeDark.textSecondary, marginBottom: 16 }}>POPULAR NEAR YOU</LuxeText>
            {/* Popular interests — vertical list top to bottom */}
            <View style={s.interestList}>
              {popularInterestsSydney.map(interest => {
                const isSelected = selectedSet.has(interest);
                const icon = interestIcons[interest] ?? 'star';
                return (
                  <LuxeCard
                    key={interest}
                    variant={isSelected ? "tonal" : "default"}
                    onPress={() => toggle(interest)}
                    style={s.interestCard}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                      <Text style={{ fontSize: 18 }}>{icon}</Text>
                      <LuxeText 
                        variant="bodyMedium" 
                        style={{ color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text, flex: 1 }}
                      >
                        {interest}
                      </LuxeText>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={luxeDark.onPrimaryContainer} />
                      )}
                    </View>
                  </LuxeCard>
                );
              })}
            </View>
          </Animated.View>

          <View style={[s.divider, { backgroundColor: m3Colors.outlineVariant }]} />

          {/* Category accordions */}
          {interestCategories.map(category => {
            const isOpen = expanded[category.id] ?? false;
            const countInCat = category.interests.filter(i => selectedSet.has(i)).length;
            const allSelected = category.interests.every(i => selectedSet.has(i));
            const emoji = CATEGORY_EMOJI[category.id as keyof typeof CATEGORY_EMOJI] ?? '•';

            return (
              <View key={category.id} style={s.categoryBlock}>
                <View style={s.categoryHeader}>
                  <Pressable
                    style={({ pressed }) => [s.categoryHeaderPress, pressed && { opacity: 0.75 }]}
                    onPress={() => toggleSection(category.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${category.title}, ${countInCat} selected`}
                    accessibilityState={{ expanded: isOpen }}
                  >
                    <View style={[s.categoryIconWrap, { backgroundColor: luxeDark.primaryContainer }]}>
                      <Text style={s.categoryEmoji}>{emoji}</Text>
                    </View>
                    <View style={s.categoryTitleBlock}>
                      <LuxeText variant="title3" style={{ color: luxeDark.text }}>{category.title}</LuxeText>
                      {countInCat > 0 && (
                        <LuxeText variant="caption" style={{ color: luxeDark.primary }}>
                          {countInCat} selected
                        </LuxeText>
                      )}
                    </View>
                  </Pressable>

                  {isOpen && (
                    <LuxeButton
                        variant="glass"
                        size="sm"
                        onPress={() => toggleAll(category)}
                    >
                        {allSelected ? 'Clear' : 'All'}
                    </LuxeButton>
                  )}

                  <Pressable onPress={() => toggleSection(category.id)} hitSlop={10} style={s.chevronBtn}>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={luxeDark.textSecondary}
                    />
                  </Pressable>
                </View>

                {isOpen && (
                  <Animated.View entering={FadeInUp.duration(200)} layout={ReanimatedLayout.springify().damping(16)} style={s.interestList}>
                    {category.interests.map(interest => {
                      const isSelected = selectedSet.has(interest);
                      const icon = interestIcons[interest] ?? 'star';
                      return (
                        <LuxeCard
                          key={interest}
                          variant={isSelected ? "tonal" : "default"}
                          onPress={() => toggle(interest)}
                          style={s.interestCard}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                            <Text style={{ fontSize: 16 }}>{icon}</Text>
                            <LuxeText 
                              variant="body" 
                              style={{ color: isSelected ? luxeDark.onPrimaryContainer : luxeDark.text, flex: 1 }}
                            >
                              {interest}
                            </LuxeText>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color={luxeDark.onPrimaryContainer} />
                            )}
                          </View>
                        </LuxeCard>
                      );
                    })}
                  </Animated.View>
                )}

                <View style={[s.categoryDivider, { backgroundColor: luxeDark.border }]} />
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <Animated.View entering={FadeInDown.springify().damping(20).delay(250)} style={[s.bottomBar, { paddingBottom: bottomInset + 16, backgroundColor: luxeDark.background }]}>
        {!isReady && (
          <LuxeText variant="caption" style={{ textAlign: 'center', color: luxeDark.textSecondary }}>
            {remaining === 1 ? '1 more interest to go' : `${remaining} more interests to go`}
          </LuxeText>
        )}
        <LuxeButton
          variant="filled"
          fullWidth
          rightIcon={isReady ? 'sparkles' : undefined}
          disabled={!isReady || isSubmitting}
          onPress={handleFinish}
          style={{ height: 56 }}
        >
          {isSubmitting
            ? 'Saving...'
            : isReady
              ? destinationLabel
                ? `Go to ${destinationLabel}`
                : 'Create your page'
              : `Select ${remaining} more`}
        </LuxeButton>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — static StyleSheet (no per-render recreation)
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  titleBlock: {
    marginBottom: 24,
    gap: 8,
  },
  title: {
    lineHeight: 44,
  },
  subtitle: {
  },

  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressLabel: {
    minWidth: 90,
    textAlign: 'right',
  },

  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    letterSpacing: 1.6,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  categoryBlock: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  categoryHeaderPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitleBlock: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
  },
  categoryCount: {
  },
  chevronBtn: {
    paddingLeft: 16,
  },
  categoryDivider: {
    height: 1,
    marginTop: 12,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  remainingText: {
    textAlign: 'center',
  },

  // Vertical interest lists (popular + category accordions) — top to bottom, full width, same pattern as States/City
  interestList: {
    gap: 10,
  },
  interestCard: {
    width: '100%',
    borderRadius: 16,
  },
});
