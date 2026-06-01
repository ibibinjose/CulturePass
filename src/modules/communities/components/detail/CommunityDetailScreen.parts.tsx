import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';

import { M3Button, M3Card, M3FilterChip, M3SectionHeader, M3TopAppBar } from '@/design-system/ui';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useSafeBack } from '@/lib/navigation';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { routeEvent, routeUser } from '@/lib/publicPaths';
import {
  communityDetailHaptic,
  communityEventPriceLabel,
  communityMemberPublicProfileSegment,
  formatCommunityEventDate,
  showUnavailableMemberProfileNotice,
  type CommunityMemberItem,
} from '@/modules/communities/components/detail/communityDetailUtils';
import type { Community, EventData } from '@/shared/schema';

const haptic = communityDetailHaptic;
const priceLabel = communityEventPriceLabel;
const formatEventDate = formatCommunityEventDate;
const memberPublicProfileSegment = communityMemberPublicProfileSegment;
const showUnavailableProfileNotice = showUnavailableMemberProfileNotice;

export function DetailSkeleton() {
  const colors = useColors();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const goBack = useSafeBack('/(tabs)/community');
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topInset, paddingHorizontal: 8, paddingBottom: 4 }}>
        <M3TopAppBar title="" onBack={goBack} webChromeless denseWeb />
      </View>
      <View style={{ height: 320, backgroundColor: colors.backgroundSecondary }} />
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width="32%" height={84} borderRadius={16} />
          <Skeleton width="32%" height={84} borderRadius={16} />
          <Skeleton width="32%" height={84} borderRadius={16} />
        </View>
        <Skeleton width="100%" height={52} borderRadius={14} />
        <Skeleton width="100%" height={200} borderRadius={18} />
        <Skeleton width="100%" height={130} borderRadius={18} />
        <Skeleton width="100%" height={130} borderRadius={18} />
      </View>
    </View>
  );
}

