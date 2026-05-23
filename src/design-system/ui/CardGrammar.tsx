import React from 'react';
import { Pressable, Text, View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureImage } from './CultureImage';
import { LikeToggle } from './LikeToggle';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';

const IMAGE_HEIGHT = 140;
/** Lower block: reserved lines so every rail card matches height */
const BODY_MIN_HEIGHT = 204;

export type CardGrammarProps = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  imageUrl?: string | null;
  trustChips?: string[];
  ctaLabel?: string | null;
  onPress: () => void;
  accessibilityLabel?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  /** Merged into the outer pressable (e.g. width: '100%' inside a fixed-width rail cell) */
  containerStyle?: StyleProp<ViewStyle>;
};

export function CardGrammar({
  title,
  subtitle,
  meta,
  imageUrl,
  trustChips = [],
  ctaLabel,
  onPress,
  accessibilityLabel,
  iconName = 'information-circle-outline',
  isLiked,
  onLikeToggle,
  containerStyle,
}: CardGrammarProps) {
  const colors = useColors();
  const chips = trustChips.filter(Boolean).slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        Platform.OS === 'web' && { cursor: 'pointer' as const },
        containerStyle,
      ]}
    >
      <View style={{ position: 'relative' }}>
        <CultureImage uri={imageUrl} style={styles.image} contentFit="cover" />
        {onLikeToggle && (
          <View style={styles.likeToggle}>
            <LikeToggle
              liked={!!isLiked}
              onToggle={onLikeToggle}
              tone="glass"
              size="sm"
            />
          </View>
        )}
      </View>
      <View style={[styles.body, { minHeight: BODY_MIN_HEIGHT }]}>
        <View style={styles.topBlock}>
          <View style={styles.titleRow}>
            <Ionicons name={iconName} size={14} color={colors.textSecondary} style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {title}
            </Text>
          </View>
          <View style={styles.subtitleSlot}>
            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.metaSlot}>
            {meta ? (
              <Text
                style={[styles.meta, { color: colors.textTertiary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {meta}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomBlock}>
          {chips.length > 0 ? (
            <View style={styles.chipRow}>
              {chips.map((chip) => (
                <View
                  key={chip}
                  style={[styles.chip, { borderColor: colors.borderLight, backgroundColor: colors.primarySoft }]}
                >
                  <Text
                    style={[styles.chipText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {ctaLabel ? (
            <Text style={[styles.cta, { color: colors.primary }]} numberOfLines={1}>
              {ctaLabel}
            </Text>
          ) : (
            <View style={styles.ctaPlaceholder} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: IMAGE_HEIGHT + BODY_MIN_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  likeToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  topBlock: {
    gap: 4,
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minHeight: 48,
  },
  titleIcon: {
    marginTop: 3,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    lineHeight: 22,
  },
  subtitleSlot: {
    minHeight: 20,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  metaSlot: {
    minHeight: 18,
    justifyContent: 'center',
  },
  meta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  bottomBlock: {
    gap: 8,
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    minHeight: 28,
    alignItems: 'center',
    overflow: 'hidden',
  },
  chip: {
    maxWidth: '48%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
  },
  cta: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    lineHeight: 20,
  },
  ctaPlaceholder: {
    height: 20,
  },
});

export default CardGrammar;
