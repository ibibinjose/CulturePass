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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  { label: 'Communities', icon: 'people-circle', route: '/admin/communities' },
  { label: 'Promo Codes', icon: 'pricetag', route: '/admin/promo-codes' },
  { label: 'Moderation', icon: 'shield-checkmark', route: '/admin/moderation' },
  { label: 'Verification', icon: 'document-lock', route: '/admin/verification' },
  { label: 'Campaign Push', icon: 'megaphone', route: '/admin/notifications' },
  { label: 'Financials', icon: 'card', route: '/admin/finance' },
  { label: 'Discovery & Curation', icon: 'sparkles', route: '/admin/discover' },
  { label: 'Community Banner', icon: 'home', route: '/admin/community-banner' },
  { label: 'Audit Logs', icon: 'list', route: '/admin/audit-logs' },
  { label: 'System Health', icon: 'pulse', route: '/admin/platform' },
  { label: 'Compliance', icon: 'lock-closed', route: '/admin/data-compliance' },
];

export default function AdminLayout() {
  const colors = useColors();
  const { role, hasMinRole, isLoading: roleLoading } = useRole();
  const isAdmin = hasMinRole('admin');
  const isSuperAdmin = role === 'superAdmin';
  const hasAdminAccess = isAdmin || isSuperAdmin;
  const { isDesktop } = useLayout();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
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
    <GlassView intensity={40} style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <BrandWordmark size="md" color={colors.text} />
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>{isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={active ? colors.text : colors.textSecondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              {(item.route === '/admin/moderation' && moderationBadge > 0) && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{moderationBadge > 99 ? '99+' : String(moderationBadge)}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sidebarFooter}>
         <Pressable onPress={() => router.replace('/(tabs)')} style={styles.footerLink}>
            <Ionicons name="arrow-back" size={15} color={colors.textSecondary} />
            <Text style={styles.footerLinkText}>Exit Terminal</Text>
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
            <Stack.Screen name="communities" />
            <Stack.Screen name="promo-codes" />
            <Stack.Screen name="moderation" />
            <Stack.Screen name="finance" />
            <Stack.Screen name="discover" />
            <Stack.Screen name="community-banner" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="audit-logs" />
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
    marginBottom: 18,
    gap: 6,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: CultureTokens.indigo,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  navScroll: { paddingHorizontal: 8, gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 9,
  },
  navItemActive: {
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(15,23,42,0.72)',
  },
  navLabelActive: {
    color: '#0F172A',
    fontFamily: FontFamily.bold,
  },
  navBadge: {
    backgroundColor: CultureTokens.coral,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  navBadgeText: { color: '#FFFFFF', fontSize: 9, fontFamily: FontFamily.bold },
  sidebarFooter: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,42,0.08)',
  },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLinkText: { fontSize: 12, color: 'rgba(15,23,42,0.58)', fontFamily: FontFamily.medium },

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
