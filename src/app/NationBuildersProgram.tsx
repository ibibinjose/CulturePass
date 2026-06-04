/**
 * Nation Builders Program Page
 * 
 * Nation Builders is CulturePass.App's initiative to recognize and reward 
 * the essential people who keep Sydney running — hospitality staff, retail teams, 
 * customer service, cleaners, security, transport workers, and more.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { GlassView } from '@/design-system/ui/GlassView';
import { Luxe, luxeDark, LuxeTextStyles } from '@/design-system/tokens/luxeHeritage';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { APP_NAME } from '@/lib/app-meta';

const NATION_BUILDERS_HEAD_TITLE = `Nation Builders Program · ${APP_NAME}`;
const NATION_BUILDERS_HEAD_DESC =
  'Nation Builders is CulturePass.App\'s initiative to recognize and reward the essential people who keep Sydney running.';

export default function NationBuildersProgramScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { hPad, isDesktop, isTablet } = useLayout();
  const insets = useSafeAreaInsets();

  const handleJoinPress = () => {
    router.push('/hostspace/create?intent=nation-builder' as any);
  };

  const handleStaffClaim = () => {
    router.push('/membership/upgrade' as any);
  };

  const handleBackPress = () => {
    router.back();
  };

  const pageCol = {
    width: '100%' as const,
    maxWidth: 800,
    alignSelf: 'center' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Head>
        <title>{NATION_BUILDERS_HEAD_TITLE}</title>
        <meta name="description" content={NATION_BUILDERS_HEAD_DESC} />
        <meta property="og:title" content={NATION_BUILDERS_HEAD_TITLE} />
        <meta property="og:description" content={NATION_BUILDERS_HEAD_DESC} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 16, paddingHorizontal: hPad }]}>
          <LinearGradient
            colors={['#0F0B1A', '#2E0052', '#000000']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={[Luxe.colors.terracotta + '33', 'transparent']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.headerNav, pageCol]}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <GlassView style={styles.backGlass}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </GlassView>
            </TouchableOpacity>
          </View>

          <View style={[styles.heroContent, pageCol]}>
            <GlassView intensity={20} style={styles.badge}>
              <LuxeText variant="badgeCaps" style={{ color: Luxe.colors.terracotta }}>NATION BUILDERS</LuxeText>
            </GlassView>

            <LuxeText variant="displayHero" style={styles.heroTitle}>
              You serve Sydney.{'\n'}Now let Sydney serve you back.
            </LuxeText>

            <LuxeText variant="body" style={styles.heroSubtitle}>
              The hands that keep Sydney alive deserve front-row seats to its culture.
            </LuxeText>

            <View style={styles.heroCtas}>
              <LuxeButton variant="filled" onPress={handleJoinPress} style={{ flex: 1 }}>
                Partner with us
              </LuxeButton>
              <LuxeButton variant="glass" onPress={handleStaffClaim} style={{ flex: 1 }}>
                Claim 50% discount
              </LuxeButton>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: hPad, paddingTop: 32 }}>
          <View style={pageCol}>
            {/* Program Overview */}
            <View style={styles.section}>
              <LuxeText variant="title2" style={{ color: colors.text, marginBottom: 12 }}>Program Overview</LuxeText>
              <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                Nation Builders is CulturePass.App&apos;s initiative to recognise and reward the essential people who keep Sydney running — hospitality staff, retail teams, customer service, cleaners, security, transport workers, and more.
              </LuxeText>
              <LuxeText variant="body" style={{ color: colors.textSecondary, marginTop: 8 }}>
                You serve our city every day. Now it&apos;s time for the city to give back.
              </LuxeText>
            </View>

            {/* What Staff Receive */}
            <GlassView style={styles.infoCard} contentStyle={{ padding: 24 }}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: Luxe.colors.terracotta + '22' }]}>
                  <Ionicons name="star" size={20} color={Luxe.colors.terracotta} />
                </View>
                <LuxeText variant="title3" style={{ color: colors.text }}>For Staff & Essential Workers</LuxeText>
              </View>

              <View style={styles.bulletList}>
                {[
                  'CulturePass+ Membership for $69/year (50% off)',
                  '$100+ in value back every year through exclusive offers',
                  'Priority and discounted tickets to festivals and performances',
                  'Exclusive access to off-peak cultural events',
                  'Nation Builder badge on your profile',
                  'Annual Nation Builders celebration event',
                ].map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Ionicons name="checkmark-circle" size={18} color={Luxe.colors.emerald} />
                    <LuxeText variant="body" style={{ color: colors.textSecondary, marginLeft: 10, flex: 1 }}>{item}</LuxeText>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <LuxeText variant="caption" style={{ color: colors.textTertiary, fontStyle: 'italic' }}>
                  Less than $1.35 a week for meaningful access to culture that fits around your roster.
                </LuxeText>
              </View>
            </GlassView>

            {/* What Partners Receive */}
            <GlassView style={styles.infoCard} contentStyle={{ padding: 24 }}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: Luxe.colors.emerald + '22' }]}>
                  <Ionicons name="business" size={20} color={Luxe.colors.emerald} />
                </View>
                <LuxeText variant="title3" style={{ color: colors.text }}>For Partner Businesses</LuxeText>
              </View>

              <View style={styles.bulletList}>
                {[
                  'Free listing on CulturePass',
                  'Staff CulturePass+ perk for retention and recruitment',
                  'Fill quiet hours with engaged members',
                  'Increased visibility within Sydney\'s multicultural communities',
                  'Positive brand association with social impact',
                ].map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Ionicons name="checkmark-circle" size={18} color={Luxe.colors.emerald} />
                    <LuxeText variant="body" style={{ color: colors.textSecondary, marginLeft: 10, flex: 1 }}>{item}</LuxeText>
                  </View>
                ))}
              </View>
            </GlassView>

            {/* How to Join */}
            <View style={styles.section}>
              <LuxeText variant="title2" style={{ color: colors.text, marginBottom: 12 }}>How to Join</LuxeText>
              <View style={styles.joinStep}>
                <LuxeText variant="bodyMedium" style={{ color: colors.text }}>For Businesses:</LuxeText>
                <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                  Apply to become a Partner. Your staff will get 50% off CulturePass+ and you&apos;ll get powerful retention tools.
                </LuxeText>
              </View>
              <View style={[styles.joinStep, { marginTop: 16 }]}>
                <LuxeText variant="bodyMedium" style={{ color: colors.text }}>For Staff:</LuxeText>
                <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                  Once your workplace is a partner, use the code they provide to unlock your discount and badge.
                </LuxeText>
              </View>
            </View>

            {/* Final CTA */}
            <View style={styles.footerCtas}>
              <LuxeButton variant="filled" size="lg" onPress={handleJoinPress}>
                Register your business
              </LuxeButton>
              <LuxeButton variant="tonal" size="lg" onPress={handleStaffClaim}>
                I&apos;m staff — Claim my discount
              </LuxeButton>
              <LuxeText variant="caption" style={styles.hashtagText}>
                #NationBuilders #CulturePass #SydneyCulture #ServeAndBelong
              </LuxeText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 56, overflow: 'hidden' },
  headerNav: { marginBottom: 24 },
  backButton: { width: 44, height: 44 },
  backGlass: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { gap: 16 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  heroTitle: {
    color: '#fff',
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 540,
    lineHeight: 25,
  },
  heroCtas: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  section: { marginBottom: 32 },
  infoCard: { marginBottom: 20, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bulletList: { gap: 12 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start' },
  cardFooter: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  joinStep: { gap: 4 },
  footerCtas: { marginTop: 16, gap: 12 },
  hashtagText: {
    textAlign: 'center',
    marginTop: 24,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 0.5,
  },
});
