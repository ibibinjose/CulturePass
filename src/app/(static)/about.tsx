import React, { useEffect, memo } from "react";
import aboutData from "@/data/static/about.json";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

import { useColors } from "@/hooks/useColors";
import { CultureTokens, gradients, type ColorTheme } from "@/design-system/tokens/theme";
import { GlassView } from "@/design-system/ui/GlassView";
import { M3TopAppBar } from '@/design-system/ui';
import { TextStyles } from "@/design-system/tokens/typography";
import { APP_NAME, APP_AKA, APP_PREFIX } from "@/lib/app-meta";
import { Footer } from "@/components/Footer";
import { goBackOrReplace } from "@/lib/navigation";

const DARK_GLASS_TINT = '#0F0E1A';
const darkGlassOverride = {
  backgroundColor: 'rgba(15, 14, 26, 0.55)',
  borderColor: 'rgba(255, 255, 255, 0.18)',
} as const;

// ─── What We Are ──────────────────────────────────────────────────────────────
const WHAT_WE_ARE = aboutData.whatWeAre;

// ─── What We Are Solving ──────────────────────────────────────────────────────
const PROBLEMS = aboutData.problems;

// ─── Culture as Infrastructure ────────────────────────────────────────────────
const CULTURE_AS_INFRA = aboutData.cultureAsInfra;

// ─── How It Works ─────────────────────────────────────────────────────────────
const STEPS = aboutData.steps;

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = aboutData.features;

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = aboutData.testimonials;

