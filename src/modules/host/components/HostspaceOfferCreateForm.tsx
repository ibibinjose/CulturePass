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

import { api, ApiError } from '@/lib/api';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { DateField } from './fields/DateField';
import { MediaUploadField } from './fields/MediaUploadField';
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
import { Image } from 'expo-image';
import { useAuth } from '@/lib/auth';

const OFFER_CATEGORIES = [
  'Discount / Voucher',
  'Free Entry / Complimentary',
  'Buy 1 Get 1',
  'Member Exclusive Perk',
  'Early Access',
  'Bundle Deal',
  'Sponsored / Partnership',
  'Flash Sale',
  'Seasonal Offer',
];

const AUDIENCES = ['All Users', 'Community Members Only', 'Specific Culture', 'New Users'];
const CULTURES = ['Malayalee', 'Chinese', 'Filipino', 'Indian', 'Lebanese', 'Tamil', 'Greek', 'Vietnamese', 'Korean'];
const LANGUAGES = ['English', 'Malayalam', 'Mandarin', 'Tagalog', 'Hindi', 'Tamil', 'Arabic', 'Cantonese', 'Korean'];
const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DISCOUNT_TYPES = ['Percentage (%)', 'Fixed Amount ($)', 'Free Item / Service'] as const;
const DISTRIBUTION = ['All platform users', 'Specific Communities', 'Specific Cities', 'Homepage Featured', 'Email Newsletter'];

type DiscountType = (typeof DISCOUNT_TYPES)[number];
type ApprovalWorkflow = 'Auto-approve redemptions' | 'Manual approval required';

type Sponsor = {
  id: string;
  name: string;
  tier: string;
  website?: string;
};

type OfferDraft = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  targetAudience: string;
  primaryCulture: string;
  secondaryCultures: string[];
  languages: string[];
  startDate: string;
  expiryDate: string;
  validDays: string[];
  validTime: string;
  redemptionLimit: string;
  discountType: DiscountType;
  discountValue: string;
  minimumSpend: string;
  promoCode: string;
  offerImage: string;
  gallery: string;
  accentColor: string;
  businessName: string;
  businessLink: string;
  location: string;
  terms: string;
  approvalWorkflow: ApprovalWorkflow;
  distribution: string[];
  communities: string;
  cities: string;
  socialTitle: string;
  socialDescription: string;
  sponsors: Sponsor[];
};

const INITIAL_DRAFT: OfferDraft = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  category: 'Discount / Voucher',
  targetAudience: 'All Users',
  primaryCulture: '',
  secondaryCultures: [],
  languages: ['English'],
  startDate: '',
  expiryDate: '',
  validDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  validTime: '',
  redemptionLimit: '',
  discountType: 'Percentage (%)',
  discountValue: '',
  minimumSpend: '',
  promoCode: '',
  offerImage: '',
  gallery: '',
  accentColor: CultureTokens.coral,
  businessName: '',
  businessLink: '',
  location: 'Sydney, Australia',
  terms: 'Valid until expiry date. Cannot be combined with other offers. Non-transferable. Subject to availability and partner approval.',
  approvalWorkflow: 'Auto-approve redemptions',
  distribution: ['All platform users'],
  communities: '',
  cities: 'Sydney',
  socialTitle: '',
  socialDescription: '',
  sponsors: [],
};

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function generatedPromoCode(title: string) {
  const stem = title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8);
  return stem ? `CP-${stem}` : 'CP-OFFER';
}

