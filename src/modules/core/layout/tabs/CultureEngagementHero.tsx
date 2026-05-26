import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { MAIN_TAB_CARD_SHADOW_STRONG, MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';

interface CultureEngagementHeroProps {
  title: string;
  subtitle: string;
  stat: string;
  badge: string;
  ctaLabel: string;
  ctaRoute: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function CultureEngagementHero({
  title,
  subtitle,
  stat,
  badge,
  ctaLabel,
  ctaRoute,
  icon = 'sparkles',
}: CultureEngagementHeroProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.wrap,
        MAIN_TAB_CARD_SHADOW_STRONG,
        {
          borderRadius: MAIN_TAB_UI.cardRadius,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={[CultureTokens.indigo + '20', CultureTokens.teal + '14', CultureTokens.gold + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={icon} size={MAIN_TAB_UI.iconSize.md} color={CultureTokens.indigo} />
          </View>
          <View style={styles.badges}>
            <View style={[styles.badgeChip, { borderColor: CultureTokens.gold + '55', backgroundColor: CultureTokens.gold + '18' }]}>
              <Text style={[styles.badgeText, { color: CultureTokens.gold }]}>{badge}</Text>
            </View>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{stat}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

        <Pressable
          onPress={() => router.push(ctaRoute as never)}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: CultureTokens.indigo },
            Platform.OS === 'web' || Platform.OS === 'ios'
              ? { opacity: pressed ? 0.88 : 1 }
              : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: 'rgba(255,255,255,0.22)', borderless: false } }
            : {})}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={MAIN_TAB_UI.iconSize.sm} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    marginBottom: MAIN_TAB_UI.sectionGap,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statText: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
  cta: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderRadius: 12,
    minHeight: MAIN_TAB_UI.ctaMinHeight,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_700Bold',
  },
});
