/**
 * Unified listing wizard steps — exported as ListingStep* for the orchestrator.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import CultureImage from '@/design-system/ui/CultureImage';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { useColors } from '@/hooks/useColors';
import type { CreateStyles } from '@/modules/events/components/create/styles';
import type { ListingFormState } from './types';
import type { CommunityCategory, CommunityJoinMode, CommunityLegalStatus, Profile } from '@/shared/schema';
import { COMMUNITY_LEGAL_STATUS_LABELS } from '@/shared/schema/profile';
import { ALL_NATIONALITIES, CULTURES, getCulturesForNationality, searchNationalities } from '@/constants/cultures';
import { COMMON_LANGUAGES, LANGUAGES, searchLanguages } from '@/constants/languages';
import { SubmitCard, SubmitSectionLabel, SubmitField } from '@/components/submit/FormPrimitives';
import { modulesApi } from '@/modules/api';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type SetField = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => void;

type Base = {
  form: ListingFormState;
  setField: SetField;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
};

const DIRECTORY_TYPES: { id: Profile['entityType']; label: string }[] = [
  { id: 'business', label: 'Business' },
  { id: 'venue', label: 'Venue' },
  { id: 'artist', label: 'Artist' },
  { id: 'organizer', label: 'Organizer' },
];

const CATEGORY_OPTIONS: { id: CommunityCategory; label: string }[] = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'local_community', label: 'Local Community' },
  { id: 'arts_sports_club', label: 'Art & Sports Club' },
  { id: 'business', label: 'Business' },
  { id: 'brand', label: 'Brand' },
  { id: 'professional', label: 'Professional network' },
  { id: 'club', label: 'Club / Society' },
  { id: 'charity', label: 'Charity' },
  { id: 'council', label: 'Council / Civic' },
];

const JOIN_OPTIONS: { id: CommunityJoinMode; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'request', label: 'Request to join' },
  { id: 'invite', label: 'Invite only' },
];

const COMMUNITY_TYPE_OPTIONS = [
  { id: 'arts', label: 'Arts & Culture' },
  { id: 'music', label: 'Music' },
  { id: 'dance', label: 'Dance' },
  { id: 'food', label: 'Food & Dining' },
  { id: 'heritage', label: 'Heritage & History' },
  { id: 'literature', label: 'Literature' },
  { id: 'film', label: 'Film & Cinema' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'language', label: 'Language & Exchange' },
  { id: 'wellness', label: 'Wellness & Spirituality' },
];

const CULTURAL_FOCUS_OPTIONS = [
  'Heritage Preservation',
  'Language Learning',
  'Festivals & Celebrations',
  'Food & Cuisine',
  'Arts & Music',
  'Dance',
  'Diaspora Community',
  'Youth & Next Generation',
  'Professional Networking',
];

const FEATURED_CULTURE_IDS = [
  'malayali',
  'tamil',
  'punjabi',
  'han_chinese',
  'cantonese',
  'tagalog',
  'vietnamese',
  'korean',
  'japanese',
  'aboriginal_australian',
  'arab',
  'italian',
  'greek',
];

const CULTURE_TAG_SUGGESTIONS: Record<string, string[]> = {
  malayali: ['Onam', 'Vishu', 'Kerala Food', 'Malayalam', 'Mohiniyattam'],
  tamil: ['Pongal', 'Tamil Language', 'Bharatanatyam', 'Kollywood'],
  punjabi: ['Bhangra', 'Giddha', 'Vaisakhi', 'Punjabi Food'],
  han_chinese: ['Lunar New Year', 'Mandarin', 'Moon Festival', 'Calligraphy'],
  cantonese: ['Cantonese', 'Dim Sum', 'Lion Dance', 'Moon Festival'],
  tagalog: ['Filipino Food', 'Tagalog', 'OPM', 'Barrio Fiesta'],
  vietnamese: ['Tet', 'Vietnamese Food', 'Language Exchange', 'Ao Dai'],
};

const COMMUNITY_TEMPLATES = [
  {
    id: 'music',
    label: 'Music Lovers',
    tagline: 'A home for culture, rhythm, and live music connection.',
    description: 'A community for people who celebrate music, performance, and shared cultural expression through gatherings, showcases, and member-led discovery.',
    tags: ['Music', 'Arts & Music', 'Festivals & Celebrations'],
  },
  {
    id: 'heritage',
    label: 'Heritage Walkers',
    tagline: 'Explore heritage, stories, and places together.',
    description: 'A community for people who want to preserve cultural memory through local walks, storytelling, history sessions, and intergenerational exchange.',
    tags: ['Heritage & History', 'Heritage Preservation', 'Diaspora Community'],
  },
  {
    id: 'food',
    label: 'Food Explorers',
    tagline: 'Connect through food, family recipes, and local discovery.',
    description: 'A community for members to share food traditions, discover local dining, host cooking circles, and celebrate the flavours that carry culture forward.',
    tags: ['Food & Dining', 'Food & Cuisine', 'Festivals & Celebrations'],
  },
];

function slugifyHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function toggleListValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ensureListValue(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value];
}

export function ListingStepIdentity({ form, setField, colors, s }: Base) {
  const [handleStatus, setHandleStatus] = useState<'idle' | 'ok' | 'taken' | 'checking'>('idle');
  const isCommunity = form.entityType === 'community';

  const checkHandle = useCallback(async () => {
    const h = form.handle.trim().replace(/^@/, '');
    if (h.length < 2) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    try {
      const r = await modulesApi.profiles.handleAvailable(h);
      setHandleStatus(r.available ? 'ok' : 'taken');
    } catch {
      setHandleStatus('idle');
    }
  }, [form.handle]);

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Identity & Brand" icon="id-card-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        {isCommunity
          ? 'Build a space for people who share your cultural passion.'
          : 'Your public name and handle help people find you on CulturePass.'}
      </Text>
      <Text style={[s.requiredLegend, { color: colors.textTertiary }]}>* Required fields</Text>
      {form.subCategory ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: CultureTokens.indigo + '10', borderWidth: 1, borderColor: CultureTokens.indigo + '30', marginBottom: 8 }}>
          <Ionicons name="layers-outline" size={16} color={CultureTokens.indigo} />
          <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo, flex: 1 }}>
            Creating: <Text style={{ fontFamily: 'Poppins_700Bold', textTransform: 'capitalize' }}>{form.subCategory.replace(/_/g, ' ')}</Text>
          </Text>
        </View>
      ) : null}
      {form.entityType !== 'community' ? (
        <View style={{ gap: 10, marginBottom: 16 }}>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Listing type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DIRECTORY_TYPES.map((t) => {
              const active = form.entityType === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setField('entityType', t.id)}
                  style={[
                    s.typeChip,
                    { borderColor: active ? CultureTokens.indigo : colors.borderLight, backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={{ color: active ? CultureTokens.indigo : colors.textSecondary, fontFamily: 'Poppins_600SemiBold' }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <SubmitField label={isCommunity ? 'Community name' : 'Name'} required>
      <TextInput
        value={form.name}
        onChangeText={(v) => {
          setField('name', v);
          if (isCommunity && !form.handle.trim()) setField('handle', slugifyHandle(v));
        }}
        placeholder={isCommunity ? 'e.g. Sydney Malayalee Community' : 'Official listing name'}
        placeholderTextColor={colors.textTertiary}
        multiline={false}
        numberOfLines={1}
        textAlignVertical="center"
        style={[
          s.singleLineInput,
          { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface },
        ]}
        accessibilityLabel="Listing name"
      />
      </SubmitField>

      <SubmitField label={isCommunity ? 'Handle / URL' : 'Handle'} required={isCommunity}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {isCommunity ? (
          <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_600SemiBold' }}>/c/</Text>
        ) : null}
        <TextInput
          value={form.handle}
          onChangeText={(v) => setField('handle', v.replace(/\s/g, ''))}
          placeholder={isCommunity ? 'your-community-name' : 'yourbrand'}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          multiline={false}
          numberOfLines={1}
          textAlignVertical="center"
          style={[
            s.singleLineInput,
            { flex: 1, borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface },
          ]}
          accessibilityLabel="CulturePass handle"
        />
        <Pressable
          onPress={() => void checkHandle()}
          style={{
            minHeight: 48,
            justifyContent: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.borderLight,
            backgroundColor: colors.surface,
            ...webPointer,
          }}
          accessibilityLabel="Check handle availability"
        >
          {handleStatus === 'checking' ? (
            <ActivityIndicator size="small" color={CultureTokens.indigo} />
          ) : (
            <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>Check</Text>
          )}
        </Pressable>
      </View>
      {handleStatus === 'ok' ? (
        <Text style={{ color: '#22c55e', fontSize: 13, marginTop: 4 }}>This handle looks available.</Text>
      ) : handleStatus === 'taken' ? (
        <Text style={{ color: colors.error, fontSize: 13, marginTop: 4 }}>This handle may already be taken.</Text>
      ) : null}
      </SubmitField>

      <SubmitField label={isCommunity ? 'Tagline / short description' : 'Tagline'}>
      <TextInput
        value={form.tagline}
        onChangeText={(v) => setField('tagline', v.slice(0, 100))}
        placeholder={isCommunity ? 'A warm one-line promise for members' : 'Short headline'}
        placeholderTextColor={colors.textTertiary}
        multiline={false}
        numberOfLines={1}
        textAlignVertical="center"
        style={[
          s.singleLineInput,
          { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface },
        ]}
      />
      </SubmitField>

      {isCommunity ? (
        <>
          <SubmitField label="Templates">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {COMMUNITY_TEMPLATES.map((template) => (
              <Pressable
                key={template.id}
                onPress={() => {
                  if (!form.tagline.trim()) setField('tagline', template.tagline);
                  if (!form.description.trim()) setField('description', template.description);
                  setField('cultureTags', Array.from(new Set([...form.cultureTags, ...template.tags])));
                }}
                style={[s.typeChip, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles-outline" size={15} color={CultureTokens.coral} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_600SemiBold' }}>{template.label}</Text>
              </Pressable>
            ))}
          </View>
          </SubmitField>

          <SubmitField label="Category / type">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {COMMUNITY_TYPE_OPTIONS.map((opt) => {
              const active = form.cultureTags.includes(opt.label);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setField('cultureTags', toggleListValue(form.cultureTags, opt.label))}
                  style={[
                    s.typeChip,
                    { borderColor: active ? CultureTokens.teal : colors.borderLight, backgroundColor: active ? CultureTokens.teal + '18' : colors.surface },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={{ color: active ? CultureTokens.teal : colors.textSecondary, fontFamily: 'Poppins_600SemiBold' }}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          </SubmitField>
        </>
      ) : (
        <>
          <SubmitField label="Culture tags">
          <TextInput
            value={form.cultureTags.join(', ')}
            onChangeText={(v) =>
              setField(
                'cultureTags',
                v
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. Malayali, Tamil, Greek"
            placeholderTextColor={colors.textTertiary}
            multiline={false}
            numberOfLines={1}
            textAlignVertical="center"
            style={[
              s.singleLineInput,
              { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface },
            ]}
          />
          </SubmitField>
        </>
      )}

      {form.entityType === 'community' ? (
        <>
          <SubmitField label="Community category">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_OPTIONS.map((opt) => {
              const active = form.communityCategory === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setField('communityCategory', opt.id)}
                  style={[
                    s.typeChip,
                    { borderColor: active ? CultureTokens.teal : colors.borderLight, backgroundColor: active ? CultureTokens.teal + '18' : colors.surface },
                  ]}
                >
                  <Text style={{ color: active ? CultureTokens.teal : colors.textSecondary }}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          </SubmitField>
          <SubmitField label="Join mode">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {JOIN_OPTIONS.map((opt) => {
              const active = form.joinMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setField('joinMode', opt.id)}
                  style={[
                    s.typeChip,
                    { borderColor: active ? CultureTokens.indigo : colors.borderLight, backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface },
                  ]}
                >
                  <Text style={{ color: active ? CultureTokens.indigo : colors.textSecondary }}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          </SubmitField>
        </>
      ) : null}
    </SubmitCard>
  );
}

export function ListingStepAbout({ form, setField, colors, s }: Base) {
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="About" icon="information-circle-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>Tell people what you do and why it matters.</Text>
      <SubmitField label="Description">
      <TextInput
        value={form.description}
        onChangeText={(v) => setField('description', v)}
        placeholder="Main description"
        placeholderTextColor={colors.textTertiary}
        multiline
        style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
      />
      </SubmitField>
      <SubmitField label="Mission">
      <TextInput
        value={form.mission}
        onChangeText={(v) => setField('mission', v)}
        placeholder="What you stand for"
        placeholderTextColor={colors.textTertiary}
        multiline
        style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
      />
      </SubmitField>
      <SubmitField label="Founder story">
      <TextInput
        value={form.founderStory}
        onChangeText={(v) => setField('founderStory', v)}
        placeholder="Optional origin story"
        placeholderTextColor={colors.textTertiary}
        multiline
        style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
      />
      </SubmitField>
    </SubmitCard>
  );
}

type MediaProps = Base & {
  imageUploading: boolean;
  imageUploadError: string | null;
  pickProfileImage: () => void;
  pickCoverImage: () => void;
};

export function ListingStepMedia({ form, setField, colors, s, imageUploading, imageUploadError, pickProfileImage, pickCoverImage }: MediaProps) {
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Visuals" icon="image-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Strong imagery increases trust. Square profile image works best.
      </Text>
      <SubmitField label="Profile image">
      {form.imageUrl ? (
        <View style={s.imagePreviewWrap}>
          <CultureImage uri={form.imageUrl} style={s.imagePreview} contentFit="cover" />
          <View style={s.imagePreviewActions}>
            <Pressable onPress={pickProfileImage} style={[s.imageActionBtn, { backgroundColor: colors.surface }]} accessibilityLabel="Change profile image">
              <Ionicons name="pencil" size={18} color={colors.text} />
              <Text style={[s.imageActionText, { color: colors.text }]}>Change</Text>
            </Pressable>
            <Pressable onPress={() => setField('imageUrl', '')} style={[s.imageActionBtn, { backgroundColor: CultureTokens.coral + '20' }]} accessibilityLabel="Remove profile image">
              <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pickProfileImage}
          disabled={imageUploading}
          style={[s.imagePicker, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          accessibilityLabel="Upload profile image"
        >
          {imageUploading ? <ActivityIndicator color={CultureTokens.indigo} /> : <Ionicons name="image-outline" size={40} color={CultureTokens.indigo} />}
        </Pressable>
      )}
      </SubmitField>

      <SubmitField label="Cover image" hint="Optional">
      {form.coverImageUrl ? (
        <View style={[s.imagePreviewWrap, { marginBottom: 10 }]}>
          <CultureImage uri={form.coverImageUrl} style={[s.imagePreview, { aspectRatio: 16 / 9 }]} contentFit="cover" />
          <View style={s.imagePreviewActions}>
            <Pressable onPress={pickCoverImage} style={[s.imageActionBtn, { backgroundColor: colors.surface }]} accessibilityLabel="Change cover image">
              <Ionicons name="pencil" size={18} color={colors.text} />
              <Text style={[s.imageActionText, { color: colors.text }]}>Change</Text>
            </Pressable>
            <Pressable onPress={() => setField('coverImageUrl', '')} style={[s.imageActionBtn, { backgroundColor: CultureTokens.coral + '20' }]} accessibilityLabel="Remove cover image">
              <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pickCoverImage}
          disabled={imageUploading}
          style={[s.imagePicker, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, aspectRatio: 16 / 9, maxHeight: 160 }]}
          accessibilityLabel="Upload cover image"
        >
          {imageUploading ? <ActivityIndicator color={CultureTokens.indigo} /> : <Ionicons name="images-outline" size={36} color={CultureTokens.indigo} />}
        </Pressable>
      )}
      <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 12 }]}>Or paste cover image URL</Text>
      <TextInput
        value={form.coverImageUrl}
        onChangeText={(v) => setField('coverImageUrl', v)}
        placeholder="https://…"
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="none"
        keyboardType="url"
        returnKeyType="done"
        style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
      />
      </SubmitField>

      {imageUploadError ? (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '18', marginTop: 8 }]}>
          <Text style={{ color: colors.error }}>{imageUploadError}</Text>
        </View>
      ) : null}
    </SubmitCard>
  );
}

export function ListingStepLocation({ form, setField, colors, s }: Base) {
  const lgaInvalid = form.lgaCode.trim().length > 0 && !/^[A-Za-z0-9\s\-]{2,40}$/.test(form.lgaCode.trim());
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Location" icon="location-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>Where people can find you — used for Discover and directory.</Text>

      <SubmitField label="Street address">
        <TextInput
          value={form.address}
          onChangeText={(v) => setField('address', v)}
          placeholder="e.g. 42 King St"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="next"
          style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
        />
      </SubmitField>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SubmitField label="City" required>
            <TextInput
              value={form.city}
              onChangeText={(v) => setField('city', v)}
              placeholder="Sydney"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
            />
          </SubmitField>
        </View>
        <View style={{ flex: 1 }}>
          <SubmitField label="Country">
            <TextInput
              value={form.country}
              onChangeText={(v) => setField('country', v)}
              placeholder="Australia"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
            />
          </SubmitField>
        </View>
      </View>

      <SubmitField label="LGA / council area" hint="Optional — used for hyper-local discovery in Australia">
        <TextInput
          value={form.lgaCode}
          onChangeText={(v) => setField('lgaCode', v.toUpperCase())}
          placeholder="e.g. SYDNEY or Parramatta"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          returnKeyType="done"
          style={[
            s.singleLineInput,
            {
              borderColor: lgaInvalid ? colors.error : colors.borderLight,
              color: colors.text,
              backgroundColor: colors.surface,
            },
          ]}
        />
        {lgaInvalid ? (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
            Use letters, numbers and hyphens only (e.g. SYDNEY, INNER-WEST).
          </Text>
        ) : null}
      </SubmitField>
    </SubmitCard>
  );
}

function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function SocialRow({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  s,
  isUrl = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  isUrl?: boolean;
}) {
  const showPreview = value.trim().length > 5 && (value.startsWith('http') || value.includes('.'));
  return (
    <SubmitField label={label} hint={showPreview ? value.replace(/^https?:\/\//, '') : undefined}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={isUrl ? () => { if (value.trim()) onChangeText(normalizeUrl(value)); } : undefined}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="none"
        keyboardType={isUrl ? 'url' : 'default'}
        returnKeyType="next"
        style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
      />
    </SubmitField>
  );
}

export function ListingStepSocialHub({ form, setField, colors, s }: Base) {
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Social Hub" icon="share-social-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        We store social links on your profile so guests can follow you anywhere.
      </Text>
      <SocialRow label="Website" value={form.website} onChangeText={(v) => setField('website', v)} placeholder="https://yoursite.com" colors={colors} s={s} isUrl />
      <SocialRow label="Instagram" value={form.instagram} onChangeText={(v) => setField('instagram', v)} placeholder="@handle" colors={colors} s={s} />
      <SocialRow label="Facebook" value={form.facebook} onChangeText={(v) => setField('facebook', v)} placeholder="Page URL or name" colors={colors} s={s} isUrl />
      <SocialRow label="YouTube" value={form.youtube} onChangeText={(v) => setField('youtube', v)} placeholder="Channel URL" colors={colors} s={s} isUrl />
      <SocialRow label="TikTok" value={form.tiktok} onChangeText={(v) => setField('tiktok', v)} placeholder="@handle" colors={colors} s={s} />
      <SocialRow label="X / Twitter" value={form.twitter} onChangeText={(v) => setField('twitter', v)} placeholder="@handle" colors={colors} s={s} />
      <SocialRow label="Spotify" value={form.spotify} onChangeText={(v) => setField('spotify', v)} placeholder="Artist or playlist URL" colors={colors} s={s} isUrl />
      <SocialRow label="LinkedIn" value={form.linkedin} onChangeText={(v) => setField('linkedin', v)} placeholder="Profile or page URL" colors={colors} s={s} isUrl />
      <SocialRow label="Pinterest" value={form.pinterest} onChangeText={(v) => setField('pinterest', v)} placeholder="Profile URL" colors={colors} s={s} isUrl />
      <SocialRow label="Linktree" value={form.linktree} onChangeText={(v) => setField('linktree', v)} placeholder="linktr.ee/yourname" colors={colors} s={s} isUrl />
      <SocialRow label="WhatsApp" value={form.whatsapp} onChangeText={(v) => setField('whatsapp', v)} placeholder="Link or number" colors={colors} s={s} />
      <SocialRow label="WeChat" value={form.wechat} onChangeText={(v) => setField('wechat', v)} placeholder="ID or link" colors={colors} s={s} />
    </SubmitCard>
  );
}

export function ListingStepAuLegal({ form, setField, colors, s }: Base) {
  const [abnBusy, setAbnBusy] = useState(false);
  const [abnMsg, setAbnMsg] = useState<string | null>(null);

  const lookupAbn = async () => {
    const digits = form.abn.replace(/\D/g, '');
    if (digits.length < 11) {
      setAbnMsg('Enter an 11-digit ABN.');
      return;
    }
    setAbnBusy(true);
    setAbnMsg(null);
    try {
      const r = await modulesApi.profiles.abnLookup(digits);
      if (r.ok && r.entityName && !form.tradingName.trim()) setField('tradingName', r.entityName);
      setAbnMsg(r.message ?? (r.ok ? 'ABN validated.' : 'Could not validate ABN.'));
    } catch {
      setAbnMsg('ABN lookup failed.');
    } finally {
      setAbnBusy(false);
    }
  };

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="AU Legal Details" icon="document-text-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Australian business identifiers — shown only for eligible listing types.
      </Text>
      <SubmitField label="ABN">
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          value={form.abn}
          onChangeText={(v) => setField('abn', v)}
          placeholder="11 digits"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          returnKeyType="done"
          style={[s.singleLineInput, { flex: 1, borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
        />
        <Pressable
          onPress={() => void lookupAbn()}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.borderLight,
            justifyContent: 'center',
          }}
          accessibilityLabel="Look up ABN"
        >
          {abnBusy ? <ActivityIndicator size="small" /> : <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>Lookup</Text>}
        </Pressable>
      </View>
      {abnMsg ? <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13 }}>{abnMsg}</Text> : null}
      </SubmitField>
      <SubmitField label="ACN" hint="Optional">
      <TextInput
        value={form.acn}
        onChangeText={(v) => setField('acn', v)}
        placeholder="Optional"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="next"
        style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
      />
      </SubmitField>
      <SubmitField label="Trading name">
      <TextInput
        value={form.tradingName}
        onChangeText={(v) => setField('tradingName', v)}
        placeholder="As registered"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="next"
        style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
        <Switch value={form.gstRegistered} onValueChange={(v) => setField('gstRegistered', v)} accessibilityLabel="GST registered" />
        <Text style={{ color: colors.text, flex: 1 }}>GST registered</Text>
      </View>
      </SubmitField>
      <SubmitField label="Food / liquor licence #">
      <TextInput
        value={form.foodLiquorLicence}
        onChangeText={(v) => setField('foodLiquorLicence', v)}
        placeholder="If applicable"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="done"
        style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
      />
      </SubmitField>
    </SubmitCard>
  );
}

const GLOBAL_NATIONALITY = { id: 'global', label: 'Global / International', emoji: '🌍' };

export function ListingStepEntityExtras({ form, setField, colors, s }: Base) {
  const [cultureSearch, setCultureSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const isGlobal = form.nationalityId === 'global';
  const natOptions = nationalitySearch.trim()
    ? searchNationalities(nationalitySearch).slice(0, 24)
    : ALL_NATIONALITIES.slice(0, 24);
  const cultures = isGlobal
    ? FEATURED_CULTURE_IDS.map((id) => CULTURES[id]).filter(Boolean)
    : form.nationalityId
    ? getCulturesForNationality(form.nationalityId)
    : FEATURED_CULTURE_IDS.map((id) => CULTURES[id]).filter(Boolean);
  const searchedCultures = Object.values(CULTURES)
    .filter((culture) => culture.label.toLowerCase().includes(cultureSearch.trim().toLowerCase()))
    .slice(0, 20);
  const cultureOptions = cultureSearch.trim() ? searchedCultures : cultures;
  const languageOptions = languageSearch.trim() ? searchLanguages(languageSearch).slice(0, 20) : COMMON_LANGUAGES.slice(0, 20);
  const selectedCultureSuggestions = form.cultureIds.flatMap((id) => CULTURE_TAG_SUGGESTIONS[id] ?? []);

  const extrasIntro =
    form.entityType === 'community'
      ? 'Define who this community serves: heritage, languages, and the themes that bring people together.'
      : 'A few extra fields so your listing reads clearly on CulturePass.';

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Extras & Heritage" icon="color-palette-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>{extrasIntro}</Text>
      {form.entityType === 'community' ? (
        <Text style={[s.requiredLegend, { color: colors.textTertiary, marginBottom: 14 }]}>* Required fields</Text>
      ) : null}

      {form.entityType === 'community' ? (
        <>
          <SubmitField label="Heritage & origin" hint="Narrows culture and language suggestions. Tap again to clear.">
            <View style={[s.natSearchWrap, { borderColor: colors.borderLight, backgroundColor: colors.surface, marginBottom: 10 }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={nationalitySearch}
                onChangeText={setNationalitySearch}
                placeholder="Search Indian, Chinese, Nigerian…"
                placeholderTextColor={colors.textTertiary}
                style={[s.natSearchInput, { color: colors.text }]}
              />
              {nationalitySearch.length > 0 ? (
                <Pressable onPress={() => setNationalitySearch('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
            <View style={s.typeGrid}>
              {/* Global / International always first */}
              {(() => {
                const activeGlobal = form.nationalityId === GLOBAL_NATIONALITY.id;
                return (
                  <Pressable
                    onPress={() => setField('nationalityId', activeGlobal ? '' : GLOBAL_NATIONALITY.id)}
                    style={[
                      s.typeChip,
                      {
                        borderColor: activeGlobal ? CultureTokens.violet : colors.borderLight,
                        backgroundColor: activeGlobal ? CultureTokens.violet + '14' : colors.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeGlobal }}
                  >
                    <Text style={{ fontSize: 14 }}>{GLOBAL_NATIONALITY.emoji}</Text>
                    <Text style={{ color: activeGlobal ? CultureTokens.violet : colors.text, fontFamily: activeGlobal ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}>
                      {GLOBAL_NATIONALITY.label}
                    </Text>
                  </Pressable>
                );
              })()}
              {natOptions.map((n) => {
                const active = form.nationalityId === n.id;
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => setField('nationalityId', active ? '' : n.id)}
                    style={[
                      s.typeChip,
                      {
                        borderColor: active ? CultureTokens.teal : colors.borderLight,
                        backgroundColor: active ? CultureTokens.teal + '14' : colors.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={{ fontSize: 14 }}>{n.emoji}</Text>
                    <Text style={{ color: active ? CultureTokens.teal : colors.text, fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}>
                      {n.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SubmitField>

          <SubmitField label="Primary culture" required>
          <View style={[s.natSearchWrap, { borderColor: colors.borderLight, backgroundColor: colors.surface, marginTop: 6 }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={cultureSearch}
              onChangeText={setCultureSearch}
              placeholder="Search Malayalee, Filipino, Chinese..."
              placeholderTextColor={colors.textTertiary}
              style={[s.natSearchInput, { color: colors.text }]}
            />
          </View>
          <View style={[s.tagGrid, { marginTop: 10 }]}>
            {cultureOptions.map((culture) => {
              const active = form.cultureIds.includes(culture.id);
              return (
                <Pressable
                  key={culture.id}
                  onPress={() => {
                    const nextCultureIds = toggleListValue(form.cultureIds, culture.id);
                    const nextCultureTags = active
                      ? form.cultureTags.filter((tag) => tag !== culture.label)
                      : ensureListValue(form.cultureTags, culture.label);
                    setField('cultureIds', nextCultureIds);
                    setField('cultureTags', nextCultureTags);
                    if (!form.nationalityId) setField('nationalityId', culture.nationalityId);
                    if (!form.languageIds.length) {
                      const language = LANGUAGES[culture.primaryLanguageId];
                      if (language) {
                        setField('languageIds', [language.id]);
                        setField('languages', ensureListValue(form.languages, language.name));
                      }
                    }
                  }}
                  style={[
                    s.tagChip,
                    { borderColor: active ? CultureTokens.teal : colors.borderLight, backgroundColor: active ? CultureTokens.teal + '16' : colors.surface },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={s.tagEmoji}>{culture.emoji}</Text>
                  <Text style={[s.tagLabel, { color: active ? CultureTokens.teal : colors.text }]}>{culture.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[s.natHint, { color: colors.textTertiary, marginTop: 8 }]}>
            Select more than one culture when the community serves multiple cultures.
          </Text>
          </SubmitField>

          <SubmitField label="Primary language" required>
          <View style={[s.natSearchWrap, { borderColor: colors.borderLight, backgroundColor: colors.surface, marginTop: 6 }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={languageSearch}
              onChangeText={setLanguageSearch}
              placeholder="Search English, Malayalam, Mandarin..."
              placeholderTextColor={colors.textTertiary}
              style={[s.natSearchInput, { color: colors.text }]}
            />
          </View>
          <View style={[s.tagGrid, { marginTop: 10 }]}>
            {languageOptions.map((language) => {
              const active = form.languageIds.includes(language.id);
              return (
                <Pressable
                  key={language.id}
                  onPress={() => {
                    setField('languageIds', toggleListValue(form.languageIds, language.id));
                    setField('languages', toggleListValue(form.languages, language.name));
                  }}
                  style={[
                    s.tagChip,
                    { borderColor: active ? CultureTokens.indigo : colors.borderLight, backgroundColor: active ? CultureTokens.indigo + '16' : colors.surface },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.tagLabel, { color: active ? CultureTokens.indigo : colors.text }]}>{language.name}</Text>
                </Pressable>
              );
            })}
          </View>
          </SubmitField>

          <SubmitField label="Cultural focus & theme">
          <View style={[s.tagGrid, { marginTop: 8 }]}>
            {[...CULTURAL_FOCUS_OPTIONS, ...selectedCultureSuggestions].map((tag) => {
              const active = form.cultureTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => setField('cultureTags', toggleListValue(form.cultureTags, tag))}
                  style={[
                    s.tagChip,
                    { borderColor: active ? CultureTokens.coral : colors.borderLight, backgroundColor: active ? CultureTokens.coral + '14' : colors.surface },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.tagLabel, { color: active ? CultureTokens.coral : colors.text }]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
          </SubmitField>

          <SubmitField label="Additional languages" hint="Comma-separated">
          <TextInput
            value={form.languages.join(', ')}
            onChangeText={(v) =>
              setField(
                'languages',
                v
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
            placeholder="English, Malayalam…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
          />
          </SubmitField>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SubmitField label="Founded date">
                <TextInput
                  value={form.foundedDate}
                  onChangeText={(v) => setField('foundedDate', v)}
                  placeholder="e.g. 2001"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                  style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
                />
              </SubmitField>
            </View>
            <View style={{ flex: 1 }}>
              <SubmitField label="Founded location">
                <TextInput
                  value={form.foundedLocation}
                  onChangeText={(v) => setField('foundedLocation', v)}
                  placeholder="City / region"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                  style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
                />
              </SubmitField>
            </View>
          </View>
          <SubmitField label="Legal status">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['', ...Object.keys(COMMUNITY_LEGAL_STATUS_LABELS)] as const).map((st) => {
              const key = st as CommunityLegalStatus | '';
              const label =
                key === '' ? 'Unspecified' : COMMUNITY_LEGAL_STATUS_LABELS[key as CommunityLegalStatus];
              const active = form.legalStatus === key;
              return (
                <Pressable
                  key={key || 'unspecified'}
                  onPress={() => setField('legalStatus', key)}
                  style={[s.typeChip, { borderColor: active ? CultureTokens.indigo : colors.borderLight }]}
                >
                  <Text style={{ color: active ? CultureTokens.indigo : colors.text }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          </SubmitField>
          <SubmitField label="Registration #">
          <TextInput
            value={form.registrationNumber}
            onChangeText={(v) => setField('registrationNumber', v)}
            placeholder="e.g. A0012345 or ABN 12 345 678 901"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
          />
          </SubmitField>
          <SubmitField label="Governing structure">
          <TextInput
            value={form.governingStructure}
            onChangeText={(v) => setField('governingStructure', v)}
            multiline
            style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
          />
          </SubmitField>
        </>
      ) : null}

      {(form.entityType === 'venue' || form.entityType === 'business') ? (
        <>
          <SubmitField label="Venue type">
          <TextInput
            value={form.venueType}
            onChangeText={(v) => setField('venueType', v)}
            placeholder="e.g. Gallery, Hall"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
          />
          </SubmitField>
          <SubmitField label="Capacities (seated / standing)">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={form.capacitySeated}
              onChangeText={(v) => setField('capacitySeated', v)}
              placeholder="Seated"
              keyboardType="number-pad"
              returnKeyType="next"
              style={[s.singleLineInput, { flex: 1, borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
            />
            <TextInput
              value={form.capacityStanding}
              onChangeText={(v) => setField('capacityStanding', v)}
              placeholder="Standing"
              keyboardType="number-pad"
              returnKeyType="done"
              style={[s.singleLineInput, { flex: 1, borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
            />
          </View>
          </SubmitField>
          <SubmitField label="Opening hours note">
          <TextInput
            value={form.openingHoursNote}
            onChangeText={(v) => setField('openingHoursNote', v)}
            multiline
            style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
          />
          </SubmitField>
        </>
      ) : null}

      {form.entityType === 'artist' ? (
        <>
          <SubmitField label="Disciplines" hint="Comma separated">
          <TextInput
            value={form.artistDisciplines}
            onChangeText={(v) => setField('artistDisciplines', v)}
            placeholder="Music, dance, visual art…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
          />
          </SubmitField>
        </>
      ) : null}

      {(form.entityType === 'organizer' || form.entityType === 'community') ? (
        <>
          <SubmitField label="Community guidelines">
          <TextInput
            value={form.communityGuidelines}
            onChangeText={(v) => setField('communityGuidelines', v)}
            multiline
            style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
          />
          </SubmitField>
        </>
      ) : null}

    </SubmitCard>
  );
}

export function ListingStepDelivery({ form, setField, colors, s }: Base) {
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Delivery & Logistics" icon="bicycle-outline" accent={CultureTokens.indigo} colors={colors} />
      <SubmitField label="Delivery & pickup" hint="Partners and pickup options when applicable">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Switch value={form.deliveryAvailable} onValueChange={(v) => setField('deliveryAvailable', v)} accessibilityLabel="Offers delivery" />
          <Text style={{ color: colors.text, flex: 1 }}>Delivery or pickup available</Text>
        </View>
      </SubmitField>
      <SocialRow label="Uber Eats" value={form.deliveryUberEats} onChangeText={(v) => setField('deliveryUberEats', v)} placeholder="Store URL" colors={colors} s={s} />
      <SocialRow label="DoorDash" value={form.deliveryDoorDash} onChangeText={(v) => setField('deliveryDoorDash', v)} placeholder="Store URL" colors={colors} s={s} />
      <SocialRow label="Menulog" value={form.deliveryMenulog} onChangeText={(v) => setField('deliveryMenulog', v)} placeholder="Store URL" colors={colors} s={s} />
      <SubmitField label="Cultural delivery notes">
      <TextInput
        value={form.culturalDeliveryNotes}
        onChangeText={(v) => setField('culturalDeliveryNotes', v)}
        multiline
        style={[s.textArea, s.descriptionInput, { borderColor: colors.borderLight, color: colors.text }]}
      />
      </SubmitField>
    </SubmitCard>
  );
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export function ListingStepTeamVerify({ form, setField, colors, s }: Base) {
  const [leaderName, setLeaderName] = useState('');
  const [leaderRole, setLeaderRole] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerWeb, setPartnerWeb] = useState('');

  const addLeader = () => {
    if (!leaderName.trim() || !leaderRole.trim()) return;
    setField('leadership', [
      ...form.leadership,
      { id: uid(), name: leaderName.trim(), roleTitle: leaderRole.trim(), isCurrent: true },
    ]);
    setLeaderName('');
    setLeaderRole('');
  };

  const addPartner = () => {
    if (!partnerName.trim()) return;
    setField('partners', [...form.partners, { id: uid(), name: partnerName.trim(), partnerType: 'partner', website: partnerWeb.trim() || undefined }]);
    setPartnerName('');
    setPartnerWeb('');
  };

  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Team & Contacts" icon="people-outline" accent={CultureTokens.indigo} colors={colors} />
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>Key contacts and optional partners.</Text>
      <SubmitField label="Public contact name">
      <TextInput
        value={form.publicContactName}
        onChangeText={(v) => setField('publicContactName', v)}
        placeholder="Full name"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="next"
        style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
      />
      </SubmitField>
      <SubmitField label="Public contact role">
        <TextInput
          value={form.publicContactRole}
          onChangeText={(v) => setField('publicContactRole', v)}
          placeholder="e.g. President, Manager"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
        />
      </SubmitField>
      <SubmitField label="Featured placement" hint="Reviewed by CulturePass">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Switch value={form.featuredSubmissionRequested} onValueChange={(v) => setField('featuredSubmissionRequested', v)} accessibilityLabel="Request featured placement" />
          <Text style={{ color: colors.text, flex: 1 }}>Request featured directory placement</Text>
        </View>
      </SubmitField>

      {form.entityType === 'community' ? (
        <>
          <Text style={[s.sectionNote, { color: colors.text, marginTop: 8 }]}>Leadership</Text>
          {form.leadership.map((l) => (
            <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.text }}>{l.name} — {l.roleTitle}</Text>
              <Pressable
                onPress={() => setField(
                  'leadership',
                  form.leadership.filter((x) => x.id !== l.id),
                )}
                accessibilityLabel={`Remove ${l.name}`}
              >
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          ))}
          <SubmitField label="New leader name">
            <TextInput value={leaderName} onChangeText={setLeaderName} placeholder="Full name" placeholderTextColor={colors.textTertiary} returnKeyType="next" style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]} />
          </SubmitField>
          <SubmitField label="Leader role">
            <TextInput value={leaderRole} onChangeText={setLeaderRole} placeholder="e.g. President, Treasurer" placeholderTextColor={colors.textTertiary} returnKeyType="done" style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]} />
          </SubmitField>
          <Pressable onPress={addLeader} style={{ marginBottom: 8 }} accessibilityLabel="Add leader">
            <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>+ Add leader</Text>
          </Pressable>

          <Text style={[s.sectionNote, { color: colors.text }]}>Partners</Text>
          {form.partners.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.text }}>{p.name}</Text>
              <Pressable onPress={() => setField('partners', form.partners.filter((x) => x.id !== p.id))}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          ))}
          <SubmitField label="Partner name">
            <TextInput value={partnerName} onChangeText={setPartnerName} placeholder="Organisation name" placeholderTextColor={colors.textTertiary} returnKeyType="next" style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]} />
          </SubmitField>
          <SubmitField label="Partner website">
            <TextInput value={partnerWeb} onChangeText={setPartnerWeb} onBlur={() => { if (partnerWeb.trim()) setPartnerWeb(normalizeUrl(partnerWeb)); }} placeholder="https://…" placeholderTextColor={colors.textTertiary} autoCapitalize="none" keyboardType="url" returnKeyType="done" style={[s.singleLineInput, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]} />
          </SubmitField>
          <Pressable onPress={addPartner} style={{ marginBottom: 4 }} accessibilityLabel="Add partner">
            <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>+ Add partner</Text>
          </Pressable>
        </>
      ) : null}
    </SubmitCard>
  );
}

const ENTITY_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  business: { label: 'Business', icon: 'briefcase-outline', color: CultureTokens.indigo },
  venue: { label: 'Venue', icon: 'location-outline', color: CultureTokens.teal },
  artist: { label: 'Artist', icon: 'musical-notes-outline', color: CultureTokens.coral },
  community: { label: 'Community', icon: 'people-outline', color: CultureTokens.violet },
  organizer: { label: 'Organizer', icon: 'person-circle-outline', color: CultureTokens.indigo },
  restaurant: { label: 'Restaurant', icon: 'restaurant-outline', color: CultureTokens.teal },
  brand: { label: 'Brand', icon: 'ribbon-outline', color: CultureTokens.coral },
  creator: { label: 'Creator', icon: 'videocam-outline', color: CultureTokens.violet },
};

type ReviewProps = Base & {
  publishMode: 'draft' | 'published';
  onPublishMode: (m: 'draft' | 'published') => void;
};

export function ListingStepReview({ form, colors, onPublishMode, publishMode }: ReviewProps) {
  const meta = ENTITY_META[form.entityType] ?? ENTITY_META.business;
  return (
    <SubmitCard colors={colors} hPad={0}>
      <SubmitSectionLabel label="Review & Publish" icon="eye-outline" accent={CultureTokens.gold} colors={colors} />
      <SubmitField label="Host card preview" hint="How your listing reads on Host workspace cards.">
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.borderLight,
            backgroundColor: colors.surface,
            overflow: 'hidden',
            flexDirection: 'row',
            padding: 12,
            gap: 12,
          }}
        >
          <View style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: meta.color + '18' }}>
            {form.imageUrl ? (
              <CultureImage uri={form.imageUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={meta.icon} size={28} color={meta.color} />
              </View>
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: meta.color + '18' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: meta.color }}>{meta.label}</Text>
              </View>
            </View>
            <Text style={[TextStyles.title3, { color: colors.text }]} numberOfLines={2}>
              {form.name.trim() || 'Untitled listing'}
            </Text>
            {form.city ? (
              <Text style={[TextStyles.caption, { color: colors.textTertiary }]} numberOfLines={1}>
                {form.city}
                {form.country ? `, ${form.country}` : ''}
              </Text>
            ) : null}
            {form.description ? (
              <Text style={[TextStyles.body, { color: colors.textSecondary, fontSize: 14 }]} numberOfLines={3}>
                {form.description}
              </Text>
            ) : null}
          </View>
        </View>
      </SubmitField>

      <SubmitField label="Publish mode">
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {(['draft', 'published'] as const).map((m) => {
            const active = publishMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => onPublishMode(m)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? CultureTokens.indigo : colors.borderLight,
                  backgroundColor: active ? CultureTokens.indigo + '14' : colors.surface,
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={{ color: active ? CultureTokens.indigo : colors.text, fontFamily: 'Poppins_600SemiBold' }}>{m === 'draft' ? 'Save as draft' : 'Publish live'}</Text>
              </Pressable>
            );
          })}
        </View>
      </SubmitField>
    </SubmitCard>
  );
}
