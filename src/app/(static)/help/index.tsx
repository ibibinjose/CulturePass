import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Linking, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, LayoutRules, LiquidGlassTokens, CategoryColors, TextStyles } from '@/design-system/tokens/theme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useMemo } from 'react';
import { goBackOrReplace } from '@/lib/navigation';
import {
  APP_DOMAIN,
  APP_NAME,
  AVAILABILITY_MARKETS,
  EMAIL_BUGS,
  EMAIL_SUPPORT,
  PLATFORM_TAGLINE,
  MADE_IN,
  getAppVersion,
} from '@/lib/app-meta';
import { M3TopAppBar } from '@/design-system/ui';

const isWeb = Platform.OS === 'web';

interface FaqItem { q: string; a: string; }
interface FaqCategory { id: string; label: string; icon: string; color: string; items: FaqItem[]; }

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'start',
    label: 'Getting Started',
    icon: 'rocket-outline',
    color: CultureTokens.indigo,
    items: [
      { q: `What is ${APP_NAME}?`, a: `${APP_NAME} is a lifestyle and community platform for cultural diaspora communities across Australia, New Zealand, UAE, UK, and Canada. Use the app or ${APP_DOMAIN} to discover cultural events, join communities, access perks, and connect with people who share your heritage.` },
      { q: 'How do I create an account?', a: 'Tap "Create Account" on the welcome screen. Enter your email and a password (min 6 characters), then follow the steps to set your location and interests. You can also sign in with Google on web.' },
      { q: `Is ${APP_NAME} free to use?`, a: 'Yes! The Free tier gives you access to browse events, join communities, and use the basic features. Upgrade to Plus or Elite for exclusive perks, early ticket access, and premium benefits.' },
      { q: 'Which countries are supported?', a: `${APP_NAME} is currently live in Australia, New Zealand, UAE, United Kingdom, and Canada. We're expanding to more countries soon — follow our social channels for updates.` },
      { q: `Can I use ${APP_NAME} without an account?`, a: 'You can browse the app as a guest, but purchasing tickets, joining communities, saving events, and accessing perks all require a free account.' },
    ],
  },
  {
    id: 'account',
    label: 'Account & Profile',
    icon: 'person-circle-outline',
    color: CultureTokens.gold,
    items: [
      { q: 'How do I edit my profile?', a: 'Go to Settings → Edit Profile (or tap your avatar on the Profile tab). You can update your display name, bio, profile photo, city, social links, and interests.' },
      { q: 'How do I change my password?', a: 'Go to Settings → Privacy & Security → Change Password. You\'ll receive a reset link at your registered email address.' },
      { q: 'How do I change my location / city?', a: 'Go to Settings → Location & City. You can select a new country and city, and your discover feed will update to show local events.' },
      { q: 'How do I delete my account?', a: 'Go to Settings → Privacy & Security → scroll to the bottom → Delete Account. This action is permanent and removes all your data, tickets, and wallet balance.' },
      { q: 'Can I use Google to sign in?', a: 'Google sign-in is available on the web app. Native mobile Google sign-in is coming soon. For now, use email and password on iOS and Android.' },
      { q: `What is my ${APP_NAME} ID?`, a: `Your ${APP_NAME} ID (CP-XXXXX) is a unique identifier shown on your profile. Use it to share your profile, find friends, and check in at events via QR scan.` },
    ],
  },
  {
    id: 'events',
    label: 'Events & Tickets',
    icon: 'ticket-outline',
    color: CultureTokens.coral,
    items: [
      { q: 'How do I buy tickets?', a: 'Browse events on the Discover or CultureX tab. Tap an event → select your ticket tier → choose your payment method (Wallet or saved card) → confirm. Your ticket QR code will appear in My Tickets.' },
      { q: 'Where do I find my tickets?', a: 'Go to Settings → My Tickets, or tap the Tickets section on your Profile tab. Tickets show your QR code for event check-in.' },
      { q: 'Can I get a refund?', a: `If an event is cancelled by the organiser, you receive a full refund to your ${APP_NAME} Wallet within 3–5 business days. For self-cancellations, the refund policy varies per event and is shown at checkout.` },
      { q: 'How does QR check-in work?', a: 'Each ticket has a unique QR code. At the event venue, show your QR code to the organiser or scan it yourself at a self-service terminal. Tickets are validated instantly.' },
      { q: 'Can I transfer tickets to a friend?', a: 'Ticket transfers are coming soon. Currently, you can share the QR code, but the ticket remains linked to your account.' },
    ],
  },
  {
    id: 'membership',
    label: 'Membership & Perks',
    icon: 'star-outline',
    color: CultureTokens.gold,
    items: [
      { q: 'What membership tiers are available?', a: `${APP_NAME} offers Free, Plus (~$4.99/mo), and Elite (~$9.99/mo) tiers. Higher tiers unlock early ticket access, exclusive perks, VIP upgrades, and cashback on purchases.` },
      { q: 'How do I upgrade my membership?', a: 'Go to Settings → My Membership → tap Upgrade. Choose your plan and complete payment. Your benefits activate immediately.' },
      { q: 'How do I cancel my membership?', a: 'Go to Settings → My Membership → Cancel Subscription. Your benefits continue until the end of the current billing period.' },
      { q: 'What are Perks?', a: `Perks are exclusive discounts, free tickets, early access, and VIP upgrades from ${APP_NAME} and partner brands. Visit the Perks tab to browse and redeem available offers for your tier.` },
      { q: 'How does the Wallet work?', a: 'Your Wallet is a digital balance you can top up with any payment method. Use it to buy tickets fast with no extra steps. Cashback from eligible purchases is added to your Wallet automatically.' },
      { q: 'Do perks expire?', a: 'Yes — each perk has an expiry date shown on the perk card. Redeem before the expiry date. Expired perks are removed from your account automatically.' },
    ],
  },
  {
    id: 'technical',
    label: 'Technical Issues',
    icon: 'build-outline',
    color: CultureTokens.teal,
    items: [
      { q: 'The app is showing a white / blank screen', a: 'Try force-closing the app and reopening. On web, try clearing your browser cache (Ctrl+Shift+R / Cmd+Shift+R). If the issue persists, try logging out and back in.' },
      { q: 'I can\'t sign in — what should I do?', a: `Check you're using the correct email and password. Try "Forgot Password" to reset. Make sure you have a stable internet connection. If issues continue, email ${EMAIL_SUPPORT}.` },
      { q: 'My payment failed', a: 'Check your card details and that your card has sufficient funds. Some cards require 3D Secure verification — check for an SMS or bank app prompt. Try a different payment method or contact your bank.' },
      { q: 'Notifications are not working', a: `Go to Settings → Notifications to check your preferences. On iOS/Android, also check your device notification permissions for ${APP_NAME} in your phone's Settings app.` },
      { q: 'The app is slow or crashing', a: 'Ensure you have the latest version of the app. Try restarting your device. If issues persist, please report via "Report a Problem" with details of what you were doing.' },
      { q: 'I found a bug — how do I report it?', a: `Use the "Report a Problem" option in Settings → Help & Support, or email ${EMAIL_BUGS} with a description, your device model, OS version, and screenshots if possible.` },
    ],
  },
];

