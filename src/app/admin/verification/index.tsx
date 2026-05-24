/**
 * Admin Verification Queue
 * ========================
 * Lists pending verification tasks for admin review.
 * Supports filtering by status, entity type, and SLA urgency.
 *
 * Related: Requirement 8 (Legal and Compliance Fields)
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { HeaderTokens, CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { Radius } from '@/design-system/tokens/spacing';
import { GlassView } from '@/design-system/ui/GlassView';
import { Skeleton } from '@/design-system/ui';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import type { VerificationTask } from '@/shared/schema';

const SafeFadeInDown = FadeInDown ?? FadeIn;

type StatusFilter = 'all' | VerificationTask['status'];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Review', value: 'in-review' },
  { label: 'More Info', value: 'more-info-needed' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const ENTITY_TYPE_LABELS: Record<string, string> = {
  community: 'Community',
  organiser: 'Organiser',
  venue: 'Venue',
  business: 'Business',
  artist: 'Artist',
  professional: 'Professional',
};

function getStatusColor(status: VerificationTask['status']): string {
  switch (status) {
    case 'pending': return CultureTokens.gold;
    case 'in-review': return CultureTokens.indigo;
    case 'approved': return CultureTokens.teal;
    case 'rejected': return CultureTokens.coral;
    case 'more-info-needed': return CultureTokens.violet;
    default: return CultureTokens.indigo;
  }
}

function getStatusLabel(status: VerificationTask['status']): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in-review': return 'In Review';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'more-info-needed': return 'More Info Needed';
    default: return status;
  }
}

function isOverdueSla(task: VerificationTask): boolean {
  return new Date(task.slaDeadline) < new Date() &&
    task.status !== 'approved' &&
    task.status !== 'rejected';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function VerificationQueueScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: statsData } = useQuery({
    queryKey: adminKeys.verificationStats(),
    queryFn: () => api.admin.verificationStats(),
    refetchInterval: 30000,
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: adminKeys.verificationTasks({ status: statusFilter === 'all' ? undefined : statusFilter }),
    queryFn: () => api.admin.verificationTasks(
      statusFilter === 'all' ? undefined : { status: statusFilter }
    ),
    refetchInterval: 15000,
  });

  const tasks = useMemo<VerificationTask[]>(() => tasksData?.tasks ?? [], [tasksData]);

  const totalPending = (statsData?.pending ?? 0) + (statsData?.inReview ?? 0) + (statsData?.moreInfoNeeded ?? 0);
  const overdueCount = statsData?.overdueSla ?? 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Verification Queue</Text>
          {totalPending > 0 && (
            <GlassView
              intensity={10}
              style={[styles.countPill, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '35' }]}
            >
              <Text style={{ color: CultureTokens.indigo, fontSize: 12, fontFamily: FontFamily.bold }}>
                {totalPending} ACTIVE
              </Text>
            </GlassView>
          )}
          {overdueCount > 0 && (
            <GlassView
              intensity={10}
              style={[styles.countPill, { backgroundColor: CultureTokens.coral + '15', borderColor: CultureTokens.coral + '35' }]}
            >
              <Ionicons name="warning" size={12} color={CultureTokens.coral} />
              <Text style={{ color: CultureTokens.coral, fontSize: 12, fontFamily: FontFamily.bold }}>
                {overdueCount} OVERDUE
              </Text>
            </GlassView>
          )}
        </View>
      </View>

      {/* Stats Summary */}
      {statsData && (
        <View style={[styles.statsRow, { paddingHorizontal: hPad }]}>
          <StatCard label="Pending" value={statsData.pending} color={CultureTokens.gold} />
          <StatCard label="In Review" value={statsData.inReview} color={CultureTokens.indigo} />
          <StatCard label="Approved" value={statsData.approved} color={CultureTokens.teal} />
          <StatCard label="Rejected" value={statsData.rejected} color={CultureTokens.coral} />
        </View>
      )}

      {/* Filter Chips */}
      <View style={[styles.filterRow, { paddingHorizontal: hPad }]}>
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => setStatusFilter(filter.value)}
              accessibilityLabel={`Filter by ${filter.label}`}
              accessibilityRole="button"
              style={[
                styles.filterChip,
                active && { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo },
                !active && { borderColor: colors.borderLight },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: hPad }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <Skeleton width="100%" height={80} style={{ borderRadius: Radius.lg, marginBottom: 12 }} />
                <Skeleton width="100%" height={80} style={{ borderRadius: Radius.lg, marginBottom: 12 }} />
                <Skeleton width="100%" height={80} style={{ borderRadius: Radius.lg }} />
              </>
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  No verification tasks found
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={SafeFadeInDown ? SafeFadeInDown.delay(index * 50) : undefined}>
            <VerificationTaskCard
              task={item}
              onPress={() => router.push(`/admin/verification/${item.id}` as any)}
            />
          </Animated.View>
        )}
        style={isDesktop ? { maxWidth: 800, alignSelf: 'center', width: '100%' } : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <GlassView intensity={8} style={styles.statCard} contentStyle={styles.statCardContent}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </GlassView>
  );
}

