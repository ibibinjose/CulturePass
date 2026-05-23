/**
 * OnboardingBanner — dismissible inline banner shown on Discover when
 * the user has skipped one or more onboarding steps.
 *
 * Shown during the first 3 sessions after a skip. Dismissed once per session.
 * Navigates to the incomplete step on tap (Req 2.3, 2.4).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius, Spacing, CultureTokens } from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const BANNER_KEY = '@cp_onboarding_banner';

interface BannerState {
  skippedSteps: ('cultures' | 'location' | 'communities')[];
  dismissedThisSession: boolean;
  sessionDismissalCount: number;
}

const MAX_SESSIONS = 3;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OnboardingBannerProps {
  /** Steps the user has skipped — empty array = banner hidden. */
  skippedSteps: ('cultures' | 'location' | 'communities')[];
}

const STEP_ROUTES: Record<'cultures' | 'location' | 'communities', string> = {
  cultures: '/(onboarding)/culture-match', // actual screen name (no /cultures file)
  location: '/(onboarding)/location',
  communities: '/(onboarding)/communities',
};

const STEP_LABELS: Record<'cultures' | 'location' | 'communities', string> = {
  cultures: 'your cultural identity',
  location: 'your location',
  communities: 'communities to follow',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingBanner({ skippedSteps }: OnboardingBannerProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (skippedSteps.length === 0) {
      setVisible(false);
      return;
    }

    AsyncStorage.getItem(BANNER_KEY).then((raw) => {
      const saved = raw ? (JSON.parse(raw) as BannerState) : null;
      const dismissals = saved?.sessionDismissalCount ?? 0;

      if (dismissals >= MAX_SESSIONS) {
        setVisible(false);
        return;
      }

      setSessionCount(dismissals);
      setVisible(true);
    });
  }, [skippedSteps]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    const newCount = sessionCount + 1;
    const next: BannerState = {
      skippedSteps,
      dismissedThisSession: true,
      sessionDismissalCount: newCount,
    };
    await AsyncStorage.setItem(BANNER_KEY, JSON.stringify(next));
  }, [sessionCount, skippedSteps]);

  const handleTap = useCallback(() => {
    const step = skippedSteps[0];
    if (!step) return;
    dismiss();
    router.push(STEP_ROUTES[step] as Parameters<typeof router.push>[0]);
  }, [skippedSteps, dismiss]);

  if (!visible || skippedSteps.length === 0) return null;

  const firstStep = skippedSteps[0]!;
  const label = STEP_LABELS[firstStep];

  return (
    <Pressable
      onPress={handleTap}
      style={[styles.banner, { backgroundColor: colors.surface, borderColor: CultureTokens.violet + '40' }]}
      accessibilityRole="button"
      accessibilityLabel={`Complete your profile: add ${label}. Tap to continue setup.`}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>✨</Text>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text }]}>
            Finish setting up your profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            Add {label} for better recommendations
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
        >
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  right: {
    paddingLeft: 8,
  },
});
