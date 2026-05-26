import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Linking, TextInput,
} from 'react-native';
import helpData from '@/data/static/help.json';
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
  CONTACT_PHONE,
  WHATSAPP_LINK,
  getAppVersion,
} from '@/lib/app-meta';
import { M3TopAppBar } from '@/design-system/ui';

const isWeb = Platform.OS === 'web';

interface FaqItem { q: string; a: string; }
interface FaqCategory { id: string; label: string; icon: string; color: string; items: FaqItem[]; }

const FAQ_CATEGORIES = helpData.categories;
const CONTACT_OPTIONS = helpData.contactOptions.map(opt => ({
  ...opt,
  action: () => {
    if (opt.icon === 'mail') Linking.openURL(`mailto:${opt.sub}`);
    else if (opt.icon === 'call') Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`);
    else if (opt.icon === 'logo-whatsapp') Linking.openURL(WHATSAPP_LINK);
    else if (opt.icon === 'chatbubbles') Linking.openURL(`mailto:${EMAIL_SUPPORT}?subject=${encodeURIComponent('Live Chat Request')}&body=${encodeURIComponent(`Hi ${APP_NAME} team, I need help with…`)}`);
    else if (opt.icon === 'logo-twitter') Linking.openURL('https://twitter.com/CulturePassApp');
  }
}));

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
