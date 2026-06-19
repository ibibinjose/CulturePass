/**
 * Consumer Digital ID — member-facing pass experience at /profile/digital-id
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, FontFamily, SignatureGradient } from '@/design-system/tokens/theme';
import { resolveQrCardTheme } from '@/design-system/tokens/qrCardThemes';
import { Skeleton, PageContainer, GlassView } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';
import { siteUrl } from '@/lib/publicPaths';
import { canAccessDigitalIdDevTools, DIGITAL_ID_DEV_ROUTE, DIGITAL_ID_ROUTE } from '@/lib/digitalIdRoutes';

import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { useDigitalIdScreen } from '@/modules/profile/hooks/useDigitalIdScreen';
import {
  LanyardPassCard,
  BusinessPassCard,
  WalletAddSection,
  DIGITAL_ID_BRAND,
  WALLET_PASS_THEME,
} from '@/modules/profile/components/digitalId';

type QuickAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
};

export default function DigitalIdUserScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const { isDesktop, hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;

  const { isAdmin } = useRole();
  const d = useDigitalIdScreen();
  const showDevLabLink = canAccessDigitalIdDevTools(isAdmin);

  const cardTheme = React.useMemo(
    () => resolveQrCardTheme(d.tierLabel === 'Standard' ? 'free' : d.tierLabel.toLowerCase()),
    [d.tierLabel],
  );
  const panelBg = isDark ? withAlpha(colors.surface, 0.92) : colors.surface;
  const panelBorder = isDark ? withAlpha(cardTheme.accent, 0.22) : colors.borderLight;

  const cardWidth = Math.min(screenWidth - hPad * 2 - 24, 360);
  const lanyardHeight = Math.round(cardWidth * (WALLET_PASS_THEME.lanyardHeight / 330));
  const businessHeight = Math.round(cardWidth * (210 / 330));
  const lanyardQrSize = Math.min(cardWidth - 88, 128);
  const businessQrSize = Math.min(cardWidth * 0.28, 88);
  const contentWidth = Math.min(isDesktop ? 480 : cardWidth + 8, screenWidth - hPad * 2);

  const pageTitle = `${d.name} — Digital ID | ${DIGITAL_ID_BRAND.name}`;
  const canonicalUrl = siteUrl(DIGITAL_ID_ROUTE);

  const quickActions: QuickAction[] = [
    { key: 'share', icon: 'share-outline', label: 'Share', color: CultureTokens.appBlue, onPress: d.handleShare },
    {
      key: 'copy',
      icon: d.copied ? 'checkmark-circle' : 'copy-outline',
      label: d.copied ? 'Copied' : 'Copy ID',
      color: CultureTokens.passGreen,
      onPress: d.handleCopy,
    },
    { key: 'scan', icon: 'scan-outline', label: 'Scan', color: CultureTokens.indigo, onPress: d.goScanner },
    { key: 'profile', icon: 'person-outline', label: 'Profile', color: CultureTokens.cultureRed, onPress: d.goPublicProfile },
  ];

  return (
    <AuthGuard
      icon="id-card-outline"
      title="Digital ID"
      message={`Sign in to view your ${DIGITAL_ID_BRAND.name} membership pass and add it to Apple or Google Wallet.`}
    >
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`${d.name}'s CulturePass Digital ID — lanyard pass, wallet check-in, and public profile on ${DIGITAL_ID_BRAND.domainDisplay}.`}
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={`CPID ${d.cpid} · ${DIGITAL_ID_BRAND.tagline}`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={DIGITAL_ID_BRAND.name} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <View style={[s.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={
            isDark
              ? [withAlpha(CultureTokens.cultureRed, 0.14), colors.background, withAlpha(CultureTokens.appBlue, 0.12)]
              : [withAlpha(CultureTokens.cultureRed, 0.08), colors.background, withAlpha(CultureTokens.appBlue, 0.06)]
          }
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <AppHeaderBar
          title="Digital ID"
          subtitle={DIGITAL_ID_BRAND.tagline}
          backFallback="/(tabs)/myspace"
          topInset={topInset}
          rightAction={{
            icon: 'share-outline',
            onPress: d.handleShare,
            label: 'Share Digital ID',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 36, paddingHorizontal: hPad }]}
        >
          <PageContainer compact noTopPadding noHorizontalPadding>
            {d.isLoading ? (
              <View style={{ gap: 16, alignItems: 'center', paddingTop: 12, width: contentWidth }}>
                <Skeleton width="100%" height={72} borderRadius={18} />
                <Skeleton width={cardWidth} height={lanyardHeight} borderRadius={22} />
                <Skeleton width="100%" height={56} borderRadius={16} />
                <Skeleton width="100%" height={200} borderRadius={20} />
              </View>
            ) : (
              <>
                {d.flashMessage ? (
                  <View
                    style={[
                      s.flashBanner,
                      {
                        width: contentWidth,
                        backgroundColor:
                          d.flashMessage.type === 'success'
                            ? withAlpha(CultureTokens.passGreen, 0.14)
                            : withAlpha(CultureTokens.coral, 0.14),
                        borderColor:
                          d.flashMessage.type === 'success'
                            ? withAlpha(CultureTokens.passGreen, 0.4)
                            : withAlpha(CultureTokens.coral, 0.4),
                      },
                    ]}
                  >
                    <Ionicons
                      name={d.flashMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={d.flashMessage.type === 'success' ? CultureTokens.passGreen : CultureTokens.coral}
                    />
                    <Text style={[s.flashText, { color: colors.text }]}>{d.flashMessage.text}</Text>
                  </View>
                ) : null}

                <Animated.View entering={FadeInDown.duration(380).springify().damping(20)} style={{ width: contentWidth }}>
                  <MemberStrip
                    name={d.name}
                    username={d.username}
                    cpid={d.cpid}
                    memberSince={d.memberSince}
                    tierLabel={d.tierLabel}
                    tierColor={d.tierConf.color}
                    avatarUrl={d.avatarUrl}
                    avatarRecyclingKey={d.avatarRecyclingKey}
                    initials={d.initials}
                    isDark={isDark}
                    panelBg={panelBg}
                    panelBorder={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                  />
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.duration(450).springify().damping(20).delay(60)}
                  style={[s.passStage, { width: contentWidth }]}
                >
                  <View style={s.passGlow} pointerEvents="none">
                    <LinearGradient
                      colors={[withAlpha(CultureTokens.cultureRed, 0.22), withAlpha(CultureTokens.appBlue, 0.22)]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.passGlowGradient}
                    />
                  </View>
                  <View nativeID="pass-card-lanyard" {...(Platform.OS === 'web' ? ({ id: 'pass-card-lanyard' } as object) : {})}>
                    <LanyardPassCard
                      width={cardWidth}
                      height={lanyardHeight}
                      tierLabel={d.tierLabel}
                      name={d.name}
                      username={d.username}
                      cpid={d.cpid}
                      memberSince={d.memberSince}
                      qrValue={d.qrValue}
                      qrSize={lanyardQrSize}
                      avatarUrl={d.avatarUrl}
                      avatarRecyclingKey={d.avatarRecyclingKey}
                      initials={d.initials}
                      isVerified={d.digitalId?.isVerified}
                      onCopyCpid={d.handleCopy}
                    />
                  </View>
                  <Text style={[s.passCaption, { color: colors.textTertiary }]}>
                    Show this QR at venue check-in · Works offline in Wallet
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.duration(420).springify().damping(20).delay(120)}
                  style={[s.quickRow, { width: contentWidth }]}
                >
                  {quickActions.map((action) => (
                    <Pressable
                      key={action.key}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        action.onPress();
                      }}
                      style={({ pressed }) => [
                        s.quickBtn,
                        {
                          backgroundColor: isDark ? withAlpha(colors.surface, 0.9) : colors.surface,
                          borderColor: withAlpha(action.color, 0.28),
                          opacity: pressed ? 0.86 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                    >
                      <View style={[s.quickIcon, { backgroundColor: withAlpha(action.color, 0.12) }]}>
                        <Ionicons name={action.icon} size={18} color={action.color} />
                      </View>
                      <Text style={[s.quickLabel, { color: colors.text }]}>{action.label}</Text>
                    </Pressable>
                  ))}
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(480).springify().damping(20).delay(180)} style={{ width: contentWidth }}>
                  <WalletAddSection
                    width={contentWidth}
                    name={d.name}
                    username={d.username}
                    cpid={d.cpid}
                    tierLabel={d.tierLabel}
                    memberSince={d.memberSince}
                    qrValue={d.qrValue}
                    profileUrl={d.profileUrl}
                    avatarUrl={d.avatarUrl}
                    initials={d.initials}
                    isVerified={d.digitalId?.isVerified}
                    affiliation={d.affiliation ? { name: d.affiliation.name, avatarUrl: d.affiliation.avatarUrl } : null}
                    location={d.digitalId?.location}
                    isDark={isDark}
                    panelBg={panelBg}
                    panelBorder={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                    accentColor={cardTheme.accent}
                    showApple={d.showAppleWallet}
                    showGoogle={d.showGoogleWallet}
                    onAddApple={d.handleAddAppleWalletCard}
                    onAddGoogle={d.handleAddGoogleWalletCard}
                    isApplePending={d.isApplePending}
                    isGooglePending={d.isGooglePending}
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(500).springify().damping(20).delay(240)} style={{ width: contentWidth }}>
                  <GlassView
                    intensity={isDark ? 20 : 10}
                    style={[s.businessPanel, { borderColor: panelBorder, backgroundColor: panelBg }]}
                    contentStyle={s.businessContent}
                  >
                    <View style={s.businessHeader}>
                      <LinearGradient colors={SignatureGradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.businessIcon}>
                        <Ionicons name="id-card-outline" size={16} color="#fff" />
                      </LinearGradient>
                      <View style={s.businessHeaderText}>
                        <Text style={[s.businessTitle, { color: colors.text }]}>Business card</Text>
                        <Text style={[s.businessSub, { color: colors.textSecondary }]}>
                          Landscape pass for networking and quick sharing
                        </Text>
                      </View>
                    </View>
                    <View style={s.businessCardWrap}>
                      <BusinessPassCard
                        width={cardWidth}
                        height={businessHeight}
                        colorVariant="cyan"
                        tierLabel={d.tierLabel}
                        name={d.name}
                        username={d.username}
                        cpid={d.cpid}
                        qrValue={d.qrValue}
                        qrSize={businessQrSize}
                        avatarUrl={d.avatarUrl}
                        avatarRecyclingKey={d.avatarRecyclingKey}
                        initials={d.initials}
                        isVerified={d.digitalId?.isVerified}
                        affiliation={d.affiliation ? { name: d.affiliation.name, avatarUrl: d.affiliation.avatarUrl } : null}
                        onCopyCpid={d.handleCopy}
                      />
                    </View>
                  </GlassView>
                </Animated.View>

                <View style={[s.benefitsRow, { width: contentWidth }]}>
                  {[
                    { icon: 'cloud-offline-outline' as const, text: 'Offline in Wallet' },
                    { icon: 'flash-outline' as const, text: 'Fast check-in' },
                    { icon: 'globe-outline' as const, text: DIGITAL_ID_BRAND.domainDisplay },
                  ].map((item) => (
                    <View
                      key={item.text}
                      style={[
                        s.benefitChip,
                        {
                          backgroundColor: isDark ? withAlpha(colors.surfaceVariant, 0.55) : colors.surfaceVariant,
                          borderColor: withAlpha(CultureTokens.appBlue, 0.18),
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={13} color={CultureTokens.appBlue} />
                      <Text style={[s.benefitText, { color: colors.textSecondary }]}>{item.text}</Text>
                    </View>
                  ))}
                </View>

                {showDevLabLink ? (
                  <Pressable
                    onPress={() => router.push(DIGITAL_ID_DEV_ROUTE as never)}
                    style={({ pressed }) => [s.devLabLink, { opacity: pressed ? 0.75 : 1 }]}
                    accessibilityRole="link"
                    accessibilityLabel="Open Digital ID Lab for developers and admins"
                  >
                    <Ionicons name="flask-outline" size={14} color={colors.textTertiary} />
                    <Text style={[s.devLabText, { color: colors.textTertiary }]}>
                      Digital ID Lab — themes, exports, affiliations
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </PageContainer>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

function MemberStrip({
  name,
  username,
  cpid,
  memberSince,
  tierLabel,
  tierColor,
  avatarUrl,
  avatarRecyclingKey,
  initials,
  isDark,
  panelBg,
  panelBorder,
  textColor,
  mutedColor,
}: {
  name: string;
  username: string;
  cpid: string;
  memberSince: string;
  tierLabel: string;
  tierColor: string;
  avatarUrl?: string | null;
  avatarRecyclingKey?: string | number | null;
  initials: string;
  isDark: boolean;
  panelBg: string;
  panelBorder: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <GlassView
      intensity={isDark ? 24 : 12}
      style={[s.memberStrip, { borderColor: panelBorder, backgroundColor: panelBg }]}
      contentStyle={s.memberContent}
    >
      <LinearGradient
        colors={[CultureTokens.cultureRed, CultureTokens.appBlue]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={s.avatarRing}
      >
        <View style={[s.avatarInner, { backgroundColor: panelBg }]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={s.avatar}
              contentFit="cover"
              recyclingKey={avatarRecyclingKey != null ? String(avatarRecyclingKey) : avatarUrl}
              accessibilityLabel={`${name} avatar`}
            />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: withAlpha(CultureTokens.indigo, 0.12) }]}>
              <Text style={[s.avatarInitials, { color: CultureTokens.indigo }]}>{initials}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={s.memberMeta}>
        <Text style={[s.memberName, { color: textColor }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[s.memberHandle, { color: mutedColor }]} numberOfLines={1}>
          @{username}
        </Text>
        <View style={s.memberChips}>
          <View style={[s.tierChip, { backgroundColor: withAlpha(tierColor, 0.14), borderColor: withAlpha(tierColor, 0.35) }]}>
            <Text style={[s.tierChipText, { color: tierColor }]}>{tierLabel}</Text>
          </View>
          <View style={[s.cpidChip, { backgroundColor: withAlpha(CultureTokens.appBlue, 0.1), borderColor: withAlpha(CultureTokens.appBlue, 0.22) }]}>
            <Text style={[s.cpidChipText, { color: CultureTokens.appBlue }]} numberOfLines={1}>
              {cpid}
            </Text>
          </View>
        </View>
        <Text style={[s.memberSince, { color: mutedColor }]}>Member since {memberSince}</Text>
      </View>

      <View style={[s.activeBadge, { backgroundColor: withAlpha(CultureTokens.passGreen, 0.14) }]}>
        <View style={[s.activeDot, { backgroundColor: CultureTokens.passGreen }]} />
        <Text style={[s.activeText, { color: CultureTokens.passGreen }]}>Active</Text>
      </View>
    </GlassView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: 8 },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  flashText: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium },
  memberStrip: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 16, fontFamily: FontFamily.bold },
  memberMeta: { flex: 1, minWidth: 0, gap: 2 },
  memberName: { fontSize: 16, fontFamily: FontFamily.bold },
  memberHandle: { fontSize: 12, fontFamily: FontFamily.medium },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tierChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierChipText: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
  cpidChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  cpidChipText: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  memberSince: { fontSize: 10, fontFamily: FontFamily.medium, marginTop: 4 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 10, fontFamily: FontFamily.bold },
  passStage: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  passGlow: {
    position: 'absolute',
    top: 24,
    left: '8%',
    right: '8%',
    height: '72%',
    borderRadius: 28,
    overflow: 'hidden',
    opacity: 0.55,
  },
  passGlowGradient: { flex: 1, borderRadius: 28 },
  passCaption: {
    marginTop: 12,
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  quickBtn: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 72,
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontFamily: FontFamily.semibold, textAlign: 'center' },
  businessPanel: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  businessContent: { gap: 14, padding: 16 },
  businessHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  businessIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessHeaderText: { flex: 1, gap: 2 },
  businessTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  businessSub: { fontSize: 11, fontFamily: FontFamily.medium, lineHeight: 15 },
  businessCardWrap: { alignItems: 'center' },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  benefitText: { fontSize: 11, fontFamily: FontFamily.medium },
  devLabLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  devLabText: { fontSize: 11, fontFamily: FontFamily.medium },
});