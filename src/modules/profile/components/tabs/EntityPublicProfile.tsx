import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, M3Typography, Radius, FontFamily, Spacing } from '@/design-system/tokens/theme';
import { PROFILE_HERO_OVERLAY as H } from '@/design-system/tokens/profileHeroOverlay';
import { TruncatedText } from '@/design-system/ui';
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
  { key: 'facebook', icon: 'logo-facebook' as const },
  { key: 'instagram', icon: 'logo-instagram' as const },
  { key: 'twitter', icon: 'logo-twitter' as const },
  { key: 'linkedin', icon: 'logo-linkedin' as const },
  { key: 'youtube', icon: 'logo-youtube' as const },
  { key: 'tiktok', icon: 'logo-tiktok' as const },
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
            <View style={e.cardPad}>
                <M3SectionHeader title="Feed" />
                <View style={e.sectionGapSm}>
                    <TruncatedText style={[e.feedSub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]} lines={3}>Events-first community timeline and latest organisation activity.</TruncatedText>
                    {entityHostedList.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={e.eventRail}>
                        {entityHostedList.slice(0, 6).map((ev, i) => (
                            <EventRailCard key={ev.id} event={ev} colors={colors} index={i} />
                        ))}
                        </ScrollView>
                    ) : (
                        <View style={e.emptyState}>
                            <Ionicons name="newspaper-outline" size={32} color={m3Colors.onSurfaceVariant} />
                            <Text style={[e.feedHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={2}>No live posts yet.</Text>
                        </View>
                    )}
                </View>
            </View>
          </M3Card>
        );
      case 'events':
        return (
          <M3Card variant="filled">
            <View style={e.cardPad}>
                <M3SectionHeader title="Upcoming Events" />
                <View style={e.sectionGapMd}>
                    {entityHostedList.length > 0 ? (
                        <View style={e.gap12}>
                        {entityHostedList.map((ev, i) => (
                            <EventRailCard key={ev.id} event={ev} colors={colors} index={i} />
                        ))}
                        </View>
                    ) : (
                        <View style={e.emptyState}>
                            <Ionicons name="calendar-outline" size={32} color={m3Colors.onSurfaceVariant} />
                            <Text style={[e.feedHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={2}>No events published yet.</Text>
                        </View>
                    )}
                </View>
            </View>
          </M3Card>
        );
      case 'community':
        return (
          <M3Card variant="filled">
            <View style={e.cardPad}>
                <M3SectionHeader title="Community" />
                <View style={e.sectionGapMd}>
                    <TruncatedText style={[e.feedSub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]} lines={2}>Members, discussions, and cultural participation signals.</TruncatedText>
                    <M3Card variant="filled" style={[e.communityStats, e.communityCardPad, { backgroundColor: m3Colors.primaryContainer }]}>
                        <Text style={[e.communityStatsText, M3Typography.titleLarge, { color: m3Colors.onPrimaryContainer }]} numberOfLines={2}>
                        {fmt(profile.membersCount ?? 0)} members · {fmt(profile.followersCount ?? 0)} followers
                        </Text>
                        <Text style={[e.communityStatsHint, M3Typography.bodyMedium, { color: m3Colors.onPrimaryContainer, marginTop: 4, opacity: 0.8 }]} numberOfLines={2}>Join to participate in threads and updates.</Text>
                    </M3Card>
                </View>
            </View>
          </M3Card>
        );
      case 'media':
        return (
          <M3Card variant="filled">
            <View style={e.cardPad}>
                <M3SectionHeader title="Media Gallery" />
                <View style={e.sectionGapMd}>
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
                            <Text style={[e.feedHint, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={2}>No media uploaded yet.</Text>
                        </View>
                    )}
                </View>
            </View>
          </M3Card>
        );
      case 'about':
        return (
          <View style={e.gap20}>
            {(profile.bio || profile.description) && (
              <M3Card variant="filled">
                <View style={e.cardPad}>
                    <M3SectionHeader title="About" />
                    <TruncatedText style={[M3Typography.bodyLarge, e.aboutBio, { color: m3Colors.onSurface }]} lines={8}>{profile.bio ?? profile.description}</TruncatedText>
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
                  <View style={e.cardPad}>
                    <M3SectionHeader 
                      title="Team & Organizers" 
                      actionLabel={canManageTeam ? "Manage Team" : undefined}
                      onAction={canManageTeam ? () => setShowTeamModal(true) : undefined}
                    />
                    
                    <View style={e.teamList}>
                      {/* Lead / Creator */}
                      <View style={e.teamRow}>
                        <Ionicons name="star" size={18} color={CultureTokens.gold} />
                        <Text style={[e.teamLead, { color: m3Colors.onSurface }]} numberOfLines={1}>Lead Organizer (You)</Text>
                      </View>

                      {organizers.length > 0 ? organizers.map((org: any, idx: number) => (
                        <View key={idx} style={e.teamRowIndented}>
                          <Ionicons name="person" size={16} color={m3Colors.onSurfaceVariant} />
                          <TruncatedText style={[e.teamLead, { color: m3Colors.onSurface }]} lines={1}>{org.title || org.role}</TruncatedText>
                          <Text style={[e.teamMeta, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>({org.userId.slice(0, 8)}...)</Text>
                        </View>
                      )) : (
                        <Text style={[e.teamEmpty, { color: m3Colors.onSurfaceVariant }]} numberOfLines={2}>No additional organizers yet.</Text>
                      )}
                    </View>
                  </View>
                </M3Card>
              );
            })()}
            <M3Card variant="filled">
              <View style={e.cardPad}>
                <M3SectionHeader title="Explore locally" />
                <View style={e.sectionGapSm}>
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
    <View style={[e.screen, { backgroundColor: m3Colors.background }]}>
      <M3TopAppBar
        title={profile.name ?? 'Profile'}
        onBack={() => goBackOrReplace('/(tabs)')}
        variant={isExpanded ? 'large' : 'medium'}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={e.heroLogo}
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
            colors={[...H.heroScrim]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[e.heroInfo, { paddingHorizontal: hPad }]}>
            <M3Card variant="elevated" style={e.avatarWrap}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={e.avatarLarge} contentFit="cover" />
              ) : (
                <View style={[e.avatarFallback, { backgroundColor: m3Colors.primaryContainer }]}>
                  <Text style={[e.avatarFallbackText, { color: m3Colors.onPrimaryContainer }]} numberOfLines={1}>{(profile.name ?? 'O').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </M3Card>
            <View style={e.flex1Min0}>
              <Text style={[e.name, M3Typography.headlineSmall, { color: H.textPrimary }]} numberOfLines={1}>{profile.name}</Text>
              <View style={e.metaRow}>
                <View style={[e.roleBadge, { backgroundColor: H.roleBadgeBgStrong }]}>
                  <Text style={[e.roleText, M3Typography.labelSmall, { color: H.textPrimary }]} numberOfLines={1}>{String(profile.entityType || 'organisation').toUpperCase()}</Text>
                </View>
                {profile.isVerified ? (
                  <View style={[e.verifyPill, { backgroundColor: m3Colors.tertiaryContainer }]}>
                    <Ionicons name="shield-checkmark" size={12} color={m3Colors.onTertiaryContainer} />
                    <Text style={[e.verifyPillText, M3Typography.labelSmall, { color: m3Colors.onTertiaryContainer }]} numberOfLines={1}>Verified</Text>
                  </View>
                ) : null}
              </View>
              {locationText ? (
                <View style={e.locationRow}>
                    <Ionicons name="location" size={14} color={H.textMuted} />
                    <TruncatedText style={[e.locText, M3Typography.labelLarge, { color: H.textMuted }]} lines={1}>{locationText}</TruncatedText>
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
                <Text style={[e.statValue, M3Typography.titleLarge, { color: m3Colors.onSurface }]} numberOfLines={1}>{fmt(stat.value)}</Text>
                <Text style={[e.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>{stat.label}</Text>
              </View>
            ))}
          </M3Card>

          <View style={[e.body, isDesktop && e.bodyRow]}>
            <View style={e.bodyMain}>
              {renderTabContent()}
            </View>

            <View style={e.bodySide}>
              {activeSocials.length > 0 ? (
                <M3Card variant="filled">
                  <View style={e.cardPad}>
                    <M3SectionHeader title="Connect" />
                    <View style={[e.socialRow, e.sectionGapMd]}>
                        {activeSocials.map((s) => (
                        <M3Button
                            key={s.key}
                            variant="tonal"
                            style={e.socialBtn}
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
                  <View style={e.cardPad}>
                    <M3SectionHeader title="Details" />
                    <View style={e.detailList}>
                        {locationText ? (
                        <M3Button variant="text" leftIcon="location-outline" style={e.detailBtn}>{locationText}</M3Button>
                        ) : null}
                        {profile.contactEmail ? (
                        <M3Button variant="text" leftIcon="mail-outline" style={e.detailBtn} onPress={() => Linking.openURL(`mailto:${profile.contactEmail}`)}>{profile.contactEmail}</M3Button>
                        ) : null}
                        {profile.phone ? (
                        <M3Button variant="text" leftIcon="call-outline" style={e.detailBtn} onPress={() => Linking.openURL(`tel:${profile.phone}`)}>{profile.phone}</M3Button>
                        ) : null}
                        {profile.website ? (
                        <M3Button variant="text" leftIcon="globe-outline" style={e.detailBtn} onPress={() => openLink(profile.website!)}>Website</M3Button>
                        ) : null}
                    </View>
                  </View>
                </M3Card>
              ) : null}

              {tags.length > 0 ? (
                <M3Card variant="filled">
                  <View style={e.cardPad}>
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
                  <View style={e.cardPad}>
                    <M3SectionHeader title="Join community" />
                    <TruncatedText style={[M3Typography.bodyMedium, e.signInCopy, { color: m3Colors.onSurfaceVariant }]} lines={3}>
                      Sign in to view full feed and participate in discussions.
                    </TruncatedText>
                    <M3Button variant="filled" leftIcon="log-in-outline" onPress={() => router.push('/(onboarding)/login')} style={e.signInBtn}>
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
  // --- FIXES-001 P5: profile tab layout extraction + hero overlay tokens ---
  screen: { flex: 1 },
  cardPad: { padding: 20 },
  sectionGapSm: { marginTop: Spacing.sm },
  sectionGapMd: { marginTop: 12 },
  gap12: { gap: 12 },
  gap20: { gap: 20 },
  gap24: { gap: 24 },
  flex1Min0: { flex: 1, minWidth: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  heroLogo: { width: 40, height: 40, borderRadius: 20, marginLeft: Spacing.sm },
  bodyMain: { flex: 2, gap: 24 },
  bodySide: { flex: 1, gap: 24 },
  bodyRow: { flexDirection: 'row', gap: 24 },
  teamList: { marginTop: 12, gap: 10 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamRowIndented: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 4 },
  teamLead: { fontFamily: FontFamily.semibold },
  teamMeta: { fontSize: 12 },
  teamEmpty: { fontSize: 13 },
  detailList: { marginTop: 12, gap: 4 },
  detailBtn: { justifyContent: 'flex-start' },
  socialBtn: { width: 44, height: 44, borderRadius: 12, paddingHorizontal: 0 },
  signInBtn: { marginTop: 16 },
  signInCopy: { marginTop: Spacing.sm },
  aboutBio: { marginTop: Spacing.sm, lineHeight: 26 },
  eventRail: { gap: 12, paddingBottom: 4 },
  communityCardPad: { padding: 24, alignItems: 'center' },

  hero: { height: 380, justifyContent: 'flex-end', overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFill },
  shell: { paddingTop: 24 },
  tabsWrap: { borderRadius: 24, marginHorizontal: 16, marginBottom: 20, overflow: 'hidden' },
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  heroInfo: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingBottom: 32, zIndex: 10 },
  avatarWrap: { width: 100, height: 100, borderRadius: Radius.lg, borderWidth: 2.5, overflow: 'hidden', backgroundColor: H.avatarRing },
  avatarLarge: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 44, fontFamily: FontFamily.bold, color: H.textPrimary },
  name: { fontSize: 32, fontFamily: FontFamily.bold, color: H.textPrimary, letterSpacing: -1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  roleBadge: { backgroundColor: H.roleBadgeBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  roleText: { color: H.textPrimary, fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  verifyPill: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: H.verifyPillBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  verifyPillText: { color: CultureTokens.gold, fontSize: 12, fontFamily: FontFamily.bold },
  locText: { color: H.textSecondary, fontSize: 15, fontFamily: FontFamily.medium },
  heroActionCol: { alignItems: 'flex-end', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, paddingVertical: 24, marginHorizontal: 16, marginBottom: 20, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontFamily: FontFamily.bold },
  statLabel: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 },
  body: { paddingHorizontal: 16, gap: 24 },
  feedSub: { fontSize: 16, fontFamily: FontFamily.regular, marginBottom: 20, lineHeight: 24, opacity: 0.8 },
  feedHint: { fontSize: 15, fontFamily: FontFamily.medium, fontStyle: 'italic', paddingVertical: 12, opacity: 0.6 },
  emptyState: { paddingVertical: 56, alignItems: 'center', gap: 14 },
  communityStats: { padding: 28, alignItems: 'center' },
  communityStatsText: { fontSize: 20, fontFamily: FontFamily.bold },
  communityStatsHint: { fontSize: 15, fontFamily: FontFamily.medium, marginTop: 6, opacity: 0.7 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  mediaTile: { width: '30.5%', aspectRatio: 1, borderRadius: Radius.md, backgroundColor: H.mediaPlaceholder, overflow: 'hidden' },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
});
