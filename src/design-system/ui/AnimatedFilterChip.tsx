import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { GlassView } from '@/design-system/ui/GlassView';

export interface AnimatedFilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
  /** Legacy prop support */
  selected?: boolean;
}

export function AnimatedFilterChip({
  label,
  active,
  selected,
  onPress,
  icon,
  style,
}: AnimatedFilterChipProps) {
  const colors = useColors();
  const isActive = active ?? selected;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        style={({ pressed }) => [
          styles.hit,
          pressed && { opacity: 0.85 },
        ]}
      >
        <GlassView
          intensity={isActive ? 30 : 10}
          style={[
            styles.chip,
            {
              backgroundColor: isActive ? colors.primary : colors.surface + '80',
              borderColor: isActive ? colors.primary : colors.borderLight,
            },
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={14}
              color={isActive ? '#FFFFFF' : colors.textSecondary}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.label,
              { color: isActive ? '#FFFFFF' : colors.text },
            ]}
          >
            {label}
          </Text>
        </GlassView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hit: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 36,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    ...Platform.select({
      android: { includeFontPadding: false as const },
      default: {},
    }),
  },
});

export default AnimatedFilterChip;
