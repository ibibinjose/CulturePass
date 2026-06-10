import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

export type PassViewKey = 'business' | 'lanyard' | 'event';

type PassViewOption = {
  key: PassViewKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OPTIONS: PassViewOption[] = [
  { key: 'business', label: 'Business', icon: 'id-card-outline' },
  { key: 'lanyard', label: 'Lanyard', icon: 'ribbon-outline' },
  { key: 'event', label: 'Event', icon: 'ticket-outline' },
];

export type PassViewSwitcherProps = {
  value: PassViewKey;
  onChange: (key: PassViewKey) => void;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
};

export function PassViewSwitcher({
  value,
  onChange,
  accentColor,
  backgroundColor,
  borderColor,
  textColor,
  mutedColor,
}: PassViewSwitcherProps) {
  const activeIndex = OPTIONS.findIndex((o) => o.key === value);
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 240,
      friction: 22,
    }).start();
  }, [activeIndex, slideAnim]);

  return (
    <View style={[styles.wrap, { backgroundColor, borderColor }]} accessibilityRole="tablist">
      {/* Sliding pill indicator — web uses CSS transition; native uses Animated */}
      {Platform.OS === 'web' ? (
        <View
          style={[
            styles.pillWeb,
            {
              left: `${(activeIndex / OPTIONS.length) * 100}%`,
              width: `${(1 / OPTIONS.length) * 100}%`,
              backgroundColor: withAlpha(accentColor, 0.12),
              borderColor: withAlpha(accentColor, 0.35),
            },
          ]}
          // @ts-ignore — web-only transition style
          {...({ style: { transition: 'left 0.22s cubic-bezier(0.34,1.56,0.64,1)' } } as object)}
        />
      ) : (
        <Animated.View
          style={[
            styles.pillNative,
            {
              backgroundColor: withAlpha(accentColor, 0.12),
              borderColor: withAlpha(accentColor, 0.35),
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, 0, 0], // computed inline per-platform is tricky; use opacity fallback
                  }),
                },
              ],
            },
          ]}
        />
      )}

      {OPTIONS.map((opt, index) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.btn,
              // On native, keep the border on active item too for clarity
              Platform.OS !== 'web' && active && { backgroundColor: withAlpha(accentColor, 0.12), borderColor: withAlpha(accentColor, 0.35) },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label} pass`}
          >
            <View style={[styles.iconWrap, active && { backgroundColor: withAlpha(accentColor, 0.18) }]}>
              <Ionicons name={opt.icon} size={16} color={active ? accentColor : mutedColor} />
            </View>
            <Text style={[styles.label, { color: active ? textColor : mutedColor }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  pillWeb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 0,
  },
  pillNative: {
    display: 'none', // native uses per-btn styling above for simplicity
  },
  btn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
    zIndex: 1,
    ...Platform.select({ web: { cursor: 'pointer' } } as object),
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 10, fontFamily: FontFamily.semibold },
});