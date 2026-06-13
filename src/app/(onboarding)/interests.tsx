import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  type DimensionValue,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboardingTheme } from '@/hooks/useOnboardingTheme';
import { FontFamily } from '@/design-system/tokens/theme';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { useInterestsSelection } from '@/hooks/useInterestsSelection';
import { OnboardingProgressHeader } from '@/components/onboarding/OnboardingProgressHeader';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import {
  OnboardingHero,
  OnboardingPanel,
  OnboardingPickerGrid,
  OnboardingPickerTile,
  OnboardingPrimaryButton,
  OnboardingRestartLink,
  onboardingFormStyles,
} from '@/components/onboarding/OnboardingFlowPrimitives';
import { showUserAlert } from '@/lib/showUserAlert';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  interestCategories,
  popularInterestsSydney,
  interestIcons,
} from '@/constants/onboardingInterests';

const CATEGORY_EMOJI: Record<string, string> = {
  cultural: '🎭',
  arts: '🎨',
  food: '🍛',
  business: '💼',
  family: '👨‍👩‍👧',
  civic: '🏙️',
  wellness: '🧘',
  format: '🎟️',
};

export default function InterestsScreen() {
  const { colors, au } = useOnboardingTheme();
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
    handleFinish: handleFinishHook,
  } = useInterestsSelection();

  const handleFinish = async () => {
    if (!isReady) {
      showUserAlert(
        'Select more interests',
        `Please select at least ${MIN_REQUIRED} interests to continue.`,
      );
      return;
    }
    const res = await handleFinishHook();
    if (res?.success === false) {
      showUserAlert('Could not finish onboarding', 'Please try again.');
    }
  };

  const progressPct = `${Math.min(1, selected.length / MIN_REQUIRED) * 100}%` as DimensionValue;

  const renderInterestTile = (interest: string) => (
    <OnboardingPickerTile
      key={interest}
      label={interest}
      emoji={interestIcons[interest] ?? '⭐'}
      selected={selectedSet.has(interest)}
      onPress={() => toggle(interest)}
      au={au}
      colors={colors}
      columns={1}
    />
  );

  return (
    <View style={[s.root, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title="Interests"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo) as string)
        }
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
          onboardingFormStyles.scroll,
          isDesktop && onboardingFormStyles.scrollDesktop,
          { paddingBottom: bottomInset + 120 },
        ]}
      >
        <Animated.View entering={FadeInUp.springify().damping(16).delay(100)}>
          <LuxeCard
            variant="glass"
            style={[
              onboardingFormStyles.glassCard,
              isDesktop && onboardingFormStyles.glassCardDesktop,
            ]}
          >
            {redirectTo ? <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" /> : null}

            <OnboardingHero
              icon="heart"
              title="What interests you?"
              subtitle={`Pick at least ${MIN_REQUIRED} to personalise your feed.`}
              au={au}
            />

            <Animated.View entering={FadeInDown.springify().damping(15).delay(150)} style={s.progressBlock}>
              <View
                style={[
                  s.progressTrack,
                  { backgroundColor: colors.surfaceElevated, borderColor: au.cardBorder },
                ]}
              >
                <View
                  style={[
                    s.progressFill,
                    {
                      width: progressPct,
                      backgroundColor: isReady ? au.blue : au.red,
                    },
                  ]}
                />
              </View>
              <LuxeText
                variant="badgeCaps"
                style={{
                  color: isReady ? au.selectedText : au.body,
                  minWidth: 88,
                  textAlign: 'right',
                  fontSize: 11,
                }}
              >
                {isReady ? `${selected.length} SELECTED` : `${selected.length} / ${MIN_REQUIRED}`}
              </LuxeText>
            </Animated.View>

            <OnboardingPanel
              title="Popular near you"
              subtitle="Tap to add — choose more categories below."
              au={au}
              colors={colors}
            >
              <OnboardingPickerGrid columns={1}>
                {popularInterestsSydney.map(renderInterestTile)}
              </OnboardingPickerGrid>

              <View style={[s.sectionDivider, { backgroundColor: au.panelBorder }]} />

              {interestCategories.map((category) => {
                const isOpen = expanded[category.id] ?? false;
                const countInCat = category.interests.filter((i) => selectedSet.has(i)).length;
                const allSelected = category.interests.every((i) => selectedSet.has(i));
                const emoji = CATEGORY_EMOJI[category.id as keyof typeof CATEGORY_EMOJI] ?? '•';

                return (
                  <View key={category.id} style={s.categoryBlock}>
                    <View
                      style={[
                        s.categoryHeader,
                        {
                          borderColor: au.cardBorder,
                          backgroundColor: isOpen ? au.blueContainer : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Pressable
                        style={({ pressed }) => [s.categoryHeaderPress, pressed && { opacity: 0.75 }]}
                        onPress={() => toggleSection(category.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`${category.title}, ${countInCat} selected`}
                        accessibilityState={{ expanded: isOpen }}
                      >
                        <View
                          style={[
                            s.categoryIconWrap,
                            {
                              backgroundColor: isOpen ? colors.surface : au.blueContainer,
                              borderWidth: 1,
                              borderColor: au.cardBorder,
                            },
                          ]}
                        >
                          <Text style={s.categoryEmoji}>{emoji}</Text>
                        </View>
                        <View style={s.categoryTitleBlock}>
                          <LuxeText
                            variant="bodyMedium"
                            style={{
                              color: au.heading,
                              fontFamily: FontFamily.semibold,
                              fontSize: 15,
                            }}
                          >
                            {category.title}
                          </LuxeText>
                          {countInCat > 0 ? (
                            <LuxeText variant="caption" style={{ color: au.selectedText, fontSize: 12 }}>
                              {countInCat} selected
                            </LuxeText>
                          ) : null}
                        </View>
                      </Pressable>

                      {isOpen ? (
                        <LuxeButton
                          variant="glass"
                          size="sm"
                          onPress={() => toggleAll(category)}
                          style={{ borderWidth: 1, borderColor: au.cardBorder }}
                        >
                          {allSelected ? 'Clear' : 'All'}
                        </LuxeButton>
                      ) : null}

                      <Pressable onPress={() => toggleSection(category.id)} hitSlop={10} style={s.chevronBtn}>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={au.body} />
                      </Pressable>
                    </View>

                    {isOpen ? (
                      <Animated.View
                        entering={FadeInUp.duration(200)}
                        layout={ReanimatedLayout.springify().damping(16)}
                        style={s.categoryGridWrap}
                      >
                        <OnboardingPickerGrid columns={1}>
                          {category.interests.map(renderInterestTile)}
                        </OnboardingPickerGrid>
                      </Animated.View>
                    ) : null}
                  </View>
                );
              })}
            </OnboardingPanel>

            <OnboardingRestartLink redirectTo={redirectTo} au={au} />
          </LuxeCard>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.springify().damping(20).delay(250)}
        style={[
          s.bottomBar,
          {
            paddingBottom: bottomInset + 12,
            backgroundColor: colors.surface,
            borderTopColor: au.panelBorder,
          },
        ]}
      >
        {!isReady ? (
          <LuxeText variant="caption" style={{ textAlign: 'center', color: au.body, fontSize: 14 }}>
            {remaining === 1 ? '1 more interest to go' : `${remaining} more interests to go`}
          </LuxeText>
        ) : null}
        <OnboardingPrimaryButton
          au={au}
          fullWidth
          rightIcon={isReady ? 'sparkles' : undefined}
          disabled={!isReady || isSubmitting}
          loading={isSubmitting}
          onPress={handleFinish}
        >
          {isSubmitting
            ? 'Saving...'
            : isReady
              ? destinationLabel
                ? `Go to ${destinationLabel}`
                : 'Create your page'
              : `Select ${remaining} more`}
        </OnboardingPrimaryButton>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  sectionDivider: {
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: 4,
  },

  categoryBlock: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  categoryHeaderPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryTitleBlock: {
    flex: 1,
    gap: 2,
  },
  chevronBtn: {
    paddingLeft: 4,
  },
  categoryGridWrap: {
    paddingBottom: 4,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 2,
  },
});