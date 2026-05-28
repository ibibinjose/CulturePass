/**
 * Admin Verification Task Detail
 * ===============================
 * Review individual verification submissions with checklist,
 * document viewer, and admin action buttons.
 *
 * Related: Requirement 8 (Legal and Compliance Fields)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { HeaderTokens, CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { Radius } from '@/design-system/tokens/spacing';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button, Skeleton } from '@/design-system/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import { createLazyComponent } from '@/lib/lazy';
import type { VerificationTask, VerificationChecklistItem } from '@/shared/schema';

const VerificationChecklist = createLazyComponent(
  () => import('@/modules/admin/components/VerificationChecklist')
);

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

export default function VerificationTaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const queryClient = useQueryClient();

  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showRequestInfoForm, setShowRequestInfoForm] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: adminKeys.verificationTask(taskId ?? ''),
    queryFn: () => api.admin.verificationTask(taskId!),
    enabled: Boolean(taskId),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.verificationTask(taskId ?? '') });
    queryClient.invalidateQueries({ queryKey: adminKeys.verificationTasks({}) });
    queryClient.invalidateQueries({ queryKey: adminKeys.verificationStats() });
  };

  const approveMutation = useMutation({
    mutationFn: () => api.admin.approveVerification(taskId!, adminNotes || undefined),
    onSuccess: () => {
      invalidateAll();
      setBanner({ type: 'success', message: 'Verification approved. Profile is now live.' });
      setTimeout(() => router.back(), 1200);
    },
    onError: (e: Error) => setBanner({ type: 'error', message: e.message ?? 'Failed to approve' }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.admin.rejectVerification(taskId!, rejectionReason, adminNotes || undefined),
    onSuccess: () => {
      invalidateAll();
      setBanner({ type: 'success', message: 'Verification rejected.' });
      setTimeout(() => router.back(), 1200);
    },
    onError: (e: Error) => setBanner({ type: 'error', message: e.message ?? 'Failed to reject' }),
  });

  const requestInfoMutation = useMutation({
    mutationFn: () => api.admin.requestMoreInfo(taskId!, requestMessage),
    onSuccess: () => {
      invalidateAll();
      setShowRequestInfoForm(false);
      setRequestMessage('');
      setBanner({ type: 'success', message: 'More information requested from the host.' });
    },
    onError: (e: Error) => setBanner({ type: 'error', message: e.message ?? 'Failed to request info' }),
  });

  const _assignMutation = useMutation({
    mutationFn: (adminId: string) => api.admin.assignVerification(taskId!, adminId),
    onSuccess: () => invalidateAll(),
    onError: (e: Error) => setBanner({ type: 'error', message: e.message ?? 'Failed to assign' }),
  });

  const checklistMutation = useMutation({
    mutationFn: (checklist: VerificationChecklistItem[]) =>
      api.admin.updateVerificationChecklist(taskId!, checklist),
    onSuccess: () => invalidateAll(),
  });

  const handleChecklistChange = (updatedChecklist: VerificationChecklistItem[]) => {
    checklistMutation.mutate(updatedChecklist);
  };

  if (isLoading || !task) {
    return (
      <View style={[styles.container, { paddingHorizontal: hPad }]}>
        <View style={styles.loadingHeader}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <Skeleton width="60%" height={28} style={{ borderRadius: Radius.sm, marginBottom: 16 }} />
        <Skeleton width="100%" height={120} style={{ borderRadius: Radius.lg, marginBottom: 16 }} />
        <Skeleton width="100%" height={200} style={{ borderRadius: Radius.lg }} />
      </View>
    );
  }

  const isOverdue = new Date(task.slaDeadline) < new Date() &&
    task.status !== 'approved' && task.status !== 'rejected';
  const isActionable = task.status === 'pending' || task.status === 'in-review' || task.status === 'more-info-needed';
  const statusColor = getStatusColor(task.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: hPad },
        isDesktop && { maxWidth: 860, alignSelf: 'center', width: '100%' },
      ]}
    >
      {/* Back + Title */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back to queue" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>Verification Review</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Banner */}
      <GlassView intensity={10} style={styles.statusBanner} contentStyle={styles.statusBannerContent}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(task.status)}
          </Text>
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <Ionicons name="warning" size={12} color={CultureTokens.coral} />
              <Text style={styles.overdueText}>SLA OVERDUE</Text>
            </View>
          )}
        </View>
        <Text style={[styles.entityLabel, { color: colors.textSecondary }]}>
          {ENTITY_TYPE_LABELS[task.entityType] ?? task.entityType} Profile
        </Text>
      </GlassView>

      {/* Action feedback banner (consistent with other admin tools) */}
      {banner && (
        <GlassView intensity={20} style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
          <Ionicons name={banner.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={16} color={banner.type === 'error' ? CultureTokens.coral : '#10B981'} />
          <Text style={[styles.bannerText, { color: colors.text }]}>{banner.message}</Text>
          <Pressable onPress={() => setBanner(null)} style={{ marginLeft: 'auto' }}>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        </GlassView>
      )}

      {/* Task Info */}
      <GlassView intensity={8} style={styles.infoCard} contentStyle={styles.infoCardContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Details</Text>
        <InfoRow label="Task ID" value={task.id} colors={colors} />
        <InfoRow label="Profile ID" value={task.profileId} colors={colors} />
        <InfoRow label="Entity Type" value={ENTITY_TYPE_LABELS[task.entityType] ?? task.entityType} colors={colors} />
        <InfoRow label="Submitted By" value={task.submittedBy} colors={colors} />
        <InfoRow label="Submitted At" value={new Date(task.submittedAt).toLocaleString()} colors={colors} />
        <InfoRow
          label="SLA Deadline"
          value={new Date(task.slaDeadline).toLocaleString()}
          colors={colors}
          highlight={isOverdue}
        />
        {task.assignedTo && <InfoRow label="Assigned To" value={task.assignedTo} colors={colors} />}
        {task.completedAt && <InfoRow label="Completed At" value={new Date(task.completedAt).toLocaleString()} colors={colors} />}
        {task.rejectionReason && <InfoRow label="Rejection Reason" value={task.rejectionReason} colors={colors} highlight />}
      </GlassView>

      {/* Documents */}
      <GlassView intensity={8} style={styles.infoCard} contentStyle={styles.infoCardContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Documents ({task.documents.length})
        </Text>
        {task.documents.length === 0 ? (
          <Text style={[styles.emptyDocText, { color: colors.textTertiary }]}>
            No documents uploaded
          </Text>
        ) : (
          task.documents.map((docUrl, idx) => (
            <Pressable
              key={idx}
              style={[styles.docRow, { borderBottomColor: colors.borderLight }]}
              accessibilityLabel={`View document ${idx + 1}`}
              accessibilityRole="link"
            >
              <Ionicons name="document-text" size={18} color={CultureTokens.indigo} />
              <Text style={[styles.docText, { color: colors.text }]} numberOfLines={1}>
                Document {idx + 1}
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
            </Pressable>
          ))
        )}
      </GlassView>

      {/* Verification Checklist */}
      <VerificationChecklist
        checklist={task.checklist}
        onChange={isActionable ? handleChecklistChange : undefined}
        disabled={!isActionable}
      />

      {/* Admin Notes */}
      {isActionable && (
        <GlassView intensity={8} style={styles.infoCard} contentStyle={styles.infoCardContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin Notes</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.borderLight }]}
            value={adminNotes}
            onChangeText={setAdminNotes}
            placeholder="Add notes about this verification..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            accessibilityLabel="Admin notes input"
          />
        </GlassView>
      )}

      {/* Existing Admin Notes (read-only) */}
      {task.adminNotes ? (
        <GlassView intensity={8} style={styles.infoCard} contentStyle={styles.infoCardContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Notes</Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>{task.adminNotes}</Text>
        </GlassView>
      ) : null}

      {/* Rejection Form */}
      {showRejectForm && (
        <GlassView intensity={8} style={styles.infoCard} contentStyle={styles.infoCardContent}>
          <Text style={[styles.sectionTitle, { color: CultureTokens.coral }]}>Rejection Reason</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: CultureTokens.coral + '50' }]}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Explain why this verification is being rejected..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            accessibilityLabel="Rejection reason input"
          />
          <View style={styles.formActions}>
            <M3Button variant="tonal" onPress={() => setShowRejectForm(false)}>
              Cancel
            </M3Button>
            <M3Button
              variant="error"
              onPress={() => rejectMutation.mutate()}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </M3Button>
          </View>
        </GlassView>
      )}

      {/* Request More Info Form */}
      {showRequestInfoForm && (
        <GlassView intensity={8} style={styles.infoCard} contentStyle={styles.infoCardContent}>
          <Text style={[styles.sectionTitle, { color: CultureTokens.violet }]}>Request More Information</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: CultureTokens.violet + '50' }]}
            value={requestMessage}
            onChangeText={setRequestMessage}
            placeholder="What additional information is needed?"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            accessibilityLabel="Request more information message"
          />
          <View style={styles.formActions}>
            <M3Button variant="tonal" onPress={() => setShowRequestInfoForm(false)}>
              Cancel
            </M3Button>
            <M3Button
              variant="filled"
              onPress={() => requestInfoMutation.mutate()}
              disabled={!requestMessage.trim()}
            >
              Send Request
            </M3Button>
          </View>
        </GlassView>
      )}

      {/* Action Buttons */}
      {isActionable && !showRejectForm && !showRequestInfoForm && (
        <View style={styles.actionRow}>
          <M3Button
            variant="filled"
            style={styles.actionBtn}
            onPress={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" /> Approve
          </M3Button>
          <M3Button
            variant="error"
            style={styles.actionBtn}
            onPress={() => setShowRejectForm(true)}
          >
            <Ionicons name="close-circle" size={16} color="#FFFFFF" /> Reject
          </M3Button>
          <M3Button
            variant="tonal"
            style={styles.actionBtn}
            onPress={() => setShowRequestInfoForm(true)}
          >
            Request Info
          </M3Button>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          { color: highlight ? CultureTokens.coral : colors.text },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingVertical: 16, gap: 16 },
  loadingHeader: { height: HeaderTokens.height, justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.3 },

  statusBanner: { borderRadius: Radius.lg },
  statusBannerContent: { padding: 16, gap: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 16, fontFamily: FontFamily.bold },
  entityLabel: { fontSize: 13, fontFamily: FontFamily.medium },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CultureTokens.coral + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overdueText: { fontSize: 10, fontFamily: FontFamily.bold, color: CultureTokens.coral },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  bannerError: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  bannerText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    flex: 1,
  },

  infoCard: { borderRadius: Radius.lg },
  infoCardContent: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.bold, marginBottom: 4 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.3 },
  infoValue: { fontSize: 13, fontFamily: FontFamily.medium, maxWidth: '60%', textAlign: 'right' },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  docText: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium },
  emptyDocText: { fontSize: 13, fontFamily: FontFamily.medium, fontStyle: 'italic' },

  textArea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesText: { fontSize: 13, fontFamily: FontFamily.medium, lineHeight: 20 },

  formActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 8 },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionBtn: { flex: 1, minWidth: 120 },
});
