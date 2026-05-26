import React, { useEffect, memo } from "react";
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
import { CultureTokens, gradients, type ColorTheme, Spacing } from "@/design-system/tokens/theme";
import { GlassView } from "@/design-system/ui/GlassView";
import { M3TopAppBar } from '@/design-system/ui';
import { TextStyles } from "@/design-system/tokens/typography";
import { goBackOrReplace } from "@/lib/navigation";
import { Footer } from "@/components/Footer";

const DARK_GLASS_TINT = '#0F0E1A';
const darkGlassOverride = {
  backgroundColor: 'rgba(15, 14, 26, 0.55)',
  borderColor: 'rgba(255, 255, 255, 0.18)',
} as const;

// ─── What We Are ──────────────────────────────────────────────────────────────
const WHAT_WE_ARE = [
  { icon: "map-outline", color: CultureTokens.indigo, title: "Discovery Engine", body: "A global layer for finding events, traditions, festivals, and cultural experiences that already exist around you — made discoverable for everyone." },
  { icon: "people-circle-outline", color: CultureTokens.teal, title: "Community Network", body: "Infrastructure for grassroots organisations and diaspora communities to gain visibility, reach audiences, and grow real participation." },
  { icon: "shield-outline", color: CultureTokens.violet, title: "Participation Platform", body: "Built to strengthen real-world engagement — not replace it with passive scrolling. Technology that serves belonging, not screen time." },
  { icon: "id-card-outline", color: CultureTokens.coral, title: "Cultural Identity Layer", body: "A social infrastructure for cross-cultural discovery and genuine human connection in multicultural cities worldwide." },
] as const;

// ─── Our Values ──────────────────────────────────────────────────────────────
const VALUES = [
  { icon: "heart-outline", color: CultureTokens.coral, title: "Community First", body: "We prioritize community needs over profit, ensuring our platform serves cultural preservation and connection." },
  { icon: "shield-checkmark-outline", color: CultureTokens.violet, title: "Trust & Safety", body: "Committed to creating safe spaces where all cultures can be celebrated and respected." },
  { icon: "globe-outline", color: CultureTokens.indigo, title: "Global Perspective", body: "Designed to honor diverse cultural practices and traditions from around the world." },
  { icon: "lock-closed-outline", color: CultureTokens.teal, title: "Privacy Focused", body: "Your cultural identity and connections are protected with industry-leading privacy measures." },
] as const;

