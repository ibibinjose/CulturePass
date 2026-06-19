import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { M3Button, M3Card, M3FilterChip } from '@/design-system/ui';
import { pressableA11yRole } from '@/lib/webPressable';
import { FontFamily } from '@/design-system/tokens/theme';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/theme';
import { routeCommunityMembers } from '@/lib/publicPaths';
import { COMMUNITY_LEGAL_STATUS_LABELS, type Community, type EventData, type Profile } from '@/shared/schema';
import {
  communityBusinessRoute,
  communityDetailHaptic,
  type CommunityDetailTab,
  type CommunityMemberItem,
} from '@/modules/communities/components/detail/communityDetailUtils';
import {
  ChipRow,
  CollapsibleSection,
  InfoRow,
  MemberRow,
  SectionCard,
  SocialLinksRow,
  TabPill,
  reg,
} from '@/modules/communities/components/detail/CommunityDetailScreen.parts';
import { CommunityEventsSection } from '@/modules/communities/components/detail/CommunityEventsSection';
import { communityDetailStyles as s } from '@/modules/communities/components/detail/CommunityDetailScreen.styles';
import { DISPLAY_FALLBACK } from '@/lib/presentation';

const haptic = communityDetailHaptic;
const bizRoute = communityBusinessRoute;

export type CommunityDetailTabBodyProps = {
  community: Community;
  tab: CommunityDetailTab;
  onTabChange: (tab: CommunityDetailTab) => void;
  accent: string;
  isWeb: boolean;
  pathId: string;
  locationLabel: string | null;
  joinLabel: string | null;
  cadenceLabel: string | null;
  trustSignals: string[];
  recommendedEvents: EventData[];
  eventsLoading: boolean;
  eventsScopeNote?: string;
  members: CommunityMemberItem[];
  membersLoading: boolean;
  memberCountValue: number;
  memberBusinesses: Profile[];
  isJoined: boolean;
  onJoinToggle: () => void;
  hasFoundingStory: boolean;
  hasLeadership: boolean;
  hasGovernance: boolean;
  hasPartners: boolean;
  hasGallery: boolean;
  hasLinks: boolean;
  hasRegistry: boolean;
};

