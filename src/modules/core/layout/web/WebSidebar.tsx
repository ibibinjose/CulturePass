import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, TextInput } from 'react-native';
import { usePathname, router, useRootNavigationState } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useCouncil } from '@/hooks/useCouncil';
import { CultureTokens, gradients, Radius, Spacing, Layout } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { Image } from 'expo-image';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Card } from '@/design-system/ui/M3Card';
import { AppearanceModeToggle } from '@/design-system/ui/AppearanceModeToggle';
import { APP_NAME, APP_WEB_TAGLINE } from '@/lib/app-meta';
import {
  SIDEBAR_ATTENDEE_LINKS,
  SIDEBAR_BROWSE_LINKS,
  SIDEBAR_HOST_ASPIRING_LINKS,
  SIDEBAR_HOST_HUB_LINKS,
  SIDEBAR_ADMIN_LINKS,
  SIDEBAR_SUPERADMIN_LINKS,
  type SidebarNavLink,
} from '@/constants/navigation/experienceNav';
import { withAlpha } from '@/lib/withAlpha';

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = Layout.sidebarWidth;
const RAIL_WIDTH = Layout.sidebarRailWidth;
const ACTIVE_COLOR = CultureTokens.violet;
const ACTIVE_GRAD: [string, string] = [CultureTokens.violet, CultureTokens.coral];
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'culturepass:web-sidebar-collapsed';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarLogoMark({ size, borderRadius }: { size: number; borderRadius: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, borderRadius, overflow: 'hidden', flexShrink: 0, alignSelf: 'center' }}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          margin: 1.5,
          flex: 1,
          borderRadius: borderRadius - 1,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('@/assets/images/culturepass-logo.png')}
          style={[
            { width: size - 8, height: size - 8 },
            Platform.OS === 'web' ? ({ objectFit: 'contain' } as object) : null,
          ]}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

interface NavItem extends SidebarNavLink {}

function normalizeRoute(route: string): string {
  return route
    .replace('/(tabs)/', '/')
    .replace('/(tabs)', '/')
    .replace(/\/index$/, '') || '/';
}