const CONTACT_OPTIONS = [
  { icon: 'mail', label: 'Email Support', sub: EMAIL_SUPPORT, color: CultureTokens.indigo, action: () => Linking.openURL(`mailto:${EMAIL_SUPPORT}`) },
  { icon: 'call', label: 'Phone Support', sub: '1800 285 887 (Mon–Fri 9am–6pm AEST)', color: CultureTokens.success, action: () => Linking.openURL('tel:1800285887') },
  { icon: 'chatbubbles', label: 'Live Chat', sub: 'Available 9am–6pm AEST on weekdays', color: CultureTokens.teal, action: () => Linking.openURL(`mailto:${EMAIL_SUPPORT}?subject=${encodeURIComponent('Live Chat Request')}&body=${encodeURIComponent(`Hi ${APP_NAME} team, I need help with…`)}`) },
  { icon: 'logo-twitter', label: 'Twitter / X', sub: '@CulturePassApp', color: CategoryColors.movies, action: () => Linking.openURL('https://twitter.com/CulturePassApp') },
];

const QUICK_LINKS = [
  { icon: 'ticket-outline', label: 'My Tickets', route: '/tickets', color: CultureTokens.coral },
  { icon: 'wallet-outline', label: 'Wallet', route: '/payment/wallet', color: CultureTokens.success },
  { icon: 'star-outline', label: 'Membership', route: '/membership/upgrade', color: CultureTokens.gold },
  { icon: 'shield-checkmark-outline', label: 'Privacy', route: '/legal/privacy', color: CultureTokens.teal },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const appVersion = getAppVersion();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) {
      return activeCategory
        ? FAQ_CATEGORIES.filter(c => c.id === activeCategory)
        : FAQ_CATEGORIES;
    }
    const q = search.toLowerCase();
    return FAQ_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(
        item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.items.length > 0);
  }, [search, activeCategory]);

  const totalResults = filteredCategories.reduce((n, c) => n + c.items.length, 0);

  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={helpAmbient.mesh}
        pointerEvents="none"
      />
      <M3TopAppBar title="Help & Support" onBack={() => goBackOrReplace('/(tabs)/my-space')} denseWeb webChromeless />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + (isWeb ? 34 : insets.bottom), paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.success, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy" size={40} color={colors.textInverse} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>
            Find answers to common questions or reach out to our support team.
          </Text>
        </LinearGradient>

        {/* Search */}
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.borderLight,
              borderRadius: LiquidGlassTokens.corner.valueRibbon,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search help articles…"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Quick Links */}
        {!search && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            <View style={styles.quickRow}>
              {QUICK_LINKS.map(ql => (
                <Pressable
                  key={ql.label}
                  style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: ql.route });
                  }}
                >
                  <View style={[styles.quickIcon, { backgroundColor: ql.color + '15' }]}>
                    <Ionicons name={ql.icon as keyof typeof Ionicons.glyphMap} size={22} color={ql.color} />
                  </View>
                  <Text style={styles.quickLabel}>{ql.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Category Filter Pills */}
        {!search && (
          <View>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              <Pressable
                style={[styles.pill, activeCategory === null && styles.pillActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCategory(null); }}
              >
                <Text style={[styles.pillText, activeCategory === null && styles.pillTextActive]}>All Topics</Text>
              </Pressable>
              {FAQ_CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[styles.pill, activeCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory(activeCategory === cat.id ? null : cat.id);
                  }}
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={activeCategory === cat.id ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={[styles.pillText, activeCategory === cat.id && styles.pillTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* FAQ Sections */}
        {search.trim() && totalResults === 0 ? (
          <View style={styles.emptySearch}>
            <Ionicons name="search" size={44} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No results for &ldquo;{search}&rdquo;</Text>
            <Text style={styles.emptySub}>Try different keywords or browse the categories above.</Text>
          </View>
        ) : (
          filteredCategories.map((cat, ci) => (
            <View key={cat.id} style={styles.section}>
              <View style={styles.catHeader}>
                <View style={[styles.catIcon, { backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={18} color={cat.color} />
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{cat.label}</Text>
                <Text style={styles.catCount}>{cat.items.length}</Text>
              </View>
              {cat.items.map((faq, fi) => {
                const key = `${cat.id}-${fi}`;
                const isOpen = expandedFaq === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.faqCard, isOpen && { borderColor: cat.color + '40', backgroundColor: cat.color + '10' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpandedFaq(isOpen ? null : key);
                    }}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq.q}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={isOpen ? cat.color : colors.textSecondary}
                      />
                    </View>
                    {isOpen && (
                      <Text style={styles.faqAnswer}>{faq.a}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))
        )}

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactCard}>
            {CONTACT_OPTIONS.map((opt, i) => (
              <View key={opt.label}>
                <Pressable
                  style={({ pressed }) => [styles.contactItem, pressed && { backgroundColor: colors.surfaceElevated }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); opt.action(); }}
                >
                  <View style={[styles.contactIcon, { backgroundColor: opt.color + '15' }]}>
                    <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={20} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>{opt.label}</Text>
                    <Text style={styles.contactSub}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
                {i < CONTACT_OPTIONS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.contactCard}>
            {[
              { label: 'Privacy Policy', icon: 'shield-checkmark-outline', color: CultureTokens.teal, route: '/legal/privacy' },
              { label: 'Terms of Service', icon: 'document-text-outline', color: CultureTokens.gold, route: '/legal/terms' },
              { label: 'Cookie Policy', icon: 'finger-print-outline', color: CultureTokens.coral, route: '/legal/cookies' },
              { label: 'Community Guidelines', icon: 'people-circle-outline', color: CultureTokens.success, route: '/legal/guidelines' },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.contactItem, pressed && { backgroundColor: colors.surfaceElevated }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: item.route }); }}
                >
                  <View style={[styles.contactIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.contactLabel, { flex: 1 }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutLogo}>
            <Ionicons name="globe" size={32} color={CultureTokens.indigo} />
          </View>
          <Text style={styles.aboutName}>{APP_DOMAIN}</Text>
          <Text style={styles.aboutVersion}>{`Version ${appVersion} · ${MADE_IN}`}</Text>
          <Text style={styles.aboutTagline}>{PLATFORM_TAGLINE}</Text>
          <Text style={styles.aboutCountries}>{AVAILABILITY_MARKETS}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const helpAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },

  // Hero
  heroCard: {
    marginHorizontal: LayoutRules.screenHorizontalPadding,
    marginBottom: LayoutRules.betweenCards + 4,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(44,42,114,0.2)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  heroTitle: { ...TextStyles.title, marginBottom: 8, color: colors.textInverse },
  heroSub: {
    ...TextStyles.callout, color: 'rgba(255,255,255,0.92)',
    textAlign: 'center', lineHeight: 24, paddingHorizontal: 12,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: LayoutRules.screenHorizontalPadding,
    marginBottom: LayoutRules.betweenCards + 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
  },
  searchInput: {
    ...TextStyles.callout, flex: 1, color: colors.text,
  },

  // Quick links
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1, alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 16,
    paddingVertical: 16, borderWidth: 1, borderColor: colors.borderLight,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { ...TextStyles.chip, color: colors.text, textAlign: 'center' },

  // Category pills
  pillsRow: { paddingHorizontal: LayoutRules.screenHorizontalPadding, paddingBottom: 12, gap: 10, flexDirection: 'row', marginBottom: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, backgroundColor: colors.backgroundSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  pillActive: { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo },
  pillText: { ...TextStyles.chip, color: colors.textSecondary },
  pillTextActive: { color: colors.textInverse },

  // Section
  section: { paddingHorizontal: LayoutRules.screenHorizontalPadding, marginBottom: 28 },
  sectionTitle: { ...TextStyles.title3, fontSize: 18, color: colors.text, marginBottom: 14 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catCount: {
    ...TextStyles.chip,
    marginLeft: 'auto',
    color: colors.textTertiary,
  },

  // FAQ
  faqCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 16,
  },
  faqQuestion: {
    ...TextStyles.callout, fontFamily: 'Poppins_600SemiBold',
    color: colors.text, flex: 1, lineHeight: 22,
  },
  faqAnswer: {
    ...TextStyles.cardBody,
    color: colors.textSecondary, marginTop: 12, lineHeight: 24,
  },

  // Empty search
  emptySearch: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 40 },
  emptyTitle: {
    ...TextStyles.title3, fontSize: 18,
    color: colors.text, marginTop: 16, marginBottom: 8, textAlign: 'center',
  },
  emptySub: {
    ...TextStyles.cardBody,
    color: colors.textTertiary, textAlign: 'center', lineHeight: 22,
  },

  // Contact
  contactCard: {
    backgroundColor: colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden',
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { ...TextStyles.headline, color: colors.text },
  contactSub: {
    ...TextStyles.chip,
    color: colors.textSecondary, marginTop: 2,
  },
  divider: { height: 1, backgroundColor: colors.backgroundSecondary, marginLeft: 74 },

  // About
  aboutSection: {
    alignItems: 'center', paddingHorizontal: 40,
    paddingVertical: 24, paddingBottom: 60,
  },
  aboutLogo: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: CultureTokens.indigo + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  aboutName: { ...TextStyles.title2, fontSize: 22, color: colors.text },
  aboutVersion: {
    ...TextStyles.chip,
    color: colors.textTertiary, marginBottom: 12,
  },
  aboutTagline: {
    ...TextStyles.cardBody, lineHeight: 22,
    color: colors.textSecondary, textAlign: 'center', marginBottom: 6,
  },
  aboutCountries: {
    ...TextStyles.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
