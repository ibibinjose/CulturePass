/**
 * Single contact — CRM profile (device-local notes & tags).
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  FontFamily,
  Radius,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { M3TopAppBar } from '@/design-system/ui';
import { useSafeBack } from '@/lib/navigation';
import { useContacts } from '@/contexts/ContactsContext';
import type { SavedContact } from '@/repositories/ContactsRepository';
import { exportToAddressBook } from '@/modules/contacts/lib/exportContact';
import { CONTACTS_CONTENT_MAX } from '../components/contactsLayout';
import { contactDisplayName } from '../lib/contactDisplayName';
import { resolveContactFromCpid } from '../lib/resolveContactFromCpid';

const STAGES: {
  id: NonNullable<SavedContact['stage']>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { id: 'new', label: 'New', icon: 'sparkles-outline', color: CultureTokens.teal },
  { id: 'active', label: 'Active', icon: 'flash-outline', color: CultureTokens.indigo },
  { id: 'dormant', label: 'Dormant', icon: 'moon-outline', color: CultureTokens.violet },
];

function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ContactDetailCrmScreen() {
  const colors = useColors();
  const goBackSafe = useSafeBack('/contacts');
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 24 : insets.bottom;
  const params = useLocalSearchParams<{ cpid?: string | string[] }>();
  const raw = params.cpid;
  const cpid =
    typeof raw === 'string'
      ? decodeURIComponent(raw)
      : Array.isArray(raw)
        ? decodeURIComponent(raw[0] ?? '')
        : '';

  const { getContact, updateContact, removeContact } = useContacts();
  const c = getContact(cpid);

  const [notes, setNotes] = useState(c?.notes ?? '');
  const [tagsText, setTagsText] = useState('');
  const [tagChips, setTagChips] = useState<string[]>(c?.tags ?? []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchedStampRef = useRef<string | null>(null);

  useEffect(() => {
    if (!c) return;
    setNotes(c.notes ?? '');
    setTagChips(c.tags ?? []);
  }, [c]);

  useEffect(() => {
    if (!cpid || !c) return;
    if (touchedStampRef.current === cpid) return;
    touchedStampRef.current = cpid;
    updateContact(cpid, { lastTouchedAt: new Date().toISOString() });
  }, [cpid, c, updateContact]);

  useEffect(() => {
    if (!cpid || !c) return;
    const name = c.name?.trim();
    const needsProfile = !name || name.toUpperCase() === c.cpid.toUpperCase();
    if (!needsProfile) return;

    let cancelled = false;
    void (async () => {
      const resolved = await resolveContactFromCpid(cpid);
      if (cancelled || !resolved?.name?.trim()) return;
      updateContact(cpid, resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [cpid, c, updateContact]);

  const persistNotes = useCallback(
    (value: string) => {
      if (!c) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateContact(c.cpid, { notes: value });
      }, 500);
    },
    [c, updateContact],
  );

  const onNotesChange = useCallback(
    (t: string) => {
      setNotes(t);
      persistNotes(t);
    },
    [persistNotes],
  );

  const onAddTag = useCallback(() => {
    const tag = tagsText.trim().replace(/^[,;]+|[,;]+$/g, '');
    if (!tag || !c) return;
    const next = [...new Set([...tagChips, tag])].slice(0, 12);
    setTagChips(next);
    setTagsText('');
    updateContact(c.cpid, { tags: next });
    haptic();
  }, [c, tagsText, tagChips, updateContact]);

  const onRemoveTag = useCallback(
    (tag: string) => {
      if (!c) return;
      const next = tagChips.filter(t => t !== tag);
      setTagChips(next);
      updateContact(c.cpid, { tags: next.length ? next : undefined });
      haptic();
    },
    [c, tagChips, updateContact],
  );

  const onStage = useCallback(
    (stage: NonNullable<SavedContact['stage']>) => {
      if (!c) return;
      haptic();
      updateContact(c.cpid, { stage });
    },
    [c, updateContact],
  );

  const onOpenProfile = useCallback(() => {
    if (!c) return;
    haptic();
    const id = c.userId || c.cpid;
    router.push(`/u/${encodeURIComponent(id)}` as never);
  }, [c]);

  const onMarkContacted = useCallback(() => {
    if (!c) return;
    haptic();
    updateContact(c.cpid, { lastTouchedAt: new Date().toISOString() });
    Alert.alert('Updated', 'Last contact date set to now.');
  }, [c, updateContact]);

  const handleExportToPhone = useCallback(async () => {
    if (!c) return;
    try {
      const res = await exportToAddressBook({
        displayName: displayName,
        email: c.email,
        phone: c.phone,
        website: c.website,
        city: c.city,
        state: c.state,
        country: c.country,
        bio: c.bio,
        cpid: c.cpid,
        membershipTier: c.tier || 'free',
      });
      if (Platform.OS !== 'web') {
        Alert.alert(res.success ? 'Success' : 'Export Failed', res.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save contact.');
    }
  }, [c, displayName]);

  const onRemove = useCallback(() => {
    if (!c) return;
    Alert.alert('Remove contact', `Remove ${c.name || c.cpid}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeContact(c.cpid);
          goBackSafe();
        },
      },
    ]);
  }, [c, removeContact, goBackSafe]);

  if (!c || !cpid) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.regular }}>Contact not found.</Text>
        <Button variant="primary" onPress={goBackSafe}>
          Back to contacts
        </Button>
      </View>
    );
  }

  const stage = c.stage ?? 'new';
  const displayName = contactDisplayName(c);
  const initials = displayName
    .replace(/^@/, '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const headerActions = [
    {
      icon: (c.pinned ? 'pin' : 'pin-outline') as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        haptic();
        updateContact(c.cpid, { pinned: !c.pinned });
      },
      label: c.pinned ? 'Unpin' : 'Pin',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <M3TopAppBar
        title={displayName}
        onBack={goBackSafe}
        actions={headerActions}
        variant="center-aligned"
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: hPad,
            paddingBottom: bottomInset + 32,
            maxWidth: isDesktop ? CONTACTS_CONTENT_MAX + hPad * 2 : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
            width: isDesktop ? '100%' : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <LinearGradient
              colors={SignatureGradient as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroStripe}
            />
            <View style={styles.heroRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                {c.avatarUrl ? (
                  <Image source={{ uri: c.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
                )}
              </View>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroName, { color: colors.text }]}>{displayName}</Text>
                {c.username ? (
                  <Text style={[styles.heroHandle, { color: colors.primary }]}>@{c.username}</Text>
                ) : null}
                <View style={[styles.idChip, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.idText, { color: colors.textSecondary }]}>{c.cpid}</Text>
                </View>
                {c.org ? (
                  <Text style={[styles.heroOrg, { color: colors.textSecondary }]} numberOfLines={1}>
                    {c.org}
                  </Text>
                ) : null}
              </View>
            </View>

            {c.bio ? (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>{c.bio}</Text>
            ) : null}

            <View style={[styles.metaRow, { borderTopColor: colors.borderLight }]}>
              <Meta icon="location-outline" label={c.city || 'Anywhere'} colors={colors} />
              <Meta icon="calendar-outline" label={`Saved ${formatDate(c.savedAt)}`} colors={colors} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <Button variant="primary" style={{ flex: 1.5 }} leftIcon="person-outline" onPress={onOpenProfile}>
            View profile
          </Button>
          <Button variant="outline" style={{ flex: 1 }} leftIcon="checkmark-circle-outline" onPress={onMarkContacted}>
            Contacted
          </Button>
        </View>

        <Button variant="outline" leftIcon="download-outline" onPress={handleExportToPhone}>
          Save to Phone Contacts
        </Button>

        <Section title="Relationship">
          <View style={styles.stageRow}>
            {STAGES.map(s => {
              const active = stage === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => onStage(s.id)}
                  style={[
                    styles.stageCard,
                    {
                      backgroundColor: active ? s.color + '14' : colors.surface,
                      borderColor: active ? s.color : colors.borderLight,
                    },
                  ]}
                >
                  <Ionicons name={s.icon} size={20} color={active ? s.color : colors.textTertiary} />
                  <Text style={[styles.stageLabel, { color: active ? s.color : colors.text }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section
          title="Private notes"
          badge={
            <View style={[styles.localBadge, { borderColor: colors.borderLight }]}>
              <Ionicons name="shield-checkmark" size={11} color={CultureTokens.teal} />
              <Text style={[styles.localBadgeText, { color: colors.textTertiary }]}>On device</Text>
            </View>
          }
        >
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <TextInput
              value={notes}
              onChangeText={onNotesChange}
              placeholder="Context, follow-ups, where you met…"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.notesInput, { color: colors.text }]}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tags</Text>
            <View style={styles.tagGrid}>
              {tagChips.map(t => (
                <View
                  key={t}
                  style={[styles.tagPill, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '25' }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                  <Pressable onPress={() => onRemoveTag(t)} hitSlop={6}>
                    <Ionicons name="close" size={14} color={colors.primary} />
                  </Pressable>
                </View>
              ))}
              <TextInput
                value={tagsText}
                onChangeText={setTagsText}
                onSubmitEditing={onAddTag}
                placeholder="+ tag"
                placeholderTextColor={colors.textTertiary}
                style={[styles.tagInput, { color: colors.text }]}
              />
            </View>
          </View>
        </Section>

        {(c.email || c.phone) && (
          <Section title="Contact channels">
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, gap: 12 }]}>
              {c.email ? <Channel icon="mail-outline" value={c.email} colors={colors} /> : null}
              {c.phone ? <Channel icon="call-outline" value={c.phone} colors={colors} /> : null}
            </View>
          </Section>
        )}

        <Button variant="danger" onPress={onRemove} leftIcon="trash-outline" style={{ marginTop: 8 }}>
          Remove contact
        </Button>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title.toUpperCase()}</Text>
        {badge}
      </View>
      {children}
    </View>
  );
}

function Meta({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.textTertiary} />
      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function Channel({
  icon,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.channelRow}>
      <View style={[styles.channelIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={16} color={colors.textTertiary} />
      </View>
      <Text style={[styles.channelText, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  scroll: { paddingTop: 16, gap: 24 },

  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    gap: 14,
  },
  heroStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 26, fontFamily: FontFamily.bold },
  heroCopy: { flex: 1, gap: 4, minWidth: 0 },
  heroName: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  heroHandle: { fontSize: 15, fontFamily: FontFamily.semibold },
  idChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  idText: { fontSize: 11, fontFamily: FontFamily.semibold },
  heroOrg: { fontSize: 13, fontFamily: FontFamily.regular },
  bio: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 21 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontFamily: FontFamily.medium },

  actions: { flexDirection: 'row', gap: 10 },

  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2 },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  localBadgeText: { fontSize: 10, fontFamily: FontFamily.semibold },

  stageRow: { flexDirection: 'row', gap: 8 },
  stageCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  stageLabel: { fontSize: 13, fontFamily: FontFamily.semibold },

  card: { borderRadius: Radius.lg, borderWidth: 1, padding: 16 },
  fieldLabel: { fontSize: 12, fontFamily: FontFamily.semibold, marginBottom: 8 },
  notesInput: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    minHeight: 96,
    textAlignVertical: 'top',
    ...Platform.select({ web: { outlineStyle: 'none' } as Record<string, unknown>, default: {} }),
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontFamily: FontFamily.semibold },
  tagInput: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    minWidth: 72,
    paddingVertical: 6,
    ...Platform.select({ web: { outlineStyle: 'none' } as Record<string, unknown>, default: {} }),
  },

  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelText: { fontSize: 15, fontFamily: FontFamily.medium, flex: 1 },
});
