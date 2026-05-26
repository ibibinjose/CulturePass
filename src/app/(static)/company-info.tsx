import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles, Radius, Spacing } from '@/design-system/tokens/theme';
import { StaticPageLayout } from '@/components/static/StaticPageLayout';
import companyData from '@/data/static/company-info.json';
import { goBackOrReplace } from '@/lib/navigation';

export default function CompanyInfoScreen() {
  const colors = useColors();

  return (
    <StaticPageLayout
      title={companyData.title}
      intro={companyData.heroSub}
      heroIcon="business"
      heroColor={CultureTokens.indigo}
      sections={companyData.sections}
      onBack={() => goBackOrReplace('/menu')}
    >
      <View style={styles.customContent}>
        <View style={[styles.valuesStrip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.valuesHeading, { color: colors.textTertiary }]}>OUR CORE VALUES</Text>
          <View style={styles.valuesGrid}>
            {companyData.values.map((v) => (
              <View key={v.title} style={styles.valueItem}>
                <View style={[styles.valueIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name={v.icon as any} size={20} color={CultureTokens.indigo} />
                </View>
                <Text style={[styles.valueTitle, { color: colors.text }]}>{v.title}</Text>
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
});
