import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { FontFamily, CultureTokens, ScreenTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';
import { APP_NAME, APP_AKA, EMAIL_SUPPORT, SITE_ORIGIN, CONTACT_PHONE, CONTACT_PHONE_DISPLAY, WHATSAPP_LINK } from '@/lib/app-meta';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

const FAQ_ITEMS = [
  { q: `What is ${APP_NAME}?`, a: `${APP_NAME} is a lifestyle platform for cultural diaspora communities. Use the app to connect with events, communities, and perks that celebrate your heritage.` },
  { q: 'How do I join a community?', a: 'Visit the Communities tab to browse cultural groups. Tap any community to see details, then tap "Join" to receive updates on their events and activities.' },
  { q: 'How do I purchase event tickets?', a: 'Browse events from the Home tab. Tap an event, select your ticket tier, and complete the purchase using your saved payment method.' },
  { q: 'What are Perks & Benefits?', a: `Perks are exclusive discounts, free tickets, and VIP upgrades offered by ${APP_NAME} and our partners. Visit the Perks page to redeem offers.` },
];

const CONTACT_OPTIONS = [
  { icon: 'mail' as const, label: 'Email Support', sub: EMAIL_SUPPORT, color: (colors: any) => colors.primary, action: () => Linking.openURL(`mailto:${EMAIL_SUPPORT}`) },
  { icon: 'logo-whatsapp' as const, label: 'WhatsApp Us', sub: CONTACT_PHONE_DISPLAY, color: '#25D366', action: () => Linking.openURL(WHATSAPP_LINK) },
  { icon: 'call' as const, label: 'Phone Support', sub: CONTACT_PHONE_DISPLAY, color: CultureTokens.teal, action: () => Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`) },
];

const HELP_HEAD_TITLE = `Help & FAQ · ${APP_NAME}`;
const HELP_HEAD_DESC =
  `Get answers about ${APP_AKA} — communities, tickets, perks, and how to reach support.`;
const HELP_HEAD_URL = `${SITE_ORIGIN}/settings/help`;

export default function SettingsHelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>{HELP_HEAD_TITLE}</title>
        <meta name="description" content={HELP_HEAD_DESC} />
        <meta property="og:title" content={HELP_HEAD_TITLE} />
        <meta property="og:description" content={HELP_HEAD_DESC} />
        <meta property="og:url" content={HELP_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={HELP_HEAD_URL} />
      </Head>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <M3TopAppBar
        title="Help"
        onBack={() => goBackOrReplace('/settings')}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: ScreenTokens.topOffset }}>
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
            {/* Hero Card */}
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)}>
                <GlassView
                    style={styles.heroPanel}
                    contentStyle={styles.heroContent}
                >
                    <LinearGradient
                        colors={[colors.primary + '15', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.heroIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="help-buoy" size={28} color={colors.primary} />
                    </View>
                    <View style={{ alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.heroTitle, { color: colors.text }]}>How can we help?</Text>
                        <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Find answers to common questions or reach out to our team.</Text>
                    </View>
                </GlassView>
            </Animated.View>

            {/* FAQ Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>FREQUENTLY ASKED QUESTIONS</Text>
                <View style={{ gap: 12 }}>
                    {FAQ_ITEMS.map((faq, i) => (
                        <GlassView key={i}>
                            <Pressable
                                style={({ pressed }) => [styles.faqHeader, pressed && { backgroundColor: colors.primarySoft }]}
                                onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setExpandedFaq(expandedFaq === i ? null : i); }}
                            >
                                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                                <Ionicons name={expandedFaq === i ? 'remove' : 'add'} size={20} color={colors.primary} />
                            </Pressable>
                            {expandedFaq === i && (
                                <View style={[styles.faqAnswerWrap, { borderTopColor: colors.borderLight }]}>
                                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
                                </View>
                            )}
                        </GlassView>
                    ))}
                </View>
            </View>

            {/* Contact Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CONTACT US</Text>
                <GlassView contentStyle={{ padding: 4 }}>
                    {CONTACT_OPTIONS.map((opt, i) => {
                        const resolvedColor = typeof opt.color === 'function' ? opt.color(colors) : opt.color;
                        return (
                            <View key={opt.label}>
                                <Pressable
                                    style={({ pressed }) => [styles.contactRow, pressed && { backgroundColor: colors.primarySoft }]}
                                    onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); opt.action(); }}
                                >
                                    <View style={[styles.contactIcon, { backgroundColor: resolvedColor + '12' }]}>
                                        <Ionicons name={opt.icon as any} size={20} color={resolvedColor} />
                                    </View>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Text style={[styles.contactLabel, { color: colors.text }]}>{opt.label}</Text>
                                        <Text style={[styles.contactSub, { color: colors.textTertiary }]}>{opt.sub}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                                </Pressable>
                                {i < CONTACT_OPTIONS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                            </View>
                        );
                    })}
                </GlassView>
            </View>

            {/* Guidelines Card */}
            <View style={styles.section}>
                <GlassView>
                    <Pressable
                        style={({ pressed }) => [styles.guidelinesRow, pressed && { backgroundColor: colors.primarySoft }]}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push('/(static)/legal/guidelines'); }}
                    >
                        <View style={[styles.contactIcon, { backgroundColor: CultureTokens.teal + '12' }]}>
                            <Ionicons name="book" size={20} color={CultureTokens.teal} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.contactLabel, { color: colors.text }]}>Community Guidelines</Text>
                        <Text style={[styles.contactSub, { color: colors.textTertiary }]}>Our standards for cultural safety and inclusion.</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
                    </Pressable>
                </GlassView>
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
  heroPanel: { marginBottom: 32 },
  heroContent: { padding: 32, alignItems: 'center', gap: 16 },
  heroIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, lineHeight: 26, fontFamily: FontFamily.bold, letterSpacing: 0 },
  heroSub: { fontSize: 15, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 20, opacity: 0.9 },

  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, gap: 16 },
  faqQuestion: { fontSize: 15, fontFamily: FontFamily.bold, flex: 1 },
  faqAnswerWrap: { padding: 18, paddingTop: 14, borderTopWidth: 1 },
  faqAnswer: { fontSize: 14, fontFamily: FontFamily.medium, lineHeight: 20 },

  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold },
  contactSub: { fontSize: 13, fontFamily: FontFamily.medium },
  divider: { height: 1, marginLeft: 76 },

  guidelinesRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
});
