import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { CultureTokens, gradients } from "@/design-system/tokens/theme";
import { LinearGradient } from "expo-linear-gradient";
import { MADE_IN_WITH_COUNTRY, APP_NAME, APP_AKA, APP_FULL_BRANDING } from "@/lib/app-meta";
import { openExternalUrl } from "@/lib/openExternalUrl";

// Legal and help links for the footer
const LEGAL_LINKS = [
  { label: "Our Story", href: "/founder", icon: "book-outline" },
  { label: "About", href: "/about", icon: "information-circle-outline" },
  { label: "Company Info", href: "/company-info", icon: "business-outline" },
  { label: "Terms", href: "/legal/terms", icon: "document-text-outline" },
  { label: "Privacy", href: "/legal/privacy", icon: "shield-checkmark-outline" },
  { label: "Community", href: "/legal/community", icon: "people-outline" },
  { label: "Guidelines", href: "/legal/guidelines", icon: "bulb-outline" },
  { label: "Event Terms", href: "/legal/event-terms", icon: "receipt-outline" },
  { label: "Cookies", href: "/legal/cookies", icon: "cafe-outline" },
  { label: "Contact", href: "/contact", icon: "mail-outline" },
  { label: "Help", href: "/help", icon: "help-circle-outline" },
] as const;

// Social media links for the footer
const SOCIAL_LINKS = [
  { label: "Instagram", handle: "@culturepassapp", icon: "logo-instagram", url: "https://instagram.com/culturepassapp" },
  { label: "Instagram India", handle: "@cultureindiaapp", icon: "logo-instagram", url: "https://instagram.com/cultureindiaapp" },
  { label: "Facebook", handle: "CulturePass.App", icon: "logo-facebook", url: "https://facebook.com/CulturePass.App" },
  { label: "X", handle: "@CulturePassApp", icon: "logo-twitter", url: "https://x.com/CulturePassApp" },
  { label: "TikTok", handle: "@culturepassapp", icon: "logo-tiktok", url: "https://tiktok.com/@culturepassapp" },
  { label: "YouTube", handle: "@culturepassapp", icon: "logo-youtube", url: "https://youtube.com/@culturepassapp" },
  { label: "LinkedIn", handle: "CulturePass", icon: "logo-linkedin", url: "https://linkedin.com/company/culturepassapp" },
  { label: "Support", handle: "airpal.me/CulturePassApp", icon: "heart-outline", url: "https://airpal.me/CulturePassApp" },
] as const;

// Get2Know section links
const GET2KNOW_LINKS = [
  { label: "About", href: "/about", icon: "information-circle-outline" },
  { label: "Our Story", href: "/founder", icon: "book-outline" },
  { label: "Company Info", href: "/company-info", icon: "business-outline" },
  { label: "Terms", href: "/legal/terms", icon: "document-text-outline" },
  { label: "Privacy", href: "/legal/privacy", icon: "shield-checkmark-outline" },
  { label: "Community", href: "/legal/community", icon: "people-outline" },
  { label: "Cookies", href: "/legal/cookies", icon: "cafe-outline" },
  { label: "Contact", href: "/contact", icon: "mail-outline" },
] as const;

// Footer navigation sections
const FOOTER_SECTIONS = [
  { title: "Get2Know", links: GET2KNOW_LINKS },
  { title: "Legal & Support", links: LEGAL_LINKS },
  { title: "Connect", links: SOCIAL_LINKS },
] as const;