// ─── How It Works ─────────────────────────────────────────────────────────────
const STEPS = [
  { icon: "location-outline", color: CultureTokens.gold, title: "Choose Your City", desc: "Sydney, Melbourne, Brisbane, Perth & more" },
  { icon: "people-circle-outline", color: CultureTokens.teal, title: "Pick Your Cultures", desc: "Indian, Korean, Greek, Lebanese, First Nations" },
  { icon: "calendar-outline", color: CultureTokens.gold, title: "Discover & Attend", desc: "Browse events, buy tickets, store in wallet" },
  { icon: "chatbubble-ellipses-outline", color: CultureTokens.indigo, title: "Stay Connected", desc: "Follow artists, sponsors and communities" },
] as const;

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "sparkles-outline", color: CultureTokens.gold, title: "Discover Events", desc: "Festivals, food, networking and cultural gatherings." },
  { icon: "people-outline", color: CultureTokens.teal, title: "Join Communities", desc: "Connect with cultural organisations near you." },
  { icon: "ticket-outline", color: CultureTokens.gold, title: "Digital Tickets", desc: "Purchase, store in wallet, check in with QR." },
  { icon: "pricetag-outline", color: CultureTokens.coral, title: "Exclusive Perks", desc: "Discounts from local cultural businesses." },
  { icon: "globe-outline", color: CultureTokens.indigo, title: "Cultural Map", desc: "Live map of events, venues and hubs." },
  { icon: "shield-checkmark-outline", color: CultureTokens.indigo, title: "CulturePass ID", desc: "Your digital identity and membership." },
] as const;

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Priya K.", culture: "Indian community", text: "CulturePass helped me find Diwali events I never knew existed in Sydney!" },
  { name: "Min-Jun P.", culture: "Korean community", text: "I connected with the Korean film community within my first week." },
  { name: "Amara O.", culture: "African community", text: "Finally one place where our cultural events get visibility." },
] as const;

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
export default function GetToKnowCulturePass() {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;
  const isMobile = width < 768;

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
        title="Get to Know"
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
            <Text style={styles.heroTitle}>Getting to Know{"\n"}CulturePass.</Text>
            <Text style={styles.heroSub}>Discover who we are, what we stand for, and how we're building cultural infrastructure for everyone.</Text>

            <GlassView tone="dark" tintColor={DARK_GLASS_TINT} borderRadius={24} style={[styles.heroCard, darkGlassOverride]}>
              <Text style={styles.heroBody}>CulturePass is not simply an events platform. It is emerging cultural infrastructure — designed to help people participate in real-world cultural life.</Text>

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

        {/* ── OUR VALUES ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80)}>
          <View style={[styles.section, { paddingHorizontal: isMobile ? Spacing.md : Spacing.xl }]}>
            <View style={styles.sectionLabel}>
              <Ionicons name="heart-outline" size={14} color={CultureTokens.coral} />
              <Text style={[styles.sectionTag, { color: CultureTokens.coral }]}>OUR VALUES</Text>
            </View>
            <Text style={styles.h2}>What We Stand For</Text>
            <Text style={styles.p}>
              Our core values guide everything we do — from product decisions to community partnerships.
            </Text>

            <View style={[styles.grid, { 
              maxWidth: isTablet ? 980 : "100%", 
              gap: isMobile ? Spacing.md : Spacing.lg,
              paddingHorizontal: isMobile ? Spacing.sm : 0
            }]}>
              {VALUES.map((v, i) => (
                <Animated.View key={v.title} entering={FadeInDown.delay(i * 60)} style={[styles.whatCard, { 
                  width: isMobile ? '100%' : (isTablet ? '48%' : 220),
                  marginHorizontal: isMobile ? 0 : undefined
                }]}>
                  <LinearGradient colors={[v.color + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                  <View style={[styles.iconWrap, { backgroundColor: v.color + '18' }]}>
                    <Ionicons name={v.icon as any} size={24} color={v.color} />
                  </View>
                  <Text style={styles.whatTitle}>{v.title}</Text>
                  <Text style={styles.whatBody}>{v.body}</Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── WHAT WE ARE ───────────────────────────────────────────────────── */}
        <View style={[styles.section, { 
          backgroundColor: colors.surface,
          paddingHorizontal: isMobile ? Spacing.md : Spacing.xl
        }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="information-circle-outline" size={14} color={CultureTokens.indigo} />
            <Text style={[styles.sectionTag, { color: CultureTokens.indigo }]}>WHAT WE ARE</Text>
          </View>
          <Text style={styles.h2}>Cultural Infrastructure</Text>
          <Text style={styles.p}>
            CulturePass is a discovery and participation layer connecting people with real-world culture and community.
          </Text>

          <View style={[styles.grid, { 
            maxWidth: isTablet ? 980 : "100%",
            gap: isMobile ? Spacing.md : Spacing.lg,
            paddingHorizontal: isMobile ? Spacing.sm : 0
          }]}>
            {WHAT_WE_ARE.map((w, i) => (
              <Animated.View key={w.title} entering={FadeInDown.delay(i * 60)} style={[styles.whatCard, { 
                width: isMobile ? '100%' : (isTablet ? '48%' : 220),
                marginHorizontal: isMobile ? 0 : undefined
              }]}>
                <LinearGradient colors={[w.color + '12', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[styles.iconWrap, { backgroundColor: w.color + '18' }]}>
                  <Ionicons name={w.icon as any} size={24} color={w.color} />
                </View>
                <Text style={styles.whatTitle}>{w.title}</Text>
                <Text style={styles.whatBody}>{w.body}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: isMobile ? Spacing.md : Spacing.xl }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="list-outline" size={14} color={CultureTokens.teal} />
            <Text style={[styles.sectionTag, { color: CultureTokens.teal }]}>HOW IT WORKS</Text>
          </View>
          <Text style={styles.h2}>Simple to Start</Text>
          <Text style={styles.p}>Get connected to culture in four simple steps.</Text>
          <View style={[styles.grid, { 
            maxWidth: 1000,
            gap: isMobile ? Spacing.md : Spacing.lg,
            paddingHorizontal: isMobile ? Spacing.sm : 0
          }]}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.stepCard, { 
                width: isMobile ? '100%' : (isTablet ? '46%' : 220),
                marginHorizontal: isMobile ? 0 : undefined
              }]}>
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
        <View style={[styles.section, { 
          backgroundColor: colors.surface,
          paddingHorizontal: isMobile ? Spacing.md : Spacing.xl
        }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="sparkles-outline" size={14} color={CultureTokens.gold} />
            <Text style={[styles.sectionTag, { color: CultureTokens.gold }]}>THE PLATFORM</Text>
          </View>
          <Text style={styles.h2}>What You Can Do</Text>
          <Text style={styles.p}>Everything you need to stay connected to your culture — in one app.</Text>
          <View style={[styles.grid, { 
            maxWidth: 1100,
            gap: isMobile ? Spacing.md : Spacing.lg,
            paddingHorizontal: isMobile ? Spacing.sm : 0
          }]}>
            {FEATURES.map(f => (
              <View key={f.title} style={[styles.featureCard, { 
                width: isMobile ? '100%' : (isTablet ? '46%' : 300),
                marginHorizontal: isMobile ? 0 : undefined
              }]}>
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
        <View style={[styles.section, { paddingHorizontal: isMobile ? Spacing.md : Spacing.xl }]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={CultureTokens.violet} />
            <Text style={[styles.sectionTag, { color: CultureTokens.violet }]}>COMMUNITY VOICES</Text>
          </View>
          <Text style={styles.h2}>Loved by Communities</Text>
          <View style={[styles.grid, { 
            maxWidth: 1000,
            gap: isMobile ? Spacing.md : Spacing.lg,
            paddingHorizontal: isMobile ? Spacing.sm : 0
          }]}>
            {TESTIMONIALS.map(t => (
              <View key={t.name} style={[styles.testimonial, { 
                width: isMobile ? '100%' : (isTablet ? '46%' : 300),
                marginHorizontal: isMobile ? 0 : undefined
              }]}>
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
  hero: { 
    paddingTop: 60, 
    paddingBottom: 40, 
    paddingHorizontal: 20, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.3)" },
  heroContent: { width: "100%", maxWidth: 720, alignItems: "center" },
  pill: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    marginBottom: 16 
  },
  pillText: { color: "white", fontSize: 12, fontFamily: "Poppins_500Medium" },
  heroTitle: { 
    fontSize: 38, 
    fontFamily: "Poppins_700Bold", 
    color: "white", 
    textAlign: "center", 
    lineHeight: 50, 
    marginTop: 12 
  },
  heroSub: { 
    fontSize: 16, 
    color: "white", 
    opacity: 0.9, 
    textAlign: "center", 
    marginTop: 12, 
    maxWidth: 520, 
    lineHeight: 24 
  },
  heroCard: { 
    width: "100%", 
    maxWidth: 560, 
    marginTop: 28, 
    padding: 24, 
    alignItems: "center", 
    gap: 20 
  },
  heroBody: { 
    color: "white", 
    opacity: 0.92, 
    textAlign: "center", 
    fontSize: 15, 
    lineHeight: 22 
  },
  statsRow: { 
    flexDirection: "row", 
    width: "100%", 
    alignItems: "center" 
  },
  divider: { 
    width: 1, 
    height: 36, 
    backgroundColor: "rgba(255,255,255,0.2)", 
    marginHorizontal: 12 
  },
  primaryBtn: { 
    backgroundColor: CultureTokens.indigo, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    paddingVertical: 14, 
    paddingHorizontal: 28, 
    borderRadius: 999, 
    minHeight: 50, 
    width: "100%" 
  },
  primaryText: { 
    color: "white", 
    fontSize: 16, 
    fontFamily: "Poppins_600SemiBold" 
  },
  secondaryBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 999, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.4)" 
  },
  secondaryText: { 
    color: "white", 
    opacity: 0.9, 
    fontSize: 14, 
    fontFamily: "Poppins_500Medium" 
  },
  socialProof: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    marginTop: 20 
  },
  avatarRow: { 
    flexDirection: "row" 
  },
  avatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: "rgba(255,255,255,0.2)", 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1.5, 
    borderColor: "white" 
  },
  socialText: { 
    color: "white", 
    opacity: 0.8, 
    fontSize: 12, 
    fontFamily: "Poppins_500Medium" 
  },

  // Layout
  section: { 
    paddingHorizontal: 20, 
    paddingVertical: 56, 
    alignItems: "center" 
  },
  sectionLabel: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    marginBottom: 10 
  },
  sectionTag: { 
    fontSize: 11, 
    fontFamily: "Poppins_700Bold", 
    color: c.textTertiary, 
    letterSpacing: 1.4 
  },
  h2: { 
    fontSize: 28, 
    fontFamily: "Poppins_700Bold", 
    color: c.text, 
    textAlign: "center", 
    marginBottom: 8, 
    letterSpacing: -0.3 
  },
  p: { 
    fontSize: 15, 
    color: c.textSecondary, 
    textAlign: "center", 
    maxWidth: 540, 
    lineHeight: 22, 
    marginBottom: 28 
  },
  grid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "center", 
    gap: 16, 
    width: "100%" 
  },
  iconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center" 
  },

  // What We Are
  whatCard: { 
    backgroundColor: c.surface, 
    padding: 22, 
    borderRadius: 24, 
    width: Platform.OS === "web" ? 220 : "48%", 
    minWidth: 156, 
    borderWidth: 1, 
    borderColor: c.borderLight, 
    gap: 10, 
    overflow: "hidden" 
  },
  whatTitle: { 
    color: c.text, 
    fontSize: 15, 
    fontFamily: "Poppins_700Bold" 
  },
  whatBody: { 
    color: c.textSecondary, 
    fontSize: 13, 
    lineHeight: 20 
  },
  whatBanner: { 
    marginTop: 28, 
    padding: 22, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: c.borderLight, 
    maxWidth: 640, 
    width: "100%", 
    overflow: "hidden", 
    flexDirection: "row", 
    alignItems: "flex-start", 
    gap: 14 
  },
  whatBannerText: { 
    flex: 1, 
    color: c.text, 
    fontSize: 14, 
    lineHeight: 22, 
    fontFamily: "Poppins_500Medium", 
    fontStyle: "italic" 
  },

  // What We Are Solving
  problemCard: { 
    backgroundColor: c.background, 
    padding: 20, 
    borderRadius: 20, 
    width: Platform.OS === "web" ? 280 : "48%", 
    minWidth: 152, 
    borderWidth: 1, 
    borderColor: c.borderLight, 
    gap: 10, 
    overflow: "hidden" 
  },
  problemTitle: { 
    color: c.text, 
    fontSize: 14, 
    fontFamily: "Poppins_700Bold" 
  },
  problemBody: { 
    color: c.textSecondary, 
    fontSize: 13, 
    lineHeight: 20 
  },
  solution: { 
    marginTop: 32, 
    padding: 28, 
    borderRadius: 24, 
    alignItems: "center", 
    maxWidth: 600, 
    width: "100%", 
    borderWidth: 1, 
    borderColor: c.borderLight, 
    overflow: "hidden" 
  },
  solutionTitle: { 
    fontSize: 20, 
    fontFamily: "Poppins_700Bold", 
    color: c.text, 
    marginTop: 12 
  },
  solutionBody: { 
    textAlign: "center", 
    marginTop: 8, 
    color: c.textSecondary, 
    lineHeight: 22 
  },

  // Culture as Infrastructure (dark section)
  infraWrap: { 
    overflow: "hidden" 
  },
  infraCard: { 
    borderRadius: 22, 
    padding: 22, 
    width: Platform.OS === "web" ? 200 : "48%", 
    minWidth: 148, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.12)", 
    overflow: "hidden", 
    gap: 8 
  },
  infraIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  infraLabel: { 
    fontSize: 16, 
    fontFamily: "Poppins_700Bold", 
    color: "white" 
  },
  infraBody: { 
    fontSize: 12, 
    lineHeight: 18, 
    color: "rgba(255,255,255,0.75)" 
  },
  infraQuote: { 
    marginTop: 36, 
    padding: 24, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.15)", 
    maxWidth: 620, 
    width: "100%", 
    alignItems: "center" 
  },
  infraQuoteText: { 
    fontSize: 15, 
    color: "rgba(255,255,255,0.88)", 
    textAlign: "center", 
    lineHeight: 24, 
    fontStyle: "italic" 
  },
  infraQuoteAttr: { 
    fontSize: 12, 
    color: "rgba(255,255,255,0.5)", 
    marginTop: 10 
  },

  // Steps
  stepCard: { 
    backgroundColor: c.surface, 
    borderRadius: 20, 
    padding: 22, 
    width: Platform.OS === "web" ? 220 : "46%", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: c.borderLight, 
    position: "relative" 
  },
  stepNum: { 
    position: "absolute", 
    top: 10, 
    left: 10, 
    fontSize: 11, 
    fontFamily: "Poppins_700Bold", 
    color: c.textSecondary, 
    backgroundColor: c.surfaceElevated, 
    width: 22, 
    height: 22, 
    textAlign: "center", 
    textAlignVertical: "center", 
    borderRadius: 11 
  },
  stepTitle: { 
    fontSize: 16, 
    fontFamily: "Poppins_700Bold", 
    color: c.text, 
    marginTop: 10 
  },
  stepDesc: { 
    fontSize: 13, 
    color: c.textSecondary, 
    textAlign: "center", 
    lineHeight: 18, 
    marginTop: 4 
  },

  // Features
  featureCard: { 
    backgroundColor: c.background, 
    borderRadius: 20, 
    padding: 22, 
    width: Platform.OS === "web" ? 300 : "100%", 
    maxWidth: 340, 
    borderWidth: 1, 
    borderColor: c.borderLight 
  },
  featureTitle: { 
    fontSize: 17, 
    fontFamily: "Poppins_700Bold", 
    color: c.text, 
    marginTop: 10 
  },
  featureDesc: { 
    fontSize: 13, 
    color: c.textSecondary, 
    lineHeight: 20, 
    marginTop: 4 
  },

  // Testimonials
  testimonial: { 
    backgroundColor: c.surface, 
    borderRadius: 20, 
    padding: 20, 
    width: Platform.OS === "web" ? 300 : "100%", 
    maxWidth: 340, 
    borderWidth: 1, 
    borderColor: c.borderLight 
  },
  quoteChar: { 
    fontSize: 36, 
    color: CultureTokens.gold, 
    fontFamily: "Poppins_700Bold", 
    lineHeight: 30 
  },
  testimonialText: { 
    fontSize: 14, 
    color: c.text, 
    lineHeight: 21, 
    fontStyle: "italic" 
  },
  testimonialName: { 
    fontSize: 14, 
    fontFamily: "Poppins_600SemiBold", 
    color: c.text 
  },
  testimonialCulture: { 
    fontSize: 12, 
    color: c.textSecondary 
  },
  avatarSmall: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: c.surfaceElevated, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1.5, 
    borderColor: c.borderLight 
  },
});