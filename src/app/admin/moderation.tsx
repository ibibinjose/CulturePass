/**
 * Admin Moderation Hub
 * ====================
 * Split-pane review console for reported content.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, Alert, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { M3Button, M3FilterChip } from '@/design-system/ui';
import { GlassView } from '@/design-system/ui/GlassView';
import { HeaderTokens, CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { adminKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import type { ContentReport, ModerationReportContext } from '@/shared/schema/moderation';

type ModerationStatus = 'pending' | 'resolved' | 'dismissed' | 'all';
type ModerationAction = 'dismissed' | 'keep_content' | 'remove_item' | 'ban_user';

const STATUS_LABELS: Record<ModerationStatus, string> = {
  pending: 'Pending',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
  all: 'All',
};

const ACTION_LABELS: Record<ModerationAction, string> = {
  dismissed: 'Dismiss report',
  keep_content: 'Keep content',
  remove_item: 'Remove item',
  ban_user: 'Suspend user',
};

function reportReporterId(report: ContentReport): string {
  return report.reporterUserId ?? report.reporterId ?? 'unknown';
}

function formatDate(value?: string): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string | undefined): string {
  if (status === 'pending') return CultureTokens.coral;
  if (status === 'resolved') return CultureTokens.emerald;
  if (status === 'dismissed') return CultureTokens.teal;
  return CultureTokens.indigo;
}

export default function ModerationScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const contentPad = isDesktop ? Math.max(14, hPad - 12) : hPad;
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ModerationStatus>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reportsQuery = useQuery({
    queryKey: adminKeys.reports(status),
    queryFn: () => api.admin.reports({ status, limit: 100 }),
    refetchInterval: status === 'pending' ? 45000 : false,
    retry: 1, // Don't hammer the server too hard on index build errors
  });

  const reports = useMemo(() => reportsQuery.data?.reports ?? [], [reportsQuery.data?.reports]);
  const isIndexError = reportsQuery.error?.message?.includes('Failed to load reports') || 
                       reportsQuery.error?.message?.includes('index');

  // Show warning if we're in fallback mode or index is still building
  const showIndexWarning = !!reportsQuery.error || isIndexError;

  useEffect(() => {
    if (!selectedId && reports.length > 0 && isDesktop) setSelectedId(reports[0].id);
    if (selectedId && !reports.some((report) => report.id === selectedId)) setSelectedId(null);
  }, [isDesktop, reports, selectedId]);

  const contextQuery = useQuery({
    queryKey: [...adminKeys.reports(status), 'context', selectedId],
    queryFn: () => api.admin.reportContext(selectedId!),
    enabled: Boolean(selectedId),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: ModerationAction }) => api.admin.resolveReport(id, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminKeys.reports(status) }),
        queryClient.invalidateQueries({ queryKey: adminKeys.complianceSummary() }),
      ]);
      setSelectedId(null);
    },
    onError: (e: Error) => Alert.alert('Action failed', e.message || 'The moderation action could not be saved.'),
  });

  const selectedReport = reports.find((report) => report.id === selectedId) ?? contextQuery.data?.report ?? null;
  const pendingCount = status === 'pending' ? reports.length : undefined;

  // Warning banner for index issues (very common during initial rollout)
  const IndexWarningBanner = showIndexWarning ? (
    <View style={{ 
      backgroundColor: '#FEF3C7', 
      borderColor: '#F59E0B', 
      borderWidth: 1, 
      borderRadius: 8, 
      padding: 12, 
      marginBottom: 16 
    }}>
      <Text style={{ color: '#92400E', fontFamily: FontFamily.semibold }}>
        ⚠️ Reports query is degraded
      </Text>
      <Text style={{ color: '#92400E', fontSize: 13, marginTop: 4 }}>
        The Firestore index for reports is still building or missing. Results may be unsorted or limited. 
        This is temporary — the page will recover automatically once the index is ready (usually 5-30 minutes).
      </Text>
      {reportsQuery.error && (
        <Text style={{ color: '#78350F', fontSize: 12, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
          {reportsQuery.error.message}
        </Text>
      )}
    </View>
  ) : null;

  const runAction = (report: ContentReport, action: ModerationAction) => {
    const destructive = action === 'remove_item' || action === 'ban_user';
    Alert.alert('Confirm moderation action', `${ACTION_LABELS[action]} for this report?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: destructive ? 'Continue' : 'Save',
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolveMutation.mutate({ id: report.id, action }),
      },
    ]);
  };

  const detail = selectedReport ? (
    <ReportDetail
      context={contextQuery.data ?? null}
      report={selectedReport}
      loading={contextQuery.isLoading}
      actionPending={resolveMutation.isPending}
      onAction={runAction}
    />
  ) : (
    <EmptyDetail />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {IndexWarningBanner}

      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Moderation Queue</Text>
          <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {reportsQuery.isLoading ? 'SYNCING' : `${reports.length} ${STATUS_LABELS[status].toUpperCase()}`}
            </Text>
          </View>
        </View>
        <M3Button
          variant="tonal"
          leftIcon="refresh"
          disabled={reportsQuery.isFetching}
          onPress={() => void reportsQuery.refetch()}
          accessibilityLabel="Refresh moderation reports"
        >
          Refresh
        </M3Button>
      </View>

      <View style={[styles.filters, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        {(Object.keys(STATUS_LABELS) as ModerationStatus[]).map((item) => (
          <M3FilterChip
            key={item}
            label={item === 'pending' && pendingCount != null ? `Pending ${pendingCount}` : STATUS_LABELS[item]}
            selected={status === item}
            onPress={() => {
              setStatus(item);
              setSelectedId(null);
            }}
          />
        ))}
      </View>

      <View style={[styles.body, { paddingHorizontal: contentPad }]}>
        <View style={[styles.listCol, isDesktop && { maxWidth: 430 }]}>
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={reportsQuery.isFetching}
            onRefresh={() => void reportsQuery.refetch()}
            ListEmptyComponent={
              <View style={[styles.emptyState, { paddingTop: 80 }]}>
                <Ionicons name="shield-checkmark" size={46} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {reportsQuery.isLoading ? 'Loading reports' : 'Nothing to review'}
                </Text>
                <Text style={[styles.emptyCopy, { color: colors.textTertiary }]}>
                  {reportsQuery.isLoading ? 'Fetching the latest moderation queue.' : `${STATUS_LABELS[status]} reports will appear here.`}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ReportRow
                report={item}
                active={selectedId === item.id}
                onPress={() => setSelectedId(item.id)}
              />
            )}
          />
        </View>

        {isDesktop ? <View style={styles.detailCol}>{detail}</View> : null}
      </View>

      {!isDesktop ? (
        <Modal
          visible={Boolean(selectedReport)}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedId(null)}
        >
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
            <Pressable onPress={() => setSelectedId(null)} accessibilityLabel="Close report detail">
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Report review</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={[styles.modalBody, { backgroundColor: colors.background }]}>{detail}</View>
        </Modal>
      ) : null}
    </View>
  );
}

function ReportRow({ report, active, onPress }: { report: ContentReport; active: boolean; onPress: () => void }) {
  const colors = useColors();
  const accent = statusColor(report.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Review ${report.targetType} report for ${report.targetId}`}
    >
      <GlassView
        style={[active && { borderColor: colors.primary, borderWidth: 2 }]}
        contentStyle={styles.reportCard}
      >
        <View style={styles.rowTop}>
          <View style={[styles.statusDot, { backgroundColor: accent }]} />
          <Text style={[styles.typeText, { color: colors.textTertiary }]}>{report.targetType.toUpperCase()}</Text>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatDate(report.createdAt)}</Text>
        </View>
        <Text style={[styles.targetName, { color: colors.text }]} numberOfLines={1}>
          {report.targetId}
        </Text>
        <Text style={[styles.reasonText, { color: colors.textSecondary }]} numberOfLines={2}>
          {report.reason || 'No reason supplied'}
        </Text>
        <View style={styles.reportMeta}>
          <Text style={[styles.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
            Reporter {reportReporterId(report)}
          </Text>
          <Text style={[styles.statusText, { color: accent }]}>{String(report.status ?? 'pending').toUpperCase()}</Text>
        </View>
      </GlassView>
    </Pressable>
  );
}

function ReportDetail({
  context,
  report,
  loading,
  actionPending,
  onAction,
}: {
  context: ModerationReportContext | null;
  report: ContentReport;
  loading: boolean;
  actionPending: boolean;
  onAction: (report: ContentReport, action: ModerationAction) => void;
}) {
  const colors = useColors();
  const target = context?.target ?? null;
  const reporter = context?.reporter ?? null;
  const isPending = report.status === 'pending';
  const title = target?.title || report.targetId;
  const owner = target?.ownerName || target?.ownerId || 'Unknown';

  const openTarget = () => {
    if (!target?.route) return;
    router.push(target.route as never);
  };

  return (
    <GlassView style={styles.detailSurface} contentStyle={styles.detailCard}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
        <View style={styles.detailHeader}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[styles.detailType, { color: colors.textTertiary }]}>
              {report.targetType.toUpperCase()} REPORT · {String(report.status ?? 'pending').toUpperCase()}
            </Text>
            <Text style={[styles.detailTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
              {target?.subtitle || `Reported ${formatDate(report.createdAt)}`}
            </Text>
          </View>
          <View style={[styles.detailStatus, { backgroundColor: statusColor(report.status) + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(report.status) }]} />
            <Text style={[styles.statusText, { color: statusColor(report.status) }]}>
              {String(report.status ?? 'pending').toUpperCase()}
            </Text>
          </View>
        </View>

        {target?.imageUrl ? (
          <Image source={{ uri: target.imageUrl }} style={styles.targetImage} contentFit="cover" />
        ) : null}

        <View style={[styles.noticeBox, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.noticeLabel, { color: colors.textTertiary }]}>REPORT REASON</Text>
          <Text style={[styles.noticeText, { color: colors.text }]}>{report.reason || 'No reason supplied'}</Text>
          {report.details ? <Text style={[styles.detailBody, { color: colors.textSecondary }]}>{report.details}</Text> : null}
        </View>

        <View style={styles.grid}>
          <InfoTile label="Reporter" value={reporter?.displayName || reporter?.email || reportReporterId(report)} />
          <InfoTile label="Target owner" value={owner} />
          <InfoTile label="Target status" value={target?.status || (target?.exists === false ? 'Unavailable' : 'Unknown')} />
          <InfoTile label="Reviewed at" value={report.reviewedAt ? formatDate(report.reviewedAt) : 'Not reviewed'} />
        </View>

        <View style={[styles.targetPanel, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.targetPanelHeader}>
            <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>TARGET SNAPSHOT</Text>
            {target?.route ? (
              <M3Button variant="text" leftIcon="open-outline" onPress={openTarget} accessibilityLabel="Open reported target">
                Open
              </M3Button>
            ) : null}
          </View>
          {loading ? (
            <Text style={[styles.detailBody, { color: colors.textTertiary }]}>Loading target context...</Text>
          ) : target ? (
            <View style={{ gap: 10 }}>
              <FieldRow label="ID" value={target.id} />
              <FieldRow label="Type" value={target.type} />
              <FieldRow label="Exists" value={target.exists ? 'Yes' : 'No'} />
              {Object.entries(target.fields).map(([key, value]) => (
                value == null || value === '' ? null : <FieldRow key={key} label={key} value={String(value)} />
              ))}
            </View>
          ) : (
            <Text style={[styles.detailBody, { color: colors.textTertiary }]}>No target context is available for this report.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.detailActions, { borderTopColor: colors.borderLight }]}>
        <M3Button
          variant="tonal"
          leftIcon="archive-outline"
          disabled={actionPending || !isPending}
          style={styles.actionButton}
          onPress={() => onAction(report, 'dismissed')}
        >
          Dismiss
        </M3Button>
        <M3Button
          variant="filled"
          leftIcon="checkmark-circle-outline"
          disabled={actionPending || !isPending}
          style={styles.actionButton}
          onPress={() => onAction(report, 'keep_content')}
        >
          Keep
        </M3Button>
        <M3Button
          variant="error"
          leftIcon="trash-outline"
          disabled={actionPending || !isPending}
          style={styles.actionButton}
          onPress={() => onAction(report, 'remove_item')}
        >
          Remove
        </M3Button>
        <M3Button
          variant="outlined"
          leftIcon="ban-outline"
          disabled={actionPending || !isPending}
          style={styles.actionButton}
          labelStyle={{ color: colors.error }}
          onPress={() => onAction(report, 'ban_user')}
        >
          Suspend
        </M3Button>
      </View>
    </GlassView>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoTile, { backgroundColor: colors.primarySoft }]}>
      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]} selectable>{value}</Text>
    </View>
  );
}

function EmptyDetail() {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="shield-checkmark-outline" size={58} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Select a report</Text>
      <Text style={[styles.emptyCopy, { color: colors.textTertiary }]}>Target, reporter, and action history appear here.</Text>
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
    gap: 16,
    paddingVertical: Platform.OS === 'web' ? 8 : 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: 0 },
  countPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  countText: { fontSize: 11, fontFamily: FontFamily.bold },

  filters: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, flexWrap: 'wrap', paddingVertical: 8 },
  body: { flex: 1, flexDirection: 'row', gap: 18 },
  listCol: { flex: 1 },
  detailCol: { flex: 2, paddingVertical: 16 },
  listContent: { gap: 10, paddingVertical: 16, paddingBottom: 40 },

  reportCard: { padding: 14, gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  typeText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0 },
  timeText: { fontSize: 10, fontFamily: FontFamily.medium, marginLeft: 'auto' },
  targetName: { fontSize: 15, fontFamily: FontFamily.bold },
  reasonText: { fontSize: 13, fontFamily: FontFamily.medium, lineHeight: 18 },
  reportMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  metaText: { flex: 1, fontSize: 11, fontFamily: FontFamily.medium },
  statusText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0 },

  detailSurface: { flex: 1 },
  detailCard: { flex: 1 },
  detailScroll: { padding: 24, gap: 18 },
  detailHeader: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  detailType: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0 },
  detailTitle: { fontSize: 28, fontFamily: FontFamily.bold, letterSpacing: 0, lineHeight: 34 },
  detailSubtitle: { fontSize: 14, fontFamily: FontFamily.medium, lineHeight: 20 },
  detailStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  targetImage: { width: '100%', height: 220, borderRadius: 16 },

  noticeBox: { padding: 16, borderRadius: 16, gap: 8 },
  noticeLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0 },
  noticeText: { fontSize: 18, fontFamily: FontFamily.bold, lineHeight: 24 },
  detailBody: { fontSize: 14, fontFamily: FontFamily.medium, lineHeight: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoTile: { flex: 1, minWidth: 190, padding: 14, borderRadius: 14, gap: 6 },
  infoLabel: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0 },
  infoValue: { fontSize: 14, fontFamily: FontFamily.bold, lineHeight: 19 },

  targetPanel: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  targetPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  groupTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 18 },
  fieldLabel: { fontSize: 12, fontFamily: FontFamily.bold, minWidth: 92, textTransform: 'capitalize' },
  fieldValue: { flex: 1, textAlign: 'right', fontSize: 13, fontFamily: FontFamily.medium },

  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, borderTopWidth: 1 },
  actionButton: { flex: 1, minWidth: 130 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { marginTop: 14, fontSize: 16, fontFamily: FontFamily.bold },
  emptyCopy: { marginTop: 6, fontSize: 13, fontFamily: FontFamily.medium, textAlign: 'center' },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: FontFamily.bold },
  modalBody: { flex: 1, padding: 14 },
});
