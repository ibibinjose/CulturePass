import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import {
  GROUP_COLORS,
  GROUP_TABS,
  type CategoryGroup,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';

export function HostspaceCreateCategoryGrid({
  categories,
  activeGroups,
  onGroupToggle,
  onSelect,
  query,
  onQueryChange,
}: {
  categories: CreateCategory[];
  activeGroups: CategoryGroup[];
  onGroupToggle: (g: CategoryGroup) => void;
  onSelect: (c: CreateCategory) => void;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const colors = useColors();
  const { isMobile } = useLayout();
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.gridSelector}>
      <Text style={[styles.gridTitle, { color: colors.text }]}>What are you creating?</Text>

      <View style={[styles.searchRow, { borderColor: colors.borderLight, backgroundColor: colors.background + '80', marginBottom: 8 }]}>
        <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search listing types..."
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.text }]}
          accessibilityLabel="Search listing types"
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.groupTabsRow, { marginBottom: 4 }]}>
        {GROUP_TABS.map((tab) => {
          const active = activeGroups.includes(tab.id);
          const tabColor = GROUP_COLORS[tab.id];
          return (
            <Pressable
              key={tab.id}
              onPress={() => onGroupToggle(tab.id)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${tab.label}`}
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.groupTab,
                  {
                    backgroundColor: active ? tabColor + '18' : 'transparent',
                    borderColor: active ? tabColor : colors.borderLight,
                  },
                ]}
              >
                <Ionicons name={tab.icon} size={13} color={active ? tabColor : colors.textTertiary} />
                <Text style={[styles.groupTabText, { color: active ? tabColor : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.gridRow}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c)}
            style={[styles.gridCardPressable, isMobile && styles.gridCardPressableMobile]}
            accessibilityRole="button"
            accessibilityLabel={`Create ${c.label}`}
            accessibilityHint={c.description}
          >
            <GlassView intensity={10} style={[styles.gridCard, { borderColor: colors.borderLight }]}>
              <View style={[styles.gridIcon, { backgroundColor: c.color + '15' }]}>
                <Ionicons name={c.icon} size={24} color={c.color} />
              </View>
              <Text style={[styles.gridLabel, { color: colors.text }]}>{c.label}</Text>
              <Text style={[styles.gridSub, { color: colors.textTertiary }]} numberOfLines={2}>
                {c.purpose}
              </Text>
            </GlassView>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gridSelector: {
    gap: 20,
  },
  gridTitle: {
    ...TextStyles.title2,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  groupTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  groupTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  groupTabText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  gridCardPressable: {
    width: 180,
    maxWidth: '100%',
  },
  gridCardPressableMobile: {
    width: '47%',
  },
  gridCard: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    minHeight: 130,
    justifyContent: 'center',
    borderWidth: 1,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  gridSub: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    lineHeight: 15,
  },
});
