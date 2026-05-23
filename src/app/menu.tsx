import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform, LayoutAnimation,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import type { SubmitType } from '@/features/submit/config';
import { canUserCreateListingType } from '@/features/submit/creatorAccess';
import { CultureTokens } from '@/design-system/tokens/theme';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { APP_NAME, MADE_IN, getAppVersionWithBuild } from '@/lib/app-meta';
import {
  MENU_ATTENDEE_SECTION,
  menuHostHubSection,
  type ExperienceMenuSection,
} from '@/constants/navigation/experienceNav';
import { useSafeBack } from '@/lib/navigation';
import { M3TopAppBar, M3Card, M3Button } from '@/design-system/ui';

// LayoutAnimation: `setLayoutAnimationEnabledExperimental` is a no-op on the New Architecture
// and logs a warning; `configureNext` below still runs on supported paths.

const isWeb = Platform.OS === 'web';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MenuEntry {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color?: string;
  badge?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
  /** When set, only shown if the user may create this listing type in Creator Studio */
  creatorSubmitType?: SubmitType;
  /** Organizer / business roles — gate check-in & scanning */
  requiresOrganizer?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuEntry[];
}

// ── Data ───────────────────────────────────────────────────────────────────────

function experienceSectionToMenu(sec: ExperienceMenuSection): MenuSection {
  return {
    title: sec.title,
    items: sec.items.map((it) => ({
      id: it.id,
      label: it.label,
      icon: it.icon,
      route: it.route,
      color: it.color,
      requiresAuth: it.requiresAuth,
      requiresOrganizer: it.requiresOrganizer,
      requiresAdmin: it.requiresAdmin,
      requiresSuperAdmin: it.requiresSuperAdmin,
    })),
  };
}

/** Discover, create, tools, admin — Attendee + Host Hub are prepended from `experienceNav`. */
const MENU_CORE_SECTIONS: MenuSection[] = [
  {
    title: 'Account & profile',
    items: [
      { id: 'profile', label: 'MySpace',           icon: 'person-circle-outline', route: '/(tabs)/my-space', requiresAuth: true },
      { id: 'wallet',  label: 'Wallet & Rewards',  icon: 'wallet-outline',        route: '/payment/wallet',  requiresAuth: true, color: CultureTokens.teal },
    ],
  },
  {
    title: 'Discover',
    items: [
      { id: 'cultureshop', label: 'CultureShop', icon: 'pricetag-outline', route: '/CultureShop', color: CultureTokens.gold },
      { id: 'culturemarket', label: 'CultureMarket', icon: 'storefront-outline', route: '/CultureMarket', color: CultureTokens.coral },
      { id: 'my-council',  label: 'My Council',   icon: 'map-outline',         route: '/my-council' },
      { id: 'events',      label: 'Events',       icon: 'calendar-outline',    route: '/events' },
      { id: 'directory',   label: 'Directory',    icon: 'grid-outline',        route: '/(tabs)/directory' },
      { id: 'community',   label: 'Community',  icon: 'people-outline',      route: '/(tabs)/community' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'notifications', label: 'Notifications inbox', icon: 'mail-outline', route: '/notifications', color: CultureTokens.coral, badge: 'Quick' },
      { id: 'appearance', label: 'Appearance', icon: 'color-palette-outline', route: '/settings/appearance', color: CultureTokens.indigo, badge: 'Quick' },
      { id: 'help',    label: 'Support & Help',  icon: 'help-circle-outline',     route: '/help' },
      { id: 'settings',label: 'App Settings',    icon: 'settings-outline',        route: '/settings' },
    ],
  },
];

// ── Row component ──────────────────────────────────────────────────────────────

