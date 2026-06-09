import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { StaticPageLayout } from '@/components/static/StaticPageLayout';
import privacyData from '@/data/static/privacy.json';
import { useColors } from '@/hooks/useColors';
import { TextStyles, CultureTokens } from '@/design-system/tokens/theme';
import { APP_NAME, APP_AKA, EMAIL_PRIVACY, MADE_IN, CONTACT_ADDRESS } from '@/lib/app-meta';
import { FOOTER_LINKS } from '@/lib/site-footer-links';

export default function PrivacyScreen() {
  const colors = useColors();

  return (
    <StaticPageLayout
      title={privacyData.title}
      lastUpdated={privacyData.lastUpdated}
      intro={privacyData.intro}
      sections={privacyData.sections}
      heroIcon="shield-checkmark"
      heroColor={CultureTokens.success}
      badges={privacyData.badges}
      footerContent={
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.id} href={link.href} asChild>
                <Pressable>
                  <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>{link.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {APP_NAME} (AKA {APP_AKA}) · {CONTACT_ADDRESS}
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {EMAIL_PRIVACY}
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {`${APP_NAME} · ${MADE_IN}`}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: 4 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 8, marginBottom: 8 },
  footerLinkText: { ...TextStyles.caption, fontFamily: 'Poppins_500Medium' },
  footerText: { ...TextStyles.caption, textAlign: 'center' },
});
