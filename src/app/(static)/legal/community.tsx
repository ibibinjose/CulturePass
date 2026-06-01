import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';

const RULES = [
  { 
    icon: 'heart' as const, 
    title: 'Respect & Inclusion', 
    body: 'Treat all members with dignity. Harassment, hate speech, or discriminatory behaviour is not allowed in our cultural spaces.',
    accent: CultureTokens.violet
  },
  { 
    icon: 'shield-checkmark' as const, 
    title: 'Authentic Content', 
    body: 'Only share content you own or are authorised to share. Avoid misinformation, spam, and illegal material.',
    accent: CultureTokens.emerald
  },
  { 
    icon: 'eye-off' as const, 
    title: 'Privacy First', 
    body: 'Do not publish private personal information without consent. Respect the privacy of attendees and event organisers.',
    accent: CultureTokens.coral
  },
  { 
    icon: 'ticket' as const, 
    title: 'Event Integrity', 
    body: 'No misleading event listings or ticket misuse. Fraudulent activity compromises the trusted community we are building.',
    accent: CultureTokens.teal
  },
  { 
    icon: 'flag' as const, 
    title: 'Report Responsibly', 
    body: 'Use our channels to report abusive content. We investigate all claims carefully to ensure cultural safety for everyone.',
    accent: CultureTokens.gold
  }
];

export default function CommunityGuidelinesScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const safeInsets = useSafeAreaInsetsWeb();
  // Ensure we follow the Top Inset Rule from AGENTS.md
  const topInset = safeInsets.top;

  return (
    <View style={styles.container}>
      <M3TopAppBar title="Community Guidelines" onBack={() => goBackOrReplace('/menu')} denseWeb webChromeless />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: safeInsets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(800)}>
          <LinearGradient
            colors={gradients.culturepassBrand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBackground, { paddingTop: topInset + 16 }]}
          >
            <View style={{ height: 8 }} />

            {/* Hero Content */}
            <View style={styles.heroContentWrapper}>
              <Animated.View entering={FadeInDown.delay(300).springify().damping(18)} style={styles.heroContent}>
                <View style={styles.badge}>
                  <Ionicons name="planet" size={16} color={CultureTokens.gold} />
                  <Text style={styles.badgeText}>CulturePass Standards</Text>
                </View>
                <Text style={styles.heroTitle}>Community{'\n'}Guidelines</Text>
                <Text style={styles.heroSubtitle}>
                  A shared commitment to respect, safety, and cultural belonging.
                </Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.contentWrapper}>
          <View style={styles.webContainer}>
            <Animated.Text entering={FadeInDown.delay(400)} style={styles.sectionHeader}>
              Our Core Pillars
            </Animated.Text>
            
            <View style={styles.rulesList}>
              {RULES.map((rule, idx) => (
                <Animated.View 
                  key={idx} 
                  entering={FadeInDown.delay(500 + idx * 100).springify().damping(16)}
                >
                  <View style={styles.card}>
                    <View style={[styles.cardIconWell, { backgroundColor: `${rule.accent}15` }]}>
                      <Ionicons name={rule.icon} size={28} color={rule.accent} />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{rule.title}</Text>
                      <Text style={styles.cardBody}>{rule.body}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Footer Consent Block */}
            <Animated.View entering={FadeInDown.delay(1100).springify()} style={styles.footerBox}>
              <View style={styles.footerIconWell}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.footerTextContainer}>
                <Text style={styles.footerTitle}>A Safe Space</Text>
                <Text style={styles.footerBody}>
                  By using CulturePass, you agree to uphold these guidelines. Together we build a more connected and authentic global community.
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  heroBackground: {
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroContentWrapper: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    ...TextStyles.label,
    color: '#FFFFFF',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 42,
    lineHeight: 50,
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    ...TextStyles.body,
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 500,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  webContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  sectionHeader: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 24,
  },
  rulesList: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.04)" }
    })
  },
  cardIconWell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  cardBody: {
    ...TextStyles.body,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  footerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    padding: 24,
    marginTop: 40,
    borderWidth: 1,
    borderColor: `${CultureTokens.teal}30`,
  },
  footerIconWell: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: CultureTokens.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  footerBody: {
    ...(TextStyles as any).subhead,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
});
