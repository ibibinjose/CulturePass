import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { LuxeText } from '@/design-system/ui';
import { Spacing, Radius, M3Typography } from '@/design-system/tokens/theme';
import { labelForOnboardingDestination } from '@/lib/onboardingDestination';

interface OnboardingDestinationBannerProps {
  redirectTo: string | null | undefined;
  /** Shown on auth screens vs mid-onboarding steps */
  variant?: 'auth' | 'step';
}

export function OnboardingDestinationBanner({
  redirectTo,
  variant = 'auth',
}: OnboardingDestinationBannerProps) {
  const m3Colors = useM3Colors();
  const label = labelForOnboardingDestination(redirectTo);
  if (!label) return null;

  const message =
    variant === 'auth'
      ? `After sign-in, you'll continue setup and return to ${label}.`
      : `When you finish, we'll take you to ${label}.`;

  return (
    <View
      style={[
        s.banner,
        {
          backgroundColor: m3Colors.primaryContainer,
          borderColor: m3Colors.primary,
        },
      ]}
      accessibilityRole="text"
    >
      <Ionicons name="navigate-circle-outline" size={20} color={m3Colors.onPrimaryContainer} />
      <LuxeText variant="body" style={[M3Typography.bodySmall, s.text, { color: m3Colors.onPrimaryContainer }]}>
        {message}
      </LuxeText>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: Spacing.md,
  },
  text: {
    flex: 1,
    lineHeight: 20,
  },
});