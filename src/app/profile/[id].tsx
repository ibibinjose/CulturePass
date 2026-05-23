import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Stack, useLocalSearchParams, usePathname, router } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { modulesApi,  ApiError } from '@/modules/api';
import { useAuth } from '@/lib/auth';
import { isAppAdminEmail } from '@/lib/admin';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import { canonicalProfilePath, siteUrl } from '@/lib/publicPaths';
import type { User } from '@/shared/schema';

import { ExtendedProfile } from '@/modules/profile/components/tabs/ProfileUtils';
import { UserPublicProfile } from '@/modules/profile/components/tabs/UserPublicProfile';
import { EntityPublicProfile } from '@/modules/profile/components/tabs/EntityPublicProfile';

/** Edit/follow UI — only the account that owns this resolved profile (not platform admins). */
function viewerOwnsResolvedProfile(profile: ExtendedProfile, viewerUserId: string | null): boolean {
  if (!viewerUserId) return false;
  const et = String(profile.entityType ?? '').toLowerCase();
  if (et === 'user') return viewerUserId === profile.id;
  return Boolean(profile.ownerId && profile.ownerId === viewerUserId);
}

function ProfileDetailScreenInner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const pathname = usePathname();
  const { userId: currentUserId, user: currentUser } = useAuth();

  const { data: profile, isLoading } = useQuery<ExtendedProfile>({
    queryKey: ['/api/profiles-and-users', id as string],
    queryFn: async () => {
      const rawId = String(id ?? '').trim();
      try {
        return await modulesApi.profiles.get(rawId) as ExtendedProfile;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : undefined;
        if (status === 404 || status === 403 || status === 401 || status === 400 || (err instanceof Error && err.message.includes('found'))) {
          let user: User;
          let resolvedViaCpid = false;
          if (/^CP-[A-Z0-9]{6,}$/i.test(rawId)) {
            const lookup = await modulesApi.cpid.lookup(rawId);
            const targetUserId = lookup?.userId ?? lookup?.targetId ?? rawId;
            user = await modulesApi.users.get(targetUserId) as User;
            resolvedViaCpid = true;
          } else {
            user = await modulesApi.users.get(rawId) as User;
          }
          return {
            id: user.id,
            name: user.displayName ?? user.username ?? 'Anonymous',
            entityType: 'user',
            handle: user.handle,
            handleStatus: user.handleStatus,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            city: user.city,
            country: user.country,
            website: user.website,
            socialLinks: (user.socialLinks as Record<string, string>) ?? {},
            interests: user.interests ?? [],
            communities: user.communities ?? [],
            ethnicityText: user.ethnicityText,
            languages: user.languages ?? [],
            cultureIds: user.culturalIdentity?.cultureIds ?? [],
            followersCount: user.followersCount ?? 0,
            connectionsCount: user.connectionsCount ?? 0,
            eventsAttended: user.eventsAttended ?? 0,
            // If we arrived via CPID lookup but the user doc doesn't store it,
            // backfill it so canonicalProfilePath resolves back to the CPID URL
            // and avoids an infinite replace loop on web.
            culturePassId: user.culturePassId ?? (resolvedViaCpid ? rawId.toUpperCase() : undefined),
            isVerified: user.isVerified,
            membership: user.membership ? { tier: user.membership.tier } : undefined,
            privacySettings: user.privacySettings ?? { profileVisible: true, locationVisible: true },
          };
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || isLoading || !profile) return;
    // Only redirect when still on a /profile/ path — don't hijack navigation away from this page.
    if (!pathname.startsWith('/profile/')) return;
    const canonical = canonicalProfilePath(profile);
    if (!canonical) return;
    const cur = pathname.replace(/\/$/, '');
    if (cur !== canonical) {
      router.replace(canonical as never);
    }
  }, [profile, pathname, isLoading]);

  const isAppAdmin = isAppAdminEmail(currentUser?.email);
  const viewerOwnsThisProfile = profile ? viewerOwnsResolvedProfile(profile, currentUserId) : false;
  /** Bypass private-profile gate only (moderation). Never used as “owner” for edit buttons. */
  const canManageProfile = viewerOwnsThisProfile || isAppAdmin;
  const isPrivate = profile?.entityType === 'user' && profile.privacySettings?.profileVisible === false;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      </ErrorBoundary>
    );
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 16, fontFamily: FontFamily.medium, color: colors.textSecondary }}>Profile not found</Text>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15' }}>
            <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>Go Back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  if (isPrivate && !canManageProfile) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="lock-closed" size={40} color={colors.textTertiary} />
          <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: colors.text, textAlign: 'center', marginTop: 16 }}>This profile is private</Text>
          <Text style={{ fontSize: 14, fontFamily: FontFamily.regular, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Only followers can see this user&apos;s details.</Text>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15' }}>
            <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>Go Back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: profile.name ?? 'Profile', headerShown: false }} />
      <Head>
        <title>{`${profile.name} | CulturePass`}</title>
        <meta name="description" content={profile.bio ?? `Discover ${profile.name} on CulturePass.`} />
        <meta property="og:title" content={`${profile.name} | CulturePass`} />
        <meta property="og:description" content={profile.bio ?? `Discover ${profile.name} on CulturePass.`} />
        {profile.avatarUrl && <meta property="og:image" content={profile.avatarUrl} />}
        <meta property="og:url" content={siteUrl(canonicalProfilePath(profile) ?? `/profile/${id}`)} />
        <link rel="canonical" href={siteUrl(canonicalProfilePath(profile) ?? `/profile/${id}`)} />
      </Head>

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {profile.entityType === 'user' ? (
          <UserPublicProfile profile={profile} isOwner={viewerOwnsThisProfile} insets={insets} />
        ) : (
          <EntityPublicProfile profile={profile} isOwner={viewerOwnsThisProfile} insets={insets} colors={colors} />
        )}
      </View>
    </ErrorBoundary>
  );
}

/** Inner tree can be evaluated by Expo web SSR without full root layout; same client as app shell. */
export default function ProfileDetailScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileDetailScreenInner />
    </QueryClientProvider>
  );
}
