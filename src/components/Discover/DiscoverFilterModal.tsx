import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, FontSize, Radius, Spacing } from '@/design-system/tokens/theme';
import { LuxeText } from '@/design-system/ui';

export type DiscoverFilter =
  | 'all'
  | 'hubs'
  | 'events'
  | 'art'
  | 'movies'
  | 'dining'
  | 'activities'
  | 'classes'
  | 'travel'
  | 'shopping'
  | 'offers'
  | 'directory'
  | 'indigenous'
  | 'search';

export interface FilterDef {
  id: DiscoverFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
}

export const ALL_FILTERS: FilterDef[] = [
  { id: 'all', label: 'All', icon: 'apps', description: 'Everything curated for you' },
  { id: 'hubs', label: 'Hubs', icon: 'people', description: 'Cultural communities & spaces' },
  { id: 'events', label: 'Events', icon: 'calendar', description: 'Festivals, workshops & gatherings' },
  { id: 'art', label: 'Art', icon: 'color-palette-outline', description: 'Exhibitions, performances & galleries' },
  { id: 'movies', label: 'Movies', icon: 'film', description: 'Cultural cinema & screenings' },
  { id: 'dining', label: 'Dining', icon: 'restaurant', description: 'Restaurants & culinary experiences' },
  { id: 'activities', label: 'Activities', icon: 'bicycle', description: 'Classes, sports & workshops' },
  { id: 'classes', label: 'Classes & Gym', icon: 'fitness-outline', description: 'Yoga, tango, dance, meditation, gym & workout' },
  { id: 'travel', label: 'Travel', icon: 'airplane', description: 'Destinations & cultural trips' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle', description: 'Markets, stores & makers' },
  { id: 'offers', label: 'Offers', icon: 'pricetag', description: 'Member perks & deals' },
  { id: 'directory', label: 'Directory', icon: 'business', description: 'Businesses & organizations' },
  { id: 'indigenous', label: 'Indigenous', icon: 'leaf', description: 'First Nations voices & events' },
  { id: 'search', label: 'Search', icon: 'search', description: 'Find anything' },
];

interface DiscoverFilterModalProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: DiscoverFilter;
  onSelect: (filter: DiscoverFilter) => void;
}

export function DiscoverFilterModal({
  visible,
  onClose,
  activeFilter,
  onSelect,
}: DiscoverFilterModalProps) {
  const colors = useM3Colors();
  const { isDesktop } = useLayout();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_FILTERS;
    const q = query.toLowerCase();
    return ALL_FILTERS.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [query]);

  const handleSelect = (id: DiscoverFilter) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(id);
    onClose();
    setQuery('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close categories" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              maxWidth: isDesktop ? 720 : undefined,
              alignSelf: isDesktop ? 'center' : undefined,
              marginHorizontal: isDesktop ? Spacing.lg : 0,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <LuxeText variant="title" style={{ color: colors.onSurface }}>
              Explore categories
            </LuxeText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Search within modal */}
          <View
            style={[
              styles.searchRow,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface, fontFamily: FontFamily.regular }]}
              placeholder="Search categories..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search categories"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>

          {/* Explore categories as horizontal scrolling tap (same pattern as the main Discover bar) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalExploreScroll}
            contentContainerStyle={styles.horizontalExploreContent}
          >
            {filtered.map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => handleSelect(f.id)}
                  style={[
                    styles.explorePill,
                    {
                      backgroundColor: isActive ? colors.primaryContainer : colors.surfaceVariant,
                      borderColor: isActive ? colors.primary : colors.outlineVariant,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${f.label} category`}
                >
                  <Ionicons
                    name={f.icon}
                    size={18}
                    color={isActive ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                  />
                  <LuxeText
                    variant="body"
                    style={{
                      color: isActive ? colors.onPrimaryContainer : colors.onSurface,
                      fontFamily: isActive ? FontFamily.semibold : FontFamily.medium,
                      marginLeft: 8,
                    }}
                  >
                    {f.label}
                  </LuxeText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.footerHint, { borderTopColor: colors.outlineVariant }]}>
            <LuxeText variant="caption" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
              Tap any category to filter your Discover feed
            </LuxeText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '82%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    padding: 6,
    marginRight: -6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.body,
    padding: 0,
    margin: 0,
  },
  horizontalExploreScroll: {
    maxHeight: 68,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  horizontalExploreContent: {
    gap: 10,
    paddingRight: Spacing.lg,
  },
  explorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: 44,
  },
  footerHint: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
