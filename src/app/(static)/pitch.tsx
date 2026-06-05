import React, { useEffect, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, type ColorTheme } from '@/design-system/tokens/theme';
import { FontFamily } from '@/design-system/tokens/typography';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';
import { AboutLegalStrip } from '@/components/about/AboutLegalStrip';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

// ─── SEO constants ────────────────────────────────────────────────────────────
const PAGE_TITLE = `CulturePassion Pitch — ${APP_NAME}`;
const PAGE_DESCRIPTION =
  'CulturePassion is building the world’s first integrated ecosystem for culture, community, and belonging. Explore our vision, problem statement, value proposition, and roadmap.';
const PAGE_URL = `${SITE_ORIGIN}/pitch`;
const OG_IMAGE = `${SITE_ORIGIN}/assets/images/social-preview.png`;

const darkGlassOverride = {
  backgroundColor: 'rgba(20, 18, 30, 0.78)',
  borderColor: 'rgba(255, 255, 255, 0.15)',
} as const;

// ─── Data ─────────────────────────────────────────────────────────────────────
const PITCH_VECTORS = [
  {
    icon: 'globe-outline',
    color: CultureTokens.terracottaGlow,
    title: '280M+ Global Diaspora',
    body: 'A massive, highly engaged global population searching for cultural connection, community belonging, and links to their roots.',
  },
  {
    icon: 'trending-up-outline',
    color: CultureTokens.deepSaffron,
    title: 'The Real-World Shift',
    body: 'People are actively moving away from passive scrolling and screen time, seeking physical, community-led, real-world experiences.',
  },
  {
    icon: 'business-outline',
    color: CultureTokens.emeraldHarmony,
    title: 'Institutional Alignment',
    body: 'Governments, councils, and organizations are prioritizing funding for social cohesion, inclusion, and cultural preservation.',
  },
] as const;

const VALUES = [
  {
    icon: 'people-outline',
    color: CultureTokens.terracottaGlow,
    title: 'For Community Members',
    points: [
      'Discover authentic heritage events',
      'Connect with local diaspora groups',
      'Build meaningful physical relationships',
      'Maintain cultural links anywhere',
    ],
  },
  {
    icon: 'business-outline',
    color: CultureTokens.deepSaffron,
    title: 'For Hosts & Organizers',
    points: [
      'Reach and engage targeted audiences',
      'Ticketing, hosting, and event tools',
      'Identity verification & safety checks',
      'Measure engagement and social impact',
    ],
  },
  {
    icon: 'shield-checkmark-outline',
    color: CultureTokens.emeraldHarmony,
    title: 'For Cities & Governments',
    points: [
      'Strengthen local social cohesion',
      'Support inclusion & multiculturalism',
      'Foster neighborhood civic pride',
      'Improve community wellbeing metrics',
    ],
  },
] as const;

const ROADMAP = [
  {
    step: '01',
    color: CultureTokens.terracottaGlow,
    title: 'The Flagship App',
    subtitle: 'CulturePass.App Consumer Launch',
    body: 'Building the Google Maps of Culture. Launching discovery, ticketing, and social groups in focus hub cities.',
  },
  {
    step: '02',
    color: CultureTokens.deepSaffron,
    title: 'The Public Good',
    subtitle: 'Foundation & Summit Integration',
    body: 'Activating the CulturePassion Foundation to fund preservation research, and launching the global Summit for thought leaders.',
  },
  {
    step: '03',
    color: CultureTokens.emeraldHarmony,
    title: 'Civic Infrastructure',
    subtitle: 'Government & Enterprise SaaS',
    body: 'Providing data insights, cohesion metrics, and policy tools to public institutions and multinational partners.',
  },
] as const;

