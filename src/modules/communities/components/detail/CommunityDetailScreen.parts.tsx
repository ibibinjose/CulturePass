import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';

import { M3Card, M3FilterChip, M3SectionHeader, M3TopAppBar } from '@/design-system/ui';
import { pressableA11yRole } from '@/lib/webPressable';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useSafeBack } from '@/lib/navigation';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { routeUser } from '@/lib/publicPaths';
import {
  communityDetailHaptic,
  communityMemberPublicProfileSegment,
  showUnavailableMemberProfileNotice,
  type CommunityMemberItem,
} from '@/modules/communities/components/detail/communityDetailUtils';
import type { Community, EventData } from '@/shared/schema';
import { CommunityEventCard } from '@/modules/communities/components/detail/CommunityEventCard';
import { resolveSocialUrl, type SocialPlatformKey } from '@/shared/utils/socialLinks';
import { DISPLAY_FALLBACK, displayOrFallback, isFallbackValue } from '@/lib/presentation';

const haptic = communityDetailHaptic;
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
  accent,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  accent?: string;
  onPress: () => void;
}) {
  const m3Colors = useM3Colors();
  const activeBg = accent ? `${accent}18` : m3Colors.secondaryContainer;
  const activeText = accent ?? m3Colors.onSecondaryContainer;
  const activeBorder = accent ? `${accent}40` : 'transparent';

  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress();
      }}
      style={[
        ts.tabPill,
        {
          backgroundColor: active ? activeBg : 'transparent',
          borderColor: active ? activeBorder : m3Colors.outlineVariant,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole={pressableA11yRole('tab')}
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          ts.tabPillLabel,
          M3Typography.labelLarge,
          {
            color: active ? activeText : m3Colors.onSurfaceVariant,
            fontFamily: active ? FontFamily.semibold : FontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
      {count != null ? (
        <View
          style={[
            ts.tabPillBadge,
            {
              backgroundColor: active
                ? (accent ? `${accent}22` : m3Colors.onSecondaryContainer + '20')
                : m3Colors.primaryContainer,
            },
          ]}
        >
          <Text
            style={[
              ts.tabPillBadgeText,
              {
                color: active
                  ? (accent ?? m3Colors.onSecondaryContainer)
                  : m3Colors.onPrimaryContainer,
              },
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
      <View style={{ padding: 22, gap: 4 }}>
        <M3SectionHeader
          title={title}
          subtitle={subtitle}
          onAction={action?.onPress}
          actionLabel={action?.label}
        />
        <View style={{ marginTop: 10, gap: 2 }}>{children}</View>
      </View>
    </M3Card>
  );
}

/** @deprecated Use CommunityEventCard — kept for legacy imports */
export function EventRow({ event, accent = '#5B4FCF' }: { event: EventData; accent?: string }) {
  return <CommunityEventCard event={event} accent={accent} variant="compact" />;
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
      accessibilityRole={pressableA11yRole('link')}
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
        accessibilityRole={pressableA11yRole('button')}
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

export function InfoRow({
  label,
  value,
  fallback = DISPLAY_FALLBACK.notListed,
}: {
  label: string;
  value?: string | null;
  fallback?: string;
}) {
  const m3Colors = useM3Colors();
  const display = displayOrFallback(value, fallback);
  const muted = isFallbackValue(display, fallback);
  return (
    <View style={[inf.row, { borderColor: m3Colors.outlineVariant }]}>
      <Text style={[inf.label, M3Typography.labelMedium, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
      <Text
        style={[
          inf.value,
          M3Typography.bodyMedium,
          { color: muted ? m3Colors.onSurfaceVariant : m3Colors.onSurface },
          muted && inf.valueFallback,
        ]}
      >
        {display}
      </Text>
    </View>
  );
}

export function ChipRow({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  const m3Colors = useM3Colors();
  if (!items.length) {
    if (!emptyLabel) return null;
    return (
      <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, lineHeight: 22 }]}>
        {emptyLabel}
      </Text>
    );
  }
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
  const push = (icon: keyof typeof Ionicons.glyphMap, raw: string | undefined | null, key: SocialPlatformKey) => {
    const url = resolveSocialUrl(raw, key);
    if (url) links.push({ icon, url });
  };
  push('globe-outline', community.website, 'website');
  push('logo-instagram', community.instagram, 'instagram');
  push('logo-facebook', community.facebook, 'facebook');
  push('logo-twitter', community.socialLinks?.twitter, 'twitter');
  push('logo-youtube', community.socialLinks?.youtube ?? community.youtube, 'youtube');
  push('logo-tiktok', community.socialLinks?.tiktok ?? community.tiktok, 'tiktok');
  if (!links.length) {
    return (
      <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, marginTop: 12, lineHeight: 20 }]}>
        {DISPLAY_FALLBACK.noSocialLinks}
      </Text>
    );
  }
  return (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
      {links.map(({ icon, url }) => (
        <Pressable
          key={url}
          onPress={() => openExternalUrl(url)}
          accessibilityRole={pressableA11yRole('link')}
          accessibilityLabel={`Open ${url}`}
          style={({ pressed }) => [
            sc.socialIconBtn,
            {
              backgroundColor: m3Colors.secondaryContainer,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons name={icon} size={20} color={m3Colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

export const sc = StyleSheet.create({
  socialIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    paddingVertical: 11,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
  },
  tabPillLabel: {},
  tabPillBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tabPillBadgeText: {},
});

export const mr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontFamily: FontFamily.bold },
  name: { fontSize: 15, fontFamily: FontFamily.semibold, lineHeight: 20 },
  meta: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 4, lineHeight: 17 },
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
  valueFallback: { fontStyle: 'italic' },
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
