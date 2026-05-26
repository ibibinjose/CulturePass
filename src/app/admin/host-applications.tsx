/**
 * /admin/host-applications
 *
 * Super Admin / Admin surface for reviewing Host applications.
 * Approvals upgrade the applicant to the 'organizer' role and unlock HostSpace.
 *
 * Standards: Accessible, optimistic updates, clear review notes, audit-friendly.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Alert as RNAlert, // fallback only
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useM3Colors as useColors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import {
  CultureTokens,
  FontFamily,
  Radius,
} from '@/design-system/tokens/theme';
import { M3TopAppBar, M3Button, GlassView } from '@/design-system/ui';
import { formatCompactDate } from '@/lib/format';
import type { HostApplication, HostApplicationStatus } from '@/shared/schema';

type ReviewAction = 'approve' | 'reject';

export default function HostApplicationsAdmin() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const { isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | HostApplicationStatus>('pending');
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState<HostApplication | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [action, setAction] = useState<ReviewAction>('approve');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'host-applications', filter],
    queryFn: () => api.hostApplications.list(filter === 'all' ? undefined : filter, 100),
    staleTime: 20_000,
  });

  const applicationsRaw: HostApplication[] = (data as any)?.applications ?? [];

  const applications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applicationsRaw;
    return applicationsRaw.filter((a) => {
      const hay = [
        a.fullName,
        a.businessName ?? '',
        a.description,
        a.city ?? '',
        a.hostType,
        a.motivation ?? '',
        a.reviewNote ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [applicationsRaw, search]);

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action: act, note }: { id: string; action: ReviewAction; note?: string }) => {
      if (act === 'approve') {
        return api.hostApplications.approve(id, note);
      } else {
        return api.hostApplications.reject(id, note);
      }
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'host-applications'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.complianceSummary() });
      setReviewing(null);
      setReviewNote('');
      setBanner({
        type: 'success',
        message: `Application ${vars.action === 'approve' ? 'approved' : 'rejected'}. ${vars.action === 'approve' ? 'User role upgraded to organizer.' : ''}`,
      });
      // auto-clear banner
      setTimeout(() => setBanner(null), 4500);
    },
    onError: (error: any) => {
      setBanner({ type: 'error', message: error?.message || 'Review action failed. Check connection and try again.' });
      setTimeout(() => setBanner(null), 6000);
    },
  });

  const openReview = useCallback((app: HostApplication, act: ReviewAction) => {
    setBanner(null);
    setReviewing(app);
    setAction(act);
    setReviewNote('');
  }, []);

  const submitReview = () => {
    if (!reviewing) return;
    reviewMutation.mutate({
      id: reviewing.id,
      action,
      note: reviewNote.trim() || undefined,
    });
  };

  const closeReview = () => {
    setReviewing(null);
    setReviewNote('');
  };

  const statusColor = (status: HostApplicationStatus) => {
    if (status === 'approved') return '#10B981';
    if (status === 'rejected') return CultureTokens.coral;
    return CultureTokens.gold;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <M3TopAppBar
        title="Host Applications"
        onBack={() => router.back()}
        titleLeading={<Text style={{ fontSize: 12, color: colors.textSecondary }}>Review & approve organizers</Text>}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: insets.bottom + 40, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar: search + actions */}
        <View style={styles.topBar}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search name, business, city, notes..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => refetch()}
            disabled={isRefetching}
            style={[styles.refreshBtn, { borderColor: colors.borderLight, opacity: isRefetching ? 0.5 : 1 }]}
          >
            <Ionicons name="refresh" size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Filters + result meta */}
        <View style={styles.filterRow}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => { setFilter(f as any); setSearch(''); }}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
          <Text style={[styles.metaCount, { color: colors.textTertiary }]}>
            {applications.length} shown {isRefetching ? '· refreshing…' : ''}
          </Text>
        </View>

        {/* Feedback banner */}
        {banner && (
          <GlassView intensity={30} style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
            <Ionicons name={banner.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={banner.type === 'error' ? CultureTokens.coral : '#10B981'} />
            <Text style={[styles.bannerText, { color: colors.text }]}>{banner.message}</Text>
            <Pressable onPress={() => setBanner(null)} style={{ marginLeft: 'auto' }}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          </GlassView>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
          </View>
        ) : applications.length === 0 ? (
          <GlassView intensity={20} style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No applications</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {search ? 'No matches for your search.' : filter === 'pending' ? 'All caught up. New host applications will appear here.' : 'No records in this filter.'}
            </Text>
          </GlassView>
        ) : (
          applications.map((app, index) => (
            <Animated.View key={app.id} entering={FadeInDown.delay(index * 40).springify()}>
              <GlassView intensity={30} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.name, { color: colors.text }]}>{app.fullName}</Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>
                      {app.hostType} · {app.city || '—'} · {formatCompactDate(app.createdAt)}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor(app.status) + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor(app.status) }]}>{app.status}</Text>
                  </View>
                </View>

                {app.businessName && (
                  <Text style={[styles.business, { color: colors.text }]}>{app.businessName}</Text>
                )}

                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                  {app.description}
                </Text>

                {(app.websiteUrl || app.instagramHandle || app.motivation) && (
                  <View style={styles.metaRow}>
                    {app.websiteUrl && (
                      <Pressable onPress={() => Linking.openURL(app.websiteUrl!).catch(() => {})} style={styles.linkPill}>
                        <Ionicons name="globe-outline" size={12} color={CultureTokens.indigo} />
                        <Text style={[styles.link, { color: CultureTokens.indigo }]} numberOfLines={1}>Website</Text>
                      </Pressable>
                    )}
                    {app.instagramHandle && (
                      <Pressable onPress={() => Linking.openURL(`https://instagram.com/${app.instagramHandle!.replace('@','')}`).catch(() => {})} style={styles.linkPill}>
                        <Ionicons name="logo-instagram" size={12} color={CultureTokens.indigo} />
                        <Text style={[styles.link, { color: CultureTokens.indigo }]}>@{app.instagramHandle.replace('@','')}</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {app.motivation && (
                  <Text style={[styles.motivation, { color: colors.textSecondary }]} numberOfLines={2}>
                    “{app.motivation}”
                  </Text>
                )}

                {app.status === 'pending' && (
                  <View style={styles.actions}>
                    <M3Button
                      variant="filled"
                      onPress={() => openReview(app, 'approve')}
                      style={{ flex: 1 }}
                      disabled={reviewMutation.isPending}
                    >
                      Approve
                    </M3Button>
                    <M3Button
                      variant="outlined"
                      onPress={() => openReview(app, 'reject')}
                      style={{ flex: 1 }}
                      disabled={reviewMutation.isPending}
                    >
                      Reject
                    </M3Button>
                  </View>
                )}

                {(app.reviewNote || app.reviewedBy) && (
                  <View style={styles.noteBox}>
                    <Text style={[styles.noteLabel, { color: colors.textTertiary }]}>
                      Reviewed {app.reviewedAt ? `· ${formatCompactDate(app.reviewedAt)}` : ''} {app.reviewedBy ? `by ${app.reviewedBy.slice(0,8)}` : ''}
                    </Text>
                    {app.reviewNote && <Text style={[styles.noteText, { color: colors.text }]}>{app.reviewNote}</Text>}
                  </View>
                )}

                <View style={styles.footerRow}>
                  <Text style={[styles.userId, { color: colors.textTertiary }]}>User: {app.userId.slice(0, 12)}…</Text>
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(app.userId);
                      setBanner({ type: 'success', message: 'User ID copied to clipboard. Search it in User Directory.' });
                      setTimeout(() => setBanner(null), 3000);
                    }}
                  >
                    <Text style={[styles.viewProfile, { color: CultureTokens.indigo }]}>Copy User ID</Text>
                  </Pressable>
                </View>
              </GlassView>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Review Modal (accessible RN Modal) */}
      <Modal
        visible={!!reviewing}
        transparent
        animationType="fade"
        onRequestClose={closeReview}
      >
        <View style={styles.modalOverlay}>
          <GlassView intensity={70} style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {action === 'approve' ? 'Approve Host Application' : 'Reject Application'}
              </Text>
              <Pressable onPress={closeReview} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {reviewing && (
              <>
                <View style={styles.applicantSummary}>
                  <Text style={[styles.modalName, { color: colors.text }]}>{reviewing.fullName}</Text>
                  <Text style={[styles.modalMeta, { color: colors.textSecondary }]}>
                    {reviewing.hostType} · {reviewing.city || '—'} · {reviewing.businessName || 'Individual'}
                  </Text>
                </View>

                <View style={styles.detailBox}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Description</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>{reviewing.description}</Text>
                </View>

                {reviewing.motivation && (
                  <View style={styles.detailBox}>
                    <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Motivation</Text>
                    <Text style={[styles.detailText, { color: colors.text }]}>{reviewing.motivation}</Text>
                  </View>
                )}

                {(reviewing.websiteUrl || reviewing.instagramHandle) && (
                  <View style={styles.linksRow}>
                    {reviewing.websiteUrl && (
                      <M3Button variant="outlined" onPress={() => Linking.openURL(reviewing.websiteUrl!).catch(() => {})} style={{ flex: 1 }}>
                        Open website
                      </M3Button>
                    )}
                    {reviewing.instagramHandle && (
                      <M3Button variant="outlined" onPress={() => Linking.openURL(`https://instagram.com/${reviewing.instagramHandle!.replace('@','')}`).catch(() => {})} style={{ flex: 1 }}>
                        View Instagram
                      </M3Button>
                    )}
                  </View>
                )}
              </>
            )}

            <Text style={[styles.noteLabel, { color: colors.textTertiary, marginTop: 8 }]}>Review note (visible to applicant)</Text>
            <TextInput
              style={[styles.noteInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Strong community focus, approved for events in Melbourne."
              placeholderTextColor={colors.textTertiary}
              value={reviewNote}
              onChangeText={setReviewNote}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <M3Button variant="outlined" onPress={closeReview} disabled={reviewMutation.isPending}>
                Cancel
              </M3Button>
              <M3Button
                variant={action === 'approve' ? 'filled' : 'outlined'}
                onPress={submitReview}
                loading={reviewMutation.isPending}
              >
                {action === 'approve' ? 'Approve & Grant Organizer Role' : 'Reject & Notify'}
              </M3Button>
            </View>

            <Text style={[styles.superNote, { color: colors.textTertiary }]}>
              {action === 'approve'
                ? 'Approving updates Firebase custom claims + users role immediately. Applicant can now create HostSpaces.'
                : 'Rejection records the note. User may re-apply later.'}
            </Text>
          </GlassView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    paddingVertical: 2,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  filterChipActive: {
    backgroundColor: CultureTokens.indigo,
  },
  filterText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(15,23,42,0.7)',
  },
  filterTextActive: {
    color: '#fff',
  },
  metaCount: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    marginLeft: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 12,
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  empty: {
    padding: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderRadius: Radius.lg,
    marginBottom: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  business: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  link: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  motivation: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  noteBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(15,23,42,0.04)',
    borderRadius: Radius.sm,
  },
  noteLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    marginBottom: 3,
  },
  noteText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userId: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    opacity: 0.6,
  },
  viewProfile: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    padding: 20,
    borderRadius: Radius.xl,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
  },
  applicantSummary: {
    marginTop: 4,
    marginBottom: 4,
  },
  modalName: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
  },
  modalMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  detailBox: {
    backgroundColor: 'rgba(15,23,42,0.03)',
    borderRadius: Radius.sm,
    padding: 10,
    gap: 4,
  },
  detailLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  superNote: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