// ─── Animated floating orb ────────────────────────────────────────────────────
const FloatingOrb = memo(function FloatingOrb({ color, size, style }: { color: string; size: number; style?: ViewStyle }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-12, { duration: 2500 }), withTiming(0, { duration: 2500 })), -1, true);
  }, [y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const baseStyle = StyleSheet.flatten<ViewStyle>([
    { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '15', position: 'absolute' },
    style,
  ]);
  return <Animated.View style={[baseStyle, anim]} />;
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PitchScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.03, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'web' && (
        <Head>
          <title>{PAGE_TITLE}</title>
          <meta name="description" content={PAGE_DESCRIPTION} />
          <meta name="keywords" content="CulturePassion, CulturePass Pitch, startup, social impact, diaspora connection, social cohesion, belonging" />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href={PAGE_URL} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={PAGE_TITLE} />
          <meta property="og:description" content={PAGE_DESCRIPTION} />
          <meta property="og:url" content={PAGE_URL} />
          <meta property="og:image" content={OG_IMAGE} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={PAGE_TITLE} />
          <meta name="twitter:description" content={PAGE_DESCRIPTION} />
          <meta name="twitter:image" content={OG_IMAGE} />
        </Head>
      )}

      <M3TopAppBar
        title="CulturePassion Pitch"
        onBack={() => goBackOrReplace(from === 'founder' ? '/founder' : '/about')}
        denseWeb
        webChromeless
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <View style={[styles.heroWrap, { minHeight: isDesktop ? 580 : 500 }]}>
          <LinearGradient
            colors={['#181A26', '#0E2929', '#24140E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <FloatingOrb color={CultureTokens.terracottaGlow} size={250} style={{ top: -80, left: -60 }} />
          <FloatingOrb color={CultureTokens.emeraldHarmony} size={180} style={{ top: 80, right: -50 }} />
          <FloatingOrb color={CultureTokens.deepSaffron} size={140} style={{ bottom: 20, left: '20%' }} />

          <Animated.View entering={FadeInDown.duration(750)} style={[styles.heroContent, { maxWidth: isDesktop ? 920 : '100%' }]}>
            <GlassView tone="dark" borderRadius={999} style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderColor: 'rgba(13,148,136,0.25)', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Ionicons name="easel" size={14} color={CultureTokens.emeraldHarmony} />
                <Text style={{ color: CultureTokens.emeraldHarmony, fontSize: 12, fontFamily: FontFamily.semibold }}>{"THE CULTUREPASSION PITCH"}</Text>
              </View>
            </GlassView>

            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 46 : 32 }]}>
              Connecting Humanity{'\n'}Through <Text style={{ color: CultureTokens.terracottaGlow }}>Culture</Text>
            </Text>

            <Text style={styles.heroSub}>
              {"Building the global infrastructure layer that powers cultural participation, strengthens communities, and fosters public belonging."}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link href="/signup" asChild>
                <Pressable style={StyleSheet.flatten([styles.ctaBtn, { backgroundColor: CultureTokens.terracottaGlow, borderColor: 'transparent', width: 'auto', minWidth: 160 }])}>
                  <Text style={styles.ctaText}>Join Waitlist</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Link>
              <Link href="/founder" asChild>
                <Pressable style={StyleSheet.flatten([styles.ctaBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', width: 'auto', minWidth: 160 }])}>
                  <Text style={styles.ctaText}>Read Our Story</Text>
                  <Ionicons name="book-outline" size={18} color="white" />
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </View>

        {/* ── THE PROBLEM & OPPORTUNITY ─────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="trending-up" size={14} color={CultureTokens.terracottaGlow} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.terracottaGlow }]}>The Opportunity</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>Why Culture? Why Now?</Text>
          <Text style={styles.p}>
            Culture remains one of humanity's most powerful connecting forces, yet it remains fragmented across thousands of disconnected channels, offline communities, and niche platforms.
          </Text>

          <View style={[styles.grid, { maxWidth: isDesktop ? 1000 : '100%', gap: 20 }]}>
            {PITCH_VECTORS.map((item, i) => (
              <Animated.View key={item.title} entering={FadeInDown.delay(i * 60)} style={[styles.pitchCard, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
                <LinearGradient colors={[item.color + '05', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[styles.iconCircle, { backgroundColor: item.color + '12', width: 44, height: 44 }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: 18 }]}>{item.title}</Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary, fontSize: 14, lineHeight: 22 }]}>{item.body}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── THE INTEGRATED ECOSYSTEM ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Ionicons name="apps-outline" size={14} color={CultureTokens.deepSaffron} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.deepSaffron }]}>The Solution</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>A Multi-Dimensional Platform</Text>
          <Text style={styles.p}>
            CulturePassion is building the infrastructure that powers culture at every level — from community discovery to national policy.
          </Text>

          {/* Unified Ecosystem Pitch Banner */}
          <GlassView tone="dark" style={StyleSheet.flatten([styles.solutionBanner, darkGlassOverride, { borderColor: CultureTokens.deepSaffron + '25', marginBottom: 28 }])}>
            <LinearGradient colors={[CultureTokens.deepSaffron + '10', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Ionicons name="planet" size={24} color={CultureTokens.deepSaffron} />
              <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: 'white' }}>The Infrastructure for Shared Identity</Text>
            </View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 }}>
              Combining the discovery power of maps, the safety layer of identity checking, the commercial scalability of ticketing, and the public-good mission of research and advocacy.
            </Text>
          </GlassView>
        </View>

        {/* ── VALUE PROPOSITIONS ─────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="sparkles" size={14} color={CultureTokens.emeraldHarmony} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.emeraldHarmony }]}>Value Proposition</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>Delivering Multi-Stakeholder Value</Text>

          <View style={[styles.grid, { maxWidth: isDesktop ? 1000 : '100%', gap: 24, marginTop: 12 }]}>
            {VALUES.map((val, i) => (
              <Animated.View key={val.title} entering={FadeInDown.delay(i * 80)} style={[styles.valCard, { borderColor: val.color + '20', backgroundColor: colors.background }]}>
                <LinearGradient colors={[val.color + '06', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[styles.iconCircle, { backgroundColor: val.color + '12', width: 44, height: 44, marginBottom: 12 }]}>
                  <Ionicons name={val.icon} size={22} color={val.color} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: 18, marginBottom: 14 }]}>{val.title}</Text>
                
                {val.points.map((point) => (
                  <View key={point} style={styles.pointRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={val.color} style={{ marginTop: 2 }} />
                    <Text style={[styles.pointText, { color: colors.textSecondary }]}>{point}</Text>
                  </View>
                ))}
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── STRATEGIC ROADMAP ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Ionicons name="map-outline" size={14} color={CultureTokens.terracottaGlow} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.terracottaGlow }]}>Roadmap</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>Strategic Path & Scale</Text>
          <Text style={styles.p}>
            Our roadmap focuses on initial community-led growth, transitioning into institutional and policy alignment.
          </Text>

          <View style={[styles.grid, { maxWidth: isDesktop ? 1000 : '100%', gap: 20 }]}>
            {ROADMAP.map((item, i) => (
              <Animated.View key={item.title} entering={FadeInDown.delay(i * 100)} style={[styles.roadmapCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <LinearGradient colors={[item.color + '05', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={styles.roadmapHeader}>
                  <Text style={[styles.roadmapStep, { color: item.color }]}>{item.step}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roadmapTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.roadmapSubtitle, { color: item.color }]}>{item.subtitle}</Text>
                  </View>
                </View>
                <Text style={[styles.roadmapBody, { color: colors.textSecondary }]}>{item.body}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── CLOSING / PITCH CALL CTA ────────────────────────────────────────── */}
        <View style={styles.closeWrap}>
          <LinearGradient
            colors={[CultureTokens.terracottaGlow, CultureTokens.deepSaffron, CultureTokens.emeraldHarmony]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <FloatingOrb color="white" size={200} style={{ top: -60, right: -60, opacity: 0.06 }} />

          <Animated.View entering={FadeInUp.duration(650)} style={[styles.closeInner, { maxWidth: isDesktop ? 700 : '100%' }]}>
            <Ionicons name="rocket-outline" size={44} color="rgba(255,255,255,0.8)" style={{ marginBottom: 16 }} />
            <Text style={styles.closeTitle}>Join Us in Shaping the Future of Belonging</Text>
            <View style={styles.closeDivider} />
            <Text style={styles.closeBodySub}>
              We are seeking strategic partners, sponsors, and diaspora leaders to join our initial rollout phases. Let’s build the global ecosystem for culture together.
            </Text>

            <Animated.View style={[pulseStyle, { width: '100%', maxWidth: 340, marginTop: 28 }]}>
              <Link href="/signup" asChild>
                <Pressable style={styles.ctaBtn} accessibilityRole="button">
                  <Text style={styles.ctaText}>Partner With Us</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Link>
            </Animated.View>
          </Animated.View>
        </View>

        <AboutLegalStrip />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (c: ColorTheme) => StyleSheet.create({
  heroWrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40 },
  heroContent: { alignItems: 'center', width: '100%' },
  heroTitle: { fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 48, marginTop: 12, marginBottom: 16 },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 640, lineHeight: 26, marginBottom: 24 },

  section: { paddingHorizontal: 20, paddingVertical: 60, alignItems: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabelText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
  h2: { fontSize: 30, fontFamily: FontFamily.bold, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  p: { fontSize: 15, color: c.textSecondary, textAlign: 'center', maxWidth: 560, lineHeight: 24, marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, width: '100%' },

  // Pitch Vectors
  pitchCard: { borderRadius: 24, padding: 24, width: Platform.OS === 'web' ? '30%' : '100%', minWidth: 280, borderWidth: 1, gap: 12, overflow: 'hidden' },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  cardBody: { fontSize: 14, lineHeight: 22, fontFamily: FontFamily.regular },

  // Solution Banner
  solutionBanner: { borderRadius: 24, padding: 24, width: '100%', maxWidth: 960, borderWidth: 1, overflow: 'hidden' },

  // Value Props
  valCard: { borderRadius: 24, padding: 28, width: Platform.OS === 'web' ? '30%' : '100%', minWidth: 280, borderWidth: 1, overflow: 'hidden' },
  pointRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' },
  pointText: { fontSize: 13, lineHeight: 18, fontFamily: FontFamily.regular, flex: 1 },

  // Roadmap
  roadmapCard: { borderRadius: 24, padding: 24, width: Platform.OS === 'web' ? '30%' : '100%', minWidth: 280, borderWidth: 1, gap: 12, overflow: 'hidden' },
  roadmapHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  roadmapStep: { fontSize: 32, fontFamily: FontFamily.bold, opacity: 0.8 },
  roadmapTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  roadmapSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },
  roadmapBody: { fontSize: 13, lineHeight: 20 },

  // Pitch CTA Card
  pitchCtaCard: { borderRadius: 24, padding: 36, width: '100%', maxWidth: 960, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  pitchCtaTitle: { fontSize: 24, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', marginBottom: 12 },
  pitchCtaBody: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22, maxWidth: 640, marginBottom: 16 },

  // Closing
  closeWrap: { paddingVertical: 80, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
  closeInner: { width: '100%', alignItems: 'center' },
  closeTitle: { fontSize: 28, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 40, letterSpacing: -0.4, textTransform: 'capitalize' },
  closeDivider: { width: 48, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, marginVertical: 20 },
  closeBodySub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 22, maxWidth: 540, marginTop: 14 },
  ctaBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 28, borderRadius: 999, width: '100%' },
  ctaText: { color: 'white', fontSize: 16, fontFamily: FontFamily.semibold },
});
