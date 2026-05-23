import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';
import { Radius, SpringConfig } from '@/design-system/tokens/theme';

interface M3FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap | string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

function isIoniconName(icon: string): icon is keyof typeof Ionicons.glyphMap {
  return Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, icon);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Premium M3 Filter Chip with tactile feedback and Material 3 Expressive states. */
export function M3FilterChip({ label, selected, onPress, icon, style, compact = false }: M3FilterChipProps) {
  const colors = useM3Colors();
  const iconSize = compact ? 16 : 18;
  const typography = compact ? M3Typography.labelMedium : M3Typography.labelLarge;
  const iconName = icon && isIoniconName(icon) ? icon : undefined;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SpringConfig.snappy);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor: selected ? colors.secondaryContainer : 'transparent',
          borderColor: selected ? 'transparent' : colors.outline,
        },
        animatedStyle,
        style,
      ]}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={selected ? colors.onSecondaryContainer : colors.primary}
          style={[styles.icon, compact && styles.iconCompact]}
        />
      ) : icon ? (
        <Text
          style={[
            styles.textIcon,
            compact && styles.textIconCompact,
            { fontSize: iconSize, color: selected ? colors.onSecondaryContainer : colors.primary },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {icon}
        </Text>
      ) : null}
      <Text
        style={[
          typography,
          { color: selected ? colors.onSecondaryContainer : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark"
          size={iconSize}
          color={colors.onSecondaryContainer}
          style={[styles.checkIcon, compact && styles.checkIconCompact]}
        />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginRight: 8,
  },
  containerCompact: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
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
