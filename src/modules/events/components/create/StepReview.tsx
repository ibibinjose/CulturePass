import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { CULTURE_TODAY_EVENT_TAG, CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';
import { useColors } from '@/hooks/useColors';
import { formatDateForCountry } from '@/lib/dateUtils';
import { FormData, EVENT_TYPES } from './types';
import { ReviewRow } from './ReviewRow';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  availableCultures: { id: string; label: string }[];
  publishError: string | null;
}

export function StepReview({ form, colors, s, availableCultures, publishError }: Props) {
  return (
    <View style={s.fields}>
      {form.heroImageUrl ? (
        <Image
          source={{ uri: form.heroImageUrl }}
          style={s.reviewImage}
          contentFit="cover"
          accessibilityLabel="Event image preview"
        />
      ) : null}

      <ReviewRow label="Title" value={form.title} colors={colors} />
      <ReviewRow
        label="Type"
        value={EVENT_TYPES.find((t) => t.id === form.eventType)?.label ?? '—'}
        colors={colors}
      />
      <ReviewRow label="Visibility" value={form.visibility} colors={colors} />
      <ReviewRow
        label="Format"
        value={[
          form.locationType,
          form.locationType !== 'physical' && form.meetingLink ? 'virtual link added' : null,
        ].filter(Boolean).join(' · ')}
        colors={colors}
      />
      <ReviewRow
        label="Publishing as"
        value={
          form.publisherProfileId
            ? form.publisherLabel || 'Selected profile'
            : 'Your account (no directory profile)'
        }
        colors={colors}
      />
      <ReviewRow
        label="Location"
        value={[
          form.useLinkedVenue && form.venueProfileLabel ? `Venue page: ${form.venueProfileLabel}` : null,
          [form.venue, form.city, form.country].filter(Boolean).join(', '),
        ]
          .filter(Boolean)
          .join(' · ')}
        colors={colors}
      />
      <ReviewRow
        label="Dates"
        value={[
          form.date ? formatDateForCountry(form.date, form.country) : '—',
          form.endDate ? `→ ${formatDateForCountry(form.endDate, form.country)}` : '',
          form.time ? `at ${form.time}` : '',
          form.timezone ? `(${form.timezone})` : '',
        ].filter(Boolean).join(' ')}
        colors={colors}
      />
      <ReviewRow
        label="Entry"
        value={
          form.entryType === 'ticketed'
            ? `Ticketed — ${form.tiers.length} tier(s)`
            : 'Free / Open Entry'
        }
        colors={colors}
      />
      <ReviewRow
        label="Settings"
        value={[
          form.requireApproval ? 'approval required' : null,
          form.waitlistEnabled ? 'waitlist on' : null,
          form.sendReminders ? 'reminders on' : 'reminders off',
          form.maxTicketsPerOrder ? `max ${form.maxTicketsPerOrder} tickets/order` : null,
        ].filter(Boolean).join(' · ')}
        colors={colors}
      />
      {form.customQuestions.length > 0 ? (
        <ReviewRow label="Registration Questions" value={form.customQuestions.join(', ')} colors={colors} />
      ) : null}
      {(form.vibe || form.audience) ? (
        <ReviewRow
          label="Discovery"
          value={[form.vibe ? `Vibe: ${form.vibe}` : null, form.audience ? `Audience: ${form.audience}` : null].filter(Boolean).join(' · ')}
          colors={colors}
        />
      ) : null}
      {form.artists.length > 0 && (
        <ReviewRow label="Artists" value={form.artists.map((a) => a.name).join(', ')} colors={colors} />
      )}
      {form.sponsors.length > 0 && (
        <ReviewRow label="Sponsors" value={form.sponsors.map((sp) => sp.name).join(', ')} colors={colors} />
      )}
      {form.hostInfo.name ? (
        <ReviewRow label="Host" value={form.hostInfo.name} colors={colors} />
      ) : null}
      {form.cultureTagIds.length > 0 && (
        <ReviewRow
          label="Cultures"
          value={form.cultureTagIds.map((id) => availableCultures.find((c) => c.id === id)?.label ?? id).join(', ')}
          colors={colors}
        />
      )}
      {form.cultureTodayPromo ? (
        <ReviewRow label="Culture Today" value={`Tagged “${CULTURE_TODAY_EVENT_TAG}” for the calendar`} colors={colors} />
      ) : null}
      {form.cultureXInvite ? (
        <ReviewRow
          label="CultureX"
          value={`Inviting Culture Explores — tagged “${CULTUREX_EXPLORES_CULTURE_TAG}” for discovery`}
          colors={colors}
        />
      ) : null}

      <View style={[s.infoBox, { backgroundColor: CultureTokens.gold + '15', borderColor: CultureTokens.gold + '40', marginTop: 8 }]}>
        <Ionicons name="rocket-outline" size={18} color={CultureTokens.gold} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          Your event will be published immediately and appear in Discover.
        </Text>
      </View>

      {publishError ? (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50', marginTop: 12 }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[s.errorBannerText, { color: colors.error }]}>{publishError}</Text>
        </View>
      ) : null}
    </View>
  );
}
