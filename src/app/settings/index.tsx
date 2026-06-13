import React, { useCallback, useMemo } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useLayout } from '@/hooks/useLayout';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  confirmOnboardingRestart,
  ONBOARDING_PROFILE_CLEAR_PATCH,
} from '@/lib/onboardingReset';
import { useRole } from '@/hooks/useRole';
import { useColors } from '@/hooks/useColors';
import { useSafeBack } from '@/lib/navigation';
import {
  APP_NAME_AU,
  EMAIL_BUGS,
  EMAIL_SUPPORT,
  MADE_IN_WITH_COUNTRY,
  PRIMARY_REGION,
  getAppVersion,
  getAppVersionWithBuild,
} from '@/lib/app-meta';
import { CultureTokens, FontFamily, Radius, ScreenTokens, Spacing } from '@/design-system/tokens/theme';
import {
  settingsAppCalendarSyncItem,
  settingsHelpCenterItem,
  settingsMyContentItems,
  settingsOrganizerHostHubItems,
} from '@/constants/navigation/experienceNav';
import { NavigationMetadata } from '@/components/NavigationMetadata';

type IconName = keyof typeof Ionicons.glyphMap;

type SettingsRow = {
  label: string;
  sub?: string;
  icon?: IconName;
  iconColor?: string;
  route?: string;
  external?: string;
  action?: () => void;
  rightText?: string;
  destructive?: boolean;
};

const ICON_COLORS = {
  account: CultureTokens.indigo,
  privacy: CultureTokens.teal,
  alerts: CultureTokens.coral,
  style: CultureTokens.violet,
  muted: CultureTokens.indigo,
  admin: CultureTokens.coral,
} as const;

function softColor(hex: string, alpha = '22') {
  return `${hex}${alpha}`;
}

function hapticSelection() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

function SettingsIcon({ name, color }: { name: IconName; color: string }) {
  return (
    <View style={[styles.iconTile, { backgroundColor: softColor(color) }]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
}

function Row({ row, isLast }: { row: SettingsRow; isLast: boolean }) {
  const colors = useColors();
  const isActionable = Boolean(row.route || row.external || row.action);
  const handlePress = () => {
    if (!isActionable) return;
    hapticSelection();
    if (row.route) router.push(row.route as never);
    else if (row.external) void Linking.openURL(row.external);
    else row.action?.();
  };

  const getPressableStyle = ({ pressed }: { pressed: boolean }) => [
    styles.row,
    { backgroundColor: pressed && isActionable ? colors.primarySoft : 'transparent' },
    Platform.OS === 'web' && isActionable && {
      cursor: 'pointer' as never,
      // @ts-ignore - web only
      transition: 'background-color 80ms ease',
    },
  ];

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isActionable}
      style={getPressableStyle}
      accessibilityRole={isActionable ? 'button' : undefined}
      accessibilityLabel={row.label}
    >
      {row.icon ? <SettingsIcon name={row.icon} color={row.iconColor ?? colors.primary} /> : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, { color: row.destructive ? colors.error : colors.text }]} numberOfLines={1}>
          {row.label}
        </Text>
        {row.sub ? <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>{row.sub}</Text> : null}
      </View>
      {row.rightText ? <Text style={[styles.rowRight, { color: colors.textTertiary }]}>{row.rightText}</Text> : null}
      {isActionable ? <Ionicons name={row.external ? 'arrow-up-outline' : 'chevron-forward'} size={18} color={colors.textTertiary} /> : null}
      {!isLast ? <View style={[styles.divider, { backgroundColor: colors.divider }]} /> : null}
    </Pressable>
  );
}

