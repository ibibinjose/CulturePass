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
import { Button } from '@/design-system/ui/Button';
import { CultureImage, M3Card, M3SectionHeader } from '@/design-system/ui';
import { Input } from '@/design-system/ui/Input';
import { PasswordStrengthIndicator } from '@/design-system/ui/PasswordStrengthIndicator';
import {
  CultureTokens,
  FontFamily,
  Radius,
  ScreenTokens,
  Spacing,
} from '@/design-system/tokens/theme';

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
  if (type === 'selection') void Haptics.selectionAsync();
  else if (type === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

function softColor(hex: string, alpha = '18') {
  return `${hex}${alpha}`;
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
      // Re-authenticate
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);

      // Update password
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
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalCardWrap}>
          <M3Card variant="elevated" style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Input
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                passwordToggle
                secureTextEntry
                containerStyle={{ marginBottom: Spacing.sm }}
              />

              <Input
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                passwordToggle
                secureTextEntry
                containerStyle={{ marginBottom: Spacing.xs }}
              />

              <PasswordStrengthIndicator password={newPassword} />

              <Input
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                passwordToggle
                secureTextEntry
                error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
              />

              {error ? <Text style={[styles.modalError, { color: colors.error }]}>{error}</Text> : null}
            </View>

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={handleClose} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                onPress={handleChange}
                disabled={!canSubmit || loading}
                style={{ flex: 1, backgroundColor: colors.primary }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : 'Update Password'}
              </Button>
            </View>
          </M3Card>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Email Modal (with reauth support)
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
      // Reauth if we have a password provider
      if (needsReauth && currentPassword) {
        const cred = EmailAuthProvider.credential(fbUser.email || user.email || '', currentPassword);
        await reauthenticateWithCredential(fbUser, cred);
      }

      // Update in Firebase Auth (this sends verification email automatically in many cases)
      await updateEmail(fbUser, targetEmail);

      // Best-effort sync to Firestore profile + call the new dedicated secure email change endpoint
      try {
        await updateUserProfile({ email: targetEmail });
        // Use the new backend endpoint for server-side validation + canonical record
        await modulesApi.account.initiateEmailChange(targetEmail);
      } catch {
        // non-fatal — the next profile sync will pick it up
      }

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
      } else if (code.includes('invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalCardWrap}>
          <M3Card variant="elevated" style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Email</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Current: <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>{currentEmail || '—'}</Text>
              </Text>

              <Input
                label="New email address"
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="you@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}
              />

              {needsReauth && (
                <Input
                  label="Current password (for security)"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Confirm your password"
                  passwordToggle
                  secureTextEntry
                />
              )}

              {error ? <Text style={[styles.modalError, { color: colors.error }]}>{error}</Text> : null}

              <Text style={[styles.modalHint, { color: colors.textTertiary }]}>
                After changing, you will receive a verification email at the new address.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={handleClose} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
                style={{ flex: 1, backgroundColor: colors.primary }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : 'Update Email'}
              </Button>
            </View>
          </M3Card>
        </KeyboardAvoidingView>
      </View>
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
  const { user: authUser, logout, sendVerificationEmail, emailVerified, updateUserProfile } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();

  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 28 : insets.bottom + 24;
  const isWide = width >= 900;

  // Fresh server user for authoritative data
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

  // Local editable state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Live username availability
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const debouncedUsername = useDebounce(username, 380);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Inline success / error flash banner (much nicer than repeated Alerts)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFlash = useCallback((type: 'success' | 'error', text: string) => {
    setFlash({ type, text });
    // auto dismiss
    setTimeout(() => setFlash(null), 3400);
  }, []);

  // Sync local form when server data arrives
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || user.handle || '');
      setDirty(false);
    }
  }, [user]);

  // Live username availability check (debounced)
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

      // If user hasn't changed it from their saved value, treat as available (no need to check)
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

  // Identity save mutation (displayName + username/handle)
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
    onSuccess: () => {
      haptic('success');
      showFlash('success', 'Identity saved');
      setDirty(false);
      setSaveError(null);
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

  // Resend verification (uses context helper)
  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      haptic('success');
      Alert.alert('Verification Sent', 'Check your inbox (and spam) for the verification link.');
    } catch {
      Alert.alert('Error', 'Could not send verification email right now.');
    }
  };

  // Linked providers (from Firebase client SDK)
  const linkedProviders = useMemo(() => {
    const fbUser = firebaseAuth?.currentUser;
    if (!fbUser?.providerData?.length) return [{ label: 'Email / Password', icon: 'mail-outline' as const }];
    return fbUser.providerData.map((p) => getProviderLabel(p.providerId));
  }, []);

  // Delete account flow (improved confirmation)
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
      Alert.alert('Delete Failed', 'We could not delete your account. Please contact support.');
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
      >
        <View style={[styles.shell, { maxWidth: isWide ? 860 : 680, alignSelf: 'center', width: '100%' }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: topInset + ScreenTokens.topOffset }]}>
            <Pressable
              onPress={() => goBackOrReplace('/settings')}
              style={({ pressed }) => [
                styles.backCircle,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>SETTINGS</Text>
              <Text style={[styles.title, { color: colors.text }]}>Account</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Identity Hero */}
          <M3Card variant="filled" style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.heroLeft}>
              <View style={[styles.avatar, { backgroundColor: softColor(colors.primary, '22'), overflow: 'hidden' }]}>
                {user.avatarUrl ? (
                  <CultureImage
                    uri={user.avatarUrl}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    recyclingKey={user.id}
                  />
                ) : (
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {(user.displayName || user.username || 'U')[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>
                  {user.displayName || 'CulturePass Member'}
                </Text>
                <Text style={[styles.heroHandle, { color: colors.textSecondary }]}>{formatHandle(user.handle || user.username)}</Text>
                {user.culturePassId && (
                  <Text style={[styles.heroId, { color: colors.textTertiary }]}>ID: {user.culturePassId}</Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/profile/edit' as never)}
              style={({ pressed }) => [styles.heroEdit, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontFamily: FontFamily.semibold, fontSize: 13, marginLeft: 6 }}>
                Edit profile
              </Text>
            </Pressable>
          </M3Card>

          {/* Flash success / error banner (replaces noisy Alerts) */}
          {flash ? (
            <View
              style={[
                styles.flashBanner,
                {
                  backgroundColor: flash.type === 'success'
                    ? CultureTokens.teal + '22'
                    : CultureTokens.coral + '22',
                  borderColor: flash.type === 'success'
                    ? CultureTokens.teal + '55'
                    : CultureTokens.coral + '55',
                },
              ]}
            >
              <Ionicons
                name={flash.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={flash.type === 'success' ? CultureTokens.teal : CultureTokens.coral}
              />
              <Text style={[styles.flashBannerText, { color: colors.text }]}>{flash.text}</Text>
            </View>
          ) : null}

          {/* Identity */}
          <View style={styles.section}>
            <M3SectionHeader title="Identity" />
            <M3Card variant="filled" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.formRow}>
                <Input
                  label="Display name"
                  value={displayName}
                  onChangeText={(v) => handleFieldChange('displayName', v)}
                  placeholder="Your public name"
                  maxLength={60}
                />
              </View>
              <View style={styles.formRow}>
                <Input
                  label="Username / handle"
                  value={username}
                  onChangeText={(v) => handleFieldChange('username', v.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                  placeholder="unique_handle"
                  maxLength={30}
                  leftIcon="at"
                  hint={usernameStatus === 'idle' ? 'Lowercase letters, numbers, _ . -' : undefined}
                  error={usernameStatus === 'taken' || usernameStatus === 'invalid' ? usernameMessage : undefined}
                />

                {/* Live availability indicator */}
                {((usernameStatus !== 'idle') || Boolean(usernameMessage)) && (
                  <View style={styles.usernameStatusRow}>
                    {usernameStatus === 'checking' && (
                      <ActivityIndicator size="small" color={colors.textTertiary} />
                    )}
                    {usernameStatus === 'available' && (
                      <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
                    )}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                      <Ionicons name="close-circle" size={16} color={colors.error} />
                    )}
                    <Text
                      style={[
                        styles.usernameStatusText,
                        {
                          color:
                            usernameStatus === 'available'
                              ? CultureTokens.teal
                              : usernameStatus === 'taken' || usernameStatus === 'invalid'
                                ? colors.error
                                : colors.textTertiary,
                        },
                      ]}
                    >
                      {usernameMessage}
                    </Text>
                  </View>
                )}
              </View>

              {saveError ? <Text style={[styles.errorText, { color: colors.error }]}>{saveError}</Text> : null}

              <View style={styles.saveBar}>
                <Button
                  onPress={() => saveIdentity.mutate()}
                  disabled={
                    !dirty ||
                    saveIdentity.isPending ||
                    usernameStatus === 'taken' ||
                    usernameStatus === 'invalid'
                  }
                  style={{ minWidth: 140, backgroundColor: dirty ? colors.primary : colors.border }}
                >
                  {saveIdentity.isPending ? <ActivityIndicator color="#fff" size="small" /> : 'Save Identity'}
                </Button>
                {dirty && <Text style={[styles.dirtyHint, { color: colors.textTertiary }]}>Unsaved changes</Text>}
              </View>
            </M3Card>
          </View>

          {/* Contact & Verification */}
          <View style={styles.section}>
            <M3SectionHeader title="Contact & Access" />
            <M3Card variant="filled" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Email</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
                    {user.email || '—'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {emailVerified ? (
                    <View style={[styles.badge, { backgroundColor: softColor(colors.success, '20') }]}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={[styles.badgeText, { color: colors.success }]}>Verified</Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: softColor(colors.warning, '20') }]}>
                      <Text style={[styles.badgeText, { color: colors.warning }]}>Unverified</Text>
                    </View>
                  )}
                  <Pressable onPress={() => setShowEmailModal(true)} style={styles.rowAction}>
                    <Text style={{ color: colors.primary, fontFamily: FontFamily.semibold, fontSize: 14 }}>Change</Text>
                  </Pressable>
                </View>
              </View>

              {!emailVerified && (
                <Pressable onPress={handleResendVerification} style={styles.resendRow}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, marginLeft: 8, fontFamily: FontFamily.semibold }}>Resend verification email</Text>
                </Pressable>
              )}

              {!!user.phone && (
                <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, marginTop: Spacing.sm, paddingTop: Spacing.sm }]}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Phone</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{user.phone}</Text>
                </View>
              )}
            </M3Card>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <M3SectionHeader title="Security" />
            <M3Card variant="filled" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Password */}
              <Pressable
                onPress={() => { haptic(); setShowPasswordModal(true); }}
                style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: colors.surfaceElevated }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="key-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionLabel, { color: colors.text }]}>Change password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              {/* Linked sign-in */}
              <View style={[styles.actionRow, { paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionLabel, { color: colors.text }]}>Sign-in methods</Text>
                </View>
              </View>
              <View style={styles.providers}>
                {linkedProviders.map((p, idx) => (
                  <View key={idx} style={[styles.providerPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name={p.icon} size={15} color={colors.textSecondary} />
                    <Text style={[styles.providerText, { color: colors.textSecondary }]}>{p.label}</Text>
                  </View>
                ))}
              </View>

              {/* Passkeys teaser */}
              <View style={[styles.teaser, { backgroundColor: softColor(CultureTokens.indigo, '08'), borderColor: softColor(CultureTokens.indigo, '30') }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="finger-print-outline" size={22} color={CultureTokens.indigo} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teaserTitle, { color: colors.text }]}>Passkeys (coming soon)</Text>
                    <Text style={[styles.teaserSub, { color: colors.textTertiary }]}>
                      Passwordless sign-in with Face ID, Touch ID or hardware keys.
                    </Text>
                  </View>
                </View>
              </View>
            </M3Card>
          </View>

          {/* Quick links */}
          <View style={styles.section}>
            <M3SectionHeader title="Related" />
            <M3Card variant="filled" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, overflow: 'hidden' }]}>
              <Pressable onPress={() => router.push('/membership/upgrade' as never)} style={styles.linkRow}>
                <Text style={[styles.linkLabel, { color: colors.text }]}>Membership &amp; billing</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{tierLabel}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </View>
              </Pressable>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <Pressable onPress={() => router.push('/settings/privacy' as never)} style={styles.linkRow}>
                <Text style={[styles.linkLabel, { color: colors.text }]}>Privacy &amp; permissions</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            </M3Card>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <M3SectionHeader title="Danger Zone" />
            <M3Card variant="outlined" style={[styles.card, { borderColor: softColor(colors.error, '40'), backgroundColor: colors.card }]}>
              {!isAdmin ? (
                <Pressable
                  onPress={() => { haptic('warning'); setShowDeleteConfirm(true); }}
                  style={({ pressed }) => [styles.dangerRow, pressed && { backgroundColor: softColor(colors.error, '08') }]}
                >
                  <View>
                    <Text style={[styles.dangerLabel, { color: colors.error }]}>Delete Account</Text>
                    <Text style={[styles.dangerSub, { color: colors.textTertiary }]}>Permanently removes your profile, tickets, communities, and data.</Text>
                  </View>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              ) : (
                <View style={styles.dangerRow}>
                  <View>
                    <Text style={[styles.dangerLabel, { color: colors.textSecondary }]}>Delete Account</Text>
                    <Text style={[styles.dangerSub, { color: colors.textTertiary }]}>
                      Administrator accounts cannot be deleted through self-service. Please contact a platform super admin.
                    </Text>
                  </View>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textTertiary} />
                </View>
              )}
            </M3Card>
          </View>

          <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
            Changes to email and password use secure Firebase authentication and are synced across devices.
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {}}
        onFlash={showFlash}
      />
      <ChangeEmailModal
        visible={showEmailModal}
        currentEmail={user.email}
        onClose={() => setShowEmailModal(false)}
        onSuccess={(newEmail) => {
          // optimistic update in local cache
          queryClient.setQueryData(['account-settings-user', user.id], (old: any) => ({ ...old, email: newEmail }));
        }}
        onFlash={showFlash}
      />

      {/* Delete confirmation modal (native-friendly) */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
          <M3Card variant="elevated" style={[styles.deleteCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.deleteTitle, { color: colors.error }]}>Delete your CulturePass account?</Text>
            <Text style={[styles.deleteBody, { color: colors.textSecondary }]}>
              This action is permanent. All events you host, tickets, memberships, saved communities, and profile data will be removed.
            </Text>

            {Platform.OS !== 'web' && (
              <View style={{ marginTop: Spacing.md }}>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Type DELETE to confirm</Text>
                <TextInput
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="DELETE"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.deleteInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.background }]}
                  autoCapitalize="characters"
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                onPress={confirmDelete}
                disabled={deleting || (Platform.OS !== 'web' && deleteConfirmText.trim().toUpperCase() !== 'DELETE')}
                style={{ flex: 1, backgroundColor: colors.error }}
              >
                {deleting ? <ActivityIndicator color="#fff" /> : 'Permanently Delete'}
              </Button>
            </View>
          </M3Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  shell: { gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: Spacing.sm },
  backCircle: { width: 44, height: 44, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 26, lineHeight: 32, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.md },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 24, fontFamily: FontFamily.bold },
  heroName: { fontSize: 18, fontFamily: FontFamily.bold },
  heroHandle: { fontSize: 14, fontFamily: FontFamily.medium, marginTop: 1 },
  heroId: { fontSize: 11, fontFamily: FontFamily.regular, marginTop: 3, opacity: 0.7 },
  heroEdit: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: softColor(CultureTokens.indigo, '12') },
  section: { gap: Spacing.xs },
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  formRow: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  saveBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  dirtyHint: { fontSize: 12, fontFamily: FontFamily.regular },
  errorText: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  rowLabel: { fontSize: 13, fontFamily: FontFamily.medium, color: '#666' },
  rowValue: { fontSize: 15, fontFamily: FontFamily.regular, marginTop: 2 },
  rowAction: { paddingHorizontal: 10, paddingVertical: 4 },
  resendRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  actionLabel: { fontSize: 15, fontFamily: FontFamily.semibold },
  providers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.md, paddingBottom: 16 },
  providerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  providerText: { fontSize: 12, fontFamily: FontFamily.medium },
  teaser: { margin: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  teaserTitle: { fontSize: 14, fontFamily: FontFamily.semibold },
  teaserSub: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 16 },
  linkLabel: { fontSize: 15, fontFamily: FontFamily.semibold },
  dangerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  dangerLabel: { fontSize: 15, fontFamily: FontFamily.semibold },
  dangerSub: { fontSize: 12, marginTop: 2, maxWidth: '88%' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.md },
  footerNote: { fontSize: 12, textAlign: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCardWrap: { width: '100%', maxWidth: 420 },
  modalCard: { borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  modalTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  modalSub: { fontSize: 14 },
  modalBody: { paddingVertical: Spacing.sm },
  modalHint: { fontSize: 12, marginTop: Spacing.sm, lineHeight: 16 },
  modalError: { marginTop: Spacing.sm, fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  deleteCard: { width: '100%', maxWidth: 380, padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  deleteTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  deleteBody: { fontSize: 14, lineHeight: 20, marginTop: Spacing.sm },
  deleteInput: { borderWidth: 1.5, borderRadius: Radius.md, padding: 12, fontSize: 16, fontFamily: FontFamily.bold, letterSpacing: 2 },

  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  flashBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },

  usernameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  usernameStatusText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
});
