import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, CultureTokens, ScreenTokens, gradients } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { Link, Stack } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import { APP_NAME, APP_AKA, APP_DOMAIN, PLATFORM_TAGLINE, PRIMARY_REGION, MADE_IN, getAppVersion } from '@/lib/app-meta';
import { FOOTER_LINKS, SOCIAL_LINKS } from '@/lib/site-footer-links';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { openExternalUrl } from '@/lib/openExternalUrl';

const COMPANY_FACTS = [
  { label: 'Founded', value: '2023', icon: 'calendar', color: CultureTokens.indigo },
  { label: 'Headquarters', value: 'Sydney, Australia', icon: 'location', color: CultureTokens.teal },
  { label: 'Employees', value: '12', icon: 'people', color: CultureTokens.gold },
  { label: 'Countries', value: '195+', icon: 'earth', color: CultureTokens.coral },
];

const MISSION_STATEMENT = "CulturePass is built to empower cultural diaspora communities by connecting people with the events, businesses, and organisations that celebrate their heritage. We believe culture is best experienced together.";

export default function CompanyInfoScreen() {
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
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      
      <M3TopAppBar
        title="Company Info"
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
                    <Ionicons name="business" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
                <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>AKA {APP_AKA} · Building Cultural Infrastructure Since 2023</Text>
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
                      {MISSION_STATEMENT}
                    </Text>
                </GlassView>
            </Animated.View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>COMPANY FACTS</Text>
                <View style={styles.companyFactsGrid}>
                    {COMPANY_FACTS.map((fact, i) => (
                        <View key={fact.label} style={styles.factCard}>
                            <LinearGradient 
                              colors={[fact.color + '15', fact.color + '05']} 
                              start={{ x: 0, y: 0 }} 
                              end={{ x: 1, y: 1 }}
                              style={[styles.factBackground, { backgroundColor: colors.surface }]}
                            >
                              <View style={[styles.factIconWrap, { backgroundColor: fact.color + '20' }]}>
                                  <Ionicons name={fact.icon as any} size={20} color={fact.color} />
                              </View>
                              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>{fact.label}</Text>
                              <Text style={[styles.factValue, { color: fact.color }]}>{fact.value}</Text>
                            </LinearGradient>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>LEGAL & CORPORATE</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {FOOTER_LINKS.filter(link => 
                      ['Terms', 'Privacy', 'Cookies', 'Community', 'Guidelines', 'Event Terms'].includes(link.label)
                    ).map((link, i) => (
                        <View key={link.href}>
                            <Link href={link.href} asChild>
                                <Pressable
                                    style={({ pressed }) => [styles.legalRow, pressed && { backgroundColor: colors.primarySoft }]}
                                >
                                    <View style={[styles.legalIcon, { backgroundColor: colors.primarySoft }]}>
                                        <Ionicons name="document-text" size={18} color={colors.primary} />
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
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>CONNECT WITH US</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {SOCIAL_LINKS.map((link, i) => (
                        <View key={link.label}>
                            <Pressable
                                onPress={() => openExternalUrl(link.url)}
                                style={({ pressed }) => [styles.legalRow, pressed && { backgroundColor: colors.primarySoft }]}
                            >
                                <View style={[styles.legalIcon, { backgroundColor: link.label === 'Support' ? CultureTokens.gold + '15' : colors.primarySoft }]}>
                                    <Ionicons name={link.icon as any} size={18} color={link.label === 'Support' ? CultureTokens.gold : colors.primary} />
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
                    {`© ${year} ${APP_NAME} • AKA ${APP_AKA} • ${APP_DOMAIN}`}
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
  appName: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.bold, letterSpacing: 0, marginBottom: 4 },
  appSubtitle: { fontSize: 14, fontFamily: FontFamily.regular, letterSpacing: 0, color: '#888' },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  versionText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.8 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  missionText: { fontSize: 15, fontFamily: FontFamily.regular, lineHeight: 22 },

  groupLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  companyFactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  factCard: { flex: 1, minWidth: 140, maxWidth: 180 },
  factBackground: { 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  factIconWrap: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  factLabel: { 
    fontSize: 12, 
    fontFamily: FontFamily.medium, 
    textAlign: 'center' 
  },
  factValue: { 
    fontSize: 18, 
    fontFamily: FontFamily.bold, 
    textAlign: 'center' 
  },

  legalRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  legalIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  legalText: { flex: 1, fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold },
  divider: { height: 1, marginLeft: 68 },

  taglineSection: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  heartGradient: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tagline: { fontSize: 15, fontFamily: FontFamily.bold, textAlign: 'center' },
  copyright: { fontSize: 11, fontFamily: FontFamily.medium },
});