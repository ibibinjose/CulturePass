/**
 * Public path resolver — catches paths like /CP-U58B35B, /jiobaba or /+jiobaba.
 * CPID first, then handle lookup, then profile lookup.
 */
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { modulesApi } from '@/modules/api';
import { userPublicSegment } from '@/lib/publicPaths';

export default function HandleResolverScreen() {
  const colors = useColors();
  const { handle: rawHandle } = useLocalSearchParams<{ handle: string }>();

  // Strip leading '+' and '@' if someone types them directly in the URL.
  const handle = typeof rawHandle === 'string' ? rawHandle.replace(/^[+@]/, '') : '';

  useEffect(() => {
    if (!handle) {
      router.replace('/(tabs)');
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        const normalized = handle.trim().toUpperCase();
        if (/^CP-[A-Z0-9]{6,}$/.test(normalized)) {
          const hit = await modulesApi.cpid.lookup(normalized).catch(() => null);
          const target = hit?.userId ?? hit?.targetId;
          if (!cancelled && target) {
            router.replace({ pathname: '/u/[id]', params: { id: normalized } });
            return;
          }
        }

        // Try user first
        const user = await modulesApi.users.getByHandle(handle).catch(() => null);
        if (!cancelled && user?.id) {
          router.replace({ pathname: '/u/[id]', params: { id: userPublicSegment(user) } });
          return;
        }

        // Try profile (business / community / venue)
        const profileResult = await modulesApi.profiles.list({ search: handle, pageSize: 1 }).catch(() => null);
        const profile = (profileResult as any)?.profiles?.[0] ?? (Array.isArray(profileResult) ? profileResult[0] : null);
        if (!cancelled && profile?.id) {
          router.replace({ pathname: '/profile/[id]', params: { id: profile.id } });
          return;
        }

        // Not found — go home
        if (!cancelled) router.replace('/(tabs)');
      } catch {
        if (!cancelled) router.replace('/(tabs)');
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [handle]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>+{handle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
});
