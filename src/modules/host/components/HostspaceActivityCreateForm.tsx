import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api, ApiError, type ActivityInput } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DateField } from './fields/DateField';
import { MediaUploadField } from './fields/MediaUploadField';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  ButtonTokens,
  CultureTokens,
  InputTokens,
  Radius,
  Spacing,
  TextStyles,
  type ColorTheme,
} from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';

const CATEGORIES = [
  // Arts & Culture
  'Dance / Movement',
  'Arts & Crafts',
  'Music / Jamming Session',
  'Film Screening',
  'Comedy / Improv',
  'Theatre / Drama',
  // Lifestyle
  'Food & Dining Experience',
  'Nightlife Social',
  'Shopping Tour / Market',
  // Wellness
  'Wellness / Yoga',
  'Meditation & Mindfulness',
  'Sports & Recreation',
  'Fitness & Training',
  // Learning
  'Cultural Workshop',
  'Language Class',
  'Heritage Walk / Tour',
  'Monument / Site Visit',
  // Community
  'Festival / Celebration',
  'Networking Meetup',
  'Family & Kids',
  'Charity Event',
  // Other
  'Travel Experience',
  'Others',
];

const CULTURES = [
  'Malayalee',
  'Tamil',
  'Chinese',
  'Filipino',
  'Indian',
  'Vietnamese',
  'Korean',
  'Lebanese',
  'Greek',
  'Italian',
  'Indigenous Australian',
];

const LANGUAGES = ['English', 'Malayalam', 'Mandarin', 'Tagalog', 'Hindi', 'Cantonese', 'Tamil', 'Arabic', 'Korean'];
const TAGS = ['Onam', 'Diwali', 'Lunar New Year', 'Christmas', 'Eid', 'Harmony Week', 'Food', 'Family'];
const INCLUSIONS = ['Materials provided', 'Food & refreshments', 'Certificate', 'Recording access'];

type Sponsor = {
  id: string;
  name: string;
  tier: string;
  website?: string;
};

type ActivityDraft = {
  title: string;
  handle: string;
  shortDescription: string;
  fullDescription: string;
  categories: string[];
  primaryCulture: string;
  language: string;
  culturalTags: string[];
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  recurrence: 'One-time' | 'Weekly' | 'Monthly' | 'Custom recurrence';
  locationType: 'In-person' | 'Online' | 'Hybrid';
  venueAddress: string;
  venueName: string;
  meetingLink: string;
  maxParticipants: string;
  pricingModel: 'Free' | 'Paid' | 'Donation / Pay-what-you-want' | 'Members-only';
  price: string;
  earlyBird: string;
  coverImage: string;
  gallery: string;
  promoVideo: string;
  inclusions: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  ageGroup: 'All ages' | 'Kids' | 'Youth' | 'Adults' | 'Seniors';
  hostName: string;
  coHosts: string;
  contact: string;
  visibility: 'Public' | 'Community-only' | 'Invite-only';
  approvalRequired: boolean;
  communities: string;
  city: string;
  country: string;
  sponsors: Sponsor[];
};

