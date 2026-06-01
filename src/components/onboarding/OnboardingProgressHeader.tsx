import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { FontFamily } from '@/design-system/tokens/theme';
import { luxeDark } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { useLayout } from '@/hooks/useLayout';

export type OnboardingStep = 'location' | 'communities' | 'culture-match' | 'interests';

interface OnboardingProgressHeaderProps {
  currentStep: OnboardingStep;
  /** Optional parameter to preserve redirect routes */
  redirectTo?: string | null;
}

const STEPS: { key: OnboardingStep; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'location', label: 'Location', icon: 'location-sharp', route: '/(onboarding)/location' },
  { key: 'communities', label: 'Communities', icon: 'people-sharp', route: '/(onboarding)/communities' },
  { key: 'culture-match', label: 'Culture Match', icon: 'globe-sharp', route: '/(onboarding)/culture-match' },
  { key: 'interests', label: 'Interests', icon: 'sparkles-sharp', route: '/(onboarding)/interests' },
];

export function OnboardingProgressHeader({ currentStep, redirectTo }: OnboardingProgressHeaderProps) {
  const { isDesktop } = useLayout();
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleStepPress = (targetIndex: number) => {
    if (targetIndex >= currentIndex) return; // Cannot jump forward without completing steps
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const step = STEPS[targetIndex];
    router.replace({
      pathname: step.route as any,
      params: redirectTo ? { redirectTo } : undefined,
    });
  };

  return (
    <View style={s.outer}>
      {isDesktop ? (
        // Desktop full stepper
        <View style={s.desktopStepper}>
          {STEPS.map((step, i) => {
            const isDone = i < currentIndex;
            const isActive = i === currentIndex;
            const isFuture = i > currentIndex;

            return (
              <React.Fragment key={step.key}>
                <Pressable
                  onPress={() => handleStepPress(i)}
                  disabled={isFuture}
                  style={({ pressed }) => [
                    s.desktopStepItem,
                    isDone && s.interactiveStep,
                    pressed && isDone && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      s.stepCircle,
                      isDone
                        ? s.stepCircleDone
                        : isActive
                        ? s.stepCircleActive
                        : s.stepCircleFuture,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    ) : (
                      <Ionicons
                        name={step.icon}
                        size={14}
                        color={isActive ? luxeDark.primary : luxeDark.textTertiary}
                      />
                    )}
                  </View>
                  <View style={s.stepTextWrap}>
                    <LuxeText
                      variant="caption"
                      style={[
                        s.stepNumber,
                        { color: isActive ? luxeDark.primary : luxeDark.textTertiary },
                      ]}
                    >
                      STEP {i + 1}
                    </LuxeText>
                    <LuxeText
                      variant="bodyMedium"
                      style={[
                        s.stepLabel,
                        {
                          color: isActive ? luxeDark.text : isDone ? luxeDark.textSecondary : luxeDark.textTertiary,
                          fontFamily: isActive ? FontFamily.semibold : FontFamily.regular,
                        },
                      ]}
                    >
                      {step.label}
                    </LuxeText>
                  </View>
                </Pressable>
                {i < STEPS.length - 1 && (
                  <View
                    style={[
                      s.desktopLine,
                      { backgroundColor: isDone ? luxeDark.primary : luxeDark.border },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        // Mobile segment indicator
        <View style={s.mobileStepper}>
          <View style={s.mobileStepLabelRow}>
            <LuxeText variant="badgeCaps" style={{ color: luxeDark.primary, letterSpacing: 1.2 }}>
              STEP {currentIndex + 1} OF 4
            </LuxeText>
            <LuxeText variant="bodyMedium" style={{ color: luxeDark.text, fontFamily: FontFamily.semibold }}>
              {STEPS[currentIndex].label}
            </LuxeText>
          </View>

          <View style={s.segmentsRow}>
            {STEPS.map((step, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;
              const isFuture = i > currentIndex;

              return (
                <Pressable
                  key={step.key}
                  onPress={() => handleStepPress(i)}
                  disabled={isFuture}
                  style={({ pressed }) => [
                    s.segmentPressable,
                    isDone && pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      s.segmentBar,
                      isDone
                        ? s.segmentBarDone
                        : isActive
                        ? s.segmentBarActive
                        : s.segmentBarFuture,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    width: '100%',
    paddingBottom: 16,
  },
  // Desktop Layout
  desktopStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: luxeDark.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: luxeDark.border,
    paddingHorizontal: 24,
  },
  desktopStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  interactiveStep: {
    cursor: Platform.select({ web: 'pointer', default: undefined }),
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepCircleDone: {
    backgroundColor: luxeDark.primary,
    borderColor: luxeDark.primary,
  },
  stepCircleActive: {
    backgroundColor: 'transparent',
    borderColor: luxeDark.primary,
  },
  stepCircleFuture: {
    backgroundColor: 'transparent',
    borderColor: luxeDark.border,
  },
  stepTextWrap: {
    gap: 2,
  },
  stepNumber: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: FontFamily.bold,
  },
  stepLabel: {
    fontSize: 14,
  },
  desktopLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 16,
    maxWidth: 60,
  },

  // Mobile Layout
  mobileStepper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  mobileStepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    width: '100%',
  },
  segmentPressable: {
    flex: 1,
    height: '100%',
  },
  segmentBar: {
    height: '100%',
    borderRadius: 2,
  },
  segmentBarDone: {
    backgroundColor: luxeDark.primary,
  },
  segmentBarActive: {
    backgroundColor: luxeDark.primary,
  },
  segmentBarFuture: {
    backgroundColor: luxeDark.border,
    opacity: 0.5,
  },
});
