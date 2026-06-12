import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LISTING_TYPE_ROWS, type ListingTypeKey } from '@/hooks/useCityPage';
import { LISTING_TYPE_META } from '@/components/city/cityTheme';
import { destinationBrowseSubtitle } from '@/components/city/destinationLayout';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3SectionHeader } from '@/design-system/ui';
import { M3Typography, FontFamily, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { withAlpha } from '@/lib/withAlpha';

type BrowseLayout = 'rail' | 'stack' | 'auto';
type BrowseTone = 'm3' | 'legacy';

interface DestinationBrowseByTypeProps {
  counts: Record<ListingTypeKey, number>;
  onSelect: (key: ListingTypeKey) => void;
  hPad: number;
  contextName?: string;
  title?: string;
  layout?: BrowseLayout;
  /** Desktop sidebar context — with `auto`, uses vertical stack instead of rail */
  inSidebar?: boolean;
  isDesktop?: boolean;
  tone?: BrowseTone;
}

function formatCount(value: number): string {
  if (value >= 1000) return `${Math.floor(value / 100) / 10}k`;
  return String(value);
}

export function DestinationBrowseByType({
  counts,
  onSelect,
  hPad,
  contextName,
  title = 'Browse by type',
  layout = 'auto',
  inSidebar = false,
  isDesktop = false,
  tone = 'legacy',
}: DestinationBrowseByTypeProps) {
  const m3Colors = useM3Colors();
  const colors = useColors();
  const { isExpanded } = useLayout();
  const subtitle = destinationBrowseSubtitle(contextName);

  const resolvedLayout: Exclude<BrowseLayout, 'auto'> =
    layout === 'auto' ? (inSidebar && isDesktop ? 'stack' : 'rail') : layout;

  const sortedRows = useMemo(
    () =>
      [...LISTING_TYPE_ROWS].sort((a, b) => {
        const ca = counts[a.key] ?? 0;
        const cb = counts[b.key] ?? 0;
        if (ca > 0 && cb === 0) return -1;
        if (cb > 0 && ca === 0) return 1;
        return 0;
      }),
    [counts],
  );

  const handlePress = (key: ListingTypeKey) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
  };

  const renderCard = (row: (typeof LISTING_TYPE_ROWS)[number], variant: 'rail' | 'stack') => {
    const meta = LISTING_TYPE_META[row.key];
    const count = counts[row.key] ?? 0;
    const isEmpty = count === 0;
    const accent = meta.color;

    if (variant === 'stack') {
      return (
        <Pressable
          key={row.key}
          onPress={() => handlePress(row.key)}
          style={({ pressed }) => [
            s.stackCard,
            {
              borderColor: withAlpha(accent, isEmpty ? 0.14 : 0.28),
              backgroundColor: tone === 'm3' ? withAlpha(accent, 0.05) : withAlpha(accent, 0.06),
              opacity: isEmpty ? 0.62 : pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${row.title}, ${count} results`}
        >
          <View style={[s.stackAccent, { backgroundColor: accent }]} />
          <View style={[s.stackIcon, { backgroundColor: withAlpha(accent, 0.14) }]}>
            <Ionicons name={meta.icon} size={18} color={accent} />
          </View>
          <View style={s.stackBody}>
            <Text
              style={[
                tone === 'm3' ? M3Typography.titleSmall : TextStyles.callout,
                {
                  color: tone === 'm3' ? m3Colors.onSurface : colors.text,
                  fontFamily: FontFamily.bold,
                },
              ]}
              numberOfLines={1}
            >
              {row.title}
            </Text>
            <Text
              style={[
                tone === 'm3' ? M3Typography.bodySmall : TextStyles.caption,
                {
                  color: tone === 'm3' ? m3Colors.onSurfaceVariant : colors.textSecondary,
                  lineHeight: 16,
                },
              ]}
              numberOfLines={2}
            >
              {row.description}
            </Text>
          </View>
          <View style={s.stackTrail}>
            <View style={[s.countBadge, { backgroundColor: withAlpha(accent, 0.16) }]}>
              <Text style={[s.countText, { color: accent }]}>{formatCount(count)}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={tone === 'm3' ? m3Colors.onSurfaceVariant : colors.textTertiary}
            />
          </View>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={row.key}
        onPress={() => handlePress(row.key)}
        style={({ pressed }) => [
          s.railCard,
          {
            width: isExpanded ? 236 : 220,
            borderColor: withAlpha(accent, isEmpty ? 0.14 : 0.28),
            backgroundColor: withAlpha(accent, 0.06),
            opacity: isEmpty ? 0.62 : pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${row.title}, ${count} results`}
      >
        <View style={[s.railAccent, { backgroundColor: accent }]} />
        <View style={s.railBody}>
          <View style={s.railHeader}>
            <View style={[s.railIcon, { backgroundColor: withAlpha(accent, 0.14) }]}>
              <Ionicons name={meta.icon} size={16} color={accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  tone === 'm3' ? M3Typography.titleSmall : TextStyles.callout,
                  {
                    color: tone === 'm3' ? m3Colors.onSurface : colors.text,
                    fontFamily: FontFamily.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {row.title}
              </Text>
            </View>
            <View style={[s.countBadge, { backgroundColor: withAlpha(accent, 0.16) }]}>
              <Text style={[s.countText, { color: accent }]}>{formatCount(count)}</Text>
            </View>
          </View>
          <Text
            style={[
              tone === 'm3' ? M3Typography.bodySmall : TextStyles.caption,
              {
                color: tone === 'm3' ? m3Colors.onSurfaceVariant : colors.textSecondary,
                lineHeight: 16,
              },
            ]}
            numberOfLines={2}
          >
            {row.description}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={s.section}>
      <View style={{ paddingHorizontal: hPad }}>
        {tone === 'm3' ? (
          <M3SectionHeader title={title} subtitle={subtitle} />
        ) : (
          <View style={s.legacyHeader}>
            <Text style={[TextStyles.title3, { color: colors.text }]}>{title}</Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
              {subtitle}
            </Text>
          </View>
        )}
      </View>

      {resolvedLayout === 'stack' ? (
        <View style={[s.stackList, { paddingHorizontal: hPad, gap: 10 }]}>
          {sortedRows.map((row) => renderCard(row, 'stack'))}
        </View>
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            s.railContent,
            { paddingHorizontal: hPad, paddingRight: hPad + 40 },
          ]}
        >
          {sortedRows.map((row) => renderCard(row, 'rail'))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingTop: 28,
    gap: 4,
  },
  legacyHeader: {
    marginBottom: 16,
  },
  railContent: {
    gap: 12,
    paddingVertical: 8,
  },
  railCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  railAccent: {
    width: 4,
  },
  railBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  railIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackList: {},
  stackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minHeight: 76,
  },
  stackAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  stackIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  stackBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 2,
    minWidth: 0,
  },
  stackTrail: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingRight: 12,
  },
  countBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
});