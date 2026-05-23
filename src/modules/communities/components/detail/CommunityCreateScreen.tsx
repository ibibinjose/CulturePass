import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { useCreateCommunity } from '@/modules/communities/hooks/useCommunities';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { CardTokens, CultureTokens, FontFamily, InputTokens } from '@/design-system/tokens/theme';
import { FontSize, LineHeight, TextStyles } from '@/design-system/tokens/typography';
import { getCommunityProfilePathId } from '@/lib/community';
import {
  COMMUNITY_LEGAL_STATUS_LABELS,
  type CommunityCategory,
  type CommunityJoinMode,
  type CommunityLegalStatus,
  type CommunityLeader,
  type CommunityPartner,
  type CommunityPartnerType,
} from '@/shared/schema';

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 'basic' | 'about' | 'culture' | 'governance' | 'leadership' | 'contact' | 'partners';

const ALL_STEPS: Step[] = ['basic', 'about', 'culture', 'governance', 'leadership', 'contact', 'partners'];

const STEP_META: Record<Step, { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }> = {
  basic:      { title: 'Basic Info',        sub: 'Name, category and join mode',          icon: 'information-circle-outline' },
  about:      { title: 'About & Founding',  sub: 'Your story and origins',                icon: 'book-outline' },
  culture:    { title: 'Cultural Identity', sub: 'Cultures and languages you represent',  icon: 'globe-outline' },
  governance: { title: 'Governance',        sub: 'Legal structure and registration',      icon: 'shield-checkmark-outline' },
  leadership: { title: 'Leadership',        sub: 'Who leads the community',               icon: 'people-outline' },
  contact:    { title: 'Contact & Links',   sub: 'Location and social presence',          icon: 'location-outline' },
  partners:   { title: 'Partners',          sub: 'Sponsors, supporters, and funders',     icon: 'ribbon-outline' },
};

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

const JOIN_MODE_OPTIONS: { id: CommunityJoinMode; label: string; sub: string }[] = [
  { id: 'open',    label: 'Open',        sub: 'Anyone can join instantly' },
  { id: 'request', label: 'Request',     sub: 'Members request to join'   },
  { id: 'invite',  label: 'Invite only', sub: 'By invitation only'        },
];