const INITIAL_DRAFT: ActivityDraft = {
  title: '',
  handle: '',
  shortDescription: '',
  fullDescription: '',
  categories: [],
  primaryCulture: '',
  language: 'English',
  culturalTags: [],
  startDateTime: '',
  endDateTime: '',
  timeZone: 'Australia/Sydney',
  recurrence: 'One-time',
  locationType: 'In-person',
  venueAddress: '',
  venueName: '',
  meetingLink: '',
  maxParticipants: '',
  pricingModel: 'Free',
  price: '',
  earlyBird: '',
  coverImage: '',
  gallery: '',
  promoVideo: '',
  inclusions: [],
  difficulty: 'All Levels',
  ageGroup: 'All ages',
  hostName: '',
  coHosts: '',
  contact: '',
  visibility: 'Public',
  approvalRequired: false,
  communities: '',
  city: 'Sydney',
  country: 'Australia',
  sponsors: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function buildDescription(draft: ActivityDraft) {
  const meta = [
    draft.primaryCulture ? `Culture: ${draft.primaryCulture}` : null,
    draft.language ? `Language: ${draft.language}` : null,
    draft.startDateTime ? `Starts: ${draft.startDateTime}` : null,
    draft.locationType ? `Location type: ${draft.locationType}` : null,
    draft.venueName || draft.venueAddress ? `Venue: ${draft.venueName || draft.venueAddress}` : null,
    draft.maxParticipants ? `Capacity: ${draft.maxParticipants}` : null,
    draft.inclusions.length ? `Included: ${draft.inclusions.join(', ')}` : null,
  ].filter(Boolean);
  return [draft.fullDescription || draft.shortDescription, meta.join('\n')].filter(Boolean).join('\n\n');
}

function makeActivityPayload(draft: ActivityDraft, status: 'draft' | 'published'): ActivityInput {
  const payload: ActivityInput = {
    name: draft.title.trim(),
    description: buildDescription(draft),
    category: draft.categories[0] ?? 'Cultural Workshop',
    city: draft.city.trim() || 'Sydney',
    country: draft.country.trim() || 'Australia',
    ageGroup: draft.ageGroup,
    highlights: [
      draft.primaryCulture,
      draft.language,
      ...draft.culturalTags,
      ...draft.inclusions,
      draft.difficulty,
      draft.visibility,
    ].filter(Boolean),
    status,
    // ── Rich class & fitness fields (now persisted) ──
    recurrence: draft.recurrence,
    difficulty: draft.difficulty,
    instructorName: draft.hostName?.trim() || undefined,
    locationType: draft.locationType,
    primaryCulture: draft.primaryCulture || undefined,
    visibility: draft.visibility,
    maxParticipants: draft.maxParticipants || undefined,
  };

  // Build a nice human schedule text for display in rails/cards
  const timePart = draft.startDateTime?.trim();
  const durPart = draft.endDateTime?.trim() ? ` · ${draft.endDateTime.trim()}` : '';
  const recPart = draft.recurrence && draft.recurrence !== 'One-time' ? ` · ${draft.recurrence}` : '';
  const scheduleText = timePart ? `${timePart}${durPart}${recPart}` : draft.recurrence;
  if (scheduleText) payload.scheduleText = scheduleText;

  const imageUrl = draft.coverImage.trim();
  const location = draft.venueName.trim() || draft.venueAddress.trim();
  const priceLabel = draft.pricingModel === 'Paid' && draft.price.trim() ? draft.price.trim() : draft.pricingModel;
  const duration = draft.endDateTime.trim() ? `${draft.startDateTime} - ${draft.endDateTime}` : draft.startDateTime;

  if (imageUrl) payload.imageUrl = imageUrl;
  if (location) payload.location = location;
  if (priceLabel) payload.priceLabel = priceLabel;
  if (duration) payload.duration = duration;

  return payload;
}

const MujiColors = {
  bg: '#FAF8F5',
  card: '#F6F1EA',
  border: '#DED8CE',
  text: '#3C3A35',
  textMuted: '#8E877E',
  accent: '#7D7060',
  accentLight: '#EFEAE0',
  white: '#FFFFFF',
  accentDark: '#4A4135'
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderColor: MujiColors.border, backgroundColor: MujiColors.card }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: MujiColors.accentLight, borderRadius: 8 }]}>
          <Ionicons name={icon} size={18} color={MujiColors.accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: MujiColors.text, fontFamily: 'Poppins_700Bold' }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: MujiColors.text, fontFamily: 'Poppins_600SemiBold' }]}>
          {label}
          {required ? <Text style={{ color: '#C08A7C' }}> *</Text> : null}
        </Text>
        {hint ? <Text style={[styles.hint, { color: MujiColors.textMuted }]}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function FormInput({ ...props }: TextInput['props']) {
  return (
    <TextInput
      placeholderTextColor={MujiColors.textMuted}
      style={[
        styles.input,
        {
          backgroundColor: MujiColors.white,
          borderColor: MujiColors.border,
          color: MujiColors.text,
        },
        props.multiline && styles.textarea,
        props.style,
      ]}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

function DraftInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={MujiColors.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : undefined}
      style={[
        multiline ? styles.textarea : styles.input,
        {
          borderColor: MujiColors.border,
          backgroundColor: MujiColors.white,
          color: MujiColors.text
        },
      ]}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${label}`}
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? MujiColors.accent : MujiColors.white,
            borderColor: selected ? MujiColors.accent : MujiColors.border,
            borderRadius: 8,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? MujiColors.white : MujiColors.text, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function SingleChoice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map((option) => (
        <ChoiceChip key={option} label={option} selected={value === option} onPress={() => onChange(option)} />
      ))}
    </View>
  );
}

function MultiChoice({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map((option) => (
        <ChoiceChip
          key={option}
          label={option}
          selected={values.includes(option)}
          onPress={() => onChange(toggleValue(values, option))}
        />
      ))}
    </View>
  );
}

function ActivityPreview({ draft, colors }: { draft: ActivityDraft; colors: ColorTheme }) {
  const title = draft.title.trim() || 'Create New Activity';
  const category = draft.categories[0] ?? 'Cultural Workshop';
  const dateLine = draft.startDateTime || 'Start date and time';
  const locationLine = draft.locationType === 'Online' ? 'Online' : draft.venueName || draft.city || 'Sydney';

  return (
    <GlassView intensity={10} style={[styles.previewPanel, { borderColor: colors.borderLight, backgroundColor: colors.background + '40' }]}>
      <View style={[styles.previewImage, { backgroundColor: CultureTokens.indigo }]}>
        <Ionicons name="bicycle-outline" size={34} color="#FFFFFF" />
      </View>
      <View style={styles.previewContent}>
        <View style={styles.previewTopRow}>
          <Text style={[styles.previewBadge, { color: CultureTokens.coral }]}>{category.toUpperCase()}</Text>
          <Text style={[styles.previewBadge, { color: CultureTokens.teal }]}>{draft.language.toUpperCase() || 'ENGLISH'}</Text>
        </View>
        <Text style={[styles.previewTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.previewDate, { color: colors.eventDate }]}>{dateLine}</Text>
        <Text style={[styles.previewBody, { color: colors.textSecondary }]} numberOfLines={3}>
          {draft.shortDescription || draft.fullDescription || 'Design memorable cultural experiences for your community.'}
        </Text>
        <View style={styles.previewMetaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>{locationLine}</Text>
        </View>
        <View style={styles.previewMetaRow}>
          <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
            {draft.maxParticipants || 'Capacity'} | {draft.pricingModel}
          </Text>
        </View>
      </View>
      <View style={[styles.calendarPreview, { borderColor: colors.borderLight, backgroundColor: colors.surface + '40' }]}>
        <Text style={[styles.calendarMonth, { color: CultureTokens.indigo }]}>CAL</Text>
        <Text style={[styles.calendarDay, { color: colors.text }]}>{draft.startDateTime ? draft.startDateTime.slice(8, 10) || '01' : '01'}</Text>
        <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>{draft.recurrence}</Text>
      </View>
    </GlassView>
  );
}

export function HostspaceActivityCreateForm({ onReview }: { onReview?: () => void }) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const { user } = useAuth();
  const [draft, setDraft] = useState<ActivityDraft>(INITIAL_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<'draft' | 'published' | null>(null);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [newSponsor, setNewSponsor] = useState<Sponsor>({ id: '', name: '', tier: 'gold' });
  const showPreview = true;

  const parseDateTime = (dateTimeStr: string) => {
    const parts = dateTimeStr ? dateTimeStr.split(' ') : [];
    return {
      date: parts[0] || '',
      time: parts[1] || '',
    };
  };

  const startVal = parseDateTime(draft.startDateTime);
  const endVal = parseDateTime(draft.endDateTime);

  const handlePath = useMemo(() => `/a/${draft.handle || slugify(draft.title) || 'your-activity-name'}`, [draft.handle, draft.title]);

  const updateDraft = (patch: Partial<ActivityDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const addSponsor = () => {
    if (!newSponsor.name.trim()) return;
    const sponsorWithId = { ...newSponsor, id: Math.random().toString(36).substr(2, 9) };
    updateDraft({ sponsors: [...draft.sponsors, sponsorWithId] });
    setNewSponsor({ id: '', name: '', tier: 'gold' });
    setShowSponsorForm(false);
  };

  const removeSponsor = (id: string) => {
    updateDraft({ sponsors: draft.sponsors.filter((s) => s.id !== id) });
  };

  const setTitle = (title: string) => {
    setDraft((prev) => ({
      ...prev,
      title,
      handle: prev.handle && prev.handle !== slugify(prev.title) ? prev.handle : slugify(title),
    }));
  };

  const validate = () => {
    if (!draft.title.trim()) return 'Add an activity title.';
    if (!draft.shortDescription.trim() && !draft.fullDescription.trim()) return 'Add a short or full description.';
    if (!draft.categories.length) return 'Select at least one activity category.';
    if (!draft.primaryCulture.trim()) return 'Choose a primary culture.';
    if (!draft.language.trim()) return 'Choose a language.';
    if (!draft.startDateTime.trim()) return 'Add a start date and time.';
    if (!draft.maxParticipants.trim()) return 'Add maximum participants.';
    return null;
  };

  const saveActivity = async (status: 'draft' | 'published') => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Activity needs a little more detail', validationError);
      return;
    }

    setIsSaving(true);
    try {
      const created = await api.activities.create(makeActivityPayload(draft, status));
      setLastSaved(status);
      Alert.alert(status === 'draft' ? 'Draft saved' : 'Activity published', `${created.name} is now ${status}.`);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        Alert.alert('Sign in required', 'Please sign in again to continue creating activities.');
      } else if (err instanceof ApiError && err.isForbidden) {
        Alert.alert('Organizer access needed', 'Activities require a business, organizer, or admin account.');
      } else {
        Alert.alert('Could not save activity', err instanceof Error ? err.message : 'Please try again in a moment.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={[styles.eyebrow, { color: CultureTokens.coral }]}>HostSpace activity</Text>
        <Text style={[styles.title, { color: colors.text }]}>Create New Activity</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Design memorable cultural experiences for your community
        </Text>
      </View>

      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.formColumn}>
          <Section title="Basic Information" icon="create-outline">
            <Field label="Activity Title" required>
              <DraftInput value={draft.title} onChangeText={setTitle} placeholder="Onam cooking workshop" accessibilityLabel="Activity title" />
            </Field>
            <Field label="Activity Handle" hint={handlePath}>
              <DraftInput
                value={draft.handle}
                onChangeText={(handle) => updateDraft({ handle: slugify(handle) })}
                placeholder="your-activity-name"
                accessibilityLabel="Activity handle"
              />
            </Field>
            <Field label="Short Description" hint={`${draft.shortDescription.length}/120`}>
              <DraftInput
                value={draft.shortDescription}
                onChangeText={(value) => updateDraft({ shortDescription: value.slice(0, 120) })}
                placeholder="A one-line preview for Explore and Activities"
                accessibilityLabel="Short description"
              />
            </Field>
            <Field label="Full Description">
              <DraftInput
                value={draft.fullDescription}
                onChangeText={(fullDescription) => updateDraft({ fullDescription })}
                placeholder="Tell guests what they will learn, share, make, taste, or experience."
                multiline
                accessibilityLabel="Full description"
              />
            </Field>
          </Section>

          <Section title="Activity Type & Culture" icon="sparkles-outline">
            <Field label="Activity Category" required>
              <MultiChoice options={CATEGORIES} values={draft.categories} onChange={(categories) => updateDraft({ categories })} />
            </Field>
            <Field label="Primary Culture" required>
              <MultiChoice
                options={CULTURES}
                values={draft.primaryCulture ? [draft.primaryCulture] : []}
                onChange={(values) => updateDraft({ primaryCulture: values[values.length - 1] ?? '' })}
              />
            </Field>
            <Field label="Language" required>
              <MultiChoice
                options={LANGUAGES}
                values={draft.language ? [draft.language] : []}
                onChange={(values) => updateDraft({ language: values[values.length - 1] ?? '' })}
              />
            </Field>
            <Field label="Cultural Tags">
              <MultiChoice options={TAGS} values={draft.culturalTags} onChange={(culturalTags) => updateDraft({ culturalTags })} />
            </Field>
          </Section>

          <Section title="Date & Time" icon="time-outline">
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <DateField
                  label="Start Date"
                  value={startVal.date}
                  onChange={(date) => {
                    const timePart = startVal.time || '10:30';
                    updateDraft({ startDateTime: `${date} ${timePart}`.trim() });
                  }}
                  allowFutureDates={true}
                  required
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Start Time" required>
                  <FormInput
                    value={startVal.time}
                    onChangeText={(time) => {
                      const datePart = startVal.date || '2026-09-06';
                      updateDraft({ startDateTime: `${datePart} ${time}`.trim() });
                    }}
                    placeholder="10:30"
                    accessibilityLabel="Start time"
                  />
                </Field>
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <DateField
                  label="End Date"
                  value={endVal.date}
                  onChange={(date) => {
                    const timePart = endVal.time || '12:00';
                    updateDraft({ endDateTime: `${date} ${timePart}`.trim() });
                  }}
                  allowFutureDates={true}
                  required={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="End Time">
                  <FormInput
                    value={endVal.time}
                    onChangeText={(time) => {
                      const datePart = endVal.date || '2026-09-06';
                      updateDraft({ endDateTime: `${datePart} ${time}`.trim() });
                    }}
                    placeholder="12:00"
                    accessibilityLabel="End time"
                  />
                </Field>
              </View>
            </View>
            <Field label="Time Zone">
              <DraftInput value={draft.timeZone} onChangeText={(timeZone) => updateDraft({ timeZone })} placeholder="Australia/Sydney" accessibilityLabel="Time zone" />
            </Field>
            <Field label="Recurring Activity?">
              <SingleChoice
                options={['One-time', 'Weekly', 'Monthly', 'Custom recurrence'] as const}
                value={draft.recurrence}
                onChange={(recurrence) => updateDraft({ recurrence })}
              />
            </Field>
          </Section>

          <Section title="Location" icon="location-outline">
            <Field label="Location Type">
              <SingleChoice options={['In-person', 'Online', 'Hybrid'] as const} value={draft.locationType} onChange={(locationType) => updateDraft({ locationType })} />
            </Field>
            <Field label="Venue / Address">
              <DraftInput value={draft.venueAddress} onChangeText={(venueAddress) => updateDraft({ venueAddress })} placeholder="Searchable map picker placeholder" accessibilityLabel="Venue address" />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Venue Name">
                <DraftInput value={draft.venueName} onChangeText={(venueName) => updateDraft({ venueName })} placeholder="Community Hall" accessibilityLabel="Venue name" />
              </Field>
              <Field label="Meeting Link">
                <DraftInput value={draft.meetingLink} onChangeText={(meetingLink) => updateDraft({ meetingLink })} placeholder="https://zoom.us/..." accessibilityLabel="Meeting link" />
              </Field>
            </View>
          </Section>

          <Section title="Capacity & Pricing" icon="ticket-outline">
            <Field label="Maximum Participants" required>
              <DraftInput value={draft.maxParticipants} onChangeText={(maxParticipants) => updateDraft({ maxParticipants })} placeholder="24" accessibilityLabel="Maximum participants" />
            </Field>
            <Field label="Pricing Model">
              <SingleChoice
                options={['Free', 'Paid', 'Donation / Pay-what-you-want', 'Members-only'] as const}
                value={draft.pricingModel}
                onChange={(pricingModel) => updateDraft({ pricingModel })}
              />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Price per person">
                <DraftInput value={draft.price} onChangeText={(price) => updateDraft({ price })} placeholder="$35" accessibilityLabel="Price per person" />
              </Field>
              <Field label="Early Bird / Discount Options">
                <DraftInput value={draft.earlyBird} onChangeText={(earlyBird) => updateDraft({ earlyBird })} placeholder="10% until 30 June" accessibilityLabel="Early bird discount options" />
              </Field>
            </View>
          </Section>

          <Section title="Media & Visuals" icon="image-outline">
            <Field label="Cover Image" hint="Recommended aspect ratio 16:9">
              <MediaUploadField
                type="hero"
                value={draft.coverImage}
                onChange={(val) => updateDraft({ coverImage: val as string })}
                storagePath={`activities/${user?.id || 'anonymous'}`}
                aspectRatio={16 / 9}
              />
            </Field>
            <Field label="Gallery" hint="Up to 8 photos">
              <MediaUploadField
                type="gallery"
                value={draft.gallery ? draft.gallery.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(val) => {
                  const arr = Array.isArray(val) ? val : [val];
                  updateDraft({ gallery: arr.join(',') });
                }}
                storagePath={`activities/${user?.id || 'anonymous'}`}
                maxItems={8}
              />
            </Field>
            <Field label="Promo Video">
              <MediaUploadField
                type="video"
                value={draft.promoVideo}
                onChange={(val) => updateDraft({ promoVideo: val as string })}
                storagePath={`activities/${user?.id || 'anonymous'}`}
              />
            </Field>
          </Section>

          <Section title="Activity Details" icon="list-outline">
            <Field label="What's Included">
              <MultiChoice options={INCLUSIONS} values={draft.inclusions} onChange={(inclusions) => updateDraft({ inclusions })} />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Difficulty Level">
                <SingleChoice options={['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const} value={draft.difficulty} onChange={(difficulty) => updateDraft({ difficulty })} />
              </Field>
              <Field label="Age Group">
                <SingleChoice options={['All ages', 'Kids', 'Youth', 'Adults', 'Seniors'] as const} value={draft.ageGroup} onChange={(ageGroup) => updateDraft({ ageGroup })} />
              </Field>
            </View>
          </Section>

          <Section title="Organizer & Host" icon="people-outline">
            <View style={styles.twoCol}>
              <Field label="Host Name">
                <DraftInput value={draft.hostName} onChangeText={(hostName) => updateDraft({ hostName })} placeholder="Auto-filled host" accessibilityLabel="Host name" />
              </Field>
              <Field label="Co-hosts">
                <DraftInput value={draft.coHosts} onChangeText={(coHosts) => updateDraft({ coHosts })} placeholder="Add users" accessibilityLabel="Co-hosts" />
              </Field>
            </View>
            <Field label="Contact Email / Phone">
              <DraftInput value={draft.contact} onChangeText={(contact) => updateDraft({ contact })} placeholder="host@example.com" accessibilityLabel="Contact email or phone" />
            </Field>

            <View style={styles.divider} />

            <View style={styles.teamSectionHeader}>
              <Ionicons name="ribbon-outline" size={20} color={CultureTokens.gold} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sponsors & Supporters</Text>
            </View>

            {draft.sponsors.map((sp) => (
              <View key={sp.id} style={[styles.sponsorChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <View style={styles.sponsorChipInfo}>
                  <Text style={[styles.sponsorName, { color: colors.text }]}>{sp.name}</Text>
                  <Text style={[styles.sponsorTier, { color: CultureTokens.gold }]}>{sp.tier.toUpperCase()}</Text>
                </View>
                <Pressable onPress={() => removeSponsor(sp.id)}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}

            {showSponsorForm ? (
              <GlassView intensity={10} style={styles.addSponsorBox}>
                <FormInput
                  value={newSponsor.name}
                  onChangeText={(name) => setNewSponsor({ ...newSponsor, name })}
                  placeholder="Sponsor / Supporter Name"
                  style={{ marginBottom: 12 }}
                />
                <View style={styles.chipGrid}>
                  {['Platinum', 'Gold', 'Silver', 'Bronze', 'Supporter'].map((t) => (
                    <ChoiceChip
                      key={t}
                      label={t}
                      selected={newSponsor.tier === t.toLowerCase()}
                      onPress={() => setNewSponsor({ ...newSponsor, tier: t.toLowerCase() })}
                    />
                  ))}
                </View>
                <View style={[styles.twoCol, { marginTop: 12 }]}>
                  <Button variant="outline" size="sm" style={{ flex: 1 }} onPress={() => setShowSponsorForm(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" style={{ flex: 1 }} onPress={addSponsor}>Add</Button>
                </View>
              </GlassView>
            ) : (
              <Button variant="outline" size="sm" leftIcon="add-circle-outline" onPress={() => setShowSponsorForm(true)}>
                Add Sponsor / Supporter
              </Button>
            )}
          </Section>

          <Section title="Additional Settings" icon="settings-outline">
            <Field label="Visibility">
              <SingleChoice options={['Public', 'Community-only', 'Invite-only'] as const} value={draft.visibility} onChange={(visibility) => updateDraft({ visibility })} />
            </Field>
            <View style={[styles.switchRow, { borderColor: colors.borderLight }]}>
              <View style={styles.switchText}>
                <Text style={[styles.label, { color: colors.text }]}>Approval Required</Text>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>Review participants before they join.</Text>
              </View>
              <Switch
                value={draft.approvalRequired}
                onValueChange={(approvalRequired) => updateDraft({ approvalRequired })}
                accessibilityLabel="Approval required for participants"
              />
            </View>
            <Field label="Community Association">
              <DraftInput value={draft.communities} onChangeText={(communities) => updateDraft({ communities })} placeholder="Link one or more communities" accessibilityLabel="Community association" />
            </Field>
          </Section>

          <View style={styles.bottomActions}>
            <Button variant="primary" leftIcon="rocket-outline" onPress={() => saveActivity('published')} disabled={isSaving} style={{ flex: 2 }}>
              Publish Activity
            </Button>
            <Button variant="outline" leftIcon="analytics-outline" onPress={onReview} style={{ flex: 1.2 }}>
              Review
            </Button>
            <Button variant="outline" leftIcon="save-outline" onPress={() => saveActivity('draft')} disabled={isSaving} style={{ flex: 1 }}>
              Save Draft
            </Button>
          </View>
          {isSaving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={CultureTokens.indigo} />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Saving activity...</Text>
            </View>
          ) : null}
          {lastSaved ? (
            <Text style={[styles.savedText, { color: CultureTokens.teal }]}>
              Last saved as {lastSaved}. The production Activity model stores core listing fields today; richer HostSpace fields remain in this preview.
            </Text>
          ) : null}
        </View>

        {showPreview ? (
          <View style={[styles.previewColumn, isDesktop && styles.previewColumnDesktop]}>
            <Text style={[styles.previewHeading, { color: colors.text }]}>Live Preview</Text>
            <ActivityPreview draft={draft} colors={colors} />
            <View style={[styles.previewNote, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
              <Text style={[styles.previewNoteTitle, { color: colors.text }]}>Cultural badge</Text>
              <Text style={[styles.previewBody, { color: colors.textSecondary }]}>
                {draft.primaryCulture || 'Malayalee'} | {draft.language || 'English'} | {draft.culturalTags[0] || 'Community'}
              </Text>
            </View>
            <Button variant="outline" leftIcon="open-outline" onPress={() => router.push('/activities' as never)} accessibilityLabel="Open activities page">
              Open Activities
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.lg,
  },
  pageHeader: {
    gap: 5,
  },
  eyebrow: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    ...TextStyles.title2,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    gap: Spacing.md,
  },
  contentDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formColumn: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  previewColumn: {
    gap: Spacing.sm,
  },
  previewColumnDesktop: {
    width: 320,
  },
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.md,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...TextStyles.title3,
    fontSize: 17,
    lineHeight: 22,
  },
  sectionBody: {
    gap: 10,
  },
  field: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    ...TextStyles.body,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    ...TextStyles.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    minHeight: InputTokens.height,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  textarea: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  chipText: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },
  twoCol: {
    gap: Spacing.md,
    ...(Platform.OS === 'web'
      ? ({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        } as Record<string, unknown>)
      : {}),
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: ButtonTokens.height.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  switchText: {
    flex: 1,
    minWidth: 0,
  },
  bottomActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Spacing.sm,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  savedText: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  teamSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sponsorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  sponsorChipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sponsorName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  sponsorTier: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  addSponsorBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CultureTokens.gold + '40',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  previewHeading: {
    ...TextStyles.title3,
  },
  previewPanel: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  previewImage: {
    height: 126,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    padding: Spacing.md,
    gap: 7,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  previewBadge: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  previewTitle: {
    ...TextStyles.title3,
    fontSize: 18,
    lineHeight: 23,
  },
  previewDate: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    lineHeight: 16,
  },
  previewBody: {
    ...TextStyles.body,
    fontSize: 13,
    lineHeight: 19,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMeta: {
    ...TextStyles.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  calendarPreview: {
    borderTopWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  calendarMonth: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  calendarDay: {
    ...TextStyles.title2,
    fontSize: 26,
    lineHeight: 30,
  },
  previewNote: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 5,
  },
  previewNoteTitle: {
    ...TextStyles.body,
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
});