function Section({ title, rows }: { title: string; rows: SettingsRow[] }) {
  const colors = useColors();
  if (!rows.length) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {rows.map((row, index) => (
          <Row key={`${title}-${row.label}`} row={row} isLast={index === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

function fromNavItem(item: {
  label: string;
  sub?: string;
  icon?: string;
  color?: string;
  route?: string;
  action?: () => void;
  rightText?: string;
}): SettingsRow {
  return {
    label: item.label,
    sub: item.sub,
    icon: (item.icon ?? 'ellipse') as IconName,
    iconColor: item.color ?? CultureTokens.indigo,
    route: item.route,
    action: item.action,
    rightText: item.rightText,
  };
}

export default function SettingsScreen() {
  const colors = useColors();
  const layout = useLayout();
  const { user, isAuthenticated, logout, updateUserProfile } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { isOrganizer, isAdmin, hasMinRole } = useRole();
  const goBack = useSafeBack('/(tabs)/myspace');

  const safeInsets = useSafeAreaInsetsWeb();
  const pageTopPadding = safeInsets.top + ScreenTokens.topOffset;
  const pageBottomPadding = safeInsets.bottom + Spacing.xl;

  // Responsive behavior using project layout system
  const isDesktop = layout.isDesktop || layout.isExpanded;
  const isTablet = layout.isTablet || layout.isMedium;
  const useTwoColumns = isDesktop || isTablet;
  const displayName = user?.displayName || 'CulturePass Member';
  const username = user?.username || user?.handle || displayName.toLowerCase().replace(/\s+/g, '') || 'member';
  const appVersion = getAppVersion();
  const appVersionWithBuild = getAppVersionWithBuild();
  const memberMeta = [user?.city, user?.country].filter(Boolean).join(', ') || user?.email || 'Manage your CulturePass profile';
  const tier = String(user?.subscriptionTier ?? 'free');
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'plus':
        return CultureTokens.indigo;
      case 'premium':
      case 'vip':
      case 'elite':
        return CultureTokens.gold;
      case 'pro':
        return CultureTokens.teal;
      case 'sydney-local':
        return colors.success;
      default:
        return colors.textTertiary;
    }
  };

  const tierColor = getTierColor(tier);
  const canTargetCampaigns = hasMinRole('cityAdmin');

  const redoOnboarding = useCallback(async () => {
    const confirmed = await confirmOnboardingRestart();
    if (!confirmed) return;

    if (user?.id) {
      try {
        await updateUserProfile(ONBOARDING_PROFILE_CLEAR_PATCH);
      } catch {
        const failMessage = 'Could not reset your profile preferences. Please try again.';
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(failMessage);
          }
        } else {
          Alert.alert('Reset failed', failMessage);
        }
        return;
      }
    }

    await resetOnboarding();
    router.replace('/(onboarding)/location' as never);
  }, [resetOnboarding, updateUserProfile, user?.id]);

  const signOut = useCallback(() => {
    Alert.alert('Sign out', 'Sign out of CulturePass?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(onboarding)/login');
        },
      },
    ]);
  }, [logout]);

  const coreRows = useMemo<SettingsRow[]>(() => [
    { label: 'Edit Profile', sub: 'Photo, bio, culture, location, and social links', icon: 'create-outline', iconColor: colors.primary, route: '/profile/edit' },
    { label: 'Account', sub: 'Email, username, password, security & deletion', icon: 'person-outline', iconColor: ICON_COLORS.account, route: '/settings/account' },
    { label: 'Privacy & Permissions', sub: 'Visibility, data sharing, activity, and location', icon: 'shield-checkmark-outline', iconColor: ICON_COLORS.privacy, route: '/settings/privacy' },
  ], [colors.primary]);

  const membershipRows = useMemo<SettingsRow[]>(() => [
    { label: 'My Membership', sub: `${tierLabel} plan and upgrades`, icon: 'star-outline', iconColor: tierColor, route: '/membership/upgrade' },
    { label: 'Wallet & Balance', sub: 'Top up and view cashback', icon: 'wallet-outline', iconColor: CultureTokens.teal, route: '/payment/wallet' },
    { label: 'Payment Methods', sub: 'Cards and saved payment options', icon: 'card-outline', iconColor: CultureTokens.indigo, route: '/payment/methods' },
    { label: 'Transaction History', sub: 'Purchases, refunds, and payments', icon: 'receipt-outline', iconColor: colors.textSecondary, route: '/payment/transactions' },
    { label: 'Nation Builders Program', sub: '50% off CulturePass+ for essential workers', icon: 'shield-checkmark-outline', iconColor: CultureTokens.gold, route: '/NationBuildersProgram' },
  ], [colors.textSecondary, tierColor, tierLabel]);

  const preferenceRows = useMemo<SettingsRow[]>(() => [
    { label: 'Notifications', sub: 'Event updates, community news, and reminders', icon: 'notifications-outline', iconColor: ICON_COLORS.alerts, route: '/settings/notifications' },
    { label: 'Appearance', sub: 'System, dark, or light mode', icon: 'color-palette-outline', iconColor: ICON_COLORS.style, route: '/settings/appearance' },
    { label: 'Location & City', sub: 'Regional content and marketplace location', icon: 'location-outline', iconColor: CultureTokens.teal, route: '/settings/location' },
    fromNavItem(settingsAppCalendarSyncItem()),
    { label: 'Redo Onboarding', sub: 'Reset interests, communities, and location setup', icon: 'refresh-circle-outline', iconColor: CultureTokens.violet, action: () => { void redoOnboarding(); } },
  ], [redoOnboarding]);

  const supportRows = useMemo<SettingsRow[]>(() => [
    fromNavItem(settingsHelpCenterItem()),
    { label: 'Contact Support', sub: EMAIL_SUPPORT, icon: 'mail-outline', iconColor: colors.primary, external: `mailto:${EMAIL_SUPPORT}` },
    { label: 'Report a Problem', sub: EMAIL_BUGS, icon: 'flag-outline', iconColor: colors.warning, external: `mailto:${EMAIL_BUGS}?subject=Bug%20Report` },
    { label: 'About CulturePass', icon: 'information-circle-outline', iconColor: ICON_COLORS.muted, route: '/settings/about' },
    { label: 'Rate CulturePass', icon: 'star-outline', iconColor: CultureTokens.gold, external: Platform.OS === 'android' ? 'market://details?id=au.culturepass.co' : 'https://apps.apple.com/app/culturepass/id6742686059' },
    { label: 'Instagram', icon: 'logo-instagram', iconColor: CultureTokens.coral, external: 'https://instagram.com/culturepassapp' },
  ], [colors.primary, colors.warning]);

  const adminRows = useMemo<SettingsRow[]>(() => {
    const rows: SettingsRow[] = [];

    if (isAdmin) {
      rows.push(
        { label: 'Admin Users', sub: 'Manage users and roles', icon: 'people-outline' as IconName, iconColor: ICON_COLORS.admin, route: '/admin/users' },
        { label: 'Platform Console', sub: 'Configuration and operations', icon: 'settings-outline' as IconName, iconColor: CultureTokens.indigo, route: '/admin/platform' }
      );
    }

    if (canTargetCampaigns) {
      rows.push(
        { label: 'Campaign Targeting', sub: 'Dry-run and send targeted push', icon: 'megaphone-outline' as IconName, iconColor: CultureTokens.gold, route: '/admin/notifications' },
        { label: 'Campaign Audit Logs', sub: 'Review admin send history', icon: 'document-text-outline' as IconName, iconColor: colors.warning, route: '/admin/audit-logs' }
      );
    }

    return rows;
  }, [canTargetCampaigns, colors.warning, isAdmin]);

  const guestRows = useMemo<SettingsRow[]>(() => {
    return [
      { label: 'Sign In', sub: 'Access tickets, wallet, and your CulturePass profile', icon: 'log-in-outline', iconColor: colors.primary, route: '/(onboarding)/login' },
      { label: 'Create Account', sub: 'Join CulturePass for free', icon: 'person-add-outline', iconColor: CultureTokens.teal, route: '/(onboarding)/signup' },
    ];
  }, [colors.primary]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationMetadata />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: pageTopPadding,
            paddingBottom: pageBottomPadding,
            paddingHorizontal: useTwoColumns ? layout.hPad : Spacing.md,
          },
        ]}
      >
        <View style={[styles.shell, { maxWidth: useTwoColumns ? 1080 : 680 }]}>
          <View style={styles.header}>
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.72 : 1 },
                Platform.OS === 'web' && { cursor: 'pointer' as never },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>Settings</Text>
              <Text style={[styles.title, { color: colors.text }]}>Profile & app control</Text>
            </View>
            {useTwoColumns && (
              <View style={{ display: 'flex' as any }}>
                <Text style={[styles.desktopHintText, { color: colors.textTertiary }]}>All settings in one view</Text>
              </View>
            )}
          </View>

          {isAuthenticated && user ? <Pressable
            onPress={() => router.push('/profile/edit' as never)}
            style={({ pressed }) => [
              styles.hero,
              { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.88 : 1 },
              Platform.OS === 'web' && { cursor: 'pointer' as never },
              useTwoColumns && { padding: Spacing.xl },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <View style={[styles.avatarWrap, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>{displayName[0]?.toUpperCase() ?? 'C'}</Text>
              )}
            </View>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
              <Text style={[styles.heroMeta, { color: colors.textSecondary }]} numberOfLines={1}>@{String(username).replace(/^@/, '')}</Text>
              <Text style={[styles.heroSub, { color: colors.textTertiary }]} numberOfLines={1}>{memberMeta}</Text>
              <View style={[styles.tierBadge, { backgroundColor: softColor(tierColor), borderColor: `${tierColor}55` }]}>
                <Ionicons name="star" size={10} color={tierColor} />
                <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
              </View>
            </View>
            <View style={[styles.heroAction, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </View>
          </Pressable> : (
            <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.cardBorder }, useTwoColumns && { padding: Spacing.xl }]}>
              <View style={[styles.avatarWrap, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                <Ionicons name="person-circle-outline" size={46} color={colors.primary} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>Welcome to CulturePass</Text>
                <Text style={[styles.heroSub, { color: colors.textTertiary }]} numberOfLines={2}>
                  Sign in to manage your profile, tickets, wallet, and cultural events.
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.grid, useTwoColumns && styles.gridWide]}>
            <View style={styles.column}>
              {isAuthenticated ? <Section title="Account Suite" rows={coreRows} /> : <Section title="Account" rows={guestRows} />}
              {isAuthenticated ? <Section title="Membership & Payments" rows={membershipRows} /> : null}
              {isAuthenticated ? <Section title="Preferences" rows={preferenceRows} /> : null}
              {isAuthenticated ? <Section title="My Activity" rows={settingsMyContentItems().map(fromNavItem)} /> : null}
            </View>
            <View style={styles.column}>
              {isOrganizer ? <Section title="Host Workspace" rows={settingsOrganizerHostHubItems().map(fromNavItem)} /> : null}
              <Section title="Admin Tools" rows={adminRows} />
              <Section title="Support" rows={supportRows} />
              <Section
                title="Legal"
                rows={[
                  { label: 'Privacy Policy', icon: 'lock-closed-outline', iconColor: ICON_COLORS.muted, route: '/legal/privacy' },
                  { label: 'Terms of Service', icon: 'document-text-outline', iconColor: ICON_COLORS.muted, route: '/legal/terms' },
                  { label: 'Cookie Policy', icon: 'finger-print-outline', iconColor: CultureTokens.coral, route: '/legal/cookies' },
                  { label: 'Community Guidelines', icon: 'people-circle-outline', iconColor: CultureTokens.teal, route: '/legal/guidelines' },
                ]}
              />
              <Section
                title="About"
                rows={[
                  { label: 'About CulturePass', icon: 'information-circle-outline', iconColor: ICON_COLORS.muted, route: '/settings/about' },
                  { label: 'App Version', icon: 'phone-portrait-outline', iconColor: colors.textSecondary, rightText: appVersionWithBuild },
                ]}
              />
              {isAuthenticated ? (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Row row={{ label: 'Sign Out', icon: 'log-out-outline', iconColor: colors.error, destructive: true, action: signOut }} isLast />
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>{APP_NAME_AU} · v{appVersion}</Text>
            {user?.id ? <Text style={[styles.footerMeta, { color: colors.textTertiary }]}>ID: {user.id.slice(-8).toUpperCase()}</Text> : null}
            <Text style={[styles.footerMeta, { color: colors.textTertiary }]}>{MADE_IN_WITH_COUNTRY}</Text>
            <Text style={[styles.footerMeta, { color: colors.textTertiary }]}>Available in {PRIMARY_REGION}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  shell: { width: '100%', alignSelf: 'center', gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontSize: 22, lineHeight: 28, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  desktopHint: { display: 'none' as any }, // shown only on wide via inline style when needed
  desktopHintText: { fontSize: 12, fontFamily: FontFamily.regular, fontStyle: 'italic' },

  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  avatar: { width: 68, height: 68 },
  avatarInitial: { fontSize: 26, fontFamily: FontFamily.bold },
  heroCopy: { flex: 1, minWidth: 0, gap: 2 },
  heroName: { fontSize: 19, lineHeight: 24, fontFamily: FontFamily.bold, letterSpacing: -0.1 },
  heroMeta: { fontSize: 14, lineHeight: 18, fontFamily: FontFamily.medium },
  heroSub: { fontSize: 13, lineHeight: 17, fontFamily: FontFamily.regular },
  tierBadge: {
    alignSelf: 'flex-start',
    marginTop: 5,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierText: { fontSize: 10, lineHeight: 13, fontFamily: FontFamily.bold, textTransform: 'capitalize' },
  heroAction: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },

  grid: { gap: Spacing.md },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg },
  column: { flex: 1, gap: Spacing.md, minWidth: 0 },

  section: { gap: Spacing.xs },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    paddingHorizontal: Spacing.xs,
    marginBottom: 2,
  },
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },

  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 1 },
  rowLabel: { fontSize: 15, lineHeight: 20, fontFamily: FontFamily.semibold, letterSpacing: 0 },
  rowSub: { fontSize: 12.5, lineHeight: 17, fontFamily: FontFamily.regular },
  rowRight: { fontSize: 13, fontFamily: FontFamily.medium, flexShrink: 0 },
  divider: { position: 'absolute', left: 70, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },

  footer: { alignItems: 'center', gap: 3, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  footerText: { fontSize: 12, fontFamily: FontFamily.medium },
  footerMeta: { fontSize: 11, fontFamily: FontFamily.regular, opacity: 0.75 },
});