// ─── Animated Stat ────────────────────────────────────────────────────────────
const Stat = memo(function Stat({ target, label, suffix = "+" }: { target: number; label: string; suffix?: string }) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    progress.value = withTiming(target, { duration: 1400 });
    const id = setInterval(() => setDisplay(Math.floor(progress.value)), 16);
    return () => clearInterval(id);
  }, [target, progress]);

  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={statStyles.number}>{display}{suffix}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AboutCulturePass() {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.03, { duration: 1200 }),
      withTiming(1, { duration: 1200 })
    ), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={gradients.culturepassBrand} style={styles.bgMesh} />

      <M3TopAppBar
        title="About"
        onBack={() => goBackOrReplace(from === 'settings' ? '/settings' : '/menu')}
        denseWeb
        webChromeless
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <LinearGradient colors={gradients.culturepassBrand} style={[styles.hero, { minHeight: isDesktop ? 680 : 600 }]}>
          <View style={styles.heroOverlay} />
          <Animated.View entering={FadeInDown.duration(700)} style={styles.heroContent}>
            <GlassView tone="dark" tintColor={DARK_GLASS_TINT} borderRadius={999} style={[styles.pill, darkGlassOverride]}>
              <Ionicons name="sparkles" size={13} color={CultureTokens.gold} />
              <Text style={styles.pillText}>Cultural infrastructure · First Nations to new migrants</Text>
            </GlassView>

            <Ionicons name="earth" size={isDesktop ? 56 : 44} color="white" style={{ opacity: 0.95, marginTop: 12 }} />
            <Text style={styles.heroTitle}>Rebuilding Human{"\n"}Connection Through{"\n"}Culture.</Text>
            <Text style={styles.heroSub}>A global platform connecting people to real-world culture and community — wherever they are in the world.</Text>

            <GlassView tone="dark" tintColor={DARK_GLASS_TINT} borderRadius={24} style={[styles.heroCard, darkGlassOverride]}>
              <Text style={styles.heroBody}>{APP_NAME} is not simply an events platform. It is emerging cultural infrastructure — designed to help people participate in real-world cultural life.</Text>

              <View style={styles.statsRow}>
                <Stat target={195} label="Countries" />
                <View style={styles.divider} />
                <Stat target={500} label="Cultures" />
                <View style={styles.divider} />
                <Stat target={7000} label="Languages" />
              </View>

              <Animated.View style={pulseStyle}>
                <Link href="/signup" asChild>
                  <Pressable style={styles.primaryBtn} accessibilityRole="button">
                    <Text style={styles.primaryText}>Get started</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </Pressable>
                </Link>
              </Animated.View>

              <Link href="/events" asChild>
                <Pressable style={styles.secondaryBtn}>
                  <Ionicons name="location-outline" size={15} color="white" />
                  <Text style={styles.secondaryText}>See events near you</Text>
                </Pressable>
              </Link>
            </GlassView>

            <View style={styles.socialProof}>
              <View style={styles.avatarRow}>
                {Array(5).fill(0).map((_, i) => (
                  <View key={i} style={[styles.avatar, { marginLeft: i ? -8 : 0 }]}>
                    <Text>🙂</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.socialText}>Join 1,000,000+ people discovering culture</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── WHAT WE ARE ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80)}>
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <Ionicons name="information-circle-outline" size={14} color={CultureTokens.indigo} />
              <Text style={[styles.sectionTag, { color: CultureTokens.indigo }]}>WHAT WE ARE</Text>
            </View>
            <Text style={styles.h2}>Not Just an Events App</Text>
            <Text style={styles.p}>
              {APP_NAME} is cultural infrastructure — a discovery and participation layer connecting people with real-world culture and community.
            </Text>

            <View style={[styles.grid, { maxWidth: isTablet ? 980 : "100%" }]}>
              {WHAT_WE_ARE.map((w, i) => (
                <Animated.View key={w.title} entering={FadeInDown.delay(i * 60)} style={styles.whatCard}>
                  <LinearGradient colors={[w.color + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={[styles.iconWrap, { backgroundColor: w.color + '18' }]}>
                    <Ionicons name={w.icon as any} size={24} color={w.color} />
                  </View>
                  <Text style={styles.whatTitle}>{w.title}</Text>
                  <Text style={styles.whatBody}>{w.body}</Text>
                </Animated.View>
              ))}
            </View>

            <View style={styles.whatBanner}>
              <LinearGradient colors={[CultureTokens.indigo + '12', CultureTokens.violet + '08']} style={StyleSheet.absoluteFill} />
              <Ionicons name="bulb-outline" size={20} color={CultureTokens.gold} style={{ flexShrink: 0 }} />
              <Text style={styles.whatBannerText}>
                {'"The long-term ambition is to build the Google Maps of Culture — connecting people with the cultural life that already exists around them."'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── WHAT WE ARE SOLVING ───────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="alert-circle-outline" size={14} color={CultureTokens.coral} />
            <Text style={[styles.sectionTag, { color: CultureTokens.coral }]}>WHAT WE ARE SOLVING</Text>
          </View>
          <Text style={styles.h2}>A Growing Crisis of Disconnection</Text>
          <Text style={styles.p}>
            Across multicultural societies, people face interconnected challenges that technology has largely ignored — until now.
          </Text>

          <View style={[styles.grid, { maxWidth: isTablet ? 980 : "100%" }]}>
            {PROBLEMS.map((p, i) => (
              <Animated.View key={p.title} entering={FadeInDown.delay(i * 60)} style={styles.problemCard}>
                <LinearGradient colors={[p.color + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[styles.iconWrap, { backgroundColor: p.color + '15' }]}>
                  <Ionicons name={p.icon as any} size={22} color={p.color} />
                </View>
                <Text style={styles.problemTitle}>{p.title}</Text>
                <Text style={styles.problemBody}>{p.body}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={styles.solution}>
            <LinearGradient colors={[CultureTokens.indigo + '15', CultureTokens.gold + '15']} style={StyleSheet.absoluteFill} />
            <View style={[styles.iconWrap, { backgroundColor: CultureTokens.gold + '20' }]}>
              <Ionicons name="sparkles" size={24} color={CultureTokens.gold} />
            </View>
            <Text style={styles.solutionTitle}>{APP_NAME} addresses this gap.</Text>
            <Text style={styles.solutionBody}>One platform to discover cultures, find community, and never miss the moments that matter — wherever you are in the world.</Text>
          </View>
        </View>

        {/* ── CULTURE AS INFRASTRUCTURE ─────────────────────────────────────── */}
        <View style={styles.infraWrap}>
          <LinearGradient
            colors={['#0B0A1A', CultureTokens.indigo, CultureTokens.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.section, { backgroundColor: 'transparent', paddingVertical: 72 }]}>
            <View style={styles.sectionLabel}>
              <Ionicons name="layers-outline" size={14} color={CultureTokens.gold} />
              <Text style={[styles.sectionTag, { color: CultureTokens.gold }]}>THE CORE THESIS</Text>
            </View>
            <Text style={[styles.h2, { color: 'white' }]}>Culture is Infrastructure</Text>
            <Text style={[styles.p, { color: 'rgba(255,255,255,0.82)' }]}>
              {"Culture is not just entertainment. It is one of humanity's most powerful systems for building connection, trust, and resilience in society."}
            </Text>

            <View style={[styles.grid, { maxWidth: isTablet ? 860 : "100%" }]}>
              {CULTURE_AS_INFRA.map((item, i) => (
                <Animated.View key={item.label} entering={FadeInDown.delay(i * 70)} style={styles.infraCard}>
                  <LinearGradient colors={[item.color + '25', item.color + '08']} style={StyleSheet.absoluteFill} />
                  <View style={[styles.infraIcon, { backgroundColor: item.color + '25' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.infraLabel}>{item.label}</Text>
                  <Text style={styles.infraBody}>{item.body}</Text>
                </Animated.View>
              ))}
            </View>

            <View style={styles.infraQuote}>
              <Text style={styles.infraQuoteText}>
                {'"Communities with strong cultural participation show improved mental wellbeing, stronger social trust, and greater resilience during crises."'}
              </Text>
              <Text style={styles.infraQuoteAttr}>— {APP_NAME} Vision Paper, 2026</Text>
            </View>
          </View>
        </View>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Ionicons name="list-outline" size={14} color={CultureTokens.teal} />
            <Text style={[styles.sectionTag, { color: CultureTokens.teal }]}>HOW IT WORKS</Text>
          </View>
          <Text style={styles.h2}>Simple to Start</Text>
          <Text style={styles.p}>Get connected to culture in four simple steps.</Text>
          <View style={[styles.grid, { maxWidth: 1000 }]}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={styles.stepCard}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <View style={[styles.iconWrap, { backgroundColor: s.color + "15" }]}>
                  <Ionicons name={s.icon as any} size={26} color={s.color} />
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FEATURES ──────────────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="sparkles-outline" size={14} color={CultureTokens.gold} />
            <Text style={[styles.sectionTag, { color: CultureTokens.gold }]}>THE PLATFORM</Text>
          </View>
          <Text style={styles.h2}>What You Can Do</Text>
          <Text style={styles.p}>Everything you need to stay connected to your culture — in one app.</Text>
          <View style={[styles.grid, { maxWidth: 1100 }]}>
            {FEATURES.map(f => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.iconWrap, { backgroundColor: f.color + "12" }]}>
                  <Ionicons name={f.icon as any} size={24} color={f.color} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={CultureTokens.violet} />
            <Text style={[styles.sectionTag, { color: CultureTokens.violet }]}>COMMUNITY VOICES</Text>
          </View>
          <Text style={styles.h2}>Loved by Communities</Text>
          <View style={[styles.grid, { maxWidth: 1000 }]}>
            {TESTIMONIALS.map(t => (
              <View key={t.name} style={styles.testimonial}>
                <Text style={styles.quoteChar}>&ldquo;</Text>
                <Text style={styles.testimonialText}>{t.text}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <View style={styles.avatarSmall}><Text>🙂</Text></View>
                  <View>
                    <Text style={styles.testimonialName}>{t.name}</Text>
                    <Text style={styles.testimonialCulture}>{t.culture}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── VISION ────────────────────────────────────────────────────────── */}
        <LinearGradient colors={[CultureTokens.indigo, '#0a0420']} style={styles.vision}>
          <Ionicons name="earth" size={40} color="rgba(255,255,255,0.25)" />
          <Text style={styles.visionLabel}>OUR VISION</Text>
          <Text style={styles.visionTitle}>Technology That Strengthens{"\n"}Real-World Connection</Text>
          <View style={styles.visionLine} />
          <Text style={styles.visionText}>
            {APP_NAME} proposes a different model: technology that amplifies and connects physical communities, rather than replacing them with passive digital consumption.
          </Text>
          <Text style={styles.visionText2}>
            Digital systems support physical participation. Online discovery strengthens offline engagement. Technology becomes an enabler of belonging — not a substitute for it.
          </Text>
          <Link href="/founder" asChild>
            <Pressable style={styles.founderBtn}>
              <Ionicons name="book-outline" size={16} color="white" />
              <Text style={styles.founderBtnText}>{"Read the Founder's Story"}</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </Link>
        </LinearGradient>

        <Footer />
      </ScrollView>
    </View>
  );
}

// ─── Static stat styles (no theme dependency) ────────────────────────────────
const statStyles = StyleSheet.create({
  number: { ...TextStyles.display, color: CultureTokens.gold, fontSize: 32 },
  label: { ...TextStyles.badgeCaps, color: "white", opacity: 0.8, marginTop: 2 },
});

// ─── Theme-dependent styles ───────────────────────────────────────────────────
const getStyles = (c: ColorTheme) => StyleSheet.create({
  bgMesh: { ...StyleSheet.absoluteFill, opacity: 0.06 },

  // Hero
  hero: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.3)" },
  heroContent: { width: "100%", maxWidth: 720, alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  pillText: { color: "white", fontSize: 12, fontFamily: "Poppins_500Medium" },
  heroTitle: { fontSize: 38, fontFamily: "Poppins_700Bold", color: "white", textAlign: "center", lineHeight: 50, marginTop: 12 },
  heroSub: { fontSize: 16, color: "white", opacity: 0.9, textAlign: "center", marginTop: 12, maxWidth: 520, lineHeight: 24 },
  heroCard: { width: "100%", maxWidth: 560, marginTop: 28, padding: 24, alignItems: "center", gap: 20 },
  heroBody: { color: "white", opacity: 0.92, textAlign: "center", fontSize: 15, lineHeight: 22 },
  statsRow: { flexDirection: "row", width: "100%", alignItems: "center" },
  divider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 12 },
  primaryBtn: { backgroundColor: CultureTokens.indigo, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999, minHeight: 50, width: "100%" },
  primaryText: { color: "white", fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  secondaryText: { color: "white", opacity: 0.9, fontSize: 14, fontFamily: "Poppins_500Medium" },
  socialProof: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
  avatarRow: { flexDirection: "row" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "white" },
  socialText: { color: "white", opacity: 0.8, fontSize: 12, fontFamily: "Poppins_500Medium" },

  // Layout
  section: { paddingHorizontal: 20, paddingVertical: 56, alignItems: "center" },
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTag: { fontSize: 11, fontFamily: "Poppins_700Bold", color: c.textTertiary, letterSpacing: 1.4 },
  h2: { fontSize: 28, fontFamily: "Poppins_700Bold", color: c.text, textAlign: "center", marginBottom: 8, letterSpacing: -0.3 },
  p: { fontSize: 15, color: c.textSecondary, textAlign: "center", maxWidth: 540, lineHeight: 22, marginBottom: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16, width: "100%" },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // What We Are
  whatCard: { backgroundColor: c.surface, padding: 22, borderRadius: 24, width: Platform.OS === "web" ? 220 : "48%", minWidth: 156, borderWidth: 1, borderColor: c.borderLight, gap: 10, overflow: "hidden" },
  whatTitle: { color: c.text, fontSize: 15, fontFamily: "Poppins_700Bold" },
  whatBody: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  whatBanner: { marginTop: 28, padding: 22, borderRadius: 20, borderWidth: 1, borderColor: c.borderLight, maxWidth: 640, width: "100%", overflow: "hidden", flexDirection: "row", alignItems: "flex-start", gap: 14 },
  whatBannerText: { flex: 1, color: c.text, fontSize: 14, lineHeight: 22, fontFamily: "Poppins_500Medium", fontStyle: "italic" },

  // What We Are Solving
  problemCard: { backgroundColor: c.background, padding: 20, borderRadius: 20, width: Platform.OS === "web" ? 280 : "48%", minWidth: 152, borderWidth: 1, borderColor: c.borderLight, gap: 10, overflow: "hidden" },
  problemTitle: { color: c.text, fontSize: 14, fontFamily: "Poppins_700Bold" },
  problemBody: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  solution: { marginTop: 32, padding: 28, borderRadius: 24, alignItems: "center", maxWidth: 600, width: "100%", borderWidth: 1, borderColor: c.borderLight, overflow: "hidden" },
  solutionTitle: { fontSize: 20, fontFamily: "Poppins_700Bold", color: c.text, marginTop: 12 },
  solutionBody: { textAlign: "center", marginTop: 8, color: c.textSecondary, lineHeight: 22 },

  // Culture as Infrastructure (dark section)
  infraWrap: { overflow: "hidden" },
  infraCard: { borderRadius: 22, padding: 22, width: Platform.OS === "web" ? 200 : "48%", minWidth: 148, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", overflow: "hidden", gap: 8 },
  infraIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infraLabel: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "white" },
  infraBody: { fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.75)" },
  infraQuote: { marginTop: 36, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", maxWidth: 620, width: "100%", alignItems: "center" },
  infraQuoteText: { fontSize: 15, color: "rgba(255,255,255,0.88)", textAlign: "center", lineHeight: 24, fontStyle: "italic" },
  infraQuoteAttr: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 10 },

  // Steps
  stepCard: { backgroundColor: c.surface, borderRadius: 20, padding: 22, width: Platform.OS === "web" ? 220 : "46%", alignItems: "center", borderWidth: 1, borderColor: c.borderLight, position: "relative" },
  stepNum: { position: "absolute", top: 10, left: 10, fontSize: 11, fontFamily: "Poppins_700Bold", color: c.textSecondary, backgroundColor: c.surfaceElevated, width: 22, height: 22, textAlign: "center", textAlignVertical: "center", borderRadius: 11 },
  stepTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: c.text, marginTop: 10 },
  stepDesc: { fontSize: 13, color: c.textSecondary, textAlign: "center", lineHeight: 18, marginTop: 4 },

  // Features
  featureCard: { backgroundColor: c.background, borderRadius: 20, padding: 22, width: Platform.OS === "web" ? 300 : "100%", maxWidth: 340, borderWidth: 1, borderColor: c.borderLight },
  featureTitle: { fontSize: 17, fontFamily: "Poppins_700Bold", color: c.text, marginTop: 10 },
  featureDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 20, marginTop: 4 },

  // Testimonials
  testimonial: { backgroundColor: c.surface, borderRadius: 20, padding: 20, width: Platform.OS === "web" ? 300 : "100%", maxWidth: 340, borderWidth: 1, borderColor: c.borderLight },
  quoteChar: { fontSize: 36, color: CultureTokens.gold, fontFamily: "Poppins_700Bold", lineHeight: 30 },
  testimonialText: { fontSize: 14, color: c.text, lineHeight: 21, fontStyle: "italic" },
  testimonialName: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: c.text },
  testimonialCulture: { fontSize: 12, color: c.textSecondary },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.borderLight },

  // Vision
  vision: { paddingVertical: 80, paddingHorizontal: 24, alignItems: "center", gap: 0 },
  visionLabel: { fontSize: 11, fontFamily: "Poppins_700Bold", color: CultureTokens.gold, letterSpacing: 1.6, marginTop: 16, marginBottom: 12 },
  visionTitle: { fontSize: 28, fontFamily: "Poppins_700Bold", color: "white", textAlign: "center", lineHeight: 40 },
  visionLine: { width: 48, height: 3, backgroundColor: CultureTokens.gold, borderRadius: 2, marginVertical: 20 },
  visionText: { fontSize: 16, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 640, lineHeight: 26 },
  visionText2: { fontSize: 15, color: "rgba(255,255,255,0.65)", textAlign: "center", maxWidth: 600, lineHeight: 24, marginTop: 16 },
  founderBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.08)" },
  founderBtnText: { color: "white", fontSize: 14, fontFamily: "Poppins_600SemiBold" },

  // CTA
  finalCta: { alignItems: "center", paddingVertical: 70, paddingHorizontal: 24, gap: 12 },
  ctaBtn: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 15, paddingHorizontal: 32, borderRadius: 999, overflow: "hidden" },
  ctaText: { color: "white", fontSize: 16, fontFamily: "Poppins_600SemiBold" },
});