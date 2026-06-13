import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Luxe, luxeDark, luxeLight } from '@/design-system/tokens/luxeHeritage';
import { useIsDark } from '@/hooks/useColors';

interface LuxeFilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap | string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  activeBgColor?: string;
  activeTextColor?: string;
}

function isIoniconName(icon: string): icon is keyof typeof Ionicons.glyphMap {
  return Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, icon);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Premium Luxe Filter Chip with tactile feedback and elevated cultural aesthetics. */
export function LuxeFilterChip({
  label,
  selected,
  onPress,
  icon,
  style,
  compact = false,
  activeBgColor,
  activeTextColor,
}: LuxeFilterChipProps) {
  const iconSize = compact ? 16 : 18;
  const iconName = icon && isIoniconName(icon) ? icon : undefined;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, Luxe.spring.snappy);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Luxe.spring.smooth);
  };

  const isDark = useIsDark();
  const theme = isDark ? luxeDark : luxeLight;

  const activeBg = activeBgColor || theme.primaryContainer;
  const activeContent = activeTextColor || theme.onPrimaryContainer;
  const inactiveBg = theme.surfaceElevated;
  const inactiveContent = theme.textSecondary;
  const inactiveBorder = theme.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor: selected ? activeBg : inactiveBg,
          borderColor: selected ? 'transparent' : inactiveBorder,
        },
        animatedStyle,
        style,
      ]}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={selected ? activeContent : Luxe.colors.appBlue}
          style={[styles.icon, compact && styles.iconCompact]}
        />
      ) : icon ? (
        <Text
          style={[
            styles.textIcon,
            compact && styles.textIconCompact,
            { fontSize: iconSize, color: selected ? activeContent : Luxe.colors.appBlue },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {icon}
        </Text>
      ) : null}
      <Text
        style={[
          Luxe.typography.styles.bodyMedium,
          {
            fontSize: compact ? 13 : 14,
            color: selected ? activeContent : theme.text,
            fontWeight: selected ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark"
          size={iconSize}
          color={activeContent}
          style={[styles.checkIcon, compact && styles.checkIconCompact]}
        />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: Luxe.radius.md,
    borderWidth: 1.5,
  },
  containerCompact: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Luxe.radius.sm,
  },
  icon: {
    marginRight: 8,
  },
  iconCompact: {
    marginRight: 6,
  },
  textIcon: {
    marginRight: 8,
    lineHeight: 20,
  },
  textIconCompact: {
    marginRight: 6,
    lineHeight: 18,
  },
  checkIcon: {
    marginLeft: 8,
  },
  checkIconCompact: {
    marginLeft: 6,
  },
});

export default LuxeFilterChip;
