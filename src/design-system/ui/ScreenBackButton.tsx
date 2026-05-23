import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_APP_BACK_FALLBACK, useSafeBack } from '@/lib/navigation';

export interface ScreenBackButtonProps extends Omit<PressableProps, 'onPress'> {
  /** Route used when there is no history to pop (deep link, refresh). */
  fallback?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  accessibilityLabel?: string;
}

/**
 * Icon-only back control: pops the stack when possible, otherwise `router.replace(fallback)`.
 * Prefer over raw `router.back()` anywhere a chevron/arrow back affordance is shown.
 */
export function ScreenBackButton({
  fallback = DEFAULT_APP_BACK_FALLBACK,
  icon = 'arrow-back',
  iconSize = 20,
  iconColor = '#111827',
  accessibilityLabel = 'Go back',
  ...rest
}: ScreenBackButtonProps) {
  const onPress = useSafeBack(fallback);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      {...rest}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}
