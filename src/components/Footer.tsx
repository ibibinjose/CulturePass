import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { FOOTER_SECTIONS } from '@/lib/site-footer-links';

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
    <View style={styles.footer} accessibilityLabel="Footer navigation">
      {/* Main Footer Content */}
      <View style={styles.mainRow}>
        {/* Get2Know Section */}
        <View style={styles.brandCol}>
          <Text style={styles.brandName}>CulturePass</Text>
          
          {/* Get2Know Links */}
          {FOOTER_SECTIONS.get2Know.map((item) => (
            <Link 
              key={item.id} 
              href={item.href} 
              style={styles.footerLink} 
              accessibilityLabel={item.label}
            >
              <Text style={styles.footerLinkText}>{item.label}</Text>
            </Link>
          ))}
          
          {/* Ready to Explore Section */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready to Explore Your Culture?</Text>
            <Text style={styles.ackText}>
              We acknowledge the Traditional Custodians of Country throughout Australia and pay our respects to Elders past and present.
            </Text>
          </View>
        </View>

        {/* Legal & Support Section */}
        <View style={styles.linksCol}>
          <Text style={styles.colTitle}>Legal & Support</Text>
          {FOOTER_SECTIONS.legalSupport.map((item) => (
            <Link 
              key={item.id} 
              href={item.href} 
              style={styles.footerLink} 
              accessibilityLabel={item.label}
            >
              <Text style={styles.footerLinkText}>{item.label}</Text>
            </Link>
          ))}
        </View>

        {/* Connect Section */}
        <View style={styles.socialCol}>
          <Text style={styles.colTitle}>Connect</Text>
          <View style={styles.socialRow}>
            {FOOTER_SECTIONS.connect.map((social, index) => (
              <Pressable
                key={social.key}
                onPress={() => openSocialLink(social.url)}
                style={styles.socialIcon}
                accessibilityLabel={`Visit ${social.label} on ${social.key}`}
                accessibilityRole="link"
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
          © {new Date().getFullYear()} CulturePass Pty Ltd • Made in Sydney, Australia
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

  // Main content row - clean 3-column layout on desktop
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
  ctaSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  ctaTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 8,
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
    textDecorationLine: 'none', // Remove underline for cleaner look
  },
  footerLinkText: {
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