function expiryCountdown(expiryDate: string) {
  const expiry = Date.parse(expiryDate);
  if (!Number.isFinite(expiry)) return 'Set expiry';
  const days = Math.ceil((expiry - Date.now()) / 86400000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Ends today';
  return `${days} day${days === 1 ? '' : 's'} left`;
}

function perkTypeFor(draft: OfferDraft) {
  if (draft.category === 'Early Access') return 'early_access';
  if (draft.category === 'Free Entry / Complimentary' || draft.discountType === 'Free Item / Service') return 'free_ticket';
  if (draft.discountType === 'Fixed Amount ($)') return 'discount_fixed';
  return 'discount_percent';
}

function buildDescription(draft: OfferDraft) {
  const lines = [
    draft.fullDescription || draft.shortDescription,
    draft.validTime ? `Valid time: ${draft.validTime}` : null,
    draft.validDays.length ? `Valid days: ${draft.validDays.join(', ')}` : null,
    draft.minimumSpend ? `Minimum spend: ${draft.minimumSpend}` : null,
    draft.promoCode || draft.title ? `Promo code: ${draft.promoCode || generatedPromoCode(draft.title)}` : null,
    draft.terms ? `Terms: ${draft.terms}` : null,
  ].filter(Boolean);
  return lines.join('\n\n');
}

function makePerkPayload(draft: OfferDraft, status: 'draft' | 'active') {
  const discountValue = parsePositiveNumber(draft.discountValue);
  const fixedAmount = draft.discountType === 'Fixed Amount ($)' && discountValue ? Math.round(discountValue * 100) : undefined;
  const cultures = [draft.primaryCulture, ...draft.secondaryCultures].filter(Boolean);
  const city = draft.cities.split(',')[0]?.trim() || draft.location.split(',')[0]?.trim() || 'Sydney';
  const payload: Record<string, unknown> = {
    title: draft.title.trim(),
    description: buildDescription(draft),
    coverUrl: draft.offerImage.trim() || undefined,
    cultureTags: cultures,
    categories: [draft.category, draft.targetAudience, ...draft.distribution],
    perkType: perkTypeFor(draft),
    discountPercent: draft.discountType === 'Percentage (%)' ? discountValue : undefined,
    discountFixedCents: fixedAmount,
    partnerName: draft.businessName.trim() || undefined,
    status,
    usageLimit: parsePositiveNumber(draft.redemptionLimit),
    perUserLimit: draft.approvalWorkflow === 'Manual approval required' ? 1 : undefined,
    isMembershipRequired: draft.targetAudience === 'Community Members Only' || draft.category === 'Member Exclusive Perk',
    expiresAt: draft.expiryDate.trim() || undefined,
    city,
    country: 'Australia',
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''));
}

