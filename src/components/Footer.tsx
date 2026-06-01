import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/design-system/tokens/theme';
import { SOCIAL_LINKS } from '@/lib/site-footer-links';

export function Footer() {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const openSocialLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.footer}>
      {/* Main Footer Content */}
      <View style={styles.mainRow}>
        {/* Brand + Acknowledgment */}
        <View style={styles.brandCol}>
          <Text style={styles.brandName}>CulturePass</Text>
          <Text style={styles.ackText}>
            We acknowledge the Traditional Custodians of Country throughout Australia and pay our respects to Elders past and present.
          </Text>
        </View>

        {/* Navigation Links */}
        <View style={styles.linksCol}>
          <Text style={styles.colTitle}>Explore</Text>
          <Link href="/about" style={styles.footerLink}>About</Link>
          <Link href="/founder" style={styles.footerLink}>Our Story</Link>
          <Link href="/help" style={styles.footerLink}>Help Centre</Link>
          <Link href="/contact" style={styles.footerLink}>Contact</Link>
        </View>

        <View style={styles.linksCol}>
          <Text style={styles.colTitle}>Legal</Text>
          <Link href="/legal/terms" style={styles.footerLink}>Terms</Link>
          <Link href="/legal/privacy" style={styles.footerLink}>Privacy</Link>
          <Link href="/legal/community" style={styles.footerLink}>Community Guidelines</Link>
          <Link href="/legal/cookies" style={styles.footerLink}>Cookies</Link>
        </View>

        {/* Social */}
        <View style={styles.socialCol}>
          <Text style={styles.colTitle}>Connect</Text>
          <View style={styles.socialRow}>
            {SOCIAL_LINKS.slice(0, 5).map((social, index) => (
              <Pressable
                key={index}
                onPress={() => openSocialLink(social.url)}
                style={styles.socialIcon}
              >
                <Ionicons name={social.icon as any} size={18} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
          <Text style={styles.supportText}>Support: airpal.me/CulturePassApp</Text>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} CulturePass.App — Made in Sydney, Australia
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  footer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },

  // Main content row - clean 4-column layout on desktop
  mainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 48,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },

  brandCol: {
    flex: 1,
    minWidth: 220,
    maxWidth: 280,
  },
  brandName: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  ackText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textTertiary,
    lineHeight: 17,
  },

  linksCol: {
    minWidth: 110,
  },
  colTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },

  socialCol: {
    minWidth: 160,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textTertiary,
  },

  // Bottom copyright bar
  bottomBar: {
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textTertiary,
    textAlign: 'center',
  },
});