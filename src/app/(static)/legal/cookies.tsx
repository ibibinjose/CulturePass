import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';
import { EMAIL_PRIVACY } from '@/lib/app-meta';

const COOKIE_TYPES = [
  { 
    name: 'Essential Cookies',   
    desc: 'Required for the app to function. They enable core features like secure login, session management, and payment processing. These cannot be disabled.',                                                           
    icon: 'lock-closed' as const, 
    color: CultureTokens.emerald, 
    required: true 
  },
  { 
    name: 'Analytics Cookies',   
    desc: 'Help us understand how users interact with CulturePass. We use anonymised analytics to improve the user experience, identify popular features, and fix issues.',                                                 
    icon: 'analytics' as const,   
    color: CultureTokens.indigo, 
    required: false 
  },
  { 
    name: 'Preference Cookies',  
    desc: 'Remember your settings such as language preference, selected location, theme, and notification preferences. These make your experience more personalised.',                                                      
    icon: 'options' as const,    
    color: CultureTokens.violet, 
    required: false 
  },
  { 
    name: 'Marketing Cookies',   
    desc: 'Used to deliver relevant event recommendations and sponsor offers based on your interests and browsing behaviour. You can opt out of these at any time.',                                                        
    icon: 'megaphone' as const,   
    color: CultureTokens.coral, 
    required: false 
  },
];

const SECTIONS = [
  { title: '1. What Are Cookies & Local Storage?', body: 'Cookies are small text files stored on your device when you use a website. CulturePass also uses local storage (AsyncStorage on mobile) to save your preferences and session data. On mobile devices, we use equivalent technologies to cookies for the same purposes.' },
  { title: '2. How We Use Data', body: 'We use cookies and local storage to:\n• Keep you signed in securely\n• Remember your location and community preferences\n• Store your onboarding progress\n• Save your event bookmarks and joined communities\n• Analyse app performance and usage patterns\n• Personalise event recommendations\n• Deliver relevant sponsor content and perks' },
  { title: '3. Third-Party Data Collection', body: 'Some of our partners may collect data through their own cookies when you interact with their content on CulturePass:\n• Payment processors (Stripe) for secure transactions\n• Analytics providers for usage insights\n• Event organisers for ticket delivery\n\nThese third parties have their own privacy policies governing their data collection.' },
  { title: '4. Managing Your Preferences', body: `You can manage your data preferences through:\n• In-app settings: Profile > Notifications to control marketing communications\n• Device settings: Clear app data or cache through your device settings\n• Browser settings: For web users, manage cookies through your browser preferences\n• Contact us: Email ${EMAIL_PRIVACY} to request data deletion` },
  { title: '5. Data Retention for Cookies', body: 'Essential cookies: Expire when your session ends or after 30 days of inactivity\nAnalytics data: Retained for 26 months in anonymised form\nPreference cookies: Stored until you clear them or delete your account\nMarketing cookies: Expire after 12 months or when you opt out' },
  { title: '6. Compliance', body: 'This Data & Cookie Policy complies with:\n• Australian Privacy Act 1988\n• EU/UK General Data Protection Regulation (GDPR)\n• Canadian PIPEDA\n• UAE Federal Decree Law No. 45 of 2021\n• New Zealand Privacy Act 2020\n\nWe regularly review and update our practices to ensure ongoing compliance.' },
  { title: '7. Updates to This Policy', body: 'We may update this policy as our services evolve. Material changes will be communicated via in-app notifications or email. The "Last updated" date at the top indicates when the policy was last revised.' },
  { title: '8. Contact', body: `For questions about our data practices:\n\nData Protection Officer\nCulturePass Pty Ltd\nEmail: ${EMAIL_PRIVACY}\nPhone: 1800-CULTURE (1800 285 887)\nAddress: Level 10, 100 Market Street, Sydney NSW 2000, Australia` },
];

export default function CookiesScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={styles.container}>
      <M3TopAppBar title="Data & Cookie Policy" onBack={() => goBackOrReplace('/menu')} denseWeb webChromeless />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(800)}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBackground, { paddingTop: topInset + 16 }]}
          >
            <View style={{ height: 8 }} />

            {/* Hero Content */}
            <View style={styles.heroContentWrapper}>
              <Animated.View entering={FadeInDown.delay(300).springify().damping(18)} style={styles.heroContent}>
                <View style={styles.badge}>
                  <Ionicons name="shield-checkmark" size={16} color={CultureTokens.gold} />
                  <Text style={styles.badgeText}>Privacy & Data</Text>
                </View>
                <Text style={styles.heroTitle}>Data & Cookie{'\n'}Policy</Text>
                <Text style={styles.heroSubtitle}>
                  How we use cookies and local storage to provide a secure and personalised experience.
                </Text>
                <Text style={styles.lastUpdated}>Last updated: 1 February 2026</Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.contentWrapper}>
          <View style={styles.webContainer}>
            
            <Animated.Text entering={FadeInDown.delay(400)} style={styles.sectionHeader}>
              Types of Data We Collect
            </Animated.Text>
            
            <View style={styles.cookieList}>
              {COOKIE_TYPES.map((ct, idx) => (
                <Animated.View 
                  key={idx} 
                  entering={FadeInDown.delay(500 + idx * 100).springify().damping(16)}
                >
                  <View style={styles.cookieCard}>
                    <View style={styles.cookieCardHeader}>
                      <View style={[styles.cookieIconWell, { backgroundColor: `${ct.color}15` }]}>
                        <Ionicons name={ct.icon} size={24} color={ct.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cookieName}>{ct.name}</Text>
                        {ct.required && (
                          <View style={[styles.requiredBadge, { backgroundColor: `${CultureTokens.coral}15` }]}>
                            <Text style={[styles.requiredBadgeText, { color: CultureTokens.coral }]}>Required</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.cookieDesc}>{ct.desc}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeInDown.delay(900)} style={styles.divider} />

            <View style={styles.textSectionsContainer}>
              {SECTIONS.map((sec, idx) => (
                <Animated.View 
                  key={sec.title} 
                  entering={FadeInDown.delay(1000 + idx * 80).springify().damping(18)}
                  style={styles.textSectionItem}
                >
                  <Text style={styles.textSectionTitle}>{sec.title}</Text>
                  <Text style={styles.textSectionBody}>{sec.body}</Text>
                </Animated.View>
              ))}
            </View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  heroBackground: {
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroContentWrapper: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    ...TextStyles.label,
    color: '#FFFFFF',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 42,
    lineHeight: 50,
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    ...TextStyles.body,
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 500,
    marginBottom: 16,
  },
  lastUpdated: {
    ...TextStyles.caption,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins_500Medium',
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  webContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  sectionHeader: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 24,
  },
  cookieList: {
    gap: 16,
  },
  cookieCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.04)" }
    })
  },
  cookieCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cookieIconWell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cookieName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  requiredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cookieDesc: {
    ...TextStyles.body,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 40,
  },
  textSectionsContainer: {
    gap: 32,
  },
  textSectionItem: {
    // spacer
  },
  textSectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  textSectionBody: {
    ...TextStyles.body,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 26,
  },
});
