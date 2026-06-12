import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { goBackOrReplace } from '@/lib/navigation';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/design-system/ui/Button';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { ImageGalleryPicker, M3Card, M3SectionHeader, PageContainer } from '@/design-system/ui';
import { DatePickerInput, type ISODateString } from '@/design-system/ui/DatePickerInput';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { CultureTokens, FontFamily, Radius, ScreenTokens, SignatureGradient, Spacing, gradients } from '@/design-system/tokens/theme';
import type { User, FamilyMember, FamilyRelation } from '@/shared/schema';
import {
  profileSocialFormFromUser,
  SOCIAL_HANDLE_PLACEHOLDERS,
  toPlatformUrl,
  type SocialPlatformKey,
} from '@/shared/utils/socialLinks';

type SocialKey = 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin' | 'facebook' | 'website';

type FormState = {
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  languages: string;
  ethnicityText: string;
  dateOfBirth: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
  facebook: string;
  website: string;
  isPublicProfile: boolean;
  showLocation: boolean;
  showSocialLinks: boolean;
  showCommunities: boolean;
  showInterests: boolean;
  showCulturalIdentity: boolean;
  privateViewingMode: boolean;
  showFamily: boolean;
};

const SOCIAL_ROWS: {
  key: SocialKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  placeholder: string;
}[] = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: CultureTokens.coral, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.instagram ?? 'username' },
  { key: 'twitter', label: 'X', icon: 'logo-twitter', color: CultureTokens.indigo, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.twitter ?? 'CulturePassApp' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: CultureTokens.coral, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.youtube ?? '@username' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: CultureTokens.teal, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.tiktok ?? '@username' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: CultureTokens.indigo, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.linkedin ?? 'company/name' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: CultureTokens.violet, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.facebook ?? 'username' },
  { key: 'website', label: 'Website', icon: 'globe-outline', color: CultureTokens.teal, placeholder: SOCIAL_HANDLE_PLACEHOLDERS.website ?? 'culturepass.app' },
];

const AVATAR_SIZE = 110;

function softColor(hex: string, alpha = '20') {
  return `${hex}${alpha}`;
}

function firstDefinedString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'url';
  maxLength?: number;
}) {
  const colors = useColors();
  return (
    <View style={[styles.field, multiline && styles.fieldMultiline, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder, borderWidth: 1 }]}>
      <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, multiline && styles.inputMultiline, { color: colors.text }]}
        selectionColor={colors.primary}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' || keyboardType === 'url' ? 'none' : undefined}
        accessibilityLabel={label}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <M3Card variant="filled" style={[styles.sectionCard, { borderColor: colors.cardBorder }]}>
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xs }}>
        <M3SectionHeader title={title} />
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </M3Card>
  );
}

