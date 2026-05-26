import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, CultureTokens, ScreenTokens, gradients } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { Link, Stack } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import { APP_NAME, APP_DOMAIN, PLATFORM_TAGLINE, PRIMARY_REGION, MADE_IN, getAppVersion } from '@/lib/app-meta';
import { FOOTER_LINKS, SOCIAL_LINKS } from '@/lib/site-footer-links';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { openExternalUrl } from '@/lib/openExternalUrl';

const FEATURES = [
  { icon: 'calendar' as const, label: 'Events', desc: 'Find cultural experiences and festivals', color: CultureTokens.indigo },
  { icon: 'people' as const, label: 'Communities', desc: 'Join groups that celebrate your heritage', color: CultureTokens.teal },
  { icon: 'gift' as const, label: 'Perks', desc: 'Access exclusive member-only benefits', color: CultureTokens.gold },
  { icon: 'business' as const, label: 'Directory', desc: 'Discover and support local businesses', color: CultureTokens.coral },
];

// Define icons for social links
const getSocialLinkIcon = (label: string): string => {
  switch(label.toLowerCase()) {
    case 'instagram': return 'logo-instagram';
    case 'instagram india': return 'logo-instagram';
    case 'facebook': return 'logo-facebook';
    case 'x': return 'logo-twitter';
    case 'tiktok': return 'logo-tiktok';
    case 'youtube': return 'logo-youtube';
    case 'linkedin': return 'logo-linkedin';
    case 'support': return 'heart-outline';
    default: return 'logo-social';
  }
};

// Define icons for legal links
const getLegalLinkIcon = (label: string): string => {
  switch(label.toLowerCase()) {
    case 'our story': return 'book-outline';
    case 'about': return 'information-circle-outline';
    case 'terms': return 'document-text-outline';
    case 'privacy': return 'shield-checkmark-outline';
    case 'community': return 'people-outline';
    case 'cookies': return 'cafe-outline';
    case 'contact': return 'mail-outline';
    case 'help': return 'help-circle-outline';
    case 'company info': return 'business-outline';
    case 'guidelines': return 'bulb-outline';
    case 'event terms': return 'receipt-outline';
    default: return 'document-text-outline';
  }
};

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const appVersion = getAppVersion();
  const year = new Date().getFullYear();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      
      <M3TopAppBar
        title="About"
        onBack={() => goBackOrReplace('/settings')}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: ScreenTokens.topOffset }}
      >
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
            {/* Brand Hero */}
            <View style={styles.heroSection}>
                <LinearGradient
                    colors={gradients.culturepassBrand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoGradient}
                >
                    <Ionicons name="earth" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
                <View style={[styles.versionBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                    <Text style={[styles.versionText, { color: colors.primary }]}>{`VERSION ${appVersion} · ${PRIMARY_REGION} · ${MADE_IN}`}</Text>
                </View>
            </View>

            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)} style={styles.section}>
                <GlassView contentStyle={{ padding: 24, gap: 12 }}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primarySoft }]}>
                            <Ionicons name="megaphone" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Mission</Text>
                    </View>
                    <Text style={[styles.missionText, { color: colors.textSecondary }]}>
                    CulturePass is built to empower cultural diaspora communities by connecting people with the events, businesses, and organisations that celebrate their heritage. We believe culture is best experienced together.
                    </Text>
                </GlassView>
            </Animated.View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>KEY FEATURES</Text>
                <View style={styles.featuresGrid}>
                    {FEATURES.map((f, i) => (
                        <View key={f.label} style={styles.featureCell}>
                            <GlassView contentStyle={{ padding: 16, gap: 10, height: 140 }}>
                                <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
                                    <Ionicons name={f.icon} size={22} color={f.color} />
                                </View>
                                <View>
                                    <Text style={[styles.featureLabel, { color: colors.text }]}>{f.label}</Text>
                                    <Text style={[styles.featureDesc, { color: colors.textTertiary }]} numberOfLines={3}>{f.desc}</Text>
                                </View>
                            </GlassView>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>LEGAL & HELP</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {FOOTER_LINKS.map((link, i) => (
                        <View key={link.href}>
                            <Link href={link.href} asChild>
                                <Pressable
                                    style={({ pressed }) => [styles.legalRow, pressed && { backgroundColor: colors.primarySoft }]}
                                >
                                    <View style={[styles.legalIcon, { backgroundColor: colors.primarySoft }]}>
                                        <Ionicons name={getLegalLinkIcon(link.label) as any} size={18} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.legalText, { color: colors.text }]}>{link.label}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                                </Pressable>
                            </Link>
                            {i < FOOTER_LINKS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                        </View>
                    ))}
                </GlassView>
            </View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>STAY CONNECTED</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {SOCIAL_LINKS.map((link, i) => (
                        <View key={link.label}>
                            <Pressable
                                onPress={() => openExternalUrl(link.url)}
                                style={({ pressed }) => [styles.legalRow, pressed && { backgroundColor: colors.primarySoft }]}
                            >
                                    <View style={[styles.legalIcon, { backgroundColor: (link as any).label === 'Support' ? CultureTokens.gold + '15' : colors.primarySoft }]}>
                                        <Ionicons name={getSocialLinkIcon(link.label) as any} size={18} color={(link as any).label === 'Support' ? CultureTokens.gold : colors.primary} />
                                    </View>
                                <Text style={[styles.legalText, { color: colors.text }]}>{link.label}</Text>
                                <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
                            </Pressable>
                            {i < SOCIAL_LINKS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                        </View>
                    ))}
                </GlassView>
            </View>

            <View style={styles.taglineSection}>
                <View style={[styles.heartGradient, { backgroundColor: CultureTokens.coral }]}>
                    <Ionicons name="heart" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.tagline, { color: colors.text }]}>{PLATFORM_TAGLINE}</Text>
                <Text style={[styles.tagline, { color: colors.textSecondary, fontSize: 13, marginTop: -4 }]}>{MADE_IN}</Text>
                <Text style={[styles.copyright, { color: colors.textTertiary }]}>
                    {`© ${year} ${APP_NAME} · ${APP_DOMAIN}`}
                </Text>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 12,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.5, opacity: 0.8 },
  backBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  contentShell: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  logoGradient: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.bold, letterSpacing: 0, marginBottom: 8 },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  versionText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.8 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  missionText: { fontSize: 15, fontFamily: FontFamily.regular, lineHeight: 22 },

  groupLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCell: { width: '48.2%' },
  featureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 15, fontFamily: FontFamily.bold, marginBottom: 4 },
  featureDesc: { fontSize: 12, fontFamily: FontFamily.medium, lineHeight: 16 },

  legalRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  legalIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  legalText: { flex: 1, fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold },
  divider: { height: 1, marginLeft: 68 },

  taglineSection: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  heartGradient: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tagline: { fontSize: 15, fontFamily: FontFamily.bold, textAlign: 'center' },
  copyright: { fontSize: 11, fontFamily: FontFamily.medium },
});