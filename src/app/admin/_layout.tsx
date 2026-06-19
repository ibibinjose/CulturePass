/**
 * Admin Control Panel Layout
 * Grouped navigation, role-aware access, mobile nav sheet.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { GlassView } from '@/design-system/ui/GlassView';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily, HeaderTokens } from '@/design-system/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { CulturePassWordmark, M3Button } from '@/design-system/ui';
import { useSafeBack } from '@/lib/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import {
  ADMIN_NAV_SECTIONS,
  filterAdminNavForRole,
  type AdminNavItem,
} from '@/modules/admin/config/adminNav';

function navBadgeCount(
  item: AdminNavItem,
  badges: { moderation: number; verification: number; hostApplications: number },
): number {
  if (!item.badgeKey) return 0;
  return badges[item.badgeKey] ?? 0;
}

export default function AdminLayout() {
  const colors = useColors();
  const { role, hasMinRole, isLoading: roleLoading } = useRole();
  const isSuperAdmin = role === 'superAdmin';
  const hasAdminAccess = hasMinRole('moderator');
  const hasFullAdmin = hasMinRole('admin');
  const { isDesktop } = useLayout();
  const pathname = usePathname();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const mobileBack = useSafeBack();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: complianceData } = useQuery({
    queryKey: adminKeys.complianceSummary(),
    queryFn: () => api.admin.complianceSummary(),
    enabled: hasAdminAccess,
    refetchInterval: 60_000,
  });
  const { data: verificationStats } = useQuery({
    queryKey: adminKeys.verificationStats(),
    queryFn: () => api.admin.verificationStats(),
    enabled: hasFullAdmin,
    refetchInterval: 60_000,
  });
  const { data: statsData } = useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => api.admin.stats(),
    enabled: hasFullAdmin,
    refetchInterval: 90_000,
  });

  const badges = {
    moderation: complianceData?.pendingReports ?? 0,
    verification: verificationStats?.pending ?? 0,
    hostApplications: statsData?.pendingHostApplications ?? 0,
  };

  const navSections = useMemo(() => filterAdminNavForRole(role, ADMIN_NAV_SECTIONS), [role]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return navSections;
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((section) => section.items.length > 0);
  }, [navSections, searchQuery]);

  const currentTitle = useMemo(() => {
    for (const section of navSections) {
      const match = section.items.find(
        (item) => pathname === item.route || (item.route === '/admin' && pathname === '/admin/index'),
      );
      if (match) return match.label;
    }
    return 'Admin Console';
  }, [navSections, pathname]);

  if (!roleLoading && !hasAdminAccess) {
    return (
      <View style={[styles.denied, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={CultureTokens.coral} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Access Restricted</Text>
        <Text style={[styles.deniedSub, { color: colors.textSecondary }]}>
          This console requires moderator clearance or higher.
        </Text>
        <M3Button variant="filled" onPress={() => router.replace('/(tabs)')}>Return to App</M3Button>
      </View>
    );
  }

  const renderNavItems = (onNavigate?: () => void) =>
    filteredSections.map((section) => (
      <View key={section.id} style={styles.navSection}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{section.title}</Text>
        {section.items.map((item) => {
          const active =
            pathname === item.route || (item.route === '/admin' && pathname === '/admin/index');
          const badge = navBadgeCount(item, badges);
          return (
            <Pressable
              key={item.route}
              onPress={() => {
                router.push(item.route as never);
                onNavigate?.();
              }}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={17}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                  { color: active ? colors.text : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {badge > 0 ? (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    ));

  const sidebar = (
    <GlassView intensity={55} style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <CulturePassWordmark size="md" showSuffix />
        <View style={[styles.adminBadge, { backgroundColor: isSuperAdmin ? '#EF4444' : CultureTokens.indigo }]}>
          <Text style={styles.adminBadgeText}>{isSuperAdmin ? 'SUPER ADMIN' : role === 'moderator' ? 'MODERATOR' : 'ADMIN'}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search admin…"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.text,
              fontFamily: FontFamily.regular,
              paddingVertical: Platform.OS === 'web' ? 4 : 0,
              ...Platform.select({ web: { outlineStyle: 'none' } }),
            } as object}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
        {renderNavItems()}
      </ScrollView>

      <View style={[styles.sidebarFooter, { borderTopColor: colors.borderLight }]}>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="exit-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>Exit Admin</Text>
        </Pressable>
      </View>
    </GlassView>
  );

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[`${colors.primary}05`, 'transparent']} style={StyleSheet.absoluteFill} />

        {isDesktop && sidebar}

        <View style={styles.main}>
          {!isDesktop && (
            <GlassView intensity={20} style={[styles.mobileHeader, { paddingTop: topInset + 12 }]}>
              <Pressable onPress={mobileBack} style={styles.mobileBack}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.mobileTitle, { color: colors.text }]} numberOfLines={1}>
                {currentTitle}
              </Text>
              <Pressable onPress={() => setMobileNavOpen(true)} style={styles.mobileMenu}>
                <Ionicons name="menu" size={22} color={colors.text} />
              </Pressable>
            </GlassView>
          )}

          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="hostspace" />
            <Stack.Screen name="users" />
            <Stack.Screen name="host-applications" />
            <Stack.Screen name="communities" />
            <Stack.Screen name="promo-codes" />
            <Stack.Screen name="moderation" />
            <Stack.Screen name="finance" />
            <Stack.Screen name="discover" />
            <Stack.Screen name="community-banner" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="audit-logs" />
            <Stack.Screen name="timesheet" />
            <Stack.Screen name="team-monitoring" />
            <Stack.Screen name="member-monitoring" />
            <Stack.Screen name="indexes-health" />
            <Stack.Screen name="platform" />
            <Stack.Screen name="data-compliance" />
            <Stack.Screen name="verification" />
          </Stack>
        </View>

        {!isDesktop && (
          <Modal visible={mobileNavOpen} animationType="slide" transparent onRequestClose={() => setMobileNavOpen(false)}>
            <Pressable style={styles.sheetBackdrop} onPress={() => setMobileNavOpen(false)} />
            <View style={[styles.sheet, { backgroundColor: colors.background }]}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.borderLight }]} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Admin navigation</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                {renderNavItems(() => setMobileNavOpen(false))}
              </ScrollView>
            </View>
          </Modal>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    paddingTop: 18,
    paddingBottom: 12,
  },
  sidebarHeader: { paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  adminBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5 },
  adminBadgeText: { color: '#FFFFFF', fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  navScroll: { paddingHorizontal: 8, paddingBottom: 12 },
  navSection: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
    paddingHorizontal: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 9,
    gap: 10,
  },
  navItemActive: { backgroundColor: 'rgba(15,23,42,0.1)' },
  navLabel: { flex: 1, fontSize: 13.5, fontFamily: FontFamily.medium },
  navLabelActive: { fontFamily: FontFamily.semibold },
  navBadge: {
    backgroundColor: CultureTokens.coral,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  navBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: FontFamily.bold, textAlign: 'center' },
  sidebarFooter: { marginTop: 'auto', paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  footerLinkText: { fontSize: 12.5, fontFamily: FontFamily.medium },
  main: { flex: 1 },
  mobileHeader: {
    minHeight: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mobileTitle: { flex: 1, fontSize: 16, fontFamily: FontFamily.bold, textAlign: 'center' },
  mobileBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mobileMenu: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontFamily: FontFamily.bold, paddingHorizontal: 20, marginBottom: 8 },
  sheetScroll: { paddingHorizontal: 8, paddingBottom: 24 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 },
  deniedTitle: { fontSize: 24, fontFamily: FontFamily.bold },
  deniedSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, opacity: 0.8 },
});