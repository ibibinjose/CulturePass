/**
 * Curate Daily Deals for CultureShop (moderators or approved publishers).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, ApiError } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { BackButton } from '@/design-system/ui/BackButton';
import { Button } from '@/design-system/ui/Button';
import {
  CultureTokens,
  FontFamily,
  InputTokens,
  Radius,
  Spacing,
  TextStyles,
} from '@/design-system/tokens/theme';

export default function CultureShopManageScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors = useColors();
  const { hPad } = useLayout();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [href, setHref] = useState('/offers');
  const [kind, setKind] = useState<'reward' | 'offer' | 'featured'>('offer');
  const [linkPolicy, setLinkPolicy] = useState<'public' | 'premium_required'>('public');
  const [busy, setBusy] = useState(false);

  const startIso = new Date();
  startIso.setHours(0, 0, 0, 0);
  const endIso = new Date(startIso);
  endIso.setDate(endIso.getDate() + 7);

  const [startsAt] = useState(startIso.toISOString());
  const [endsAt] = useState(endIso.toISOString());

  const submit = async () => {
    const t = title.trim();
    if (t.length < 2) {
      Alert.alert('Title required', 'Add a short title for the deal.');
      return;
    }
    const path = href.trim();
    if (!path.startsWith('/')) {
      Alert.alert('Invalid link', 'Use an app path starting with / (e.g. /offers or /payment/wallet).');
      return;
    }
    setBusy(true);
    try {
      await api.cultureShop.createDailyDeal({
        title: t,
        subtitle: subtitle.trim() || null,
        href: path,
        kind,
        linkPolicy,
        startsAt,
        endsAt,
        status: 'active',
        priority: 10,
      });
      Alert.alert('Published', 'Daily deal is live for the current window.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save';
      Alert.alert('Save failed', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <BackButton fallback="/CultureShop" color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>New Daily Deal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: insets.bottom + 24, gap: Spacing.md }}>
        <Text style={[styles.help, { color: colors.textSecondary }]}>
          Visible to everyone on CultureShop. Set Plus-only to show the destination but keep navigation gated until upgrade.
        </Text>

        <Field label="Title" colors={colors}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Double points weekend"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
          />
        </Field>

        <Field label="Subtitle (optional)" colors={colors}>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="Shown under the title"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
          />
        </Field>

        <Field label="Destination path" colors={colors}>
          <TextInput
            value={href}
            onChangeText={setHref}
            placeholder="/payment/wallet or /offers"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
          />
        </Field>

        <View style={styles.row}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Kind</Text>
          <View style={styles.chips}>
            {(['reward', 'offer', 'featured'] as const).map((k) => (
              <Button
                key={k}
                variant={kind === k ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setKind(k)}
              >
                {k}
              </Button>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Link policy</Text>
          <View style={styles.chips}>
            <Button
              variant={linkPolicy === 'public' ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setLinkPolicy('public')}
            >
              Everyone
            </Button>
            <Button
              variant={linkPolicy === 'premium_required' ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setLinkPolicy('premium_required')}
            >
              Plus only
            </Button>
          </View>
        </View>

        <Text style={[styles.windowHint, { color: colors.textTertiary }]}>
          Active window: {new Date(startsAt).toLocaleDateString()} → {new Date(endsAt).toLocaleDateString()} (defaults —
          adjust via Firestore or extend this form later).
        </Text>

        <Button
          variant="gradient"
          onPress={submit}
          disabled={busy}
          leftIcon={busy ? undefined : 'rocket-outline'}
        >
          {busy ? 'Publishing…' : 'Publish deal'}
        </Button>
        {busy ? <ActivityIndicator color={CultureTokens.violet} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  title: {
    ...TextStyles.title,
    fontFamily: FontFamily.semibold,
    flex: 1,
    textAlign: 'center',
  },
  help: {
    ...TextStyles.body,
    marginBottom: 8,
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: InputTokens.height,
    fontSize: 16,
  },
  row: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  windowHint: { fontSize: 12, lineHeight: 18 },
});
