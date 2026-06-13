import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { FontFamily } from '@/design-system/tokens/theme';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { useLayout } from '@/hooks/useLayout';
import { useOnboardingTheme } from '@/hooks/useOnboardingTheme';

export type OnboardingStep = 'location' | 'communities' | 'culture-match' | 'interests';

interface OnboardingProgressHeaderProps {
  currentStep: OnboardingStep;
  redirectTo?: string | null;
  /** @deprecated Palette is always AU-themed via useOnboardingTheme */
  accentColor?: string;
  /** @deprecated Palette is always AU-themed via useOnboardingTheme */
  accentSecondaryColor?: string;
}

const STEPS: {
  key: OnboardingStep;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  { key: 'location', label: 'Location', shortLabel: 'Location', icon: 'location-sharp', route: '/(onboarding)/location' },
  { key: 'communities', label: 'Communities', shortLabel: 'Groups', icon: 'people-sharp', route: '/(onboarding)/communities' },
  { key: 'culture-match', label: 'Culture Match', shortLabel: 'Culture', icon: 'globe-sharp', route: '/(onboarding)/culture-match' },
  { key: 'interests', label: 'Interests', shortLabel: 'Interests', icon: 'sparkles-sharp', route: '/(onboarding)/interests' },
];

export function OnboardingProgressHeader({
  currentStep,
  redirectTo,
}: OnboardingProgressHeaderProps) {
  const { isDesktop } = useLayout();
  const { colors, au } = useOnboardingTheme();
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleStepPress = (targetIndex: number) => {
    if (targetIndex >= currentIndex) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const step = STEPS[targetIndex];
    router.replace({
      pathname: step.route as never,
      params: redirectTo ? { redirectTo } : undefined,
    });
  };

  return (
    <View style={s.outer}>
      <View
        style={[
          s.trackShell,
          {
            borderColor: au.panelBorder,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={s.accent}>
          <View style={[s.accentBar, { backgroundColor: au.blue }]} />
          <View style={[s.accentBar, { backgroundColor: au.red }]} />
        </View>

        {isDesktop ? (
          <View style={s.desktopRow}>
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
                      s.desktopStep,
                      isDone && s.tappable,
                      pressed && isDone && { opacity: 0.75 },
                    ]}
                  >
                    <View
                      style={[
                        s.circle,
                        isDone
                          ? { backgroundColor: au.blue, borderColor: au.blue }
                          : isActive
                            ? { borderColor: au.red, borderWidth: 2, backgroundColor: colors.surfaceElevated }
                            : { borderColor: au.cardBorder, backgroundColor: colors.surfaceElevated },
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      ) : (
                        <Ionicons
                          name={step.icon}
                          size={13}
                          color={isActive ? au.blue : au.bodyMuted}
                        />
                      )}
                    </View>
                    <View style={s.stepCopy}>
                      <LuxeText
                        variant="caption"
                        style={{
                          color: isActive ? au.blue : au.bodyMuted,
                          fontSize: 10,
                          fontFamily: FontFamily.bold,
                          letterSpacing: 0.6,
                        }}
                      >
                        STEP {i + 1}
                      </LuxeText>
                      <LuxeText
                        variant="caption"
                        style={{
                          color: isActive ? au.heading : isDone ? au.body : au.bodyMuted,
                          fontFamily: isActive ? FontFamily.semibold : FontFamily.medium,
                          fontSize: 13,
                        }}
                      >
                        {step.label}
                      </LuxeText>
                    </View>
                  </Pressable>
                  {i < STEPS.length - 1 ? (
                    <View
                      style={[
                        s.connector,
                        { backgroundColor: isDone ? au.blue : au.cardBorder },
                      ]}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        ) : (
          <View style={s.mobileBody}>
            <View style={s.mobileTopRow}>
              <LuxeText
                variant="badgeCaps"
                style={{ color: au.blue, letterSpacing: 1, fontSize: 11 }}
              >
                STEP {currentIndex + 1} OF {STEPS.length}
              </LuxeText>
              <LuxeText
                variant="bodyMedium"
                style={{ color: au.heading, fontFamily: FontFamily.semibold, fontSize: 15 }}
              >
                {STEPS[currentIndex]?.label}
              </LuxeText>
            </View>

            <View style={s.mobileChips}>
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
                      s.chip,
                      {
                        borderColor: isActive ? au.blue : isDone ? au.blue : au.cardBorder,
                        backgroundColor: isActive
                          ? au.selectedBg
                          : isDone
                            ? au.blueContainer
                            : colors.surfaceElevated,
                      },
                      isDone && pressed && { opacity: 0.8 },
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={10} color={au.blue} />
                    ) : (
                      <LuxeText
                        variant="caption"
                        style={{
                          color: isActive ? au.selectedText : au.bodyMuted,
                          fontSize: 10,
                          fontFamily: FontFamily.bold,
                        }}
                      >
                        {i + 1}
                      </LuxeText>
                    )}
                    <LuxeText
                      variant="caption"
                      numberOfLines={1}
                      style={{
                        color: isActive ? au.selectedText : isDone ? au.body : au.bodyMuted,
                        fontSize: 9,
                        fontFamily: FontFamily.medium,
                      }}
                    >
                      {step.shortLabel}
                    </LuxeText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    width: '100%',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  trackShell: {
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  accent: { flexDirection: 'row', height: 4 },
  accentBar: { flex: 1 },

  desktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  desktopStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tappable: {
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as object : {}),
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepCopy: { gap: 1 },
  connector: {
    width: 28,
    height: 2,
    marginHorizontal: 4,
  },

  mobileBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  mobileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 2,
    minHeight: 40,
  },
});