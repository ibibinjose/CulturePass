/**
 * CulturePass Digital ID Lab — /profile/qr
 * Developer & admin only — pass themes, exports, affiliations, event ticket previews.
 * Members use /profile/digital-id
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Head from 'expo-router/head';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Redirect } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { canAccessDigitalIdDevTools, DIGITAL_ID_ROUTE } from '@/lib/digitalIdRoutes';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { resolveQrCardTheme } from '@/design-system/tokens/qrCardThemes';
import { Skeleton, PageContainer, GlassView, M3SectionHeader } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';
import { siteUrl } from '@/lib/publicPaths';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import type { Profile } from '@shared/schema';
import { useDigitalIdScreen } from '@/modules/profile/hooks/useDigitalIdScreen';
import {
  BusinessPassCard,
  LanyardPassCard,
  EventTicketPassPreview,
  PassMemberHero,
  PassViewSwitcher,
  WalletAddSection,
  PassColorPicker,
  PassCardLabel,
  DigitalIdHero,
  WALLET_PASS_THEME,
  PASS_TYPE_LABELS,
  DIGITAL_ID_BRAND,
} from '@/modules/profile/components/digitalId';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function QRScreen() {
  const { isAdmin } = useRole();
  const colors = useColors();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const { isDesktop, hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;

  const d = useDigitalIdScreen();

  const cardTheme = React.useMemo(
    () => resolveQrCardTheme(d.tierLabel === 'Standard' ? 'free' : d.tierLabel.toLowerCase()),
    [d.tierLabel],
  );

  if (!canAccessDigitalIdDevTools(isAdmin)) {
    return <Redirect href={DIGITAL_ID_ROUTE} />;
  }
  const panelBg = isDark ? withAlpha(colors.surface, 0.92) : colors.surface;
  const panelBorder = isDark ? withAlpha(cardTheme.accent, 0.22) : colors.borderLight;
  const mutedOnPanel = colors.textSecondary;

  const sideBySide = isDesktop && screenWidth >= 720;
  const contentMaxWidth = sideBySide ? 920 : d.cardDimensions.width;
  const passCardWidth = d.cardDimensions.width;
  const containerWidth = Math.min(sideBySide ? passCardWidth * 2 + 20 : passCardWidth, contentMaxWidth);

  const pageTitle = `${d.name} — Digital ID | ${DIGITAL_ID_BRAND.name}`;
  const canonicalUrl = siteUrl('/profile/qr');

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message={`Sign in to view and share your ${DIGITAL_ID_BRAND.name} Digital ID — your business card and conference badge.`}
    >
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={`${d.name}'s CulturePass Digital ID — business pass, lanyard badge, and wallet passes on ${DIGITAL_ID_BRAND.domainDisplay}.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={`Digital Business Pass · CPID ${d.cpid} · ${DIGITAL_ID_BRAND.tagline}`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={DIGITAL_ID_BRAND.name} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <View style={[s.root, { backgroundColor: colors.background }]}>
        <AppHeaderBar
          title="Digital ID Lab"
          subtitle={`${DIGITAL_ID_BRAND.name} · Dev tools · Exports`}
          backFallback="/(tabs)/my-space"
          topInset={topInset}
          rightAction={{
            icon: 'scan-outline',
            onPress: d.goScanner,
            label: 'Scan ID',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 40, paddingHorizontal: hPad }]}
        >
          <PageContainer compact noTopPadding noHorizontalPadding>
            {d.isLoading ? (
              <View style={{ gap: 14, alignItems: 'center', paddingTop: 12, width: containerWidth }}>
                <Skeleton width="100%" height={148} borderRadius={20} />
                <Skeleton width="100%" height={180} borderRadius={20} />
                <Skeleton width="100%" height={44} borderRadius={14} />
                <Skeleton width="100%" height={d.cardDimensions.businessHeight} borderRadius={20} />
              </View>
            ) : (
              <>
                {d.flashMessage ? (
                  <View style={[s.flashBanner, {
                    backgroundColor: d.flashMessage.type === 'success' ? CultureTokens.teal + '25' : CultureTokens.coral + '25',
                    borderColor: d.flashMessage.type === 'success' ? CultureTokens.teal + '55' : CultureTokens.coral + '55',
                  }]}>
                    <Ionicons
                      name={d.flashMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={d.flashMessage.type === 'success' ? CultureTokens.teal : CultureTokens.coral}
                    />
                    <Text style={[s.flashBannerText, { color: colors.text }]}>{d.flashMessage.text}</Text>
                  </View>
                ) : null}

                <Animated.View entering={FadeInDown.duration(400).springify().damping(20)}>
                  <DigitalIdHero width={containerWidth} tierLabel={d.tierLabel} isDark={isDark} />
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(500).springify().damping(20).delay(100)} style={{ width: containerWidth }}>
                  <PassMemberHero
                    name={d.name}
                    username={d.username}
                    cpid={d.cpid}
                    memberSince={d.memberSince}
                    tierLabel={d.tierLabel}
                    tierColor={d.tierConf.color}
                    avatarUrl={d.avatarUrl}
                    initials={d.initials}
                    panelBg={panelBg}
                    panelBorder={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                    accentColor={cardTheme.accent}
                    isDark={isDark}
                    copied={d.copied}
                    onCopyCpid={d.handleCopy}
                    quickActions={[
                      { icon: 'share-outline', label: 'Share', color: colors.primary, onPress: d.handleShare },
                      { icon: d.copied ? 'checkmark-circle' : 'copy-outline', label: d.copied ? 'Copied' : 'Copy ID', color: CultureTokens.gold, onPress: d.handleCopy },
                      { icon: 'scan-outline', label: 'Scan', color: CultureTokens.teal, onPress: d.goScanner },
                      { icon: 'person-outline', label: 'Profile', color: CultureTokens.indigo, onPress: d.goPublicProfile },
                    ]}
                  />
                </Animated.View>

                <View style={{ width: containerWidth, gap: 10 }}>
                  <M3SectionHeader title="Your passes" subtitle={DIGITAL_ID_BRAND.domainDisplay} />
                  <PassColorPicker
                    value={d.passColor}
                    onChange={(variant) => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      d.setPassColor(variant);
                    }}
                    accentColor={WALLET_PASS_THEME.cyanHex}
                    backgroundColor={isDark ? withAlpha(colors.surfaceVariant, 0.55) : colors.surfaceVariant}
                    borderColor={panelBorder}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                  />
                </View>

                {!sideBySide ? (
                  <View style={{ width: containerWidth }}>
                    <PassViewSwitcher
                      value={d.passView}
                      onChange={(key) => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        d.setPassView(key);
                      }}
                      accentColor={WALLET_PASS_THEME.cyanHex}
                      backgroundColor={isDark ? withAlpha(colors.surfaceVariant, 0.55) : colors.surfaceVariant}
                      borderColor={panelBorder}
                      textColor={colors.text}
                      mutedColor={colors.textSecondary}
                    />
                  </View>
                ) : null}

                <Animated.View
                  key={sideBySide ? 'both' : d.passView}
                  entering={sideBySide ? undefined : FadeInDown.duration(350).springify().damping(18)}
                  id="print-badge-area"
                  nativeID="print-badge-area"
                  style={[s.printBadgeArea, { width: containerWidth, flexDirection: sideBySide ? 'row' : 'column', gap: sideBySide ? 20 : 12 }]}
                >
                  {(sideBySide || d.passView === 'business') ? (
                    <PassCardSection
                      cardType="business"
                      width={passCardWidth}
                      height={d.cardDimensions.businessHeight}
                      colors={colors}
                      cardTheme={cardTheme}
                      resolvingAvatar={d.resolvingAvatar}
                      onSaveImage={d.handleSaveImage}
                      onDownloadPDF={d.handleDownloadPDF}
                      passColor={d.passColor}
                      tierLabel={d.tierLabel}
                      name={d.name}
                      username={d.username}
                      cpid={d.cpid}
                      qrValue={d.qrValue}
                      qrSize={d.cardDimensions.qrLandscape}
                      avatarUrl={d.avatarUrl}
                      initials={d.initials}
                      isVerified={d.digitalId?.isVerified}
                      affiliation={d.affiliation ? { name: d.affiliation.name, avatarUrl: d.affiliation.avatarUrl } : null}
                      onCopyCpid={d.handleCopy}
                    />
                  ) : null}

                  {(sideBySide || d.passView === 'lanyard') ? (
                    <PassCardSection
                      cardType="lanyard"
                      width={passCardWidth}
                      height={d.cardDimensions.lanyardHeight}
                      colors={colors}
                      cardTheme={cardTheme}
                      resolvingAvatar={d.resolvingAvatar}
                      onSaveImage={d.handleSaveImage}
                      onDownloadPDF={d.handleDownloadPDF}
                      passColor={d.passColor}
                      tierLabel={d.tierLabel}
                      name={d.name}
                      username={d.username}
                      cpid={d.cpid}
                      memberSince={d.memberSince}
                      qrValue={d.qrValue}
                      qrSize={d.cardDimensions.qrVertical}
                      avatarUrl={d.avatarUrl}
                      initials={d.initials}
                      isVerified={d.digitalId?.isVerified}
                      affiliation={d.affiliation ? { name: d.affiliation.name, avatarUrl: d.affiliation.avatarUrl } : null}
                      onCopyCpid={d.handleCopy}
                      copied={d.copied}
                    />
                  ) : null}

                  {(sideBySide || d.passView === 'event') ? (
                    <View style={[s.cardWrapper, { width: sideBySide ? containerWidth : passCardWidth }]}>
                      <PassCardLabel
                        width={sideBySide ? containerWidth : passCardWidth}
                        title={PASS_TYPE_LABELS.event.title}
                        subtitle={PASS_TYPE_LABELS.event.subtitle}
                        icon={PASS_TYPE_LABELS.event.icon}
                        textColor={colors.text}
                        mutedColor={colors.textSecondary}
                        accentColor={cardTheme.accent}
                      />
                      <EventTicketPassPreview
                        width={sideBySide ? Math.min(containerWidth, 680) : passCardWidth}
                        attendeeName={d.name}
                        eventTitle={d.upcomingTicket?.eventTitle ?? d.upcomingTicket?.eventName ?? 'Your next cultural event'}
                        eventDate={d.upcomingTicket?.eventDate ?? d.upcomingTicket?.date ?? 'Date TBA'}
                        venue={d.upcomingTicket?.eventVenue ?? undefined}
                        ticketCode={d.upcomingTicket?.ticketCode ?? d.upcomingTicket?.qrCode ?? 'VIEW-TICKETS'}
                        qrValue={d.eventQrValue}
                        accentColor={cardTheme.accent}
                        onPress={d.goTicket}
                      />
                      <Text style={[s.passHint, { color: colors.textTertiary, textAlign: 'center', marginTop: 8 }]}>
                        {d.upcomingTicket ? 'Tap to open ticket · Add to Wallet from ticket screen' : 'Book an event to generate your ticket pass'}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>

                <View style={[s.passHintRow, { width: containerWidth }]}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.textTertiary} />
                  <Text style={[s.passHint, { color: colors.textTertiary, flex: 1 }]}>
                    {Platform.OS === 'web'
                      ? `Passes show ${DIGITAL_ID_BRAND.domainDisplay} · Save PNG/PDF or add to Wallet`
                      : `Lanyard pass matches Apple & Google Wallet on ${DIGITAL_ID_BRAND.domainDisplay}`}
                  </Text>
                </View>

                {d.myProfiles.length > 0 ? (
                  <AffiliationPanel
                    width={containerWidth}
                    myProfiles={d.myProfiles}
                    selectedAffiliationId={d.affiliation?.id}
                    panelBg={panelBg}
                    panelBorder={panelBorder}
                    isDark={isDark}
                    cardTheme={cardTheme}
                    colors={colors}
                    mutedOnPanel={mutedOnPanel}
                    onSelect={d.handleSelectAffiliation}
                  />
                ) : null}

                <View style={{ width: containerWidth, marginTop: 20 }}>
                  <WalletAddSection
                    width={containerWidth}
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
                </View>

                {d.interests.length > 0 ? (
                  <View style={[s.tagsSection, { width: containerWidth, marginTop: 16 }]}>
                    <Text style={[s.tagsHeading, { color: cardTheme.accent + '99' }]}>INTERESTS</Text>
                    <View style={s.tagsRow}>
                      {d.interests.map((interest) => (
                        <View key={interest} style={[s.tag, { backgroundColor: cardTheme.accent + '10', borderColor: cardTheme.accent + '20' }]}>
                          <Text style={[s.tagText, { color: cardTheme.accent }]}>{capitalize(interest)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </PageContainer>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

type PassCardSectionProps = {
  cardType: 'business' | 'lanyard';
  width: number;
  height: number;
  colors: ReturnType<typeof useColors>;
  cardTheme: ReturnType<typeof resolveQrCardTheme>;
  resolvingAvatar: boolean;
  onSaveImage: (t: 'business' | 'lanyard') => void;
  onDownloadPDF: (t: 'business' | 'lanyard') => void;
  passColor: 'cyan' | 'white' | 'black';
  tierLabel: string;
  name: string;
  username: string;
  cpid: string;
  memberSince?: string;
  qrValue: string;
  qrSize: number;
  avatarUrl?: string | null;
  initials: string;
  isVerified?: boolean;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  onCopyCpid: () => void;
  copied?: boolean;
};

function PassCardSection({
  cardType,
  width,
  height,
  colors,
  cardTheme,
  resolvingAvatar,
  onSaveImage,
  onDownloadPDF,
  passColor,
  tierLabel,
  name,
  username,
  cpid,
  memberSince,
  qrValue,
  qrSize,
  avatarUrl,
  initials,
  isVerified,
  affiliation,
  onCopyCpid,
  copied,
}: PassCardSectionProps) {
  const labels = PASS_TYPE_LABELS[cardType];
  const accent = cardType === 'lanyard' ? WALLET_PASS_THEME.cyanHex : cardTheme.accent;

  return (
    <View style={[s.cardWrapper, { width, alignSelf: 'center' }]}>
      <PassCardLabel
        width={width}
        title={labels.title}
        subtitle={labels.subtitle}
        icon={labels.icon}
        textColor={colors.text}
        mutedColor={colors.textSecondary}
        accentColor={accent}
      />
      {cardType === 'business' ? (
        <BusinessPassCard
          width={width}
          height={height}
          colorVariant={passColor}
          tierLabel={tierLabel}
          name={name}
          username={username}
          cpid={cpid}
          qrValue={qrValue}
          qrSize={qrSize}
          avatarUrl={avatarUrl}
          initials={initials}
          isVerified={isVerified}
          affiliation={affiliation}
          onCopyCpid={onCopyCpid}
        />
      ) : (
        <LanyardPassCard
          width={width}
          height={height}
          colorVariant={passColor}
          tierLabel={tierLabel}
          name={name}
          username={username}
          cpid={cpid}
          memberSince={memberSince ?? '—'}
          qrValue={qrValue}
          qrSize={qrSize}
          avatarUrl={avatarUrl}
          initials={initials}
          isVerified={isVerified}
          affiliation={affiliation}
          onCopyCpid={onCopyCpid}
          copied={copied}
        />
      )}
      {Platform.OS === 'web' ? (
        <View style={s.cardActionsRow}>
          <ExportActionBtn
            icon="image-outline"
            title="Save Image"
            subtitle="PNG · High-res"
            accent={accent}
            textColor={colors.text}
            mutedColor={colors.textSecondary}
            loading={resolvingAvatar}
            onPress={() => onSaveImage(cardType)}
            label={`Save ${cardType} pass as PNG`}
          />
          <ExportActionBtn
            icon="document-text-outline"
            title="Save PDF"
            subtitle="Print · Archive"
            accent={accent}
            textColor={colors.text}
            mutedColor={colors.textSecondary}
            loading={resolvingAvatar}
            onPress={() => onDownloadPDF(cardType)}
            label={`Save ${cardType} pass as PDF`}
          />
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [s.downloadBtn, { borderColor: accent + '50', opacity: pressed ? 0.8 : 1 }]}
          onPress={() => onSaveImage(cardType)}
          accessibilityRole="button"
          accessibilityLabel={`Share ${cardType} pass`}
        >
          <View style={[s.downloadIconWrap, { backgroundColor: accent + '18' }]}>
            <Ionicons name="share-outline" size={16} color={accent} />
          </View>
          <Text style={[s.downloadBtnText, { color: accent }]}>Share Pass</Text>
        </Pressable>
      )}
    </View>
  );
}

function ExportActionBtn({
  icon,
  title,
  subtitle,
  accent,
  textColor,
  mutedColor,
  loading,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
  textColor: string;
  mutedColor: string;
  loading: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.premiumActionBtn, { opacity: (pressed || loading) ? 0.75 : 1 }]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[s.premiumActionIcon, { backgroundColor: accent + '20' }]}>
        {loading ? <ActivityIndicator size="small" color={accent} /> : <Ionicons name={icon} size={16} color={accent} />}
      </View>
      <View style={s.premiumActionText}>
        <Text style={[s.premiumActionTitle, { color: textColor }]}>{title}</Text>
        <Text style={[s.premiumActionSub, { color: mutedColor }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function AffiliationPanel({
  width,
  myProfiles,
  selectedAffiliationId,
  panelBg,
  panelBorder,
  isDark,
  cardTheme,
  colors,
  mutedOnPanel,
  onSelect,
}: {
  width: number;
  myProfiles: Profile[];
  selectedAffiliationId?: string;
  panelBg: string;
  panelBorder: string;
  isDark: boolean;
  cardTheme: ReturnType<typeof resolveQrCardTheme>;
  colors: ReturnType<typeof useColors>;
  mutedOnPanel: string;
  onSelect: (p: Profile | null) => void;
}) {
  return (
    <GlassView
      intensity={isDark ? 22 : 10}
      style={[s.affiliationSelectorContainer, { width, borderColor: panelBorder, backgroundColor: panelBg }]}
      contentStyle={{ gap: 12, padding: 16 }}
    >
      <View style={s.affiliationHeader}>
        <Ionicons name="business-outline" size={18} color={cardTheme.accent} />
        <Text style={[s.affiliationTitle, { color: colors.text }]}>Pass affiliation</Text>
      </View>
      <Text style={[s.affiliationDesc, { color: mutedOnPanel }]}>
        Show a business or community profile badge on your digital passes.
      </Text>
      <View style={s.affiliationOptionsList}>
        <Pressable
          onPress={() => onSelect(null)}
          style={({ pressed }) => [
            s.affiliationOptionRow,
            !selectedAffiliationId && s.affiliationOptionRowActive,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ checked: !selectedAffiliationId }}
        >
          <View style={s.affiliationOptionLeft}>
            <View style={[s.affiliationOptionAvatarFallback, { backgroundColor: '#374151' }]}>
              <Ionicons name="close-circle-outline" size={14} color="#9CA3AF" />
            </View>
            <Text style={[s.affiliationOptionName, { color: !selectedAffiliationId ? cardTheme.accent : colors.text }]}>
              None
            </Text>
          </View>
          {!selectedAffiliationId ? <Ionicons name="checkmark-circle" size={18} color={cardTheme.accent} /> : null}
        </Pressable>

        {myProfiles.map((p) => {
          const isSelected = selectedAffiliationId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p)}
              style={({ pressed }) => [
                s.affiliationOptionRow,
                isSelected && s.affiliationOptionRowActive,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={s.affiliationOptionLeft}>
                {p.avatarUrl ? (
                  <Image source={{ uri: p.avatarUrl }} style={s.affiliationOptionAvatar} contentFit="cover" />
                ) : (
                  <View style={[s.affiliationOptionAvatarFallback, { backgroundColor: cardTheme.accent + '20' }]}>
                    <Text style={[s.affiliationOptionInitials, { color: cardTheme.accent }]}>
                      {(p.name || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[s.affiliationOptionName, { color: isSelected ? cardTheme.accent : colors.text }]} numberOfLines={1}>
                  {p.name}
                </Text>
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={18} color={cardTheme.accent} /> : null}
            </Pressable>
          );
        })}
      </View>
    </GlassView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 16,
  },
  flashBannerText: { fontSize: 14, fontFamily: FontFamily.regular, flex: 1 },
  printBadgeArea: { alignItems: 'flex-start' },
  cardWrapper: { gap: 10, alignItems: 'center' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  downloadBtnText: { fontSize: 14, fontFamily: FontFamily.medium },
  downloadIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  passHint: { fontSize: 11, fontFamily: FontFamily.medium, lineHeight: 15 },
  cardActionsRow: { flexDirection: 'row', gap: 8, width: '100%' },
  premiumActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 52,
    ...Platform.select({ web: { cursor: 'pointer' } } as object),
  },
  premiumActionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  premiumActionText: { gap: 1 },
  premiumActionTitle: { fontSize: 12, fontFamily: FontFamily.semibold },
  premiumActionSub: { fontSize: 10, fontFamily: FontFamily.regular },
  affiliationSelectorContainer: { borderRadius: 16, borderWidth: 1, marginTop: 12 },
  affiliationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  affiliationTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  affiliationDesc: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 17 },
  affiliationOptionsList: { gap: 8 },
  affiliationOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },
  affiliationOptionRowActive: { borderColor: WALLET_PASS_THEME.cyanHex + '44', backgroundColor: WALLET_PASS_THEME.cyanHex + '08' },
  affiliationOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  affiliationOptionAvatar: { width: 32, height: 32, borderRadius: 8 },
  affiliationOptionAvatarFallback: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  affiliationOptionInitials: { fontSize: 13, fontFamily: FontFamily.bold },
  affiliationOptionName: { fontSize: 14, fontFamily: FontFamily.semibold, flex: 1 },
  tagsSection: { gap: 8 },
  tagsHeading: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: FontFamily.semibold },
  passHintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 8 },
});