function VerificationTaskCard({ task, onPress }: { task: VerificationTask; onPress: () => void }) {
  const colors = useColors();
  const overdue = isOverdueSla(task);
  const statusColor = getStatusColor(task.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Review verification for ${ENTITY_TYPE_LABELS[task.entityType] ?? task.entityType} profile`}
      accessibilityRole="button"
    >
      <GlassView
        style={[styles.taskCard, overdue && { borderColor: CultureTokens.coral, borderWidth: 1 }]}
        contentStyle={styles.taskCardContent}
      >
        <View style={styles.taskCardHeader}>
          <View style={styles.taskCardLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.entityTypeLabel, { color: colors.textTertiary }]}>
              {(ENTITY_TYPE_LABELS[task.entityType] ?? task.entityType).toUpperCase()}
            </Text>
            {overdue && (
              <View style={styles.overdueBadge}>
                <Ionicons name="time" size={10} color={CultureTokens.coral} />
                <Text style={styles.overdueText}>SLA OVERDUE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatRelativeTime(task.submittedAt)}
          </Text>
        </View>

        <View style={styles.taskCardBody}>
          <Text style={[styles.profileId, { color: colors.text }]} numberOfLines={1}>
            Profile: {task.profileId}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getStatusLabel(task.status)}
              </Text>
            </View>
            <Text style={[styles.docCount, { color: colors.textSecondary }]}>
              <Ionicons name="document-text" size={12} color={colors.textSecondary} />{' '}
              {task.documents.length} doc{task.documents.length !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.checklistProgress, { color: colors.textSecondary }]}>
              <Ionicons name="checkbox" size={12} color={colors.textSecondary} />{' '}
              {task.checklist.filter((c) => c.checked).length}/{task.checklist.length}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </GlassView>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    flexWrap: 'wrap',
  },
  statCard: { flex: 1, minWidth: 80, borderRadius: Radius.md },
  statCardContent: { padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontFamily: FontFamily.bold },
  statLabel: { fontSize: 11, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5 },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontFamily: FontFamily.medium },

  listContent: { gap: 10, paddingVertical: 8, paddingBottom: 40 },

  taskCard: { borderRadius: Radius.lg },
  taskCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 0,
  },
  taskCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskCardBody: { flex: 1, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  entityTypeLabel: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  timeText: { fontSize: 10, fontFamily: FontFamily.medium },
  profileId: { fontSize: 14, fontFamily: FontFamily.bold },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontFamily: FontFamily.bold },
  docCount: { fontSize: 11, fontFamily: FontFamily.medium },
  checklistProgress: { fontSize: 11, fontFamily: FontFamily.medium },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: CultureTokens.coral + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: { fontSize: 9, fontFamily: FontFamily.bold, color: CultureTokens.coral },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: FontFamily.medium },
});
