/**
 * Admin panel — Host Page context for verification review
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { Radius } from '@/design-system/tokens/spacing';
import { GlassView, M3Button, Skeleton } from '@/design-system/ui';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import { PageHomePreview } from '@/modules/host/components/PageHomePreview';
import type { HostPage } from '@/shared/schema';

export interface HostPageVerificationPanelProps {
  pageId: string;
  taskId: string;
  isActionable: boolean;
}

function membershipLabel(model: HostPage['formData']['membershipModel']): string {
  if (model === 'paid') return 'Paid membership';
  if (model === 'invite-only') return 'Invite only';
  return 'Free';
}

export function HostPageVerificationPanel({ pageId, taskId, isActionable }: HostPageVerificationPanelProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const { data: page, isLoading } = useQuery({
    queryKey: adminKeys.hostPage(pageId),
    queryFn: () => api.admin.getHostPage(pageId),
    enabled: Boolean(pageId),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.admin.blockHostPage(pageId, blockReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.hostPage(pageId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.verificationTask(taskId) });
      setBanner('Page blocked successfully.');
      setShowBlockForm(false);
      setBlockReason('');
    },
    onError: (e: Error) => setBanner(e.message ?? 'Failed to block page'),
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.admin.unblockHostPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.hostPage(pageId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.verificationTask(taskId) });
      setBanner('Page unblocked.');
    },
    onError: (e: Error) => setBanner(e.message ?? 'Failed to unblock page'),
  });

  if (isLoading || !page) {
    return (
      <GlassView intensity={8} style={styles.card}>
        <Skeleton width="40%" height={18} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={200} style={{ borderRadius: Radius.lg }} />
      </GlassView>
    );
  }

  const isBlocked = page.status === 'blocked' || page.status === 'suspended';

  return (
    <GlassView intensity={8} style={styles.card} contentStyle={styles.cardContent} testID="host-page-verification-panel">
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="document-text-outline" size={14} color={CultureTokens.indigo} />
          <Text style={styles.badgeText}>HOST PAGE</Text>
        </View>
        <Text style={[styles.statusPill, { color: isBlocked ? CultureTokens.coral : CultureTokens.teal }]}>
          {page.status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{page.formData.name || 'Untitled Page'}</Text>
      <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={3}>
        {page.formData.bio}
      </Text>

      <View style={styles.metaRow}>
        <MetaChip label="Membership" value={membershipLabel(page.formData.membershipModel)} colors={colors} />
        <MetaChip
          label="Categories"
          value={(page.formData.categoryTags ?? []).join(', ') || '—'}
          colors={colors}
        />
      </View>

      <PageHomePreview formData={page.formData} entityType={page.entityType} />

      {banner ? (
        <Text style={[styles.banner, { color: CultureTokens.teal }]} accessibilityLiveRegion="polite">
          {banner}
        </Text>
      ) : null}

      {isActionable && (
        <View style={styles.actions}>
          {isBlocked ? (
            <M3Button
              variant="filled"
              onPress={() => unblockMutation.mutate()}
              loading={unblockMutation.isPending}
              accessibilityLabel="Unblock host page"
            >
              Unblock Page
            </M3Button>
          ) : showBlockForm ? (
            <View style={styles.blockForm}>
              <TextInput
                style={[styles.blockInput, { color: colors.text, borderColor: colors.borderLight }]}
                value={blockReason}
                onChangeText={setBlockReason}
                placeholder="Reason for blocking this page…"
                placeholderTextColor={colors.textTertiary}
                multiline
                accessibilityLabel="Block reason"
              />
              <View style={styles.blockActions}>
                <M3Button variant="tonal" onPress={() => setShowBlockForm(false)}>
                  Cancel
                </M3Button>
                <M3Button
                  variant="error"
                  onPress={() => blockMutation.mutate()}
                  disabled={!blockReason.trim()}
                  loading={blockMutation.isPending}
                >
                  Confirm Block
                </M3Button>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowBlockForm(true)}
              style={styles.blockLink}
              accessibilityRole="button"
              accessibilityLabel="Block host page"
            >
              <Ionicons name="ban-outline" size={16} color={CultureTokens.coral} />
              <Text style={styles.blockLinkText}>Block page (moderation)</Text>
            </Pressable>
          )}
        </View>
      )}
    </GlassView>
  );
}

function MetaChip({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.metaChip}>
      <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg },
  cardContent: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CultureTokens.indigo + '14',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
    color: CultureTokens.indigo,
  },
  statusPill: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.6 },
  title: { fontSize: 18, fontFamily: FontFamily.bold },
  bio: { fontSize: 13, fontFamily: FontFamily.medium, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaChip: { minWidth: '45%' },
  metaLabel: { fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 2 },
  banner: { fontSize: 13, fontFamily: FontFamily.medium },
  actions: { marginTop: 4 },
  blockLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  blockLinkText: { fontSize: 13, fontFamily: FontFamily.semibold, color: CultureTokens.coral },
  blockForm: { gap: 10 },
  blockInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    minHeight: 72,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  blockActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
});