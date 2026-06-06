import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useAppAppearance } from '@/hooks/useAppAppearance';

type Props = {
  compact?: boolean;
};

/**
 * Single control: tap toggles explicit **dark ↔ light** (sets preference; leaves Settings → Appearance for system).
 */
export function AppearanceModeToggle({ compact }: Props) {
  const m3 = useM3Colors();
  const { resolvedScheme, setPreference } = useAppAppearance();
  const iconSize = compact ? 20 : 22;
  const isDark = resolvedScheme === 'dark';

  const onToggle = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void setPreference(isDark ? 'light' : 'dark');
  }, [isDark, setPreference]);

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.hit,
        compact && styles.hitCompact,
        { backgroundColor: m3.surfaceContainerHighest },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Ionicons
        name={isDark ? 'moon' : 'sunny'}
        size={compact ? Math.max(16, iconSize - 4) : Math.max(18, iconSize - 4)}
        color={m3.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  hitCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
});