function LoadingScreen({ isWide, bottomInset }: { isWide: boolean; bottomInset: number }) {
  const colors = useColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: ScreenTokens.topOffset,
            paddingBottom: bottomInset + 80,
            paddingHorizontal: isWide ? Spacing.xl : Spacing.md,
          },
        ]}
      >
        <View style={[styles.shell, { maxWidth: isWide ? 920 : 720 }]}>
          <View style={styles.header}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={88} height={14} borderRadius={7} />
              <Skeleton width={260} height={30} borderRadius={10} />
            </View>
          </View>
          <View style={[styles.profileHero, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Skeleton width={AVATAR_SIZE + 8} height={AVATAR_SIZE + 8} borderRadius={(AVATAR_SIZE + 8) / 2} />
            <Skeleton width={180} height={26} borderRadius={8} />
            <Skeleton width={220} height={16} borderRadius={8} />
          </View>
          <View style={[styles.grid, isWide && styles.gridWide]}>
            {[0, 1].map((column) => (
              <View key={column} style={styles.column}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={styles.section}>
                    <Skeleton width={120} height={14} borderRadius={7} />
                    <Skeleton width="100%" height={68} borderRadius={Radius.md} />
                    <Skeleton width="100%" height={68} borderRadius={Radius.md} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onValueChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder, borderWidth: 1 }]}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.toggleSub, { color: colors.textTertiary }]}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.textInverse}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { user: authUser, userId, isRestoring, updateUserProfile } = useAuth();
  const { uploading } = useImageUpload();
  const safeInsets = useSafeAreaInsetsWeb();
  const bottomInset = safeInsets.bottom;
  const isWide = width >= 900;
  const topInset = safeInsets.top;

  const {
    data: serverUser,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-edit', userId],
    enabled: Boolean(userId) && !isRestoring,
    queryFn: () => api.auth.me(),
  });

  const user = serverUser ?? authUser;

  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [form, setForm] = useState<FormState>({
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    bio: user?.bio ?? '',
    city: user?.city ?? '',
    state: firstDefinedString(user?.state),
    postcode: firstDefinedString(user?.postcode),
    country: user?.country ?? 'Australia',
    languages: (user?.languages ?? []).join(', '),
    ethnicityText: firstDefinedString(user?.ethnicityText),
    dateOfBirth: firstDefinedString((user as Record<string, unknown> | null | undefined)?.dateOfBirth),
    ...profileSocialFormFromUser(user ?? {}),
    isPublicProfile: user?.privacySettings?.profileVisible ?? true,
    showLocation: user?.privacySettings?.locationVisible ?? true,
    showSocialLinks: user?.privacySettings?.showSocialLinks ?? true,
    showCommunities: user?.privacySettings?.showCommunities ?? true,
    showInterests: user?.privacySettings?.showInterests ?? true,
    showCulturalIdentity: user?.privacySettings?.showCulturalIdentity ?? true,
    privateViewingMode: user?.privacySettings?.privateViewingMode ?? false,
    showFamily: user?.privacySettings?.showFamily ?? true,
  });
  const [dirty, setDirty] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [editingFamily, setEditingFamily] = useState<Partial<FamilyMember> | null>(null); // for add/edit modal
  const [familyModalVisible, setFamilyModalVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAvatarUri(user.avatarUrl ?? null);
    setForm({
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
      city: user.city ?? '',
      state: firstDefinedString(user.state),
      postcode: firstDefinedString(user.postcode),
      country: user.country ?? 'Australia',
      languages: (user.languages ?? []).join(', '),
      ethnicityText: firstDefinedString(user.ethnicityText),
      dateOfBirth: firstDefinedString((user as unknown as Record<string, unknown>).dateOfBirth),
      ...profileSocialFormFromUser(user),
      isPublicProfile: user.privacySettings?.profileVisible ?? true,
      showLocation: user.privacySettings?.locationVisible ?? true,
      showSocialLinks: user.privacySettings?.showSocialLinks ?? true,
      showCommunities: user.privacySettings?.showCommunities ?? true,
      showInterests: user.privacySettings?.showInterests ?? true,
      showCulturalIdentity: user.privacySettings?.showCulturalIdentity ?? true,
      privateViewingMode: user.privacySettings?.privateViewingMode ?? false,
      showFamily: user.privacySettings?.showFamily ?? true,
    });
    setFamilyMembers(user.familyMembers ?? []);
    setDirty(false);
  }, [user]);

  const initials = useMemo(() => {
    const source = form.displayName || user?.email || 'C';
    return source
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [form.displayName, user?.email]);

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };
  const updateToggle = (field: keyof FormState) => (value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  // Family helpers
  const openAddFamily = () => {
    setEditingFamily({ id: Date.now().toString(), relation: 'child', name: '' });
    setFamilyModalVisible(true);
  };

  const openEditFamily = (member: FamilyMember) => {
    setEditingFamily({ ...member });
    setFamilyModalVisible(true);
  };

  const saveFamilyMember = () => {
    if (!editingFamily || !editingFamily.name?.trim()) {
      Alert.alert('Name required', 'Please enter a name for the family member.');
      return;
    }
    const member: FamilyMember = {
      id: editingFamily.id || Date.now().toString(),
      relation: (editingFamily.relation as FamilyRelation) || 'child',
      name: editingFamily.name.trim(),
      userId: editingFamily.userId,
      avatarUrl: editingFamily.avatarUrl,
      note: editingFamily.note?.trim() || undefined,
    };

    setFamilyMembers((prev) => {
      const exists = prev.some(m => m.id === member.id);
      if (exists) {
        return prev.map(m => m.id === member.id ? member : m);
      }
      return [...prev, member];
    });
    setDirty(true);
    setFamilyModalVisible(false);
    setEditingFamily(null);
  };

  const deleteFamilyMember = (id: string) => {
    Alert.alert('Remove family member', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setFamilyMembers(prev => prev.filter(m => m.id !== id));
          setDirty(true);
        },
      },
    ]);
  };

  const cancelFamilyModal = () => {
    setFamilyModalVisible(false);
    setEditingFamily(null);
  };

  const clearSocial = (key: SocialKey) => {
    setForm((prev) => ({ ...prev, [key]: '' }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const socialLinks: Record<string, string> = {};
      SOCIAL_ROWS.forEach((row) => {
        if (row.key === 'website') return;
        const url = toPlatformUrl(form[row.key], row.key);
        if (url) socialLinks[row.key] = url;
      });
      const payload = {
        displayName: form.displayName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        bio: form.bio.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim().toUpperCase() || undefined,
        postcode: form.postcode.trim() ? Number(form.postcode.trim()) : undefined,
        country: form.country.trim() || undefined,
        location: form.city.trim() && form.country.trim() ? `${form.city.trim()}, ${form.country.trim()}` : undefined,
        avatarUrl: avatarUri ?? undefined,
        website: toPlatformUrl(form.website, 'website'),
        socialLinks,
        languages: form.languages.trim() ? form.languages.split(',').map((item) => item.trim()).filter(Boolean) : [],
        ethnicityText: form.ethnicityText.trim() || undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
        privacySettings: {
          profileVisible: form.isPublicProfile,
          locationVisible: form.showLocation,
          showSocialLinks: form.showSocialLinks,
          showCommunities: form.showCommunities,
          showInterests: form.showInterests,
          showCulturalIdentity: form.showCulturalIdentity,
          privateViewingMode: form.privateViewingMode,
          showFamily: form.showFamily,
        },
        familyMembers: familyMembers.length > 0 ? familyMembers : undefined,
      };
      
      // Use the new updateUserProfile method to ensure changes propagate everywhere
      await updateUserProfile(payload as Partial<User>);
    },
    onSuccess: () => {
      // The query invalidation is now handled in updateUserProfile
      setDirty(false);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goBackOrReplace('/settings');
    },
    onError: (error: Error) => Alert.alert('Could not save profile', error.message),
  });

  const choosePhoto = () => {
    if (!userId) return;
    setAvatarPickerVisible(true);
  };

  const handleAvatarSelected = async (uri: string) => {
    setAvatarUri(uri);
    setDirty(true);
    try {
      await updateUserProfile({ avatarUrl: uri });
    } catch {
      // Save button will retry; local preview still shows the new image
    }
  };

  const canSave = Boolean(form.displayName.trim()) && dirty && !saveMutation.isPending;
  const saveDetail = form.displayName.trim()
    ? 'Changes sync to your profile after saving.'
    : 'Name is required before saving.';

  if (isRestoring || (Boolean(userId) && isPending && !user)) {
    return <LoadingScreen isWide={isWide} bottomInset={bottomInset} />;
  }

  if (!userId && !isRestoring) {
    return null;
  }

  return (
    <>
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS !== 'web'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topInset + ScreenTokens.topOffset,
            paddingBottom: bottomInset + 120,
            paddingHorizontal: isWide ? Spacing.xl : Spacing.md,
          },
        ]}
      >
        <View style={[styles.shell, { maxWidth: isWide ? 920 : 720 }]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => goBackOrReplace('/settings')}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.72 : 1 },
                Platform.OS === 'web' && { cursor: 'pointer' as never },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>Profile</Text>
              <Text style={[styles.title, { color: colors.text }]}>Edit your CulturePass</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Keep your public profile accurate across iOS, Android, and web.</Text>
            </View>
            <Pressable
              onPress={() => router.push(`/profile/${userId}` as never)}
              style={({ pressed }) => [
                styles.previewButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.72 : 1 },
                Platform.OS === 'web' && { cursor: 'pointer' as never },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Preview profile"
            >
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {isError ? (
            <View style={[styles.errorCard, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}44` }]} accessibilityRole="alert">
              <View style={styles.errorCopy}>
                <Ionicons name="warning-outline" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {error instanceof ApiError ? error.message : 'Could not load your profile from the server.'}
                </Text>
              </View>
              <Button variant="outline" size="sm" onPress={() => void refetch()} accessibilityLabel="Retry loading profile">
                Retry
              </Button>
            </View>
          ) : null}

          <View style={[styles.profileHero, { borderColor: colors.cardBorder }]}>
            <LinearGradient
              colors={gradients.midnight as unknown as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroOrb} pointerEvents="none" />
            <Pressable
              onPress={choosePhoto}
              style={({ pressed }) => [styles.avatarButton, { opacity: pressed ? 0.8 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' as never }]}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <View style={[styles.avatar, { borderColor: `${CultureTokens.indigo}55` }]}>
                {avatarUri ? (
                  <CultureImage uri={avatarUri} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <LinearGradient colors={SignatureGradient as unknown as [string, string]} style={StyleSheet.absoluteFill}>
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{initials}</Text>
                    </View>
                  </LinearGradient>
                )}
              </View>
              <View style={[styles.cameraBubble, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                {uploading ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons name="camera" size={16} color={colors.primary} />}
              </View>
            </Pressable>
            <Text style={styles.heroName} numberOfLines={1}>{form.displayName || user?.username || 'Your name'}</Text>
            <Text style={styles.heroHint}>Tap to crop and reposition your profile photo</Text>
          </View>

          <View style={[styles.grid, isWide && styles.gridWide]}>
            <View style={styles.column}>
              <Section title="Identity">
                <Field label="Display name" value={form.displayName} onChangeText={updateField('displayName')} placeholder="Your name" />
                <Field
                  label="Bio"
                  value={form.bio}
                  onChangeText={updateField('bio')}
                  placeholder="Share a little about your background and interests."
                  multiline
                  maxLength={280}
                />
                <Text style={[styles.charCount, { color: colors.textTertiary }]}>{form.bio.length}/280</Text>
                <Field label="Languages" value={form.languages} onChangeText={updateField('languages')} placeholder="English, Hindi, Malayalam" />
                <Field label="Cultural background" value={form.ethnicityText} onChangeText={updateField('ethnicityText')} placeholder="How you describe your heritage" />
                <DatePickerInput
                  label="Birthday"
                  value={form.dateOfBirth}
                  onChangeDate={(iso: ISODateString) => updateField('dateOfBirth')(iso)}
                  placeholder="YYYY-MM-DD"
                  maxDate={new Date().toISOString().slice(0, 10)}
                  containerStyle={styles.dateField}
                  accessibilityLabel="Birthday"
                />
              </Section>

              <Section title="Contact">
                <Field label="Email" value={form.email} onChangeText={updateField('email')} placeholder="your@email.com" keyboardType="email-address" />
                <Field label="Phone" value={form.phone} onChangeText={updateField('phone')} placeholder="+61 400 000 000" keyboardType="phone-pad" />
              </Section>
            </View>

            <View style={styles.column}>
              <Section title="Location">
                <Field label="City" value={form.city} onChangeText={updateField('city')} placeholder="Sydney" />
                <Field label="State" value={form.state} onChangeText={updateField('state')} placeholder="NSW" />
                <Field label="Postcode" value={form.postcode} onChangeText={updateField('postcode')} placeholder="2000" keyboardType="number-pad" />
                <Field label="Country" value={form.country} onChangeText={updateField('country')} placeholder="Australia" />
              </Section>

              <Section title="Social Links">
                <Text style={[styles.socialHint, { color: colors.textTertiary }]}>
                  Links appear on your public profile. Enter username or full URL.
                </Text>
                {SOCIAL_ROWS.map((row) => {
                  const currentVal = form[row.key];
                  const resolved = toPlatformUrl(currentVal, row.key);
                  return (
                    <View key={row.key} style={[styles.socialField, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
                      <View style={[styles.socialIcon, { backgroundColor: softColor(row.color) }]}>
                        <Ionicons name={row.icon} size={18} color={row.color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.socialLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                        <TextInput
                          value={currentVal}
                          onChangeText={updateField(row.key)}
                          placeholder={row.placeholder}
                          placeholderTextColor={colors.textTertiary}
                          autoCapitalize="none"
                          keyboardType={row.key === 'website' ? 'url' : 'default'}
                          style={[styles.socialInput, { color: colors.text }]}
                          selectionColor={colors.primary}
                          accessibilityLabel={row.label}
                        />
                        {resolved ? (
                          <Text style={[styles.socialResolved, { color: colors.primary }]} numberOfLines={1}>
                            → {resolved.replace(/^https?:\/\//, '')}
                          </Text>
                        ) : null}
                      </View>
                      {currentVal ? (
                        <Pressable
                          onPress={() => clearSocial(row.key)}
                          hitSlop={8}
                          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Clear ${row.label}`}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </Section>

              <Section title="Family">
                <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                  Add mother, father, children and other family members to your cultural profile.
                </Text>

                {familyMembers.length === 0 ? (
                  <Pressable
                    onPress={openAddFamily}
                    style={[styles.addButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                  >
                    <Ionicons name="people-outline" size={18} color={colors.primary} />
                    <Text style={[styles.addButtonText, { color: colors.primary }]}>Add family member</Text>
                  </Pressable>
                ) : (
                  <View style={styles.familyList}>
                    {familyMembers.map((member) => (
                      <View key={member.id} style={[styles.familyRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
                        <View style={styles.familyInfo}>
                          <Text style={[styles.familyName, { color: colors.text }]}>{member.name}</Text>
                          <Text style={[styles.familyRelation, { color: colors.textTertiary }]}>
                            {member.relation.charAt(0).toUpperCase() + member.relation.slice(1)}
                            {member.note ? ` • ${member.note}` : ''}
                          </Text>
                        </View>
                        <View style={styles.familyActions}>
                          <Pressable onPress={() => openEditFamily(member)} hitSlop={8}>
                            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                          </Pressable>
                          <Pressable onPress={() => deleteFamilyMember(member.id)} hitSlop={8} style={{ marginLeft: 12 }}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    <Pressable onPress={openAddFamily} style={styles.addMoreButton}>
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text style={[styles.addMoreText, { color: colors.primary }]}>Add another</Text>
                    </Pressable>
                  </View>
                )}
              </Section>

              <Section title="Privacy">
                <ToggleRow label="Public profile" sub="Allow people to find your public profile." value={form.isPublicProfile} onValueChange={updateToggle('isPublicProfile')} />
                <ToggleRow label="Show city" value={form.showLocation} onValueChange={updateToggle('showLocation')} />
                <ToggleRow label="Show social links" value={form.showSocialLinks} onValueChange={updateToggle('showSocialLinks')} />
                <ToggleRow label="Show communities" value={form.showCommunities} onValueChange={updateToggle('showCommunities')} />
                <ToggleRow label="Show interests" value={form.showInterests} onValueChange={updateToggle('showInterests')} />
                <ToggleRow label="Show cultural identity" value={form.showCulturalIdentity} onValueChange={updateToggle('showCulturalIdentity')} />
                <ToggleRow label="Show family" value={form.showFamily} onValueChange={updateToggle('showFamily')} />
                <ToggleRow label="Private viewing" sub="Browse profiles without showing activity status." value={form.privateViewingMode} onValueChange={updateToggle('privateViewingMode')} />
              </Section>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Family Member Modal */}
      {familyModalVisible && editingFamily && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingFamily.id && familyMembers.some(m => m.id === editingFamily.id) ? 'Edit Family Member' : 'Add Family Member'}
            </Text>

            {/* Relation selector - simple chips */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Relation</Text>
            <View style={styles.relationChips}>
              {(['mother','father','son','daughter','child','spouse','partner','sibling'] as const).map((rel) => (
                <Pressable
                  key={rel}
                  onPress={() => setEditingFamily(prev => ({ ...prev!, relation: rel }))}
                  style={[
                    styles.relationChip,
                    editingFamily.relation === rel && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text style={[
                    styles.relationChipText,
                    editingFamily.relation === rel ? { color: '#fff' } : { color: colors.text }
                  ]}>
                    {rel.charAt(0).toUpperCase() + rel.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 12 }]}>Name</Text>
            <TextInput
              value={editingFamily.name || ''}
              onChangeText={(text) => setEditingFamily(prev => ({ ...prev!, name: text }))}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}
              autoCapitalize="words"
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 12 }]}>Short note (optional)</Text>
            <TextInput
              value={editingFamily.note || ''}
              onChangeText={(text) => setEditingFamily(prev => ({ ...prev!, note: text }))}
              placeholder="e.g. Loves traditional recipes"
              placeholderTextColor={colors.textTertiary}
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}
              maxLength={120}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={cancelFamilyModal} style={styles.modalCancel}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveFamilyMember} style={[styles.modalSave, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View
        style={[
          styles.saveBar,
          {
            paddingBottom: bottomInset,
            backgroundColor: colors.tabBar,
            borderColor: colors.tabBarBorder,
          },
        ]}
      >
        <View style={styles.saveBarInner}>
          <View style={styles.saveCopy}>
            <Text style={[styles.saveTitle, { color: colors.text }]}>{dirty ? 'Unsaved changes' : 'Profile up to date'}</Text>
            <Text style={[styles.saveSub, { color: colors.textTertiary }]}>{saveDetail}</Text>
          </View>
          <Button
            leftIcon="checkmark"
            disabled={!canSave}
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
            accessibilityLabel="Save profile"
          >
            Save
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>

    {userId ? (
      <ImageGalleryPicker
        visible={avatarPickerVisible}
        onClose={() => setAvatarPickerVisible(false)}
        currentUri={avatarUri}
        onSelect={handleAvatarSelected}
        collectionName="users"
        docId={userId}
        fieldName="avatarUrl"
        skipDbUpdate
        preservePrevious
        historyFieldName="avatarUrlHistory"
        resizeWidth={900}
      />
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  shell: { width: '100%', alignSelf: 'center', gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontSize: 12, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.bold, letterSpacing: 0 },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.regular },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorCopy: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  errorText: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, fontFamily: FontFamily.medium },
  profileHero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    minHeight: 224,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    top: -62,
    right: -48,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(13,148,136,0.16)',
  },
  avatarButton: { width: AVATAR_SIZE + 8, height: AVATAR_SIZE + 8, marginBottom: 6 },
  avatar: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: Radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: AVATAR_SIZE + 2, height: AVATAR_SIZE + 2, borderRadius: Radius.full },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  cameraBubble: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { maxWidth: '100%', fontSize: 20, lineHeight: 26, fontFamily: FontFamily.bold, color: '#FFFFFF', letterSpacing: 0, textAlign: 'center' },
  heroHint: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.68)', textAlign: 'center' },
  grid: { gap: Spacing.md },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0, gap: Spacing.md },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  section: { gap: Spacing.sm },
  sectionBody: { gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  field: { minHeight: 62, borderWidth: 0, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8, gap: 2, backgroundColor: 'transparent' },
  fieldMultiline: { minHeight: 122 },
  fieldLabel: { fontSize: 12, lineHeight: 16, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.7 },
  input: { minHeight: 32, paddingVertical: 0, fontSize: 15, lineHeight: 21, fontFamily: FontFamily.medium },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top', paddingTop: 6 },
  charCount: { marginTop: -4, textAlign: 'right', fontSize: 11, lineHeight: 15, fontFamily: FontFamily.regular },
  dateField: { minHeight: 68 },
  socialField: {
    minHeight: 52,
    borderWidth: 0,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  socialIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  socialLabel: { width: 82, fontSize: 13, lineHeight: 18, fontFamily: FontFamily.semibold },
  socialInput: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 21, fontFamily: FontFamily.medium, paddingVertical: 2 },
  socialHint: { fontSize: 12, lineHeight: 16, fontFamily: FontFamily.regular, marginBottom: 4, paddingHorizontal: 2 },
  socialResolved: { fontSize: 11, lineHeight: 14, fontFamily: FontFamily.regular, marginTop: 2, opacity: 0.85 },
  toggleRow: {
    minHeight: 58,
    borderWidth: 0,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'transparent',
  },
  toggleCopy: { flex: 1, minWidth: 0, gap: 2 },
  toggleLabel: { fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold },
  toggleSub: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.regular },
  saveBar: { borderTopWidth: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  saveBarInner: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  saveCopy: { flex: 1, minWidth: 0 },
  saveTitle: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.bold },
  saveSub: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.regular },

  // Family section
  sectionHint: { fontSize: 13, fontFamily: FontFamily.regular, marginBottom: Spacing.sm },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addButtonText: { fontSize: 15, fontFamily: FontFamily.semibold },
  familyList: { gap: 8 },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  familyInfo: { flex: 1 },
  familyName: { fontSize: 16, fontFamily: FontFamily.semibold },
  familyRelation: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 2 },
  familyActions: { flexDirection: 'row', alignItems: 'center' },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  addMoreText: { fontSize: 14, fontFamily: FontFamily.semibold },

  // Simple family modal
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginBottom: 12 },
  modalLabel: { fontSize: 13, fontFamily: FontFamily.semibold, marginBottom: 6 },
  relationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  relationChipText: { fontSize: 13, fontFamily: FontFamily.medium },
  modalInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalSave: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
});