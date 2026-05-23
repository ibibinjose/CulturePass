import { View, Text, StyleSheet, ScrollView, Platform, Switch, Alert, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { modulesApi } from '@/modules/api';
import { CultureTokens, FontFamily, ScreenTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { goBackOrReplace } from '@/lib/navigation';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Button } from '@/design-system/ui/Button';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const PRIVACY_SETTINGS = [
  { key: 'profileVisibility', title: 'Profile Visibility', description: 'Your profile is public and visible to all users. Disable to make it private.', icon: 'eye' as const, color: CultureTokens.teal },
  { key: 'dataSharing',       title: 'Data Sharing',       description: 'Allow CulturePass to use anonymised usage data to improve the platform.', icon: 'analytics' as const, color: (colors: any) => colors.primary },
  { key: 'activityStatus',    title: 'Activity Status',    description: 'Show other users when you are online or recently active.', icon: 'pulse' as const, color: CultureTokens.gold },
  { key: 'showLocation',      title: 'Show Location',      description: 'Display your city and country on your public profile.', icon: 'location' as const, color: CultureTokens.coral },
];

interface PrivacySettings {
  profileVisibility: boolean;
  dataSharing: boolean;
  activityStatus: boolean;
  showLocation: boolean;
}

function PrivacySettingIcon({
  icon,
  color,
}: {
  icon: 'eye' | 'analytics' | 'pulse' | 'location';
  color: string;
}) {
  if (icon === 'eye') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M2 10 C4.2 6.6 6.8 5 10 5 C13.2 5 15.8 6.6 18 10 C15.8 13.4 13.2 15 10 15 C6.8 15 4.2 13.4 2 10 Z" stroke={color} strokeWidth={1.8} fill="none" />
        <Circle cx={10} cy={10} r={2.4} fill={color} />
      </Svg>
    );
  }
  if (icon === 'analytics') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Line x1={4} y1={16} x2={4} y2={10} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1={10} y1={16} x2={10} y2={7} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1={16} y1={16} x2={16} y2={4} stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  if (icon === 'pulse') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M2 11 H6 L8.2 7 L11 13 L13 9.5 H18" stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 3.2 C12.8 3.2 15 5.4 15 8.2 C15 12 10 16.8 10 16.8 C10 16.8 5 12 5 8.2 C5 5.4 7.2 3.2 10 3.2 Z" stroke={color} strokeWidth={1.8} fill="none" />
      <Circle cx={10} cy={8.2} r={1.8} fill={color} />
    </Svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 20 20">
      <Path d="M4.5 6 H15.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8 3.8 H12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M6.2 6 L7 15.3 C7.1 16.1 7.7 16.7 8.5 16.7 H11.5 C12.3 16.7 12.9 16.1 13 15.3 L13.8 6" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={8.7} y1={8.3} x2={8.7} y2={14} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={11.3} y1={8.3} x2={11.3} y2={14} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function PrivacySettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/privacy/settings', userId],
    enabled: !!userId,
    queryFn: (): Promise<PrivacySettings> => modulesApi.privacy.get() as Promise<PrivacySettings>,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<PrivacySettings>) => modulesApi.privacy.update(updates),
    onSuccess: (data) => { queryClient.setQueryData(['/api/privacy/settings', userId], data); },
  });

  const deleteMutation = useMutation({
    mutationFn: (_password: string) => {
      if (!userId) {
        throw new Error('Missing user session.');
      }
      return modulesApi.account.delete(userId);
    },
    onSuccess: () => { logout(); router.replace('/(onboarding)'); },
    onError: (e: Error) => { setDeleteError(e.message); },
  });

  const toggleSetting = (key: string) => {
    if (!settings) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !settings[key as keyof PrivacySettings];
    updateMutation.mutate({ [key]: newValue });
    queryClient.setQueryData(['/api/privacy/settings', userId], { ...settings, [key]: newValue });
  };

  const handleDeleteAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    // Web preview reliability: open the in-page confirmation card directly.
    if (Platform.OS === 'web') {
      setDeletePassword('');
      setDeleteError('');
      setShowDeleteConfirm(true);
      return;
    }
    Alert.alert(
      'Delete Account',
      'This is permanent and cannot be undone. All your data, tickets, and wallet balance will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => { setDeletePassword(''); setDeleteError(''); setShowDeleteConfirm(true); } },
      ]
    );
  };

  const handleConfirmDelete = () => {
    if (!deletePassword.trim()) { setDeleteError('Please enter your password to confirm.'); return; }
    deleteMutation.mutate(deletePassword);
  };

  const current: PrivacySettings = settings ?? { profileVisibility: true, dataSharing: false, activityStatus: true, showLocation: true };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: topInset + ScreenTokens.topOffset, borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => goBackOrReplace('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={{ width: 26, height: 26, borderRadius: 13 }}
              contentFit="contain"
            />
            <Text style={[styles.headerTitleText, { color: colors.text }]}>Privacy</Text>
          </View>
          <View style={{ width: 64 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: ScreenTokens.topOffset }}
      >
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>PRIVACY PREFERENCES</Text>
            <GlassView contentStyle={{ padding: 4 }}>
              {isLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                PRIVACY_SETTINGS.map((item, i) => {
                    const resolvedColor = typeof item.color === 'function' ? item.color(colors) : item.color;
                    return (
                        <View key={item.key}>
                            <View style={styles.settingRow}>
                            <View style={[styles.settingIcon, { backgroundColor: resolvedColor + '12' }]}>
                                <PrivacySettingIcon icon={item.icon} color={resolvedColor} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.settingDesc, { color: colors.textTertiary }]} numberOfLines={2}>{item.description}</Text>
                            </View>
                            <Switch
                                value={current[item.key as keyof PrivacySettings]}
                                onValueChange={() => toggleSetting(item.key)}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor={colors.border}
                            />
                            </View>
                            {item.key === 'profileVisibility' && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                                <View style={[styles.statusDot, { backgroundColor: current.profileVisibility ? CultureTokens.teal : colors.textTertiary }]} />
                                <Text style={[styles.statusText, { color: colors.textSecondary }]}>{current.profileVisibility ? 'Public' : 'Private'}</Text>
                            </View>
                            )}
                            {i < PRIVACY_SETTINGS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                        </View>
                    );
                })
              )}
            </GlassView>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: CultureTokens.coral }]}>DANGER ZONE</Text>
            {showDeleteConfirm ? (
                <GlassView style={styles.deleteConfirmCard} contentStyle={{ padding: 24, gap: 16 }}>
                    <Text style={[styles.deleteConfirmTitle, { color: CultureTokens.coral }]}>Confirm Account Deletion</Text>
                    <Text style={[styles.deleteConfirmDesc, { color: colors.textSecondary }]}>
                        All your data, tickets, and wallet balance will be lost forever. Enter your password to proceed.
                    </Text>
                    <TextInput
                        style={[styles.passwordInput, { backgroundColor: colors.primarySoft, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry
                        value={deletePassword}
                        onChangeText={(v) => { setDeletePassword(v); setDeleteError(''); }}
                        autoCapitalize="none"
                    />
                    {deleteError ? <Text style={[styles.deleteError, { color: CultureTokens.coral }]}>{deleteError}</Text> : null}
                    <View style={styles.deleteConfirmRow}>
                        <Button
                            variant="outline"
                            style={{ flex: 1 }}
                            onPress={() => setShowDeleteConfirm(false)}
                            labelStyle={{ color: colors.textSecondary }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            style={{ flex: 1.5 }}
                            onPress={handleConfirmDelete}
                            loading={deleteMutation.isPending}
                        >
                            Delete Forever
                        </Button>
                    </View>
                </GlassView>
            ) : (
                <Pressable
                    onPress={handleDeleteAccount}
                    accessibilityRole="button"
                    accessibilityLabel="Delete my account"
                    style={({ pressed }) => [
                      styles.deleteDangerBtn,
                      {
                        borderColor: CultureTokens.coral + '40',
                        backgroundColor: CultureTokens.coral + '08',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.deleteDangerContent}>
                      <TrashIcon color={CultureTokens.coral} />
                      <Text style={[styles.deleteDangerText, { color: CultureTokens.coral }]}>Delete My Account</Text>
                    </View>
                </Pressable>
            )}
            <Text style={[styles.dangerNote, { color: colors.textTertiary }]}>
                Permanently deletes your identity, event history, and all stored data on CulturePass.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarInner: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  header: {
    paddingBottom: 12,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.5, opacity: 0.8 },
  backBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  contentShell: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
  settingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold },
  settingDesc: { fontSize: 12, fontFamily: FontFamily.regular, width: '85%' },
  divider: { height: 1, marginLeft: 76 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 76,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.5 },

  dangerNote: { fontSize: 13, marginTop: 16, lineHeight: 18, textAlign: 'center', paddingHorizontal: 20, fontFamily: FontFamily.medium },

  deleteConfirmCard: { marginBottom: 12 },
  deleteDangerBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  deleteDangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteDangerText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  deleteConfirmTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  deleteConfirmDesc: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20 },
  passwordInput: { fontSize: 15, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5 },
  deleteError: { fontSize: 12, fontFamily: FontFamily.semibold },
  deleteConfirmRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
