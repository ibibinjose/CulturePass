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
const PAGE_TITLE = `CulturePassion & Our Story — ${APP_NAME}`;
const PAGE_DESCRIPTION =
  'CulturePassion is building the global infrastructure for culture, community, and belonging. Discover our vision, flagship CulturePass.App, the Foundation, and the story of founder Bibin.';
const PAGE_URL = `${SITE_ORIGIN}/founder`;
const OG_IMAGE = `${SITE_ORIGIN}/assets/images/social-preview.png`;

const founderPersonJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Bibin',
  jobTitle: 'Founder & CEO',
  worksFor: { '@type': 'Organization', name: APP_NAME, url: SITE_ORIGIN },
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const TIMELINE = [
  {
    icon: 'home-outline',
    color: CultureTokens.richIndigo,
    title: 'Roots',
    body: 'Growing up immersed in Indian culture, Bibin carried the richness of traditions, festivals, and community deep within him — even as he built a new life in Sydney.',
  },
  {
    icon: 'eye-outline',
    color: CultureTokens.appBlue,
    title: 'Observation',
    body: 'Bibin watched cultural communities around Sydney organise remarkable events — Diwali nights, cultural film screenings, traditional food markets — but discovery remained broken. WhatsApp groups and word of mouth left most people in the dark.',
  },
  {
    icon: 'bulb-outline',
    color: CultureTokens.deepSaffron,
    title: 'The Question',
    body: 'What if culture itself had an operating system? The insight sparked a larger vision: just as maps revolutionised navigation and social networks transformed communication, culture deserved its own global discovery layer.',
  },
  {
    icon: 'rocket-outline',
    color: CultureTokens.emeraldHarmony,
    title: 'CulturePass is Born',
    body: 'CultureOS.dev emerged as the ecosystem vision, with CulturePass as its flagship platform — a home where every community is discoverable, every culture is celebrated, and belonging is possible anywhere in the world.',
  },
] as const;

const TECH_PHILOSOPHY = [
  {
    icon: 'phone-portrait-outline',
    color: CultureTokens.appBlue,
    title: 'Not Screen Time',
    body: 'We do not optimise for engagement addiction, passive scrolling, or advertising exposure.',
  },
  {
    icon: 'people-circle-outline',
    color: CultureTokens.emeraldHarmony,
    title: 'Real-World First',
    body: 'Every feature drives physical participation — attendance, community formation, and real-world connection.',
  },
  {
    icon: 'layers-outline',
    color: CultureTokens.richIndigo,
    title: 'Amplify, Not Replace',
    body: 'Digital systems support physical participation. Technology is an enabler of belonging, not a substitute for it.',
  },
  {
    icon: 'planet-outline',
    color: CultureTokens.heritageGold,
    title: 'Belonging at Scale',
    body: 'A world where technology helps people rediscover culture, participate in communities, and build real human connection.',
  },
] as const;

const darkGlassOverride = {
  backgroundColor: 'rgba(20, 18, 30, 0.78)',
  borderColor: 'rgba(255, 255, 255, 0.15)',
} as const;

// ─── Animated floating orb ────────────────────────────────────────────────────
const FloatingOrb = memo(function FloatingOrb({ color, size, style }: { color: string; size: number; style?: ViewStyle }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-12, { duration: 2400 }), withTiming(0, { duration: 2400 })), -1, true);
  }, [y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const baseStyle = StyleSheet.flatten<ViewStyle>([
    { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '15', position: 'absolute' },
    style,
  ]);
  return <Animated.View style={[baseStyle, anim]} />;
});