const MAIN_NAV: NavItem[] = [
  { label: 'Discover', icon: 'compass-outline', iconActive: 'compass', route: '/(tabs)' },
  { label: 'My City', icon: 'location-outline', iconActive: 'location', route: '/(tabs)/city' },
  { label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar', route: '/(tabs)/calendar' },
  { label: 'Community', icon: 'people-circle-outline', iconActive: 'people-circle', route: '/(tabs)/community' },
];

const ATTENDEE_NAV: NavItem[] = SIDEBAR_ATTENDEE_LINKS;
const BROWSE_NAV: NavItem[] = SIDEBAR_BROWSE_LINKS;

const VENUE_NAV: NavItem[] = [
  { label: 'Venue Hub', icon: 'storefront-outline', iconActive: 'storefront', route: '/dashboard/venue', matchPrefix: true },
];

const SPONSOR_NAV: NavItem[] = [
  { label: 'Sponsor Hub', icon: 'ribbon-outline', iconActive: 'ribbon', route: '/dashboard/sponsor', matchPrefix: true },
];

const ADMIN_NAV: NavItem[] = SIDEBAR_ADMIN_LINKS as NavItem[];
const SUPERADMIN_NAV: NavItem[] = SIDEBAR_SUPERADMIN_LINKS as NavItem[];

const BOTTOM_NAV: NavItem[] = [
  { label: 'About', icon: 'information-circle-outline', iconActive: 'information-circle', route: '/about' },
  { label: 'Our Story', icon: 'book-outline', iconActive: 'book', route: '/founder' },
  { label: 'Settings', icon: 'settings-outline', iconActive: 'settings', route: '/settings' },
  { label: 'Help', icon: 'help-circle-outline', iconActive: 'help-circle', route: '/help' },
];

const PROFILE_ACTIONS = [
  { key: 'edit', label: 'Edit Profile', icon: 'create-outline' as const, route: '/profile/edit' },
  { key: 'qr', label: 'Digital ID', icon: 'qr-code-outline' as const, route: '/profile/qr' },
  { key: 'network', label: 'Network', icon: 'people-outline' as const, route: '/network' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' as const, route: '/payment/wallet' },
] as const;

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarWithRing({
  avatarUrl,
  initials,
  size = 32,
  ringWidth = 2,
  recyclingKey,
}: {
  avatarUrl?: string | null;
  initials: string;
  size?: number;
  ringWidth?: number;
  /** Pass a changing value (e.g. user.updatedAt or timestamp) to force expo-image to re-fetch after avatar update */
  recyclingKey?: string | number;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const innerSize = size - ringWidth * 2 - 2;
  const cutoutBg = isDark ? withAlpha(CultureTokens.indigo, 0.08) : colors.surfaceElevated || '#F8F1E9';

  // Force fresh fetch on web after profile image change (expo-image caching can be stubborn)
  const resolvedUri = avatarUrl
    ? (recyclingKey ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${recyclingKey}` : avatarUrl)
    : null;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
          backgroundColor: cutoutBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {resolvedUri ? (
          <Image
            source={{ uri: resolvedUri }}
            style={{ width: innerSize, height: innerSize }}
            recyclingKey={recyclingKey ? String(recyclingKey) : undefined}
            cachePolicy="none"
          />
        ) : (
          <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: Math.round(innerSize * 0.38), fontFamily: 'Poppins_700Bold', color: '#fff' }}>
                {initials}
              </Text>
            </View>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useLiveClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWeatherSummary(city?: string): string {
  const [summary, setSummary] = useState<string>('');
  useEffect(() => {
    const trimmed = city?.trim();
    if (!trimmed) { setSummary(''); return; }
    const postcodes = getPostcodesByPlace(trimmed);
    if (!postcodes || postcodes.length === 0) { setSummary(''); return; }
    const place = postcodes[0];
    const controller = new AbortController();
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('weather');
        const data = await res.json() as { current?: { temperature_2m?: number; weather_code?: number } };
        const temp = data.current?.temperature_2m;
        const code = data.current?.weather_code;
        const label = code === 0 ? 'Clear' : code === 1 || code === 2 ? 'Partly Cloudy' : code === 3 ? 'Cloudy' : '';
        setSummary(typeof temp === 'number' ? `${Math.round(temp)}°C${label ? ` · ${label}` : ''}` : '');
      } catch { setSummary(''); }
    };
    void fetchWeather();
    const rid = setInterval(() => { void fetchWeather(); }, 10 * 60_000);
    return () => { controller.abort(); clearInterval(rid); };
  }, [city]);
  return summary;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WebSidebar() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hydration fix: Don't use router hooks or localStorage until mounted on client
  if (!isMounted) {
    return (
      <View style={[s.sidebar, { width: SIDEBAR_WIDTH, opacity: 0 }]} />
    );
  }

  return <WebSidebarContent />;
}

/**
 * Hook to safely access navigation state even if the context is missing
 */
function useSafeNavigation() {
  const [pathname, setPathname] = useState('/');
  const [isReady, setIsReady] = useState(false);

  // We use the global router which is always available in expo-router
  // but we fallback to window.location for the pathname if hooks fail.

  const routerPathname = useOptionalPathname();
  const navState = useOptionalRootNavigationState();

  useEffect(() => {
    if (navState?.key) {
      setIsReady(true);
    }
    if (routerPathname) {
      setPathname(routerPathname);
    } else if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, [navState?.key, routerPathname]);

  return { pathname, isReady };
}

function useOptionalPathname() {
  try {
    return usePathname();
  } catch (e) {
    return null;
  }
}

function useOptionalRootNavigationState() {
  try {
    return useRootNavigationState();
  } catch (e) {
    return null;
  }
}

function WebSidebarContent() {
  const { pathname, isReady } = useSafeNavigation();
  const colors = useColors();
  const isDark = useIsDark();
  const { user, logout, isAuthenticated } = useAuth();
  const { isOrganizer, isAdmin, isSuperAdmin, role } = useRole();
  const isVenue = role === 'business';
  const isSponsor = role === 'sponsor';
  const { data: councilData } = useCouncil();

  const friendlyRole = useMemo(() => {
    if (isSuperAdmin) return 'Platform Admin';
    if (isAdmin) return 'Admin';
    if (role === 'cityAdmin') return 'City Admin';
    if (role === 'moderator') return 'Moderator';
    if (role === 'business') return 'Venue';
    if (role === 'sponsor') return 'Sponsor';
    if (isOrganizer) return 'Host';
    return 'Member';
  }, [isSuperAdmin, isAdmin, role, isOrganizer]);

  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage?.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (saved === 'true') {
        setCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.localStorage?.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false');
  }, [collapsed]);

  const expandSidebar = useCallback(() => setCollapsed(false), []);
  const collapseSidebar = useCallback(() => setCollapsed(true), []);

  const now = useLiveClock();

  const hostHubNav = useMemo(
    () => (isOrganizer ? SIDEBAR_HOST_HUB_LINKS : SIDEBAR_HOST_ASPIRING_LINKS) as NavItem[],
    [isOrganizer],
  );
  const hostHubLabel = isOrganizer ? 'Host Studio' : 'Host Hub';

  // Role-aware full nav set for rail (and potential future use)
  const visibleRailNav = useMemo(() => {
    const base = [...MAIN_NAV, ...ATTENDEE_NAV, ...BROWSE_NAV, ...hostHubNav];
    if (isVenue) base.push(...VENUE_NAV);
    if (isSponsor) base.push(...SPONSOR_NAV);
    if (isAdmin) base.push(...ADMIN_NAV);
    if (isSuperAdmin) base.push(...SUPERADMIN_NAV);
    // dedupe by route (last wins for overrides)
    const seen = new Set<string>();
    return base.filter((item) => {
      if (seen.has(item.route)) return false;
      seen.add(item.route);
      return true;
    });
  }, [hostHubNav, isVenue, isSponsor, isAdmin, isSuperAdmin]);

  const normalizedRouteByItemRoute = useMemo(() => {
    const entries: [string, string][] = [
      ...MAIN_NAV,
      ...ATTENDEE_NAV,
      ...BROWSE_NAV,
      ...hostHubNav,
      ...VENUE_NAV,
      ...SPONSOR_NAV,
      ...ADMIN_NAV,
      ...SUPERADMIN_NAV,
      ...BOTTOM_NAV
    ].map(
      (item) => [item.route, normalizeRoute(item.route)],
    );
    return new Map(entries);
  }, [hostHubNav]);

  const isActive = useCallback((item: NavItem) => {
    if (!isReady) return false;
    const bare = normalizedRouteByItemRoute.get(item.route) ?? normalizeRoute(item.route);
    const normalizedPath = normalizeRoute(pathname);
    if (item.route === '/(tabs)') return normalizedPath === '/';
    if (item.matchPrefix) return normalizedPath === bare || normalizedPath.startsWith(bare + '/');
    return normalizedPath === bare;
  }, [isReady, normalizedRouteByItemRoute, pathname]);

  const navigate = (route: string) => {
    // Clear search on navigation for better UX
    if (searchQuery) setSearchQuery('');
    if (route.startsWith('/(tabs)')) {
      router.navigate(route as any);
    } else {
      router.push(route as any);
    }
  };

  const bg = colors.surface;
  const border = colors.borderLight;
  const mutedColor = withAlpha(colors.textSecondary, isDark ? 0.48 : 0.52);
  const myCouncil = councilData?.council;

  const dateLabel = useMemo(() =>
    now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }), [now]);
  const timeLabel = useMemo(() =>
    now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }), [now]);

  const filterNav = useCallback((items: NavItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [searchQuery]);

  // ── Collapsed rail ──────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <View style={[r.rail, { backgroundColor: bg, borderRightColor: border }]}>
        <Pressable
          style={r.railTop}
          onPress={() => navigate('/(tabs)')}
          hitSlop={4}
          accessibilityLabel={`${APP_NAME} home`}
          accessibilityRole="button"
        >
          <SidebarLogoMark size={36} borderRadius={10} />
        </Pressable>

        <View style={[r.divider, { backgroundColor: border }]} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={r.railIcons}>
          {visibleRailNav.map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={`${item.route}-${item.label}`}
                style={[r.railItem, active && { backgroundColor: withAlpha(ACTIVE_COLOR, 0.1) }]}
                onPress={() => navigate(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                {active && (
                  <LinearGradient colors={ACTIVE_GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={r.railActiveBar} />
                )}
                <Ionicons name={active ? item.iconActive : item.icon} size={20} color={active ? ACTIVE_COLOR : mutedColor} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flex: 1 }} />
        <View style={[r.divider, { backgroundColor: border }]} />

        <Pressable
          style={[r.railItem, { marginBottom: 12 }]}
          onPress={expandSidebar}
          accessibilityRole="button"
          accessibilityLabel="Expand sidebar"
        >
          <Ionicons name="chevron-forward-outline" size={18} color={mutedColor} />
        </Pressable>

        {isAuthenticated && (
           <Pressable
            style={[r.railItem, { marginBottom: 16 }]}
            onPress={() => {
              const seg = user?.id
                ? (user.handle && user.handleStatus === 'approved' ? user.handle.toLowerCase() : (user.culturePassId || user.id))
                : null;
              navigate(seg ? `/user/${seg}` : '/profile/edit');
            }}
            accessibilityLabel="View public profile"
           >
            <AvatarWithRing
              avatarUrl={user?.avatarUrl}
              initials="CP"
              size={28}
              ringWidth={1}
              recyclingKey={(user as any)?.updatedAt || (user as any)?.avatarUpdatedAt || Date.now()}
            />
           </Pressable>
        )}
      </View>
    );
  }

  // ── Expanded sidebar ────────────────────────────────────────────────────────
  return (
    <View style={[s.sidebar, { backgroundColor: bg, borderRightColor: border }]}>

      {/* Brand header */}
      <View style={s.brandHeader}>
        <Pressable
          style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
            s.brandCardPress,
            hovered && { opacity: 0.96 },
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => navigate('/(tabs)')}
        >
          <GlassView intensity={10} tone={isDark ? 'dark' : 'light'} style={s.brandCard}>
            <View style={s.brandCardInner}>
              <SidebarLogoMark size={39
              } borderRadius={10} />
              <View style={s.brandTextBlock}>
                <Text style={[s.brandName, { color: colors.text }]}>{APP_NAME}</Text>
                <Text style={[s.brandTagline, { color: colors.textSecondary }]} numberOfLines={1}>
                  {APP_WEB_TAGLINE}
                </Text>
              </View>
            </View>
          </GlassView>
        </Pressable>

        <View style={[s.metaStrip, { backgroundColor: colors.backgroundSecondary, borderColor: border }]}>
          <View style={s.metaTimeBlock}>
            <Text style={[s.metaTime, { color: colors.text }]}>{timeLabel}</Text>
            <Text style={[s.metaSub, { color: colors.textSecondary }]}>{dateLabel}</Text>
          </View>

          <View style={s.headerActions}>
            <AppearanceModeToggle />
            <Pressable
              onPress={collapseSidebar}
              style={s.collapseBtn}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Search Nav */}
      <View style={s.searchContainer}>
        <View style={[s.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: border }]}>
          <Ionicons name="search-outline" size={16} color={mutedColor} />
          <TextInput
            placeholder="Search menu..."
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[s.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={mutedColor} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Scrollable nav */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <NavGroup label="Discover" items={filterNav(MAIN_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        <NavGroup label="Attendee" items={filterNav(ATTENDEE_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        <NavGroup label="Browse" items={filterNav(BROWSE_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        <NavGroup label={hostHubLabel} items={filterNav(hostHubNav)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        {isVenue && <NavGroup label="Venue" items={filterNav(VENUE_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}

        {isSponsor && <NavGroup label="Sponsor" items={filterNav(SPONSOR_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}

        {isAdmin && <NavGroup label="Admin" items={filterNav(ADMIN_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}

        {isSuperAdmin && <NavGroup label="SuperAdmin" items={filterNav(SUPERADMIN_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}

        <NavGroup label="Support" items={filterNav(BOTTOM_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        {myCouncil && !searchQuery && (
          <M3Card
            variant="filled"
            onPress={() => navigate('/(tabs)/directory')}
            style={s.councilCard}
          >
            <View style={[s.councilIconWrap, { backgroundColor: withAlpha(ACTIVE_COLOR, 0.1) }]}>
              <Ionicons name="shield-checkmark" size={16} color={ACTIVE_COLOR} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.councilEyebrow, { color: ACTIVE_COLOR }]}>MY COUNCIL</Text>
              <Text style={[s.councilName, { color: colors.text }]}>{myCouncil.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={mutedColor} />
          </M3Card>
        )}
      </ScrollView>

      {/* Pinned footer */}
      <View style={[s.pinnedFooter, { borderTopColor: border }]}>
        {isAuthenticated && user ? (
          <SidebarProfileBlock
            user={user}
            colors={colors}
            isDark={isDark}
            friendlyRole={friendlyRole}
            onNavigate={navigate}
            onLogout={logout}
          />
        ) : (
          <Button
            variant="gradient"
            size="md"
            onPress={() => navigate('/(onboarding)/signup')}
            style={{ height: 44, borderRadius: Radius.md }}
          >
            Join CulturePass
          </Button>
        )}
      </View>
    </View>
  );
}

function NavGroup({ label, items, isActive, navigate, colors, isDark }: any) {
  if (items.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
      {items.map((item: any) => (
        <SidebarItem
          key={item.route + item.label}
          item={item}
          active={isActive(item)}
          isDark={isDark}
          onPress={() => navigate(item.route)}
          colors={colors}
        />
      ))}
    </View>
  );
}

function SidebarItem({ item, active, isDark, onPress, colors }: { item: NavItem; active: boolean; isDark: boolean; onPress: () => void; colors: any }) {
  const [hovered, setHovered] = useState(false);
  const activeBg = isDark ? withAlpha(ACTIVE_COLOR, 0.15) : withAlpha(ACTIVE_COLOR, 0.08);

  return (
    <Pressable
      style={[
        ni.item,
        active && { backgroundColor: activeBg },
        !active && hovered && { backgroundColor: colors.backgroundSecondary },
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {active && (
        <LinearGradient colors={ACTIVE_GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={ni.activeBar} />
      )}
      <Ionicons
        name={active ? item.iconActive : item.icon}
        size={18}
        color={active ? ACTIVE_COLOR : colors.textSecondary}
      />
      <Text style={[ni.label, { color: active ? ACTIVE_COLOR : colors.text }, active && ni.labelActive]}>
        {item.label}
      </Text>
      {item.badge ? (
        <View style={ni.badge}><Text style={ni.badgeText}>{item.badge}</Text></View>
      ) : null}
    </Pressable>
  );
}

function SidebarProfileBlock({ user, colors, isDark, friendlyRole, onNavigate, onLogout }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user.displayName || user.username || 'User';
  // Prefer the canonical /user/ path (supports CPID or clean username when handle approved)
  const publicProfileRoute = user?.id
    ? `/user/${user.handle && user.handleStatus === 'approved' ? user.handle.toLowerCase() : (user.culturePassId || user.id)}`
    : '/profile/edit';

  return (
    <View>
      {menuOpen && (
        <M3Card
          variant="elevated"
          style={[
            pb.menu,
            {
              backgroundColor: colors.surfaceElevated,
              borderWidth: 1,
              borderColor: colors.borderLight,
              ...(isDark
                ? { boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }
                : { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }),
            },
          ]}
        >
          {/* View public profile first for quick read access */}
          <Pressable
            style={({ pressed, hovered }: any) => [
              pb.menuItem,
              hovered && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => { setMenuOpen(false); onNavigate(publicProfileRoute); }}
          >
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[pb.menuLabel, { color: colors.text }]}>View Public Profile</Text>
          </Pressable>
          {PROFILE_ACTIONS.map(action => (
            <Pressable
              key={action.key}
              style={({ pressed, hovered }: any) => [
                pb.menuItem,
                hovered && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => { setMenuOpen(false); onNavigate(action.route); }}
            >
              <Ionicons name={action.icon} size={16} color={colors.textSecondary} />
              <Text style={[pb.menuLabel, { color: colors.text }]}>{action.label}</Text>
            </Pressable>
          ))}
          {/* Sign out row has extra top separation for clarity */}
          <View style={[pb.menuDivider, { backgroundColor: colors.divider }]} />
          <Pressable
            style={({ pressed, hovered }: any) => [
              pb.menuItem,
              hovered && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => { setMenuOpen(false); onLogout(); }}
          >
            <Ionicons name="log-out-outline" size={16} color={CultureTokens.coral} />
            <Text style={[pb.menuLabel, { color: CultureTokens.coral, fontWeight: '600' }]}>Sign Out</Text>
          </Pressable>
        </M3Card>
      )}
      <Pressable
        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
          pb.profileRow,
          { backgroundColor: colors.backgroundSecondary },
          hovered && { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, borderWidth: 1 },
          pressed && { opacity: 0.92 },
        ]}
        onPress={() => setMenuOpen(!menuOpen)}
      >
        <AvatarWithRing
          avatarUrl={user.avatarUrl}
          initials={displayName[0]}
          size={32}
          recyclingKey={(user as any)?.updatedAt || (user as any)?.avatarUpdatedAt || Date.now()}
        />
        <View style={{ flex: 1 }}>
          <Text style={[pb.name, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[pb.sub, { color: colors.textSecondary }]} numberOfLines={1}>{friendlyRole}</Text>
        </View>
        <Ionicons name={menuOpen ? "chevron-down" : "chevron-up"} size={14} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    ...Platform.select({ web: { position: 'sticky', top: 0 } as any, default: {} }),
  },
  brandHeader: { paddingTop: Spacing.md + 4, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.md },
  brandCardPress: { borderRadius: Radius.lg },
  brandCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  brandCardInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
  brandTextBlock: { flex: 1, gap: 2 },
  brandName: { ...TextStyles.title3, fontSize: 16, fontFamily: 'Poppins_700Bold', letterSpacing: -0.6 },
  brandTagline: { ...TextStyles.caption, fontSize: 10, fontFamily: 'Poppins_500Medium', letterSpacing: -0.2, marginTop: -2 },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  metaTimeBlock: {
    gap: 3,
    paddingRight: Spacing.sm,
  },
  metaTime: { ...TextStyles.captionSemibold, fontSize: 12, lineHeight: 15 },
  metaSub: { ...TextStyles.caption, fontSize: 10, lineHeight: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  collapseBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 36, borderRadius: 18, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13, padding: 0, outlineStyle: 'none' } as any,
  scrollContent: { paddingBottom: 20 },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  sectionLabel: { ...TextStyles.captionSemibold, fontSize: 10, letterSpacing: 1, marginBottom: 8, marginLeft: 8 },
  councilCard: { marginHorizontal: Spacing.md, marginTop: Spacing.lg, padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 10 },
  councilIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  councilEyebrow: { ...TextStyles.captionSemibold, fontSize: 9 },
  councilName: { ...TextStyles.labelSemibold, fontSize: 12 },
  pinnedFooter: { padding: Spacing.md, borderTopWidth: 1, gap: Spacing.sm },
});

const r = StyleSheet.create({
  rail: { width: RAIL_WIDTH, height: '100%', borderRightWidth: 1, alignItems: 'center', paddingTop: 20 },
  railTop: { marginBottom: 20 },
  divider: { height: 1, width: 32, marginBottom: 12 },
  railIcons: { gap: 8 },
  railItem: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  railActiveBar: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 2 },
});

const ni = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.md, marginBottom: 2, position: 'relative' },
  activeBar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2 },
  label: { ...TextStyles.body, fontSize: 13, flex: 1 },
  labelActive: { fontWeight: '600' },
  badge: { backgroundColor: CultureTokens.coral, paddingHorizontal: 6, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' }, // keep white for contrast on colored badges; could pull from tokens if needed later
});

const pb = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: Radius.md, borderWidth: 0 },
  name: { ...TextStyles.labelSemibold, fontSize: 13 },
  sub: { ...TextStyles.caption, fontSize: 11 },
  menu: { position: 'absolute', bottom: 60, left: 0, right: 0, padding: 6, borderRadius: Radius.md, zIndex: 1000, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  menuLabel: { ...TextStyles.body, fontSize: 13, letterSpacing: 0.1 },
  menuDivider: { height: 1, marginVertical: 5, marginHorizontal: 6 },
});
