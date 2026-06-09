import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles, Radius } from '@/design-system/tokens/theme';
import { StaticPageLayout } from '@/components/static/StaticPageLayout';
import { Footer } from '@/components/Footer';
import companyData from '@/data/static/company-info.json';
import { goBackOrReplace } from '@/lib/navigation';
import { FOOTER_LINKS } from '@/lib/site-footer-links';

// Define icons for legal links (for consistency)
const getLegalLinkIcon = (label: string): string => {
  switch(label.toLowerCase()) {
    case 'terms': return 'document-text-outline';
    case 'privacy': return 'shield-checkmark-outline';
    case 'cookies': return 'cafe-outline';
    case 'community': return 'people-outline';
    case 'guidelines': return 'bulb-outline';
    case 'event terms': return 'receipt-outline';
    default: return 'document-text-outline';
  }
};

export default function CompanyInfoScreen() {
  const colors = useColors();

  return (
    <>
    <StaticPageLayout
      title={companyData.title}
      intro={companyData.heroSub}
      heroIcon="business"
      heroColor={CultureTokens.indigo}
      sections={companyData.sections}
      onBack={() => goBackOrReplace('/menu')}
      footerContent={<Footer />}
    >
      <View style={styles.customContent}>
        {/* Facts from central JSON for app-wide consistency */}
        {companyData.facts && (
          <View style={[styles.factsStrip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.valuesHeading, { color: colors.textTertiary }]}>COMPANY AT A GLANCE</Text>
            <View style={styles.factsGrid}>
              {companyData.facts.map((f) => (
                <View key={f.label} style={styles.factItem}>
                  <Ionicons name={f.icon as any} size={18} color={f.color} />
                  <Text style={[styles.factLabelSmall, { color: colors.textSecondary }]}>{f.label}</Text>
                  <Text style={[styles.factValueSmall, { color: colors.text }]}>{f.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.valuesStrip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.valuesHeading, { color: colors.textTertiary }]}>OUR CORE VALUES</Text>
          <View style={styles.valuesGrid}>
            {companyData.values.map((v) => (
              <View key={v.title} style={styles.valueItem}>
                <View style={[styles.valueIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name={v.icon as any} size={20} color={CultureTokens.indigo} />
                </View>
                <Text style={[styles.valueTitle, { color: colors.text }]}>{v.title}</Text>
                {v.desc && <Text style={[styles.valueDescSmall, { color: colors.textSecondary }]}>{v.desc}</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Contact from central JSON */}
        {companyData.contact && (
          <View style={[styles.contactStrip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.valuesHeading, { color: colors.textTertiary }]}>GET IN TOUCH</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text }]}>{companyData.contact.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={18} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text }]}>{companyData.contact.phone}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={2}>{companyData.contact.address}</Text>
              </View>
            </View>
            <Link href={companyData.contact.support} asChild>
              <Pressable style={styles.contactCta}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>WhatsApp Support</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </Pressable>
            </Link>
          </View>
        )}

        {/* LEGAL & CORPORATE - horizontal layout */}
        <View style={styles.section}>
            <Text style={[styles.valuesHeading, { color: colors.textTertiary }]}>LEGAL & CORPORATE</Text>
            <View style={[styles.legalContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }]}>
                {FOOTER_LINKS.filter(link => 
                  ['Terms', 'Privacy', 'Cookies', 'Community', 'Guidelines', 'Event Terms'].includes(link.label)
                ).map((link) => (
                    <View key={link.id} style={{ flex: 1, minWidth: 140 }}>
                        <Link href={link.href} asChild>
                            <Pressable
                                style={({ pressed }) => [
                                  styles.legalRow, 
                                  pressed && { backgroundColor: colors.primarySoft },
                                  { 
                                    flex: 1,
                                    borderRadius: 8, 
                                    borderWidth: 1, 
                                    borderColor: colors.borderLight, 
                                    backgroundColor: colors.background,
                                    overflow: 'hidden'
                                  }
                                ]}
                            >
                                <View style={[styles.legalIcon, { backgroundColor: colors.primarySoft }]}>
                                    <Ionicons name={getLegalLinkIcon(link.label) as any} size={18} color={colors.primary} />
                                </View>
                                <Text style={[styles.legalText, { color: colors.text }]}>{link.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                            </Pressable>
                        </Link>
                    </View>
                ))}
            </View>
        </View>

        <View style={styles.finalCta}>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>Ready to join us?</Text>
          <Link href="/signup" asChild>
            <Pressable>
              <LinearGradient
                colors={gradients.culturepassBrand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaBtnText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          </Link>
        </View>
      </View>
    </StaticPageLayout>
    </>
  );
}

const styles = StyleSheet.create({
  customContent: {
    marginBottom: 40,
  },
  valuesStrip: {
    padding: 24,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 40,
  },
  valuesHeading: {
    ...TextStyles.caption,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  valueItem: {
    alignItems: 'center',
    width: 80,
  },
  valueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueTitle: {
    ...TextStyles.caption,
    fontWeight: '600',
  },
  finalCta: {
    alignItems: 'center',
    gap: 16,
  },
  ctaTitle: {
    ...TextStyles.headline,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.full,
    gap: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Facts strip for company at a glance (added for consistency)
  factsStrip: {
    padding: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 32,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  factItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  factLabelSmall: {
    ...TextStyles.caption,
    marginTop: 4,
    textAlign: 'center',
  },
  factValueSmall: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  valueDescSmall: {
    ...TextStyles.caption,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },

  // Contact strip
  contactStrip: {
    padding: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 32,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 20,
  },
  contactCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  // Legal list styles (ported for consistency and improved ui/ux)
  section: {
    marginBottom: 32,
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  legalIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
});