// ─── Timeline dot ─────────────────────────────────────────────────────────────
function TimelineDot({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', width: 20 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginTop: 4 }} />
      <View style={{ width: 2, flex: 1, backgroundColor: color + '22', marginTop: 4 }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function FounderStory() {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const [activeTab, setActiveTab] = React.useState<'ecosystem' | 'vision' | 'story'>('ecosystem');

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
          <meta name="keywords" content="CulturePassion, CulturePass founder, Bibin, cultural diaspora, Google Maps of Culture, CultureOS, founder story, cultural platform" />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href={PAGE_URL} />
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={PAGE_TITLE} />
          <meta property="og:description" content={PAGE_DESCRIPTION} />
          <meta property="og:url" content={PAGE_URL} />
          <meta property="og:image" content={OG_IMAGE} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={PAGE_TITLE} />
          <meta name="twitter:description" content={PAGE_DESCRIPTION} />
          <meta name="twitter:image" content={OG_IMAGE} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(founderPersonJsonLd) }}
          />
        </Head>
      )}

      <M3TopAppBar
        title="Our Vision & Story"
        onBack={() => goBackOrReplace(from === 'settings' ? '/settings' : '/about')}
        denseWeb
        webChromeless
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <View style={[styles.heroWrap, { minHeight: isDesktop ? 620 : 540 }]}>
          <LinearGradient
            colors={['#2A0E0A', '#130C26', '#08171E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative ambient background orbs */}
          <FloatingOrb color={CultureTokens.appBlue} size={250} style={{ top: -70, left: -70 }} />
          <FloatingOrb color={CultureTokens.deepSaffron} size={180} style={{ top: 80, right: -50 }} />
          <FloatingOrb color={CultureTokens.emeraldHarmony} size={140} style={{ bottom: 20, left: '25%' }} />

          <Animated.View entering={FadeInDown.duration(750)} style={[styles.heroContent, { maxWidth: isDesktop ? 920 : '100%' }]}>
            <GlassView tone="dark" borderRadius={999} style={{ backgroundColor: 'rgba(227,106,78,0.08)', borderColor: 'rgba(227,106,78,0.25)', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Ionicons name="planet" size={14} color={CultureTokens.appBlue} />
                <Text style={{ color: CultureTokens.appBlue, fontSize: 12, fontFamily: FontFamily.semibold }}>{"CULTUREPASSION ECOSYSTEM"}</Text>
              </View>
            </GlassView>

            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 48 : 34 }]}>
              Building the Global Infrastructure for{'\n'}
              <Text style={{ color: CultureTokens.cultureRed }}>Culture</Text>,
              {' '}
              <Text style={{ color: CultureTokens.deepSaffron }}>Community</Text>,
              {' & '}
              <Text style={{ color: CultureTokens.emeraldHarmony }}>Belonging</Text>.
            </Text>

            <Text style={styles.heroSub}>
              {"Discover our integrated ecosystem pillars, vision manifesto, and the story of how it was founded."}
            </Text>

            {/* 3-TAB SELECTOR */}
            <View style={styles.tabContainer}>
              <GlassView tone="dark" borderRadius={999} style={styles.tabOutline} bordered={false}>
                <View style={styles.tabInner}>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'ecosystem' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('ecosystem')}
                  >
                    <Ionicons
                      name="planet-outline"
                      size={14}
                      color={activeTab === 'ecosystem' ? CultureTokens.appBlue : 'rgba(255,255,255,0.6)'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'ecosystem' && styles.tabTextActive, activeTab === 'ecosystem' && { color: 'white' }]}>
                      Ecosystem
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'vision' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('vision')}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={14}
                      color={activeTab === 'vision' ? CultureTokens.appBlue : 'rgba(255,255,255,0.6)'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'vision' && styles.tabTextActive, activeTab === 'vision' && { color: 'white' }]}>
                      Vision
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.tabButton, activeTab === 'story' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('story')}
                  >
                    <Ionicons
                      name="book-outline"
                      size={14}
                      color={activeTab === 'story' ? CultureTokens.appBlue : 'rgba(255,255,255,0.6)'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'story' && styles.tabTextActive, activeTab === 'story' && { color: 'white' }]}>
                      Founder&apos;s Story
                    </Text>
                  </Pressable>
                </View>
              </GlassView>
            </View>

          </Animated.View>
        </View>

        {/* ── TAB 1: ECOSYSTEM ─────────────────────────────────────────────── */}
        {activeTab === 'ecosystem' && (
          <View style={styles.section}>
            {/* Ecosystem Introduction Banner */}
            <GlassView tone="dark" style={StyleSheet.flatten([styles.solutionBanner, darkGlassOverride, { borderColor: CultureTokens.emeraldHarmony + '30', marginBottom: 40 }])}>
              <LinearGradient colors={[CultureTokens.emeraldHarmony + '12', CultureTokens.indigo + '06']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Ionicons name="git-network-outline" size={26} color={CultureTokens.emeraldHarmony} />
                <Text style={{ fontSize: 20, fontFamily: FontFamily.bold, color: 'white' }}>CulturePassion Ecosystem</Text>
              </View>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 24 }}>
                CulturePassion is building the world’s first integrated ecosystem for culture, community, and belonging. At the heart of this ecosystem is CulturePass.App, supported by our Foundation, Summit, and Awards.
              </Text>
            </GlassView>

            {/* Pillars Detail Layout */}
            <View style={[styles.grid, { maxWidth: 960, gap: 24 }]}>
              {/* CulturePass.App Card */}
              <GlassView tone="dark" style={StyleSheet.flatten([styles.pillarCardFull, darkGlassOverride, { borderColor: CultureTokens.appBlue + '30' }])}>
                <View style={styles.pillarHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: CultureTokens.appBlue + '15', width: 44, height: 44 }]}>
                    <Ionicons name="apps-outline" size={22} color={CultureTokens.appBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: 'white' }]}>CulturePass.App</Text>
                    <Text style={[styles.pillarSubtitle, { color: CultureTokens.appBlue }]}>The Flagship Platform</Text>
                  </View>
                </View>
                <Text style={styles.pillarBodyText}>
                  CulturePass.App helps people discover events, find organizations, explore heritage, and connect in the real world. For organizations, it provides tools to grow communities, promote programs, and measure engagement.
                </Text>
                <Text style={styles.pillarSectionSub}>Helps community members discover & participate:</Text>
                <View style={styles.bulletList}>
                  {['Discover cultural events', 'Find communities and organizations', 'Explore heritage and identity', 'Participate in local experiences', 'Connect with like-minded people', 'Strengthen belonging'].map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Ionicons name="checkmark" size={14} color={CultureTokens.appBlue} style={{ marginTop: 2 }} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.pillarSectionSub, { marginTop: 14 }]}>Empowers organizations and hosts:</Text>
                <View style={styles.bulletList}>
                  {['Reach new audiences', 'Promote events and programs', 'Grow communities', 'Increase participation', 'Measure engagement & impact'].map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Ionicons name="checkmark" size={14} color={CultureTokens.appBlue} style={{ marginTop: 2 }} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.pillarBodyText, { marginTop: 14, fontStyle: 'italic' }]}>
                  CulturePass.App combines the discovery power of Google Maps, the community features of Facebook Groups, and the event experience of Eventbrite into a platform purpose-built for culture.
                </Text>
              </GlassView>

              {/* Foundation Card */}
              <GlassView tone="dark" style={StyleSheet.flatten([styles.pillarCardFull, darkGlassOverride, { borderColor: CultureTokens.emeraldHarmony + '30' }])}>
                <View style={styles.pillarHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: CultureTokens.emeraldHarmony + '15', width: 44, height: 44 }]}>
                    <Ionicons name="leaf-outline" size={22} color={CultureTokens.emeraldHarmony} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: 'white' }]}>CulturePassion Foundation</Text>
                    <Text style={[styles.pillarSubtitle, { color: CultureTokens.emeraldHarmony }]}>Advancing Culture for Public Good</Text>
                  </View>
                </View>
                <Text style={styles.pillarBodyText}>
                  The social impact arm of the ecosystem. The Foundation works alongside governments, universities, community organizations, and global institutions to support cultural preservation, community development, research, education, and innovation.
                </Text>
                <Text style={styles.pillarSectionSub}>Focus Areas Include:</Text>
                <View style={styles.bulletList}>
                  {['Cultural preservation', 'Community development', 'Social cohesion', 'Research and policy', 'Youth engagement', 'Diaspora participation', 'Grants and scholarships', 'Cultural innovation'].map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Ionicons name="ellipse" size={6} color={CultureTokens.emeraldHarmony} style={{ marginTop: 8, marginHorizontal: 4 }} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </GlassView>

              {/* Summit Card */}
              <GlassView tone="dark" style={StyleSheet.flatten([styles.pillarCardFull, darkGlassOverride, { borderColor: CultureTokens.richIndigo + '30' }])}>
                <View style={styles.pillarHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: CultureTokens.richIndigo + '15', width: 44, height: 44 }]}>
                    <Ionicons name="globe-outline" size={22} color={CultureTokens.richIndigo} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: 'white' }]}>CulturePassion Summit</Text>
                    <Text style={[styles.pillarSubtitle, { color: CultureTokens.richIndigo }]}>The Global Gathering for Culture & Community</Text>
                  </View>
                </View>
                <Text style={styles.pillarBodyText}>
                  The leading global forum dedicated to culture, community, and belonging, bringing together leaders from government, business, technology, academia, arts, tourism, and community sectors.
                </Text>
                <Text style={styles.pillarSectionSub}>Summit Exploration Themes:</Text>
                <View style={styles.bulletList}>
                  {['The future of culture', 'Community building', 'Social connection', 'Migration and multiculturalism', 'Technology and belonging', 'Cultural innovation', 'Public policy and participation'].map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Ionicons name="sparkles-outline" size={12} color={CultureTokens.richIndigo} style={{ marginTop: 4 }} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </GlassView>

              {/* Awards Card */}
              <GlassView tone="dark" style={StyleSheet.flatten([styles.pillarCardFull, darkGlassOverride, { borderColor: CultureTokens.heritageGold + '30' }])}>
                <View style={styles.pillarHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: CultureTokens.heritageGold + '15', width: 44, height: 44 }]}>
                    <Ionicons name="trophy-outline" size={22} color={CultureTokens.heritageGold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: 'white' }]}>CulturePassion Awards</Text>
                    <Text style={[styles.pillarSubtitle, { color: CultureTokens.heritageGold }]}>Celebrating Cultural Impact</Text>
                  </View>
                </View>
                <Text style={styles.pillarBodyText}>
                  Recognising individuals and organizations creating meaningful impact through culture and community. The awards elevate and celebrate the people strengthening communities globally.
                </Text>
                <Text style={styles.pillarSectionSub}>Award Categories:</Text>
                <View style={styles.bulletList}>
                  {[
                    'Community Leadership',
                    'Cultural Innovation',
                    'Emerging Changemaker',
                    'Social Impact',
                    'Cultural Preservation',
                    'Multicultural Excellence',
                    'Community Organization of the Year',
                    'Government Leadership in Community Building'
                  ].map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Ionicons name="ribbon-outline" size={14} color={CultureTokens.heritageGold} style={{ marginTop: 2 }} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </GlassView>

              {/* Business Model Card */}
              <GlassView tone="dark" style={StyleSheet.flatten([styles.pillarCardFull, darkGlassOverride, { borderColor: CultureTokens.deepSaffron + '30' }])}>
                <View style={styles.pillarHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: CultureTokens.deepSaffron + '15', width: 44, height: 44 }]}>
                    <Ionicons name="card-outline" size={22} color={CultureTokens.deepSaffron} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: 'white' }]}>Business Model</Text>
                    <Text style={[styles.pillarSubtitle, { color: CultureTokens.deepSaffron }]}>Diverse Revenue Streams</Text>
                  </View>
                </View>
                <Text style={styles.pillarBodyText}>
                  Our diversified business model ensures financial sustainability and scales our social impact mission.
                </Text>
                <Text style={styles.pillarSectionSub}>Ecosystem Revenue Channels:</Text>
                <View style={styles.bulletList}>
                  {[
                    'Organizational subscriptions',
                    'Event promotion and discovery tools',
                    'Premium member memberships',
                    'Sponsorships and brand partnerships',
                    'Summit registration and awards programs',
                    'Government and institutional research partnerships',
                    'Research and insights services',
                    'Cultural tourism opportunities'
                  ].map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Ionicons name="cash-outline" size={14} color={CultureTokens.deepSaffron} style={{ marginTop: 2 }} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </GlassView>

            </View>

            {/* Quick Action Navigation */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 32 }}>
              <Link href="/pitch" asChild>
                <Pressable style={StyleSheet.flatten([styles.ctaBtn, { backgroundColor: CultureTokens.appBlue, borderColor: 'transparent', width: 'auto', minWidth: 180 }])}>
                  <Text style={styles.ctaText}>View Pitch Page</Text>
                  <Ionicons name="easel-outline" size={18} color="white" />
                </Pressable>
              </Link>
              <Link href="/signup" asChild>
                <Pressable style={StyleSheet.flatten([styles.ctaBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', width: 'auto', minWidth: 180 }])}>
                  <Text style={styles.ctaText}>Join Waitlist</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Link>
            </View>
          </View>
        )}

        {/* ── TAB 2: VISION (MANIFESTO ONE PAGE LETTER) ─────────────────────── */}
        {activeTab === 'vision' && (
          <View style={styles.section}>
            <GlassView tone="dark" style={styles.letterCard} bordered={true}>
              <View style={styles.letterContent}>
                {/* Header */}
                <View style={styles.letterHeader}>
                  <Text style={styles.letterLabel}>CULTUREPASSION MANIFESTO</Text>
                  <Text style={styles.letterMainTitle}>Building the Global Infrastructure for Culture, Community, and Belonging</Text>
                  <View style={styles.letterLine} />
                </View>

                {/* Vision & Mission */}
                <View style={styles.letterSection}>
                  <Text style={styles.letterSectionHeading}>Vision</Text>
                  <Text style={styles.letterBodyText}>
                    To create a world where every person can discover culture, find community, and experience a genuine sense of belonging.
                  </Text>
                </View>

                <View style={styles.letterSection}>
                  <Text style={styles.letterSectionHeading}>Mission</Text>
                  <Text style={styles.letterBodyText}>
                    To connect people, communities, organizations, and governments through culture, creating stronger societies and more meaningful human connections.
                  </Text>
                </View>

                {/* The Challenge */}
                <View style={styles.letterSection}>
                  <Text style={styles.letterSectionHeading}>The Challenge</Text>
                  <Text style={styles.letterBodyText}>
                    Despite living in the most connected era in human history, communities are becoming increasingly fragmented.
                  </Text>
                  <View style={styles.bulletList}>
                    <View style={styles.bulletRow}>
                      <Ionicons name="alert" size={14} color={CultureTokens.appBlue} style={{ marginTop: 3 }} />
                      <Text style={styles.bulletText}>People struggle to find meaningful social connections in their local areas.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Ionicons name="alert" size={14} color={CultureTokens.appBlue} style={{ marginTop: 3 }} />
                      <Text style={styles.bulletText}>Cultural organizations struggle to reach new audiences and grow their presence.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Ionicons name="alert" size={14} color={CultureTokens.appBlue} style={{ marginTop: 3 }} />
                      <Text style={styles.bulletText}>Communities struggle to attract, engage, and retain active members.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Ionicons name="alert" size={14} color={CultureTokens.appBlue} style={{ marginTop: 3 }} />
                      <Text style={styles.bulletText}>Migrants and diaspora communities struggle to maintain vital cultural connections.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Ionicons name="alert" size={14} color={CultureTokens.appBlue} style={{ marginTop: 3 }} />
                      <Text style={styles.bulletText}>Governments face growing challenges around social cohesion, inclusion, participation, and community wellbeing.</Text>
                    </View>
                  </View>
                  <Text style={styles.letterBodyText}>
                    Culture is one of humanity’s most powerful forces, yet it remains fragmented across thousands of disconnected platforms, organizations, and communities. There is no global platform dedicated to connecting people through culture.
                  </Text>
                </View>

                {/* Our Solution */}
                <View style={styles.letterSection}>
                  <Text style={styles.letterSectionHeading}>Our Solution</Text>
                  <Text style={styles.letterBodyText}>
                    CulturePassion is building the world’s first integrated ecosystem for culture, community, and belonging. At the heart of the ecosystem is CulturePass.App. Our goal is to become the trusted infrastructure layer that powers cultural participation globally.
                  </Text>
                </View>

                {/* Why Now */}
                <View style={styles.letterSection}>
                  <Text style={styles.letterSectionHeading}>Why Now</Text>
                  <Text style={styles.letterBodyText}>
                    Governments globally are investing in:
                  </Text>
                  <View style={styles.bulletList}>
                    {['Social cohesion', 'Community resilience', 'Multicultural engagement', 'Mental wellbeing', 'Cultural preservation', 'Economic development through culture'].map((item) => (
                      <View key={item} style={styles.bulletRow}>
                        <Ionicons name="trending-up-outline" size={12} color={CultureTokens.emeraldHarmony} style={{ marginTop: 4 }} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.letterBodyText}>
                    At the same time, people are increasingly seeking authentic experiences, stronger communities, and deeper human connections. CulturePassion sits at the intersection of these global trends.
                  </Text>
                </View>

                {/* Long-Term Vision */}
                <View style={styles.letterSection}>
                  <Text style={styles.letterSectionHeading}>Long-Term Vision</Text>
                  <Text style={styles.letterBodyText}>
                    Our ambition is not simply to build another app. Our ambition is to build the global infrastructure that helps people connect through culture.
                  </Text>
                  <Text style={styles.letterBodyText}>
                    Just as LinkedIn became the professional network for careers and Airbnb transformed travel experiences, CulturePassion aims to become the platform where people discover culture, build community, and find belonging.
                  </Text>
                  <Text style={styles.letterBodyText}>
                    We believe that stronger communities create stronger societies. By making culture more discoverable, accessible, and participatory, we can help reduce isolation, strengthen social cohesion, preserve heritage, and create a more connected world.
                  </Text>
                </View>

                {/* Sign-off */}
                <View style={styles.letterSignature}>
                  <Text style={styles.signatureTagline}>CulturePassion is building the future of belonging.</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureAuthor}>— The CulturePassion Team & Founder Bibin</Text>
                </View>
              </View>
            </GlassView>

            {/* Quick Action Navigation */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 32 }}>
              <Link href="/pitch" asChild>
                <Pressable style={StyleSheet.flatten([styles.ctaBtn, { backgroundColor: CultureTokens.appBlue, borderColor: 'transparent', width: 'auto', minWidth: 180 }])}>
                  <Text style={styles.ctaText}>View Pitch Page</Text>
                  <Ionicons name="easel-outline" size={18} color="white" />
                </Pressable>
              </Link>
              <Link href="/signup" asChild>
                <Pressable style={StyleSheet.flatten([styles.ctaBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', width: 'auto', minWidth: 180 }])}>
                  <Text style={styles.ctaText}>Join Waitlist</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Link>
            </View>
          </View>
        )}

        {/* ── TAB 3: FOUNDER'S STORY ───────────────────────────────────────── */}
        {activeTab === 'story' && (
          <View>
            {/* ORIGIN STORY */}
            <Animated.View entering={FadeInDown.delay(80)}>
              <View style={styles.section}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="book-outline" size={14} color={CultureTokens.appBlue} />
                  <Text style={[styles.sectionLabelText, { color: CultureTokens.appBlue }]}>The Beginning</Text>
                </View>
                <Text style={[styles.h2, { color: colors.text }]}>A Simple, Profound Realisation</Text>

                {/* Timeline */}
                <View style={[styles.timeline, { maxWidth: isTablet ? 780 : '100%' }]}>
                  {TIMELINE.map((row, i) => (
                    <View key={row.title} style={[styles.timelineRow, i === TIMELINE.length - 1 && { paddingBottom: 0 }]}>
                      <TimelineDot color={row.color} />
                      <View style={styles.timelineCard}>
                        <LinearGradient colors={[row.color + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <View style={[styles.timelineIcon, { backgroundColor: row.color + '12' }]}>
                            <Ionicons name={row.icon} size={18} color={row.color} />
                          </View>
                          <Text style={[styles.timelineYear, { color: row.color }]}>{row.title}</Text>
                        </View>
                        <Text style={[styles.timelineText, { color: colors.text }]}>{row.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Founding insight quote */}
                <View style={styles.foundingQuote}>
                  <LinearGradient
                    colors={[CultureTokens.deepSaffron + '12', CultureTokens.appBlue + '08']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.foundingQuoteLine} />
                  <Text style={[styles.foundingQuoteText, { color: colors.text }]}>
                    {'"Culture exists everywhere, but discovery is broken."'}
                  </Text>
                  <Text style={[styles.foundingQuoteAttr, { color: colors.textSecondary }]}>
                    — Bibin, Founder & CEO
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* TECHNOLOGY'S ROLE / PHILOSOPHY */}
            <View style={styles.techWrap}>
              <LinearGradient
                colors={['#100B16', '#08171E', '#100B16']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <FloatingOrb color={CultureTokens.appBlue} size={200} style={{ top: -60, left: -60 }} />
              <FloatingOrb color={CultureTokens.emeraldHarmony} size={140} style={{ bottom: -30, right: -30 }} />

              <View style={[styles.section, { backgroundColor: 'transparent', paddingVertical: 72 }]}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="phone-portrait-outline" size={14} color={CultureTokens.emeraldHarmony} />
                  <Text style={[styles.sectionLabelText, { color: CultureTokens.emeraldHarmony }]}>REIMAGINING TECHNOLOGY</Text>
                </View>
                <Text style={[styles.h2, { color: 'white' }]}>Technology Should Strengthen{'\n'}Real-World Connection</Text>
                <Text style={[styles.p, { color: 'rgba(255,255,255,0.75)' }]}>
                  {'Much of modern technology optimises for screen time, engagement addiction, and passive scrolling. CulturePass proposes a different model.'}
                </Text>

                <View style={[styles.grid, { maxWidth: isTablet ? 920 : '100%', gap: 16 }]}>
                  {TECH_PHILOSOPHY.map((item, i) => (
                    <Animated.View key={item.title} entering={FadeInDown.delay(i * 70)} style={styles.techCard}>
                      <LinearGradient colors={[item.color + '12', item.color + '03']} style={StyleSheet.absoluteFill} />
                      <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                        <Ionicons name={item.icon} size={22} color={item.color} />
                      </View>
                      <Text style={styles.techTitle}>{item.title}</Text>
                      <Text style={styles.techBody}>{item.body}</Text>
                    </Animated.View>
                  ))}
                </View>

                <View style={styles.techQuote}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={CultureTokens.emeraldHarmony} style={{ marginBottom: 12 }} />
                  <Text style={styles.techQuoteText}>
                    {'"In this model, digital systems support physical participation. Online discovery strengthens offline engagement. Technology becomes an enabler of belonging."'}
                  </Text>
                  <Text style={styles.techQuoteAttr}>— CulturePass Philosophy</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── CLOSING BANNER ───────────────────────────────────────────────── */}
        <View style={styles.closeWrap}>
          <LinearGradient
            colors={[CultureTokens.appBlue, CultureTokens.deepSaffron, CultureTokens.emeraldHarmony]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <FloatingOrb color="white" size={200} style={{ top: -60, right: -60, opacity: 0.06 }} />

          <Animated.View entering={FadeInUp.duration(600)} style={[styles.closeInner, { maxWidth: isDesktop ? 680 : '100%' }]}>
            <Ionicons name="earth" size={44} color="rgba(255,255,255,0.8)" style={{ marginBottom: 16 }} />
            <Text style={styles.closeTitle}>How do we help people{'\n'}feel they belong again?</Text>
            <View style={styles.closeDivider} />
            <Text style={styles.closeBody}>
              Through culture, community, and participation.
            </Text>
            <Text style={styles.closeBodySub}>
              {"CulturePass isn't just about events. It's about preserving culture, enabling discovery, strengthening communities, and creating a future where technology brings people together in the real world."}
            </Text>

            <Animated.View style={[pulseStyle, { width: '100%', maxWidth: 340, marginTop: 28 }]}>
              <Link href="/signup" asChild>
                <Pressable style={styles.ctaBtn} accessibilityRole="button">
                  <Text style={styles.ctaText}>Be Part of the Story</Text>
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

  tabContainer: { width: '100%', alignItems: 'center', marginTop: 16 },
  tabOutline: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 999 },
  tabInner: { flexDirection: 'row', alignItems: 'center' },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  tabButtonActive: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  tabText: { fontSize: 12, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: 'white', fontFamily: FontFamily.semibold },

  section: { paddingHorizontal: 20, paddingVertical: 60, alignItems: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabelText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
  h2: { fontSize: 30, fontFamily: FontFamily.bold, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  p: { fontSize: 15, color: c.textSecondary, textAlign: 'center', maxWidth: 560, lineHeight: 24, marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, width: '100%' },

  // Letter Styles
  letterCard: {
    width: '100%',
    maxWidth: 860,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 18, 30, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  letterContent: {
    paddingHorizontal: Platform.OS === 'web' ? 48 : 20,
    paddingVertical: 48,
  },
  letterHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  letterLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: CultureTokens.appBlue,
    letterSpacing: 2,
    marginBottom: 8,
  },
  letterMainTitle: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: 'white',
    textAlign: 'center',
    lineHeight: 32,
  },
  letterLine: {
    width: 60,
    height: 3,
    backgroundColor: CultureTokens.appBlue,
    borderRadius: 2,
    marginTop: 20,
  },
  letterSection: {
    marginBottom: 28,
  },
  letterSectionHeading: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: CultureTokens.deepSaffron,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: CultureTokens.appBlue,
    paddingLeft: 10,
  },
  letterBodyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    fontFamily: FontFamily.regular,
  },
  bulletList: {
    marginTop: 10,
    gap: 8,
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bulletText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  letterSignature: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  signatureTagline: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: 'white',
    fontStyle: 'italic',
  },
  signatureLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  signatureAuthor: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 255, 255, 0.65)',
  },

  // Solution Banner
  solutionBanner: { borderRadius: 24, padding: 24, width: '100%', maxWidth: 960, borderWidth: 1, overflow: 'hidden' },

  // Pillars
  pillarCardFull: { borderRadius: 24, padding: 24, width: '100%', maxWidth: 960, borderWidth: 1, gap: 12, overflow: 'hidden' },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  pillarTitle: { fontSize: 20, fontFamily: FontFamily.bold },
  pillarSubtitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  pillarBodyText: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.85)' },
  pillarSectionSub: { fontSize: 14, fontFamily: FontFamily.bold, color: 'white', marginTop: 14, marginBottom: 6 },

  // Timeline
  timeline: { width: '100%', marginTop: 20, gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 16, paddingBottom: 28, width: '100%' },
  timelineCard: { flex: 1, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.borderLight, overflow: 'hidden' },
  timelineIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timelineYear: { fontSize: 14, fontFamily: FontFamily.bold, letterSpacing: 0.3 },
  timelineText: { fontSize: 14, lineHeight: 22, fontFamily: FontFamily.regular },

  // Founding quote
  foundingQuote: { marginTop: 28, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: CultureTokens.deepSaffron + '30', maxWidth: 640, width: '100%', overflow: 'hidden', alignItems: 'center', gap: 10 },
  foundingQuoteLine: { width: 36, height: 3, backgroundColor: CultureTokens.appBlue, borderRadius: 2 },
  foundingQuoteText: { fontSize: 20, fontFamily: FontFamily.bold, textAlign: 'center', lineHeight: 30, letterSpacing: -0.2 },
  foundingQuoteAttr: { fontSize: 13, fontFamily: FontFamily.medium },

  // Tech wrap
  techWrap: { overflow: 'hidden' },
  techCard: { borderRadius: 22, padding: 22, width: Platform.OS === 'web' ? '22%' : '48%', minWidth: 156, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', gap: 8 },
  techTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: 'white' },
  techBody: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.72)' },
  techQuote: { marginTop: 36, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', maxWidth: 600, width: '100%', alignItems: 'center' },
  techQuoteText: { fontSize: 15, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },
  techQuoteAttr: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 10 },

  iconCircle: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Closing
  closeWrap: { paddingVertical: 80, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
  closeInner: { width: '100%', alignItems: 'center' },
  closeTitle: { fontSize: 28, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 40, letterSpacing: -0.4 },
  closeDivider: { width: 48, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, marginVertical: 20 },
  closeBody: { fontSize: 20, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 30 },
  closeBodySub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 22, maxWidth: 540, marginTop: 14 },
  ctaBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 28, borderRadius: 999, width: '100%' },
  ctaText: { color: 'white', fontSize: 16, fontFamily: FontFamily.semibold },
});
