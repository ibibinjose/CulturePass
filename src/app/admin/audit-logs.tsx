/**
 * Admin Audit Logs
 * ================
 * Immutable trail of all high-authority actions across the platform.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { useAuditLogs } from '@/modules/admin/hooks/useAdminStats';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/hooks/queries/keys';

export default function AuditLogsScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const queryClient = useQueryClient();
  const limit = 50;
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const { data, isLoading, isRefetching, refetch } = useAuditLogs(limit);

  const logs = data?.logs || [];
  const paginatedLogs = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Audit Logs</Text>
            <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ color: colors.primary, fontSize: 11, fontFamily: FontFamily.bold }}>SYSTEM IMMUTABLE</Text>
            </View>
        </View>
        <Pressable
          style={styles.filterBtn}
          onPress={() => void queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs({ limit }) })}
          accessibilityLabel="Refresh audit logs"
        >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            <Text style={[styles.filterText, { color: colors.textSecondary }]}>Refresh</Text>
        </Pressable>
      </View>

      {/* Pagination for scale */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: hPad, paddingVertical: 8 }}>
        <Pressable onPress={() => setPage(p => Math.max(0, p-1))} disabled={page===0}>
          <Text style={{ color: page===0 ? colors.textTertiary : colors.primary }}>Prev</Text>
        </Pressable>
        <Text style={{ color: colors.textTertiary }}>Page {page+1} ({paginatedLogs.length} / {logs.length})</Text>
        <Pressable onPress={() => setPage(p => p+1)} disabled={paginatedLogs.length < PAGE_SIZE}>
          <Text style={{ color: colors.primary }}>Next</Text>
        </Pressable>
      </View>

      <FlatList
        data={paginatedLogs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 24, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        ListEmptyComponent={
            <View style={styles.empty}>
                <Text style={{ color: colors.textTertiary, fontFamily: FontFamily.medium }}>
                    {isLoading ? 'Loading logs...' : logs.length === 0 ? 'No logs found' : 'No logs on this page'}
                </Text>
            </View>
        }
        renderItem={({ item }) => (
            <GlassView contentStyle={styles.logItem}>
                <View style={[styles.actionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="flash" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.logTitleRow}>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
                        <Text style={[styles.actionTag, { color: colors.textTertiary }]}>{item.action.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                        Target ID: <Text style={{ fontFamily: FontFamily.medium }}>{item.targetId || 'N/A'}</Text>
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.logDate, { color: colors.textTertiary }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.logTime, { color: colors.textTertiary }]}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                </View>
            </GlassView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: HeaderTokens.height, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  countPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { fontSize: 14, fontFamily: FontFamily.bold },

  logItem: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  userName: { fontSize: 15, fontFamily: FontFamily.bold },
  actionTag: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  logMeta: { fontSize: 12, fontFamily: FontFamily.medium },
  logDate: { fontSize: 11, fontFamily: FontFamily.bold },
  logTime: { fontSize: 11, fontFamily: FontFamily.medium, opacity: 0.6 },
  empty: { padding: 60, alignItems: 'center' },
});
