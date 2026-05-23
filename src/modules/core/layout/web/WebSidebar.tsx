import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useCouncil } from '@/hooks/useCouncil';
import { CultureTokens, gradients } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { Image } from 'expo-image';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { APP_NAME, APP_WEB_TAGLINE, MADE_IN } from '@/lib/app-meta';
import {
  SIDEBAR_ATTENDEE_LINKS,
  SIDEBAR_BROWSE_LINKS,
  SIDEBAR_HOST_ASPIRING_LINKS,
  SIDEBAR_HOST_HUB_LINKS,
} from '@/constants/navigation/experienceNav';

// ─── Brand gradient constants ─────────────────────────────────────────────────
const ACTIVE_COLOR = CultureTokens.violet;
const ACTIVE_GRAD: [string, string] = [CultureTokens.violet, CultureTokens.coral];
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'culturepass:web-sidebar-collapsed';

// ─── Logo mark ────────────────────────────────────────────────────────────────
function SidebarLogoMark({ size, borderRadius }: { size: number; borderRadius: number }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size, borderRadius, overflow: 'hidden', flexShrink: 0, alignSelf: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('@/assets/images/culturepass-logo.png')}
          style={[
            { width: size - 6, height: size - 6 },
            Platform.OS === 'web' ? ({ objectFit: 'contain' } as object) : null,
          ]}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

// ─── Nav definitions ─────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: number;
  matchPrefix?: boolean;
}

function normalizeRoute(route: string): string {
  return route
    .replace('/(tabs)/', '/')
    .replace('/(tabs)', '/')
    .replace(/\/index$/, '');
}

const MAIN_NAV: NavItem[] = [
  { label: 'Discover', icon: 'compass-outline', iconActive: 'compass', route: '/(tabs)' },
  { label: 'My City', icon: 'location-outline', iconActive: 'location', route: '/(tabs)/city' },
  { label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar', route: '/(tabs)/calendar' },
  { label: 'Community', icon: 'people-circle-outline', iconActive: 'people-circle', route: '/(tabs)/community' },
];

const ATTENDEE_NAV: NavItem[] = SIDEBAR_ATTENDEE_LINKS as NavItem[];
const BROWSE_NAV: NavItem[] = SIDEBAR_BROWSE_LINKS as NavItem[];

const VENUE_NAV: NavItem[] = [
  { label: 'Venue Hub', icon: 'storefront-outline', iconActive: 'storefront', route: '/dashboard/venue', matchPrefix: true },
];

const SPONSOR_NAV: NavItem[] = [
  { label: 'Sponsor Hub', icon: 'ribbon-outline', iconActive: 'ribbon', route: '/dashboard/sponsor', matchPrefix: true },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'AdminSpace', icon: 'shield-half-outline', iconActive: 'shield-half', route: '/admin', matchPrefix: false },
  { label: 'Discover Curation', icon: 'sparkles-outline', iconActive: 'sparkles', route: '/admin/discover', matchPrefix: true },
  { label: 'Users', icon: 'people-outline', iconActive: 'people', route: '/admin/users', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Compliance', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/admin/data-compliance', matchPrefix: true },
  { label: 'Platform', icon: 'settings-outline', iconActive: 'settings', route: '/admin/platform', matchPrefix: true },
  { label: 'Finance', icon: 'card-outline', iconActive: 'card', route: '/admin/finance', matchPrefix: true },
  { label: 'Moderation', icon: 'eye-outline', iconActive: 'eye', route: '/admin/moderation', matchPrefix: true },
];

const SUPERADMIN_NAV: NavItem[] = [
  { label: 'Cockpit (Root)', icon: 'rocket-outline', iconActive: 'rocket', route: '/admin', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Compliance', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/admin/data-compliance', matchPrefix: true },
  { label: 'Platform', icon: 'settings-outline', iconActive: 'settings', route: '/admin/platform', matchPrefix: true },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'About', icon: 'information-circle-outline', iconActive: 'information-circle', route: '/about' },
  { label: 'Our Story', icon: 'book-outline', iconActive: 'book', route: '/founder' },
  { label: 'Settings', icon: 'settings-outline', iconActive: 'settings', route: '/settings' },
  { label: 'Help', icon: 'help-circle-outline', iconActive: 'help-circle', route: '/help' },
];

const PROFILE_ACTIONS = [
  { key: 'profile', label: 'View Profile', icon: 'person-outline' as const, route: '/profile/edit' },
  { key: 'qr', label: 'Digital ID', icon: 'qr-code-outline' as const, route: '/profile/qr' },
  { key: 'network', label: 'Network', icon: 'people-outline' as const, route: '/network' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' as const, route: '/payment/wallet' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' as const, route: '/settings' },
] as const;

