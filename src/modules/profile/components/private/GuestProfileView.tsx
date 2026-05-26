import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, LiquidGlassTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { TabHeaderNativeShell } from '@/modules/core/layout/tabs/TabHeaderNativeShell';
import { TabPageChromeRow } from '@/modules/core/layout/tabs/TabHeaderChrome';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';

// ---------------------------------------------------------------------------
// Guest profile — matches signed-in tab: ambient mesh + glass chrome
// ---------------------------------------------------------------------------
export function GuestProfileView() {
  const colors = useColors();
  const pathname = usePathname();
  const { hPad } = useLayout();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.06 }]}
        pointerEvents="none"
      />

      {Platform.OS === 'web' ? (
        <GlassView
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={{
            paddingTop: 14,
            paddingBottom: MAIN_TAB_UI.headerVerticalPadding,
            paddingHorizontal: hPad,
          }}
        >
          <TabPageChromeRow
            title="Profile"
            subtitle="Sign in to unlock tickets, wallet, and your CulturePass ID."
            showHairline={false}
          />
        </GlassView>
      ) : (
        <TabHeaderNativeShell hPad={hPad}>
          <View style={{ paddingBottom: MAIN_TAB_UI.headerVerticalPadding }}>
            <TabPageChromeRow
              title="Profile"
              subtitle="Sign in to unlock tickets, wallet, and your CulturePass ID."
              showHairline={false}
            />
          </View>
        </TabHeaderNativeShell>
      )}

      <ScrollView
        contentContainerStyle={[gs.scrollContent, isDesktop && gs.desktopContent, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassView
          borderRadius={LiquidGlassTokens.corner.mainCard}
          style={gs.contentCard}
          contentStyle={gs.glassCardInner}
        >
          <View style={[gs.iconRing, { borderColor: CultureTokens.teal + '40' }]}>
            <LinearGradient
              colors={[CultureTokens.teal + '24', CultureTokens.indigo + '20']}
              style={gs.iconRingFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[gs.iconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
              <Ionicons name="person-circle-outline" size={56} color={CultureTokens.indigo} />
            </View>
          </View>

          <Text style={[gs.title, { color: colors.text }]}>Your Cultural Passport</Text>
          <Text style={[gs.subtitle, { color: colors.textSecondary }]}>
            Access your profile, tickets, saved events, wallet, and communities — tailored to your city.
          </Text>

          <View style={gs.featureList}>
            {[
              { icon: 'ticket-outline' as const, text: 'Event tickets & QR check-in', accent: CultureTokens.coral },
              { icon: 'bookmark-outline' as const, text: 'Save events & join communities', accent: CultureTokens.gold },
              { icon: 'wallet-outline' as const, text: 'Wallet & payment methods', accent: CultureTokens.teal },
              { icon: 'qr-code-outline' as const, text: 'Digital CulturePass ID', accent: CultureTokens.indigo },
            ].map((f) => (
              <GlassView
                key={f.text}
                borderRadius={LiquidGlassTokens.corner.innerRow + 4}
                style={{ overflow: 'hidden' }}
                contentStyle={gs.featureRowInner}
              >
                <View style={[gs.featureIcon, { backgroundColor: f.accent + '22' }]}>
                  <Ionicons name={f.icon} size={18} color={f.accent} />
                </View>
                <Text style={[gs.featureText, { color: colors.text }]}>{f.text}</Text>
              </GlassView>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [gs.primaryBtn, { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 }]}
            onPress={() =>
              router.push({ pathname: '/(onboarding)/signup', params: { redirectTo: pathname } } as never)
            }
            accessibilityRole="button"
            accessibilityLabel="Create free account"
          >
            <Text style={[gs.primaryBtnText, { color: colors.textOnBrandGradient }]}>Create free account</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textOnBrandGradient} />
          </Pressable>

          <GlassView borderRadius={14} contentStyle={{ padding: 0 }}>
            <Pressable
              style={({ pressed }) => [gs.secondaryBtnInner, { opacity: pressed ? 0.88 : 1 }]}
              onPress={() =>
                router.push({ pathname: '/(onboarding)/login', params: { redirectTo: pathname } } as never)
              }
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={[gs.secondaryBtnText, { color: CultureTokens.indigo }]}>I already have an account</Text>
            </Pressable>
          </GlassView>
        </GlassView>
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const gs = StyleSheet.create({
  scrollContent: {
    paddingTop: 20,
    alignItems: 'center',
    paddingBottom: 24,
  },
  desktopContent: { justifyContent: 'center', minHeight: '100%' as unknown as number },
  contentCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  glassCardInner: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
  },
  iconRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  iconRingFill: { ...StyleSheet.absoluteFill },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 26,
  },
  featureList: { gap: 10, marginBottom: 28, width: '100%' },
  featureRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 20 },
  primaryBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  secondaryBtnInner: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
});
