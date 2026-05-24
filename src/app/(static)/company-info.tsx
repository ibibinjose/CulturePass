import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, FontFamily } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';
import { APP_NAME } from '@/lib/app-meta';

const SECTIONS = [
  {
    title: 'Our Mission',
    body: 'To give people the power to build community and bring the world closer together through the universal language of culture.',
    icon: 'heart-outline',
    color: CultureTokens.coral,
  },
  {
    title: 'What we do',
    body: 'We build technology that helps people discover, connect and belong in their local cultural communities. From festivals to grassroots organisations, we make cultural life discoverable for everyone.',
    icon: 'globe-outline',
    color: CultureTokens.indigo,
  },
  {
    title: 'Who we serve',
    body: 'We serve multicultural cities and diaspora communities worldwide, providing a home for culture and connection in an increasingly disconnected world.',
    icon: 'people-outline',
    color: CultureTokens.teal,
  },
];

export default function CompanyInfoScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3TopAppBar
        title="Company Info"
        onBack={() => goBackOrReplace('/menu')}
        denseWeb
        webChromeless
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View entering={FadeInDown.duration(800)} style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Giving people the power to build community.
            </Text>
            <Text style={styles.heroSub}>
              {APP_NAME} is built to bring the world closer together, strengthening the social fabric of multicultural cities through cultural participation.
            </Text>
          </Animated.View>
        </View>

        {/* CONTENT SECTIONS */}
        <View style={[styles.main, isDesktop && styles.mainDesktop]}>
          {SECTIONS.map((section, i) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay(200 + i * 100).duration(600)}
              style={[styles.section, { borderBottomColor: colors.borderLight }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: section.color + '15' }]}>
                <Ionicons name={section.icon as any} size={28} color={section.color} />
              </View>
              <View style={styles.sectionBody}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{section.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* VALUES STRIP */}
        <View style={[styles.valuesStrip, { backgroundColor: colors.surface }]}>
          <Text style={[styles.valuesHeading, { color: colors.textTertiary }]}>OUR CORE VALUES</Text>
          <View style={styles.valuesGrid}>
            <ValueItem title="Belonging" icon="home" />
            <ValueItem title="Inclusion" icon="people" />
            <ValueItem title="Preservation" icon="library" />
            <ValueItem title="Innovation" icon="flash" />
          </View>
        </View>

        {/* FINAL CTA */}
        <View style={styles.finalCta}>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>Ready to join us?</Text>
          <Link href="/signup" asChild>
            <Pressable style={styles.ctaBtn}>
              <LinearGradient
                colors={gradients.culturepassBrand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.ctaText}>Start Exploring</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </Pressable>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            © 2026 {APP_NAME}. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ValueItem({ title, icon }: { title: string; icon: any }) {
  const colors = useColors();
  return (
    <View style={styles.valueItem}>
      <Ionicons name={icon} size={20} color={CultureTokens.indigo} />
      <Text style={[styles.valueText, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  hero: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: 800,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: FontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  main: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  mainDesktop: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    flexDirection: 'row',
    paddingVertical: 32,
    borderBottomWidth: 1,
    gap: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionBody: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.regular,
  },
  valuesStrip: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  valuesHeading: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  finalCta: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  ctaTitle: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    marginBottom: 24,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
});
