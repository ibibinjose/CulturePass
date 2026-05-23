import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { CultureTokens } from "@/design-system/tokens/theme";
import { LinearGradient } from "expo-linear-gradient";
import { MADE_IN_WITH_COUNTRY } from "@/lib/app-meta";
import { openExternalUrl } from "@/lib/openExternalUrl";

const LEGAL_LINKS = [
  { label: "Our Story", href: "/founder", icon: "book-outline" },
  { label: "About", href: "/about", icon: "information-circle-outline" },
  { label: "Terms", href: "/legal/terms", icon: "document-text-outline" },
  { label: "Privacy", href: "/legal/privacy", icon: "shield-checkmark-outline" },
  { label: "Community", href: "/legal/community", icon: "people-outline" },
  { label: "Cookies", href: "/legal/cookies", icon: "cafe-outline" },
  { label: "Contact", href: "/contact", icon: "mail-outline" },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", handle: "@culturepassapp", icon: "logo-instagram", url: "https://instagram.com/culturepassapp" },
  { label: "Instagram India", handle: "@cultureindiaapp", icon: "logo-instagram", url: "https://instagram.com/cultureindiaapp" },
  { label: "Facebook", handle: "CulturePass.App", icon: "logo-facebook", url: "https://facebook.com/CulturePass.App" },
  { label: "X", handle: "@CulturePAssApp", icon: "logo-twitter", url: "https://x.com/CulturePAssApp" },
  { label: "TikTok", handle: "@culturepassapp", icon: "logo-tiktok", url: "https://tiktok.com/@culturepassapp" },
  { label: "YouTube", handle: "@culturepassapp", icon: "logo-youtube", url: "https://youtube.com/@culturepassapp" },
  { label: "LinkedIn", handle: "CulturePass", icon: "logo-linkedin", url: "https://linkedin.com/company/culturepassapp" },
  { label: "Support", handle: "airpal.me/CulturePassApp", icon: "heart-outline", url: "https://airpal.me/CulturePassApp" },
] as const;

export const AboutLegalStrip = memo(function AboutLegalStrip() {
  const colors = useColors();
  const styles = getStyles(colors);

  const Pill = ({ icon, label, sublabel, onPress, href, highlight }: any) => {
    const btn = (
      <Pressable
        onPress={onPress}
        style={({ pressed, hovered }: any) => [
          styles.pill,
          { backgroundColor: colors.background, borderColor: highlight ? CultureTokens.gold : colors.borderLight },
          highlight && { backgroundColor: CultureTokens.gold + "08" },
          (pressed || hovered) && styles.pillActive,
        ]}
        accessibilityRole="link"
      >
        <View style={[styles.pillIconWrap, highlight && { backgroundColor: CultureTokens.gold + "15" }]}>
          <Ionicons name={icon} size={16} color={highlight ? CultureTokens.gold : colors.textSecondary} />
        </View>
        <View style={styles.pillTextWrap}>
          <Text style={[styles.pillLabel, highlight && { color: CultureTokens.gold }]} numberOfLines={1}>{label}</Text>
          {sublabel && <Text style={styles.pillSub} numberOfLines={1}>{sublabel}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} style={{ opacity: 0.6 }} />
      </Pressable>
    );
    return href ? <Link href={href} asChild>{btn}</Link> : btn;
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface }]}>
      <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal, CultureTokens.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} />
      
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Text style={styles.mainTitle}>More from CulturePass</Text>
          <Text style={styles.mainSub}>Legal, support, and community links</Text>
        </View>

        <View style={styles.columns}>
          {/* LEGAL CARD - FIXED CLOSING TAGS */}
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: CultureTokens.indigo + "12" }]}>
                <Ionicons name="shield-checkmark" size={18} color={CultureTokens.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Legal & Support</Text>
                <Text style={styles.cardSub}>Policies and help</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.pillGrid}>
              {LEGAL_LINKS.map(l => (
                <View key={l.label} style={styles.pillWrapper}>
                  <Pill icon={l.icon} label={l.label} href={l.href} />
                </View>
              ))}
            </View>
          </View>

          {/* SOCIAL CARD */}
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: CultureTokens.teal + "12" }]}>
                <Ionicons name="people" size={18} color={CultureTokens.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Connect</Text>
                <Text style={styles.cardSub}>Follow our communities</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.pillGrid}>
              {SOCIAL_LINKS.map(s => (
                <View key={s.label} style={styles.pillWrapper}>
                  <Pill 
                    icon={s.icon} 
                    label={s.label} 
                    sublabel={s.handle}
                    onPress={() => openExternalUrl(s.url)}
                    highlight={s.label === "Support"}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.ack}>
            CulturePass acknowledges the Traditional Custodians of Country throughout Australia. We pay our respects to Elders past and present.
          </Text>
          <View style={styles.footerMeta}>
            <View style={styles.brand}>
              <View style={[styles.dot, { backgroundColor: CultureTokens.indigo }]} />
              <Text style={styles.brandText}>CulturePass</Text>
            </View>
            <Text style={styles.copy}>© {new Date().getFullYear()} CulturePass Pty Ltd • {MADE_IN_WITH_COUNTRY}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const getStyles = (c: any) => StyleSheet.create({
  wrap: { marginTop: 40 },
  accent: { height: 3, width: "100%" },
  inner: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, maxWidth: 1120, alignSelf: "center", width: "100%" },
  headerRow: { marginBottom: 20, alignItems: "center" },
  mainTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: c.text, textAlign: "center" },
  mainSub: { fontSize: 13, fontFamily: "Poppins_400Regular", color: c.textSecondary, marginTop: 2, textAlign: "center" },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 20, justifyContent: "center" },
  card: { flex: 1, minWidth: 320, maxWidth: 540, borderRadius: 20, borderWidth: 1, padding: 20, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconBadge: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: c.text },
  cardSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: c.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: c.borderLight, marginBottom: 16, opacity: 0.7 },
  pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginHorizontal: -2 },
  pillWrapper: { flexGrow: 1, flexBasis: 150, minWidth: 140, maxWidth: 220 },
  pill: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, minHeight: 48 },
  pillActive: { transform: [{ scale: 0.98 }], opacity: 0.85 },
  pillIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  pillTextWrap: { flex: 1, gap: 1 },
  pillLabel: { fontSize: 13.5, fontFamily: "Poppins_600SemiBold", color: c.text, lineHeight: 16 },
  pillSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: c.textSecondary, lineHeight: 13 },
  footer: { marginTop: 32, alignItems: "center", gap: 12 },
  footerDivider: { width: 60, height: 2, backgroundColor: c.borderLight, borderRadius: 1, opacity: 0.5 },
  ack: { fontSize: 12, color: c.textSecondary, textAlign: "center", maxWidth: 560, lineHeight: 18, fontFamily: "Poppins_400Regular" },
  footerMeta: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  brandText: { fontSize: 13, fontFamily: "Poppins_700Bold", color: CultureTokens.indigo },
  copy: { fontSize: 11.5, color: c.textTertiary, fontFamily: "Poppins_400Regular" },
});
