/**
 * Admin Control Panel Layout
 * ==========================
 * Secure shell for Super Admin tools. Features a high-fidelity Liquid Glass sidebar
 * on desktop and a clean top-nav on mobile.
 *
 * Design: Indistinguishable from first-party Apple management tools.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
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
import { BrandWordmark, M3Button } from '@/design-system/ui';
import { useSafeBack } from '@/lib/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

const ADMIN_NAV = [
  { label: 'Dashboard', icon: 'grid', route: '/admin' },
  { label: 'User Directory', icon: 'people', route: '/admin/users' },
  { label: 'Host Applications', icon: 'person-add', route: '/admin/host-applications' },
  { label: 'Communities', icon: 'people-circle', route: '/admin/communities' },
  { label: 'Promo Codes', icon: 'pricetag', route: '/admin/promo-codes' },
  { label: 'Moderation', icon: 'shield-checkmark', route: '/admin/moderation' },
  { label: 'Verification', icon: 'document-lock', route: '/admin/verification' },
  { label: 'Campaign Push', icon: 'megaphone', route: '/admin/notifications' },
  { label: 'Financials', icon: 'card', route: '/admin/finance' },
  { label: 'Discovery & Curation', icon: 'sparkles', route: '/admin/discover' },
  { label: 'Community Banner', icon: 'home', route: '/admin/community-banner' },
  { label: 'Audit Logs', icon: 'list', route: '/admin/audit-logs' },
  { label: 'AI Timesheet & Logs', icon: 'time', route: '/admin/timesheet' },
  { label: 'Team Monitoring', icon: 'people-circle', route: '/admin/team-monitoring' },
  { label: 'Member Monitoring', icon: 'analytics', route: '/admin/member-monitoring' },
  { label: 'Indexes Health', icon: 'analytics', route: '/admin/indexes-health' },
  { label: 'System Health', icon: 'pulse', route: '/admin/platform' },
  { label: 'Compliance', icon: 'lock-closed', route: '/admin/data-compliance' },
];



// ...

export default function AdminLayout() {
  const colors = useColors();
  const { role, hasMinRole, isLoading: roleLoading } = useRole();
  const isAdmin = hasMinRole('admin');
  const isSuperAdmin = role === 'superAdmin';
  const hasAdminAccess = isAdmin || isSuperAdmin;
  const { isDesktop } = useLayout();
  const pathname = usePathname();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const mobileBack = useSafeBack();
  const { data: moderationQueue } = useQuery({
    queryKey: adminKeys.complianceSummary(),
    queryFn: () => api.admin.complianceSummary(),
    enabled: hasAdminAccess,
    refetchInterval: 60000,
  });
  const moderationBadge = moderationQueue?.pendingReports ?? 0;

  // Role Protection
  if (!roleLoading && !hasAdminAccess) {
    return (
      <View style={[styles.denied, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={CultureTokens.coral} />
        <Text style={[styles.deniedTitle, { color: colors.text }]}>Access Restricted</Text>
        <Text style={[styles.deniedSub, { color: colors.textSecondary }]}>
          This terminal is reserved for Admin clearance only.
        </Text>
        <M3Button variant="filled" onPress={() => router.replace('/(tabs)')}>Return to App</M3Button>
      </View>
    );
  }

  const sidebar = (
    <GlassView intensity={55} style={styles.sidebar}>
      {/* Header */}
      <View style={styles.sidebarHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandWordmark size="md" color={colors.text} />
        </View>
        <View style={[styles.adminBadge, { backgroundColor: isSuperAdmin ? '#EF4444' : CultureTokens.indigo }]}>
          <Text style={styles.adminBadgeText}>
            {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
          </Text>
        </View>
      </View>

      {/* Sidebar Search (client-side filter for now) */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>Search admin...</Text>
        </View>
      </View>

      {/* Navigation */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.navScroll}
      >
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.route || (item.route === '/admin' && pathname === '/admin/index');
          const showBadge = item.route === '/admin/moderation' && moderationBadge > 0;

          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={17}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.navLabel, 
                active && styles.navLabelActive,
                { color: active ? colors.text : colors.textSecondary }
              ]}>
                {item.label}
              </Text>

              {showBadge && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>
                    {moderationBadge > 99 ? '99+' : moderationBadge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.sidebarFooter, { borderTopColor: colors.borderLight }]}>
        <View style={[styles.userMini, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={[styles.userAvatar, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Text>
            <Text style={[styles.userRole, { color: colors.textTertiary }]}>Platform Operator</Text>
          </View>
        </View>

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
        <LinearGradient
          colors={[`${colors.primary}05`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        {isDesktop && sidebar}

        <View style={styles.main}>
          {!isDesktop && (
            <GlassView intensity={20} style={[styles.mobileHeader, { paddingTop: topInset + 16 }]}>
                <Pressable onPress={mobileBack} style={styles.mobileBack}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.mobileTitle, { color: colors.text }]}>Admin Console</Text>
                <View style={{ width: 40 }} />
            </GlassView>
          )}

          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
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
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 248,
    height: '100%',
    borderRightWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    paddingTop: 18,
    paddingBottom: 12,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 5,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchPlaceholder: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  navScroll: { paddingHorizontal: 8, gap: 1, paddingBottom: 12 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 9,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: 'rgba(15,23,42,0.1)',
  },
  navLabel: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FontFamily.medium,
  },
  navLabelActive: {
    fontFamily: FontFamily.semibold,
  },
  navBadge: {
    backgroundColor: CultureTokens.coral,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  navBadgeText: { 
    color: '#FFFFFF', 
    fontSize: 10, 
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  // Note: All theme colors (colors.xxx) must be applied at runtime via inline styles,
  // never inside StyleSheet.create, because this file is evaluated by the
  // Expo Router server renderer during web builds.
  sidebarFooter: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  userMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  userRole: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  footerLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    paddingVertical: 4,
  },
  footerLinkText: { 
    fontSize: 12.5, 
    fontFamily: FontFamily.medium 
  },

  main: { flex: 1 },
  mobileHeader: {
    minHeight: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mobileTitle: { fontSize: 17, fontFamily: FontFamily.bold },
  mobileBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 },
  deniedTitle: { fontSize: 24, fontFamily: FontFamily.bold },
  deniedSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, opacity: 0.8 },
});