function MenuRow({ item, m3Colors }: { item: MenuEntry; m3Colors: ReturnType<typeof useM3Colors> }) {
  const accent = item.color ?? m3Colors.onSurface;
  const handlePress = () => {
    if (!isWeb) Haptics.selectionAsync();
    router.push(item.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        {
          backgroundColor: 'transparent',
          borderLeftColor: 'transparent',
        },
        hovered && {
          backgroundColor: m3Colors.surfaceContainerHigh,
          borderLeftColor: accent + '66',
          transform: [{ translateX: 2 }],
        },
        pressed && {
          backgroundColor: m3Colors.surfaceContainerHighest,
          borderLeftColor: accent,
          transform: [{ translateX: 4 }],
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: accent + '18' }]}>
        <Ionicons name={item.icon} size={19} color={accent} />
      </View>
      <Text style={[styles.rowLabel, { color: m3Colors.onSurface }]}>{item.label}</Text>
      {item.badge && (
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={14} color={m3Colors.onSurfaceVariant} />
    </Pressable>
  );
}

// ── Collapsible section ─────────────────────────────────────────────────────────

function CollapsibleSection({
  section,
  m3Colors,
  defaultCollapsed = false,
}: {
  section: MenuSection;
  m3Colors: ReturnType<typeof useM3Colors>;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((v) => !v);
    if (!isWeb) Haptics.selectionAsync();
  }, []);

  return (
    <View style={styles.section}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        style={({ pressed }: { pressed: boolean }) => [styles.sectionHeaderRow, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.sectionLabel, { color: m3Colors.onSurfaceVariant }]}>
          {section.title.toUpperCase()}
        </Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={13}
          color={m3Colors.onSurfaceVariant}
        />
      </Pressable>
      {!collapsed && (
        <M3Card variant="filled" style={[styles.sectionCard, { borderColor: m3Colors.outlineVariant, backgroundColor: m3Colors.surfaceContainerLow }]}>
          {section.title === 'Tools' ? (
            <View style={styles.quickContextRow}>
              <Text style={[styles.quickContextText, { color: m3Colors.onSurfaceVariant }]}>Quick actions</Text>
            </View>
          ) : section.title === 'Attendee' ? (
            <View style={styles.quickContextRow}>
              <Text style={[styles.quickContextText, { color: m3Colors.onSurfaceVariant }]}>Tickets, calendar, reminders</Text>
            </View>
          ) : section.title === 'Host Hub' ? (
            <View style={styles.quickContextRow}>
              <Text style={[styles.quickContextText, { color: m3Colors.onSurfaceVariant }]}>List events & check-in</Text>
            </View>
          ) : null}
          {section.items.map((item, idx) => (
            <React.Fragment key={item.id}>
              <MenuRow item={item} m3Colors={m3Colors} />
              {idx < section.items.length - 1 && (
                <View style={[styles.divider, { backgroundColor: m3Colors.outlineVariant }]} />
              )}
            </React.Fragment>
          ))}
        </M3Card>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const closeMenu = useSafeBack();
  const insets      = useSafeAreaInsets();
  const m3Colors    = useM3Colors();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const appVersionWithBuild = getAppVersionWithBuild();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAdmin, isSuperAdmin, isOrganizer } = useRole();

  const visibleSections = useMemo<MenuSection[]>(() => {
    const head: MenuSection[] = [
      experienceSectionToMenu(MENU_ATTENDEE_SECTION),
      experienceSectionToMenu(menuHostHubSection(isOrganizer)),
    ];
    const combined = [...head, ...MENU_CORE_SECTIONS];
    return combined
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiresAuth && !isAuthenticated) return false;
          if (item.requiresOrganizer && !isOrganizer) return false;
          if (item.requiresAdmin && !isAdmin) return false;
          if (item.requiresSuperAdmin && !isSuperAdmin) return false;
          if (item.creatorSubmitType != null) {
            const ok = canUserCreateListingType(item.creatorSubmitType, { isAdmin, isOrganizer });
            if (!ok) return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [isAuthenticated, isAdmin, isSuperAdmin, isOrganizer]);
  const desktopPanelWidth = useMemo(
    () => (isDesktop ? Math.min(contentWidth, 500) : undefined),
    [isDesktop, contentWidth],
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsLoggingOut(true);
    await logout();
    router.replace('/(onboarding)/login');
  };

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Account | CulturePass', headerShown: false }} />

      <View style={[styles.root, { backgroundColor: m3Colors.background }]}>

        <M3TopAppBar
          title="Account"
          onBack={() => closeMenu()}
          variant="center-aligned"
          webChromeless
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + (isWeb ? 12 : 48) },
            isDesktop && { width: desktopPanelWidth, alignSelf: 'center' as const },
          ]}
        >
          {/* ── Profile card ── */}
          {isAuthenticated && user ? (
            <Pressable
              onPress={() => { if (!isWeb) Haptics.selectionAsync(); router.push('/(tabs)/my-space'); }}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <M3Card variant="elevated" style={styles.profileCard}>
                <Image
                  source={{ uri: user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.username || 'U') + '&background=4F46E5&color=fff' }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: m3Colors.onSurface }]} numberOfLines={1}>
                    {user.displayName || user.username}
                  </Text>
                  <Text style={[styles.profileHandle, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
                    @{user.handle || user.username}
                  </Text>
                  {user.subscriptionTier && user.subscriptionTier !== 'free' && (
                    <View style={[styles.tierBadge, { backgroundColor: CultureTokens.gold + '25', borderColor: CultureTokens.gold + '60' }]}>
                      <Ionicons name="star" size={10} color={CultureTokens.gold} />
                      <Text style={[styles.tierText, { color: CultureTokens.gold }]}>
                        {String(user.subscriptionTier).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={m3Colors.onSurfaceVariant} />
              </M3Card>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => { if (!isWeb) Haptics.selectionAsync(); router.push('/(onboarding)/login'); }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <M3Card variant="elevated" style={styles.profileCard}>
                <View style={[styles.avatar, styles.guestAvatar, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
                  <Ionicons name="person" size={24} color={m3Colors.onSurfaceVariant} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: m3Colors.onSurface }]}>Guest</Text>
                  <Text style={[styles.profileHandle, { color: m3Colors.primary }]}>Sign in or create account →</Text>
                </View>
                <Ionicons name="log-in-outline" size={22} color={m3Colors.primary} />
              </M3Card>
            </Pressable>
          )}

          {/* ── Sections ── */}
          {visibleSections.map((section) => (
            <CollapsibleSection
              key={section.title}
              section={section}
              m3Colors={m3Colors}
              defaultCollapsed={section.title === 'Create'}
            />
          ))}

          {/* ── Logout ── */}
          {isAuthenticated && (
            <M3Button
              variant="outlined"
              onPress={handleLogout}
              disabled={isLoggingOut}
              style={[styles.logoutBtn, { borderColor: m3Colors.error }]}
              labelStyle={{ color: m3Colors.error }}
              leftIcon="log-out-outline"
            >
              {isLoggingOut ? 'Signing out…' : 'Sign Out'}
            </M3Button>
          )}

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Image source={require('@/assets/images/culturepass-logo.png')} style={styles.footerLogo} />
            <Text style={[styles.footerText, { color: m3Colors.onSurfaceVariant }]}>
              {`${APP_NAME} · v${appVersionWithBuild} · ${MADE_IN}`}
            </Text>
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'web' ? 6 : 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: {
    fontSize: Platform.OS === 'web' ? 22 : 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingTop: 16, gap: 0 },

  /* Profile card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: Platform.OS === 'web' ? 10 : 18,
    gap: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 16 },
  guestAvatar: { alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 16, fontFamily: 'Poppins_700Bold', letterSpacing: -0.2 },
  profileHandle: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  tierText: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },

  /* Sections */
  section: { marginBottom: Platform.OS === 'web' ? 10 : 14 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  quickContextRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  quickContextText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    borderLeftWidth: 2.5,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 28,
  },
  logoutText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  /* Footer */
  footer: { alignItems: 'center', gap: 6, opacity: 0.5, marginBottom: 8 },
  footerLogo: { width: 28, height: 28, borderRadius: 8 },
  footerText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
});
