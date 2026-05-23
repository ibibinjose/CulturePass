/**
 * Admin User Directory
 * ====================
 * Browse the user base, inspect profiles, adjust roles, suspend accounts, and grant membership.
 */
import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';
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
  const contentPad = isDesktop ? Math.max(14, hPad - 12) : hPad;
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { role: myRole, hasRole } = useRole();
  const canAssignPlatformAdmin = hasRole('platformAdmin');

  const searchTrim = search.trim();
  const useRemoteSearch = searchTrim.length > 2;

  const { data: directory, isLoading: dirLoading } = useQuery({
    queryKey: adminKeys.usersDirectory(),
    queryFn: () => api.users.list(),
    enabled: !useRemoteSearch,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: searchKeys.query({ q: searchTrim, type: 'user' }),
    queryFn: () => api.search.query({ q: searchTrim, type: 'user' }),
    enabled: useRemoteSearch,
  });

  const users = useMemo(() => {
    if (useRemoteSearch) return searchData?.users ?? [];
    const base = directory ?? [];
    return base.filter((u) => matchesQuery(u, searchTrim));
  }, [useRemoteSearch, searchData?.users, directory, searchTrim]);

  const isLoading = useRemoteSearch ? searchLoading : dirLoading;

  const { data: selectedUser } = useQuery({
    queryKey: adminKeys.userDetail(selectedUserId!),
    queryFn: () => api.users.get(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const patchUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: User['role']; status?: 'active' | 'suspended' } }) =>
      api.admin.patchUser(id, data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.usersDirectory() });
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(vars.id) });
      queryClient.invalidateQueries({ queryKey: searchKeys.all });
    },
  });

  const grantPlus = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => api.admin.grantMembership(id, days, 'Admin grant from directory'),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(vars.id) });
      Alert.alert('Membership', 'CulturePass+ grant applied.');
    },
    onError: (e: Error) => Alert.alert('Grant failed', e.message ?? 'Unknown error'),
  });

  const confirmPatch = useCallback(
    (label: string, id: string, data: { role?: User['role']; status?: 'active' | 'suspended' }) => {
      Alert.alert('Confirm', `${label}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: data.status === 'suspended' ? 'destructive' : 'default',
          onPress: () =>
            patchUser.mutate(
              { id, data },
              {
                onSuccess: () => Alert.alert('Updated', 'User record saved.'),
                onError: (e: Error) => Alert.alert('Error', e.message ?? 'Update failed'),
              },
            ),
        },
      ]);
    },
    [patchUser],
  );

  const renderDetail = (u: User) => {
    const acctStatus = (u as { status?: string }).status;
    return (
      <GlassView contentStyle={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={[styles.largeAvatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.largeAvatarText, { color: colors.primary }]}>
              {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.detailName, { color: colors.text }]}>{u.displayName || '—'}</Text>
            <Text style={[styles.detailHandle, { color: colors.textSecondary }]}>
              @{u.username || u.handle || 'unknown'}
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
            </View>
          </View>
        </View>

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
            <Text style={[styles.statVal, { color: colors.text }]}>{u.connectionsCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>CONNECTIONS</Text>
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.primarySoft }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textTertiary }]}>User ID</Text>
            <Text style={[styles.infoVal, { color: colors.text }]} selectable>
              {u.id}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Role</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>{u.role ?? 'user'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Membership</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>{u.membership?.tier ?? 'free'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Joined</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>ROLES</Text>
          <View style={styles.permissionsGrid}>
            <M3Button
              variant="tonal"
              style={{ flex: 1 }}
              disabled={patchUser.isPending}
              onPress={() => confirmPatch('Promote this user to organizer', u.id, { role: 'organizer' })}
            >
              Organizer
            </M3Button>
            <M3Button
              variant="tonal"
              style={{ flex: 1 }}
              disabled={patchUser.isPending}
              onPress={() => confirmPatch('Set role to moderator', u.id, { role: 'moderator' })}
            >
              Moderator
            </M3Button>
          </View>
          <View style={styles.permissionsGrid}>
            <M3Button
              variant="tonal"
              style={{ flex: 1 }}
              disabled={patchUser.isPending}
              onPress={() => confirmPatch('Set role to standard user', u.id, { role: 'user' })}
            >
              Standard User
            </M3Button>
            <M3Button
              variant="tonal"
              style={{ flex: 1 }}
              disabled={patchUser.isPending || !canAssignPlatformAdmin}
              onPress={() => confirmPatch('Grant full platform admin', u.id, { role: 'platformAdmin' })}
            >
              Platform Admin
            </M3Button>
          </View>
          {!canAssignPlatformAdmin ? (
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: FontFamily.medium }}>
              Only platform admins can assign the platform admin role.
            </Text>
          ) : null}
        </View>

        <View style={{ gap: 12 }}>
          <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>MEMBERSHIP</Text>
          <M3Button
            variant="filled"
            disabled={grantPlus.isPending}
            onPress={() =>
              Alert.alert('Grant CulturePass+', 'Grant 30 days of Plus to this user?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Grant 30d', onPress: () => grantPlus.mutate({ id: u.id, days: 30 }) },
              ])
            }
          >
            Grant 30 days Plus
          </M3Button>
        </View>

        <View style={styles.dangerZone}>
          <M3Button
            variant="outlined"
            style={{ flex: 1 }}
            labelStyle={{ color: colors.error }}
            disabled={patchUser.isPending || acctStatus === 'suspended'}
            onPress={() => confirmPatch('Suspend this account (sign-in revoked)', u.id, { status: 'suspended' })}
          >
            Suspend
          </M3Button>
          <M3Button
            variant="tonal"
            style={{ flex: 1 }}
            disabled={patchUser.isPending || acctStatus !== 'suspended'}
            onPress={() => confirmPatch('Re-activate this account', u.id, { status: 'active' })}
          >
            Reactivate
          </M3Button>
        </View>
        <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: FontFamily.medium }}>
          Signed-in as {myRole}. Profile field edits still belong in the user profile editor; this console updates
          authorization state only.
        </Text>
      </GlassView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>User Directory</Text>
          <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontSize: 11, fontFamily: FontFamily.bold }}>
              {users.length} {useRemoteSearch ? 'MATCHES' : 'LOADED'}
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Filter or search (3+ chars uses global search)…"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="User directory search"
          />
        </View>
      </View>

      <View style={[styles.body, { paddingHorizontal: contentPad }]}>
        <View style={[styles.listCol, isDesktop && { maxWidth: 450 }]}>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: isDesktop ? 8 : 12, paddingVertical: isDesktop ? 12 : 20 }}
            ListEmptyComponent={
              <View style={[styles.empty, isDesktop && styles.emptyDesktop]}>
                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary, marginTop: 12, fontFamily: FontFamily.medium }}>
                  {isLoading ? 'Loading directory…' : 'No users match'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const active = selectedUserId === item.id;
              return (
                <Pressable
                  onPress={() => {
                    setSelectedUserId(item.id);
                    if (!isDesktop) {
                      /* modal opens via selectedUserId */
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open user ${item.displayName || item.username}`}
                >
                  <GlassView
                    style={[active && { borderColor: colors.primary, borderWidth: 2 }]}
                    contentStyle={styles.userItem}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                        {(item.displayName || item.username || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
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
            <View style={{ width: 28 }} />
          </View>
          <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
            {selectedUser ? renderDetail(selectedUser) : null}
          </View>
        </Modal>
      )}
    </View>
  );
}

