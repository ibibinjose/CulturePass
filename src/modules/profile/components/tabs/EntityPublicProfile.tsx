import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, M3Typography, Radius, FontFamily } from '@/design-system/tokens/theme';
import { profileApi } from '@/modules/profile/api';
import { useAuth } from '@/lib/auth';
import { useM3Colors } from '@/hooks/useM3Colors';
import { goBackOrReplace } from '@/lib/navigation';
import { M3TopAppBar, M3Button, M3Card, M3FilterChip, M3SectionHeader } from '@/design-system/ui';

import type { EventData } from '@/shared/schema';
import { RecoRow } from './ProfileComponents';
import { fmt, openLink, pickHostedEvents, type ExtendedProfile } from './ProfileUtils';
import { EventRailCard } from '@/modules/profile/components/private/ProfileRailCards';
import { api } from '@/lib/api';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { TeamManagementModal } from '../TeamManagementModal';

const SOCIAL_ICONS_LEGACY = [
  { key: 'facebook', icon: 'logo-facebook' as const, color: '#FFFFFF' },
  { key: 'instagram', icon: 'logo-instagram' as const, color: '#FFFFFF' },
  { key: 'twitter', icon: 'logo-twitter' as const, color: '#FFFFFF' },
  { key: 'linkedin', icon: 'logo-linkedin' as const, color: '#FFFFFF' },
  { key: 'youtube', icon: 'logo-youtube' as const, color: '#FFFFFF' },
  { key: 'tiktok', icon: 'logo-tiktok' as const, color: '#FFFFFF' },
];

const ENTITY_HOSTED_TYPES = new Set([
  'business', 'artist', 'venue', 'restaurant', 'organisation', 'organizer', 'community', 'brand', 'creator', 'charity',
]);

interface EntityPublicProfileProps {
  profile: ExtendedProfile;
  isOwner: boolean;
  insets: { top: number; bottom: number };
  colors: any;
}

