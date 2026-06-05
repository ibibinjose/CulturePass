/**
 * Admin — Member Monitoring
 * =========================
 * Engagement, retention, birthday, and community participation signals.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, FontFamily, CultureTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

type MemberFilter = 'all' | 'birthdays' | 'highly_active' | 'low_active';
type MemberAction = 'birthday_voucher' | 'free_ticket_promo' | 'targeted_vouchers';

const FILTERS: { key: MemberFilter; label: string }[] = [
  { key: 'all', label: 'All users' },
  { key: 'birthdays', label: 'Birthday month' },
  { key: 'highly_active', label: 'Active' },
  { key: 'low_active', label: 'Needs lift' },
];

const ACTION_LABELS: Record<MemberAction, string> = {
  birthday_voucher: 'Birthday vouchers',
  free_ticket_promo: 'Free ticket promo',
  targeted_vouchers: 'Target vouchers',
};

function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function MemberMonitoringScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MemberFilter>('all');

  const queryParams = useMemo(
    () => ({ filter: selectedFilter, search: search.trim(), limit: 100 }),
    [selectedFilter, search],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: adminKeys.memberMonitoring(queryParams),
    queryFn: () => api.admin.memberMonitoring(queryParams),
    refetchInterval: 60000,
  });

  const queueAction = useMutation({
    mutationFn: ({ userId, action, name }: { userId: string; action: MemberAction; name: string }) =>
      api.admin.queueMemberAction(userId, action, `${ACTION_LABELS[action]} queued for ${name}`),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs({ limit: 50 }) });
      notify('Action queued', `${ACTION_LABELS[variables.action]} has been queued and written to the audit trail.`);
    },
    onError: (error: Error) => notify('Action failed', error.message || 'Unable to queue member action.'),
  });

  const members = data?.members ?? [];
  const stats = data?.stats;
  const currentMonth = new Date().toLocaleString(undefined, { month: 'long' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Member Monitoring</Text>
          <View style={[styles.statusPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>LIVE ENGAGEMENT</Text>
          </View>
        </View>
        <M3Button variant="tonal" onPress={() => refetch()} disabled={isFetching}>
          Refresh
        </M3Button>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 24, gap: 20 }}>
        <View style={{ gap: 4 }}>
          <Text style={[styles.subtitle, { color: colors.text }]}>Participation and retention signals</Text>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Real member signals from users, tickets, and community membership data. Actions are queued server-side and audit logged.
          </Text>
        </View>

        <GlassView contentStyle={styles.statsCard}>
          <View style={styles.statsGrid}>
            <Stat label="Total users" value={stats?.totalMembers?.toLocaleString() ?? '-'} sub={`${stats?.sampledUsers ?? 0} sampled`} color={colors.text} />
            <Divider />
            <Stat label="Revenue sample" value={`$${Math.round((stats?.totalSpentCents ?? 0) / 100).toLocaleString()}`} sub={`${stats?.sampledTickets ?? 0} tickets`} color={CultureTokens.teal} />
            <Divider />
            <Stat label={`${currentMonth} birthdays`} value={String(stats?.currentMonthBirthdays ?? '-')} sub="Gift candidates" color={CultureTokens.coral} />
            <Divider />
            <Stat label="Attendances" value={(stats?.totalAttended ?? 0).toLocaleString()} sub="Recent ticket signals" color={colors.primary} />
          </View>
        </GlassView>

        <View style={styles.controlsRow}>
          <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
            {FILTERS.map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter members by ${tab.label}`}
                  onPress={() => setSelectedFilter(tab.key)}
                  style={[styles.tabButton, active && { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.tabText, { color: active ? colors.text : colors.textSecondary }, active && { fontFamily: FontFamily.semibold }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              placeholder="Search name, city, email, or interests..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
              accessibilityLabel="Member monitoring search"
            />
            {search.length > 0 && (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, marginTop: 8 }}>Loading member signals...</Text>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="filter-outline" size={32} color={colors.textTertiary} />
            <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, marginTop: 8 }}>No members match this view</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {members.map((member) => {
              const isBirthdayMonth = member.birthdayMonth === String(new Date().getMonth() + 1).padStart(2, '0');
              return (
                <GlassView key={member.id} contentStyle={styles.memberCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatarWell, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="person" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>{member.name}</Text>
                        <Text style={[styles.memberUser, { color: colors.textTertiary }]} numberOfLines={1}>@{member.username}</Text>
                        {isBirthdayMonth && (
                          <View style={[styles.birthdayBadge, { backgroundColor: colors.primarySoft }]}>
                            <Ionicons name="gift-outline" size={11} color={CultureTokens.coral} />
                            <Text style={[styles.birthdayBadgeText, { color: CultureTokens.coral }]}>BIRTHDAY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memberEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                        {[member.email, member.city, member.country].filter(Boolean).join(' · ') || member.id}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  <View style={styles.detailGrid}>
                    <Detail label="Birthday" value={member.birthday || 'Not set'} color={colors.text} />
                    <Detail label="Events attended" value={`${member.attendedCount} events`} color={colors.text} />
                    <Detail label="Money spent" value={`$${(member.moneySpentCents / 100).toFixed(2)}`} color={CultureTokens.teal} />
                    <Detail label="Time engaged" value={`${member.timeSpentHours} hrs`} color={colors.primary} />
                  </View>

                  <View style={{ gap: 8, marginVertical: 8 }}>
                    <View style={styles.inlineWrap}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>FAVORITE LANE:</Text>
                      <View style={[styles.lanePill, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.laneText, { color: colors.text }]}>{member.favoriteCategory}</Text>
                      </View>
                    </View>
                    <View style={styles.inlineWrap}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>INTEREST TAGS:</Text>
                      {(member.interests.length ? member.interests : ['No tags yet']).map((tag) => (
                        <View key={tag} style={[styles.interestTag, { borderColor: colors.borderLight }]}>
                          <Text style={[styles.interestText, { color: colors.textSecondary }]}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  <View style={styles.actionRow}>
                    <ActionButton label="Birthday vouchers" icon="gift-outline" color={CultureTokens.coral} disabled={queueAction.isPending} onPress={() => queueAction.mutate({ userId: member.id, name: member.name, action: 'birthday_voucher' })} />
                    <ActionButton label="Free ticket promo" icon="ticket-outline" color={colors.primary} disabled={queueAction.isPending} onPress={() => queueAction.mutate({ userId: member.id, name: member.name, action: 'free_ticket_promo' })} />
                    <ActionButton label="Target vouchers" icon="pricetag-outline" color={CultureTokens.teal} disabled={queueAction.isPending} onPress={() => queueAction.mutate({ userId: member.id, name: member.name, action: 'targeted_vouchers' })} />
                  </View>
                </GlassView>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );

  function Divider() {
    return <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />;
  }

  function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
      <View style={styles.statBox}>
        <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={[styles.statSub, { color: colors.textSecondary }]}>{sub}</Text>
      </View>
    );
  }

  function Detail({ label, value, color }: { label: string; value: string; color: string }) {
    return (
      <View style={styles.detailBox}>
        <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
      </View>
    );
  }

  function ActionButton({ label, icon, color, disabled, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; disabled: boolean; onPress: () => void }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.surface, borderColor: color }, (pressed || disabled) && { opacity: 0.72 }]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  title: { fontSize: 24, fontFamily: FontFamily.bold },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  subtitle: { fontSize: 18, fontFamily: FontFamily.bold },
  descText: { fontSize: 13, lineHeight: 20 },
  statsCard: { padding: 20, gap: 16 },
  statsGrid: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  statBox: { flex: 1, minWidth: 130, gap: 4 },
  statLabel: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  statValue: { fontSize: 24, fontFamily: FontFamily.bold },
  statSub: { fontSize: 11, fontFamily: FontFamily.medium },
  statDivider: { width: 1, height: 48, marginHorizontal: 8 },
  controlsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: 3, borderRadius: 10, borderWidth: 1 },
  tabButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  tabText: { fontSize: 12, fontFamily: FontFamily.medium },
  searchBar: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  memberCard: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  memberName: { fontSize: 15, fontFamily: FontFamily.bold, maxWidth: 260 },
  memberUser: { fontSize: 13, fontFamily: FontFamily.regular, maxWidth: 160 },
  memberEmail: { fontSize: 12, fontFamily: FontFamily.medium },
  birthdayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  birthdayBadgeText: { fontSize: 8, fontFamily: FontFamily.bold },
  divider: { height: 1, width: '100%' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailBox: { flex: 1, minWidth: 120, gap: 2 },
  detailLabel: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontFamily: FontFamily.semibold },
  inlineWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  lanePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  laneText: { fontSize: 11, fontFamily: FontFamily.semibold },
  interestTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  interestText: { fontSize: 10, fontFamily: FontFamily.medium },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 11, fontFamily: FontFamily.semibold },
  emptyWrap: { padding: 48, alignItems: 'center', justifyContent: 'center' },
});
