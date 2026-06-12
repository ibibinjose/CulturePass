import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Image } from 'expo-image';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { MediaUploadField } from './fields/MediaUploadField';
import {
  HOSTSPACE_EVENT_PREVIEW,
  HOSTSPACE_FORM_SECONDARY_HINT,
  HOSTSPACE_LEGACY_WIZARD_BANNER,
  HOSTSPACE_MUJI_FORM,
  HOSTSPACE_SOCIAL_PREVIEW,
} from '@/design-system/tokens/hostspaceEventCreateTokens';
import {
  CultureTokens,
  TextStyles,
} from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { useAuth } from '@/lib/auth';
import { navigateToCreateById } from '@/lib/creationRouting';
import {
  FormSection,
  FormField,
  FormInput,
  ChoiceChip,
} from '@/components/forms';

// Unification (ADR-001): This dedicated form for rich 'community' entity is legacy.
// All rich profiles (community, etc.) should use the full FormWizard for consistency, analytics, drafts, legal gates.
// This form is kept for backward compat but shows deprecation + link to wizard.
const CATEGORIES = ['Culture', 'Business', 'Tech', 'Students', 'Arts', 'Social', 'Other'];
const MODES = ['In-person', 'Hybrid', 'Online'];
const JOIN_POLICIES = ['Open to all', 'Invite only', 'Approval required'];
const PURPOSES = ['Events', 'Networking', 'Learning', 'Social meetups', 'Cultural gatherings'];
const FREQUENCIES = ['Weekly', 'Monthly', 'Occasional', 'Seasonal'];
const VIBES = ['Chill', 'Professional', 'High-energy', 'Deep discussions'];

type Sponsor = {
  id: string;
  name: string;
  tier: string;
};

type CommunityDraft = {
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  city: string;
  country: string;
  mode: string;
  location: string;
  hostName: string;
  hostBio: string;
  hostEmail: string;
  hostPhone: string;
  organization: string;
  joinPolicy: string;
  targetAudience: string[];
  ageRange: string;
  primaryPurpose: string[];
  frequency: string;
  website: string;
  instagram: string;
  whatsapp: string;
  discord: string;
  linkedin: string;
  visibility: 'Public' | 'Private';
  membershipRules: string;
  codeOfConduct: string;
  culturalIdentityTags: string[];
  interests: string[];
  vibe: string;
  allowInviteLink: boolean;
  featured: boolean;
  logoUrl: string;
  bannerUrl: string;
  socialTitle: string;
  socialDescription: string;
  sponsors: Sponsor[];
};

