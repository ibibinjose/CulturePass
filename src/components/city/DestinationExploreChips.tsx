import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ExploreCategoryKey } from '@/hooks/useCityPage';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useColors } from '@/hooks/useColors';
import { gradients, FontFamily } from '@/design-system/tokens/theme';
import { EXPLORE_CATEGORY_ACCENT } from '@/components/city/cityTheme';
import { DESTINATION_EXPLORE_LINKS } from '@/components/city/destinationLayout';
import { withAlpha } from '@/lib/withAlpha';

type ChipVariant = 'accent' | 'gradient';

interface DestinationExploreChipsProps {
  active: ExploreCategoryKey;
  onSelect: (key: ExploreCategoryKey) => void;
  hPad: number;
  variant?: ChipVariant;
  showBorder?: boolean;
}

export function DestinationExploreChips({
  active,
  onSelect,
  hPad,
  variant = 'accent',
  showBorder = true,
}: DestinationExploreChipsProps) {
  const m3Colors = useM3Colors();
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        s.row,
        {
          paddingHorizontal: hPad,
          paddingVertical: 10,
          paddingRight: hPad + 32,
          borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: variant === 'accent' ? m3Colors.outlineVariant : colors.borderLight,
        },
      ]}
    >
      {DESTINATION_EXPLORE_LINKS.map((item) => {
        const isActive = active === item.key;
        if (variant === 'gradient') {
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${item.label}`}
              accessibilityState={{ selected: isActive }}
            >
              {isActive ? (
                <LinearGradient
                  colors={gradients.culturepassBrand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.chipActive}
                >
                  <Ionicons name={item.icon} size={14} color="#fff" />
                  <Text style={s.chipActiveText}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    s.chipIdle,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={14} color={colors.textSecondary} />
                  <Text style={[s.chipIdleText, { color: colors.textSecondary }]}>{item.label}</Text>
                </View>
              )}
            </Pressable>
          );
        }

        const accent = EXPLORE_CATEGORY_ACCENT[item.key];
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            accessibilityRole="button"
            accessibilityLabel={`Show ${item.label}`}
            accessibilityState={{ selected: isActive }}
          >
            {isActive ? (
              <View style={[s.chipActive, { backgroundColor: accent }]}>
                <Ionicons name={item.icon} size={14} color="#fff" />
                <Text style={s.chipActiveText}>{item.label}</Text>
              </View>
            ) : (
              <View
                style={[
                  s.chipIdle,
                  {
                    backgroundColor: withAlpha(accent, 0.08),
                    borderColor: withAlpha(accent, 0.22),
                  },
                ]}
              >
                <Ionicons name={item.icon} size={14} color={accent} />
                <Text style={[s.chipIdleText, { color: m3Colors.onSurface }]}>{item.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  chipActiveText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#fff',
  },
  chipIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipIdleText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});