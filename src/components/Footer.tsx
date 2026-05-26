import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, Spacing } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { FOOTER_LINKS, SOCIAL_LINKS } from '@/lib/site-footer-links';

export function Footer() {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  // Group links by section
  const get2knowLinks = FOOTER_LINKS.filter(link => 
    (link.href as string) === '/' ||
    link.href.startsWith('/about') || 
    link.href.startsWith('/company-info') || 
    link.href.startsWith('/founder') || 
    link.href.startsWith('/get2know') || 
    link.href.startsWith('/help')
  );

  const legalSupportLinks = FOOTER_LINKS.filter(link => 
    link.href.startsWith('/legal/') || 
    link.href.startsWith('/contact') || 
    link.href.startsWith('/support')
  );

  const connectLinks = SOCIAL_LINKS;

  const openSocialLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.footer}>
      {/* Get2Know Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More from CulturePass</Text>
        <Text style={styles.sectionSubtitle}>Your cultural journey continues here</Text>
        
        <View style={styles.linkGrid}>
          {get2knowLinks.map((link, index) => (
            <Link key={index} href={link.href} asChild>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkLabel}>{link.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      {/* Legal & Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Support</Text>
        <Text style={styles.sectionSubtitle}>Policies and help resources</Text>
        
        <View style={styles.linkGrid}>
          {legalSupportLinks.map((link, index) => (
            <Link key={index} href={link.href} asChild>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkLabel}>{link.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      {/* Connect Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connect</Text>
        <Text style={styles.sectionSubtitle}>Follow our communities</Text>
        
        <View style={styles.socialGrid}>
          {connectLinks.map((social, index) => (
            <Pressable 
              key={index} 
              style={styles.socialButton}
              onPress={() => openSocialLink(social.url)}
            >
              <Ionicons name={social.icon as any} size={20} color={colors.text} />
              <Text style={styles.socialLabel}>{social.label}</Text>
            </Pressable>
          ))}
        </View>
        
        <View style={styles.supportRow}>
          <Ionicons name="headset" size={16} color={colors.textSecondary} />
          <Text style={styles.supportText}>Support: airpal.me/CulturePassApp</Text>
        </View>
      </View>

      {/* Acknowledgment */}
      <View style={styles.acknowledgment}>
        <Text style={styles.acknowledgmentText}>
          CulturePass acknowledges the Traditional Custodians of Country throughout Australia. 
          We pay our respects to Elders past and present.
        </Text>
      </View>

      {/* Final CTA */}
      <LinearGradient colors={gradients.culturepassBrand} style={styles.ctaSection}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>Ready to Explore Your Culture?</Text>
          <Text style={styles.ctaSubtitle}>
            Create your profile, pick your cultures and start discovering events in minutes.
          </Text>
          <Link href="/signup" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Explore CulturePass</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </Pressable>
          </Link>
        </View>
      </LinearGradient>

      {/* Copyright */}
      <View style={styles.copyright}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} CulturePass Pty Ltd • Made in Sydney, Australia
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  footer: {
    backgroundColor: colors.background,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.md,
  },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  linkButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  linkLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  socialLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignSelf: 'flex-start',
  },
  supportText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  acknowledgment: {
    padding: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: Spacing.xl,
  },
  acknowledgmentText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  ctaSection: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  ctaContent: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 32,
  },
  ctaSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 500,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'white',
  },
  copyright: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});