/**
 * Admin User Directory
 * ====================
 * Browse the user base, inspect profiles, adjust roles, suspend accounts, and grant membership.
 */
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  ScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, CultureTokens, FontFamily, Spacing, Radius } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button, TruncatedText } from '@/design-system/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys, searchKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { useRole } from '@/hooks/useRole';
import type { User } from '@/shared/schema';

function matchesQuery(user: User, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    (user.displayName?.toLowerCase().includes(s) ?? false) ||
    (user.username?.toLowerCase().includes(s) ?? false) ||
    (user.email?.toLowerCase().includes(s) ?? false) ||
    (user.handle?.toLowerCase().includes(s) ?? false) ||
    user.id.toLowerCase().includes(s)
  );
}

export default function UserDirectoryScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const { userId: currentUserId } = useAuth();
  const contentPad = isDesktop ? Math.max(14, hPad - 12) : hPad;
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [auditNote, setAuditNote] = useState(''); // E: Audit notes for changes
  // Pagination (roadmap admin scale)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<{ type: string; value?: unknown } | null>(null);

  // === Hardened Admin Directory State (A/B/C/D/E) ===
  const [activeFilters, setActiveFilters] = useState<{
    roles: string[];
    statuses: string[];
    memberships: string[];
  }>({
    roles: [],
    statuses: [],
    memberships: [],
  });
  const [sortBy, setSortBy] = useState<'joined' | 'activity' | 'name'>('joined');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); // Bulk selection

  const queryClient = useQueryClient();
  const { role: myRole, hasRole } = useRole();
  const canAssignPlatformAdmin = hasRole('platformAdmin');
  const isSuperAdmin = hasRole('superAdmin');

  const searchTrim = search.trim();
  const useRemoteSearch = searchTrim.length > 2;

  const { data: stats } = useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => api.admin.stats(),
  });

  const { data: directory, isLoading: dirLoading, refetch: refetchDir } = useQuery({
    queryKey: adminKeys.usersDirectory(),
    queryFn: () => api.users.list(),
    enabled: !useRemoteSearch,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: searchKeys.query({ q: searchTrim, type: 'user' }),
    queryFn: () => api.search.query({ q: searchTrim, type: 'user' }),
    enabled: useRemoteSearch,
  });

  const filteredAndSortedUsers = useMemo(() => {
    let base = useRemoteSearch ? (searchData?.users ?? []) : (directory ?? []);

    // Local filter (when not using remote search)
    if (!useRemoteSearch) {
      base = base.filter((u) => matchesQuery(u, searchTrim));
    }

    // === A: Apply advanced filters ===
    base = base.filter((u) => {
      const roleMatch = activeFilters.roles.length === 0 || activeFilters.roles.includes(u.role || 'user');
      const status = (u as { status?: string }).status || 'active';
      const statusMatch = activeFilters.statuses.length === 0 || activeFilters.statuses.includes(status);
      const membership = u.membership?.tier || 'free';
      const membershipMatch = activeFilters.memberships.length === 0 || activeFilters.memberships.includes(membership);
      return roleMatch && statusMatch && membershipMatch;
    });

    // === D: Apply sorting ===
    base.sort((a, b) => {
      let valA: string | number, valB: string | number;

      if (sortBy === 'name') {
        valA = (a.displayName || a.username || '').toLowerCase();
        valB = (b.displayName || b.username || '').toLowerCase();
      } else if (sortBy === 'joined') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else {
        // activity
        valA = a.eventsAttended || 0;
        valB = b.eventsAttended || 0;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return base;
  }, [
    useRemoteSearch,
    searchData?.users,
    directory,
    searchTrim,
    activeFilters,
    sortBy,
    sortDir,
  ]);

  const totalCount = filteredAndSortedUsers.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const users = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredAndSortedUsers.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedUsers, page]);

  // Reset page to 0 when search or filters change to avoid empty state bugs
  useEffect(() => {
    setPage(0);
  }, [searchTrim, activeFilters]);

  const isLoading = useRemoteSearch ? searchLoading : dirLoading;

  // === Helper for A: Filter toggling ===
  const toggleFilter = (category: 'roles' | 'statuses' | 'memberships', value: string) => {
    setActiveFilters((prev) => {
      const current = prev[category];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  // === C: Bulk selection helpers ===
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(users.map(u => u.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // === C: Bulk action handlers with confirmation ===
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const handleExportCSV = async () => {
    const list = selectedIds.size > 0 
      ? filteredAndSortedUsers.filter(u => selectedIds.has(u.id)) 
      : filteredAndSortedUsers;
    if (list.length === 0) return Alert.alert('Error', 'No users to export');

    const headers = ['ID', 'Name', 'Handle', 'Email', 'Role', 'Status', 'Joined'];
    const rows = list.map(u => [
      u.id,
      u.displayName || u.username,
      `@${u.username}`,
      u.email || '',
      u.role || 'user',
      (u as any).status || 'active',
      u.createdAt ? new Date(u.createdAt).toISOString() : ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `culturepass-users-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        await Share.share({
          message: csvContent,
          title: `CulturePass Users Export - ${new Date().toISOString().split('T')[0]}`
        });
      } catch (error: any) {
        Alert.alert('Export Failed', error.message ?? 'Unknown error');
      }
    }
  };

  const handleCopyLink = async (user: User) => {
    const url = `https://culturepass.app/profile/${user.handle || user.username || user.id}`;
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied', 'Profile link copied to clipboard');
  };

  const confirmBulkAction = (type: string, value?: unknown) => {
    setPendingBulkAction({ type, value });
    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    if (!pendingBulkAction || selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const { type, value } = pendingBulkAction;

    try {
      let promises: Promise<unknown>[] = [];
      const note = auditNote ? ` [Audit Note: ${auditNote}]` : '';

      const targets = Array.from(selectedIds).filter(id => {
        if (id === currentUserId && (type === 'suspend' || type === 'role')) {
          return false;
        }
        return true;
      });

      if (targets.length === 0 && selectedIds.has(currentUserId || '')) {
        Alert.alert('Action Cancelled', 'You cannot apply this action to yourself.');
        setBulkActionLoading(false);
        setShowBulkConfirm(false);
        setPendingBulkAction(null);
        return;
      }

      if (selectedIds.has(currentUserId || '') && (type === 'suspend' || type === 'role')) {
        Alert.alert('Warning', 'You cannot suspend or demote yourself. Your account will be skipped from this bulk operation.');
      }

      if (type === 'role') {
        promises = targets.map(id =>
          api.admin.patchUser(id, { role: value as any })
        );
      } else if (type === 'suspend') {
        promises = targets.map(id =>
          api.admin.patchUser(id, { status: 'suspended' })
        );
      } else if (type === 'reactivate') {
        promises = targets.map(id =>
          api.admin.patchUser(id, { status: 'active' })
        );
      } else if (type === 'grant') {
        promises = targets.map(id =>
          api.admin.grantMembership(id, value as number, `Bulk grant by ${myRole}${note}`)
        );
      }

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: adminKeys.usersDirectory() });
      Alert.alert('Success', `Action "${type}" applied to ${targets.length} users.`);
      clearSelection();
      setAuditNote('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Some updates failed.';
      Alert.alert('Bulk Action Failed', msg);
    } finally {
      setBulkActionLoading(false);
      setShowBulkConfirm(false);
      setPendingBulkAction(null);
    }
  };

  const { data: selectedUser } = useQuery({
    queryKey: adminKeys.userDetail(selectedUserId!),
    queryFn: () => api.users.get(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const patchUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { status?: 'active' | 'suspended' } }) =>
      api.admin.patchUser(id, data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.usersDirectory() });
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(vars.id) });
      queryClient.invalidateQueries({ queryKey: searchKeys.all });
    },
  });

  const grantPlus = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => api.admin.grantMembership(id, days, auditNote || 'Admin grant from directory'),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(vars.id) });
      Alert.alert('Membership', 'CulturePass+ grant applied.');
      setAuditNote('');
    },
    onError: (e: Error) => Alert.alert('Grant failed', e.message ?? 'Unknown error'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.account.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.usersDirectory() });
      queryClient.invalidateQueries({ queryKey: searchKeys.all });
      setSelectedUserId(null);
      Alert.alert('Success', 'User deleted successfully.');
    },
    onError: (e: Error) => {
      Alert.alert('Deletion failed', e.message ?? 'Unknown error');
    }
  });

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUserId) {
      Alert.alert('Error', 'You cannot delete your own account from the admin dashboard.');
      return;
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmDelete = window.confirm(`Are you absolutely sure you want to permanently delete user @${u.username}? This will wipe their Firebase Auth credentials and delete all Firestore records (GDPR compliance).`);
        if (confirmDelete) {
          deleteUserMutation.mutate(u.id);
        }
      }
    } else {
      Alert.alert(
        'Confirm Permanent Deletion',
        `Are you absolutely sure you want to permanently delete user @${u.username}? This will wipe their Firebase Auth credentials and delete all Firestore records (GDPR compliance).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Permanently', style: 'destructive', onPress: () => deleteUserMutation.mutate(u.id) }
        ]
      );
    }
  };

  const confirmPatch = useCallback(
    (label: string, id: string, data: Partial<User> & { status?: 'active' | 'suspended' }) => {
      if (id === currentUserId) {
        if (data.status === 'suspended') {
          Alert.alert('Error', 'You cannot suspend your own account.');
          return;
        }
        if (data.role && data.role !== 'platformAdmin' && data.role !== 'superAdmin' && data.role !== 'admin') {
          Alert.alert('Error', 'You cannot demote yourself from administrative roles.');
          return;
        }
      }
      const noteSuffix = auditNote ? ` (with audit note: ${auditNote})` : '';
      Alert.alert('Confirm', `${label}${noteSuffix}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: data.status === 'suspended' ? 'destructive' : 'default',
          onPress: () =>
            patchUser.mutate(
              { id, data },
              {
                onSuccess: () => {
                  Alert.alert('Updated', 'User record saved.');
                  setAuditNote('');
                },
                onError: (e: Error) => Alert.alert('Error', e.message ?? 'Update failed'),
              },
            ),
        },
      ]);
    },
    [patchUser, auditNote, currentUserId],
  );

  const renderDetail = (u: User) => {
    const acctStatus = (u as { status?: string }).status;
    const isPlus = u.membership?.tier === 'plus';

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassView contentStyle={styles.detailCard} style={isDesktop ? styles.detailCardDesktop : styles.detailCardMobile}>
          <View style={styles.detailHeader}>
            <View style={[styles.largeAvatar, { backgroundColor: colors.primarySoft }]}>
              {u.avatarUrl ? (
                <Image source={{ uri: u.avatarUrl }} style={styles.avatarDetailImage} />
              ) : (
                <Text style={[styles.largeAvatarText, { color: colors.primary }]}>
                  {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.detailMetaCol}>
              <View style={styles.detailMetaRow}>
                <Text style={[styles.detailName, { color: colors.text }]} numberOfLines={1}>{u.displayName || '—'}</Text>
                {u.isVerified && <Ionicons name="checkmark-circle" size={20} color={CultureTokens.emerald} />}
              </View>
              <Text style={[styles.detailHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                @{u.username || u.handle || 'unknown'} {u.email ? `• ${u.email}` : ''}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: acctStatus === 'suspended' ? CultureTokens.coral : CultureTokens.emerald },
                  ]}
                />
                <Text style={[styles.statusLabel, { color: colors.textTertiary }]}>
                  {(acctStatus === 'suspended' ? 'SUSPENDED' : 'ACTIVE').toUpperCase()}
                </Text>
                <View style={[styles.verticalDivider, styles.verticalDividerShort, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.statusLabel, { color: colors.textTertiary }]}>
                  {u.role?.toUpperCase() || 'USER'}
                </Text>
              </View>
            </View>
          </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.text }]}>{u.eventsAttended ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>EVENTS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.text }]}>{u.followersCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>FOLLOWERS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.text }]}>{u.behavioral?.likesCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>LIKES</Text>
          </View>
        </View>

        {/* Rich Metadata (E) */}
        <View style={styles.gapMd}>
          <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>PROFILE METADATA</Text>
          <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
            <InfoRow label="Handle Status" value={u.handleStatus || 'pending'} color={u.handleStatus === 'approved' ? CultureTokens.emerald : CultureTokens.coral} colors={colors} />
            <InfoRow label="Nationality" value={u.culturalIdentity?.nationalityId || 'Not set'} colors={colors} />
            <InfoRow label="Location" value={u.city ? `${u.city}${u.country ? `, ${u.country}` : ''}` : 'Unknown'} colors={colors} />
            <InfoRow label="LGA / Council" value={u.lgaCode ? `${u.lgaCode} (${u.councilId || 'No ID'})` : 'Not set'} colors={colors} />
            <InfoRow label="Interests" value={u.interests?.join(', ') || 'None'} colors={colors} />
            <InfoRow label="Marketplace" value={u.approvedMarketplacePublisher ? 'Approved' : 'Not Approved'} color={u.approvedMarketplacePublisher ? CultureTokens.emerald : colors.textTertiary} colors={colors} />
            <InfoRow label="Last Active" value={u.behavioral?.lastActiveAt ? new Date(u.behavioral.lastActiveAt).toLocaleString() : 'Never'} colors={colors} />
          </View>
        </View>

        {/* Membership & Activity Sections (E) */}
        <View style={styles.rowGap16}>
          <View style={styles.flex1Gap8}>
            <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>MEMBERSHIP HISTORY</Text>
            <View style={[styles.timelineBox, { borderColor: colors.borderLight }]}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: isPlus ? CultureTokens.emerald : colors.border }]} />
                <View>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    {u.membership?.tier?.toUpperCase() || 'FREE'} Tier
                  </Text>
                  <Text style={[styles.timelineCaption, { color: colors.textTertiary }]}>
                    {u.membership?.validUntil ? `Expires ${new Date(u.membership.validUntil).toLocaleDateString()}` : 'No expiry'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.flex1Gap8}>
            <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>LATEST ACTIVITY</Text>
            <View style={[styles.timelineBox, { borderColor: colors.borderLight }]}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>Joined CulturePass</Text>
                  <Text style={[styles.timelineCaption, { color: colors.textTertiary }]}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gap16}>
          <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>ADMIN CONTROLS</Text>

          {/* Audit Note for Super Admins (E) */}
          {isSuperAdmin && (
            <View style={styles.auditSection}>
              <View style={styles.auditLabelRow}>
                <Text style={[styles.auditLabel, { color: colors.textTertiary }]}>Audit Note (Optional):</Text>
                {auditNote.length > 0 && (
                  <Pressable onPress={() => setAuditNote('')}>
                    <Text style={[styles.auditClear, { color: colors.error }]}>Clear</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={[styles.auditInput, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Why are you making this change?"
                placeholderTextColor={colors.textTertiary}
                value={auditNote}
                onChangeText={setAuditNote}
              />
            </View>
          )}

          {/* 1. Roles & Verification */}
          <View style={styles.controlSection}>
            <Text style={styles.controlSectionTitle}>ROLES & VERIFICATION</Text>
            <View style={styles.permissionsGrid}>
              {(['user', 'organizer'] as User['role'][]).map(r => (
                <M3Button
                  key={r}
                  variant={u.role === r ? "filled" : "tonal"}
                  style={styles.flex1}
                  disabled={patchUser.isPending}
                  onPress={() => confirmPatch(`Set role to ${r}`, u.id, { role: r })}
                >
                  {r?.charAt(0).toUpperCase()}{r?.slice(1)}
                </M3Button>
              ))}
            </View>
            <View style={styles.permissionsGrid}>
              {(['moderator', 'business'] as User['role'][]).map(r => (
                <M3Button
                  key={r}
                  variant={u.role === r ? "filled" : "tonal"}
                  style={styles.flex1}
                  disabled={patchUser.isPending}
                  onPress={() => confirmPatch(`Set role to ${r}`, u.id, { role: r })}
                >
                  {r?.charAt(0).toUpperCase()}{r?.slice(1)}
                </M3Button>
              ))}
            </View>
            <View style={styles.permissionsGrid}>
              <M3Button
                variant={u.role === 'platformAdmin' ? "filled" : "tonal"}
                style={styles.flex1}
                disabled={patchUser.isPending || !canAssignPlatformAdmin}
                onPress={() => confirmPatch('Grant platform admin', u.id, { role: 'platformAdmin' })}
              >
                Platform Admin
              </M3Button>
              <M3Button
                variant={u.isVerified ? "filled" : "outlined"}
                style={styles.flex1}
                disabled={patchUser.isPending}
                onPress={() => confirmPatch(u.isVerified ? 'Remove verification' : 'Verify user', u.id, { isVerified: !u.isVerified })}
              >
                {u.isVerified ? 'Unverify' : 'Verify'}
              </M3Button>
            </View>
          </View>

          {/* 2. Trust & Safety (Handle & Marketplace) */}
          <View style={styles.controlSection}>
            <Text style={styles.controlSectionTitle}>TRUST & SAFETY</Text>
            <View style={styles.permissionsGrid}>
              <M3Button
                variant={u.handleStatus === 'approved' ? "filled" : "tonal"}
                style={styles.flex1}
                disabled={patchUser.isPending || u.handleStatus === 'approved'}
                onPress={() => confirmPatch('Approve handle', u.id, { handleStatus: 'approved' })}
              >
                Approve Handle
              </M3Button>
              <M3Button
                variant="outlined"
                style={styles.flex1}
                disabled={patchUser.isPending || u.handleStatus === 'rejected'}
                onPress={() => confirmPatch('Reject handle', u.id, { handleStatus: 'rejected' })}
              >
                Reject Handle
              </M3Button>
            </View>
            <M3Button
              variant={u.approvedMarketplacePublisher ? "filled" : "outlined"}
              disabled={patchUser.isPending}
              onPress={() => confirmPatch(u.approvedMarketplacePublisher ? 'Revoke marketplace access' : 'Approve for marketplace', u.id, { approvedMarketplacePublisher: !u.approvedMarketplacePublisher })}
            >
              {u.approvedMarketplacePublisher ? 'Revoke Marketplace Publisher' : 'Approve Marketplace Publisher'}
            </M3Button>
          </View>

          {/* 3. Membership Management */}
          <View style={styles.controlSection}>
            <Text style={styles.controlSectionTitle}>MEMBERSHIP</Text>
            <View style={styles.rowGap12}>
              <M3Button
                variant="filled"
                style={styles.flex1}
                disabled={grantPlus.isPending}
                onPress={() =>
                  Alert.alert('Grant Plus', 'Select duration:', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: '7 Days', onPress: () => grantPlus.mutate({ id: u.id, days: 7 }) },
                    { text: '30 Days', onPress: () => grantPlus.mutate({ id: u.id, days: 30 }) },
                    { text: '90 Days', onPress: () => grantPlus.mutate({ id: u.id, days: 90 }) },
                  ])
                }
              >
                Grant CulturePass+
              </M3Button>
              <M3Button
                variant="outlined"
                style={styles.flex1}
                disabled={patchUser.isPending || !u.membership}
                onPress={() => confirmPatch('Remove membership', u.id, { membership: null as any })}
              >
                Revoke Access
              </M3Button>
            </View>
          </View>

          {/* 4. Account Lifecycle */}
          <View style={styles.controlSection}>
            <Text style={styles.controlSectionTitle}>ACCOUNT LIFECYCLE</Text>
            <View style={styles.rowGap12}>
              <M3Button
                variant="outlined"
                style={styles.flex1}
                labelStyle={{ color: acctStatus === 'suspended' ? CultureTokens.emerald : colors.error }}
                disabled={patchUser.isPending}
                onPress={() =>
                  acctStatus === 'suspended'
                    ? confirmPatch('Re-activate this account', u.id, { status: 'active' })
                    : confirmPatch('Suspend this account (Permanent until revoked)', u.id, { status: 'suspended' })
                }
              >
                {acctStatus === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </M3Button>
              <M3Button
                variant="outlined"
                style={styles.flex1}
                labelStyle={{ color: colors.error }}
                disabled={deleteUserMutation.isPending}
                onPress={() => handleDeleteUser(u)}
              >
                Delete User
              </M3Button>
            </View>
          </View>

          <View style={styles.dangerZone}>
            <M3Button
              variant="tonal"
              style={styles.flex1}
              onPress={() => {
                const userJson = JSON.stringify(u, null, 2);
                Alert.alert('User JSON Data', userJson.substring(0, 500) + '...');
                console.log('User JSON:', u);
              }}
            >
              Debug JSON
            </M3Button>
            <M3Button
              variant="tonal"
              style={styles.flex1}
              onPress={() => handleCopyLink(u)}
            >
              Copy Link
            </M3Button>
          </View>
        </View>

        <TruncatedText style={[styles.consoleIdText, { color: colors.textTertiary }]} lines={2}>
          {`Console ID: ${u.id} • Managed by ${myRole}`}
        </TruncatedText>
      </GlassView>
    </ScrollView>
  );
};

  return (
    <View style={styles.container}>
      {/* Premium Header - matching new Mission Control style */}
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>User Directory</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              Manage roles, membership & status
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search name, email, handle, or ID (3+ chars = global search)"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="User directory search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.headerActionsRow}>
          <Pressable
            onPress={() => refetchDir()}
            style={[styles.refreshButton, { borderColor: colors.borderLight }]}
          >
            <Ionicons name="refresh" size={20} color={colors.text} />
          </Pressable>
          <M3Button variant="tonal" onPress={handleExportCSV}>
            Export CSV
          </M3Button>
        </View>
      </View>

      {/* Stats Ribbon (E) */}
      {isDesktop && stats && (
        <View style={[styles.statsRibbon, { paddingHorizontal: contentPad }]}>
          <StatCard
            label="Total Users"
            value={stats.users}
            icon="people"
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            label="Suspended"
            value={directory?.filter(u => (u as any).status === 'suspended').length || 0}
            icon="ban"
            color={CultureTokens.coral}
            colors={colors}
          />
          <StatCard
            label="Plus Members"
            value={directory?.filter(u => u.membership?.tier === 'plus').length || 0}
            icon="star"
            color={CultureTokens.emerald}
            colors={colors}
          />
          <StatCard
            label="Active Today"
            value={directory?.filter(u => {
              const lastActive = u.behavioral?.lastActiveAt;
              if (!lastActive) return false;
              return new Date(lastActive).toDateString() === new Date().toDateString();
            }).length || 0}
            icon="flash"
            color={CultureTokens.gold}
            colors={colors}
          />
          <Pressable
            onPress={() => router.push('/admin/host-applications')}
            style={[styles.analyticsLink, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
          >
            <Ionicons name="analytics" size={16} color={colors.primary} />
            <TruncatedText style={[styles.analyticsLinkText, { color: colors.primary }]} lines={1}>
              Host Applications & Funnels
            </TruncatedText>
          </Pressable>
        </View>
      )}

      {/* Bulk Action Bar - Task 1: Fully implemented */}
      {selectedIds.size > 0 && (
        <View style={[
          styles.bulkActionBar,
          styles.bulkActionBarLayout,
          {
            backgroundColor: colors.primarySoft,
            borderBottomColor: colors.borderLight,
            paddingHorizontal: contentPad,
          }
        ]}>
          <Text style={[styles.bulkSelectedText, { color: colors.text }]}>
            {selectedIds.size} selected:
          </Text>
          <M3Button variant="tonal" size="sm" disabled={bulkActionLoading} onPress={() => confirmBulkAction('role', 'organizer')}>
            Bulk: Organizer
          </M3Button>
          <M3Button variant="tonal" size="sm" disabled={bulkActionLoading} onPress={() => confirmBulkAction('role', 'moderator')}>
            Bulk: Moderator
          </M3Button>
          <M3Button variant="outlined" size="sm" disabled={bulkActionLoading} onPress={() => confirmBulkAction('suspend')}>
            Bulk Suspend
          </M3Button>
          <M3Button variant="outlined" size="sm" disabled={bulkActionLoading} onPress={() => confirmBulkAction('reactivate')}>
            Bulk Reactivate
          </M3Button>
          <M3Button variant="filled" size="sm" disabled={bulkActionLoading} onPress={() => confirmBulkAction('grant', 30)}>
            Bulk +30d Plus
          </M3Button>
          <Pressable onPress={clearSelection} style={styles.bulkCancelBtn}>
            <Text style={[styles.bulkCancelText, { color: colors.error }]}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Bulk Confirmation Modal */}
      <Modal visible={showBulkConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassView style={styles.confirmModalShell} contentStyle={styles.confirmModal}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Bulk Action</Text>
            <Text style={[styles.confirmModalBody, { color: colors.textSecondary }]}>
              Apply &quot;{pendingBulkAction?.type}&quot; to {selectedIds.size} users? This cannot be undone easily.
            </Text>

            {isSuperAdmin && (
              <TextInput
                style={[styles.auditInput, { borderColor: colors.borderLight, color: colors.text, marginBottom: 16 }]}
                placeholder="Add audit note..."
                value={auditNote}
                onChangeText={setAuditNote}
              />
            )}

            <View style={styles.rowGap12}>
              <M3Button variant="outlined" style={styles.flex1} onPress={() => setShowBulkConfirm(false)}>Cancel</M3Button>
              <M3Button variant="filled" style={styles.flex1} onPress={executeBulkAction} disabled={bulkActionLoading}>
                {bulkActionLoading ? 'Processing...' : 'Confirm'}
              </M3Button>
            </View>
          </GlassView>
        </View>
      </Modal>

      {/* Filter chips - fully wired (A) */}
      <View style={[styles.filterSortHeader, { paddingHorizontal: contentPad }]}>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.textTertiary }]}>Filter:</Text>

          {/* Role filters */}
          {['user', 'organizer', 'business', 'moderator', 'admin'].map((role) => {
            const active = activeFilters.roles.includes(role);
            return (
              <Pressable
                key={role}
                style={[
                  styles.filterChip,
                  { borderColor: colors.borderLight, backgroundColor: active ? colors.primary : colors.surface }
                ]}
                onPress={() => toggleFilter('roles', role)}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.textInverse : colors.text }]}>
                  {role}
                </Text>
              </Pressable>
            );
          })}

          <View style={[styles.verticalDivider, styles.verticalDividerTall, { backgroundColor: colors.borderLight }]} />

          {/* Status & Membership quick filters */}
          {['active', 'suspended'].map((s) => {
            const active = activeFilters.statuses.includes(s);
            return (
              <Pressable
                key={s}
                style={[
                  styles.filterChip,
                  { borderColor: colors.borderLight, backgroundColor: active ? colors.primary : colors.surface }
                ]}
                onPress={() => toggleFilter('statuses', s)}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.textInverse : colors.text }]}>{s}</Text>
              </Pressable>
            );
          })}

          {['plus', 'free'].map((m) => {
            const active = activeFilters.memberships.includes(m);
            return (
              <Pressable
                key={m}
                style={[
                  styles.filterChip,
                  { borderColor: colors.borderLight, backgroundColor: active ? colors.primary : colors.surface }
                ]}
                onPress={() => toggleFilter('memberships', m)}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.textInverse : colors.text }]}>{m}</Text>
              </Pressable>
            );
          })}

          {(activeFilters.roles.length > 0 || activeFilters.statuses.length > 0 || activeFilters.memberships.length > 0) && (
            <Pressable onPress={() => setActiveFilters({ roles: [], statuses: [], memberships: [] })}>
              <Text style={[styles.clearAllText, { color: colors.error }]}>Clear all</Text>
            </Pressable>
          )}
        </View>

        {/* Sort Controls - Task 2 */}
        <View style={styles.sortControlsRow}>
          <Text style={[styles.sortLabel, { color: colors.textTertiary }]}>Sort by:</Text>
          {[
            { label: 'Joined', value: 'joined' },
            { label: 'Activity', value: 'activity' },
            { label: 'Name', value: 'name' },
          ].map((option) => {
            const isActive = sortBy === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (sortBy === option.value) {
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortBy(option.value as any);
                    setSortDir('desc');
                  }
                }}
                style={[
                  styles.sortChip,
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={[
                  styles.sortChipText,
                  { color: isActive ? colors.textInverse : colors.text },
                ]}>
                  {option.label}
                  {isActive && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bulk selection shortcuts */}
      {users.length > 0 && (
        <View style={[styles.selectAllRow, { paddingHorizontal: contentPad }]}>
          <Pressable onPress={selectedIds.size > 0 ? clearSelection : selectAllVisible}>
            <Text style={[styles.selectAllLink, { color: colors.primary }]}>
              {selectedIds.size > 0 ? `Deselect All (${selectedIds.size})` : 'Select All Visible'}
            </Text>
          </Pressable>
          <Text style={[styles.paginationMeta, { color: colors.textTertiary }]}>
            Showing {users.length} of {totalCount} (page {page + 1} of {totalPages || 1})
          </Text>
          {/* Basic pagination controls (admin roadmap) */}
          <View style={styles.paginationRow}>
            <Pressable onPress={() => setPage(p => Math.max(0, p-1))} disabled={page===0}>
              <Text style={[styles.paginationLink, { color: page === 0 ? colors.textTertiary : colors.primary }]}>Prev</Text>
            </Pressable>
            <Pressable onPress={() => setPage(p => p+1)} disabled={page + 1 >= totalPages}>
              <Text style={[styles.paginationLink, { color: page + 1 >= totalPages ? colors.textTertiary : colors.primary }]}>Next</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.body, { paddingHorizontal: contentPad }]}>
        <View style={[styles.listCol, isDesktop && styles.listColDesktop]}>
          {isDesktop && (
            <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.colCheckbox} />
              <View style={styles.colUser}><Text style={styles.tableHeaderText}>USER</Text></View>
              <View style={styles.colRole}><Text style={styles.tableHeaderText}>ROLE</Text></View>
              <View style={styles.colStatus}><Text style={styles.tableHeaderText}>STATUS</Text></View>
              <View style={styles.colJoined}><Text style={styles.tableHeaderText}>JOINED</Text></View>
            </View>
          )}
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            contentContainerStyle={isDesktop ? styles.listContentDesktop : styles.listContentMobile}
            ListEmptyComponent={
              <View style={[styles.empty, isDesktop && styles.emptyDesktop]}>
                {isLoading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyListText, { color: colors.textTertiary }]}>
                      No users match your filters
                    </Text>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => {
              const active = selectedUserId === item.id;
              const isSelected = selectedIds.has(item.id);
              const status = (item as any).status || 'active';

              if (isDesktop) {
                return (
                  <Pressable
                    onPress={() => setSelectedUserId(item.id)}
                    style={[
                      styles.tableRow,
                      active && { backgroundColor: colors.primarySoft },
                      { borderBottomColor: colors.borderLight }
                    ]}
                  >
                    <Pressable onPress={() => toggleSelect(item.id)} style={styles.colCheckboxPressable}>
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={18}
                        color={isSelected ? colors.primary : colors.textTertiary}
                      />
                    </Pressable>
                    <View style={styles.colUserCell}>
                      <View style={[styles.avatarSmall, { backgroundColor: colors.backgroundSecondary }]}>
                        {item.avatarUrl ? (
                          <Image source={{ uri: item.avatarUrl }} style={styles.avatarListImage} />
                        ) : (
                          <Text style={[styles.avatarTextSmall, { color: colors.textSecondary }]}>
                            {(item.displayName || item.username || 'U').charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.colUserMeta}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{item.displayName || item.username}</Text>
                        <Text style={[styles.userHandle, { color: colors.textTertiary }]} numberOfLines={1} ellipsizeMode="tail">
                          @{item.username}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.colRole}>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{(item.role ?? 'user').toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.colStatus}>
                      <View style={[styles.miniBadge, { backgroundColor: status === 'suspended' ? colors.error + '20' : colors.success + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: status === 'suspended' ? colors.error : colors.success }]}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.colJoined}>
                      <Text style={[styles.joinedDateText, { color: colors.textTertiary }]}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : '—'}
                      </Text>
                    </View>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  onPress={() => setSelectedUserId(item.id)}
                  accessibilityRole="button"
                >
                  <GlassView
                    style={[
                      active && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                    contentStyle={styles.userItem}
                  >
                    <Pressable onPress={() => toggleSelect(item.id)} style={styles.mobileSelectBtn}>
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={22}
                        color={isSelected ? colors.primary : colors.textTertiary}
                      />
                    </Pressable>
                    <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                      {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.mobileAvatarImage} />
                      ) : (
                        <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                          {(item.displayName || item.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.mobileUserMeta}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {item.displayName || item.username || 'User'}
                      </Text>
                      <Text style={[styles.userHandle, { color: colors.textTertiary }]}>
                        @{item.username || item.handle || 'unknown'}
                      </Text>
                    </View>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{(item.role ?? 'user').toUpperCase()}</Text>
                    </View>
                  </GlassView>
                </Pressable>
              );
            }}
          />
        </View>

        {isDesktop && (
          <View style={styles.detailCol}>{selectedUser ? renderDetail(selectedUser) : <EmptyDetail colors={colors} />}</View>
        )}
      </View>

      {!isDesktop && (
        <Modal visible={!!selectedUserId} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedUserId(null)}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
            <Pressable onPress={() => setSelectedUserId(null)} accessibilityLabel="Close user detail">
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>User detail</Text>
            <View style={styles.modalSpacer} />
          </View>
          <View style={[styles.modalBody, { backgroundColor: colors.background }]}>
            {selectedUser ? renderDetail(selectedUser) : null}
          </View>
        </Modal>
      )}
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: { label: string; value: string | number; icon: any; color: string; colors: any }) {
  return (
    <GlassView style={styles.statCardShell} contentStyle={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statCardMeta}>
        <Text style={[styles.statCardLabel, { color: colors.textTertiary }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.statCardValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      </View>
    </GlassView>
  );
}

function InfoRow({ label, value, color, colors }: { label: string; value: string; color?: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoKey, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.infoVal, { color: color || colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EmptyDetail({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.emptyDetail, styles.emptyDetailDesktop]}>
      <Ionicons name={"person-circle-outline" as any} size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyDetailText, { color: colors.textTertiary }]}>
        Select a user to view controls
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    gap: 20,
    flexWrap: 'wrap',
    paddingVertical: Platform.OS === 'web' ? 8 : 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  countPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    searchBox: {
    flex: 1,
    minWidth: 200,
    maxWidth: 420,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FontFamily.medium },

  body: { flex: 1, flexDirection: 'row', gap: Spacing.lg },
  listCol: { flex: 1 },
  detailCol: { flex: 2, paddingVertical: 20 },

  userItem: { padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: FontFamily.bold },
  userName: { fontSize: 15, fontFamily: FontFamily.bold },
  userHandle: { fontSize: 13, fontFamily: FontFamily.medium },
  roleBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: Radius.xs },
  roleText: { fontSize: 9, fontFamily: FontFamily.bold, opacity: 0.6 },

  detailCard: { padding: Spacing.lg, gap: Spacing.lg },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  largeAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  largeAvatarText: { fontSize: 32, fontFamily: FontFamily.bold },
  detailName: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  detailHandle: { fontSize: 16, fontFamily: FontFamily.medium, marginTop: -4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  statCell: { alignItems: 'center', gap: Spacing.xs },
  statVal: { fontSize: 18, fontFamily: FontFamily.bold },
  statLabel: { fontSize: 10, fontFamily: FontFamily.bold, opacity: 0.5 },
  statDivider: { width: 1, height: 22 },

  controlSection: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  controlSectionTitle: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: CultureTokens.grey500,
    letterSpacing: 1,
    marginBottom: 4,
  },

  infoSection: { padding: Spacing.md, borderRadius: Radius.md, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  infoKey: { fontSize: 12, fontFamily: FontFamily.bold },
  infoVal: { fontSize: 13, fontFamily: FontFamily.medium, flex: 1, textAlign: 'right' },

  groupTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  permissionsGrid: { flexDirection: 'row', gap: Spacing.md },

  dangerZone: { flexDirection: 'row', gap: Spacing.md, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, opacity: 0.5 },
  emptyDesktop: { paddingTop: 24 },
  emptyDetail: { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  emptyDetailDesktop: { paddingHorizontal: 12 },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontFamily: FontFamily.bold },

  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // New high-quality styles for hardened directory
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  tableHeaderText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: CultureTokens.grey500,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  timelineBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    minHeight: 60,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  auditInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmModal: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    minWidth: 160,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // --- FIXES-001: Targeted extraction of repeated inline styles (layout deformity remediation) ---
  // These entries replace the most common raw inline objects in the filter/sort/bulk bar and detail views.
  // All values align with design tokens (Spacing, Radius, FontFamily). See docs/FIXES-001-layout-deformities.md
  bulkActionBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterSortHeader: {
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  selectAllRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  verticalDivider: {
    width: 1,
    // backgroundColor supplied at call site
  },
  analyticsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignSelf: 'center',
  },
  analyticsLinkText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  headerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  clearSearchBtn: {
    padding: Spacing.xs,
  },
  statsRibbon: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  sortControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  sortLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  detailMetaCol: {
    flex: 1,
    gap: Spacing.xs,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarDetailImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarListImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  consoleIdText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },

  // --- FIXES-001 P3: Remaining inline style extraction (detail, bulk, filter, table, pagination) ---
  flex1: { flex: 1 },
  gapMd: { gap: Spacing.md },
  gap16: { gap: Spacing.lg },
  rowGap16: { flexDirection: 'row', gap: Spacing.lg },
  flex1Gap8: { flex: 1, gap: Spacing.sm },
  timelineTitle: { fontSize: 12, fontFamily: FontFamily.bold },
  timelineCaption: { fontSize: 10 },
  auditSection: { gap: 6 },
  auditLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auditLabel: { fontSize: 11, fontFamily: FontFamily.medium },
  auditClear: { fontSize: 10 },
  rowGap12: { flexDirection: 'row', gap: Spacing.md },
  bulkActionBarLayout: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  bulkSelectedText: { fontFamily: FontFamily.medium },
  bulkCancelBtn: { marginLeft: 12 },
  bulkCancelText: { fontFamily: FontFamily.medium },
  confirmModalShell: { width: '100%', maxWidth: 400 },
  confirmModalBody: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', alignItems: 'center', flex: 1 },
  filterLabel: { fontSize: 12, marginRight: 4 },
  clearAllText: { fontSize: 12, marginLeft: 8 },
  sortChipText: { fontSize: 12, fontFamily: FontFamily.medium },
  selectAllLink: { fontSize: 13, fontFamily: FontFamily.medium },
  paginationMeta: { fontSize: 12 },
  paginationRow: { flexDirection: 'row', gap: Spacing.sm, marginLeft: 12 },
  paginationLink: { fontSize: 12, fontFamily: FontFamily.medium },
  colCheckbox: { width: 32 },
  colUser: { flex: 3 },
  colRole: { flex: 1.5 },
  colStatus: { flex: 1.5 },
  colJoined: { flex: 1 },
  colUserCell: { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 10 },
  colUserMeta: { flex: 1 },
  colCheckboxPressable: { width: 32, alignItems: 'center' },
  statusBadgeText: { fontSize: 9, fontFamily: FontFamily.bold },
  joinedDateText: { fontSize: 12 },
  emptyListText: { marginTop: 12, fontFamily: FontFamily.medium },
  mobileSelectBtn: { paddingRight: 8 },
  mobileAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  mobileUserMeta: { flex: 1, gap: 3 },
  modalSpacer: { width: 28 },
  modalBody: { flex: 1, padding: 16 },
  statCardShell: { flex: 1, minWidth: 160 },
  statCardMeta: { flex: 1 },
  emptyDetailText: { marginTop: 16, fontFamily: FontFamily.medium },
  detailCardDesktop: { marginHorizontal: 8, marginBottom: 20 },
  detailCardMobile: { marginVertical: 8, marginBottom: 20 },
  listColDesktop: { maxWidth: 650 },
  listContentDesktop: { gap: 4, paddingVertical: 8 },
  listContentMobile: { gap: 12, paddingVertical: 20 },
  verticalDividerShort: { height: 10 },
  verticalDividerTall: { height: 20 },
});