export function HostspaceCommunityCreateForm({ onReview }: { onReview?: () => void }) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop } = useLayout();
  const { user } = useAuth();
  const { uploadImage, uploading: imageUploading } = useImageUpload();

  const [draft, setDraft] = useState<CommunityDraft>({
    name: '',
    tagline: '',
    description: '',
    category: 'Culture',
    tags: [],
    city: 'Sydney',
    country: 'Australia',
    mode: 'In-person',
    location: '',
    hostName: user?.displayName || '',
    hostBio: '',
    hostEmail: user?.email || '',
    hostPhone: '',
    organization: '',
    joinPolicy: 'Open to all',
    targetAudience: [],
    ageRange: '',
    primaryPurpose: [],
    frequency: 'Monthly',
    website: '',
    instagram: '',
    whatsapp: '',
    discord: '',
    linkedin: '',
    visibility: 'Public',
    membershipRules: '',
    codeOfConduct: '',
    culturalIdentityTags: [],
    interests: [],
    vibe: 'Chill',
    allowInviteLink: true,
    featured: false,
    logoUrl: '',
    bannerUrl: '',
    socialTitle: '',
    socialDescription: '',
    sponsors: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const showPreview = true;
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [newSponsor, setNewSponsor] = useState({ name: '', tier: 'gold' });

  const updateDraft = (patch: Partial<CommunityDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handlePickImage = async (field: 'logoUrl' | 'bannerUrl') => {
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
        const { downloadURL } = await uploadImage(result, 'communities', user?.id || 'anon', field, true);
        updateDraft({ [field]: downloadURL });
      } catch {
        Alert.alert('Upload failed', 'Could not upload image.');
      }
    }
  };

  const addSponsor = () => {
    if (!newSponsor.name.trim()) return;
    const sp = { ...newSponsor, id: Math.random().toString(36).substr(2, 9) };
    updateDraft({ sponsors: [...(draft.sponsors || []), sp] });
    setNewSponsor({ name: '', tier: 'gold' });
    setShowSponsorForm(false);
  };

  const removeSponsor = (id: string) => {
    updateDraft({ sponsors: (draft.sponsors || []).filter((s) => s.id !== id) });
  };

  const toggleArrayValue = (key: keyof CommunityDraft, value: string) => {
    const current = draft[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateDraft({ [key]: next });
  };

  const validate = () => {
    if (!draft.name.trim()) return 'Community name is required.';
    if (!draft.tagline.trim()) return 'A short tagline is required.';
    if (!draft.description.trim()) return 'A description is required.';
    if (!draft.city.trim()) return 'City is required.';
    if (!draft.hostEmail.trim()) return 'Host email is required.';
    return null;
  };

  const saveCommunity = async (status: 'draft' | 'published') => {
    const err = validate();
    if (err) {
      Alert.alert('Missing Information', err);
      return;
    }
    setIsSaving(true);
    // Simulation of API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', `Community ${status === 'draft' ? 'draft saved' : 'published'} successfully!`);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <GlassView intensity={10} style={styles.eyebrowBadge}>
          <Text style={[styles.eyebrow, { color: CultureTokens.teal }]} numberOfLines={1}>
            Community Creation
          </Text>
        </GlassView>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          Start a new Hub
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={3}>
          Build a space for your diaspora community to connect, share, and grow.
        </Text>
      </View>

      <View style={styles.legacyBanner}>
        <Ionicons name="information-circle" size={20} color={HOSTSPACE_LEGACY_WIZARD_BANNER.ink} />
        <Text style={styles.legacyBannerText} numberOfLines={4}>
          Note: Rich communities now use the full guided FormWizard (with analytics, auto-save, legal gates). This legacy form is for compat only.
        </Text>
        <Pressable
          onPress={() => navigateToCreateById('community', { source: 'hostspace_community_form_link' })}
          style={styles.legacyBannerCta}
        >
          <Text style={styles.legacyBannerCtaText} numberOfLines={1}>
            Use Wizard
          </Text>
        </Pressable>
      </View>

      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.formColumn}>

          {/* Section 1: Core Identity */}
          <FormSection title="1. Core Identity" icon="id-card-outline" color={CultureTokens.indigo}>
            <FormField label="Community Name" required>
              <FormInput
                value={draft.name}
                onChangeText={(name) => updateDraft({ name })}
                placeholder="e.g. Indian Founders in Sydney"
              />
            </FormField>
            <FormField label="Short Tagline" required hint="One-liner for discovery">
              <FormInput
                value={draft.tagline}
                onChangeText={(tagline) => updateDraft({ tagline })}
                placeholder="Connecting and empowering Indian founders"
              />
            </FormField>
            <FormField label="Description" required>
              <FormInput
                value={draft.description}
                onChangeText={(description) => updateDraft({ description })}
                placeholder="What is the purpose of this community? Who is it for?"
                multiline
              />
            </FormField>
            <FormField label="Category" required>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <ChoiceChip
                    key={c}
                    label={c}
                    selected={draft.category === c}
                    onPress={() => updateDraft({ category: c })}
                  />
                ))}
              </View>
            </FormField>
          </FormSection>

          {/* Section 2: Location & Reach */}
          <FormSection title="2. Location & Reach" icon="location-outline" color={CultureTokens.teal}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <FormField label="City" required>
                  <FormInput value={draft.city} onChangeText={(city) => updateDraft({ city })} placeholder="Sydney" />
                </FormField>
              </View>
              <View style={styles.flex1}>
                <FormField label="Country">
                  <FormInput value={draft.country} onChangeText={(country) => updateDraft({ country })} placeholder="Australia" />
                </FormField>
              </View>
            </View>
            <FormField label="Full Address / Venue" hint="Optional for physical/hybrid meetups">
              <FormInput value={draft.location} onChangeText={(location) => updateDraft({ location })} placeholder="e.g. 123 Cultural Way, Sydney NSW 2000" />
            </FormField>
            <FormField label="Mode">
              <View style={styles.chipRow}>
                {MODES.map((m) => (
                  <ChoiceChip
                    key={m}
                    label={m}
                    selected={draft.mode === m}
                    onPress={() => updateDraft({ mode: m })}
                  />
                ))}
              </View>
            </FormField>
          </FormSection>

          {/* Section 3: Community Ownership */}
          <FormSection title="3. Ownership & Host" icon="person-circle-outline" color={CultureTokens.indigo}>
             <FormField label="Host / Organizer Name" required>
               <FormInput value={draft.hostName} onChangeText={(hostName) => updateDraft({ hostName })} placeholder="Your name or organization" />
             </FormField>
             <View style={styles.row}>
                <View style={styles.flex1}>
                  <FormField label="Contact Email" required>
                    <FormInput value={draft.hostEmail} onChangeText={(hostEmail) => updateDraft({ hostEmail })} placeholder="hello@example.com" keyboardType="email-address" autoCapitalize="none" />
                  </FormField>
                </View>
                <View style={styles.flex1}>
                  <FormField label="Contact Phone">
                    <FormInput value={draft.hostPhone} onChangeText={(hostPhone) => updateDraft({ hostPhone })} placeholder="+61 4..." keyboardType="phone-pad" />
                  </FormField>
                </View>
             </View>
             <FormField label="Host Bio">
               <FormInput value={draft.hostBio} onChangeText={(hostBio) => updateDraft({ hostBio })} placeholder="Briefly describe the organizers..." multiline />
               <Text style={styles.hostBioHint} numberOfLines={3}>
                 You (as Lead Organizer) + additional co-organizers with different roles can be managed after creation.
               </Text>
             </FormField>
             <FormField label="Organization (if any)">
               <FormInput value={draft.organization} onChangeText={(organization) => updateDraft({ organization })} placeholder="e.g. Jivan Club" />
             </FormField>

             <View style={styles.divider} />

             <View style={styles.teamSectionHeader}>
                <Ionicons name="ribbon-outline" size={20} color={CultureTokens.gold} />
                <Text style={[styles.sectionTitle, { color: colors.text }]} numberOfLines={1}>
                  Sponsors & Supporters
                </Text>
             </View>

             {(draft.sponsors || []).map((sp) => (
                <View key={sp.id} style={[styles.sponsorChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <View style={styles.sponsorChipInfo}>
                    <Text style={[styles.sponsorName, { color: colors.text }]} numberOfLines={1}>
                      {sp.name}
                    </Text>
                    <Text style={[styles.sponsorTier, { color: CultureTokens.gold }]} numberOfLines={1}>
                      {sp.tier.toUpperCase()}
                    </Text>
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
                     style={styles.sponsorNameInput}
                   />
                   <View style={styles.chipRow}>
                      {['Platinum', 'Gold', 'Silver', 'Supporter'].map((t) => (
                        <ChoiceChip
                          key={t}
                          label={t}
                          selected={newSponsor.tier === t.toLowerCase()}
                          onPress={() => setNewSponsor({ ...newSponsor, tier: t.toLowerCase() })}
                        />
                      ))}
                   </View>
                   <View style={styles.sponsorActionRow}>
                      <Button variant="outline" size="sm" style={styles.flex1} onPress={() => setShowSponsorForm(false)}>Cancel</Button>
                      <Button variant="primary" size="sm" style={styles.flex1} onPress={addSponsor}>Add</Button>
                   </View>
                </GlassView>
             ) : (
                <Button variant="outline" size="sm" leftIcon="add-circle-outline" onPress={() => setShowSponsorForm(true)}>
                  Add Sponsor / Supporter
                </Button>
             )}
          </FormSection>

          {/* Section 4: CultureOS Layer */}
          <FormSection title="3. CultureOS Layer" icon="sparkles-outline" color={CultureTokens.gold}>
            <FormField label="Cultural Identity Tags" hint="Strategic for recommendations">
              <FormInput
                placeholder="Add tags like: Indian, Tamil, Global..."
                onSubmitEditing={(e) => {
                  const val = e.nativeEvent.text.trim();
                  if (val) {
                    toggleArrayValue('culturalIdentityTags', val);
                  }
                }}
              />
              <View style={[styles.chipRow, styles.tagChipRow]}>
                {draft.culturalIdentityTags.map((t) => (
                  <ChoiceChip key={t} label={t} selected onPress={() => toggleArrayValue('culturalIdentityTags', t)} />
                ))}
              </View>
            </FormField>
            <FormField label="Community Vibe">
              <View style={styles.chipRow}>
                {VIBES.map((v) => (
                  <ChoiceChip
                    key={v}
                    label={v}
                    selected={draft.vibe === v}
                    onPress={() => updateDraft({ vibe: v })}
                  />
                ))}
              </View>
            </FormField>
          </FormSection>

          {/* Section 4: Activity & Engagement */}
          <FormSection title="4. Activity & Engagement" icon="calendar-outline" color={CultureTokens.coral}>
            <FormField label="Primary Purpose">
              <View style={styles.chipRow}>
                {PURPOSES.map((p) => (
                  <ChoiceChip
                    key={p}
                    label={p}
                    selected={draft.primaryPurpose.includes(p)}
                    onPress={() => toggleArrayValue('primaryPurpose', p)}
                  />
                ))}
              </View>
            </FormField>
            <FormField label="Engagement Frequency">
              <View style={styles.chipRow}>
                {FREQUENCIES.map((f) => (
                  <ChoiceChip
                    key={f}
                    label={f}
                    selected={draft.frequency === f}
                    onPress={() => updateDraft({ frequency: f })}
                  />
                ))}
              </View>
            </FormField>
          </FormSection>

          {/* Section 6: Privacy & Metadata */}
          <FormSection title="6. Privacy & Discovery" icon="shield-checkmark-outline" color={CultureTokens.indigo}>
             <FormField label="Who can join?">
              <View style={styles.chipRow}>
                {JOIN_POLICIES.map((p) => (
                  <ChoiceChip
                    key={p}
                    label={p}
                    selected={draft.joinPolicy === p}
                    onPress={() => updateDraft({ joinPolicy: p })}
                  />
                ))}
              </View>
            </FormField>

            <FormField label="SEO / Social Title" hint="Custom title for sharing links">
              <FormInput value={draft.socialTitle} onChangeText={(socialTitle) => updateDraft({ socialTitle })} placeholder={draft.name || "Cultural Community Hub"} />
            </FormField>
            <FormField label="SEO / Social Description">
              <FormInput value={draft.socialDescription} onChangeText={(socialDescription) => updateDraft({ socialDescription })} placeholder="Summary for Google and social previews..." multiline />
            </FormField>

            <View style={styles.switchContainer}>
              <View style={styles.flex1}>
                <Text style={[styles.switchLabel, { color: colors.text }]} numberOfLines={1}>
                  Featured on CulturePass
                </Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  Show in trending and spotlight rails
                </Text>
              </View>
              <Switch
                value={draft.featured}
                onValueChange={(featured) => updateDraft({ featured })}
                trackColor={{ true: CultureTokens.teal }}
              />
            </View>
          </FormSection>

          <View style={styles.actionRow}>
            <Button
              variant="primary"
              leftIcon="rocket-outline"
              loading={isSaving}
              onPress={() => saveCommunity('published')}
              style={styles.publishBtn}
            >
              Publish Community
            </Button>
            <Button
              variant="outline"
              leftIcon="analytics-outline"
              onPress={onReview}
              style={styles.reviewBtn}
            >
              Review
            </Button>
            <Button
              variant="outline"
              leftIcon="save-outline"
              onPress={() => saveCommunity('draft')}
              style={styles.flex1}
            >
              Draft
            </Button>
          </View>
        </View>

        {showPreview && (
          <View style={styles.previewColumn}>
            <Text style={[styles.previewHeading, { color: colors.text }]} numberOfLines={1}>
              Live Preview
            </Text>
            <CommunityPreviewCard draft={draft} colors={colors} />

            <GlassView intensity={10} style={styles.brandingBox}>
               <Text style={[styles.brandingTitle, styles.brandingTitleSpaced, { color: colors.text }]} numberOfLines={1}>
                 Community Visuals
               </Text>
               <View style={styles.visualsStack}>
                 <View>
                   <Text style={[styles.brandingLabel, styles.brandingLabelSpaced, { color: colors.text }]} numberOfLines={1}>
                     Logo / Avatar (1:1)
                   </Text>
                   <MediaUploadField
                     type="logo"
                     value={draft.logoUrl}
                     onChange={(url) => updateDraft({ logoUrl: url as string })}
                     storagePath={`communities/${user?.id || 'anonymous'}`}
                     aspectRatio={1}
                   />
                 </View>
                 <View>
                   <Text style={[styles.brandingLabel, styles.brandingLabelSpaced, { color: colors.text }]} numberOfLines={1}>
                     Cover Banner (16:9)
                   </Text>
                   <MediaUploadField
                     type="hero"
                     value={draft.bannerUrl}
                     onChange={(url) => updateDraft({ bannerUrl: url as string })}
                     storagePath={`communities/${user?.id || 'anonymous'}`}
                     aspectRatio={16 / 9}
                   />
                 </View>
               </View>
            </GlassView>

            <GlassView intensity={5} style={styles.linksBox}>
              <Text style={[styles.brandingTitle, styles.brandingTitleSpaced, { color: colors.text }]} numberOfLines={1}>
                External Links
              </Text>
              <LinkInput icon="globe-outline" placeholder="Website" value={draft.website} onChangeText={(website) => updateDraft({ website })} />
              <LinkInput icon="logo-instagram" placeholder="Instagram" value={draft.instagram} onChangeText={(instagram) => updateDraft({ instagram })} />
              <LinkInput icon="logo-whatsapp" placeholder="WhatsApp" value={draft.whatsapp} onChangeText={(whatsapp) => updateDraft({ whatsapp })} />
            </GlassView>

            <GlassView intensity={10} style={styles.brandingBox}>
               <Text style={[styles.brandingTitle, styles.brandingTitleSpaced, { color: colors.text }]} numberOfLines={1}>
                 Social Preview
               </Text>
               <View
                 style={[
                   styles.socialPreviewCard,
                   { backgroundColor: isDark ? HOSTSPACE_SOCIAL_PREVIEW.surfaceDark : HOSTSPACE_SOCIAL_PREVIEW.surfaceLight },
                 ]}
               >
                  <View style={styles.socialPreviewHeader}>
                    <View style={styles.socialAvatarPh} />
                    <View>
                      <Text style={[styles.socialUser, { color: colors.text }]} numberOfLines={1}>
                        CulturePass
                      </Text>
                      <Text style={[styles.socialMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                        Just now · Discover
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.socialDescText, { color: colors.text }]} numberOfLines={4}>
                    {draft.socialDescription || draft.tagline || "Discover this new community on CulturePass!"}
                  </Text>
                  <View style={styles.socialImagePh}>
                    {draft.logoUrl ? (
                      <Image source={{ uri: draft.logoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                    ) : (
                      <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
                    )}
                  </View>
                  <View style={styles.socialFooter}>
                    <Text style={[styles.socialUrl, { color: colors.textTertiary }]} numberOfLines={1}>
                      CULTUREPASS.APP
                    </Text>
                    <Text style={[styles.socialTitleText, { color: colors.text }]} numberOfLines={1}>
                      {draft.socialTitle || draft.name || "Cultural Hub"}
                    </Text>
                  </View>
               </View>
            </GlassView>
          </View>
        )}
      </View>
    </View>
  );
}

function LinkInput({ icon, ...props }: { icon: keyof typeof Ionicons.glyphMap } & TextInput['props']) {
  const colors = useColors();
  return (
    <View style={[styles.linkInputRow, { borderColor: colors.borderLight }]}>
      <Ionicons name={icon} size={18} color={colors.textTertiary} />
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[styles.linkInput, { color: colors.text }]}
        {...props}
      />
    </View>
  );
}

function CommunityPreviewCard({ draft, colors }: { draft: CommunityDraft; colors: ReturnType<typeof useColors> }) {
  const accent = CultureTokens.teal;
  return (
    <GlassView intensity={15} style={[styles.previewCard, { borderColor: colors.borderLight, backgroundColor: colors.surface + '40' }]}>
      <View style={[styles.previewCover, { backgroundColor: accent + '20' }]}>
        <LinearGradient
          colors={[accent + '40', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="people" size={48} color={accent} />
        <View style={[styles.previewTypeBadge, { backgroundColor: accent }]}>
          <Text style={styles.previewTypeBadgeText} numberOfLines={1}>
            {draft.category.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.previewBody}>
        <View style={styles.previewTitleRow}>
          <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>{draft.name || 'Your Community Hub'}</Text>
          <Ionicons name="checkmark-circle" size={16} color={CultureTokens.indigo} />
        </View>
        <Text style={[styles.previewTagline, { color: colors.textSecondary }]} numberOfLines={2}>
          {draft.tagline || 'Define your community mission in one sharp line.'}
        </Text>
        <View style={styles.previewMetaRow}>
          <View style={styles.previewMetaItem}>
            <Ionicons name="location" size={12} color={colors.textTertiary} />
            <Text style={[styles.previewMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {draft.city}
            </Text>
          </View>
          <View style={styles.previewDot} />
          <View style={styles.previewMetaItem}>
            <Ionicons name="flash" size={12} color={CultureTokens.gold} />
            <Text style={[styles.previewMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {draft.vibe}
            </Text>
          </View>
        </View>
        <View style={styles.previewStats}>
          <View style={styles.previewStat}>
            <Text style={[styles.previewStatVal, { color: colors.text }]} numberOfLines={1}>
              0
            </Text>
            <Text style={[styles.previewStatLab, { color: colors.textTertiary }]} numberOfLines={1}>
              MEMBERS
            </Text>
          </View>
          <View style={styles.previewStat}>
            <Text style={[styles.previewStatVal, { color: colors.text }]} numberOfLines={1}>
              0
            </Text>
            <Text style={[styles.previewStatLab, { color: colors.textTertiary }]} numberOfLines={1}>
              EVENTS
            </Text>
          </View>
          <View style={styles.previewStat}>
            <Text style={[styles.previewStatVal, { color: colors.text }]} numberOfLines={1}>
              New
            </Text>
            <Text style={[styles.previewStatLab, { color: colors.textTertiary }]} numberOfLines={1}>
              RANK
            </Text>
          </View>
        </View>
        <Button variant="primary" size="md" style={{ marginTop: 20, borderRadius: 14 }}>Join Community</Button>
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  publishBtn: { flex: 2 },
  reviewBtn: { flex: 1.2 },
  sponsorNameInput: { marginBottom: 12 },
  sponsorActionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  tagChipRow: { marginTop: 8 },
  brandingTitleSpaced: { marginBottom: 12 },
  brandingLabelSpaced: { marginBottom: 8 },
  visualsStack: { gap: 16 },
  legacyBanner: {
    backgroundColor: HOSTSPACE_LEGACY_WIZARD_BANNER.bg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legacyBannerText: {
    color: HOSTSPACE_LEGACY_WIZARD_BANNER.ink,
    flex: 1,
    fontSize: 13,
  },
  legacyBannerCta: {
    backgroundColor: HOSTSPACE_LEGACY_WIZARD_BANNER.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  legacyBannerCtaText: {
    color: HOSTSPACE_LEGACY_WIZARD_BANNER.ctaInk,
    fontSize: 12,
  },
  hostBioHint: {
    fontSize: 12,
    color: HOSTSPACE_FORM_SECONDARY_HINT,
    marginTop: 4,
  },
  mujiSection: {
    borderColor: HOSTSPACE_MUJI_FORM.border,
    backgroundColor: HOSTSPACE_MUJI_FORM.card,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  mujiSectionIcon: {
    backgroundColor: HOSTSPACE_MUJI_FORM.accentLight,
    borderRadius: 8,
  },
  mujiSectionTitle: {
    color: HOSTSPACE_MUJI_FORM.text,
    fontFamily: 'Poppins_700Bold',
  },
  mujiFieldLabel: {
    color: HOSTSPACE_MUJI_FORM.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  requiredMark: { color: HOSTSPACE_MUJI_FORM.requiredAccent },
  mujiFieldHint: { color: HOSTSPACE_MUJI_FORM.textMuted },
  mujiInput: {
    backgroundColor: HOSTSPACE_MUJI_FORM.white,
    borderColor: HOSTSPACE_MUJI_FORM.border,
    color: HOSTSPACE_MUJI_FORM.text,
  },
  chipSelected: {
    backgroundColor: HOSTSPACE_MUJI_FORM.accent,
    borderColor: HOSTSPACE_MUJI_FORM.accent,
    borderRadius: 8,
  },
  chipIdle: {
    backgroundColor: HOSTSPACE_MUJI_FORM.white,
    borderColor: HOSTSPACE_MUJI_FORM.border,
    borderRadius: 8,
  },
  chipTextSelected: {
    color: HOSTSPACE_MUJI_FORM.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  chipTextIdle: {
    color: HOSTSPACE_MUJI_FORM.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  container: {
    gap: 24,
  },
  pageHeader: {
    gap: 8,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    ...TextStyles.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  subtitle: {
    ...TextStyles.callout,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 600,
    opacity: 0.8,
  },
  content: {
    gap: 24,
  },
  contentDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formColumn: {
    flex: 1,
    gap: 12,
  },
  previewColumn: {
    width: Platform.OS === 'web' ? 360 : '100%',
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionBody: {
    gap: 16,
    paddingLeft: 4,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  fieldHint: {
    fontSize: 12,
    opacity: 0.7,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  textarea: {
    minHeight: 88,
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  switchLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  switchSub: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  previewHeading: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewCover: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewTypeBadgeText: {
    color: HOSTSPACE_EVENT_PREVIEW.inkOnDark,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  previewBody: {
    padding: 20,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  previewName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  previewTagline: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    marginBottom: 14,
    opacity: 0.9,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  previewMetaText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  previewStat: {
    gap: 2,
  },
  previewStatVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  previewStatLab: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  brandingBox: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  brandingTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
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
  },
  brandingLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  brandingSub: {
    fontSize: 11,
    opacity: 0.7,
  },
  linksBox: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginBottom: 4,
  },
  linkInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  socialPreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  socialPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  socialAvatarPh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CultureTokens.teal,
  },
  socialUser: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  socialMeta: {
    fontSize: 11,
  },
  socialDescText: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  socialImagePh: {
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialFooter: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  socialUrl: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.5,
  },
  socialTitleText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  teamSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sponsorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sponsorChipInfo: {
    flex: 1,
    gap: 2,
  },
  sponsorName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  sponsorTier: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  addSponsorBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
});
