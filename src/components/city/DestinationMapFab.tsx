import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { CultureTokens } from '@/design-system/tokens/theme';

interface DestinationMapFabProps {
  onPress: () => void;
  bottom: number;
  /** M3 tab uses gradient; hub pages use solid indigo */
  variant?: 'gradient' | 'solid';
  enteringDelay?: number;
}

export function DestinationMapFab({
  onPress,
  bottom,
  variant = 'solid',
  enteringDelay = 0,
}: DestinationMapFabProps) {
  const inner = (
    <>
      <Ionicons name="map" size={variant === 'gradient' ? 22 : 20} color="#FFFFFF" />
      <Text style={s.label}>Map</Text>
    </>
  );

  const pressedStyle = ({ pressed }: { pressed: boolean }) =>
    pressed ? { opacity: 0.92, transform: [{ scale: 0.96 }] } : undefined;

  return (
    <Animated.View
      entering={FadeInDown.delay(enteringDelay).springify()}
      style={[s.wrap, { bottom }]}
    >
      {variant === 'gradient' ? (
        <Pressable
          onPress={onPress}
          style={pressedStyle}
          accessibilityRole="button"
          accessibilityLabel="Open map"
        >
          <LinearGradient
            colors={Luxe.gradients.emeraldIndigo}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={s.btn}
          >
            {inner}
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [s.btn, s.btnSolid, pressedStyle({ pressed })]}
          accessibilityRole="button"
          accessibilityLabel="Open map"
        >
          {inner}
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: Platform.OS === 'web' ? 24 : 16,
    zIndex: 1000,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 28,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(10,140,127,0.35)' },
      default: {
        elevation: 6,
        shadowColor: Luxe.colors.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
    }),
  },
  btnSolid: {
    backgroundColor: CultureTokens.indigo,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  label: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
});