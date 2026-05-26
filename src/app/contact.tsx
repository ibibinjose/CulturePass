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

const CONTACT_OPTIONS = [
  { icon: 'mail' as const, label: 'Email Us', desc: 'Send us a message directly', color: CultureTokens.indigo },
  { icon: 'chatbubbles' as const, label: 'Live Chat', desc: 'Get instant help from our team', color: CultureTokens.teal },
  { icon: 'help-circle' as const, label: 'FAQ', desc: 'Find answers to common questions', color: CultureTokens.gold },
  { icon: 'call' as const, label: 'Support Line', desc: 'Speak with our support team', color: CultureTokens.coral },
];

const SUPPORT_CHANNELS = [
  { icon: 'logo-instagram', label: 'Instagram DM', url: 'https://instagram.com/culturepassapp', color: '#E1306C' },
  { icon: 'logo-facebook', label: 'Facebook Page', url: 'https://facebook.com/CulturePass.App', color: '#1877F2' },
  { icon: 'logo-twitter', label: 'X/Twitter', url: 'https://x.com/CulturePassApp', color: '#1DA1F2' },
  { icon: 'chatbubbles', label: 'Support Portal', url: 'https://airpal.me/CulturePassApp', color: CultureTokens.indigo },
];

export default function ContactScreen() {
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
        title="Contact"
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
                    <Ionicons name="mail" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME} Support</Text>
                <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>{"We're here to help with any questions"}</Text>
            </View>

            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)} style={styles.section}>
                <GlassView contentStyle={{ padding: 24, gap: 12 }}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primarySoft }]}>
                            <Ionicons name="megaphone" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>How Can We Help?</Text>
                    </View>
                    <Text style={[styles.missionText, { color: colors.textSecondary }]}>
                    Whether you have questions about events, need help with your account, or want to learn more about partnering with us, our team is ready to assist you.
                    </Text>
                </GlassView>
            </Animated.View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>CONTACT OPTIONS</Text>
                <View style={styles.featuresGrid}>
                    {CONTACT_OPTIONS.map((option, i) => (
                        <View key={option.label} style={styles.featureCell}>
                            <GlassView contentStyle={{ padding: 16, gap: 10, height: 140 }}>
                                <View style={[styles.featureIcon, { backgroundColor: option.color + '15' }]}>
                                    <Ionicons name={option.icon} size={22} color={option.color} />
                                </View>
                                <View>
                                    <Text style={[styles.featureLabel, { color: colors.text }]}>{option.label}</Text>
                                    <Text style={[styles.featureDesc, { color: colors.textTertiary }]} numberOfLines={3}>{option.desc}</Text>
                                </View>
                            </GlassView>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>SUPPORT CHANNELS</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {SUPPORT_CHANNELS.map((channel, i) => (
                        <View key={channel.label}>
                            <Pressable
                                onPress={() => openExternalUrl(channel.url)}
                                style={({ pressed }) => [styles.legalRow, pressed && { backgroundColor: colors.primarySoft }]}
                            >
                                <View style={[styles.legalIcon, { backgroundColor: channel.color + '15' }]}>
                                    <Ionicons name={channel.icon as any} size={18} color={channel.color} />
                                </View>
                                <Text style={[styles.legalText, { color: colors.text }]}>{channel.label}</Text>
                                <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
                            </Pressable>
                            {i < SUPPORT_CHANNELS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                        </View>
                    ))}
                </GlassView>
            </View>

            <View style={styles.section}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>LEGAL & HELP</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {FOOTER_LINKS.filter(link => 
                      ['Help', 'Terms', 'Privacy', 'Cookies', 'Contact'].includes(link.label)
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