const PARTNER_TYPE_OPTIONS: { id: CommunityPartnerType; label: string }[] = [
  { id: 'partner',   label: 'Partner'   },
  { id: 'supporter', label: 'Supporter' },
  { id: 'sponsor',   label: 'Sponsor'   },
  { id: 'funder',    label: 'Funder'    },
];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  communityCategory: CommunityCategory;
  joinMode: CommunityJoinMode;
  description: string;
  foundedDate: string;
  foundedLocation: string;
  foundingStory: string;
  cultureTags: string[];
  languages: string[];
  legalStatus: CommunityLegalStatus | '';
  registrationNumber: string;
  governingStructure: string;
  leadership: CommunityLeader[];
  city: string;
  country: string;
  website: string;
  instagram: string;
  facebook: string;
  partners: CommunityPartner[];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function validateStep(step: Step, form: FormState): string | null {
  if (step === 'basic' && form.name.trim().length < 2) {
    return 'Community name must be at least 2 characters.';
  }
  if (step === 'contact' && !form.city.trim()) {
    return 'Please enter a city.';
  }
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export default function CommunityCreateScreen() {
  const colors = useColors();
  const { hPad, contentWidth, isDesktop, isWeb } = useLayout();
  const joinStacked = contentWidth < 360;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 30 : insets.bottom;
  const { state: onboarding } = useOnboarding();
  const createCommunity = useCreateCommunity();
  const scrollRef = useRef<ScrollView>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>({
    name: '', communityCategory: 'cultural', joinMode: 'open',
    description: '', foundedDate: '', foundedLocation: '', foundingStory: '',
    cultureTags: [], languages: [],
    legalStatus: '', registrationNumber: '', governingStructure: '',
    leadership: [],
    city: onboarding.city || '', country: onboarding.country || 'Australia',
    website: '', instagram: '', facebook: '',
    partners: [],
  });
  const [stepError, setStepError] = useState<string | null>(null);

  // Chip inputs
  const [tagInput, setTagInput] = useState('');
  const [langInput, setLangInput] = useState('');

  // Leadership draft
  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [leaderName, setLeaderName] = useState('');
  const [leaderRole, setLeaderRole] = useState('');

  // Partner draft
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<CommunityPartnerType>('partner');
  const [partnerWebsite, setPartnerWebsite] = useState('');

  const currentStep = ALL_STEPS[stepIndex];
  const isLast = stepIndex === ALL_STEPS.length - 1;
  const meta = STEP_META[currentStep];

  const setField = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  const goNext = useCallback(() => {
    // Dismiss open inline forms without saving
    setShowLeaderForm(false);
    setShowPartnerForm(false);
    const err = validateStep(currentStep, form);
    if (err) { setStepError(err); return; }
    setStepError(null);
    scrollToTop();
    setStepIndex(i => i + 1);
  }, [currentStep, form]);

  const goBack = useCallback(() => {
    setStepError(null);
    setShowLeaderForm(false);
    setShowPartnerForm(false);
    scrollToTop();
    setStepIndex(i => Math.max(0, i - 1));
  }, []);

  const addTag = useCallback(() => {
    const v = tagInput.trim();
    if (!v || form.cultureTags.includes(v)) { setTagInput(''); return; }
    setField('cultureTags', [...form.cultureTags, v]);
    setTagInput('');
  }, [tagInput, form.cultureTags, setField]);

  const addLang = useCallback(() => {
    const v = langInput.trim();
    if (!v || form.languages.includes(v)) { setLangInput(''); return; }
    setField('languages', [...form.languages, v]);
    setLangInput('');
  }, [langInput, form.languages, setField]);

  const addLeader = useCallback(() => {
    if (!leaderName.trim() || !leaderRole.trim()) return;
    setField('leadership', [...form.leadership, {
      id: uid(), name: leaderName.trim(), roleTitle: leaderRole.trim(), isCurrent: true,
    }]);
    setLeaderName(''); setLeaderRole(''); setShowLeaderForm(false);
  }, [leaderName, leaderRole, form.leadership, setField]);

  const addPartner = useCallback(() => {
    if (!partnerName.trim()) return;
    setField('partners', [...form.partners, {
      id: uid(), name: partnerName.trim(), partnerType,
      website: partnerWebsite.trim() || undefined,
    }]);
    setPartnerName(''); setPartnerWebsite(''); setPartnerType('partner'); setShowPartnerForm(false);
  }, [partnerName, partnerType, partnerWebsite, form.partners, setField]);

  const handleSubmit = useCallback(() => {
    if (form.name.trim().length < 2) {
      Alert.alert('Missing name', 'Please go back and add a community name.');
      return;
    }
    createCommunity.mutate(
      {
        name: form.name.trim(),
        communityCategory: form.communityCategory,
        joinMode: form.joinMode,
        description: form.description.trim() || undefined,
        foundedDate: form.foundedDate.trim() || undefined,
        foundedLocation: form.foundedLocation.trim() || undefined,
        foundingStory: form.foundingStory.trim() || undefined,
        cultureTags: form.cultureTags.length ? form.cultureTags : undefined,
        languages: form.languages.length ? form.languages : undefined,
        legalStatus: (form.legalStatus as CommunityLegalStatus) || undefined,
        registrationNumber: form.registrationNumber.trim() || undefined,
        governingStructure: form.governingStructure.trim() || undefined,
        leadership: form.leadership.length ? form.leadership : undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        website: form.website.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        facebook: form.facebook.trim() || undefined,
        partners: form.partners.length ? form.partners : undefined,
      },
      {
        onSuccess: (community) => router.replace(`/c/${getCommunityProfilePathId(community)}`),
        onError: () => Alert.alert('Could not create community', 'Please try again in a moment.'),
      },
    );
  }, [form, createCommunity]);

  // ─── Step content ─────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <>
            <Field label="Community name *" colors={colors}>
              <StyledInput
                value={form.name}
                onChangeText={v => setField('name', v)}
                placeholder="e.g. Sydney Malayali Circle"
                autoCapitalize="words"
                maxLength={120}
                colors={colors}
              />
            </Field>

            <Field label="Category" colors={colors}>
              <View style={s.pillRow}>
                {CATEGORY_OPTIONS.map(opt => (
                  <SelectablePill
                    key={opt.id}
                    label={opt.label}
                    active={form.communityCategory === opt.id}
                    onPress={() => setField('communityCategory', opt.id)}
                    colors={colors}
                  />
                ))}
              </View>
            </Field>

            <Field label="Join mode" colors={colors}>
              <View style={[s.joinGrid, joinStacked && s.joinGridStacked]}>
                {JOIN_MODE_OPTIONS.map(opt => {
                  const active = form.joinMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setField('joinMode', opt.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        s.joinCard,
                        joinStacked && s.joinCardStacked,
                        webPointer,
                        {
                          borderColor: active ? CultureTokens.indigo : colors.borderLight,
                          backgroundColor: active ? CultureTokens.indigo + '12' : colors.surface,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}
                    >
                      {active && (
                        <View style={[s.joinCheck, { backgroundColor: CultureTokens.indigo }]}>
                          <Ionicons name="checkmark" size={11} color="#fff" />
                        </View>
                      )}
                      <Text style={[s.joinLabel, { color: active ? CultureTokens.indigo : colors.text }]}>
                        {opt.label}
                      </Text>
                      <Text style={[s.joinSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          </>
        );

      case 'about':
        return (
          <>
            <Field label="About this community" colors={colors}>
              <StyledInput
                value={form.description}
                onChangeText={v => setField('description', v)}
                placeholder="What is this community about? What makes it special?"
                multiline
                colors={colors}
              />
            </Field>
            <Field label="Founded date" colors={colors}>
              <StyledInput
                value={form.foundedDate}
                onChangeText={v => setField('foundedDate', v)}
                placeholder="e.g. 1992 or 15 March 1992"
                colors={colors}
              />
            </Field>
            <Field label="Founded location" colors={colors}>
              <StyledInput
                value={form.foundedLocation}
                onChangeText={v => setField('foundedLocation', v)}
                placeholder="e.g. Sydney, Australia"
                colors={colors}
              />
            </Field>
            <Field label="Founding story" colors={colors}>
              <StyledInput
                value={form.foundingStory}
                onChangeText={v => setField('foundingStory', v)}
                placeholder="How was this community started? Who founded it and why?"
                multiline
                colors={colors}
              />
            </Field>
          </>
        );

      case 'culture':
        return (
          <>
            <Field label="Cultures & heritage tags" colors={colors}>
              <ChipInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="e.g. Malayali, Tamil, Greek…"
                onAdd={addTag}
                chips={form.cultureTags}
                onRemove={t => setField('cultureTags', form.cultureTags.filter(x => x !== t))}
                colors={colors}
              />
            </Field>
            <Field label="Languages" colors={colors}>
              <ChipInput
                value={langInput}
                onChangeText={setLangInput}
                placeholder="e.g. Malayalam, English, Mandarin…"
                onAdd={addLang}
                chips={form.languages}
                onRemove={l => setField('languages', form.languages.filter(x => x !== l))}
                colors={colors}
              />
            </Field>
          </>
        );

      case 'governance':
        return (
          <>
            <Field label="Legal status" colors={colors}>
              <View style={s.pillRow}>
                {(Object.keys(COMMUNITY_LEGAL_STATUS_LABELS) as CommunityLegalStatus[]).map(status => (
                  <SelectablePill
                    key={status}
                    label={COMMUNITY_LEGAL_STATUS_LABELS[status]}
                    active={form.legalStatus === status}
                    onPress={() => setField('legalStatus', form.legalStatus === status ? '' : status)}
                    colors={colors}
                  />
                ))}
              </View>
            </Field>
            <Field label="Registration number" colors={colors}>
              <StyledInput
                value={form.registrationNumber}
                onChangeText={v => setField('registrationNumber', v)}
                placeholder="e.g. A0012345 or ABN 12 345 678 901"
                autoCapitalize="characters"
                colors={colors}
              />
            </Field>
            <Field label="Governing structure" colors={colors}>
              <StyledInput
                value={form.governingStructure}
                onChangeText={v => setField('governingStructure', v)}
                placeholder="Describe your governance model, constitution, or bylaws summary…"
                multiline
                colors={colors}
              />
            </Field>
          </>
        );

      case 'leadership':
        return (
          <>
            {form.leadership.map(leader => (
              <View key={leader.id} style={[s.itemRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <View style={[s.itemIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                  <Ionicons name="person-outline" size={17} color={CultureTokens.indigo} />
                </View>
                <View style={s.itemText}>
                  <Text style={[s.itemName, { color: colors.text }]}>{leader.name}</Text>
                  <Text style={[s.itemSub, { color: colors.textSecondary }]}>{leader.roleTitle}</Text>
                </View>
                <Pressable
                  onPress={() => setField('leadership', form.leadership.filter(l => l.id !== leader.id))}
                  accessibilityLabel={`Remove ${leader.name}`}
                  style={s.itemRemove}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}

            {showLeaderForm ? (
              <View style={[s.inlineForm, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <Text style={[s.inlineFormTitle, { color: colors.text }]}>Add a leader</Text>
                <Field label="Name" colors={colors}>
                  <StyledInput value={leaderName} onChangeText={setLeaderName} placeholder="Full name" colors={colors} />
                </Field>
                <Field label="Role title" colors={colors}>
                  <StyledInput
                    value={leaderRole}
                    onChangeText={setLeaderRole}
                    placeholder="e.g. President, Treasurer, Cultural Director"
                    colors={colors}
                  />
                </Field>
                <View style={s.inlineFormActions}>
                  <Button
                    variant="secondary"
                    onPress={() => { setShowLeaderForm(false); setLeaderName(''); setLeaderRole(''); }}
                    style={s.inlineCancel}
                  >Cancel</Button>
                  <Button onPress={addLeader} disabled={!leaderName.trim() || !leaderRole.trim()} style={s.inlineSave}>
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowLeaderForm(true)}
                style={({ pressed }) => [
                  s.addRow,
                  webPointer,
                  { borderColor: colors.borderLight, opacity: pressed ? 0.88 : 1 },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={20} color={CultureTokens.indigo} />
                <Text style={[s.addRowText, { color: CultureTokens.indigo }]}>Add a leader</Text>
              </Pressable>
            )}

            {form.leadership.length === 0 && !showLeaderForm && (
              <Text style={[s.hint, { color: colors.textTertiary }]}>
                Optional — you can add leadership details after creation.
              </Text>
            )}
          </>
        );

      case 'contact':
        return (
          <>
            <Field label="City *" colors={colors}>
              <StyledInput value={form.city} onChangeText={v => setField('city', v)} placeholder="Sydney" colors={colors} />
            </Field>
            <Field label="Country" colors={colors}>
              <StyledInput value={form.country} onChangeText={v => setField('country', v)} placeholder="Australia" colors={colors} />
            </Field>
            <Field label="Website" colors={colors}>
              <StyledInput
                value={form.website}
                onChangeText={v => setField('website', v)}
                placeholder="https://…"
                autoCapitalize="none"
                keyboardType="url"
                colors={colors}
              />
            </Field>
            <Field label="Instagram" colors={colors}>
              <StyledInput
                value={form.instagram}
                onChangeText={v => setField('instagram', v)}
                placeholder="@handle or full URL"
                autoCapitalize="none"
                colors={colors}
              />
            </Field>
            <Field label="Facebook" colors={colors}>
              <StyledInput
                value={form.facebook}
                onChangeText={v => setField('facebook', v)}
                placeholder="Page name or full URL"
                autoCapitalize="none"
                colors={colors}
              />
            </Field>
          </>
        );

      case 'partners':
        return (
          <>
            {form.partners.map(partner => (
              <View key={partner.id} style={[s.itemRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <View style={[s.itemIcon, { backgroundColor: CultureTokens.teal + '18' }]}>
                  <Ionicons name="ribbon-outline" size={17} color={CultureTokens.teal} />
                </View>
                <View style={s.itemText}>
                  <Text style={[s.itemName, { color: colors.text }]}>{partner.name}</Text>
                  <Text style={[s.itemSub, { color: colors.textSecondary }]}>
                    {PARTNER_TYPE_OPTIONS.find(o => o.id === partner.partnerType)?.label ?? partner.partnerType}
                    {partner.website ? ` · ${partner.website}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setField('partners', form.partners.filter(p => p.id !== partner.id))}
                  accessibilityLabel={`Remove ${partner.name}`}
                  style={s.itemRemove}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}

            {showPartnerForm ? (
              <View style={[s.inlineForm, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <Text style={[s.inlineFormTitle, { color: colors.text }]}>Add a partner</Text>
                <Field label="Name" colors={colors}>
                  <StyledInput value={partnerName} onChangeText={setPartnerName} placeholder="Organisation name" colors={colors} />
                </Field>
                <Field label="Type" colors={colors}>
                  <View style={s.pillRow}>
                    {PARTNER_TYPE_OPTIONS.map(opt => (
                      <SelectablePill
                        key={opt.id}
                        label={opt.label}
                        active={partnerType === opt.id}
                        onPress={() => setPartnerType(opt.id)}
                        colors={colors}
                      />
                    ))}
                  </View>
                </Field>
                <Field label="Website (optional)" colors={colors}>
                  <StyledInput
                    value={partnerWebsite}
                    onChangeText={setPartnerWebsite}
                    placeholder="https://…"
                    autoCapitalize="none"
                    keyboardType="url"
                    colors={colors}
                  />
                </Field>
                <View style={s.inlineFormActions}>
                  <Button
                    variant="secondary"
                    onPress={() => { setShowPartnerForm(false); setPartnerName(''); setPartnerWebsite(''); setPartnerType('partner'); }}
                    style={s.inlineCancel}
                  >Cancel</Button>
                  <Button onPress={addPartner} disabled={!partnerName.trim()} style={s.inlineSave}>
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowPartnerForm(true)}
                style={({ pressed }) => [
                  s.addRow,
                  webPointer,
                  { borderColor: colors.borderLight, opacity: pressed ? 0.88 : 1 },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={20} color={CultureTokens.teal} />
                <Text style={[s.addRowText, { color: CultureTokens.teal }]}>Add a partner</Text>
              </Pressable>
            )}

            {form.partners.length === 0 && !showPartnerForm && (
              <Text style={[s.hint, { color: colors.textTertiary }]}>
                Optional — list your sponsors, supporters, or funders.
              </Text>
            )}
          </>
        );
    }
  };

  // ─── Layout ───────────────────────────────────────────────────────────────

  const progress = (stepIndex + 1) / ALL_STEPS.length;

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {/* Compact gradient header */}
        <LinearGradient
          colors={[CultureTokens.indigo, '#1B0F2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: topInset + 16, paddingHorizontal: hPad }]}
        >
          <View style={s.headerRow}>
            <GlassView borderRadius={22} style={s.backGlass} contentStyle={s.backGlassInner}>
              <Pressable
                onPress={() =>
                  stepIndex === 0
                    ? router.canGoBack()
                      ? router.back()
                      : router.replace('/(tabs)/community')
                    : goBack()
                }
                style={s.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </Pressable>
            </GlassView>

            <View style={s.headerCenter}>
              <Text style={s.stepCount}>Step {stepIndex + 1} of {ALL_STEPS.length}</Text>
              <Text style={s.stepName} numberOfLines={1}>{meta.title}</Text>
            </View>

            <View style={s.headerIconWrap} accessibilityElementsHidden>
              <Ionicons name={meta.icon} size={22} color="rgba(255,255,255,0.72)" />
            </View>
          </View>

          {/* Progress bar */}
            <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ now: stepIndex + 1, min: 1, max: ALL_STEPS.length }}>
            <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
          </View>

          {/* Step dots */}
          <View style={s.dotsRow}>
            {ALL_STEPS.map((step, i) => (
              <View key={step} style={[s.dotWrap, i < ALL_STEPS.length - 1 && s.dotWrapFlex]}>
                <View
                  style={[
                    s.dot,
                    i < stepIndex  && { backgroundColor: CultureTokens.teal },
                    i === stepIndex && s.dotActive,
                    i > stepIndex  && s.dotFuture,
                  ]}
                />
                {i < ALL_STEPS.length - 1 && (
                  <View style={[s.dotLine, { backgroundColor: i < stepIndex ? CultureTokens.teal : 'rgba(255,255,255,0.2)' }]} />
                )}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Scrollable content */}
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: bottomInset + 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.formColumn, isWeb && isDesktop && s.formColumnDesktop]}>
            {/* Step header */}
            <GlassView
              borderRadius={CardTokens.radius}
              style={[s.stepCard, s.cardElevated]}
              contentStyle={s.stepCardContent}
            >
              <View style={[s.stepIconWrap, { backgroundColor: CultureTokens.indigo + '18' }]}>
                <Ionicons name={meta.icon} size={22} color={CultureTokens.indigo} />
              </View>
              <View style={s.stepMeta}>
                <Text style={[TextStyles.title3, s.stepMetaTitle, { color: colors.text }]}>{meta.title}</Text>
                <Text style={[TextStyles.callout, s.stepMetaSub, { color: colors.textSecondary }]}>{meta.sub}</Text>
              </View>
            </GlassView>

            {/* Validation error */}
            {stepError != null && (
              <View style={[s.errorBanner, { backgroundColor: (colors.error ?? '#FF5E5B') + '18', borderColor: (colors.error ?? '#FF5E5B') + '50' }]}>
                <Ionicons name="alert-circle-outline" size={17} color={colors.error ?? '#FF5E5B'} />
                <Text style={[TextStyles.callout, s.errorText, { color: colors.error ?? '#FF5E5B' }]}>{stepError}</Text>
              </View>
            )}

            {/* Step fields */}
            <GlassView
              borderRadius={CardTokens.radius}
              style={[s.formCard, s.cardElevated]}
              contentStyle={s.formCardContent}
            >
              {renderStep()}
            </GlassView>

            {/* Navigation */}
            <View style={s.navRow}>
              {stepIndex > 0 && (
                <Button variant="secondary" onPress={goBack} style={s.navBack}>
                  Back
                </Button>
              )}
              {isLast ? (
                <Button
                  onPress={handleSubmit}
                  loading={createCommunity.isPending}
                  style={[s.navNext, stepIndex === 0 && s.navNextFull]}
                >
                  Create Community
                </Button>
              ) : (
                <Button onPress={goNext} style={[s.navNext, stepIndex === 0 && s.navNextFull]}>
                  Next
                </Button>
              )}
            </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ErrorBoundary>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={s.field}>
      <Text style={[TextStyles.captionSemibold, s.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

function StyledInput({
  colors, multiline, ...props
}: React.ComponentProps<typeof TextInput> & { colors: ReturnType<typeof useColors> }) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={colors.textTertiary}
      style={[
        s.input,
        {
          color: colors.text,
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderLight,
          borderRadius: InputTokens.radius,
          paddingHorizontal: InputTokens.paddingH,
          paddingVertical: InputTokens.paddingV,
          minHeight: multiline ? 120 : InputTokens.height + 4,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
  );
}

function SelectablePill({
  label, active, onPress, colors,
}: {
  label: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        s.pill,
        webPointer,
        {
          backgroundColor: active ? CultureTokens.indigo + '16' : colors.surface,
          borderColor: active ? CultureTokens.indigo : colors.borderLight,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text style={[TextStyles.chip, s.pillText, { color: active ? CultureTokens.indigo : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function ChipInput({
  value, onChangeText, placeholder, onAdd, chips, onRemove, colors,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  onAdd: () => void;
  chips: string[];
  onRemove: (chip: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.chipWrap}>
      {chips.length > 0 && (
        <View style={s.chipList}>
          {chips.map(chip => (
            <Pressable
              key={chip}
              onPress={() => onRemove(chip)}
              accessibilityLabel={`Remove ${chip}`}
              style={({ pressed }) => [
                s.chip,
                webPointer,
                {
                  backgroundColor: CultureTokens.indigo + '16',
                  borderColor: CultureTokens.indigo + '40',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[s.chipText, { color: CultureTokens.indigo }]}>{chip}</Text>
              <Ionicons name="close" size={12} color={CultureTokens.indigo} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={s.chipInputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          onSubmitEditing={onAdd}
          style={[
            s.chipInputField,
            { flex: 1, color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
          ]}
        />
        <Pressable
          onPress={onAdd}
          disabled={!value.trim()}
          style={({ pressed }) => [
            s.chipAddBtn,
            webPointer,
            {
              backgroundColor: value.trim() ? CultureTokens.indigo : colors.borderLight,
              opacity: !value.trim() ? 1 : pressed ? 0.88 : 1,
            },
          ]}
          accessibilityLabel="Add tag"
        >
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // Header (horizontal padding from useLayout hPad)
  header: { paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14 },
  headerIconWrap: { width: 36, alignItems: 'flex-end', justifyContent: 'center' },
  backGlass: { alignSelf: 'flex-start' },
  backGlassInner: { padding: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  stepCount: { fontSize: 11, fontFamily: FontFamily.semibold, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.6 },
  stepName: { fontSize: 17, fontFamily: FontFamily.bold, color: '#fff', marginTop: 2 },

  // Progress bar
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 14 },
  progressFill: { height: 4, backgroundColor: CultureTokens.teal, borderRadius: 4 },

  // Step dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 14 },
  dotWrap: { flexDirection: 'row', alignItems: 'center' },
  dotWrapFlex: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#fff', width: 10, height: 10, borderRadius: 5 },
  dotFuture: { backgroundColor: 'rgba(255,255,255,0.25)' },
  dotLine: { flex: 1, height: 2, marginHorizontal: 3 },

  // Scroll
  scroll: { paddingTop: 16, gap: 14 },

  formColumn: { width: '100%', gap: 14 },
  formColumnDesktop: {
    maxWidth: 640,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        width: '100%',
      },
      default: {},
    }),
  },

  cardElevated: Platform.select({
    web: {
      boxShadow: '0 10px 36px rgba(0, 0, 0, 0.14)',
    },
    default: {},
  }),

  // Step header card
  stepCard: {},
  stepCardContent: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: CardTokens.paddingLarge },
  stepIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepMeta: { flex: 1 },
  stepMetaTitle: { marginTop: 0 },
  stepMetaSub: { marginTop: 4 },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  errorText: { flex: 1 },

  // Form card
  formCard: {},
  formCardContent: { padding: CardTokens.paddingLarge, gap: 2 },

  // Fields
  field: { marginBottom: 20 },
  fieldLabel: { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  input: { borderWidth: 1, fontSize: InputTokens.fontSize, fontFamily: FontFamily.regular },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  pillText: { textTransform: 'capitalize' },

  // Join mode cards
  joinGrid: { flexDirection: 'row', gap: 10 },
  joinGridStacked: { flexDirection: 'column' },
  joinCard: { flex: 1, borderWidth: 1, borderRadius: CardTokens.radius, padding: 14, gap: 6, position: 'relative', minHeight: 88, justifyContent: 'center' },
  joinCardStacked: { flex: 0, width: '100%' },
  joinCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  joinLabel: { fontSize: FontSize.body2, fontFamily: FontFamily.bold, lineHeight: LineHeight.body2 },
  joinSub: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, lineHeight: LineHeight.caption },

  // List items (leadership / partners)
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: FontFamily.semibold },
  itemSub: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  itemRemove: { padding: 4 },

  // Inline add form
  inlineForm: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8, gap: 0 },
  inlineFormTitle: { fontSize: 14, fontFamily: FontFamily.bold, marginBottom: 14 },
  inlineFormActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  inlineCancel: { flex: 1 },
  inlineSave: { flex: 1 },

  // Add row button
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginBottom: 8 },
  addRowText: { fontSize: 14, fontFamily: FontFamily.semibold },

  hint: { fontSize: 13, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: 4 },

  // Chip input
  chipWrap: { gap: 10 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 13, fontFamily: FontFamily.medium },
  chipInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chipInputField: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: FontFamily.regular },
  chipAddBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  navBack: { minWidth: 90 },
  navNext: { flex: 1, height: 54, borderRadius: 14 },
  navNextFull: { flex: 1 },
});