function EmptyDetail({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.emptyDetail, styles.emptyDetailDesktop]}>
      <Ionicons name="person-circle-outline" size={64} color={colors.textTertiary} />
      <Text style={{ color: colors.textTertiary, marginTop: 16, fontFamily: FontFamily.medium }}>
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
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FontFamily.medium },

  body: { flex: 1, flexDirection: 'row', gap: 18 },
  listCol: { flex: 1 },
  detailCol: { flex: 2, paddingVertical: 20 },

  userItem: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: FontFamily.bold },
  userName: { fontSize: 15, fontFamily: FontFamily.bold },
  userHandle: { fontSize: 13, fontFamily: FontFamily.medium },
  roleBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 9, fontFamily: FontFamily.bold, opacity: 0.6 },

  detailCard: { padding: 24, gap: 24 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  largeAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  largeAvatarText: { fontSize: 32, fontFamily: FontFamily.bold },
  detailName: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  detailHandle: { fontSize: 16, fontFamily: FontFamily.medium, marginTop: -4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  statCell: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontFamily: FontFamily.bold },
  statLabel: { fontSize: 10, fontFamily: FontFamily.bold, opacity: 0.5 },
  statDivider: { width: 1, height: 22 },

  infoSection: { padding: 16, borderRadius: 16, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoKey: { fontSize: 12, fontFamily: FontFamily.bold },
  infoVal: { fontSize: 13, fontFamily: FontFamily.medium, flex: 1, textAlign: 'right' },

  groupTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  permissionsGrid: { flexDirection: 'row', gap: 12 },

  dangerZone: { flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },

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
});
