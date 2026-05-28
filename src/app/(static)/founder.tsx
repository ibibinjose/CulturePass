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
const PAGE_TITLE = `Founder's Story — ${APP_NAME}`;
const PAGE_DESCRIPTION =
  'Meet Bibin, the founder of CulturePass. A story born from Indian roots in Sydney, and a vision to build the Google Maps of Culture — connecting diaspora communities worldwide.';
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
const PROBLEMS = [
  { icon: 'megaphone-outline', color: CultureTokens.coral, title: 'Invisible Events', body: 'Remarkable cultural events relied on scattered WhatsApp groups and Facebook posts, invisible to anyone outside the community.' },
  { icon: 'git-branch-outline', color: CultureTokens.gold, title: 'Siloed Communities', body: 'Communities celebrated in isolation — no way to discover who shared your traditions just around the corner.' },
  { icon: 'heart-dislike-outline', color: CultureTokens.indigo, title: 'Missed Moments', body: 'Diaspora individuals felt increasingly disconnected from culture, identity, and genuine human connection.' },
  { icon: 'eye-off-outline', color: CultureTokens.teal, title: 'Broken Discovery', body: 'Artists, organizers, and businesses lacked modern tools to reach the audiences who would love them most.' },
] as const;

const VISION_PILLARS = [
  { icon: 'map-outline', color: CultureTokens.indigo, label: 'Google Maps of Culture', body: 'A global discovery layer where every cultural moment, community, and creator is findable.' },
  { icon: 'hardware-chip-outline', color: CultureTokens.violet, label: 'OS for Culture', body: 'Infrastructure that empowers communities to grow, connect, and celebrate their identity across generations.' },
  { icon: 'earth-outline', color: CultureTokens.teal, label: 'Belonging Anywhere', body: 'No matter where you move in the world, CulturePass ensures culture moves with you.' },
] as const;

const MISSION_VALUES = [
  { icon: 'search-outline', color: CultureTokens.gold, label: 'Discovery', body: 'Surface every cultural experience worth attending.' },
  { icon: 'people-outline', color: CultureTokens.coral, label: 'Community', body: 'Strengthen the bonds that make cultures thrive.' },
  { icon: 'id-card-outline', color: CultureTokens.indigo, label: 'Identity', body: 'Honour and preserve cultural heritage across borders.' },
  { icon: 'hand-left-outline', color: CultureTokens.teal, label: 'Belonging', body: 'Reduce social isolation through real-world connection.' },
] as const;

const TECH_PHILOSOPHY = [
  { icon: 'phone-portrait-outline', color: CultureTokens.coral, title: 'Not Screen Time', body: 'We do not optimise for engagement addiction, passive scrolling, or advertising exposure.' },
  { icon: 'people-circle', color: CultureTokens.teal, title: 'Real-World First', body: 'Every feature drives physical participation — attendance, community formation, and real-world connection.' },
  { icon: 'layers-outline', color: CultureTokens.indigo, title: 'Amplify, Not Replace', body: 'Digital systems support physical participation. Technology is an enabler of belonging, not a substitute for it.' },
  { icon: 'planet-outline', color: CultureTokens.gold, title: 'Belonging at Scale', body: 'A world where technology helps people rediscover culture, participate in communities, and build real human connection.' },
] as const;

const ECOSYSTEM = [
  {
    icon: 'earth',
    grad: [CultureTokens.violet, CultureTokens.indigo] as [string, string],
    name: 'CulturePass',
    tag: 'Flagship platform',
    body: 'The discovery, ticketing, and community home for diaspora cultures worldwide.',
    href: '/',
  },
  {
    icon: 'flash',
    grad: [CultureTokens.coral, CultureTokens.gold] as [string, string],
    name: 'AirKnock',
    tag: 'Spontaneous connection',
    body: "“Who’s free now?” — real-time social coordination for impromptu cultural meetups.",
    href: null,
  },
  {
    icon: 'leaf',
    grad: [CultureTokens.teal, CultureTokens.indigo] as [string, string],
    name: 'Jivan.Club',
    tag: 'Diaspora empowerment',
    body: 'Empowering diaspora communities globally through shared resources and identity tools.',
    href: null,
  },
] as const;

