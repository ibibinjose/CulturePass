import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, shadows } from '@/design-system/tokens/theme';
import type { EventData } from '@/shared/schema';

export type AttendeePreview = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export function ProfileFeedEventCard({
  event,
  colors,
  isSaved,
  rsvpStatus,
  attendeesPreview,
  onToggleSave,
  onRsvp,
  index = 0,
}: {
  event: EventData;
  colors: ReturnType<typeof useColors>;
  isSaved: boolean;
  rsvpStatus: 'going' | 'maybe' | 'not_going' | null;
  attendeesPreview: AttendeePreview[];
  onToggleSave: () => void;
  onRsvp: (status: 'going' | 'maybe' | 'not_going') => void;
  index?: number;
}) {
  const uri = event.heroImageUrl ?? event.imageUrl;
  const attendees = Math.max(0, event.attending ?? 0);
  
  const attendeePreview = useMemo(() => {
    if (attendeesPreview.length > 0) {
      return attendeesPreview.slice(0, 3).map((a, i) => ({
        key: a.id,
        initials: (a.name || 'CP').split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase(),
        avatarUrl: a.avatarUrl ?? null,
        bg: i === 0 ? '#2563EB' : i === 1 ? '#0EA5E9' : '#14B8A6',
      }));
    }
    const words = (event.title ?? 'Culture Pass').split(/\s+/).filter(Boolean);
    const base = words.length > 0 ? words : ['Culture', 'Pass'];
    return [0, 1, 2].map((i) => ({
      key: `${event.id}-${i}`,
      initials: (base[i % base.length] ?? 'CP').slice(0, 2).toUpperCase(),
      avatarUrl: null,
      bg: i === 0 ? '#2563EB' : i === 1 ? '#0EA5E9' : '#14B8A6',
    }));
  }, [event.id, event.title, attendeesPreview]);

  const rsvpOptions: { key: 'going' | 'maybe' | 'not_going'; label: string }[] = [
    { key: 'going', label: 'Going' },
    { key: 'maybe', label: 'Maybe' },
    { key: 'not_going', label: 'Not going' },
  ];

  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 80).springify().damping(16) : undefined}>
      <View style={[pf.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => router.push(`/event/${event.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open event ${event.title}`}
        >
          {uri ? (
            <Image source={{ uri }} style={pf.image} contentFit="cover" />
          ) : (
            <View style={[pf.image, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="calendar-outline" size={22} color={CultureTokens.indigo} />
            </View>
          )}
        </Pressable>
        <View style={pf.body}>
          <Text style={[pf.title, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
          <Text style={[pf.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {[event.date, event.time, event.city].filter(Boolean).join(' · ')}
          </Text>
          <View style={pf.row}>
            <View style={[pf.pill, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
              <Text style={[pf.pillText, { color: colors.textSecondary }]}>{attendees} going</Text>
            </View>
            {rsvpStatus ? (
              <View style={[pf.pill, { borderColor: CultureTokens.indigo + '55', backgroundColor: CultureTokens.indigo + '10' }]}>
                <Text style={[pf.pillText, { color: CultureTokens.indigo }]}>RSVP: {rsvpStatus.replace('_', ' ')}</Text>
              </View>
            ) : null}
          </View>
          
          <View style={pf.attendeeRow}>
            <View style={pf.avatarStack}>
              {attendeePreview.map((a, i) => (
                <View
                  key={a.key}
                  style={[
                    pf.avatarMini,
                    { backgroundColor: a.bg, borderColor: colors.surface, marginLeft: i === 0 ? 0 : -10 },
                  ]}
                >
                  {a.avatarUrl ? (
                    <Image source={{ uri: a.avatarUrl }} style={pf.avatarMiniImage} contentFit="cover" />
                  ) : (
                    <Text style={pf.avatarMiniText}>{a.initials}</Text>
                  )}
                </View>
              ))}
            </View>
            <Text style={[pf.attendeeCaption, { color: colors.textTertiary }]}>Attendee preview</Text>
          </View>

          <View style={pf.actions}>
            <View style={[pf.rsvpGroup, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}>
              {rsvpOptions.map((opt) => {
                const active = rsvpStatus === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => onRsvp(opt.key)}
                    style={[pf.rsvpOption, active && { backgroundColor: CultureTokens.indigo }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${opt.label} for ${event.title}`}
                  >
                    <Text style={[pf.rsvpOptionText, { color: active ? '#fff' : colors.text }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={onToggleSave}
              style={[pf.actionBtnGhost, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}
              accessibilityRole="button"
              accessibilityLabel={`${isSaved ? 'Remove saved' : 'Save'} ${event.title}`}
            >
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={14} color={colors.text} />
              <Text style={[pf.actionGhostText, { color: colors.text }]}>{isSaved ? 'Saved' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export const pf = StyleSheet.create({
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 1 },
      web: shadows.small,
      default: {},
    }),
  },
  image: {
    width: '100%',
    height: 138,
    backgroundColor: '#ececf2',
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
  },
  title: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    lineHeight: 19,
  },
  meta: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  actions: {
    marginTop: 3,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarMiniImage: {
    width: '100%',
    height: '100%',
  },
  avatarMiniText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: FontFamily.bold,
  },
  attendeeCaption: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  rsvpGroup: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  rsvpOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  rsvpOptionText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  actionBtnGhost: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionGhostText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});
