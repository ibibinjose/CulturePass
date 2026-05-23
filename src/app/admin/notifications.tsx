/**
 * Admin — Targeted push campaigns
 * ================================
 * Dry-run audience preview and optional live send via existing notifications API.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';
import { Input } from '@/design-system/ui/Input';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminNotificationsScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lastPreview, setLastPreview] = useState<string>('');

  const targeted = useMutation({
    mutationFn: (dryRun: boolean) =>
      api.notifications.targeted({
        title: title.trim(),
        message: message.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        dryRun,
        limit: 50,
      }),
    onSuccess: (data, dryRun) => {
      const n = data.targetedCount ?? 0;
      const lines =
        data.audiencePreview?.map((u) => `• ${u.userId.slice(0, 8)}… ${u.city ?? ''} ${u.country ?? ''}`).join('\n') ??
        '';
      setLastPreview(`Matched ${n} users.\n${lines}`);
      if (dryRun) {
        Alert.alert('Dry run', `Would target ${n} users.`);
      } else {
        Alert.alert('Sent', `Notification queued for ${n} users.`);
      }
    },
    onError: (e: Error) => Alert.alert('Failed', e.message ?? 'Request error'),
  });

  const canSend = title.trim().length > 2 && message.trim().length > 5;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: hPad, backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Campaign push</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Always run a dry run first. Live sends require the notifications approval flow when configured on the backend.
      </Text>

      <GlassView contentStyle={{ padding: 20, gap: 16, marginTop: 20 }}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Sydney weekend picks" />
        <Input
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Short body — keep under ~180 characters for best delivery"
          multiline
        />
        <Input label="City filter (optional)" value={city} onChangeText={setCity} placeholder="e.g. Sydney" />
        <Input label="Country filter (optional)" value={country} onChangeText={setCountry} placeholder="e.g. AU" />
        <View style={styles.row}>
          <M3Button
            variant="tonal"
            style={{ flex: 1 }}
            disabled={!canSend || targeted.isPending}
            onPress={() => targeted.mutate(true)}
          >
            Dry run
          </M3Button>
          <M3Button
            variant="filled"
            style={{ flex: 1 }}
            disabled={!canSend || targeted.isPending}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (typeof globalThis !== 'undefined' && typeof (globalThis as { confirm?: (m: string) => boolean }).confirm === 'function') {
                  const ok = (globalThis as { confirm: (m: string) => boolean }).confirm('Send live push to matched users?');
                  if (ok) targeted.mutate(false);
                }
              } else {
                Alert.alert('Send live?', 'This will enqueue a real push for matched users.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Send', style: 'destructive', onPress: () => targeted.mutate(false) },
                ]);
              }
            }}
          >
            Send live
          </M3Button>
        </View>
      </GlassView>

      {lastPreview ? (
        <GlassView contentStyle={{ padding: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 12, fontFamily: FontFamily.medium, color: colors.textSecondary }}>{lastPreview}</Text>
        </GlassView>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 28, gap: 8 },
  title: { fontSize: 28, fontFamily: FontFamily.bold },
  sub: { fontSize: 14, fontFamily: FontFamily.medium, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
});
