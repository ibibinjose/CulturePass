import React, { useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, type User as FirebaseUser } from 'firebase/auth';

import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { api } from '@/lib/api';
import { goBackOrReplace } from '@/lib/navigation';
import { useColors } from '@/hooks/useColors';
import { useDebounce } from '@/hooks/useDebounce';
import { useRole } from '@/hooks/useRole';
import { auth as firebaseAuth } from '@/lib/firebase';
import { Luxe, luxeDark } from '@/design-system/tokens/luxeHeritage';
import {
  LuxeText,
  LuxeCard,
  LuxeButton,
  CulturalInput,
  CultureImage,
  GlassView
} from '@/design-system/ui';
import { PasswordStrengthIndicator } from '@/design-system/ui/PasswordStrengthIndicator';
import { Spacing } from '@/design-system/tokens/spacing';

type AccountUser = {
  id: string;
  displayName?: string;
  username?: string;
  handle?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  subscriptionTier?: string;
  culturePassId?: string;
};

function haptic(type: 'selection' | 'success' | 'warning' = 'selection') {
  if (Platform.OS === 'web') return;
  if (type === 'selection') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (type === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

function formatHandle(h?: string | null) {
  if (!h) return '—';
  const clean = String(h).replace(/^@/, '');
  return `@${clean}`;
}

function getProviderLabel(providerId: string): { label: string; icon: keyof typeof Ionicons.glyphMap } {
  if (providerId.includes('google')) return { label: 'Google', icon: 'logo-google' };
  if (providerId.includes('apple')) return { label: 'Apple', icon: 'logo-apple' };
  if (providerId.includes('password')) return { label: 'Password', icon: 'key-outline' };
  return { label: providerId, icon: 'person-outline' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Password Modal
// ─────────────────────────────────────────────────────────────────────────────
function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
  onFlash,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFlash?: (type: 'success' | 'error', text: string) => void;
}) {
  const colors = useColors();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = currentPassword.length >= 6 && newPassword.length >= 8 && newPassword === confirmPassword;

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChange = async () => {
    if (!canSubmit || !firebaseAuth?.currentUser) return;

    const user = firebaseAuth.currentUser;
    if (!user.email) {
      setError('Your account does not have a password set. Use Google or Apple sign-in.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);

      haptic('success');
      onFlash?.('success', 'Password updated successfully');
      onSuccess();
      handleClose();
    } catch (e: any) {
      const code = e?.code || '';
      let msg = 'Could not change password. Please try again.';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        msg = 'Current password is incorrect.';
      } else if (code.includes('weak-password')) {
        msg = 'New password is too weak. Use at least 8 characters with mixed case and numbers.';
      } else if (code.includes('requires-recent-login')) {
        msg = 'Please sign out and sign back in, then try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalCardWrap}>
          <LuxeCard variant="default" style={styles.modalCard}><View style={styles.modalHeader}><LuxeText variant="title2">Change Password</LuxeText><Pressable onPress={handleClose} hitSlop={12}><Ionicons name="close" size={24} color={colors.textTertiary} /></Pressable></View><View style={styles.modalBody}><CulturalInput
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                passwordToggle
                secureTextEntry
              /><CulturalInput
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                passwordToggle
                secureTextEntry
              /><PasswordStrengthIndicator password={newPassword} /><CulturalInput
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                passwordToggle
                secureTextEntry
                error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
              />{error ? <LuxeText variant="caption" style={{ color: colors.error, marginTop: 4 }}>{error}</LuxeText> : null}</View><View style={styles.modalActions}><LuxeButton variant="glass" onPress={handleClose} style={{ flex: 1 }}>Cancel</LuxeButton><LuxeButton
                variant="filled"
                onPress={handleChange}
                disabled={!canSubmit}
                loading={loading}
                style={{ flex: 2 }}
              >Update Password</LuxeButton></View></LuxeCard></KeyboardAvoidingView></View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Email Modal
// ─────────────────────────────────────────────────────────────────────────────
function ChangeEmailModal({
  visible,
  currentEmail,
  onClose,
  onSuccess,
  onFlash,
}: {
  visible: boolean;
  currentEmail?: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
  onFlash?: (type: 'success' | 'error', text: string) => void;
}) {
  const colors = useColors();
  const { user, updateUserProfile } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsReauth = !!user?.email && (firebaseAuth?.currentUser?.providerData || []).some((p) => p.providerId === 'password');

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
  const canSubmit = isValid && (!needsReauth || currentPassword.length >= 4);

  const reset = () => {
    setNewEmail('');
    setCurrentPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !firebaseAuth?.currentUser || !user?.id) return;
    const fbUser = firebaseAuth.currentUser as FirebaseUser;
    const targetEmail = newEmail.trim().toLowerCase();
    setLoading(true);
    setError(null);

    try {
      if (needsReauth && currentPassword) {
        const cred = EmailAuthProvider.credential(fbUser.email || user.email || '', currentPassword);
        await reauthenticateWithCredential(fbUser, cred);
      }
      await updateEmail(fbUser, targetEmail);
      try {
        await updateUserProfile({ email: targetEmail });
        await modulesApi.account.initiateEmailChange(targetEmail);
      } catch {}
      haptic('success');
      onFlash?.('success', 'Email updated. Verification link sent to new address.');
      onSuccess(targetEmail);
      handleClose();
    } catch (e: any) {
      const code = String(e?.code || '');
      let msg = 'Could not update email. Please try again.';
      if (code.includes('requires-recent-login')) {
        msg = 'For security, please sign out and sign back in before changing your email.';
      } else if (code.includes('email-already-in-use')) {
        msg = 'That email address is already associated with another account.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalCardWrap}>
          <LuxeCard variant="default" style={styles.modalCard}><View style={styles.modalHeader}><LuxeText variant="title2">Change Email</LuxeText><Pressable onPress={handleClose} hitSlop={12}><Ionicons name="close" size={24} color={colors.textTertiary} /></Pressable></View><View style={styles.modalBody}><LuxeText variant="caption" style={{ color: colors.textSecondary, marginBottom: 12 }}>Current: <Text style={{ color: colors.text, fontWeight: '600' }}>{currentEmail || '—'}</Text></LuxeText><CulturalInput
                label="New email address"
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="you@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />{needsReauth && (
                <CulturalInput
                  label="Confirm Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter your password"
                  passwordToggle
                  secureTextEntry
                />
              )}{error ? <LuxeText variant="caption" style={{ color: colors.error, marginTop: 4 }}>{error}</LuxeText> : null}<LuxeText variant="caption" style={{ color: colors.textTertiary, marginTop: 12 }}>A verification link will be sent to your new address.</LuxeText></View><View style={styles.modalActions}><LuxeButton variant="glass" onPress={handleClose} style={{ flex: 1 }}>Cancel</LuxeButton><LuxeButton
                variant="filled"
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={loading}
                style={{ flex: 2 }}
              >Update Email</LuxeButton></View></LuxeCard></KeyboardAvoidingView></View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { user: authUser, logout, sendVerificationEmail, emailVerified, updateUserProfile, refreshUser } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();

  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const isWide = width >= 900;

  const { data: serverUser } = useQuery<AccountUser>({
    queryKey: ['account-settings-user', authUser?.id],
    enabled: !!authUser?.id,
    queryFn: async () => {
      const data = await api.auth.me();
      return {
        id: data.id,
        displayName: data.displayName,
        username: data.username,
        handle: data.handle,
        email: data.email,
        phone: (data as any).phone,
        avatarUrl: data.avatarUrl,
        subscriptionTier: (data as any).subscriptionTier || authUser?.subscriptionTier,
        culturePassId: data.culturePassId,
      };
    },
  });

  const user = useMemo<AccountUser>(() => {
    const base = serverUser || (authUser as any) || {};
    return {
      id: base.id || authUser?.id || '',
      displayName: base.displayName || authUser?.displayName,
      username: base.username || authUser?.username,
      handle: base.handle || authUser?.handle,
      email: base.email || authUser?.email,
      phone: base.phone || (authUser as any)?.phone,
      avatarUrl: base.avatarUrl || authUser?.avatarUrl,
      subscriptionTier: base.subscriptionTier || authUser?.subscriptionTier,
      culturePassId: base.culturePassId,
    };
  }, [serverUser, authUser]);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const debouncedUsername = useDebounce(username, 380);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFlash = useCallback((type: 'success' | 'error', text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 3400);
  }, []);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || user.handle || '');
      setDirty(false);
    }
  }, [user]);

  React.useEffect(() => {
    const check = async () => {
      const raw = debouncedUsername.trim();
      if (!raw) {
        setUsernameStatus('idle');
        setUsernameMessage('');
        return;
      }
      const normalized = raw.replace(/^@/, '').toLowerCase();
      const currentOriginal = (user?.username || user?.handle || '').toLowerCase().replace(/^@/, '');
      if (normalized === currentOriginal) {
        setUsernameStatus('available');
        setUsernameMessage('Your current username');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]{2,30}$/.test(normalized)) {
        setUsernameStatus('invalid');
        setUsernameMessage('Use 2–30 letters, numbers, . _ -');
        return;
      }
      setUsernameStatus('checking');
      setUsernameMessage('Checking availability…');
      try {
        const res = await modulesApi.account.checkUsernameAvailability(normalized);
        if (res.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username available');
        } else {
          setUsernameStatus('taken');
          setUsernameMessage('Sorry, that username is taken');
        }
      } catch {
        setUsernameStatus('idle');
        setUsernameMessage('');
      }
    };
    check();
  }, [debouncedUsername, user?.username, user?.handle]);

  const handleFieldChange = (field: 'displayName' | 'username', value: string) => {
    if (field === 'displayName') setDisplayName(value);
    else setUsername(value);
    setDirty(true);
    setSaveError(null);
  };

  const saveIdentity = useMutation({
    mutationFn: async () => {
      if (!user.id) throw new Error('Not authenticated');
      const payload: any = {};
      if (displayName.trim()) payload.displayName = displayName.trim();
      const cleanHandle = username.trim().replace(/^@/, '').toLowerCase();
      if (cleanHandle) {
        payload.username = cleanHandle;
        payload.handle = cleanHandle;
      }
      await updateUserProfile(payload);
      return true;
    },
    onSuccess: async () => {
      haptic('success');
      showFlash('success', 'Identity saved');
      setDirty(false);
      setSaveError(null);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['account-settings-user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes('taken') || err?.message?.includes('409')
        ? 'That username is already taken.'
        : 'Could not save changes. Please try again.';
      setSaveError(msg);
    },
  });

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      haptic('success');
      Alert.alert('Verification Sent', 'Check your inbox for the link.');
    } catch {
      Alert.alert('Error', 'Could not send verification email right now.');
    }
  };

  const linkedProviders = useMemo(() => {
    const fbUser = firebaseAuth?.currentUser;
    if (!fbUser?.providerData?.length) return [{ label: 'Email / Password', icon: 'mail-outline' as const }];
    return fbUser.providerData.map((p) => getProviderLabel(p.providerId));
  }, []);

  const confirmDelete = async () => {
    if (!user.id) return;
    const required = 'DELETE';
    const ok = Platform.OS === 'web'
      ? typeof window !== 'undefined' && window.prompt?.('Type DELETE to permanently delete your account and all data:') === required
      : deleteConfirmText.trim().toUpperCase() === required;

    if (!ok) {
      Alert.alert('Confirmation required', 'You must type DELETE exactly to proceed.');
      return;
    }

    setDeleting(true);
    try {
      await modulesApi.account.delete(user.id);
      haptic('warning');
      await logout();
      setShowDeleteConfirm(false);
      router.replace('/(onboarding)/login');
    } catch {
      Alert.alert('Delete Failed', 'We could not delete your account.');
    } finally {
      setDeleting(false);
      setDeleteConfirmText('');
    }
  };

  const tierLabel = (user.subscriptionTier || 'free').toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomInset + 80, paddingHorizontal: isWide ? Spacing.xl : Spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.shell, { maxWidth: isWide ? 800 : 600, alignSelf: 'center', width: '100%' }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: topInset + 12 }]}>
            <Pressable
              onPress={() => goBackOrReplace('/settings')}
              style={({ pressed }) => [
                styles.backCircle,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            ><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
            <View style={{ flex: 1, marginLeft: Spacing.md }}><LuxeText variant="caption" style={{ color: colors.textTertiary, letterSpacing: 1.5 }}>SETTINGS</LuxeText><LuxeText variant="title">Account</LuxeText></View>
          </View>

          {/* Identity Hero */}
          <LuxeCard variant="default" style={styles.hero}><View style={styles.heroLeft}><View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>{user.avatarUrl ? (
                  <CultureImage
                    uri={user.avatarUrl}
                    style={{ width: '100%', height: '100%', borderRadius: 30 }}
                    contentFit="cover"
                    recyclingKey={user.id}
                  />
                ) : (
                  <LuxeText variant="title" style={{ color: colors.primary }}>{(user.displayName || user.username || 'U')[0]?.toUpperCase()}</LuxeText>
                )}</View><View style={{ flex: 1 }}><LuxeText variant="bodyMedium" style={{ fontSize: 18 }}>{user.displayName || 'CulturePass Member'}</LuxeText><LuxeText variant="caption" style={{ color: colors.textSecondary }}>{formatHandle(user.handle || user.username)}</LuxeText>{user.culturePassId && (
                  <LuxeText variant="caption" style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>CPID: {user.culturePassId}</LuxeText>
                )}</View></View><LuxeButton variant="glass" size="sm" onPress={() => router.push('/profile/edit' as never)} leftIcon="create-outline">Edit profile</LuxeButton></LuxeCard>

          {/* Flash banner */}
          {flash && (
            <GlassView style={[styles.flashBanner, { borderColor: flash.type === 'success' ? '#10B98155' : '#FF5E5B55' }]}><Ionicons
                name={flash.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={flash.type === 'success' ? '#10B981' : '#FF5E5B'}
              /><LuxeText variant="bodyMedium" style={{ fontSize: 14, flex: 1 }}>{flash.text}</LuxeText></GlassView>
          )}

          {/* Identity Section */}
          <View style={styles.section}><LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, marginLeft: 4 }}>Identity</LuxeText><LuxeCard variant="default" style={styles.card}><CulturalInput
                label="Display name"
                value={displayName}
                onChangeText={(v) => handleFieldChange('displayName', v)}
                placeholder="Your public name"
                leftIcon="person-outline"
              /><CulturalInput
                label="Username / handle"
                value={username}
                onChangeText={(v) => handleFieldChange('username', v.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                placeholder="unique_handle"
                leftIcon="at-outline"
                error={usernameStatus === 'taken' || usernameStatus === 'invalid' ? usernameMessage : undefined}
                helperText={usernameStatus === 'available' ? usernameMessage : undefined}
              />{saveError ? <LuxeText variant="caption" style={{ color: colors.error, paddingHorizontal: 4 }}>{saveError}</LuxeText> : null}<View style={styles.saveBar}><LuxeButton
                  onPress={() => saveIdentity.mutate()}
                  disabled={!dirty || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                  loading={saveIdentity.isPending}
                  size="sm"
                  style={{ minWidth: 140 }}
                >Save Identity</LuxeButton>{dirty && <LuxeText variant="caption" style={{ color: colors.textTertiary }}>Unsaved changes</LuxeText>}</View></LuxeCard></View>

          {/* Contact Section */}
          <View style={styles.section}><LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, marginLeft: 4 }}>Contact & Verification</LuxeText><LuxeCard variant="default" style={styles.card}><View style={styles.infoRow}><View style={{ flex: 1 }}><LuxeText variant="caption" style={{ color: colors.textTertiary }}>Email</LuxeText><LuxeText variant="bodyMedium">{user.email || '—'}</LuxeText></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{emailVerified ? (
                    <View style={[styles.badge, { backgroundColor: '#10B98122' }]}><Ionicons name="checkmark-circle" size={14} color="#10B981" /><Text style={[styles.badgeText, { color: '#10B981' }]}>Verified</Text></View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: '#F5A62322' }]}><Text style={[styles.badgeText, { color: '#F5A623' }]}>Unverified</Text></View>
                  )}<LuxeButton variant="glass" size="sm" onPress={() => setShowEmailModal(true)}>Change</LuxeButton></View></View>{!emailVerified && (
                <Pressable onPress={handleResendVerification} style={styles.resendRow}><Ionicons name="mail-outline" size={18} color={colors.primary} /><LuxeText variant="bodyMedium" style={{ color: colors.primary, marginLeft: 8, fontSize: 13 }}>Resend verification email</LuxeText></Pressable>
              )}{!!user.phone && (
                <View style={styles.dividerRow}><View><LuxeText variant="caption" style={{ color: colors.textTertiary }}>Phone</LuxeText><LuxeText variant="bodyMedium">{user.phone}</LuxeText></View></View>
              )}</LuxeCard></View>

          {/* Security Section */}
          <View style={styles.section}><LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, marginLeft: 4 }}>Security</LuxeText><LuxeCard variant="default" style={styles.card}><Pressable
                onPress={() => { haptic(); setShowPasswordModal(true); }}
                style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.backgroundSecondary }]}
              ><Ionicons name="key-outline" size={20} color={colors.textSecondary} /><LuxeText variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>Change password</LuxeText><Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /></Pressable><View style={[styles.divider, { backgroundColor: colors.borderLight }]} /><View style={styles.providersHeader}><Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} /><LuxeText variant="bodyMedium" style={{ marginLeft: 12 }}>Sign-in methods</LuxeText></View><View style={styles.providers}>{linkedProviders.map((p, idx) => (
                  <View key={idx} style={[styles.providerPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}><Ionicons name={p.icon} size={15} color={colors.textSecondary} /><Text style={[styles.providerText, { color: colors.textSecondary }]}>{p.label}</Text></View>
                ))}</View><GlassView style={styles.teaser}><Ionicons name="finger-print-outline" size={22} color={CultureTokens.indigo} /><View style={{ flex: 1 }}><LuxeText variant="bodyMedium" style={{ fontSize: 14 }}>Passkeys (coming soon)</LuxeText><LuxeText variant="caption" style={{ color: colors.textTertiary }}>Secure biometric sign-in with Face ID or Touch ID.</LuxeText></View></GlassView></LuxeCard></View>

          {/* Quick links */}
          <View style={styles.section}><LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, marginLeft: 4 }}>Related</LuxeText><LuxeCard variant="default" style={styles.card}><Pressable onPress={() => router.push('/membership/upgrade' as never)} style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.backgroundSecondary }]}><Ionicons name="card-outline" size={20} color={colors.textSecondary} /><LuxeText variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>Membership & billing</LuxeText><LuxeText variant="caption" style={{ marginRight: 8 }}>{tierLabel}</LuxeText><Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /></Pressable><View style={[styles.divider, { backgroundColor: colors.borderLight }]} /><Pressable onPress={() => router.push('/settings/privacy' as never)} style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.backgroundSecondary }]}><Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} /><LuxeText variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>Privacy & permissions</LuxeText><Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /></Pressable></LuxeCard></View>

          {/* Danger Zone */}
          <View style={styles.section}><LuxeText variant="badgeCaps" style={{ color: colors.error, marginLeft: 4, opacity: 0.8 }}>Danger Zone</LuxeText><LuxeCard variant="default" style={[styles.card, { borderColor: colors.error + '44' }]}><Pressable
                onPress={() => { haptic('warning'); setShowDeleteConfirm(true); }}
                disabled={isAdmin}
                style={({ pressed }) => [styles.dangerRow, pressed && { backgroundColor: colors.error + '11' }]}
              ><View style={{ flex: 1 }}><LuxeText variant="bodyMedium" style={{ color: colors.error }}>Delete Account</LuxeText><LuxeText variant="caption" style={{ color: colors.textTertiary, marginTop: 2 }}>Permanently remove your profile and data.</LuxeText></View><Ionicons name={isAdmin ? 'shield-checkmark' : 'trash-outline'} size={20} color={isAdmin ? colors.textTertiary : colors.error} /></Pressable></LuxeCard></View>

          <LuxeText variant="caption" style={{ textAlign: 'center', color: colors.textTertiary, paddingVertical: 40 }}>Changes use secure authentication and sync across devices.</LuxeText>
        </View>
      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSuccess={() => {}} onFlash={showFlash} /><ChangeEmailModal visible={showEmailModal} currentEmail={user.email} onClose={() => setShowEmailModal(false)} onSuccess={(newEmail) => {
          queryClient.setQueryData(['account-settings-user', user.id], (old: any) => ({ ...old, email: newEmail }));
        }} onFlash={showFlash} />

      {/* Delete Confirmation */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <LuxeCard variant="default" style={styles.deleteCard}><LuxeText variant="title2" style={{ color: colors.error }}>Delete Account?</LuxeText><LuxeText variant="body" style={{ color: colors.textSecondary, marginTop: 12 }}>This is permanent. All events, tickets, and profile data will be lost.</LuxeText>{Platform.OS !== 'web' && (
              <View style={{ marginTop: 20 }}><LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, marginBottom: 8 }}>Type DELETE to confirm</LuxeText><TextInput
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="DELETE"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.deleteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                  autoCapitalize="characters"
                /></View>
            )}<View style={styles.modalActions}><LuxeButton variant="glass" onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} style={{ flex: 1 }}>Cancel</LuxeButton><LuxeButton
                variant="filled"
                onPress={confirmDelete}
                disabled={deleting || (Platform.OS !== 'web' && deleteConfirmText.trim().toUpperCase() !== 'DELETE')}
                loading={deleting}
                style={{ flex: 2, backgroundColor: colors.error }}
              >Delete Permanently</LuxeButton></View></LuxeCard></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  shell: { gap: 24, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  flashBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  section: { gap: 12 },
  card: { padding: 16 },
  saveBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  dividerRow: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginHorizontal: -16, paddingHorizontal: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 32 },
  providersHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  providers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  providerPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  providerText: { fontSize: 13, fontWeight: '500' },
  teaser: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, marginTop: 8 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCardWrap: { width: '100%', maxWidth: 440 },
  modalCard: { padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalBody: { gap: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  deleteCard: { width: '100%', maxWidth: 400, padding: 24 },
  deleteInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 4 },
});