export function TabPill({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  const m3Colors = useM3Colors();
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress();
      }}
      style={[
        ts.tabPill,
        {
          backgroundColor: active ? m3Colors.secondaryContainer : 'transparent',
          borderColor: active ? 'transparent' : m3Colors.outlineVariant,
          borderWidth: active ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          ts.tabPillLabel,
          M3Typography.labelLarge,
          { color: active ? m3Colors.onSecondaryContainer : m3Colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
      {count != null && count > 0 ? (
        <View
          style={[
            ts.tabPillBadge,
            { backgroundColor: active ? m3Colors.onSecondaryContainer + '20' : m3Colors.primaryContainer },
          ]}
        >
          <Text
            style={[
              ts.tabPillBadgeText,
              { color: active ? m3Colors.onSecondaryContainer : m3Colors.onPrimaryContainer },
            ]}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <M3Card variant="filled" style={sc.card}>
      <View style={{ padding: 20 }}>
        <M3SectionHeader
          title={title}
          subtitle={subtitle}
          onAction={action?.onPress}
          actionLabel={action?.label}
        />
        <View style={{ marginTop: 8 }}>{children}</View>
      </View>
    </M3Card>
  );
}

export function EventRow({ event }: { event: EventData; accent?: string }) {
  const m3Colors = useM3Colors();
  const price = priceLabel(event.priceCents, event.isFree);
  return (
    <M3Card
      variant="outlined"
      onPress={() => {
        haptic();
        router.push(routeEvent(event) as never);
      }}
      style={er.row}
    >
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={er.thumb} contentFit="cover" />
      ) : (
        <View style={[er.thumb, er.thumbFallback, { backgroundColor: m3Colors.primaryContainer }]}>
          <Ionicons name="calendar-outline" size={22} color={m3Colors.onPrimaryContainer} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[er.title, M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[er.meta, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
          {[formatEventDate(event.date), event.venue, event.city].filter(Boolean).join(' · ')}
        </Text>
        {price ? (
          <View style={[er.pricePill, { backgroundColor: m3Colors.secondaryContainer }]}>
            <Text style={[er.priceText, M3Typography.labelSmall, { color: m3Colors.onSecondaryContainer }]}>
              {price}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={m3Colors.onSurfaceVariant} />
    </M3Card>
  );
}

export function MemberRow({ member }: { member: CommunityMemberItem }) {
  const m3Colors = useM3Colors();
  const initials = member.name.charAt(0).toUpperCase();
  const meta = [member.username ? `@${member.username}` : null, member.city, member.country]
    .filter(Boolean)
    .join(' · ');
  const hrefSegment = memberPublicProfileSegment(member);
  const openPublicProfile = () => {
    if (!hrefSegment) {
      showUnavailableProfileNotice();
      return;
    }
    haptic();
    router.push(routeUser({ id: hrefSegment, handle: hrefSegment, handleStatus: 'approved' }) as never);
  };
  return (
    <Pressable
      onPress={openPublicProfile}
      style={({ pressed }) => [
        mr.row,
        {
          borderBottomColor: m3Colors.outlineVariant,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        hrefSegment ? `View ${member.name} profile` : `Profile for ${member.name} is unavailable`
      }
    >
      <View style={[mr.avatar, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[mr.initial, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{initials}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mr.name, M3Typography.bodyLarge, { color: m3Colors.onSurface }]}>{member.name}</Text>
        {meta ? (
          <Text style={[mr.meta, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {hrefSegment ? <Ionicons name="chevron-forward" size={16} color={m3Colors.onSurfaceVariant} /> : null}
    </Pressable>
  );
}

export function CollapsibleSection({
  icon,
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const m3Colors = useM3Colors();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <M3Card variant="filled" style={[col.wrap, { backgroundColor: m3Colors.surfaceContainerLow }]}>
      <Pressable
        onPress={() => {
          haptic();
          setOpen((o) => !o);
        }}
        style={[col.toggle, open && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: m3Colors.outlineVariant }]}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
      >
        <View style={[col.iconBox, { backgroundColor: m3Colors.primaryContainer }]}>
          <Ionicons name={icon} size={15} color={m3Colors.onPrimaryContainer} />
        </View>
        <Text style={[col.toggleTitle, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{title}</Text>
        {badge != null ? (
          <View style={[col.badge, { backgroundColor: m3Colors.secondaryContainer }]}>
            <Text style={[col.badgeText, M3Typography.labelSmall, { color: m3Colors.onSecondaryContainer }]}>
              {badge}
            </Text>
          </View>
        ) : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={m3Colors.onSurfaceVariant} />
      </Pressable>
      {open ? <View style={col.body}>{children}</View> : null}
    </M3Card>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  const m3Colors = useM3Colors();
  return (
    <View style={[inf.row, { borderColor: m3Colors.outlineVariant }]}>
      <Text style={[inf.label, M3Typography.labelMedium, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[inf.value, M3Typography.bodyMedium, { color: m3Colors.onSurface }]}>{value}</Text>
    </View>
  );
}

export function ChipRow({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
      {items.map((item) => (
        <M3FilterChip key={item} label={item} onPress={() => {}} selected />
      ))}
    </View>
  );
}

export function SocialLinksRow({ community }: { community: Community }) {
  const m3Colors = useM3Colors();
  const links: { icon: keyof typeof Ionicons.glyphMap; url: string }[] = [];
  if (community.website) links.push({ icon: 'globe-outline', url: community.website });
  if (community.instagram)
    links.push({ icon: 'logo-instagram', url: `https://instagram.com/${community.instagram.replace('@', '')}` });
  if (community.facebook) links.push({ icon: 'logo-facebook', url: community.facebook });
  if (community.socialLinks?.twitter)
    links.push({ icon: 'logo-twitter', url: `https://twitter.com/${community.socialLinks.twitter.replace('@', '')}` });
  if (community.socialLinks?.youtube) links.push({ icon: 'logo-youtube', url: community.socialLinks.youtube });
  if (community.socialLinks?.tiktok)
    links.push({ icon: 'logo-tiktok', url: `https://tiktok.com/@${community.socialLinks.tiktok.replace('@', '')}` });
  if (!links.length) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
      {links.map(({ icon, url }) => (
        <M3Button
          key={url}
          variant="tonal"
          onPress={() => openExternalUrl(url)}
          style={{ width: 44, height: 44, borderRadius: 12, paddingHorizontal: 0 }}
        >
          <Ionicons name={icon} size={20} color={m3Colors.primary} />
        </M3Button>
      ))}
    </View>
  );
}

export const sc = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 24,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 18, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  actionText: { fontSize: 13, fontFamily: FontFamily.bold },
});

export const ts = StyleSheet.create({
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabPillLabel: {},
  tabPillBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tabPillBadgeText: {},
});

export const er = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontFamily: FontFamily.semibold, lineHeight: 20 },
  meta: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  pricePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 },
  priceText: { fontSize: 11, fontFamily: FontFamily.bold },
});

export const mr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontFamily: FontFamily.bold },
  name: { fontSize: 15, fontFamily: FontFamily.semibold },
  meta: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
});

export const col = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' } as object,
      default: {},
    }),
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  iconBox: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { flex: 1, fontSize: 15, fontFamily: FontFamily.semibold },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontFamily: FontFamily.bold },
  body: { padding: 14, gap: 8 },
});

export const inf = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 12, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  value: { fontSize: 14, fontFamily: FontFamily.medium, flex: 1.5, textAlign: 'right' },
});

export const reg = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
  },
  avatar: { width: 38, height: 38, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontFamily: FontFamily.bold },
  name: { fontSize: 14, fontFamily: FontFamily.semibold },
  sub: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontFamily: FontFamily.semibold },
});
