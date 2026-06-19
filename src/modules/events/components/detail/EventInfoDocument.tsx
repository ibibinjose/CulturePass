import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { M3Button, M3Card } from '@/design-system/ui';
import { useM3Colors } from '@/hooks/useM3Colors';
import { FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { formatEventDateTimeRange } from '@/lib/dateUtils';
import {
  DISPLAY_FALLBACK,
  formatEventFullAddress,
  isFallbackValue,
  resolveEventCategoryLabel,
  resolveEventTypeLabel,
} from '@/lib/presentation';
import { pressableA11yRole } from '@/lib/webPressable';
import type { EventData } from '@/shared/schema';
import type { ResolvedEventOrganizer } from '@/modules/events/components/detail/utils';
import { EventShareActions } from '@/modules/events/components/detail/EventShareActions';

function DocField({
  label,
  value,
  muted,
  children,
}: {
  label: string;
  value?: string;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  const m3Colors = useM3Colors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, M3Typography.labelMedium, { color: m3Colors.onSurfaceVariant }]}>
        {label}
      </Text>
      {children ?? (
        <Text
          style={[
            styles.fieldValue,
            M3Typography.bodyLarge,
            {
              color: muted ? m3Colors.onSurfaceVariant : m3Colors.onSurface,
              fontStyle: muted ? 'italic' : 'normal',
            },
          ]}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

export type EventInfoDocumentProps = {
  event: EventData;
  organizer: ResolvedEventOrganizer | null;
  /** Resolved display name — never a raw profile/uid string. */
  organiserName: string;
  hostCommunityPathId?: string | null;
  shareUrl: string;
  canContactOrganizer: boolean;
  contactPending: boolean;
  onContactOrganiser: () => void;
  onAddToCalendar: () => void;
  calendarPending?: boolean;
};

export function EventInfoDocument({
  event,
  organizer,
  organiserName,
  hostCommunityPathId,
  shareUrl,
  canContactOrganizer,
  contactPending,
  onContactOrganiser,
  onAddToCalendar,
  calendarPending,
}: EventInfoDocumentProps) {
  const m3Colors = useM3Colors();

  const organiserMuted =
    organiserName === DISPLAY_FALLBACK.organisedBy
    || organiserName === DISPLAY_FALLBACK.organiserLoading;

  const dateTimeRange = formatEventDateTimeRange(event);
  const dateMuted = !event.date?.trim();

  const location = formatEventFullAddress(event);
  const locationMuted = isFallbackValue(location, DISPLAY_FALLBACK.location);

  const eventTypeLabel = resolveEventTypeLabel(event);
  const eventTypeMuted = eventTypeLabel === DISPLAY_FALLBACK.eventType;

  const categoryLabel = resolveEventCategoryLabel(event);
  const categoryMuted = categoryLabel === DISPLAY_FALLBACK.category;

  const organiserRow = hostCommunityPathId ? (
    <Pressable
      onPress={() => router.push({ pathname: '/c/[id]', params: { id: hostCommunityPathId } })}
      accessibilityRole={pressableA11yRole('link')}
      accessibilityLabel={`Open ${organiserName} community`}
      style={({ pressed }) => [
        styles.organiserLink,
        pressed && { opacity: 0.88 },
        Platform.OS === 'web' && { cursor: 'pointer' as const },
      ]}
    >
      <Text style={[styles.fieldValue, M3Typography.bodyLarge, { color: m3Colors.primary }]}>
        {organiserName}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={m3Colors.primary} />
    </Pressable>
  ) : (
    <Text
      style={[
        styles.fieldValue,
        M3Typography.bodyLarge,
        { color: organiserMuted ? m3Colors.onSurfaceVariant : m3Colors.onSurface, fontStyle: organiserMuted ? 'italic' : 'normal' },
      ]}
    >
      {organiserName}
    </Text>
  );

  return (
    <M3Card variant="filled" style={[styles.card, { borderColor: m3Colors.outlineVariant }]}>
      <DocField label="Organised by">{organiserRow}</DocField>

      <M3Button
        variant="filled"
        leftIcon="chatbubble-outline"
        onPress={onContactOrganiser}
        loading={contactPending}
        fullWidth
      >
        Contact Organiser
      </M3Button>

      <View style={[styles.divider, { backgroundColor: m3Colors.outlineVariant }]} />

      <DocField
        label="Date And Time"
        value={dateTimeRange}
        muted={dateMuted}
      />
      <DocField label="Location" value={location} muted={locationMuted} />
      <DocField label="Event Types" value={eventTypeLabel} muted={eventTypeMuted} />
      <DocField label="Event Category" value={categoryLabel} muted={categoryMuted} />

      <View style={[styles.divider, { backgroundColor: m3Colors.outlineVariant }]} />

      <M3Button
        variant="tonal"
        leftIcon="calendar-outline"
        onPress={onAddToCalendar}
        loading={calendarPending}
        fullWidth
      >
        Add to Calendar
      </M3Button>

      <EventShareActions title={event.title} shareUrl={shareUrl} />
    </M3Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldValue: {
    fontFamily: FontFamily.medium,
    lineHeight: 24,
  },
  organiserLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});