export function EntityPublicProfile({ profile, isOwner, insets, colors }: EntityPublicProfileProps) {
  const { isDesktop, contentWidth, hPad, windowSizeClass } = useLayout();
  const m3Colors = useM3Colors();
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'community' | 'media' | 'about'>('feed');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const isExpanded = windowSizeClass === 'expanded';
  const showHostedEvents = ENTITY_HOSTED_TYPES.has(String(profile.entityType ?? '').toLowerCase());

  const { data: entityHostedResp } = useQuery({
    queryKey: ['profile', 'entity-hosted-events', profile.id, profile.ownerId],
    queryFn: async () => {
      const ownerKey = profile.ownerId;
      const byPub = await profileApi.events.list({ publisherProfileId: profile.id, pageSize: 40, page: 1 });
      const byOrg = ownerKey ? await profileApi.events.list({ organizerId: ownerKey, pageSize: 40, page: 1 }) : { events: [] as EventData[] };
      const map = new Map<string, EventData>();
      for (const e of [...(byPub.events ?? []), ...(byOrg.events ?? [])]) {
        const matchPub = e.publisherProfileId === profile.id;
        const matchLegacy = !e.publisherProfileId && ownerKey && e.organizerId === ownerKey;
        if (matchPub || matchLegacy) map.set(e.id, e);
      }
      return { events: [...map.values()] };
    },
    enabled: showHostedEvents,
  });

  const { data: followingRemote } = useQuery({
    queryKey: ['social', 'is-following', 'profile', profile.id],
    queryFn: () => api.social.isFollowing('profile', profile.id),
    enabled: isAuthenticated && !isOwner && Boolean(profile.id),
  });

  useEffect(() => {
    if (typeof followingRemote === 'boolean') setIsFollowing(followingRemote);
  }, [followingRemote]);

  const followMutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.social.follow('profile', profile.id);
      else await api.social.unfollow('profile', profile.id);
    },
    onMutate: (next) => {
      setIsFollowing(next);
      return { previous: !next };
    },
    onError: (_err, _next, context) => {
      setIsFollowing(context?.previous ?? false);
      Alert.alert('Could not update follow', 'Please try again.');
    },
  });

  const entityHostedList = useMemo(
    () => pickHostedEvents(entityHostedResp?.events ?? []),
    [entityHostedResp],
  );

  const socialLinks = profile.socialLinks ?? {};
  const activeSocials = SOCIAL_ICONS_LEGACY.filter(s => socialLinks[s.key]);
  const tags: string[] = profile.tags ?? [];
  const showLocation = profile.privacySettings?.locationVisible !== false;
  const locationText = showLocation ? [profile.city, profile.country].filter(Boolean).join(', ') : '';
  const heroImage = profile.coverImageUrl ?? profile.avatarUrl;
  const shellWidth = isDesktop ? Math.min(contentWidth, 1120) : undefined;
  
  const statsRows = [
    { label: 'Followers', value: profile.followersCount ?? 0 },
    { label: 'Members', value: profile.membersCount ?? 0 },
    { label: 'Likes', value: profile.likes ?? 0 },
  ];

  const tabItems: { key: typeof activeTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'feed', label: 'Feed', icon: 'newspaper-outline' },
    { key: 'events', label: 'Events', icon: 'calendar-outline' },
    { key: 'community', label: 'Community', icon: 'people-outline' },
    { key: 'media', label: 'Media', icon: 'images-outline' },
    { key: 'about', label: 'About', icon: 'information-circle-outline' },
  ];

  const mediaImages = [
    heroImage,
    profile.avatarUrl,
    ...entityHostedList.map((ev) => ev.heroImageUrl ?? ev.imageUrl).filter(Boolean),
  ].filter((v): v is string => Boolean(v)).slice(0, 9);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <M3Card variant="filled">
            <View style={{ padding: 20 }}>
                <M3SectionHeader title="Feed" />
                <View style={{ marginTop: 8 }}>
                    <Text style={[e.feedSub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Events-first community timeline and latest organisation activity.</Text>
                    {entityHostedList.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                        {entityHostedList.slice(0, 6).map((ev, i) => (
                            <EventRailCard key={ev.id} event={ev} colors={colors} index={i} />
                        ))}
                        </ScrollView>
                    ) : (
                        <View style={e.emptyState}>
                            <Ionicons name="newspaper-outline" size={32} color={m3Colors.onSurfaceVariant} />
                            <Text style={[e.feedHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>No live posts yet.</Text>
                        </View>
                    )}
                </View>
            </View>
          </M3Card>
        );
      case 'events':
        return (
          <M3Card variant="filled">
            <View style={{ padding: 20 }}>
                <M3SectionHeader title="Upcoming Events" />
                <View style={{ marginTop: 12 }}>
                    {entityHostedList.length > 0 ? (
                        <View style={{ gap: 12 }}>
                        {entityHostedList.map((ev, i) => (
                            <EventRailCard key={ev.id} event={ev} colors={colors} index={i} />
                        ))}
                        </View>
                    ) : (
                        <View style={e.emptyState}>
                            <Ionicons name="calendar-outline" size={32} color={m3Colors.onSurfaceVariant} />
                            <Text style={[e.feedHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>No events published yet.</Text>
                        </View>
                    )}
                </View>
            </View>
          </M3Card>
        );
      case 'community':
        return (
          <M3Card variant="filled">
            <View style={{ padding: 20 }}>
                <M3SectionHeader title="Community" />
                <View style={{ marginTop: 12 }}>
                    <Text style={[e.feedSub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>Members, discussions, and cultural participation signals.</Text>
                    <M3Card variant="filled" style={[e.communityStats, { backgroundColor: m3Colors.primaryContainer, padding: 24, alignItems: 'center' }]}>
                        <Text style={[e.communityStatsText, M3Typography.titleLarge, { color: m3Colors.onPrimaryContainer }]}>
                        {fmt(profile.membersCount ?? 0)} members · {fmt(profile.followersCount ?? 0)} followers
                        </Text>
                        <Text style={[e.communityStatsHint, M3Typography.bodyMedium, { color: m3Colors.onPrimaryContainer, marginTop: 4, opacity: 0.8 }]}>Join to participate in threads and updates.</Text>
                    </M3Card>
                </View>
            </View>
          </M3Card>
        );
      case 'media':
        return (
          <M3Card variant="filled">
            <View style={{ padding: 20 }}>
                <M3SectionHeader title="Media Gallery" />
                <View style={{ marginTop: 12 }}>
                    {mediaImages.length > 0 ? (
                        <View style={e.mediaGrid}>
                        {mediaImages.map((uri, idx) => (
                            <Pressable key={`${uri}-${idx}`} style={e.mediaTile}>
                                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                            </Pressable>
                        ))}
                        </View>
                    ) : (
                        <View style={e.emptyState}>
                            <Ionicons name="images-outline" size={32} color={m3Colors.onSurfaceVariant} />
                            <Text style={[e.feedHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>No media uploaded yet.</Text>
                        </View>
                    )}
                </View>
            </View>
          </M3Card>
        );
      case 'about':
        return (
          <View style={{ gap: 20 }}>
            {(profile.bio || profile.description) && (
              <M3Card variant="filled">
                <View style={{ padding: 20 }}>
                    <M3SectionHeader title="About" />
                    <Text style={[M3Typography.bodyLarge, { color: m3Colors.onSurface, marginTop: 8, lineHeight: 26 }]}>{profile.bio ?? profile.description}</Text>
                </View>
              </M3Card>
            )}

            {/* Team & Organizers Management (for leads/admins) */}
            {(() => {
              const organizers = (profile as any).organizers || [];
              const canManageTeam = isOwner || organizers.some((o: any) => 
                ['lead_organizer', 'co_organizer', 'manager', 'admin'].includes(o.role)
              );

              if (!canManageTeam && organizers.length === 0) return null;

              return (
                <M3Card variant="filled">
                  <View style={{ padding: 20 }}>
                    <M3SectionHeader 
                      title="Team & Organizers" 
                      actionLabel={canManageTeam ? "Manage Team" : undefined}
                      onAction={canManageTeam ? () => setShowTeamModal(true) : undefined}
                    />
                    
                    <View style={{ marginTop: 12, gap: 10 }}>
                      {/* Lead / Creator */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="star" size={18} color={CultureTokens.gold} />
                        <Text style={{ color: m3Colors.onSurface, fontFamily: FontFamily.semibold }}>Lead Organizer (You)</Text>
                      </View>

                      {organizers.length > 0 ? organizers.map((org: any, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
                          <Ionicons name="person" size={16} color={m3Colors.onSurfaceVariant} />
                          <Text style={{ color: m3Colors.onSurface }}>{org.title || org.role}</Text>
                          <Text style={{ color: m3Colors.onSurfaceVariant, fontSize: 12 }}>({org.userId.slice(0, 8)}...)</Text>
                        </View>
                      )) : (
                        <Text style={{ color: m3Colors.onSurfaceVariant, fontSize: 13 }}>No additional organizers yet.</Text>
                      )}
                    </View>
                  </View>
                </M3Card>
              );
            })()}
            <M3Card variant="filled">
              <View style={{ padding: 20 }}>
                <M3SectionHeader title="Explore locally" />
                <View style={{ marginTop: 8 }}>
                    {profile.city ? (
                    <RecoRow
                        icon="business-outline"
                        title={`Explore ${profile.city}`}
                        subtitle="Local events and partners"
                        onPress={() => router.push({ pathname: '/city/[name]', params: { name: profile.city!, country: profile.country ?? 'Australia' } })}
                        colors={colors}
                    />
                    ) : null}
                    <RecoRow
                        icon="calendar-outline"
                        title="Browse all events"
                        subtitle="Nearby cultural experiences"
                        onPress={() => router.push('/events')}
                        colors={colors}
                    />
                </View>
              </View>
            </M3Card>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: m3Colors.background }}>
      <M3TopAppBar
        title={profile.name ?? 'Profile'}
        onBack={() => goBackOrReplace('/(tabs)')}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
        actions={[
            { icon: 'share-outline', onPress: () => {} }
        ]}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
      >
        <View style={[e.hero, { height: isExpanded ? 420 : 340 }]}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={e.heroImage} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={[m3Colors.primary, m3Colors.surfaceContainerLowest]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[e.heroInfo, { paddingHorizontal: hPad }]}>
            <M3Card variant="elevated" style={e.avatarWrap}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={e.avatarLarge} contentFit="cover" />
              ) : (
                <View style={[e.avatarFallback, { backgroundColor: m3Colors.primaryContainer }]}>
                  <Text style={[e.avatarFallbackText, { color: m3Colors.onPrimaryContainer }]}>{(profile.name ?? 'O').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </M3Card>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[e.name, M3Typography.headlineSmall, { color: '#fff' }]} numberOfLines={1}>{profile.name}</Text>
              <View style={e.metaRow}>
                <View style={[e.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[e.roleText, M3Typography.labelSmall, { color: '#fff' }]}>{String(profile.entityType || 'organisation').toUpperCase()}</Text>
                </View>
                {profile.isVerified ? (
                  <View style={[e.verifyPill, { backgroundColor: m3Colors.tertiaryContainer }]}>
                    <Ionicons name="shield-checkmark" size={12} color={m3Colors.onTertiaryContainer} />
                    <Text style={[e.verifyPillText, M3Typography.labelSmall, { color: m3Colors.onTertiaryContainer }]}>Verified</Text>
                  </View>
                ) : null}
              </View>
              {locationText ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={[e.locText, M3Typography.labelLarge, { color: 'rgba(255,255,255,0.8)' }]}>{locationText}</Text>
                </View>
              ) : null}
            </View>
            {!isOwner ? (
              <View style={e.heroActionCol}>
                <M3Button
                  variant={isFollowing ? 'tonal' : 'filled'}
                  onPress={() => {
                    if (!isAuthenticated) return router.push('/(onboarding)/login' as any);
                    followMutation.mutate(!isFollowing);
                  }}
                  leftIcon={isFollowing ? 'checkmark-circle' : 'person-add'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </M3Button>
              </View>
            ) : (
                <M3Button
                    variant="tonal"
                    onPress={() => router.push('/profile/edit')}
                    leftIcon="pencil-outline"
                >
                    Edit
                </M3Button>
            )}
          </View>
        </View>

        <View style={[e.shell, isDesktop && { width: shellWidth, alignSelf: 'center', paddingHorizontal: hPad }]}>
          <View style={[e.tabsWrap, { backgroundColor: m3Colors.surface, borderBottomColor: m3Colors.outlineVariant, borderBottomWidth: 1 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[e.tabsScroll, { paddingVertical: 12 }]}>
              {tabItems.map((tabItem) => (
                  <M3FilterChip
                    key={tabItem.key}
                    label={tabItem.label}
                    icon={tabItem.icon}
                    selected={activeTab === tabItem.key}
                    onPress={() => setActiveTab(tabItem.key)}
                  />
              ))}
            </ScrollView>
          </View>

          <M3Card variant="filled" style={e.statsRow}>
            {statsRows.map((stat, i) => (
              <View key={stat.label} style={[e.statCell, i < statsRows.length - 1 && { borderRightWidth: 1, borderRightColor: m3Colors.outlineVariant }]}>
                <Text style={[e.statValue, M3Typography.titleLarge, { color: m3Colors.onSurface }]}>{fmt(stat.value)}</Text>
                <Text style={[e.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{stat.label}</Text>
              </View>
            ))}
          </M3Card>

          <View style={[e.body, isDesktop && { flexDirection: 'row', gap: 24 }]}>
            <View style={{ flex: 2, gap: 24 }}>
              {renderTabContent()}
            </View>

            <View style={{ flex: 1, gap: 24 }}>
              {activeSocials.length > 0 ? (
                <M3Card variant="filled">
                  <View style={{ padding: 20 }}>
                    <M3SectionHeader title="Connect" />
                    <View style={[e.socialRow, { marginTop: 12 }]}>
                        {activeSocials.map((s) => (
                        <M3Button
                            key={s.key}
                            variant="tonal"
                            style={{ width: 44, height: 44, borderRadius: 12, paddingHorizontal: 0 }}
                            onPress={() => openExternalUrl(socialLinks[s.key]!)}
                        >
                            <Ionicons name={s.icon} size={20} color={m3Colors.primary} />
                        </M3Button>
                        ))}
                    </View>
                  </View>
                </M3Card>
              ) : null}

              {(locationText || profile.contactEmail || profile.phone || profile.website) ? (
                <M3Card variant="filled">
                  <View style={{ padding: 20 }}>
                    <M3SectionHeader title="Details" />
                    <View style={{ marginTop: 12, gap: 4 }}>
                        {locationText ? (
                        <M3Button variant="text" leftIcon="location-outline" style={{ justifyContent: 'flex-start' }}>{locationText}</M3Button>
                        ) : null}
                        {profile.contactEmail ? (
                        <M3Button variant="text" leftIcon="mail-outline" style={{ justifyContent: 'flex-start' }} onPress={() => Linking.openURL(`mailto:${profile.contactEmail}`)}>{profile.contactEmail}</M3Button>
                        ) : null}
                        {profile.phone ? (
                        <M3Button variant="text" leftIcon="call-outline" style={{ justifyContent: 'flex-start' }} onPress={() => Linking.openURL(`tel:${profile.phone}`)}>{profile.phone}</M3Button>
                        ) : null}
                        {profile.website ? (
                        <M3Button variant="text" leftIcon="globe-outline" style={{ justifyContent: 'flex-start' }} onPress={() => openLink(profile.website!)}>Website</M3Button>
                        ) : null}
                    </View>
                  </View>
                </M3Card>
              ) : null}

              {tags.length > 0 ? (
                <M3Card variant="filled">
                  <View style={{ padding: 20 }}>
                    <M3SectionHeader title="Tags" />
                    <View style={e.tagCloud}>
                        {tags.map((tag, i) => (
                        <M3FilterChip key={tag + i} label={tag} selected onPress={() => {}} />
                        ))}
                    </View>
                  </View>
                </M3Card>
              ) : null}

              {!isAuthenticated && !isOwner ? (
                <M3Card variant="filled">
                  <View style={{ padding: 20 }}>
                    <M3SectionHeader title="Join community" />
                    <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, marginTop: 8 }]}>
                      Sign in to view full feed and participate in discussions.
                    </Text>
                    <M3Button variant="filled" leftIcon="log-in-outline" onPress={() => router.push('/(onboarding)/login')} style={{ marginTop: 16 }}>
                      Sign in
                    </M3Button>
                  </View>
                </M3Card>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Team Management Modal */}
      <TeamManagementModal
        visible={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        profileId={profile.id}
        currentOrganizers={(profile as any).organizers || []}
        currentUserId={null as any}
        onTeamUpdated={() => {
          // The query invalidation inside the modal will refresh data
          setShowTeamModal(false);
        }}
      />
    </View>
  );
}

const e = StyleSheet.create({
  hero: { height: 380, justifyContent: 'flex-end', overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFill },
  shell: { paddingTop: 24 },
  tabsWrap: { borderRadius: 24, marginHorizontal: 16, marginBottom: 20, overflow: 'hidden' },
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  heroInfo: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingBottom: 32, zIndex: 10 },
  avatarWrap: { width: 100, height: 100, borderRadius: Radius.lg, borderWidth: 2.5, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  avatarLarge: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 44, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  roleText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.8 },
  verifyPill: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  verifyPillText: { color: CultureTokens.gold, fontSize: 12, fontFamily: 'Poppins_700Bold' },
  locText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'Poppins_500Medium' },
  heroActionCol: { alignItems: 'flex-end', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, paddingVertical: 24, marginHorizontal: 16, marginBottom: 20, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 },
  body: { paddingHorizontal: 16, gap: 24 },
  feedSub: { fontSize: 16, fontFamily: 'Poppins_400Regular', marginBottom: 20, lineHeight: 24, opacity: 0.8 },
  feedHint: { fontSize: 15, fontFamily: 'Poppins_500Medium', fontStyle: 'italic', paddingVertical: 12, opacity: 0.6 },
  emptyState: { paddingVertical: 56, alignItems: 'center', gap: 14 },
  communityStats: { padding: 28, alignItems: 'center' },
  communityStatsText: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  communityStatsHint: { fontSize: 15, fontFamily: 'Poppins_500Medium', marginTop: 6, opacity: 0.7 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  mediaTile: { width: '30.5%', aspectRatio: 1, borderRadius: Radius.md, backgroundColor: '#ececf3', overflow: 'hidden' },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
});
