import React, { useMemo, useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { CultureTokens, Radius, Spacing } from '@/design-system/tokens/theme';
import { FontFamily } from '@/design-system/tokens/typography';
import type { MarketplaceCountryItem } from '@/lib/marketplaceLocation';

const isWeb = Platform.OS === 'web';
const MIN_TOUCH = 52;

export type CountrySelectVariant = 'sheet' | 'onboarding';

export interface CountrySelectListProps {
  countries: MarketplaceCountryItem[];
  selectedName?: string;
  onSelect: (name: string) => void;
  variant: CountrySelectVariant;
  colors: ColorTheme;
  /** Optional content above the search (e.g. current location pill). */
  leadingSlot?: ReactNode;
  /** Short title above the list (sheet modals). */
  introTitle?: string;
  introSubtitle?: string;
  /** Filter field; default true when more than 5 countries. */
  showSearch?: boolean;
  /** Settings hint under list (modal default on). */
  showFooterHint?: boolean;
  /**
   * Move this marketplace country to the top of the list (profile, locale, GPS, etc.).
   * Still respects search: only reorders within matching rows.
   */
  preferCountryFirst?: string;
}

export function CountrySelectList({
  countries,
  selectedName,
  onSelect,
  variant,
  colors,
  leadingSlot,
  introTitle,
  introSubtitle,
  showSearch = countries.length > 5,
  showFooterHint = variant === 'sheet',
  preferCountryFirst,
}: CountrySelectListProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q ? [...countries] : countries.filter((c) => c.name.toLowerCase().includes(q));

    const pin = preferCountryFirst?.trim();
    if (pin) {
      const i = list.findIndex((c) => c.name === pin);
      if (i > 0) {
        const row = list[i]!;
        list = [row, ...list.slice(0, i), ...list.slice(i + 1)];
      }
    }
    return list;
  }, [countries, query, preferCountryFirst]);

  const onPick = (name: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(name);
  };

  return (
    <View style={styles.wrap}>
      {leadingSlot}

      {(introTitle || introSubtitle) && (
        <View style={styles.introBlock}>
          {introTitle ? (
            <Text style={[styles.introTitle, { color: colors.text }]}>{introTitle}</Text>
          ) : null}
          {introSubtitle ? (
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>{introSubtitle}</Text>
          ) : null}
        </View>
      )}

      {showSearch ? (
        <View
          style={[
            styles.searchShell,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderLight,
            },
            Platform.OS === 'android' ? { minHeight: 48 } : null,
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search countries"
            selectionColor={CultureTokens.indigo}
            underlineColorAndroid="transparent"
            {...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {})}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear country search"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: `${CultureTokens.indigo}22`, borderless: true } }
                : {})}
            >
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No country matches &quot;{query.trim()}&quot;. Try another spelling.
        </Text>
      ) : (
        <View style={styles.list} accessibilityRole="list">
          {filtered.map((c) => {
            const active = selectedName === c.name;
            const borderActive = active ? CultureTokens.indigo : colors.borderLight;
            const bg = active ? colors.primarySoft : colors.surface;

            return (
              <Pressable
                key={c.name}
                onPress={() => onPick(c.name)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    minHeight: MIN_TOUCH,
                    backgroundColor: bg,
                    borderColor: borderActive,
                    ...(Platform.OS === 'ios' ? { opacity: pressed ? 0.92 : 1 } : {}),
                  },
                  isWeb ? ({ cursor: 'pointer' } as object) : null,
                ]}
                {...(Platform.OS === 'android'
                  ? {
                      android_ripple: {
                        color: `${CultureTokens.indigo}18`,
                        borderless: false,
                      },
                    }
                  : {})}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}. ${c.hint}`}
                accessibilityState={{ selected: active }}
              >
                <View
                  style={[
                    styles.flagCircle,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  accessible={false}
                  {...(Platform.OS !== 'web'
                    ? ({ importantForAccessibility: 'no-hide-descendants' } as const)
                    : {})}
                >
                  <Text style={styles.flagEmoji}>{c.flag}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[styles.rowTitle, { color: active ? CultureTokens.indigo : colors.text }]}
                    numberOfLines={2}
                  >
                    {c.name}
                  </Text>
                  <Text
                    style={[styles.rowHint, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {c.hint}
                  </Text>
                </View>
                {active ? (
                  <View style={[styles.pickedPill, { backgroundColor: CultureTokens.indigo }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {showFooterHint ? (
        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          You can change country anytime in Settings → Location.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  introBlock: { gap: 6, marginBottom: 4 },
  introTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  introSub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.md + 2,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    padding: 0,
    minWidth: 0,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FontFamily.regular,
    paddingVertical: 20,
    lineHeight: 20,
  },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
      default: { elevation: 1 },
    }),
  },
  flagCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: { fontSize: 26 },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { fontSize: 16, fontFamily: FontFamily.semibold, lineHeight: 21 },
  rowHint: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 16 },
  pickedPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
