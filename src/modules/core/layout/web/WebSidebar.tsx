import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  Linking,
} from 'react-native';
import { usePathname, router, useRootNavigationState, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useCouncil } from '@/hooks/useCouncil';
import { useProfileImage } from '@/hooks/useProfileImage';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SOCIAL_LINKS } from '@/lib/site-footer-links';
import { CultureTokens, gradients, Radius, Spacing, Layout } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { Image } from 'expo-image';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Card } from '@/design-system/ui/M3Card';
import { AppearanceModeToggle, CulturePassWordmark } from '@/design-system/ui';
import { APP_WEB_TAGLINE } from '@/lib/app-meta';
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
const ACTIVE_COLOR = CultureTokens.terracottaGlow;
const ACTIVE_GRAD: [string, string] = [CultureTokens.terracottaGlow, CultureTokens.deepSaffron];
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'culturepass:web-sidebar-collapsed';
const DEFAULT_WEATHER_CITY = 'Sydney';
const DEFAULT_WEATHER_COORDS = { lat: -33.8688, lon: 151.2093 };

const PROFILE_ACTIONS = [
  { key: 'edit', label: 'Edit Profile', icon: 'create-outline' as const, route: '/profile/edit' },
  { key: 'qr', label: 'Digital ID', icon: 'qr-code-outline' as const, route: '/profile/qr' },
  { key: 'network', label: 'Network', icon: 'people-outline' as const, route: '/network' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' as const, route: '/payment/wallet' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem extends SidebarNavLink {}

// ─── Nav Arrays ───────────────────────────────────────────────────────────────
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

// ─── Sub Components ───────────────────────────────────────────────────────────

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
          style={[{ width: size - 8, height: size - 8 }]}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

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
  recyclingKey?: string | number;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const innerSize = size - ringWidth * 2 - 2;
  const cutoutBg = isDark ? withAlpha(CultureTokens.indigo, 0.08) : colors.surfaceVariant;

  const resolvedUri = avatarUrl
    ? recyclingKey
      ? `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${recyclingKey}`
      : avatarUrl
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
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function resolveWeatherCoords(city?: string | null): { lat: number; lon: number } {
  const match = city ? getPostcodesByPlace(city)[0] : undefined;
  if (!match) return DEFAULT_WEATHER_COORDS;
  return { lat: match.latitude, lon: match.longitude };
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 49) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Storm';
}

function weatherCodeToIcon(code: number): keyof typeof Ionicons.glyphMap {
  if (code === 0) return 'sunny-outline';
  if (code <= 3) return 'partly-sunny-outline';
  if (code <= 49) return 'cloud-outline';
  if (code <= 82) return 'rainy-outline';
  return 'thunderstorm-outline';
}

function useSidebarWeather(coords: { lat: number; lon: number }) {
  const [weather, setWeather] = useState<{ label: string; icon: keyof typeof Ionicons.glyphMap; timezone?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;

        const data = (await res.json()) as {
          current_weather?: { temperature?: number; weathercode?: number };
          timezone?: string;
        };
        const current = data.current_weather;
        if (!current || typeof current.temperature !== 'number' || typeof current.weathercode !== 'number') return;

        if (!cancelled) {
          setWeather({
            label: `${Math.round(current.temperature)}°C ${weatherCodeToLabel(current.weathercode)}`,
            icon: weatherCodeToIcon(current.weathercode),
            timezone: data.timezone,
          });
        }
      } catch {
        if (!cancelled) setWeather(null);
      }
    }

    setWeather(null);
    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon]);

  return weather;
}

