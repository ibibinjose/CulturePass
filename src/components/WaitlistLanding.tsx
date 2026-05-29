import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  CultureTokens,
  Radius,
  FontFamily,
  Spacing,
} from '@/design-system/tokens/theme';
import {
  M3Button,
  GlassView,
  BrandLockup,
} from '@/design-system/ui';
import { api } from '@/lib/api';
import { useLayout } from '@/hooks/useLayout';
import { useColors, useIsDark } from '@/hooks/useColors';
import {
  APP_NAME,
  APP_WEB_TITLE,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  SITE_ORIGIN,
} from '@/lib/app-meta';

export function WaitlistLanding() {
  const { isDesktop, contentWidth } = useLayout();
  const colors = useColors();
  const isDark = useIsDark();
  const scrollRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const maxWidth = isDesktop ? Math.min(contentWidth, 1180) : undefined;

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.cultureX.subscribe({ email });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Landing submission failed:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusEmail = () => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
      scrollRef.current?.scrollTo({ y: 980, animated: true });
    } else {
      router.push('/(onboarding)/signup');
    }
  };

  const goExplore = () => router.replace('/(tabs)');
  const goSignup = () => router.push('/(onboarding)/signup');
  const goHost = () => router.push('/hostspace');

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join the movement at ${APP_NAME}! Connecting cultures, building belonging. ${SITE_ORIGIN}/landing`,
        url: `${SITE_ORIGIN}/landing`,
        title: APP_NAME,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' && (
        <Head>
          <title>{APP_WEB_TITLE}</title>
          <meta name="description" content={APP_WEB_DESCRIPTION} />
          <meta name="keywords" content={APP_WEB_KEYWORDS} />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href={`${SITE_ORIGIN}/landing`} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={APP_WEB_TITLE} />
          <meta property="og:description" content={APP_WEB_DESCRIPTION} />
          <meta property="og:url" content={`${SITE_ORIGIN}/landing`} />
          <meta property="og:image" content={`${SITE_ORIGIN}/assets/images/culturepass-og.png`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={APP_WEB_TITLE} />
          <meta name="twitter:description" content={APP_WEB_DESCRIPTION} />
        </Head>
      )}

      {/* Premium Landing Nav */}
      <View style={[styles.nav, { borderBottomColor: colors.borderLight, backgroundColor: isDark ? 'rgba(11,11,20,0.92)' : 'rgba(255,255,255,0.92)' }]}>
        <View style={[styles.navInner, maxWidth != null ? { maxWidth, alignSelf: 'center' as const } : null]}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.navBrand}>
            <BrandLockup size="sm" />
          </Pressable>

          <View style={styles.navActions}>
            <Pressable onPress={goExplore} style={styles.navLink}>
              <Text style={[styles.navLinkText, { color: colors.textSecondary }]}>Explore</Text>
            </Pressable>
            <Pressable onPress={goHost} style={styles.navLink}>
              <Text style={[styles.navLinkText, { color: colors.textSecondary }]}>For Hosts</Text>
            </Pressable>
            <M3Button onPress={focusEmail} variant="gradient" style={styles.navCta}>
              Join Early
            </M3Button>
            <Pressable onPress={onShare} style={styles.iconBtn} accessibilityLabel="Share">
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, maxWidth != null ? { maxWidth, alignSelf: 'center' as const } : null]}
      >
        {/* ==================== HERO ==================== */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Animated.View entering={FadeInDown.duration(600)}>
              <BrandLockup size="lg" withTagline centered />
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(120).duration(700)}
              style={[styles.heroTitle, { color: colors.text }]}
            >
              The home for diaspora cultures.
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(220).duration(700)}
              style={[styles.heroSubtitle, { color: colors.textSecondary }]}
            >
              Discover festivals, join circles that matter, and build real belonging — online and in the real world.
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.delay(340).duration(600)}
              style={[styles.heroCtas, isDesktop && styles.heroCtasRow]}
            >
              <M3Button onPress={focusEmail} variant="gradient" style={styles.primaryCta}>
                Claim your place
              </M3Button>
              <M3Button onPress={goExplore} variant="outlined" style={styles.secondaryCta}>
                Browse freely
              </M3Button>
            </Animated.View>

            <Text style={[styles.heroTrust, { color: colors.textTertiary }]}>
              No spam. Early members get priority handles and founder perks.
            </Text>
          </View>

          {/* Hero Visual */}
          <Animated.View entering={FadeInDown.delay(180).duration(900)} style={styles.heroVisual}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1400' }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={isDark ? ['transparent', 'rgba(11,11,20,0.85)'] : ['transparent', 'rgba(248,250,252,0.9)']}
              style={styles.heroImageOverlay}
            />
          </Animated.View>
        </View>

        {/* ==================== TRUST BAR ==================== */}
        <View style={[styles.trustBar, { borderColor: colors.borderLight }]}>
          <View style={[styles.trustInner, isDesktop && styles.trustGrid]}>
            <TrustStat label="Members" value="14,800+" />
            <TrustStat label="Communities" value="420+" />
            <TrustStat label="Cities" value="38" />
            <TrustStat label="Events this month" value="2,900+" />
          </View>
        </View>

        {/* ==================== THE OPPORTUNITY ==================== */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: CultureTokens.violet }]}>WHY WE EXIST</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Culture is everywhere. Belonging is not.</Text>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            Thousands of festivals, gatherings, and support networks happen in your city every month — but most people never hear about them.
            We&apos;re building the discovery layer for diaspora life so no one has to feel like a stranger in their own home.
          </Text>
        </View>

        {/* ==================== FEATURES ==================== */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: CultureTokens.teal }]}>BUILT FOR YOU</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Everything you need to feel at home</Text>

          <View style={[styles.featuresGrid, isDesktop && styles.featuresGridWide]}>
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={i}
                {...f}
                isDark={isDark}
                colors={colors}
                delay={i * 60}
                cardStyle={isDesktop ? { minWidth: 260 } : undefined}
              />
            ))}
          </View>
        </View>

        {/* ==================== HOW IT WORKS ==================== */}
        <View style={[styles.section, styles.howSection]}>
          <Text style={[styles.sectionEyebrow, { color: CultureTokens.indigo }]}>HOW IT WORKS</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Three steps to belonging</Text>

          <View style={[styles.steps, isDesktop && styles.stepsRow]}>
            {STEPS.map((step, index) => (
              <Step key={index} number={index + 1} {...step} colors={colors} isDark={isDark} />
            ))}
          </View>
        </View>

        {/* ==================== TESTIMONIALS ==================== */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: CultureTokens.coral }]}>REAL STORIES</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>From our early community</Text>

          <View style={[styles.testimonials, isDesktop && styles.testimonialsRow]}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} {...t} colors={colors} isDark={isDark} delay={i * 80} />
            ))}
          </View>
        </View>

        {/* ==================== FOR HOSTS ==================== */}
        <View style={[styles.hostsBanner, { backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)' }]}>
          <View style={styles.hostsContent}>
            <View>
              <Text style={[styles.hostsEyebrow, { color: CultureTokens.gold }]}>FOR ORGANIZERS &amp; COMMUNITY LEADERS</Text>
              <Text style={[styles.hostsTitle, { color: colors.text }]}>Host with confidence. Reach the right people.</Text>
              <Text style={[styles.hostsBody, { color: colors.textSecondary }]}>
                Tools built for cultural events — ticketing, RSVPs, promotion to the exact communities that care, and zero platform fees on your first events.
              </Text>
            </View>
            <M3Button onPress={goHost} variant="filled" style={styles.hostCta}>
              Start hosting free
            </M3Button>
          </View>
        </View>

        {/* ==================== FINAL CTA / FORM ==================== */}
        <View style={styles.finalSection}>
          <GlassView intensity={isDark ? 35 : 25} tone={isDark ? 'dark' : 'light'} style={styles.finalGlass}>
            {!isSubmitted ? (
              <View style={[styles.finalInner, isDesktop && styles.finalInnerRow]}>
                <View style={styles.finalCopy}>
                  <Text style={[styles.finalTitle, { color: colors.text }]}>Your community is waiting.</Text>
                  <Text style={[styles.finalSubtitle, { color: colors.textSecondary }]}>
                    Be among the first in your city. Early members receive priority usernames, founder badges, and direct input on features.
                  </Text>
                  <View style={styles.finalBullets}>
                    <Bullet text="Priority access to new cities" />
                    <Bullet text="Founder member badge &amp; handle" />
                    <Bullet text="Shape the future of diaspora tech" />
                  </View>
                </View>

                <View style={styles.formWrap}>
                  <View style={[styles.inputWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.035)', borderColor: colors.borderLight }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={{ marginRight: 12 }} />
                    <TextInput
                      ref={emailInputRef}
                      style={[styles.input, { color: colors.text }]}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>

                  <M3Button
                    onPress={handleSubmit}
                    disabled={isSubmitting || !email}
                    variant="gradient"
                    fullWidth
                    style={styles.finalSubmit}
                  >
                    {isSubmitting ? 'Joining the movement...' : 'Get early access'}
                  </M3Button>

                  <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                    We respect your inbox. Unsubscribe anytime.
                  </Text>

                  <Pressable onPress={goExplore} style={styles.exploreLink}>
                    <Text style={[styles.exploreLinkText, { color: colors.textSecondary }]}>
                      Or explore events &amp; communities without an account →
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.successState}>
                <Ionicons name="checkmark-circle" size={72} color={CultureTokens.teal} />
                <Text style={[styles.successTitle, { color: colors.text }]}>Welcome to the family.</Text>
                <Text style={[styles.successBody, { color: colors.textSecondary }]}>
                  You&apos;re on the list. We&apos;ll email you soon with your onboarding link and early member perks.
                </Text>
                <View style={styles.successActions}>
                  <M3Button onPress={goExplore} variant="gradient">Start exploring</M3Button>
                  <M3Button onPress={onShare} variant="outlined">Invite friends</M3Button>
                </View>
              </View>
            )}
          </GlassView>
        </View>

        {/* ==================== FOOTER ==================== */}
        <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
          <View style={[styles.footerInner, isDesktop && styles.footerInnerWide]}>
            <View style={styles.footerBrand}>
              <BrandLockup size="sm" />
              <Text style={[styles.footerTagline, { color: colors.textTertiary }]}>Connecting cultures, building belonging.</Text>
            </View>

            <View style={styles.footerLinks}>
              <Pressable onPress={() => router.push('/about' as any)}><Text style={[styles.footerLink, { color: colors.textSecondary }]}>About</Text></Pressable>
              <Pressable onPress={() => router.push('/founder' as any)}><Text style={[styles.footerLink, { color: colors.textSecondary }]}>Founder</Text></Pressable>
              <Pressable onPress={() => router.push('/company-info' as any)}><Text style={[styles.footerLink, { color: colors.textSecondary }]}>Company</Text></Pressable>
              <Pressable onPress={() => router.push('/hostspace' as any)}><Text style={[styles.footerLink, { color: colors.textSecondary }]}>Host</Text></Pressable>
              <Pressable onPress={() => router.push('/legal/terms' as any)}><Text style={[styles.footerLink, { color: colors.textSecondary }]}>Terms</Text></Pressable>
              <Pressable onPress={() => router.push('/legal/privacy' as any)}><Text style={[styles.footerLink, { color: colors.textSecondary }]}>Privacy</Text></Pressable>
            </View>

            <Text style={[styles.footerCopy, { color: colors.textTertiary }]}>
              © {new Date().getFullYear()} {APP_NAME}. Made with care for the diaspora.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ==================== SUBCOMPONENTS ====================

function TrustStat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.trustItem}>
      <Text style={[styles.trustValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.trustLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, desc, isDark, colors, delay, cardStyle }: any) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay || 0).duration(520)}
      style={[
        styles.featureCard,
        cardStyle,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)', borderColor: colors.borderLight }
      ]}
    >
      <View style={[styles.featureIcon, { backgroundColor: CultureTokens.violet + '12', borderColor: CultureTokens.violet + '22' }]}>
        <Ionicons name={icon} size={22} color={CultureTokens.violet} />
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{desc}</Text>
    </Animated.View>
  );
}

function Step({ number, title, desc, colors, isDark }: any) {
  return (
    <View style={[styles.step, { borderColor: colors.borderLight }]}>
      <View style={[styles.stepNumber, { backgroundColor: CultureTokens.violet + '15' }]}>
        <Text style={[styles.stepNumberText, { color: CultureTokens.violet }]}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{desc}</Text>
    </View>
  );
}

function TestimonialCard({ quote, name, role, colors, isDark, delay }: any) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay || 0).duration(520)}
      style={[styles.testimonial, { backgroundColor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.7)', borderColor: colors.borderLight }]}
    >
      <Text style={[styles.quote, { color: colors.text }]}>“{quote}”</Text>
      <View style={styles.testimonialFooter}>
        <Text style={[styles.testimonialName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.testimonialRole, { color: colors.textTertiary }]}>{role}</Text>
      </View>
    </Animated.View>
  );
}

function Bullet({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={styles.bulletRow}>
      <Ionicons name="checkmark" size={16} color={CultureTokens.teal} style={{ marginRight: 8 }} />
      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

// ==================== DATA ====================

const FEATURES = [
  { icon: 'compass-outline', title: 'Smart Discovery', desc: 'Find festivals, workshops, dinners & ceremonies tailored to your culture and city.' },
  { icon: 'people-circle-outline', title: 'Real Communities', desc: 'Join or create circles that meet IRL. Not another chat group that never leaves the screen.' },
  { icon: 'ticket-outline', title: 'Events & Tickets', desc: 'Seamless RSVPs and ticketing for cultural events with fair pricing and no hidden fees.' },
  { icon: 'language-outline', title: 'Your Language', desc: 'Browse and connect in English, Hindi, Arabic, Mandarin, Spanish, Vietnamese and more.' },
  { icon: 'shield-checkmark-outline', title: 'Verified & Safe', desc: 'Identity-aware moderation and trusted host tools so you can attend with confidence.' },
  { icon: 'sparkles-outline', title: 'Cultural Identity', desc: 'Express your heritage through your profile, badges, and the events you champion.' },
];

const STEPS = [
  { title: 'Tell us your roots', desc: 'Share the cultures and languages that matter to you.' },
  { title: 'Discover what\'s near', desc: 'See events and communities perfectly matched to you.' },
  { title: 'Show up & connect', desc: 'RSVP, attend, and build real relationships offline.' },
];

const TESTIMONIALS = [
  { quote: "After three years in Melbourne I finally found my Tamil community through CulturePass. My kids now have aunties and uncles again.", name: "Priya S.", role: "Mother • Melbourne" },
  { quote: "As a Nigerian newcomer to Toronto, this platform helped me find proper jollof nights and professional networks in my first month.", name: "Chinedu O.", role: "Engineer • Toronto" },
  { quote: "We went from 40 people in a WhatsApp group to a 600-person thriving Lebanese cultural society with real events every month.", name: "Layla K.", role: "Community Lead • Sydney" },
];

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav
  nav: {
    paddingTop: Platform.OS === 'web' ? 12 : 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  navBrand: { flexShrink: 0 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLink: { paddingHorizontal: 14, paddingVertical: 8 },
  navLinkText: { fontSize: 14, fontFamily: FontFamily.medium },
  navCta: { height: 40, paddingHorizontal: 18, marginLeft: 4 } as const,
  iconBtn: { padding: 10, marginLeft: 4 },

  scrollContent: { paddingBottom: 80 },

  // Hero
  hero: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: { alignItems: 'center', maxWidth: 720, width: '100%' },
  heroTitle: {
    fontSize: 52,
    lineHeight: 58,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 14,
    letterSpacing: -1.2,
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    maxWidth: 560,
    marginBottom: 28,
  },
  heroCtas: { gap: 12, marginBottom: 16, width: '100%', maxWidth: 420 },
  heroCtasRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  primaryCta: { height: 56, minWidth: 180 },
  secondaryCta: { height: 56, minWidth: 160 },
  heroTrust: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  heroVisual: {
    width: '100%',
    maxWidth: 980,
    height: 320,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroImage: { width: '100%', height: '100%' },
  heroImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%' },

  // Trust
  trustBar: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 22 },
  trustInner: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, gap: 12 },
  trustGrid: { justifyContent: 'space-between', paddingHorizontal: 40 },
  trustItem: { alignItems: 'center', minWidth: 90 },
  trustValue: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  trustLabel: { fontSize: 12, marginTop: 2, fontFamily: FontFamily.regular },

  // Sections
  section: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 12 },
  sectionEyebrow: { fontSize: 12, fontFamily: FontFamily.semibold, letterSpacing: 1.5, marginBottom: 8 },
  sectionTitle: { fontSize: 28, lineHeight: 34, fontFamily: FontFamily.bold, marginBottom: 12 },
  sectionBody: { fontSize: 16, lineHeight: 26, fontFamily: FontFamily.regular, maxWidth: 620 },

  // Features
  featuresGrid: { gap: 14, marginTop: 20 },
  featuresGridWide: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  featureIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  featureTitle: { fontSize: 17, fontFamily: FontFamily.bold, marginTop: 4 },
  featureDesc: { fontSize: 14, lineHeight: 21, fontFamily: FontFamily.regular },

  // How it works
  howSection: { paddingBottom: 32 },
  steps: { gap: 16, marginTop: 20 },
  stepsRow: { flexDirection: 'row', gap: 18 },
  step: { flex: 1, borderRadius: Radius.lg, borderWidth: 1, padding: 20, gap: 8 },
  stepNumber: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepNumberText: { fontSize: 16, fontFamily: FontFamily.bold },
  stepTitle: { fontSize: 17, fontFamily: FontFamily.bold },
  stepDesc: { fontSize: 14, lineHeight: 21, fontFamily: FontFamily.regular },

  // Testimonials
  testimonials: { gap: 16, marginTop: 20 },
  testimonialsRow: { flexDirection: 'row', gap: 16 },
  testimonial: { flex: 1, borderRadius: Radius.lg, borderWidth: 1, padding: 22, gap: 16 },
  quote: { fontSize: 15, lineHeight: 24, fontFamily: FontFamily.regular, fontStyle: 'italic' },
  testimonialFooter: { marginTop: 'auto' },
  testimonialName: { fontSize: 15, fontFamily: FontFamily.semibold },
  testimonialRole: { fontSize: 13, marginTop: 2 },

  // Hosts banner
  hostsBanner: { marginTop: 56, marginHorizontal: 20, borderRadius: Radius.xl, padding: 28 },
  hostsContent: { gap: 18 },
  hostsEyebrow: { fontSize: 11, letterSpacing: 2, fontFamily: FontFamily.semibold },
  hostsTitle: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.bold, marginTop: 4, marginBottom: 8 },
  hostsBody: { fontSize: 15, lineHeight: 24, fontFamily: FontFamily.regular, maxWidth: 520 },
  hostCta: { alignSelf: 'flex-start', height: 48, paddingHorizontal: 24 },

  // Final CTA
  finalSection: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  finalGlass: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  finalInner: { padding: 28, gap: 28 },
  finalInnerRow: { flexDirection: 'row', gap: 40, alignItems: 'center' },
  finalCopy: { flex: 1, gap: 14 },
  finalTitle: { fontSize: 26, lineHeight: 32, fontFamily: FontFamily.bold },
  finalSubtitle: { fontSize: 15, lineHeight: 23, fontFamily: FontFamily.regular },
  finalBullets: { gap: 8, marginTop: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'center' },
  bulletText: { fontSize: 14 },
  formWrap: { flex: 1, minWidth: 280, gap: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  input: { flex: 1, fontSize: 16, fontFamily: FontFamily.regular },
  finalSubmit: { height: 56 },
  disclaimer: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  exploreLink: { marginTop: 12, alignItems: 'center' },
  exploreLinkText: { fontSize: 14, fontFamily: FontFamily.medium, textDecorationLine: 'underline' },

  // Success
  successState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20, gap: 14 },
  successTitle: { fontSize: 24, fontFamily: FontFamily.bold, marginTop: 8 },
  successBody: { fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 380 },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 12 },

  // Footer
  footer: { borderTopWidth: 1, paddingTop: 32, paddingBottom: 48, paddingHorizontal: 20 },
  footerInner: { gap: 20 },
  footerInnerWide: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' },
  footerBrand: { gap: 4 },
  footerTagline: { fontSize: 13 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 4 },
  footerLink: { fontSize: 14, fontFamily: FontFamily.medium },
  footerCopy: { fontSize: 12, marginTop: 12 },

  // Misc
  isDesktop: {}, // placeholder for conditional
});