export const Footer = memo(function Footer() {
  const colors = useColors();
  const styles = getStyles(colors);

  const FooterLink = ({ icon, label, sublabel, onPress, href, highlight, isExternal = false }: any) => {
    const btn = (
      <Pressable
        onPress={onPress}
        style={({ pressed, hovered }: any) => [
          styles.linkItem,
          { backgroundColor: colors.background, borderColor: highlight ? CultureTokens.gold : colors.borderLight },
          highlight && { backgroundColor: CultureTokens.gold + "08" },
          (pressed || hovered) && styles.linkItemActive,
        ]}
        accessibilityRole="link"
      >
        <View style={[styles.linkIconWrap, highlight && { backgroundColor: CultureTokens.gold + "15" }]}>
          <Ionicons name={icon} size={16} color={highlight ? CultureTokens.gold : colors.textSecondary} />
        </View>
        <View style={styles.linkTextWrap}>
          <Text style={[styles.linkLabel, highlight && { color: CultureTokens.gold }]} numberOfLines={1}>{label}</Text>
          {sublabel && <Text style={styles.linkSub} numberOfLines={1}>{sublabel}</Text>}
        </View>
        {isExternal ? (
          <Ionicons name="open-outline" size={14} color={colors.textTertiary} style={{ opacity: 0.6 }} />
        ) : (
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} style={{ opacity: 0.6 }} />
        )}
      </Pressable>
    );
    
    if (href) {
      return <Link href={href} asChild>{btn}</Link>;
    } else if (onPress) {
      return btn;
    }
    return btn;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient 
        colors={[CultureTokens.indigo, CultureTokens.teal, CultureTokens.gold]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }} 
        style={styles.accentBar} 
      />
      
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>More from CulturePass</Text>
          <Text style={styles.mainSub}>Legal, support, and community links</Text>
        </View>

        {/* Footer Sections */}
        <View style={styles.sectionsContainer}>
          {FOOTER_SECTIONS.map((section, sectionIndex) => (
            <View 
              key={section.title} 
              style={[
                styles.sectionCard, 
                { backgroundColor: colors.background, borderColor: colors.borderLight }
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={[
                  styles.sectionIconBadge, 
                  { 
                    backgroundColor: 
                      section.title === "Get2Know" ? CultureTokens.indigo + "12" :
                      section.title === "Legal & Support" ? CultureTokens.violet + "12" :
                      CultureTokens.teal + "12" 
                  }
                ]}>
                  <Ionicons 
                    name={
                      section.title === "Get2Know" ? "information-circle" :
                      section.title === "Legal & Support" ? "shield-checkmark" :
                      "people"
                    } 
                    size={18} 
                    color={
                      section.title === "Get2Know" ? CultureTokens.indigo :
                      section.title === "Legal & Support" ? CultureTokens.violet :
                      CultureTokens.teal
                    } 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionSub}>
                    {section.title === "Get2Know" ? "About us and company info" :
                     section.title === "Legal & Support" ? "Policies and help" :
                     "Follow our communities"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.linksGrid}>
                {section.links.map((link, linkIndex) => (
                  <View key={`${section.title}-${link.label}`} style={styles.linkItemWrapper}>
                    {link.url ? (
                      <FooterLink 
                        icon={link.icon} 
                        label={link.label} 
                        sublabel={link.handle}
                        onPress={() => openExternalUrl(link.url)}
                        highlight={link.label === "Support"}
                        isExternal={true}
                      />
                    ) : (
                      <FooterLink 
                        icon={link.icon} 
                        label={link.label} 
                        href={link.href}
                        highlight={link.label === "Support"}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Final CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Explore Your Culture?</Text>
          <Text style={styles.ctaSub}>Create your profile, pick your cultures and start discovering events in minutes.</Text>
          
          <Link href="/signup" asChild>
            <Pressable style={styles.exploreButton}>
              <LinearGradient 
                colors={[CultureTokens.indigo, CultureTokens.gold]} 
                style={StyleSheet.absoluteFillObject} 
              />
              <Text style={styles.exploreButtonText}>Explore CulturePass</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </Pressable>
          </Link>
        </View>

        {/* Footer Bottom */}
        <View style={styles.footerBottom}>
          <View style={styles.footerDivider} />
          
          <Text style={styles.acknowledgment}>
            {APP_NAME} acknowledges the Traditional Custodians of Country throughout Australia. We pay our respects to Elders past and present.
          </Text>
          
          <View style={styles.footerMeta}>
            <View style={styles.brand}>
              <View style={styles.footerLogoWrap}>
                <LinearGradient
                  colors={gradients.culturepassBrand}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.footerLogoInner}>
                  <Image
                    source={require("@/assets/images/culturepass-logo.png")}
                    style={{ width: 18, height: 18 }}
                    contentFit="contain"
                  />
                </View>
              </View>
              <Text style={styles.brandText}>{APP_NAME}</Text>
              <Text style={[styles.brandText, { fontSize: 12, opacity: 0.6, fontWeight: "400" }]}>AKA {APP_AKA}</Text>
            </View>
            <Text style={styles.copyright}>© {new Date().getFullYear()} {APP_FULL_BRANDING} • {MADE_IN_WITH_COUNTRY}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const getStyles = (c: any) => StyleSheet.create({
  container: { 
    marginTop: 40,
    paddingTop: 40,
    borderTopWidth: 1,
    borderColor: c.borderLight
  },
  accentBar: { height: 3, width: "100%" },
  content: { 
    paddingHorizontal: 20, 
    paddingTop: 28, 
    paddingBottom: 24, 
    maxWidth: 1200, 
    alignSelf: "center", 
    width: "100%" 
  },
  headerSection: { 
    marginBottom: 30, 
    alignItems: "center" 
  },
  mainTitle: { 
    fontSize: 20, 
    fontFamily: "Poppins_700Bold", 
    color: c.text, 
    textAlign: "center",
    marginBottom: 8
  },
  mainSub: { 
    fontSize: 14, 
    fontFamily: "Poppins_400Regular", 
    color: c.textSecondary, 
    textAlign: "center" 
  },
  sectionsContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 20, 
    justifyContent: "center", 
    marginBottom: 40
  },
  sectionCard: { 
    flex: 1, 
    minWidth: 300, 
    maxWidth: 380, 
    borderRadius: 20, 
    borderWidth: 1, 
    padding: 20, 
    ...Platform.select({ 
      ios: { 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8 
      }, 
      android: { elevation: 2 } 
    }) 
  },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginBottom: 12 
  },
  sectionIconBadge: { 
    width: 38, 
    height: 38, 
    borderRadius: 11, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontFamily: "Poppins_700Bold", 
    color: c.text 
  },
  sectionSub: { 
    fontSize: 12, 
    fontFamily: "Poppins_400Regular", 
    color: c.textSecondary, 
    marginTop: 1 
  },
  divider: { 
    height: 1, 
    backgroundColor: c.borderLight, 
    marginBottom: 16, 
    opacity: 0.7 
  },
  linksGrid: { 
    flexDirection: "column", 
    gap: 8 
  },
  linkItemWrapper: { 
    width: "100%" 
  },
  linkItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    minHeight: 50 
  },
  linkItemActive: { 
    transform: [{ scale: 0.98 }], 
    opacity: 0.85 
  },
  linkIconWrap: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: c.surface, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  linkTextWrap: { 
    flex: 1, 
    gap: 2 
  },
  linkLabel: { 
    fontSize: 14, 
    fontFamily: "Poppins_600SemiBold", 
    color: c.text, 
    lineHeight: 18 
  },
  linkSub: { 
    fontSize: 11, 
    fontFamily: "Poppins_400Regular", 
    color: c.textSecondary, 
    lineHeight: 14 
  },
  
  // CTA Section
  ctaSection: { 
    alignItems: "center", 
    paddingVertical: 40, 
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
    marginBottom: 30
  },
  ctaTitle: { 
    fontSize: 24, 
    fontFamily: "Poppins_700Bold", 
    color: c.text, 
    textAlign: "center", 
    marginBottom: 8,
    lineHeight: 30
  },
  ctaSub: { 
    fontSize: 15, 
    color: c.textSecondary, 
    textAlign: "center", 
    maxWidth: 500, 
    lineHeight: 22,
    marginBottom: 20
  },
  exploreButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    borderRadius: 999, 
    overflow: "hidden",
    minWidth: 220,
    justifyContent: "center"
  },
  exploreButtonText: { 
    color: "white", 
    fontSize: 16, 
    fontFamily: "Poppins_600SemiBold" 
  },
  
  // Footer Bottom
  footerBottom: { 
    alignItems: "center", 
    gap: 16 
  },
  footerDivider: { 
    width: 60, 
    height: 2, 
    backgroundColor: c.borderLight, 
    borderRadius: 1, 
    opacity: 0.5 
  },
  acknowledgment: { 
    fontSize: 13, 
    color: c.textSecondary, 
    textAlign: "center", 
    maxWidth: 600, 
    lineHeight: 18, 
    fontFamily: "Poppins_400Regular" 
  },
  footerMeta: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16, 
    flexWrap: "wrap", 
    justifyContent: "center" 
  },
  brand: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  footerLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  footerLogoInner: {
    margin: 1.2,
    flex: 1,
    borderRadius: 7,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { 
    fontSize: 14, 
    fontFamily: "Poppins_700Bold", 
    color: c.text 
  },
  copyright: { 
    fontSize: 12, 
    color: c.textTertiary, 
    fontFamily: "Poppins_400Regular",
    textAlign: "center"
  },
});