function Section({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const accent = color || CultureTokens.coral;
  return (
    <View style={[styles.section, { borderColor: colors.borderLight, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
      <View style={styles.sectionHeader}>
        <GlassView intensity={10} style={[styles.sectionIcon, { backgroundColor: accent + '25' }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </GlassView>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: CultureTokens.coral }}> *</Text>}
        </Text>
        {hint && <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function FormInput({ ...props }: TextInput['props']) {
  const colors = useColors();
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      style={[
        styles.input,
        {
          backgroundColor: colors.background + '80',
          borderColor: colors.borderLight,
          color: colors.text,
        },
        props.multiline && styles.textarea,
      ]}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
    />
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
  const colors = useColors();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
        {hint ? <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text> : null}
      </View>
      {children}
    </View>
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
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : undefined}
      style={[
        multiline ? styles.textarea : styles.input,
        {
          borderColor: colors.borderLight,
          backgroundColor: colors.background + '80',
          color: colors.text
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
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${label}`}
      accessibilityState={{ selected }}
    >
      <GlassView
        intensity={selected ? 20 : 5}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? CultureTokens.coral : 'transparent',
            borderColor: selected ? CultureTokens.coral : colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? '#fff' : colors.textSecondary }]}>{label}</Text>
      </GlassView>
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

function OfferPreview({ draft, colors }: { draft: OfferDraft; colors: ColorTheme }) {
  const title = draft.title.trim() || '20% Off Kerala Feast at Sydney Spice';
  const shortDescription = draft.shortDescription || 'Exclusive cultural perk for CulturePass members.';
  const promoCode = draft.promoCode || generatedPromoCode(draft.title);
  const culture = draft.primaryCulture || draft.secondaryCultures[0] || 'Malayalee';

  return (
    <GlassView intensity={10} style={[styles.previewPanel, { borderColor: colors.borderLight, backgroundColor: colors.background + '40' }]}>
      <View style={[styles.previewImage, { backgroundColor: draft.accentColor || CultureTokens.coral }]}>
        {draft.offerImage ? (
          <Image source={{ uri: draft.offerImage }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
        ) : (
          <Ionicons name="pricetag-outline" size={34} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.previewContent}>
        <View style={styles.previewTopRow}>
          <Text style={[styles.previewBadge, { color: CultureTokens.coral }]}>{draft.category.toUpperCase()}</Text>
          <Text style={[styles.previewBadge, { color: CultureTokens.teal }]}>{culture.toUpperCase()}</Text>
        </View>
        <Text style={[styles.previewTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.previewDate, { color: colors.eventDate }]}>
          {expiryCountdown(draft.expiryDate)} | {draft.validTime || 'Any time'}
        </Text>
        <Text style={[styles.previewBody, { color: colors.textSecondary }]} numberOfLines={3}>
          {shortDescription}
        </Text>
        <View style={styles.previewMetaRow}>
          <Ionicons name="business-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
            {draft.businessName || 'Partner business'}
          </Text>
        </View>
        <View style={styles.previewMetaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
            {draft.location || draft.cities || 'Sydney'}
          </Text>
        </View>
        <View style={[styles.redeemBox, { borderColor: colors.borderLight, backgroundColor: colors.surface + '40' }]}>
          <Text style={[styles.redeemCode, { color: colors.text }]}>{promoCode}</Text>
          <Button variant="primary" size="sm" leftIcon="qr-code-outline" accessibilityLabel="Example redemption button">
            Redeem
          </Button>
        </View>
      </View>
    </GlassView>
  );
}

export function HostspaceOfferCreateForm({ onReview }: { onReview?: () => void }) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const { user } = useAuth();
  const { uploadImage, uploading: imageUploading } = useImageUpload();

  const [draft, setDraft] = useState<OfferDraft>(INITIAL_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<'draft' | 'published' | null>(null);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [newSponsor, setNewSponsor] = useState<Sponsor>({ id: '', name: '', tier: 'gold' });
  const showPreview = true;

  const promoPreview = useMemo(() => draft.promoCode || generatedPromoCode(draft.title), [draft.promoCode, draft.title]);

  const updateDraft = (patch: Partial<OfferDraft>) => {
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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const { downloadURL } = await uploadImage(result, 'offers', user?.id || 'anon', 'offer', true);
        updateDraft({ offerImage: downloadURL });
      } catch {
        Alert.alert('Upload failed', 'Could not upload image.');
      }
    }
  };

  const validate = () => {
    if (!draft.title.trim()) return 'Add an offer title.';
    if (!draft.shortDescription.trim() && !draft.fullDescription.trim()) return 'Add a short or full description.';
    if (!draft.category.trim()) return 'Choose an offer category.';
    if (!draft.startDate.trim()) return 'Add a start date.';
    if (!draft.expiryDate.trim()) return 'Add an expiry date.';
    if (!draft.discountValue.trim() && draft.discountType !== 'Free Item / Service') return 'Add the discount value.';
    if (!draft.businessName.trim()) return 'Add a business or venue name.';
    return null;
  };

  const saveOffer = async (status: 'draft' | 'active') => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Offer needs a little more detail', validationError);
      return;
    }

    setIsSaving(true);
    try {
      const created = await api.perks.create(makePerkPayload(draft, status));
      setLastSaved(status === 'draft' ? 'draft' : 'published');
      Alert.alert(status === 'draft' ? 'Draft saved' : 'Offer published', `${created.title} is now ${status}.`);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        Alert.alert('Sign in required', 'Please sign in again to continue creating offers.');
      } else if (err instanceof ApiError && err.isForbidden) {
        Alert.alert('Host access needed', 'Offers require an organizer, admin, or platform admin account.');
      } else {
        Alert.alert('Could not save offer', err instanceof Error ? err.message : 'Please try again in a moment.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={[styles.eyebrow, { color: CultureTokens.coral }]}>HostSpace offer</Text>
        <Text style={[styles.title, { color: colors.text }]}>Create New Offer</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Attract more members with exclusive cultural perks & deals
        </Text>
      </View>

      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.formColumn}>
          <Section title="Offer Basics" icon="create-outline">
            <Field label="Offer Title" required>
              <DraftInput
                value={draft.title}
                onChangeText={(title) => updateDraft({ title })}
                placeholder="20% Off Kerala Feast at Sydney Spice"
                accessibilityLabel="Offer title"
              />
            </Field>
            <Field label="Short Description" hint={`${draft.shortDescription.length}/100`}>
              <DraftInput
                value={draft.shortDescription}
                onChangeText={(shortDescription) => updateDraft({ shortDescription: shortDescription.slice(0, 100) })}
                placeholder="A sharp value proposition for offer cards"
                accessibilityLabel="Short description"
              />
            </Field>
            <Field label="Full Description">
              <DraftInput
                value={draft.fullDescription}
                onChangeText={(fullDescription) => updateDraft({ fullDescription })}
                placeholder="Tell members what is included, how to redeem, and why this offer matters."
                multiline
                accessibilityLabel="Full description"
              />
            </Field>
          </Section>

          <Section title="Offer Type" icon="sparkles-outline">
            <Field label="Offer Category" required>
              <SingleChoice options={OFFER_CATEGORIES} value={draft.category} onChange={(category) => updateDraft({ category })} />
            </Field>
            <Field label="Target Audience">
              <SingleChoice options={AUDIENCES} value={draft.targetAudience} onChange={(targetAudience) => updateDraft({ targetAudience })} />
            </Field>
          </Section>

          <Section title="Culture & Language" icon="language-outline">
            <Field label="Primary Culture" hint="Recommended">
              <MultiChoice
                options={CULTURES}
                values={draft.primaryCulture ? [draft.primaryCulture] : []}
                onChange={(values) => updateDraft({ primaryCulture: values[values.length - 1] ?? '' })}
              />
            </Field>
            <Field label="Secondary Cultures">
              <MultiChoice options={CULTURES} values={draft.secondaryCultures} onChange={(secondaryCultures) => updateDraft({ secondaryCultures })} />
            </Field>
            <Field label="Language">
              <MultiChoice options={LANGUAGES} values={draft.languages} onChange={(languages) => updateDraft({ languages })} />
            </Field>
          </Section>

          <Section title="Validity & Schedule" icon="calendar-outline">
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <DateField
                  label="Start Date"
                  value={draft.startDate}
                  onChange={(startDate) => updateDraft({ startDate })}
                  allowFutureDates={true}
                  required
                />
              </View>
              <View style={{ flex: 1 }}>
                <DateField
                  label="Expiry Date"
                  value={draft.expiryDate}
                  onChange={(expiryDate) => updateDraft({ expiryDate })}
                  allowFutureDates={true}
                  required
                />
              </View>
            </View>
            <Field label="Valid Days">
              <MultiChoice options={VALID_DAYS} values={draft.validDays} onChange={(validDays) => updateDraft({ validDays })} />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Valid Time">
                <DraftInput value={draft.validTime} onChangeText={(validTime) => updateDraft({ validTime })} placeholder="Weekends, lunch hours, 11am-3pm" accessibilityLabel="Valid time" />
              </Field>
              <Field label="Redemption Limit">
                <DraftInput value={draft.redemptionLimit} onChangeText={(redemptionLimit) => updateDraft({ redemptionLimit })} placeholder="250" accessibilityLabel="Redemption limit" />
              </Field>
            </View>
          </Section>

          <Section title="Value & Pricing" icon="cash-outline">
            <Field label="Discount Type">
              <SingleChoice options={DISCOUNT_TYPES} value={draft.discountType} onChange={(discountType) => updateDraft({ discountType })} />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Discount Value" required>
                <DraftInput value={draft.discountValue} onChangeText={(discountValue) => updateDraft({ discountValue })} placeholder="20 or 15.00" accessibilityLabel="Discount value" />
              </Field>
              <Field label="Minimum Spend">
                <DraftInput value={draft.minimumSpend} onChangeText={(minimumSpend) => updateDraft({ minimumSpend })} placeholder="$50" accessibilityLabel="Minimum spend" />
              </Field>
            </View>
            <Field label="Promo Code" hint={promoPreview}>
              <DraftInput value={draft.promoCode} onChangeText={(promoCode) => updateDraft({ promoCode: promoCode.toUpperCase() })} placeholder="Auto-generated or custom" accessibilityLabel="Promo code" />
            </Field>
          </Section>

          <Section title="Visuals (1:1)" icon="image-outline">
            <Field label="Offer Image" hint="Squared 1:1 format">
              <MediaUploadField
                type="logo"
                value={draft.offerImage}
                onChange={(url) => updateDraft({ offerImage: url as string })}
                storagePath={`offers/${user?.id || 'anonymous'}/cover`}
                aspectRatio={1}
              />
            </Field>
            <Field label="Gallery" hint="Up to 4 images">
              <MediaUploadField
                type="gallery"
                value={draft.gallery ? draft.gallery.split(',').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(val) => {
                  const arr = Array.isArray(val) ? val : [val];
                  updateDraft({ gallery: arr.join(',') });
                }}
                storagePath={`offers/${user?.id || 'anonymous'}/gallery`}
                maxItems={4}
              />
            </Field>
            <Field label="Accent Color">
              <DraftInput value={draft.accentColor} onChangeText={(accentColor) => updateDraft({ accentColor })} placeholder={CultureTokens.coral} accessibilityLabel="Accent color" />
            </Field>
          </Section>

          <Section title="Partner / Business Info" icon="business-outline">
            <Field label="Business / Venue Name" required>
              <DraftInput value={draft.businessName} onChangeText={(businessName) => updateDraft({ businessName })} placeholder="Search existing or create new" accessibilityLabel="Business or venue name" />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Business Link">
                <DraftInput value={draft.businessLink} onChangeText={(businessLink) => updateDraft({ businessLink })} placeholder="https://..." accessibilityLabel="Business link" />
              </Field>
              <Field label="Location">
                <DraftInput value={draft.location} onChangeText={(location) => updateDraft({ location })} placeholder="Map picker placeholder" accessibilityLabel="Location" />
              </Field>
            </View>

            <View style={styles.divider} />

            <View style={styles.teamSectionHeader}>
              <Ionicons name="ribbon-outline" size={20} color={CultureTokens.gold} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Offer Sponsors</Text>
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
                  placeholder="Sponsor Name"
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
                Add Offer Sponsor
              </Button>
            )}
          </Section>

          <Section title="Terms & Conditions" icon="document-text-outline">
            <Field label="Terms">
              <DraftInput value={draft.terms} onChangeText={(terms) => updateDraft({ terms })} placeholder="Expiry rules, blackout dates, non-transferable details." multiline accessibilityLabel="Terms and conditions" />
            </Field>
            <View style={[styles.switchRow, { borderColor: colors.borderLight }]}>
              <View style={styles.switchText}>
                <Text style={[styles.label, { color: colors.text }]}>Manual approval required</Text>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>Review each redemption before the member can use it.</Text>
              </View>
              <Switch
                value={draft.approvalWorkflow === 'Manual approval required'}
                onValueChange={(manual) => updateDraft({ approvalWorkflow: manual ? 'Manual approval required' : 'Auto-approve redemptions' })}
                accessibilityLabel="Manual approval required"
              />
            </View>
          </Section>

          <Section title="Social & Discovery" icon="megaphone-outline" color={CultureTokens.coral}>
             <FormField label="SEO / Social Title" hint="Custom title for sharing links">
               <FormInput value={draft.socialTitle} onChangeText={(socialTitle) => updateDraft({ socialTitle })} placeholder={draft.title || "Exclusive Cultural Perk"} />
             </FormField>
             <FormField label="SEO / Social Description">
               <FormInput value={draft.socialDescription} onChangeText={(socialDescription) => updateDraft({ socialDescription })} placeholder="Summary for social previews..." multiline />
             </FormField>
          </Section>

          <Section title="Distribution" icon="share-social-outline">
            <Field label="Where to Show This Offer">
              <MultiChoice options={DISTRIBUTION} values={draft.distribution} onChange={(distribution) => updateDraft({ distribution })} />
            </Field>
            <View style={styles.twoCol}>
              <Field label="Specific Communities">
                <DraftInput value={draft.communities} onChangeText={(communities) => updateDraft({ communities })} placeholder="Malayalee Sydney, Filipino Families" accessibilityLabel="Specific communities" />
              </Field>
              <Field label="Specific Cities">
                <DraftInput value={draft.cities} onChangeText={(cities) => updateDraft({ cities })} placeholder="Sydney, Melbourne" accessibilityLabel="Specific cities" />
              </Field>
            </View>
          </Section>

          <View style={styles.bottomActions}>
            <Button variant="primary" leftIcon="rocket-outline" onPress={() => saveOffer('active')} disabled={isSaving} style={{ flex: 2 }}>
              Publish Offer
            </Button>
            <Button variant="outline" leftIcon="analytics-outline" onPress={onReview} style={{ flex: 1.2 }}>
              Review
            </Button>
            <Button variant="outline" leftIcon="save-outline" onPress={() => saveOffer('draft')} disabled={isSaving} style={{ flex: 1 }}>
              Save Draft
            </Button>
          </View>
          {isSaving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={CultureTokens.indigo} />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Saving offer...</Text>
            </View>
          ) : null}
          {lastSaved ? (
            <Text style={[styles.savedText, { color: CultureTokens.teal }]}>
              Last saved as {lastSaved}. The current Perks API stores core offer fields; richer targeting fields are composed into description and categories today.
            </Text>
          ) : null}
        </View>

        {showPreview ? (
          <View style={[styles.previewColumn, isDesktop && styles.previewColumnDesktop]}>
            <Text style={[styles.previewHeading, { color: colors.text }]}>Live Preview</Text>
            <OfferPreview draft={draft} colors={colors} />
            <View style={[styles.previewNote, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
              <Text style={[styles.previewNoteTitle, { color: colors.text }]}>Offer card signals</Text>
              <Text style={[styles.previewBody, { color: colors.textSecondary }]}>
                {draft.primaryCulture || 'Cultural'} badge | {draft.approvalWorkflow} | {expiryCountdown(draft.expiryDate)}
              </Text>
            </View>
            <Button variant="outline" leftIcon="open-outline" onPress={() => router.push('/offers' as never)} accessibilityLabel="Open offers page">
              Open Offers
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
    gap: Spacing.md,
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
    gap: Spacing.md,
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
    gap: Spacing.md,
  },
  field: {
    gap: 7,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  textarea: {
    minHeight: 118,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 21,
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
  brandingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandingIconPh: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandingLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  brandingSub: {
    fontSize: 11,
    opacity: 0.7,
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
  redeemBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  redeemCode: {
    ...TextStyles.body,
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    lineHeight: 18,
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
});