// ─── Animated floating orb ────────────────────────────────────────────────────
const FloatingOrb = memo(function FloatingOrb({ color, size, style }: { color: string; size: number; style?: ViewStyle }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-10, { duration: 2000 }), withTiming(0, { duration: 2000 })), -1, true);
  }, [y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  // Flatten static styles so only the animated style remains as the array entry
  const baseStyle = StyleSheet.flatten<ViewStyle>([
    { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', position: 'absolute' },
    style,
  ]);
  return <Animated.View style={[baseStyle, anim]} />;
});

// ─── Timeline dot ─────────────────────────────────────────────────────────────
function TimelineDot({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', width: 20 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginTop: 4 }} />
      <View style={{ width: 2, flex: 1, backgroundColor: color + '30', marginTop: 4 }} />
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

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.04, { duration: 1400 }), withTiming(1, { duration: 1400 })), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'web' && (
        <Head>
          <title>{PAGE_TITLE}</title>
          <meta name="description" content={PAGE_DESCRIPTION} />
          <meta name="keywords" content="CulturePass founder, Bibin, cultural diaspora, Google Maps of Culture, CultureOS, founder story, cultural platform" />
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
        title="Founder's Story"
        onBack={() => goBackOrReplace(from === 'settings' ? '/settings' : '/about')}
        denseWeb
        webChromeless
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <View style={[styles.heroWrap, { minHeight: isDesktop ? 640 : 560 }]}>
          <LinearGradient
            colors={['#1A0533', '#0B1744', '#0A2B2B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative orbs */}
          <FloatingOrb color={CultureTokens.violet} size={220} style={{ top: -60, left: -60 }} />
          <FloatingOrb color={CultureTokens.coral} size={160} style={{ top: 40, right: -40 }} />
          <FloatingOrb color={CultureTokens.teal} size={120} style={{ bottom: 20, left: '30%' }} />

          <Animated.View entering={FadeInDown.duration(700)} style={[styles.heroContent, { maxWidth: isDesktop ? 780 : '100%' }]}>
            {/* Founder avatar placeholder */}
            <View style={styles.avatarRing}>
              <LinearGradient colors={[CultureTokens.violet, CultureTokens.coral, CultureTokens.gold]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.avatarInner}>
                <Ionicons name="person" size={isDesktop ? 48 : 38} color="white" />
              </View>
            </View>

            <GlassView tone="dark" borderRadius={999} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Ionicons name="sparkles" size={12} color={CultureTokens.gold} />
                <Text style={{ color: 'white', fontSize: 12, fontFamily: FontFamily.medium }}>{"Founder's Story"}</Text>
              </View>
            </GlassView>

            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 52 : 38 }]}>
              Built from{'\n'}
              <Text style={{ color: CultureTokens.gold }}>Culture.</Text>
              {' '}Driven by{'\n'}
              <Text style={{ color: CultureTokens.coral }}>Belonging.</Text>
            </Text>

            <Text style={styles.heroSub}>
              {"CulturePass was born in Sydney from a simple, profound realisation — that even in the world's most multicultural cities, people were growing disconnected from culture, community, and each other."}
            </Text>

            <View style={styles.heroMeta}>
              <View style={styles.metaChip}>
                <LinearGradient colors={[CultureTokens.violet + '30', CultureTokens.indigo + '30']} style={StyleSheet.absoluteFill} />
                <Ionicons name="person-circle-outline" size={16} color={CultureTokens.violet} />
                <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.9)' }]}>Bibin · Founder & CEO</Text>
              </View>
              <View style={styles.metaChip}>
                <LinearGradient colors={[CultureTokens.teal + '30', CultureTokens.indigo + '30']} style={StyleSheet.absoluteFill} />
                <Ionicons name="location-outline" size={16} color={CultureTokens.teal} />
                <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.9)' }]}>Sydney, Australia</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── ORIGIN STORY ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80)}>
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <Ionicons name="book-outline" size={14} color={CultureTokens.gold} />
              <Text style={[styles.sectionLabelText, { color: CultureTokens.gold }]}>The Beginning</Text>
            </View>
            <Text style={[styles.h2, { color: colors.text }]}>A Simple, Profound Realisation</Text>

            {/* Timeline */}
            <View style={[styles.timeline, { maxWidth: isTablet ? 780 : '100%' }]}>

              <View style={styles.timelineRow}>
                <TimelineDot color={CultureTokens.violet} />
                <View style={styles.timelineCard}>
                  <LinearGradient colors={[CultureTokens.violet + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={styles.timelineCardHeader}>
                    <View style={[styles.timelineIcon, { backgroundColor: CultureTokens.violet + '18' }]}>
                      <Ionicons name="home-outline" size={18} color={CultureTokens.violet} />
                    </View>
                    <Text style={[styles.timelineYear, { color: CultureTokens.violet }]}>Roots</Text>
                  </View>
                  <Text style={[styles.timelineText, { color: colors.text }]}>Growing up immersed in Indian culture, Bibin carried the richness of traditions, festivals, and community deep within him — even as he built a new life in Sydney.</Text>
                </View>
              </View>

              <View style={styles.timelineRow}>
                <TimelineDot color={CultureTokens.coral} />
                <View style={styles.timelineCard}>
                  <LinearGradient colors={[CultureTokens.coral + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={styles.timelineCardHeader}>
                    <View style={[styles.timelineIcon, { backgroundColor: CultureTokens.coral + '18' }]}>
                      <Ionicons name="eye-outline" size={18} color={CultureTokens.coral} />
                    </View>
                    <Text style={[styles.timelineYear, { color: CultureTokens.coral }]}>The Observation</Text>
                  </View>
                  <Text style={[styles.timelineText, { color: colors.text }]}>Bibin watched cultural communities around Sydney organise remarkable events — Diwali nights, cultural film screenings, traditional food markets — but discovery remained broken. WhatsApp groups and word of mouth left most people in the dark.</Text>
                </View>
              </View>

              <View style={styles.timelineRow}>
                <TimelineDot color={CultureTokens.gold} />
                <View style={styles.timelineCard}>
                  <LinearGradient colors={[CultureTokens.gold + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={styles.timelineCardHeader}>
                    <View style={[styles.timelineIcon, { backgroundColor: CultureTokens.gold + '18' }]}>
                      <Ionicons name="bulb-outline" size={18} color={CultureTokens.gold} />
                    </View>
                    <Text style={[styles.timelineYear, { color: CultureTokens.gold }]}>The Question</Text>
                  </View>
                  <Text style={[styles.timelineText, { color: colors.text }]}>What if culture itself had an operating system? The insight sparked a larger vision: just as maps revolutionised navigation and social networks transformed communication, culture deserved its own global discovery layer.</Text>
                </View>
              </View>

              <View style={[styles.timelineRow, { paddingBottom: 0 }]}>
                <TimelineDot color={CultureTokens.teal} />
                <View style={styles.timelineCard}>
                  <LinearGradient colors={[CultureTokens.teal + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={styles.timelineCardHeader}>
                    <View style={[styles.timelineIcon, { backgroundColor: CultureTokens.teal + '18' }]}>
                      <Ionicons name="rocket-outline" size={18} color={CultureTokens.teal} />
                    </View>
                    <Text style={[styles.timelineYear, { color: CultureTokens.teal }]}>CulturePass is Born</Text>
                  </View>
                  <Text style={[styles.timelineText, { color: colors.text }]}>CultureOS.dev emerged as the ecosystem vision, with CulturePass as its flagship platform — a home where every community is discoverable, every culture is celebrated, and belonging is possible anywhere in the world.</Text>
                </View>
              </View>

            </View>

            {/* Founding insight quote */}
            <View style={styles.foundingQuote}>
              <LinearGradient
                colors={[CultureTokens.gold + '18', CultureTokens.coral + '10']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.foundingQuoteLine} />
              <Text style={[styles.foundingQuoteText, { color: colors.text }]}>
                {'"Culture exists everywhere, but discovery is broken."'}
              </Text>
              <Text style={[styles.foundingQuoteAttr, { color: colors.textSecondary }]}>
                — The core insight behind CulturePass
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── THE PROBLEM ──────────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="alert-circle-outline" size={14} color={CultureTokens.coral} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.coral }]}>The Problem</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>What We Set Out to Fix</Text>
          <Text style={styles.p}>{'Even in multicultural cities, culture stays invisible to those not already "inside" the community.'}</Text>

          <View style={[styles.grid, { maxWidth: isTablet ? 920 : '100%' }]}>
            {PROBLEMS.map((p, i) => (
              <Animated.View key={p.title} entering={FadeInDown.delay(i * 80)} style={[styles.problemCard, { borderColor: p.color + '25', backgroundColor: colors.background }]}>
                <LinearGradient colors={[p.color + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[styles.iconCircle, { backgroundColor: p.color + '18' }]}>
                  <Ionicons name={p.icon as any} size={22} color={p.color} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{p.body}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── MISSION ──────────────────────────────────────────────────────── */}
        <View style={styles.missionWrap}>
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.violet, '#1A0533']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <FloatingOrb color={CultureTokens.gold} size={180} style={{ top: -40, right: -40 }} />
          <FloatingOrb color={CultureTokens.coral} size={100} style={{ bottom: -20, left: '20%' }} />

          <Animated.View entering={FadeInUp.duration(600)} style={[styles.missionInner, { maxWidth: isDesktop ? 820 : '100%' }]}>
            <View style={styles.sectionLabel}>
              <Ionicons name="flag-outline" size={14} color={CultureTokens.gold} />
              <Text style={[styles.sectionLabelText, { color: CultureTokens.gold }]}>Our Mission</Text>
            </View>

            <Text style={styles.missionTitle}>
              Help people discover culture,{'\n'}find community, and feel{'\n'}
              <Text style={{ color: CultureTokens.gold }}>belonging anywhere.</Text>
            </Text>

            <View style={styles.missionDivider} />

            <Text style={styles.missionBody}>
              {"Culture is humanity's most powerful force for connection. In an increasingly digital and disconnected world, helping people rediscover belonging through culture could become one of the most important platforms of the future."}
            </Text>

            <View style={[styles.grid, { marginTop: 36 }]}>
              {MISSION_VALUES.map((v, i) => (
                <Animated.View key={v.label} entering={FadeInDown.delay(i * 60)} style={styles.missionValueCard}>
                  <LinearGradient colors={[v.color + '25', v.color + '08']} style={StyleSheet.absoluteFill} />
                  <View style={[styles.iconCircle, { backgroundColor: v.color + '25' }]}>
                    <Ionicons name={v.icon as any} size={20} color={v.color} />
                  </View>
                  <Text style={styles.missionValueLabel}>{v.label}</Text>
                  <Text style={styles.missionValueBody}>{v.body}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* ── VISION ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Ionicons name="telescope-outline" size={14} color={CultureTokens.violet} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.violet }]}>Our Vision</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>{"The Platform We're Building"}</Text>
          <Text style={styles.p}>Inspired by how maps revolutionised navigation and social networks transformed communication — culture deserves its own global discovery layer.</Text>

          <View style={[styles.visionQuote, { borderColor: CultureTokens.violet + '30', backgroundColor: colors.surface }]}>
            <LinearGradient colors={[CultureTokens.violet + '08', CultureTokens.indigo + '08']} style={StyleSheet.absoluteFill} />
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={CultureTokens.violet} style={{ marginBottom: 12 }} />
            <Text style={[styles.visionQuoteText, { color: colors.text }]}>
              {'"What if culture itself had an operating system?"'}
            </Text>
            <Text style={[styles.visionQuoteAttr, { color: colors.textSecondary }]}>— Bibin, Founder of CulturePass</Text>
          </View>

          <View style={[styles.grid, { maxWidth: isDesktop ? 1000 : '100%', marginTop: 28 }]}>
            {VISION_PILLARS.map((v, i) => (
              <Animated.View key={v.label} entering={FadeInDown.delay(i * 80)} style={[styles.visionCard, { borderColor: v.color + '25', backgroundColor: colors.surface }]}>
                <LinearGradient colors={[v.color + '12', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={[styles.iconCircle, { backgroundColor: v.color + '18', width: 52, height: 52, borderRadius: 16 }]}>
                  <Ionicons name={v.icon as any} size={26} color={v.color} />
                </View>
                <Text style={[styles.visionCardLabel, { color: colors.text }]}>{v.label}</Text>
                <Text style={[styles.visionCardBody, { color: colors.textSecondary }]}>{v.body}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── ECOSYSTEM ────────────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="layers-outline" size={14} color={CultureTokens.teal} />
            <Text style={[styles.sectionLabelText, { color: CultureTokens.teal }]}>The Ecosystem</Text>
          </View>
          <Text style={[styles.h2, { color: colors.text }]}>CultureOS — A Broader Vision</Text>
          <Text style={styles.p}>CulturePass is the flagship platform within CultureOS.dev — a broader ecosystem of products building cultural infrastructure for the future.</Text>

          <View style={[styles.grid, { maxWidth: isTablet ? 1000 : '100%' }]}>
            {ECOSYSTEM.map((e, i) => (
              <Animated.View key={e.name} entering={FadeInDown.delay(i * 80)} style={[styles.ecoCard, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
                <LinearGradient colors={[e.grad[0] + '15', e.grad[1] + '08']} style={StyleSheet.absoluteFill} />
                <View style={styles.ecoHeader}>
                  <LinearGradient colors={e.grad} style={[styles.ecoIcon, { borderRadius: 16 }]}>
                    <Ionicons name={e.icon as any} size={22} color="white" />
                  </LinearGradient>
                  <View>
                    <Text style={[styles.ecoName, { color: colors.text }]}>{e.name}</Text>
                    <Text style={[styles.ecoTag, { color: e.grad[0] }]}>{e.tag}</Text>
                  </View>
                </View>
                <Text style={[styles.ecoBody, { color: colors.textSecondary }]}>{e.body}</Text>
                {e.href && (
                  <Link href={e.href} asChild>
                    <Pressable style={StyleSheet.flatten([styles.ecoLink, { borderColor: e.grad[0] + '40' }])}>
                      <Text style={[styles.ecoLinkText, { color: e.grad[0] }]}>Explore</Text>
                      <Ionicons name="arrow-forward" size={14} color={e.grad[0]} />
                    </Pressable>
                  </Link>
                )}
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── TECHNOLOGY'S ROLE ────────────────────────────────────────────── */}
        <View style={styles.techWrap}>
          <LinearGradient
            colors={['#0A0F1E', '#0B1A1A', '#0A0F1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <FloatingOrb color={CultureTokens.teal} size={200} style={{ top: -60, left: -60 }} />
          <FloatingOrb color={CultureTokens.indigo} size={140} style={{ bottom: -30, right: -30 }} />

          <View style={[styles.section, { backgroundColor: 'transparent', paddingVertical: 72 }]}>
            <View style={styles.sectionLabel}>
              <Ionicons name="phone-portrait-outline" size={14} color={CultureTokens.teal} />
              <Text style={[styles.sectionLabelText, { color: CultureTokens.teal }]}>REIMAGINING TECHNOLOGY</Text>
            </View>
            <Text style={[styles.h2, { color: 'white' }]}>Technology Should Strengthen{'\n'}Real-World Connection</Text>
            <Text style={[styles.p, { color: 'rgba(255,255,255,0.75)' }]}>
              {'Much of modern technology optimises for screen time, engagement addiction, and passive scrolling. CulturePass proposes a different model.'}
            </Text>

            <View style={[styles.grid, { maxWidth: isTablet ? 920 : '100%' }]}>
              {TECH_PHILOSOPHY.map((item, i) => (
                <Animated.View key={item.title} entering={FadeInDown.delay(i * 70)} style={styles.techCard}>
                  <LinearGradient colors={[item.color + '20', item.color + '06']} style={StyleSheet.absoluteFill} />
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.techTitle}>{item.title}</Text>
                  <Text style={styles.techBody}>{item.body}</Text>
                </Animated.View>
              ))}
            </View>

            <View style={styles.techQuote}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={CultureTokens.teal} style={{ marginBottom: 12 }} />
              <Text style={styles.techQuoteText}>
                {'"In this model, digital systems support physical participation. Online discovery strengthens offline engagement. Technology becomes an enabler of belonging."'}
              </Text>
              <Text style={styles.techQuoteAttr}>— CulturePass Philosophy</Text>
            </View>
          </View>
        </View>

        {/* ── CLOSING QUOTE ────────────────────────────────────────────────── */}
        <View style={styles.closeWrap}>
          <LinearGradient
            colors={[CultureTokens.coral, CultureTokens.gold, CultureTokens.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' }} />
          <FloatingOrb color="white" size={200} style={{ top: -60, right: -60, opacity: 0.06 }} />

          <Animated.View entering={FadeInUp.duration(600)} style={[styles.closeInner, { maxWidth: isDesktop ? 680 : '100%' }]}>
            <Ionicons name="earth" size={44} color="rgba(255,255,255,0.8)" style={{ marginBottom: 16 }} />
            <Text style={styles.closeTitle}>How do we help people{'\n'}feel they belong again?</Text>
            <View style={styles.closeDivider} />
            <Text style={styles.closeBody}>
              Through culture, community, and participation.
            </Text>
            <Text style={styles.closeBodySub}>
              {"CulturePass isn't just about events. It's about preserving culture, enabling discovery, strengthening communities, and creating a future where technology brings people together in the real world — not further apart."}
            </Text>

            <Animated.View style={[pulseStyle, { width: '100%', maxWidth: 340, marginTop: 28 }]}>
              <Link href="/signup" asChild>
                <Pressable style={styles.ctaBtn} accessibilityRole="button">
                  <Text style={styles.ctaText}>Be Part of the Story</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Link>
            </Animated.View>

            <Link href="/about" asChild>
              <Pressable style={styles.ctaSecondary}>
                <Text style={styles.ctaSecondaryText}>Learn more about CulturePass</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>

        <AboutLegalStrip />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (c: ColorTheme) => StyleSheet.create({
  heroWrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 48 },
  heroContent: { alignItems: 'center', width: '100%' },
  avatarRing: { width: 100, height: 100, borderRadius: 50, padding: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  avatarInner: { flex: 1, width: '100%', borderRadius: 47, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 58, marginTop: 12, marginBottom: 16 },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 540, lineHeight: 26, marginBottom: 24 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  metaText: { fontSize: 13, fontFamily: FontFamily.medium },

  section: { paddingHorizontal: 20, paddingVertical: 60, alignItems: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabelText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
  h2: { fontSize: 30, fontFamily: FontFamily.bold, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  p: { fontSize: 15, color: c.textSecondary, textAlign: 'center', maxWidth: 560, lineHeight: 24, marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, width: '100%' },

  // Timeline
  timeline: { width: '100%', marginTop: 20, gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 16, paddingBottom: 28, width: '100%' },
  timelineCard: { flex: 1, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.borderLight, overflow: 'hidden' },
  timelineCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  timelineIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timelineYear: { fontSize: 13, fontFamily: FontFamily.bold, letterSpacing: 0.3 },
  timelineText: { fontSize: 14, lineHeight: 22, fontFamily: FontFamily.regular },

  // Problem
  problemCard: { borderRadius: 20, padding: 20, width: Platform.OS === 'web' ? 210 : '48%', minWidth: 160, borderWidth: 1, gap: 10, overflow: 'hidden' },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  cardBody: { fontSize: 13, lineHeight: 20, fontFamily: FontFamily.regular },

  // Mission section
  missionWrap: { paddingHorizontal: 20, paddingVertical: 72, alignItems: 'center', overflow: 'hidden' },
  missionInner: { width: '100%', alignItems: 'center' },
  missionTitle: { fontSize: 34, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 46, marginTop: 12 },
  missionDivider: { width: 56, height: 3, backgroundColor: CultureTokens.gold, borderRadius: 2, marginVertical: 20 },
  missionBody: { fontSize: 16, color: 'rgba(255,255,255,0.82)', textAlign: 'center', maxWidth: 620, lineHeight: 28 },
  missionValueCard: { borderRadius: 20, padding: 20, width: Platform.OS === 'web' ? 180 : '48%', minWidth: 148, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', alignItems: 'flex-start', gap: 8 },
  missionValueLabel: { fontSize: 15, fontFamily: FontFamily.bold, color: 'white' },
  missionValueBody: { fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 18 },

  // Vision
  visionQuote: { borderRadius: 24, padding: 28, borderWidth: 1, alignItems: 'center', maxWidth: 620, width: '100%', overflow: 'hidden', marginBottom: 4 },
  visionQuoteText: { fontSize: 22, fontFamily: FontFamily.bold, textAlign: 'center', lineHeight: 32, letterSpacing: -0.3 },
  visionQuoteAttr: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 12 },
  visionCard: { borderRadius: 24, padding: 24, width: Platform.OS === 'web' ? 280 : '100%', maxWidth: 340, borderWidth: 1, gap: 12, overflow: 'hidden' },
  visionCardLabel: { fontSize: 17, fontFamily: FontFamily.bold, marginTop: 4 },
  visionCardBody: { fontSize: 14, lineHeight: 21 },

  // Ecosystem
  ecoCard: { borderRadius: 24, padding: 22, width: Platform.OS === 'web' ? 290 : '100%', maxWidth: 340, borderWidth: 1, gap: 12, overflow: 'hidden' },
  ecoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ecoIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  ecoName: { fontSize: 17, fontFamily: FontFamily.bold },
  ecoTag: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.5, marginTop: 1 },
  ecoBody: { fontSize: 13, lineHeight: 20 },
  ecoLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  ecoLinkText: { fontSize: 13, fontFamily: FontFamily.semibold },

  // Founding quote (inside origin section)
  foundingQuote: { marginTop: 28, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: CultureTokens.gold + '30', maxWidth: 640, width: '100%', overflow: 'hidden', alignItems: 'center', gap: 10 },
  foundingQuoteLine: { width: 36, height: 3, backgroundColor: CultureTokens.gold, borderRadius: 2 },
  foundingQuoteText: { fontSize: 20, fontFamily: FontFamily.bold, textAlign: 'center', lineHeight: 30, letterSpacing: -0.2 },
  foundingQuoteAttr: { fontSize: 13, fontFamily: FontFamily.medium },

  // Technology's Role section
  techWrap: { overflow: 'hidden' },
  techCard: { borderRadius: 22, padding: 22, width: Platform.OS === 'web' ? 210 : '48%', minWidth: 156, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', gap: 8 },
  techTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: 'white' },
  techBody: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.72)' },
  techQuote: { marginTop: 36, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', maxWidth: 600, width: '100%', alignItems: 'center' },
  techQuoteText: { fontSize: 15, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },
  techQuoteAttr: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 10 },

  // Closing
  closeWrap: { paddingVertical: 80, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
  closeInner: { width: '100%', alignItems: 'center' },
  closeTitle: { fontSize: 28, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 40, letterSpacing: -0.4 },
  closeDivider: { width: 48, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, marginVertical: 20 },
  closeBody: { fontSize: 20, fontFamily: FontFamily.bold, color: 'white', textAlign: 'center', lineHeight: 30 },
  closeBodySub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 22, maxWidth: 540, marginTop: 14 },
  ctaBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 28, borderRadius: 999, width: '100%' },
  ctaText: { color: 'white', fontSize: 16, fontFamily: FontFamily.semibold },
  ctaSecondary: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 16 },
  ctaSecondaryText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontFamily: FontFamily.medium },
});
