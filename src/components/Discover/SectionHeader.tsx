import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Vitrine, SectionTokens } from '@/design-system/tokens/theme';
import { useDiscoverVitrine } from '@/components/Discover/DiscoverVitrineContext';
import { withAlpha } from '@/lib/withAlpha';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  onSeeAll?: () => void;
}

function SectionHeader({
  title,
  subtitle,
  accentColor,
  titleColor: titleColorOverride,
  subtitleColor: subtitleColorOverride,
  onSeeAll,
}: SectionHeaderProps) {
  const colors = useColors();
  const vitrine = useDiscoverVitrine();
  const accent = accentColor ?? CultureTokens.indigo;
  const titleColor = titleColorOverride ?? (vitrine ? Vitrine.primary : colors.text);
  const subtitleColor = subtitleColorOverride ?? (vitrine ? Vitrine.onSurfaceVariant : colors.textSecondary);
  const seeAllColor = vitrine ? (accentColor ?? Vitrine.primaryContainer) : accent;

  // Prepare gradient colors safely
  const gradientColors = [accent, withAlpha(accent, 0.5)];

  return (
    <View style={styles.wrap}>
      <View style={styles.textBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          {vitrine ? (
            <View style={[styles.accentDot, { backgroundColor: accent }]} />
          ) : (
            <LinearGradient
              colors={gradientColors}
              style={styles.accentBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          )}
          <Text style={[styles.title, { color: titleColor }]} maxFontSizeMultiplier={1.6}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} maxFontSizeMultiplier={1.5}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onSeeAll && (
        <Pressable
          style={({ pressed }) => [
            styles.seeAllBtn,
            Platform.OS === 'web' && { cursor: 'pointer' as const },
            pressed && { opacity: 0.7 }
          ]}
          onPress={onSeeAll}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
        >
          <Text style={[styles.seeAllText, { color: seeAllColor }]}>See all</Text>
          <View style={[styles.seeAllIcon, { backgroundColor: seeAllColor + '15' }]}>
            <Ionicons name="chevron-forward" size={12} color={seeAllColor} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SectionTokens.verticalPadding * 2,
    gap: 14,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  textBlock: { flex: 1, gap: 1 },
  title: {
    fontSize: SectionTokens.titleFontSize,
    fontFamily: SectionTokens.titleFontFamily,
    letterSpacing: -0.5,
    lineHeight: SectionTokens.titleLineHeight,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    opacity: 0.7,
    paddingLeft: 16,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    flexShrink: 0,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  seeAllIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(SectionHeader);