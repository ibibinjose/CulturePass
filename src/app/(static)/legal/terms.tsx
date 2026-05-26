import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StaticPageLayout } from '@/components/static/StaticPageLayout';
import termsData from '@/data/static/terms.json';
import { useColors } from '@/hooks/useColors';
import { TextStyles, CultureTokens } from '@/design-system/tokens/theme';
import { EMAIL_LEGAL, CONTACT_ADDRESS, APP_NAME, APP_AKA } from '@/lib/app-meta';

export default function TermsScreen() {
  const colors = useColors();

  return (
    <StaticPageLayout
      title={termsData.title}
      lastUpdated={termsData.lastUpdated}
      intro={termsData.intro}
      sections={termsData.sections}
      heroIcon="document-text"
      heroColor={CultureTokens.indigo}
      footerContent={
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {APP_NAME} (AKA {APP_AKA}) · {CONTACT_ADDRESS}
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {EMAIL_LEGAL}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: 4 },
  footerText: { ...TextStyles.caption, textAlign: 'center' },
});