export function CommunityDetailTabBody({
  community,
  tab,
  onTabChange,
  accent,
  isWeb,
  pathId,
  locationLabel,
  joinLabel,
  cadenceLabel,
  trustSignals,
  recommendedEvents,
  eventsLoading,
  eventsScopeNote,
  members,
  membersLoading,
  memberCountValue,
  memberBusinesses,
  isJoined,
  onJoinToggle,
  hasFoundingStory,
  hasLeadership,
  hasGovernance,
  hasPartners,
  hasGallery,
  hasLinks,
  hasRegistry,
}: CommunityDetailTabBodyProps) {
  const m3Colors = useM3Colors();

  return (
    <View style={{ gap: 12 }}>
      <View style={[s.tabBarWrap, { backgroundColor: m3Colors.surfaceContainerLow, borderColor: m3Colors.outlineVariant }]}>
        <View style={s.tabBar}>
          <TabPill label="About" active={tab === 'about'} accent={accent} onPress={() => onTabChange('about')} />
          <TabPill
            label="Events"
            active={tab === 'events'}
            accent={accent}
            count={recommendedEvents.length}
            onPress={() => onTabChange('events')}
          />
          <TabPill
            label="Members"
            active={tab === 'members'}
            accent={accent}
            count={memberCountValue > 0 ? memberCountValue : undefined}
            onPress={() => onTabChange('members')}
          />
        </View>
      </View>

      {tab === 'about' && (
        <Animated.View entering={isWeb ? undefined : FadeInDown.duration(220)} style={{ gap: 12 }}>
          <SectionCard title="About this community">
            <Text
              style={[
                s.bodyText,
                M3Typography.bodyMedium,
                {
                  color: community.description ? m3Colors.onSurfaceVariant : m3Colors.outline,
                  fontStyle: community.description ? 'normal' : 'italic',
                },
              ]}
            >
              {community.description?.trim() || DISPLAY_FALLBACK.noDescription}
            </Text>
            {community.mission && community.mission !== community.description ? (
              <View
                style={[
                  s.missionBox,
                  { backgroundColor: m3Colors.secondaryContainer, borderLeftColor: m3Colors.primary },
                ]}
              >
                <Text style={[s.missionLabel, M3Typography.labelSmall, { color: m3Colors.primary }]}>MISSION</Text>
                <Text style={[s.bodyText, M3Typography.bodyMedium, { color: m3Colors.onSurface }]}>
                  {community.mission}
                </Text>
              </View>
            ) : !community.description ? (
              <View
                style={[
                  s.missionBox,
                  { backgroundColor: m3Colors.secondaryContainer, borderLeftColor: m3Colors.primary },
                ]}
              >
                <Text style={[s.missionLabel, M3Typography.labelSmall, { color: m3Colors.primary }]}>MISSION</Text>
                <Text
                  style={[
                    s.bodyText,
                    M3Typography.bodyMedium,
                    { color: m3Colors.onSurfaceVariant, fontStyle: 'italic' },
                  ]}
                >
                  {DISPLAY_FALLBACK.noMission}
                </Text>
              </View>
            ) : null}
            <SocialLinksRow community={community} />
          </SectionCard>

          <SectionCard title="Details">
            <InfoRow label="Location" value={locationLabel} />
            <InfoRow label="Membership" value={joinLabel} />
            <InfoRow label="Gatherings" value={cadenceLabel} />
            <InfoRow
              label="Chapters"
              value={
                community.chapterCount && community.chapterCount > 1
                  ? `${community.chapterCount} cities`
                  : null
              }
            />
            <InfoRow label="Country of origin" value={community.countryOfOrigin} />
          </SectionCard>

          <SectionCard title="Trust & Safety">
            <ChipRow items={trustSignals} emptyLabel={DISPLAY_FALLBACK.noTrustSignals} />
          </SectionCard>

          {hasLinks ? (
            <SectionCard title="Links">
              {community.links!.map((link) => (
                <Pressable
                  key={link.url}
                  onPress={() => openExternalUrl(link.url)}
                  style={[s.linkRow, { borderColor: m3Colors.outlineVariant }]}
                  accessibilityRole="link"
                >
                  <Ionicons
                    name={(link.icon as keyof typeof Ionicons.glyphMap) ?? 'link-outline'}
                    size={18}
                    color={m3Colors.primary}
                  />
                  <Text style={[s.linkLabel, M3Typography.bodyLarge, { color: m3Colors.onSurface }]} numberOfLines={1}>
                    {link.title}
                  </Text>
                  <Ionicons name="open-outline" size={14} color={m3Colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </SectionCard>
          ) : null}

          {(community.longFormPosts?.length ?? 0) > 0 ? (
            <SectionCard title="Posts">
              {community.longFormPosts!.slice(0, 3).map((post) => (
                <View key={post.id} style={[s.postRow, { borderColor: m3Colors.outlineVariant }]}>
                  <Text style={[s.postTitle, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{post.title}</Text>
                  <Text style={[s.postMeta, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
                    {post.publishedAt}
                  </Text>
                  <Text
                    style={[s.bodyText, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}
                    numberOfLines={3}
                  >
                    {post.content}
                  </Text>
                </View>
              ))}
            </SectionCard>
          ) : null}
        </Animated.View>
      )}

      {tab === 'events' && (
        <Animated.View entering={isWeb ? undefined : FadeInDown.duration(220)}>
          <CommunityEventsSection
            events={recommendedEvents}
            loading={eventsLoading}
            accent={accent}
            communityName={community.name}
            locationScopeNote={eventsScopeNote}
          />
        </Animated.View>
      )}

      {tab === 'members' && (
        <Animated.View entering={isWeb ? undefined : FadeInDown.duration(220)}>
          {membersLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton width="100%" height={72} borderRadius={14} />
              <Skeleton width="100%" height={72} borderRadius={14} />
              <Skeleton width="100%" height={72} borderRadius={14} />
            </View>
          ) : memberCountValue > 0 && members.length === 0 ? (
            <M3Card variant="outlined" style={s.emptyState}>
              <Ionicons name="lock-closed-outline" size={36} color={m3Colors.onSurfaceVariant} />
              <Text style={[s.emptyStateTitle, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                {memberCountValue.toLocaleString()} members
              </Text>
              <Text style={[s.emptyStateSub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                {DISPLAY_FALLBACK.membersPrivate}
              </Text>
            </M3Card>
          ) : members.length > 0 ? (
            <SectionCard
              title={`${memberCountValue > 0 ? memberCountValue.toLocaleString() + ' ' : ''}Members`}
              action={{
                label: 'See all',
                onPress: () => {
                  haptic();
                  router.push(routeCommunityMembers({ id: pathId }) as never);
                },
              }}
            >
              {members.slice(0, 6).map((m) => (
                <MemberRow key={m.id} member={m} />
              ))}
              {members.length > 6 ? (
                <Pressable
                  onPress={() => {
                    haptic();
                    router.push(routeCommunityMembers({ id: pathId }) as never);
                  }}
                  accessibilityRole={pressableA11yRole('link')}
                  style={({ pressed }) => [s.seeAllMembersBtn, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <Text style={[M3Typography.labelLarge, { color: m3Colors.primary, fontFamily: FontFamily.semibold }]}>
                    See all {memberCountValue > 0 ? memberCountValue.toLocaleString() : ''} members
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={m3Colors.primary} />
                </Pressable>
              ) : null}
            </SectionCard>
          ) : (
            <M3Card variant="outlined" style={s.emptyState}>
              <Ionicons name="people-outline" size={36} color={m3Colors.onSurfaceVariant} />
              <Text style={[s.emptyStateTitle, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                No visible members yet
              </Text>
              <Text style={[s.emptyStateSub, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                {DISPLAY_FALLBACK.membersEmpty}
              </Text>
              {!isJoined ? (
                <M3Button onPress={onJoinToggle} style={{ marginTop: 12 }} variant="filled">
                  Join to be first
                </M3Button>
              ) : null}
            </M3Card>
          )}
        </Animated.View>
      )}

      {hasRegistry ? (
        <View style={{ gap: 12, marginTop: 4 }}>
          {hasFoundingStory ? (
            <CollapsibleSection icon="book-outline" title="Founding Story">
              {community.foundedDate || community.foundedLocation ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {community.foundedDate ? (
                    <M3FilterChip label={community.foundedDate} onPress={() => {}} icon="calendar-outline" />
                  ) : null}
                  {community.foundedLocation ? (
                    <M3FilterChip label={community.foundedLocation} onPress={() => {}} icon="location-outline" />
                  ) : null}
                </View>
              ) : null}
              {community.foundingStory ? (
                <Text style={[s.bodyText, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                  {community.foundingStory}
                </Text>
              ) : null}
            </CollapsibleSection>
          ) : null}

          {hasLeadership ? (
            <CollapsibleSection icon="people-outline" title="Leadership" badge={community.leadership!.length}>
              {community.leadership!.map((leader) => (
                <View key={leader.id} style={[reg.row, { borderColor: m3Colors.outlineVariant }]}>
                  <View style={[reg.avatar, { backgroundColor: m3Colors.secondaryContainer }]}>
                    {leader.avatarUrl ? (
                      <Image source={{ uri: leader.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Ionicons name="person-outline" size={16} color={m3Colors.onSecondaryContainer} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[reg.name, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{leader.name}</Text>
                    <Text style={[reg.sub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                      {leader.roleTitle}
                    </Text>
                  </View>
                  {leader.isCurrent ? (
                    <View style={[reg.badge, { backgroundColor: m3Colors.primaryContainer }]}>
                      <Text style={[reg.badgeText, M3Typography.labelSmall, { color: m3Colors.onPrimaryContainer }]}>
                        Current
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </CollapsibleSection>
          ) : null}

          {hasGovernance ? (
            <CollapsibleSection icon="shield-checkmark-outline" title="Governance & Legal">
              {community.legalStatus ? (
                <InfoRow label="Legal status" value={COMMUNITY_LEGAL_STATUS_LABELS[community.legalStatus]} />
              ) : null}
              {community.registrationNumber ? (
                <InfoRow label="Registration no." value={community.registrationNumber} />
              ) : null}
              {community.governingStructure ? (
                <Text
                  style={[s.bodyText, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, marginTop: 8 }]}
                >
                  {community.governingStructure}
                </Text>
              ) : null}
            </CollapsibleSection>
          ) : null}

          {hasPartners ? (
            <CollapsibleSection icon="ribbon-outline" title="Partners & Sponsors" badge={community.partners!.length}>
              {community.partners!.map((partner) => (
                <View key={partner.id} style={[reg.row, { borderColor: m3Colors.outlineVariant }]}>
                  <View style={[reg.avatar, { backgroundColor: m3Colors.tertiaryContainer }]}>
                    {partner.logoUrl ? (
                      <Image source={{ uri: partner.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Ionicons name="ribbon-outline" size={16} color={m3Colors.onTertiaryContainer} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[reg.name, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{partner.name}</Text>
                    <Text style={[reg.sub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                      {partner.partnerType.charAt(0).toUpperCase() + partner.partnerType.slice(1)}
                    </Text>
                  </View>
                  {partner.website ? (
                    <Pressable
                      onPress={() => openExternalUrl(partner.website!)}
                      accessibilityRole={pressableA11yRole('link')}
                      hitSlop={8}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 4 })}
                    >
                      <Ionicons name="open-outline" size={18} color={m3Colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </CollapsibleSection>
          ) : null}

          {memberBusinesses.length > 0 ? (
            <CollapsibleSection icon="storefront-outline" title="Member Businesses" badge={memberBusinesses.length}>
              {memberBusinesses.map((biz) => (
                <Pressable
                  key={biz.id}
                  onPress={() => {
                    haptic();
                    router.push(bizRoute(biz.entityType, biz.id) as never);
                  }}
                  style={[reg.row, { borderColor: m3Colors.outlineVariant }]}
                  accessibilityRole={pressableA11yRole('link')}
                >
                  <View style={[reg.avatar, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
                    {biz.imageUrl ? (
                      <Image source={{ uri: biz.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Text style={[reg.initial, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>
                        {biz.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[reg.name, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{biz.name}</Text>
                    <Text style={[reg.sub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
                      {[biz.category, biz.city].filter(Boolean).join(' · ') || biz.entityType}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={m3Colors.onSurfaceVariant} />
                </Pressable>
              ))}
            </CollapsibleSection>
          ) : null}

          {hasGallery ? (
            <CollapsibleSection icon="images-outline" title="Gallery" badge={community.gallery!.length}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                {community.gallery!.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[
                      s.galleryThumb,
                      i === 0 && { marginLeft: 16 },
                      i === community.gallery!.length - 1 && { marginRight: 16 },
                    ]}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            </CollapsibleSection>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
