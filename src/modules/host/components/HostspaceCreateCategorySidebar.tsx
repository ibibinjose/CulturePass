import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import {
  GROUP_COLORS,
  GROUP_TABS,
  type CategoryGroup,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';

export function HostspaceCreateCategorySidebar({
  width,
  navMinimized,
  canMinimizeNav,
  onToggleNavMinimized,
  query,
  onQueryChange,
  activeGroups,
  onGroupToggle,
  categories,
  selectedId,
  onSelectCategory,
}: {
  width: DimensionValue;
  navMinimized: boolean;
  canMinimizeNav: boolean;
  onToggleNavMinimized: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  activeGroups: CategoryGroup[];
  onGroupToggle: (g: CategoryGroup) => void;
  categories: CreateCategory[];
  selectedId: string;
  onSelectCategory: (c: CreateCategory) => void;
}) {
  const colors = useColors();

  return (
    <GlassView
      borderRadius={28}
      style={[styles.side, { backgroundColor: colors.surface + '80', width }]}
      contentStyle={styles.sideInner}
    >
      <View style={styles.sideHeaderRow}>
        {!navMinimized && (
          <View style={styles.sideHeaderText}>
            <Text style={[styles.sideTitle, { color: colors.text }]}>Workspace</Text>
            <Text style={[styles.sideSub, { color: colors.textSecondary }]}>Select listing type</Text>
          </View>
        )}
        {canMinimizeNav && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onToggleNavMinimized}
            style={styles.sidebarToggle}
            accessibilityLabel={navMinimized ? 'Expand workspace navigation' : 'Collapse workspace navigation'}
          >
            <Ionicons name={navMinimized ? 'chevron-forward' : 'chevron-back'} size={16} color={colors.text} />
          </Button>
        )}
      </View>

      {!navMinimized && (
        <>
          <View style={[styles.searchRow, { borderColor: colors.borderLight, backgroundColor: colors.background + '80' }]}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupTabsRow}>
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
        </>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.navList}>
        {!navMinimized && (
          <Text style={[styles.navListLabel, { color: colors.textTertiary }]}>
            {activeGroups.includes('all')
              ? 'All types'
              : activeGroups.map((g) => GROUP_TABS.find((t) => t.id === g)?.label).join(', ')}{' '}
            ({categories.length})
          </Text>
        )}
        {categories.length === 0 && !navMinimized ? (
          <View style={[styles.emptyState, { borderColor: colors.borderLight, backgroundColor: colors.background + '70' }]}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No listing types match this search.
            </Text>
          </View>
        ) : null}
        {categories.map((item, idx) => {
          const active = item.id === selectedId;
          return (
            <Animated.View key={item.id} entering={FadeInRight.delay(idx * 40)}>
              <Pressable
                onPress={() => onSelectCategory(item)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.label} listing type`}
                accessibilityHint={item.purpose}
                accessibilityState={{ selected: active }}
              >
                {({ pressed }) => (
                  <GlassView
                    intensity={active ? 20 : 5}
                    style={[
                      styles.navItem,
                      {
                        borderColor: active ? item.color : colors.borderLight,
                        backgroundColor: active ? item.color + '15' : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.navIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon} size={navMinimized ? 22 : 20} color={item.color} />
                    </View>
                    {!navMinimized && (
                      <View style={styles.navText}>
                        <Text style={[styles.navLabel, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[styles.navPurpose, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.purpose}
                        </Text>
                      </View>
                    )}
                    {active && !navMinimized ? <Ionicons name="checkmark-circle" size={16} color={item.color} /> : null}
                  </GlassView>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  side: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  sideInner: {
    padding: 16,
    gap: 12,
  },
  sideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideHeaderText: {
    gap: 2,
  },
  sideTitle: {
    ...TextStyles.title3,
    fontSize: 18,
  },
  sideSub: {
    ...TextStyles.caption,
    fontSize: 11,
    opacity: 0.7,
  },
  sidebarToggle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 0,
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
  navList: {
    maxHeight: Platform.OS === 'web' ? 520 : undefined,
  },
  navListLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
    opacity: 0.8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    flex: 1,
  },
  navLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  navPurpose: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.72,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
});
