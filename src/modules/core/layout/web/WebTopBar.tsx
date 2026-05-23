import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, usePathname, useSegments } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors, useIsDark } from "@/hooks/useColors";
import { CultureTokens, HeaderTokens } from "@/design-system/tokens/theme";
import { useAuth } from "@/lib/auth";
import { LocationPicker } from "@/modules/core/components";
import { useLayout } from "@/hooks/useLayout";
import { routeWithRedirect } from "@/lib/routes";
import { BrandLockup } from "@/design-system/ui/BrandLockup";
import { getAppVersionWithBuild, MADE_IN } from "@/lib/app-meta";
import Breadcrumb from "@/components/ui/Breadcrumb";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TabItem {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TAB_ROUTES: TabItem[] = [
  { label: 'Discover',   route: '/(tabs)',            icon: 'compass-outline' },
  { label: 'Calendar',   route: '/(tabs)/calendar',   icon: 'calendar-outline' },
  { label: 'Community',  route: '/(tabs)/community',  icon: 'people-outline' },
  { label: 'Perks',      route: '/perks',             icon: 'gift-outline' },
];

// Sidebar menu items shown on mobile/tablet top-bar menu modal
const MENU_SECTIONS = [
  {
    heading: 'Browse',
    items: [
      { label: 'Discover',      icon: 'compass-outline',      route: '/(tabs)' },
      { label: 'Daily Deals',   icon: 'pricetag-outline',       route: '/CultureShop' },
      { label: 'CultureMarket', icon: 'storefront-outline',    route: '/CultureMarket' },
      { label: 'CultureX',      icon: 'search-outline',        route: '/explore' },
      { label: 'Calendar',      icon: 'calendar-outline',      route: '/(tabs)/calendar' },
      { label: 'Community',   icon: 'people-outline',        route: '/(tabs)/community' },
      { label: 'Perks',         icon: 'gift-outline',          route: '/perks' },
      { label: 'Map',           icon: 'map-outline',           route: '/map' },
      { label: 'Saved',         icon: 'bookmark-outline',      route: '/saved' },
      { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'MySpace',  icon: 'person-outline',   route: '/(tabs)/my-space' },
      { label: 'Tickets',  icon: 'ticket-outline',   route: '/tickets' },
      { label: 'Wallet',   icon: 'wallet-outline',   route: '/payment/wallet' },
      { label: 'Settings', icon: 'settings-outline', route: '/settings' },
    ],
  },
  {
    heading: 'Info',
    items: [
      { label: 'Help & Support',       icon: 'help-circle-outline',    route: '/help' },
      { label: 'Terms & Privacy',      icon: 'document-text-outline',  route: '/legal/terms' },
      { label: 'Community Guidelines', icon: 'shield-checkmark-outline', route: '/legal/guidelines' },
      { label: 'About CulturePass',    icon: 'information-circle-outline', route: '/about' },
    ],
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function WebTopBar() {
  const colors = useColors();
  const isDark = useIsDark();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDesktop } = useLayout();
  const pathname = usePathname();
  const segments = useSegments();
  const appVersion = getAppVersionWithBuild();

  // Breadcrumb path: segments filtered to non-group, non-tab segments (Req 11.3)
  const breadcrumbPath = segments
    .filter((s) => !s.startsWith('('))
    .map((s) => `/${s}`);

  const displayName = user?.displayName ?? user?.username ?? user?.id?.slice(0, 8) ?? 'You';
  const initials = displayName.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const isTabActive = (route: string) => {
    const normalizedPath = pathname === '/' ? '/(tabs)' : pathname;
    return normalizedPath === route || (route !== '/(tabs)' && normalizedPath.startsWith(route));
  };

  const handleNav = (route: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View>
    <Breadcrumb path={breadcrumbPath} />
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={isDark ? ['#0A0A1A', '#0D1033'] : [colors.surface, colors.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Subtle indigo glow at bottom edge */}
      <View style={styles.bottomGlow} pointerEvents="none" />

      {/* ── Left: Avatar/Menu + Logo + Location ── */}
      <View style={styles.left}>
        {/* Avatar / Menu trigger */}
        <Pressable
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
            styles.avatarBtn,
            hovered && styles.avatarBtnHovered,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel={isAuthenticated ? 'Open profile menu' : 'Open menu'}
          onPress={() => setMenuVisible(true)}
        >
          {isAuthenticated && user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
          ) : isAuthenticated ? (
            <LinearGradient
              colors={[CultureTokens.indigo, CultureTokens.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          {(!isAuthenticated || (!user?.avatarUrl)) && (
            <View style={[StyleSheet.absoluteFill, styles.avatarInner]}>
              {isAuthenticated
                ? <Text style={styles.avatarInitials}>{initials}</Text>
                : <Ionicons name="menu" size={20} color={colors.text} />
              }
            </View>
          )}
        </Pressable>

        {/* Logo */}
        <Pressable
          style={({ pressed }: { pressed: boolean; hovered?: boolean }) => [styles.logoBlock, pressed && { opacity: 0.8 }]}
          onPress={() => handleNav('/(tabs)')}
          accessibilityLabel="CulturePass Home"
        >
          <BrandLockup size="sm" withTagline />
        </Pressable>

        {/* Location picker (desktop only) */}
        {isDesktop && (
          <View style={styles.locationWrap}>
            <LocationPicker variant="icon" />
          </View>
        )}
      </View>

      {/* ── Center: Navigation tabs ── */}
      <View style={styles.center}>
        {TAB_ROUTES.map(({ label, route, icon }) => {
          const active = isTabActive(route);
          return (
            <Pressable
              key={label}
              style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.tab, hovered && styles.tabHovered]}
              onPress={() => handleNav(route)}
              accessibilityLabel={label}
              accessibilityRole="link"
            >
              <Ionicons
                name={active ? (icon.replace('-outline', '') as any) : icon}
                size={15}
                color={active ? CultureTokens.teal : colors.textTertiary}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
              {active && <View style={styles.activeUnderline} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── Right: Action buttons ── */}
      <View style={styles.right}>
        <Pressable
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.iconBtn, hovered && styles.iconBtnHovered, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Search"
          onPress={() => handleNav('/search')}
        >
          <Ionicons name="search-outline" size={19} color={colors.text} />
        </Pressable>

        <Pressable
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.iconBtn, hovered && styles.iconBtnHovered, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Notifications"
          onPress={() => handleNav('/notifications')}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.text} />
        </Pressable>

        <Pressable
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.iconBtn, hovered && styles.iconBtnHovered, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Map"
          onPress={() => handleNav('/map')}
        >
          <Ionicons name="map-outline" size={19} color={CultureTokens.teal} />
        </Pressable>

        {!isAuthenticated ? (
          <Pressable
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.signInBtn, hovered && styles.signInBtnHovered, pressed && { opacity: 0.88 }]}
            accessibilityLabel="Sign In"
            onPress={() => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any)}
          >
            <LinearGradient
              colors={[CultureTokens.indigo, '#3D4FCC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="person-outline" size={14} color="#fff" />
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.iconBtn, hovered && styles.iconBtnHovered, pressed && { opacity: 0.7 }]}
            accessibilityLabel="MySpace"
            onPress={() => handleNav('/(tabs)/my-space')}
          >
            <Ionicons name="person-circle-outline" size={22} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* ── Slide-in Menu Modal ── */}
      <Modal
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        animationType="none"
      >
        <View style={styles.menuOverlay}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.menuBackdrop]}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.menuPanel, { backgroundColor: colors.surface }]}>
            {/* Menu header */}
            <LinearGradient
              colors={isDark ? ['#0A0A1A', '#0D1033'] : [colors.surface, colors.backgroundSecondary]}
              style={styles.menuPanelHeader}
            >
              <View style={styles.menuPanelHeaderInner}>
                {isAuthenticated ? (
                  <Pressable
                    style={styles.menuUserRow}
                    onPress={() => { setMenuVisible(false); handleNav('/(tabs)/my-space'); }}
                  >
                    <View style={styles.menuAvatarWrap}>
                      {user?.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={styles.menuAvatarImg} />
                      ) : (
                        <LinearGradient
                          colors={[CultureTokens.indigo, CultureTokens.teal]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      {!user?.avatarUrl && (
                        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={styles.menuAvatarInitials}>{initials}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.menuUserName} numberOfLines={1}>{displayName}</Text>
                      <Text style={styles.menuUserEmail} numberOfLines={1}>{user?.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                ) : (
                  <View style={{ gap: 12 }}>
                    <View style={styles.menuLogoRow}>
                      <LinearGradient
                        colors={[CultureTokens.indigo, CultureTokens.coral]}
                        style={styles.menuLogoBg}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                      >
                        <Ionicons name="globe-outline" size={16} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.menuLogoText}>CulturePass</Text>
                    </View>
                    <Pressable
                      style={styles.menuSignInBtn}
                      onPress={() => {
                        setMenuVisible(false);
                        router.push(routeWithRedirect('/(onboarding)/login', pathname) as any);
                      }}
                    >
                      <LinearGradient
                        colors={[CultureTokens.indigo, '#3D4FCC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons name="person-outline" size={16} color="#fff" />
                      <Text style={styles.menuSignInText}>Sign In / Register</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Location picker on mobile */}
            {!isDesktop && (
              <View style={[styles.menuLocationWrap, { borderBottomColor: colors.borderLight }]}>
                <LocationPicker />
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuScrollContent}
            >
              {MENU_SECTIONS.map((section) => (
                <View key={section.heading} style={styles.menuSection}>
                  <Text style={[styles.menuSectionLabel, { color: colors.textTertiary }]}>
                    {section.heading.toUpperCase()}
                  </Text>
                  <View style={[styles.menuSectionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    {section.items.map((item, idx) => (
                      <React.Fragment key={item.route}>
                        <Pressable
                          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                            styles.menuItem,
                            (pressed || hovered) && { backgroundColor: colors.primarySoft },
                          ]}
                          onPress={() => {
                            setMenuVisible(false);
                            handleNav(item.route);
                          }}
                        >
                          <View style={[styles.menuItemIcon, { backgroundColor: colors.borderLight }]}>
                            <Ionicons name={item.icon as any} size={16} color={colors.textSecondary} />
                          </View>
                          <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
                          <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
                        </Pressable>
                        {idx < section.items.length - 1 && (
                          <View style={[styles.menuItemDivider, { backgroundColor: colors.divider }]} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              ))}

              {isAuthenticated && (
                <Pressable
                  style={({ pressed }: { pressed: boolean; hovered?: boolean }) => [
                    styles.menuLogoutBtn,
                    { borderColor: colors.error + '40' },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    setMenuVisible(false);
                    logout();
                  }}
                >
                  <Ionicons name="log-out-outline" size={17} color={colors.error} />
                  <Text style={[styles.menuLogoutText, { color: colors.error }]}>Sign Out</Text>
                </Pressable>
              )}

              <View style={styles.menuFooter}>
                <Text style={[styles.menuFooterText, { color: colors.textTertiary }]}>
                  {`CulturePass · v${appVersion} · ${MADE_IN}`}
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.menuCloseCorner, { borderColor: colors.borderLight }]}
              onPress={() => setMenuVisible(false)}
              accessibilityLabel="Close menu"
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 24,
    minHeight: HeaderTokens.height,
    gap: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(20px) saturate(1.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 10,
      },
    }),
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: CultureTokens.indigo + '60',
  },

  // ── Left ──
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatarImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 164,
    flexShrink: 1,
  },
  locationWrap: {
    marginLeft: 16,
  },

  // ── Center ──
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: 'relative',
  },
  tabHovered: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tabIcon: {
    opacity: 0.9,
  },
  tabText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.1,
  },
  tabTextActive: {
    color: CultureTokens.teal,
    fontFamily: 'Poppins_600SemiBold',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 4,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: CultureTokens.teal,
    borderRadius: 1,
  },

  // ── Right ──
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 4,
  },
  signInBtnHovered: {
    opacity: 0.9,
  },
  signInText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
  },

  // ── Menu Modal ──
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  menuBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuPanel: {
    width: 320,
    height: '100%',
    ...Platform.select({
      web: { boxShadow: '4px 0 32px rgba(0,0,0,0.3)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 4, height: 0 },
        elevation: 12,
      },
    }),
  },
  menuPanelHeader: {
    paddingBottom: 20,
  },
  menuPanelHeaderInner: {
    padding: 20,
    paddingTop: 24,
  },
  menuUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  menuAvatarImg: {
    width: '100%',
    height: '100%',
  },
  menuAvatarInitials: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  menuUserName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  menuUserEmail: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  menuLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuLogoBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLogoText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  menuSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuSignInText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  menuLocationWrap: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuScrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  menuSection: {
    gap: 6,
  },
  menuSectionLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  menuSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  menuItemDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  menuLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  menuLogoutText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  menuFooter: {
    alignItems: 'center',
    paddingTop: 8,
    opacity: 0.4,
  },
  menuFooterText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  menuCloseCorner: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
