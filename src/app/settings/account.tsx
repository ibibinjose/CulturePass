import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { goBackOrReplace } from '@/lib/navigation';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius, ScreenTokens, Spacing } from '@/design-system/tokens/theme';

type RowProps = {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
};

function Row({ label, value, icon, onPress, destructive, isLast }: RowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface },
        pressed && { backgroundColor: colors.backgroundSecondary },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
    >
      <Text style={[styles.rowLabel, { color: destructive ? colors.error : colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.textTertiary }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {icon ? <Ionicons name={icon} size={18} color={colors.textTertiary} /> : null}
      </View>
      {!isLast ? <View style={[styles.divider, { backgroundColor: colors.borderLight }]} /> : null}
    </Pressable>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      {title ? <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text> : null}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>{children}</View>
    </View>
  );
}

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, logout } = useAuth();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 24 : insets.bottom;

  const username = user?.username || user?.handle || '';
  const formattedUsername = username ? `@${String(username).replace(/^@/, '')}` : '-';
  const email = user?.email || '-';
  const phone = user?.phone || '-';

  const editUnavailable = (field: string) => {
    Alert.alert(field, `${field} editing will be available from the account security flow.`);
  };

  const deleteAccount = () => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account',
      'This is permanent and cannot be undone. All profile data, tickets, and saved items will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            await modulesApi.account.delete(user.id);
            await logout();
            router.replace('/(onboarding)/login');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 120 }]}
      >
        <View style={[styles.header, { paddingTop: topInset + ScreenTokens.topOffset }]}>
          <Pressable
            onPress={() => goBackOrReplace('/settings')}
            style={({ pressed }) => [styles.backCircle, { backgroundColor: colors.surface, borderColor: colors.borderLight }, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Account Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Section title="Basic Info">
            <Row label="Email" value={email} icon="chevron-forward" onPress={() => editUnavailable('Email')} />
            <Row label="Phone Number" value={phone} icon="create-outline" onPress={() => editUnavailable('Phone Number')} />
            <Row label="Username" value={formattedUsername} icon="create-outline" onPress={() => editUnavailable('Username')} isLast />
          </Section>

          <Section title="Security">
            <Row label="Passkeys" value="1" icon="chevron-forward" onPress={() => editUnavailable('Passkeys')} isLast />
          </Section>

          <Section title="Crypto Identities">
            <Row label="Ethereum Address" value="-" />
            <Row label="Solana Address" value="-" isLast />
            <Text style={[styles.helper, { color: colors.textTertiary }]}>
              We do not support linking crypto wallets in-app at this time.{'\n'}You can do so on the website.
            </Text>
          </Section>

          <Section>
            <Row label="Delete Account" destructive onPress={deleteAccount} isLast />
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    minHeight: 92,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.bold, letterSpacing: 0 },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.9,
    paddingLeft: Spacing.xs,
    textTransform: 'uppercase',
  },
  card: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  rowLabel: { fontSize: 15, lineHeight: 21, fontFamily: FontFamily.semibold, letterSpacing: 0 },
  rowRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 },
  rowValue: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontFamily: FontFamily.regular, letterSpacing: 0 },
  divider: { position: 'absolute', left: Spacing.md, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  helper: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