function useSafeNavigation() {
  const [pathname, setPathname] = useState('/');
  const [isReady, setIsReady] = useState(false);

  const routerPathname = useOptionalPathname();
  const navState = useOptionalRootNavigationState();

  useEffect(() => {
    if (navState?.key) setIsReady(true);
    if (routerPathname) {
      setPathname(routerPathname);
    } else if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, [navState?.key, routerPathname]);

  return { pathname, isReady };
}

function useOptionalPathname() {
  try { return usePathname(); } catch { return null; }
}

function useOptionalRootNavigationState() {
  try { return useRootNavigationState(); } catch { return null; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function WebSidebar() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return <View style={[styles.sidebar, { width: SIDEBAR_WIDTH, opacity: 0 }]} />;
  }

  return <WebSidebarContent />;
}

function WebSidebarContent() {
  const { pathname, isReady } = useSafeNavigation();
  const colors = useColors();
  const isDark = useIsDark();
  const { user, logout, isAuthenticated } = useAuth();
  const { profileImage, initials, recyclingKey } = useProfileImage();
  const { isOrganizer, isAdmin, isSuperAdmin, role } = useRole();
  const isVenue = role === 'business';
  const isSponsor = role === 'sponsor';
  const { data: councilData } = useCouncil();
  const { isDesktop } = useLayout();
  const { state: onboardingState } = useOnboarding();

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
  const isSidebarCollapsed = collapsed && isDesktop;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [collapseHovered, setCollapseHovered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage?.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.localStorage?.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false');
  }, [collapsed]);

  const expandSidebar = useCallback(() => setCollapsed(false), []);
  const collapseSidebar = useCallback(() => setCollapsed(true), []);

  const now = useLiveClock();
  const myCouncil = councilData?.council;
  const weatherCity = user?.city || onboardingState.city || DEFAULT_WEATHER_CITY;
  const weatherCoords = useMemo(() => resolveWeatherCoords(weatherCity), [weatherCity]);
  const weather = useSidebarWeather(weatherCoords);
  const timeLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    if (weather?.timezone) opts.timeZone = weather.timezone;
    return now.toLocaleTimeString([], opts);
  }, [now, weather?.timezone]);
  const dateLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    if (weather?.timezone) opts.timeZone = weather.timezone;
    return now.toLocaleDateString([], opts);
  }, [now, weather?.timezone]);

  const hostHubNav = useMemo(
    () => (isOrganizer ? SIDEBAR_HOST_HUB_LINKS : SIDEBAR_HOST_ASPIRING_LINKS) as NavItem[],
    [isOrganizer]
  );
  const hostHubLabel = isOrganizer ? 'Host Studio' : 'Host Hub';

  const visibleRailNav = useMemo(() => {
    const base = [...MAIN_NAV, ...ATTENDEE_NAV, ...BROWSE_NAV, ...hostHubNav];
    if (isVenue) base.push(...VENUE_NAV);
    if (isSponsor) base.push(...SPONSOR_NAV);
    if (isAdmin && !isSuperAdmin) base.push(...ADMIN_NAV);
    if (isSuperAdmin) base.push(...SUPERADMIN_NAV);

    const seen = new Set<string>();
    return base.filter((item) => !seen.has(item.route) && seen.add(item.route));
  }, [hostHubNav, isVenue, isSponsor, isAdmin, isSuperAdmin]);

  const normalizedRouteByItemRoute = useMemo(() => {
    const allItems = [...MAIN_NAV, ...ATTENDEE_NAV, ...BROWSE_NAV, ...hostHubNav, ...VENUE_NAV, ...SPONSOR_NAV, ...ADMIN_NAV, ...SUPERADMIN_NAV, ...BOTTOM_NAV];
    return new Map(allItems.map((item) => [item.route, normalizeRoute(item.route)]));
  }, [hostHubNav]);

  const isActive = useCallback((item: NavItem) => {
    if (!isReady) return false;
    const bare = normalizedRouteByItemRoute.get(item.route) ?? normalizeRoute(item.route);
    const normalizedPath = normalizeRoute(pathname);

    if (item.route === '/(tabs)') return normalizedPath === '/';
    if (item.matchPrefix) return normalizedPath === bare || normalizedPath.startsWith(`${bare}/`);
    return normalizedPath === bare;
  }, [isReady, normalizedRouteByItemRoute, pathname]);

  const navigate = useCallback((route: string) => {
    if (searchQuery) setSearchQuery('');
    if (route.startsWith('/(tabs)')) router.navigate(route as any);
    else router.push(route as any);
  }, [searchQuery]);

  const filterNav = useCallback((items: NavItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const hasNoSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const groups = [MAIN_NAV, ATTENDEE_NAV, BROWSE_NAV, hostHubNav, VENUE_NAV, SPONSOR_NAV, ADMIN_NAV, SUPERADMIN_NAV, BOTTOM_NAV];
    return groups.every((group) => filterNav(group as NavItem[]).length === 0);
  }, [searchQuery, hostHubNav, filterNav]);

  const bg = colors.surface;
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const mutedColor = withAlpha(colors.textSecondary, isDark ? 0.48 : 0.52);
  const sidebarWidth = isDesktop ? SIDEBAR_WIDTH : '100%';

  if (isSidebarCollapsed) {
    return (
      <GlassView
        intensity={isDark ? 25 : 15}
        tone={isDark ? 'dark' : 'light'}
        style={[
          railStyles.rail,
          {
            backgroundColor: isDark ? 'rgba(10, 10, 12, 0.82)' : 'rgba(250, 249, 246, 0.85)',
            borderRightColor: border,
          }
        ]}
      >
        <Pressable style={railStyles.railTop} onPress={() => navigate('/(tabs)')} hitSlop={4}>
          <SidebarLogoMark size={36} borderRadius={10} />
        </Pressable>

        <View style={[railStyles.divider, { backgroundColor: border }]} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={railStyles.railIcons}>
          {visibleRailNav.map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={`${item.route}-${item.label}`}
                style={[railStyles.railItem, active && { backgroundColor: withAlpha(ACTIVE_COLOR, 0.1) }]}
                onPress={() => navigate(item.route)}
              >
                {active && <LinearGradient colors={ACTIVE_GRAD} style={railStyles.railActiveBar} />}
                <Ionicons name={active ? item.iconActive : item.icon} size={20} color={active ? ACTIVE_COLOR : mutedColor} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flex: 1 }} />
        <View style={[railStyles.divider, { backgroundColor: border }]} />

        <Pressable style={[railStyles.railItem, { marginBottom: 12 }]} onPress={expandSidebar}>
          <Ionicons name="chevron-forward-outline" size={12} color={mutedColor} />
        </Pressable>

        {isAuthenticated && (
          <Pressable
            style={[railStyles.railItem, { marginBottom: 16 }]}
            onPress={() => {
              const seg = user?.handle && user.handleStatus === 'approved' ? user.handle.toLowerCase() : user?.culturePassId || user?.id;
              navigate(seg ? `/user/${seg}` : '/profile/edit');
            }}
          >
            <AvatarWithRing avatarUrl={profileImage} initials={initials} size={28} ringWidth={1} recyclingKey={recyclingKey} />
          </Pressable>
        )}
      </GlassView>
    );
  }

  return (
    <GlassView
      intensity={isDark ? 25 : 15}
      tone={isDark ? 'dark' : 'light'}
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          borderRightColor: border,
          backgroundColor: isDark ? 'rgba(10, 10, 12, 0.82)' : 'rgba(250, 249, 246, 0.85)',
        }
      ]}
    >
      <View style={styles.brandHeader}>
        <Pressable style={styles.brandHeaderPress} onPress={() => navigate('/(tabs)')}>
          <SidebarLogoMark size={36} borderRadius={10} />
          <View style={styles.brandTextBlock}>
            <CulturePassWordmark size="xs" showSuffix />
            <Text style={[styles.brandTagline, { color: colors.textSecondary }]} numberOfLines={1}>
              {APP_WEB_TAGLINE}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <View style={[styles.headerMetaStack, { backgroundColor: isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.45)', borderColor: border }]}>
            <View style={styles.headerMetaLine}>
              <Text style={[styles.headerMetaText, { color: colors.textSecondary, marginLeft: 16 }]} numberOfLines={1}>
                {timeLabel} · {dateLabel}
              </Text>
            </View>
            <View style={styles.headerMetaLine}>
              <Ionicons name={(weather?.icon ?? 'partly-sunny-outline') as any} size={12} color={colors.textSecondary} />
              <Text style={[styles.headerMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {weather?.label ?? weatherCity}
              </Text>
            </View>
          </View>
          <AppearanceModeToggle compact />
          <Pressable
            onPress={collapseSidebar}
            onHoverIn={() => setCollapseHovered(true)}
            onHoverOut={() => setCollapseHovered(false)}
            style={[
              styles.collapseBtn,
              {
                backgroundColor: collapseHovered ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
                transform: collapseHovered ? [{ scale: 1.08 }] : [{ scale: 1.0 }],
              } as any
            ]}
            hitSlop={6}
          >
            <Ionicons name="chevron-back" size={14} color={colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: searchFocused ? (isDark ? 'rgba(0,0,0,0.4)' : '#fff') : colors.backgroundSecondary,
              borderColor: searchFocused ? CultureTokens.terracottaGlow : border,
              boxShadow: searchFocused ? `0 0 0 2px ${withAlpha(CultureTokens.terracottaGlow, 0.15)}` : undefined,
            } as any
          ]}
        >
          <Ionicons name="search-outline" size={15} color={mutedColor} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={15} color={mutedColor} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <NavGroup label="Discover" items={filterNav(MAIN_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />
        <NavGroup label="Attendee" items={filterNav(ATTENDEE_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />
        <NavGroup label="Browse" items={filterNav(BROWSE_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />
        <NavGroup label={hostHubLabel} items={filterNav(hostHubNav)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        {isVenue && <NavGroup label="Venue" items={filterNav(VENUE_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}
        {isSponsor && <NavGroup label="Sponsor" items={filterNav(SPONSOR_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}
        {isAdmin && !isSuperAdmin && <NavGroup label="Admin" items={filterNav(ADMIN_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}
        {isSuperAdmin && <NavGroup label="SuperAdmin" items={filterNav(SUPERADMIN_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />}

        <NavGroup label="Support" items={filterNav(BOTTOM_NAV)} isActive={isActive} navigate={navigate} colors={colors} isDark={isDark} />

        {myCouncil && !searchQuery && (
          <M3Card variant="filled" onPress={() => navigate('/(tabs)/directory')} style={styles.councilCard}>
            <View style={[styles.councilIconWrap, { backgroundColor: withAlpha(ACTIVE_COLOR, 0.1) }]}>
              <Ionicons name="shield-checkmark" size={16} color={ACTIVE_COLOR} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.councilEyebrow, { color: ACTIVE_COLOR }]}>MY COUNCIL</Text>
              <Text style={[styles.councilName, { color: colors.text }]}>{myCouncil.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={mutedColor} />
          </M3Card>
        )}

        {hasNoSearchResults && (
          <View style={styles.searchEmpty}>
            <Ionicons name="search-outline" size={18} color={mutedColor} />
            <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>No matches for “{searchQuery}”</Text>
          </View>
        )}

        {!searchQuery && <SidebarFooter colors={colors} border={border} mutedColor={mutedColor} />}
      </ScrollView>

      <View style={[styles.pinnedFooter, { borderTopColor: border }]}>
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
          <Button variant="gradient" size="md" onPress={() => navigate('/(onboarding)/signup')} style={{ height: 44, borderRadius: Radius.md }}>
            Join CulturePass
          </Button>
        )}
      </View>
    </GlassView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
function normalizeRoute(route: string): string {
  return route.replace('/(tabs)/', '/').replace('/(tabs)', '/').replace(/\/index$/, '') || '/';
}

function NavGroup({ label, items, isActive, navigate, colors, isDark }: any) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
      {items.map((item: NavItem) => (
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
        itemStyles.item,
        active && { backgroundColor: activeBg },
        !active && hovered && { backgroundColor: colors.backgroundSecondary },
        hovered && !active && { transform: [{ scale: 1.01 }, { translateX: 2 }] as any },
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {active && <LinearGradient colors={ACTIVE_GRAD} style={itemStyles.activeBar} />}
      <Ionicons name={active ? item.iconActive : item.icon} size={18} color={active ? ACTIVE_COLOR : colors.textSecondary} />
      <Text style={[itemStyles.label, { color: active ? ACTIVE_COLOR : colors.text }, active && itemStyles.labelActive]}>
        {item.label}
      </Text>
      {!!item.badge && (
        <View style={itemStyles.badge}>
          <Text style={itemStyles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SidebarProfileBlock({ user, colors, isDark, friendlyRole, onNavigate, onLogout }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { profileImage, initials, recyclingKey } = useProfileImage();
  const displayName = user.displayName || user.username || 'User';

  const publicProfileRoute = user?.id
    ? `/user/${user.handle && user.handleStatus === 'approved' ? user.handle.toLowerCase() : (user.culturePassId || user.id)}`
    : '/profile/edit';

  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <View>
      {menuOpen && (
        <GlassView
          intensity={isDark ? 45 : 30}
          tone={isDark ? 'dark' : 'light'}
          style={[profileStyles.menu, { backgroundColor: isDark ? 'rgba(20,20,28,0.96)' : 'rgba(255,255,255,0.96)', borderColor: colors.borderLight }]}
        >
          <Pressable
            style={profileStyles.menuItem}
            onPress={() => { setMenuOpen(false); onNavigate(publicProfileRoute); }}
          >
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[profileStyles.menuLabel, { color: colors.text }]}>View Public Profile</Text>
          </Pressable>

          {PROFILE_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              style={profileStyles.menuItem}
              onPress={() => { setMenuOpen(false); onNavigate(action.route); }}
            >
              <Ionicons name={action.icon} size={16} color={colors.textSecondary} />
              <Text style={[profileStyles.menuLabel, { color: colors.text }]}>{action.label}</Text>
            </Pressable>
          ))}

          <View style={[profileStyles.menuDivider, { backgroundColor: colors.divider }]} />

          <Pressable
            style={profileStyles.menuItem}
            onPress={() => { setMenuOpen(false); onLogout(); }}
          >
            <Ionicons name="log-out-outline" size={16} color={CultureTokens.coral} />
            <Text style={[profileStyles.menuLabel, { color: CultureTokens.coral, fontWeight: '600' }]}>Sign Out</Text>
          </Pressable>
        </GlassView>
      )}

      <Pressable
        style={[
          profileStyles.profileRow,
          {
            backgroundColor: hovered || menuOpen
              ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
              : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'),
            borderColor: hovered || menuOpen ? colors.borderLight : border,
          }
        ]}
        onPress={() => setMenuOpen(!menuOpen)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
      >
        <AvatarWithRing avatarUrl={profileImage} initials={initials} size={30} recyclingKey={recyclingKey} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[profileStyles.name, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[profileStyles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{friendlyRole}</Text>
        </View>
        <Ionicons name={menuOpen ? "chevron-down" : "chevron-up"} size={13} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

function SidebarFooter({ colors, border, mutedColor }: { colors: any; border: string; mutedColor: string }) {
  const openSocialLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={[footerStyles.container, { borderTopColor: border }]}>
      <Text style={[footerStyles.ackText, { color: colors.textTertiary }]}>
        We acknowledge the Traditional Custodians of Country throughout Australia and pay respects to Elders past and present.
      </Text>

      <View style={footerStyles.linksGrid}>
        <View style={footerStyles.gridCol}>
          <Link href="/about" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>About</Text>
          </Link>
          <Link href="/founder" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Our Story</Text>
          </Link>
          <Link href="/help" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Help Centre</Text>
          </Link>
          <Link href="/contact" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Contact</Text>
          </Link>
        </View>
        <View style={footerStyles.gridCol}>
          <Link href="/legal/terms" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Terms</Text>
          </Link>
          <Link href="/legal/privacy" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Privacy</Text>
          </Link>
          <Link href="/legal/community" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Guidelines</Text>
          </Link>
          <Link href="/legal/cookies" style={footerStyles.link}>
            <Text style={[footerStyles.linkText, { color: colors.textSecondary }]}>Cookies</Text>
          </Link>
        </View>
      </View>

      <View style={footerStyles.socialRow}>
        {SOCIAL_LINKS.slice(0, 5).map((social, index) => (
          <Pressable
            key={index}
            onPress={() => openSocialLink(social.url)}
            style={[footerStyles.socialIcon, { backgroundColor: colors.surface, borderColor: border }]}
          >
            <Ionicons name={social.icon as any} size={14} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <Text style={[footerStyles.copyright, { color: colors.textTertiary }]}>
        © {new Date().getFullYear()} CulturePass.App — Made in Sydney
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sidebar: { height: '100%', flexShrink: 0, borderRightWidth: 1, ...Platform.select({ web: { position: 'sticky', top: 0 } as any }) },
  brandHeader: { paddingTop: Spacing.md, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  brandHeaderPress: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 6, borderRadius: Radius.md },
  brandTextBlock: { flex: 1, minWidth: 0, gap: 0 },
  brandTagline: { fontSize: 10, fontFamily: 'Poppins_500Medium', letterSpacing: 0.2, lineHeight: 13, opacity: 0.65, marginTop: -1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  headerMetaStack: { gap: 3, paddingHorizontal: 9, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1 },
  headerMetaLine: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  headerMetaText: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', lineHeight: 12 },
  collapseBtn: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, height: 38, borderRadius: 20, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13, padding: 0, outlineStyle: 'none' } as any,
  scrollContent: { paddingBottom: 24, paddingTop: 4 },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  sectionLabel: { ...TextStyles.captionSemibold, fontSize: 10, letterSpacing: 0.8, marginBottom: 4, marginLeft: 4, opacity: 0.6 },
  councilCard: { marginHorizontal: Spacing.md, marginTop: Spacing.lg, padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 10 },
  councilIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  councilEyebrow: { ...TextStyles.captionSemibold, fontSize: 9 },
  councilName: { ...TextStyles.labelSemibold, fontSize: 12 },
  searchEmpty: { marginHorizontal: Spacing.md, marginTop: Spacing.lg, paddingVertical: 14, alignItems: 'center', gap: 6, opacity: 0.65 },
  searchEmptyText: { ...TextStyles.caption, fontSize: 12, textAlign: 'center' },
  pinnedFooter: { padding: Spacing.md, borderTopWidth: 1, gap: Spacing.sm },
});

const railStyles = StyleSheet.create({
  rail: { width: RAIL_WIDTH, height: '100%', flexShrink: 0, borderRightWidth: 1, alignItems: 'center', paddingTop: 18 },
  railTop: { marginBottom: 16 },
  divider: { height: 1, width: 28, marginBottom: 10 },
  railIcons: { gap: 6 },
  railItem: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  railActiveBar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2 },
});

const itemStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, paddingHorizontal: 11, borderRadius: Radius.md, marginBottom: 1, position: 'relative' },
  activeBar: { position: 'absolute', left: 0, top: 6, bottom: 6, width: 4, borderRadius: 2 },
  label: { ...TextStyles.body, fontSize: 13, flex: 1 },
  labelActive: { fontWeight: '600' },
  badge: { backgroundColor: CultureTokens.coral, paddingHorizontal: 6, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

const profileStyles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  name: { ...TextStyles.labelSemibold, fontSize: 13 },
  sub: { ...TextStyles.caption, fontSize: 11 },
  menu: { position: 'absolute', bottom: 58, left: 8, right: 8, padding: 4, borderRadius: Radius.md, zIndex: 1000, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: Radius.sm },
  menuLabel: { ...TextStyles.body, fontSize: 13, letterSpacing: 0.1 },
  menuDivider: { height: 1, marginVertical: 4, marginHorizontal: 6 },
});

const footerStyles = StyleSheet.create({
  container: { marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, gap: 12, paddingHorizontal: 4 },
  ackText: { fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
  linksGrid: { flexDirection: 'row', gap: 16 },
  gridCol: { flex: 1, gap: 6 },
  link: { textDecorationLine: 'none' },
  linkText: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  copyright: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
});
