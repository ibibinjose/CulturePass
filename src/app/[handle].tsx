/**
 * Public path resolver — catches bare handles like /ibibinjose , /CP-xxx , +@ etc.
 * Uses getByHandle (new public /users/handle backend) + cpid, then redirects to canonical public URL (/cpu/seg or bare vanity).
 * /cpu/ alias route (delegating to renderer) + effect ensure /cpu/username (and CPID) "just work" at correct URL with business-card profile image in og: share metadata + security logging.
 */
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { modulesApi } from '@/modules/api';
import { canonicalUserPath } from '@/lib/publicPaths';

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
            // Use canonical (will be /cpu/CP-... ) -- lands directly on preferred public /cpu/ URL (delegation + effect ensure no spinner bounce, correct metadata)
            const targetPath = canonicalUserPath({ id: target, culturePassId: normalized } as any);
            router.replace(targetPath as never);
            return;
          }
        }

        // Try user first (by handle)
        const user = await modulesApi.users.getByHandle(handle).catch(() => null);
        if (!cancelled && user?.id) {
          // Use canonicalUserPath (/cpu/seg for branded, including /cpu/username) -- clean public URL + og:image (profile pic as business card) + security
          router.replace( canonicalUserPath(user) as never );
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

        // User public profiles (including /cpu/username) now resolve via canonical + delegation; see user/[id].tsx for business-card og:image + security updates.
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
