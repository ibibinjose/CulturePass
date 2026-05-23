/**
 * Admin — Community home banner (Discover)
 * Create, publish, and rebroadcast the compact community-home promo banner.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, M3Typography, Radius } from '@/design-system/tokens/theme';
import { M3Button } from '@/design-system/ui';
import type { CommunityHomeBanner } from '@/shared/schema/communityHomeBanner';
import { withAlpha } from '@/lib/withAlpha';

function notify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function BannerForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: CommunityHomeBanner;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const m3 = useM3Colors();
  const [title, setTitle] = useState(initial?.title ?? 'Your community needs a home');
  const [subtitle, setSubtitle] = useState(
    initial?.subtitle ?? 'A gathering place for culture and connection—not just another feed.',
  );
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? 'Explore');
  const [ctaRoute, setCtaRoute] = useState(initial?.ctaRoute ?? '/(tabs)/community');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        ctaLabel: ctaLabel.trim() || 'Explore',
        ctaRoute: ctaRoute.trim() || '/(tabs)/community',
        imageUrl: imageUrl.trim() || undefined,
      };
      if (initial?.id) {
        return api.admin.updateCommunityHomeBanner(initial.id, payload);
      }
      return api.admin.createCommunityHomeBanner(payload);
    },
    onSuccess: onSaved,
    onError: (err: unknown) => {
      notify('Save failed', err instanceof Error ? err.message : 'Could not save banner');
    },
  });

  const valid = title.trim().length >= 2;

  return (
    <View style={[form.wrap, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
      <Text style={[form.heading, { color: m3.onSurface }]}>
        {initial ? 'Edit banner' : 'New banner'}
      </Text>
      {(['title', 'subtitle', 'ctaLabel', 'ctaRoute', 'imageUrl'] as const).map((field) => {
        const labels: Record<typeof field, string> = {
          title: 'Title',
          subtitle: 'Subtitle',
          ctaLabel: 'CTA label',
          ctaRoute: 'CTA route (Expo path)',
          imageUrl: 'Image URL (optional)',
        };
        const values = { title, subtitle, ctaLabel, ctaRoute, imageUrl };
        const setters = { title: setTitle, subtitle: setSubtitle, ctaLabel: setCtaLabel, ctaRoute: setCtaRoute, imageUrl: setImageUrl };
        return (
          <View key={field} style={form.field}>
            <Text style={[form.label, { color: m3.onSurfaceVariant }]}>{labels[field]}</Text>
            <TextInput
              value={values[field]}
              onChangeText={setters[field]}
              placeholder={labels[field]}
              placeholderTextColor={m3.onSurfaceVariant}
              multiline={field === 'subtitle'}
              style={[
                form.input,
                field === 'subtitle' && form.inputMultiline,
                { backgroundColor: m3.surfaceContainerHigh, color: m3.onSurface, borderColor: m3.outlineVariant },
              ]}
            />
          </View>
        );
      })}
      <View style={form.actions}>
        <M3Button variant="text" onPress={onCancel}>
          Cancel
        </M3Button>
        <M3Button variant="filled" onPress={() => saveMutation.mutate()} disabled={!valid || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save draft'}
        </M3Button>
      </View>
    </View>
  );
}

function BannerRow({
  banner,
  onEdit,
}: {
  banner: CommunityHomeBanner;
  onEdit: () => void;
}) {
  const m3 = useM3Colors();
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: () => api.admin.publishCommunityHomeBanner(banner.id),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.communityHomeBanners() });
      notify('Published', `Banner is live (revision ${res.banner.revision}).`);
    },
    onError: (err: unknown) => notify('Publish failed', err instanceof Error ? err.message : 'Error'),
  });

  const triggerMutation = useMutation({
    mutationFn: () => api.admin.triggerCommunityHomeBanner(banner.id),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.communityHomeBanners() });
      notify('Rebroadcast', `Users who dismissed will see it again (revision ${res.banner.revision}).`);
    },
    onError: (err: unknown) => notify('Trigger failed', err instanceof Error ? err.message : 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.deleteCommunityHomeBanner(banner.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.communityHomeBanners() });
    },
    onError: (err: unknown) => notify('Delete failed', err instanceof Error ? err.message : 'Error'),
  });

  const busy = publishMutation.isPending || triggerMutation.isPending || deleteMutation.isPending;

  return (
    <View style={[row.card, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
      <View style={row.header}>
        <Text style={[row.title, { color: m3.onSurface }]} numberOfLines={2}>
          {banner.title}
        </Text>
        {banner.isActive ? (
          <View style={[row.badge, { backgroundColor: withAlpha(CultureTokens.teal, 0.15) }]}>
            <Text style={[row.badgeText, { color: CultureTokens.teal }]}>LIVE · r{banner.revision}</Text>
          </View>
        ) : (
          <View style={[row.badge, { backgroundColor: m3.surfaceContainerHighest }]}>
            <Text style={[row.badgeText, { color: m3.onSurfaceVariant }]}>Draft · r{banner.revision}</Text>
          </View>
        )}
      </View>
      {banner.subtitle ? (
        <Text style={[row.sub, { color: m3.onSurfaceVariant }]} numberOfLines={2}>
          {banner.subtitle}
        </Text>
      ) : null}
      <Text style={[row.meta, { color: m3.onSurfaceVariant }]}>
        CTA: {banner.ctaLabel} → {banner.ctaRoute}
      </Text>

      <View style={row.actions}>
        <M3Button variant="outlined" onPress={onEdit} disabled={busy}>
          Edit
        </M3Button>
        {!banner.isActive ? (
          <M3Button variant="filled" onPress={() => publishMutation.mutate()} disabled={busy}>
            Publish
          </M3Button>
        ) : (
          <M3Button variant="tonal" onPress={() => triggerMutation.mutate()} disabled={busy}>
            Rebroadcast
          </M3Button>
        )}
        {banner.id !== 'default' ? (
          <Pressable
            onPress={() => deleteMutation.mutate()}
            disabled={busy}
            accessibilityLabel="Delete banner"
            style={({ pressed }) => [row.deleteBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function AdminCommunityBannerScreen() {
  const colors = useColors();
  const m3 = useM3Colors();
  const { hPad } = useLayout();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.communityHomeBanners(),
    queryFn: () => api.admin.communityHomeBanners(),
  });

  const banners = data?.banners ?? [];
  const editing = useMemo(
    () => banners.find((b) => b.id === editingId),
    [banners, editingId],
  );

  const onSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.communityHomeBanners() });
    setMode('list');
    setEditingId(null);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingHorizontal: hPad, maxWidth: 720, alignSelf: 'center', width: '100%' },
      ]}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>Community home banner</Text>
      <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
        Compact promo on Discover. Publishing or rebroadcasting bumps the revision so users who dismissed an older version see it again.
      </Text>

      {mode === 'create' ? (
        <BannerForm onSaved={onSaved} onCancel={() => setMode('list')} />
      ) : null}
      {mode === 'edit' && editing ? (
        <BannerForm initial={editing} onSaved={onSaved} onCancel={() => { setMode('list'); setEditingId(null); }} />
      ) : null}

      {mode === 'list' ? (
        <>
          <M3Button variant="filled" onPress={() => setMode('create')} style={styles.createBtn}>
            New banner
          </M3Button>
          {isLoading ? (
            <Text style={{ color: m3.onSurfaceVariant }}>Loading…</Text>
          ) : banners.length === 0 ? (
            <Text style={{ color: m3.onSurfaceVariant }}>
              No custom banners yet. The app shows the built-in default until you publish one from this screen.
            </Text>
          ) : (
            banners.map((banner) => (
              <BannerRow
                key={banner.id}
                banner={banner}
                onEdit={() => {
                  setEditingId(banner.id);
                  setMode('edit');
                }}
              />
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 24, gap: 16, paddingBottom: 48 },
  pageTitle: { fontSize: 22, fontFamily: FontFamily.bold },
  pageSub: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.regular },
  createBtn: { alignSelf: 'flex-start' },
});

const form = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, borderWidth: 1, padding: 16, gap: 12 },
  heading: { ...M3Typography.titleMedium, fontFamily: FontFamily.bold },
  field: { gap: 6 },
  label: { fontSize: 12, fontFamily: FontFamily.medium },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});

const row = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontFamily: FontFamily.semibold },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  sub: { fontSize: 13, lineHeight: 18, fontFamily: FontFamily.regular },
  meta: { fontSize: 12, fontFamily: FontFamily.regular },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 4 },
  deleteBtn: { padding: 10, marginLeft: 'auto' },
});