// ─── Avatar ───────────────────────────────────────────────────────────────────
function AvatarWithRing({
  avatarUrl,
  initials,
  size = 40,
  ringWidth = 2,
}: {
  avatarUrl?: string;
  initials: string;
  size?: number;
  ringWidth?: number;
}) {
  const innerSize = size - ringWidth * 2 - 2;
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
          backgroundColor: '#1a1a2e',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: innerSize, height: innerSize }} />
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
    const place = getPostcodesByPlace(trimmed)[0];
    if (!place) { setSummary(''); return; }
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
  const pathname = usePathname();
  const colors = useColors();
  const isDark = useIsDark();
  const { user, logout, isAuthenticated } = useAuth();
  const { isOrganizer, isAdmin, isSuperAdmin, role } = useRole();
  const isVenue = role === 'business';
  const isSponsor = role === 'sponsor';
  const { data: councilData } = useCouncil();

  const [collapsed, setCollapsed] = useState(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    return window.localStorage?.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.localStorage?.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false');
  }, [collapsed]);

  const expandSidebar = React.useCallback(() => setCollapsed(false), []);
  const collapseSidebar = React.useCallback(() => setCollapsed(true), []);

  const now = useLiveClock();
  const weatherSummary = useWeatherSummary(user?.city);

  const hostHubNav = useMemo(
    () => (isOrganizer ? SIDEBAR_HOST_HUB_LINKS : SIDEBAR_HOST_ASPIRING_LINKS) as NavItem[],
    [isOrganizer],
  );

  const normalizedRouteByItemRoute = useMemo(() => {
    // Perf: precompute normalized route strings once per nav change
    // instead of recomputing string replacements for every isActive call.
    const entries: [string, string][] = [...MAIN_NAV, ...ATTENDEE_NAV, ...BROWSE_NAV, ...hostHubNav, ...BOTTOM_NAV].map(
      (item) => [item.route, normalizeRoute(item.route)],
    );
    return new Map(entries);
  }, [hostHubNav]);

  const isActive = (item: NavItem) => {
    const bare = normalizedRouteByItemRoute.get(item.route) ?? normalizeRoute(item.route);
    if (item.route === '/(tabs)') return pathname === '/' || pathname === '/index' || pathname === '';
    if (item.matchPrefix) return pathname === bare || pathname.startsWith(bare + '/');
    return pathname === bare;
  };

  const navigate = (route: string) => {
    if (route.startsWith('/(tabs)')) {
      router.navigate(route as any);
    } else {
      router.push(route as any);
    }
  };

  const bg = colors.surface;
  const border = colors.borderLight;
  const mutedColor = isDark ? 'rgba(232,244,255,0.32)' : 'rgba(0,22,40,0.28)';
  const myCouncil = councilData?.council;

  const dateLabel = useMemo(() =>
    now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }), [now]);
  const timeLabel = useMemo(() =>
    now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }), [now]);
  const appVersionLabel = useMemo(() => 'v1.1.0 · CulturePass.App', []);

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
          <SidebarLogoMark size={40} borderRadius={12} />
        </Pressable>

        <View style={[r.divider, { backgroundColor: border }]} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={r.railIcons}>
          {[...MAIN_NAV, ...ATTENDEE_NAV, ...BROWSE_NAV, ...hostHubNav].map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={`${item.route}-${item.label}`}
                style={[r.railItem, active && { backgroundColor: isDark ? 'rgba(147,51,234,0.16)' : 'rgba(147,51,234,0.09)' }]}
                onPress={() => navigate(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                {active && (
                  <LinearGradient colors={ACTIVE_GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={r.railActiveBar} />
                )}
                <Ionicons name={active ? item.iconActive : item.icon} size={19} color={active ? ACTIVE_COLOR : mutedColor} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flex: 1 }} />
        <View style={[r.divider, { backgroundColor: border }]} />

        {BOTTOM_NAV.map((item) => {
          const active = isActive(item);
          return (
            <Pressable
              key={item.label}
              style={[r.railItem, active && { backgroundColor: isDark ? 'rgba(147,51,234,0.16)' : 'rgba(147,51,234,0.09)' }]}
              onPress={() => navigate(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              {active && (
                <LinearGradient colors={ACTIVE_GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={r.railActiveBar} />
              )}
              <Ionicons
                name={(active ? item.iconActive : item.icon) as keyof typeof Ionicons.glyphMap}
                size={19}
                color={active ? ACTIVE_COLOR : mutedColor}
              />
            </Pressable>
          );
        })}

        <Pressable
          style={[r.railItem, r.railExpandBtn]}
          onPress={expandSidebar}
          accessibilityRole="button"
          accessibilityLabel="Expand sidebar"
          // UX/a11y: expose toggle state so screen readers announce collapsed/expanded status.
          accessibilityState={{ expanded: false }}
          accessibilityHint="Expands navigation sidebar"
        >
          <Ionicons name="chevron-forward-outline" size={17} color={mutedColor} />
        </Pressable>

        {isAuthenticated && (
          <Pressable
            style={[r.railItem, { marginBottom: 8 }]}
            onPress={() => logout()}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={18} color={mutedColor} />
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
          accessibilityLabel={`${APP_NAME} home`}
          accessibilityRole="button"
        >
          <GlassView intensity={22} tone={isDark ? 'dark' : 'light'} style={s.brandCard}>
            {/* Subtle corner glow */}
            <LinearGradient
              colors={[`${CultureTokens.violet}28`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
              pointerEvents="none"
            />
            <View style={s.brandCardInner}>
              <SidebarLogoMark size={46} borderRadius={14} />
              <View style={s.brandTextBlock}>
                <Text
                  style={[s.brandName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {APP_NAME}
                </Text>
                <Text style={[s.brandTagline, { color: colors.textSecondary }]} numberOfLines={2}>
                  {APP_WEB_TAGLINE}
                </Text>
              </View>
            </View>
          </GlassView>
        </Pressable>

        {/* Time / weather / collapse row */}
        <View
          style={[
            s.metaStrip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: border,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text style={[s.metaBadge, { color: colors.textTertiary }]} numberOfLines={1}>
              {MADE_IN} 
            </Text>
            <Text style={[s.metaTime, { color: colors.text }]} numberOfLines={1}>
              {timeLabel}
            </Text>
            <Text style={[s.metaSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {dateLabel}{weatherSummary ? ` · ${weatherSummary}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={collapseSidebar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Collapse sidebar"
            // UX/a11y: expose toggle state so screen readers announce collapsed/expanded status.
            accessibilityState={{ expanded: true }}
            accessibilityHint="Collapses navigation sidebar"
            style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
              s.collapseBtn,
              { borderColor: border },
              hovered && { backgroundColor: isDark ? 'rgba(147,51,234,0.14)' : 'rgba(147,51,234,0.08)', borderColor: `${ACTIVE_COLOR}50` },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="chevron-back" size={17} color={CultureTokens.coral} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable nav */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <NavSection label="Discover" mutedColor={mutedColor}>
          {MAIN_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <NavSection label="Attendee" mutedColor={mutedColor}>
          {ATTENDEE_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <NavSection label="Browse" mutedColor={mutedColor}>
          {BROWSE_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <NavSection label="Host Hub" mutedColor={mutedColor}>
          {hostHubNav.map((item) => (
            <SidebarItem key={item.route + item.label} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        {isVenue && (
          <NavSection label="Venue" mutedColor={mutedColor}>
            {VENUE_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isSponsor && (
          <NavSection label="Sponsor" mutedColor={mutedColor}>
            {SPONSOR_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isAdmin && (
          <NavSection label="AdminSpace" mutedColor={mutedColor}>
            {ADMIN_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isSuperAdmin && (
          <NavSection label="SuperAdmin" mutedColor={mutedColor}>
            {SUPERADMIN_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        <NavSection label="More" mutedColor={mutedColor}>
          {BOTTOM_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
          <Text style={[s.guestMarketLine, { color: colors.textTertiary }]} numberOfLines={1}>
            {appVersionLabel}
          </Text>
        </NavSection>

        {myCouncil && (
          <Pressable
            style={[
              s.councilCard,
              {
                backgroundColor: isDark ? 'rgba(44,42,114,0.14)' : 'rgba(44,42,114,0.06)',
                borderColor: `${ACTIVE_COLOR}28`,
              },
            ]}
            onPress={() => navigate('/(tabs)/directory')}
            accessibilityRole="button"
            accessibilityLabel={`My Council, ${myCouncil.name}`}
          >
            <View style={[s.councilIconWrap, { backgroundColor: isDark ? 'rgba(147,51,234,0.18)' : 'rgba(147,51,234,0.10)', borderColor: `${ACTIVE_COLOR}40` }]}>
              <Ionicons name="shield-checkmark" size={14} color={ACTIVE_COLOR} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.councilEyebrow, { color: ACTIVE_COLOR }]} numberOfLines={1}>My Council</Text>
              <Text style={[s.councilName, { color: colors.text }]} numberOfLines={1}>{myCouncil.name}</Text>
              <Text style={[s.councilSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {myCouncil.suburb ?? 'Local'}{myCouncil.state ? `, ${myCouncil.state}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={12} color={`${ACTIVE_COLOR}80`} />
          </Pressable>
        )}
      </ScrollView>

      {/* Pinned footer */}
      <View style={s.pinnedFooter}>
        {/* Gradient separator */}
        <LinearGradient
          colors={['transparent', `${ACTIVE_COLOR}20`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.footerSeparator}
        />

        {isAuthenticated && user ? (
          <SidebarProfileBlock
            user={user}
            colors={colors}
            isDark={isDark}
            border={border}
            mutedColor={mutedColor}
            onNavigate={navigate}
            onLogout={logout}
          />
        ) : (
          <View style={s.joinBtnWrap}>
            <Button
              variant="gradient"
              size="md"
              leftIcon="person-add"
              onPress={() => navigate('/(onboarding)/signup')}
              fullWidth
              style={{ height: 40, borderRadius: 12 } as any}
              textStyle={[TextStyles.callout, { fontWeight: '700', letterSpacing: 0.1, color: '#0B0B14' }]}
            >
              Join CulturePass
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavSection({ label, mutedColor, children }: { label: string; mutedColor: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeaderRow}>
        <View style={[s.sectionRule, { backgroundColor: mutedColor + '50' }]} />
        <Text style={[s.sectionLabel, { color: mutedColor }]}>{label.toUpperCase()}</Text>
        <View style={[s.sectionRuleRight, { backgroundColor: mutedColor + '28' }]} />
      </View>
      <View style={s.navGroup}>{children}</View>
    </View>
  );
}

function SidebarItem({
  item,
  active,
  isDark,
  onPress,
  colors,
}: {
  item: NavItem;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [hovered, setHovered] = useState(false);

  const activeBg = isDark ? 'rgba(147,51,234,0.14)' : 'rgba(147,51,234,0.08)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,12,24,0.045)';

  return (
    <Pressable
      style={[
        ni.item,
        active && { backgroundColor: activeBg },
        !active && hovered && { backgroundColor: hoverBg },
        Platform.OS === 'web' ? ({ transition: 'background-color 0.12s ease' } as object) : undefined,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      {active && (
        <View style={ni.activeBar}>
          <LinearGradient colors={ACTIVE_GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </View>
      )}
      <Ionicons
        name={active ? item.iconActive : item.icon}
        size={17}
        color={active ? ACTIVE_COLOR : (isDark ? 'rgba(232,244,255,0.55)' : 'rgba(0,22,40,0.48)')}
      />
      <Text
        style={[ni.label, { color: active ? ACTIVE_COLOR : colors.textSecondary }, active && ni.labelActive]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {(item.badge ?? 0) > 0 && (
        <View style={[ni.badge, { backgroundColor: CultureTokens.coral }]}>
          <Text style={[ni.badgeText, { color: '#FFFFFF' }]}>{item.badge! > 99 ? '99+' : item.badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SidebarProfileBlock({
  user,
  colors,
  isDark,
  border,
  mutedColor,
  onNavigate,
  onLogout,
}: {
  user: { id?: string; displayName?: string; username?: string; email?: string; photoURL?: string; role?: string };
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  border: string;
  mutedColor: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayName = user.displayName ?? user.username ?? user.id?.slice(0, 8) ?? 'You';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');
  const roleBadge = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : null;

  return (
    <View style={pb.wrap}>
      {expanded && (
        <View style={[pb.menu, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)', borderColor: border }]}>
          {PROFILE_ACTIONS.map((action, i) => (
            <Pressable
              key={action.key}
              style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
                pb.menuItem,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
                (pressed || hovered) && { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
              ]}
              onPress={() => { setExpanded(false); onNavigate(action.route); }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Ionicons name={action.icon} size={15} color={colors.textSecondary} />
              <Text style={[pb.menuLabel, { color: colors.text }]} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
              pb.menuItem,
              { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
              (pressed || hovered) && { backgroundColor: isDark ? 'rgba(255,80,80,0.10)' : 'rgba(255,80,80,0.07)' },
            ]}
            onPress={() => { setExpanded(false); onLogout(); }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={15} color={CultureTokens.coral} />
            <Text style={[pb.menuLabel, { color: CultureTokens.coral, fontFamily: 'Poppins_600SemiBold' }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
          pb.profileRow,
          {
            borderColor: expanded ? `${ACTIVE_COLOR}55` : border,
            backgroundColor: expanded
              ? (isDark ? 'rgba(147,51,234,0.12)' : 'rgba(147,51,234,0.06)')
              : (pressed || hovered)
              ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
              : 'transparent',
          },
        ]}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Account and profile"
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Hides account actions' : 'Shows account actions'}
      >
        <AvatarWithRing avatarUrl={user.photoURL} initials={initials || '?'} size={32} ringWidth={1.5} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[pb.name, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          {(user.email || roleBadge) ? (
            <Text style={[pb.sub, { color: colors.textSecondary }]} numberOfLines={1}>
              {roleBadge ?? user.email}
            </Text>
          ) : null}
        </View>
        <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={13} color={mutedColor} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sidebar: {
    width: 240,
    alignSelf: 'stretch',
    borderRightWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    ...Platform.select({
      web: { minHeight: '100%', height: '100%', position: 'relative', zIndex: 100 } as object,
      default: {},
    }),
  },

  // Brand header
  brandHeader: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  brandCardPress: {
    alignSelf: 'stretch',
    borderRadius: 18,
  },
  brandCard: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.22)' } as object,
      default: {},
    }),
  },
  brandCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  brandTextBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: -1,
    marginBottom: -1,
    marginLeft: -6,
    marginRight: -6,
  },
  brandName: {
    fontSize: 22,
    fontFamily: Platform.select({
      web: '"Avenir Next", "Inter", "Segoe UI", sans-serif',
      default: 'Poppins_500Medium',
    }) as string,
    fontWeight: Platform.OS === 'web' ? '500' : undefined,
    color: '#FFFFFF',
    letterSpacing: 0.15,
    lineHeight: 28,
    includeFontPadding: false,
  },
  brandTagline: {
    fontSize: 14,
    fontFamily: Platform.select({
      web: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      default: 'Poppins_500Medium',
    }) as string,
    fontWeight: Platform.OS === 'web' ? '500' : undefined,
    lineHeight: 20,
    letterSpacing: 0.02,
    includeFontPadding: false,
    marginTop: 2,
  },

  // Meta / time strip
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaBadge: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 13,
  },
  metaTime: {
    fontSize: 12.5,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.1,
  },
  metaSub: {
    fontSize: 10.5,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 14,
    opacity: 0.88,
  },
  collapseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },

  // Scroll area
  scrollContent: { paddingBottom: 8, paddingTop: 2 },

  // Nav sections
  section: { marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 3,
  },
  sectionRule: { width: 10, height: StyleSheet.hairlineWidth, flexShrink: 0 },
  sectionRuleRight: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 9.5, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.9 },
  navGroup: { paddingHorizontal: 8 },

  // Council card
  councilCard: {
    marginHorizontal: 10,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  councilIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  councilEyebrow: { fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 1 },
  councilName: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', lineHeight: 15 },
  councilSub: { fontSize: 9.5, fontFamily: 'Poppins_400Regular' },

  // Pinned footer
  pinnedFooter: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 14 : 10,
    gap: 6,
  },
  footerSeparator: { height: 1, marginHorizontal: 8, marginBottom: 2 },
  joinBtnWrap: { paddingVertical: 2, paddingHorizontal: 2 },
  madeIn: {
    fontSize: 9.5,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingTop: 2,
    opacity: 0.7,
  },

  // Guest version line
  guestMarketLine: {
    fontSize: 9.5,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    opacity: 0.8,
  },
});

// Collapsed rail styles
const r = StyleSheet.create({
  rail: {
    width: 58,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    ...Platform.select({
      web: { position: 'relative', zIndex: 100 } as object,
      default: {},
    }),
  },
  railTop: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  divider: { height: StyleSheet.hairlineWidth, width: 32, marginBottom: 6 },
  railIcons: { alignItems: 'center', gap: 2, paddingTop: 2 },
  railItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  railExpandBtn: { backgroundColor: 'transparent' },
  railActiveBar: { position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 2 },
});

// Nav item styles
const ni = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    minHeight: 38,
    paddingVertical: 5,
    paddingHorizontal: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  activeBar: { position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 2, overflow: 'hidden' },
  label: { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 17 },
  labelActive: { fontFamily: 'Poppins_600SemiBold' },
  badge: {
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...TextStyles.captionSemibold, color: '#fff', fontSize: 9 },
});

// Profile block styles
const pb = StyleSheet.create({
  wrap: { paddingHorizontal: 2, paddingBottom: 2 },
  menu: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuLabel: { fontSize: 12.5, fontFamily: 'Poppins_500Medium', flex: 1 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 12.5, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },
  sub: { fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
});
