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
import { Image } from 'expo-image';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { ImageGalleryPicker } from '@/design-system/ui/ImageGalleryPicker';

import * as ImagePicker from 'expo-image-picker';
import {
  CultureTokens,
  TextStyles,
} from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';
import { useAuth } from '@/lib/auth';
import { formatEventDateTimeBadge } from '@/lib/dateUtils';

const EVENT_CATEGORY_GROUPS = [
  {
    group: 'Arts & Culture',
    items: ['Dance', 'Art / Exhibition', 'Music / Concert', 'Comedy / Stand-up', 'Theatre / Performing Arts', 'Cinema / Film Screening'],
  },
  {
    group: 'Lifestyle',
    items: ['Food & Dining', 'Nightlife', 'Shopping / Market', 'Travel & Tours'],
  },
  {
    group: 'Wellness',
    items: ['Wellness / Yoga', 'Sports & Recreation', 'Meditation & Spirituality', 'Fitness & Health'],
  },
  {
    group: 'Learning',
    items: ['Workshop / Class', 'Conference / Talk', 'Language Class', 'Heritage & History'],
  },
  {
    group: 'Community',
    items: ['Festival / Celebration', 'Networking / Social', 'Cultural Ceremony', 'Family & Kids', 'Charity / Fundraiser'],
  },
  {
    group: 'Landmarks',
    items: ['Monument Visit', 'Heritage Walk', 'Cultural Site Tour'],
  },
];


const SPONSOR_TIERS = [
  { id: 'platinum', label: 'Platinum', color: '#E5E4E2' },
  { id: 'gold', label: 'Gold', color: CultureTokens.gold },
  { id: 'silver', label: 'Silver', color: '#C0C0C0' },
  { id: 'bronze', label: 'Bronze', color: '#CD7F32' },
  { id: 'supporter', label: 'Supporter', color: CultureTokens.teal },
];

type TicketTier = {
  id: string;
  name: string;
  price: string;
  capacity: string;
};

type Sponsor = {
  id: string;
  name: string;
  tier: string;
  website?: string;
};

type EventDraft = {
  title: string;
  tagline: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  locationType: 'In-person' | 'Virtual' | 'Hybrid';
  venueName: string;
  address: string;
  meetingLink: string;
  entryType: 'Free' | 'Ticketed' | 'Donation';
  basePrice: string;
  currency: string;
  totalCapacity: string;
  tiers: TicketTier[];
  externalTicketUrl: string;
  heroImageUrl: string;
  primaryCulture: string;
  culturalTags: string[];
  language: string;
  visibility: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  hostBio: string;
  hostWebsite: string;
  sponsors: Sponsor[];
  isFeatured: boolean;
  socialTitle: string;
  socialDescription: string;
};

const INITIAL_DRAFT: EventDraft = {
  title: '',
  tagline: '',
  description: '',
  category: 'Festival',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  timezone: 'Australia/Sydney',
  locationType: 'In-person',
  venueName: '',
  address: '',
  meetingLink: '',
  entryType: 'Free',
  basePrice: '',
  currency: 'AUD',
  totalCapacity: '',
  tiers: [],
  externalTicketUrl: '',
  heroImageUrl: '',
  primaryCulture: '',
  culturalTags: [],
  language: 'English',
  visibility: 'Public',
  hostName: '',
  hostEmail: '',
  hostPhone: '',
  hostBio: '',
  hostWebsite: '',
  sponsors: [],
  isFeatured: false,
  socialTitle: '',
  socialDescription: '',
};

export function HostspaceEventCreateForm({ onReview }: { onReview?: () => void }) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop } = useLayout();
  const { user } = useAuth();
  const { uploadImage, uploading: imageUploading } = useImageUpload();

  const [draft, setDraft] = useState<EventDraft>({
    ...INITIAL_DRAFT,
    hostName: user?.displayName || '',
    hostEmail: user?.email || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const showPreview = true;
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [newSponsor, setNewSponsor] = useState<Sponsor>({ id: '', name: '', tier: 'gold' });
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  const updateDraft = (patch: Partial<EventDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handlePickImage = () => {
    setShowImagePickerModal(true);
  };

  const addTier = () => {
    const newTier: TicketTier = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'General Admission',
      price: '',
      capacity: '',
    };
    updateDraft({ tiers: [...draft.tiers, newTier] });
  };

  const removeTier = (id: string) => {
    updateDraft({ tiers: draft.tiers.filter((t) => t.id !== id) });
  };

  const updateTier = (id: string, patch: Partial<TicketTier>) => {
    updateDraft({
      tiers: draft.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
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

  const validate = () => {
    if (!draft.title.trim()) return 'Event title is required.';
    if (!draft.startDate) return 'Start date is required.';
    if (draft.locationType !== 'Virtual' && !draft.venueName) return 'Venue name is required.';
    return null;
  };

  const saveEvent = async (status: 'draft' | 'published') => {
    const err = validate();
    if (err) {
      Alert.alert('Incomplete Info', err);
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', `Event ${status === 'draft' ? 'draft saved' : 'published'} successfully!`);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <GlassView intensity={10} style={styles.eyebrowBadge}>
          <Text style={[styles.eyebrow, { color: CultureTokens.indigo }]}>World-Class Events</Text>
        </GlassView>
        <Text style={[styles.title, { color: colors.text }]}>Create a Global Event</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Gather the essential intelligence for your next major cultural celebration.
        </Text>
      </View>

      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.formColumn}>

          {/* Section 1: Essentials */}
          <FormSection title="1. Essentials" icon="sparkles-outline" color={CultureTokens.indigo}>
            <FormField label="Event Title" required>
              <FormInput
                value={draft.title}
                onChangeText={(title) => updateDraft({ title })}
                placeholder="e.g. Sydney Lunar New Year Parade"
              />
            </FormField>
            <FormField label="One-line Tagline" hint="Appears on discovery cards">
              <FormInput
                value={draft.tagline}
                onChangeText={(tagline) => updateDraft({ tagline })}
                placeholder="A vibrant celebration of heritage and hope."
              />
            </FormField>
            <FormField label="Full Description">
              <FormInput
                value={draft.description}
                onChangeText={(description) => updateDraft({ description })}
                placeholder="Details, schedule, and what to expect..."
                multiline
              />
            </FormField>
            <FormField label="Event Category" required>
              <View style={styles.categoryGroups}>
                {EVENT_CATEGORY_GROUPS.map((group) => (
                  <View key={group.group} style={styles.categoryGroup}>
                    <Text style={[styles.categoryGroupLabel, { color: colors.textTertiary }]}>{group.group}</Text>
                    <View style={styles.chipRow}>
                      {group.items.map((c) => (
                        <ChoiceChip
                          key={c}
                          label={c}
                          selected={draft.category === c}
                          onPress={() => updateDraft({ category: c })}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </FormField>
          </FormSection>

          {/* Section 2: Date & Time */}
          <FormSection title="2. Schedule" icon="time-outline" color={CultureTokens.coral}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="Start Date" required>
                  <FormInput value={draft.startDate} onChangeText={(startDate) => updateDraft({ startDate })} placeholder="YYYY-MM-DD" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Start Time">
                  <FormInput value={draft.startTime} onChangeText={(startTime) => updateDraft({ startTime })} placeholder="18:30" />
                </FormField>
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="End Date">
                  <FormInput value={draft.endDate} onChangeText={(endDate) => updateDraft({ endDate })} placeholder="YYYY-MM-DD" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="End Time">
                  <FormInput value={draft.endTime} onChangeText={(endTime) => updateDraft({ endTime })} placeholder="21:00" />
                </FormField>
              </View>
            </View>
            <FormField label="Timezone">
              <FormInput value={draft.timezone} onChangeText={(timezone) => updateDraft({ timezone })} placeholder="Australia/Sydney" />
            </FormField>
          </FormSection>

          {/* Section 3: Venue & Location */}
          <FormSection title="3. Location" icon="location-outline" color={CultureTokens.teal}>
            <FormField label="Location Type">
              <View style={styles.chipRow}>
                {['In-person', 'Virtual', 'Hybrid'].map((type) => (
                  <ChoiceChip
                    key={type}
                    label={type}
                    selected={draft.locationType === type}
                    onPress={() => updateDraft({ locationType: type as any })}
                  />
                ))}
              </View>
            </FormField>
            {draft.locationType !== 'Virtual' && (
              <>
                <FormField label="Venue Name" required>
                  <FormInput value={draft.venueName} onChangeText={(venueName) => updateDraft({ venueName })} placeholder="Parramatta Park" />
                </FormField>
                <FormField label="Physical Address">
                  <FormInput value={draft.address} onChangeText={(address) => updateDraft({ address })} placeholder="O'Connell St, Parramatta NSW 2150" />
                </FormField>
              </>
            )}
            {draft.locationType !== 'In-person' && (
              <FormField label="Virtual Link" required={draft.locationType === 'Virtual'}>
                <FormInput value={draft.meetingLink} onChangeText={(meetingLink) => updateDraft({ meetingLink })} placeholder="https://zoom.us/..." />
              </FormField>
            )}
          </FormSection>

          {/* Section 4: Ticketing */}
          <FormSection title="4. Ticketing" icon="ticket-outline" color={CultureTokens.gold}>
            <FormField label="Entry Type">
              <View style={styles.chipRow}>
                {['Free', 'Ticketed', 'Donation'].map((type) => (
                  <ChoiceChip
                    key={type}
                    label={type}
                    selected={draft.entryType === type}
                    onPress={() => updateDraft({ entryType: type as any })}
                  />
                ))}
              </View>
            </FormField>

            {draft.entryType === 'Ticketed' && (
              <View style={styles.tiersContainer}>
                {draft.tiers.map((tier, idx) => (
                  <GlassView key={tier.id} intensity={5} style={styles.tierCard}>
                    <View style={styles.tierHeader}>
                      <Text style={[styles.tierTitle, { color: colors.text }]}>Tier {idx + 1}</Text>
                      <Pressable onPress={() => removeTier(tier.id)}>
                        <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
                      </Pressable>
                    </View>
                    <FormInput
                      value={tier.name}
                      onChangeText={(name) => updateTier(tier.id, { name })}
                      placeholder="Early Bird, VIP..."
                      style={[styles.tierInput, { marginBottom: 8 }]}
                    />
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          value={tier.price}
                          onChangeText={(price) => updateTier(tier.id, { price })}
                          placeholder="Price"
                          keyboardType="numeric"
                          style={styles.tierInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          value={tier.capacity}
                          onChangeText={(capacity) => updateTier(tier.id, { capacity })}
                          placeholder="Capacity"
                          keyboardType="numeric"
                          style={styles.tierInput}
                        />
                      </View>
                    </View>
                  </GlassView>
                ))}
                <Button variant="outline" size="sm" leftIcon="add-outline" onPress={addTier} style={{ marginTop: 8 }}>
                  Add Ticket Tier
                </Button>

                <FormField label="Third-party Ticket Link" hint="If using external ticketing">
                  <FormInput
                    value={draft.externalTicketUrl}
                    onChangeText={(externalTicketUrl) => updateDraft({ externalTicketUrl })}
                    placeholder="https://eventbrite.com/your-event"
                    autoCapitalize="none"
                  />
                </FormField>
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="Total Capacity">
                  <FormInput value={draft.totalCapacity} onChangeText={(totalCapacity) => updateDraft({ totalCapacity })} placeholder="Unlimited" keyboardType="numeric" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Currency">
                  <FormInput value={draft.currency} onChangeText={(currency) => updateDraft({ currency: currency.toUpperCase() })} placeholder="AUD" />
                </FormField>
              </View>
            </View>
          </FormSection>

          {/* Section 5: Team & Partners */}
          <FormSection title="5. Host & Partners" icon="people-outline" color={CultureTokens.teal}>
             <FormField label="Host Name" required>
               <FormInput value={draft.hostName} onChangeText={(hostName) => updateDraft({ hostName })} placeholder="Organizer or Team name" />
             </FormField>
             <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormField label="Contact Email">
                    <FormInput value={draft.hostEmail} onChangeText={(hostEmail) => updateDraft({ hostEmail })} placeholder="hello@example.com" keyboardType="email-address" autoCapitalize="none" />
                  </FormField>
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="Contact Phone">
                    <FormInput value={draft.hostPhone} onChangeText={(hostPhone) => updateDraft({ hostPhone })} placeholder="+61 4..." keyboardType="phone-pad" />
                  </FormField>
                </View>
             </View>
             <FormField label="Host Website">
               <FormInput value={draft.hostWebsite} onChangeText={(hostWebsite) => updateDraft({ hostWebsite })} placeholder="https://..." autoCapitalize="none" />
             </FormField>
             <FormField label="Host Bio">
               <FormInput value={draft.hostBio} onChangeText={(hostBio) => updateDraft({ hostBio })} placeholder="Tell us about the organizers..." multiline />
             </FormField>

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
                   <View style={styles.chipRow}>
                      {SPONSOR_TIERS.map((t) => (
                        <ChoiceChip
                          key={t.id}
                          label={t.label}
                          selected={newSponsor.tier === t.id}
                          onPress={() => setNewSponsor({ ...newSponsor, tier: t.id })}
                        />
                      ))}
                   </View>
                   <View style={[styles.row, { marginTop: 12 }]}>
                      <Button variant="outline" size="sm" style={{ flex: 1 }} onPress={() => setShowSponsorForm(false)}>Cancel</Button>
                      <Button variant="primary" size="sm" style={{ flex: 1 }} onPress={addSponsor}>Add</Button>
                   </View>
                </GlassView>
             ) : (
                <Button variant="outline" size="sm" leftIcon="add-circle-outline" onPress={() => setShowSponsorForm(true)}>
                  Add Sponsor / Supporter
                </Button>
             )}
          </FormSection>

          {/* Section 6: Social & Metadata */}
          <FormSection title="6. Social & Discover" icon="megaphone-outline" color={CultureTokens.coral}>
             <FormField label="Cultural Intelligence" required hint="Drives recommendation engine">
               <FormInput value={draft.primaryCulture} onChangeText={(primaryCulture) => updateDraft({ primaryCulture })} placeholder="e.g. Indian, Chinese, Greek" />
             </FormField>
             <FormField label="Event Language">
               <FormInput value={draft.language} onChangeText={(language) => updateDraft({ language })} placeholder="English" />
             </FormField>
             <FormField label="SEO / Social Title" hint="Custom title for sharing links">
               <FormInput value={draft.socialTitle} onChangeText={(socialTitle) => updateDraft({ socialTitle })} placeholder={draft.title || "Vibrant Cultural Festival"} />
             </FormField>
             <FormField label="SEO / Social Description">
               <FormInput value={draft.socialDescription} onChangeText={(socialDescription) => updateDraft({ socialDescription })} placeholder="Brief summary for Google and social previews..." multiline />
             </FormField>

             <View style={styles.switchContainer}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Featured Event</Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>Highlight in main Discovery rails</Text>
              </View>
              <Switch
                value={draft.isFeatured}
                onValueChange={(isFeatured) => updateDraft({ isFeatured })}
                trackColor={{ true: CultureTokens.indigo }}
              />
            </View>
          </FormSection>

          <View style={styles.actionRow}>
            <Button
              variant="primary"
              leftIcon="rocket-outline"
              loading={isSaving}
              onPress={() => saveEvent('published')}
              style={{ flex: 2 }}
            >
              Launch Event
            </Button>
            <Button
              variant="outline"
              leftIcon="analytics-outline"
              onPress={onReview}
              style={{ flex: 1 }}
            >
              Review
            </Button>
            <Button
              variant="outline"
              leftIcon="save-outline"
              onPress={() => saveEvent('draft')}
              style={{ flex: 1 }}
            >
              Draft
            </Button>
          </View>
        </View>

        {showPreview && (
          <View style={styles.previewColumn}>
            <Text style={[styles.previewHeading, { color: colors.text }]}>Real-time Preview</Text>
            <EventPreviewCard draft={draft} colors={colors} />

            <GlassView intensity={10} style={styles.brandingBox}>
               <Text style={[styles.brandingTitle, { color: colors.text }]}>Event Visuals</Text>
               <View style={styles.brandingAction}>
                 <View style={[styles.brandingIconPh, { backgroundColor: CultureTokens.indigo + '20' }]}>
                   {draft.heroImageUrl ? (
                      <CultureImage uri={draft.heroImageUrl} style={StyleSheet.absoluteFill} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                   ) : (
                     <Ionicons name="image-outline" size={24} color={CultureTokens.indigo} />
                   )}
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.brandingLabel, { color: colors.text }]}>Cover Image</Text>
                    <Text style={[styles.brandingSub, { color: colors.textSecondary }]}>{draft.heroImageUrl ? 'Image selected' : 'High-res landscape recommended'}</Text>
                 </View>
                 <Button
                   variant="ghost"
                   size="sm"
                   loading={imageUploading}
                   onPress={handlePickImage}
                 >
                   {draft.heroImageUrl ? 'Change' : 'Upload'}
                 </Button>
               </View>
            </GlassView>

            <View style={styles.floatingPreviewInfo}>
               <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
               <Text style={[styles.previewInfoText, { color: colors.textSecondary }]}>
                 {`This preview shows how your event will appear in the CulturePass "Night Festival" Discover feed.`}
               </Text>
            </View>

            <GlassView intensity={10} style={styles.brandingBox}>
               <Text style={[styles.brandingTitle, { color: colors.text, marginBottom: 12 }]}>Social Preview</Text>
               <View style={[styles.socialPreviewCard, { backgroundColor: isDark ? '#1a1a1a' : '#f0f2f5' }]}>
                  <View style={styles.socialPreviewHeader}>
                    <View style={styles.socialAvatarPh} />
                    <View>
                      <Text style={[styles.socialUser, { color: colors.text }]}>CulturePass</Text>
                      <Text style={[styles.socialMeta, { color: colors.textTertiary }]}>Just now · Sponsored</Text>
                    </View>
                  </View>
                  <Text style={[styles.socialDescText, { color: colors.text }]}>
                    {draft.socialDescription || draft.tagline || "Discover this incredible cultural event on CulturePass!"}
                  </Text>
                  <View style={styles.socialImagePh}>
                    {draft.heroImageUrl ? (
                      <CultureImage uri={draft.heroImageUrl} style={StyleSheet.absoluteFill} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                    ) : (
                      <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                    )}
                  </View>
                  <View style={styles.socialFooter}>
                    <Text style={[styles.socialUrl, { color: colors.textTertiary }]}>CULTUREPASS.APP</Text>
                    <Text style={[styles.socialTitleText, { color: colors.text }]} numberOfLines={1}>
                      {draft.socialTitle || draft.title || "Vibrant Cultural Celebration"}
                    </Text>
                  </View>
                </View>
             </GlassView>
           </View>
        )}
      </View>
      {showImagePickerModal && (
        <ImageGalleryPicker
          visible={showImagePickerModal}
          onClose={() => setShowImagePickerModal(false)}
          currentUri={draft.heroImageUrl}
          onSelect={(url) => updateDraft({ heroImageUrl: url })}
          collectionName="events"
          docId={user?.id || 'anon'}
        />
      )}
    </View>
  );
}

function FormSection({ title, icon, color, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <GlassView intensity={10} style={[styles.sectionIconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={18} color={color} />
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
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: CultureTokens.coral }}> *</Text>}
        </Text>
        {hint && <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>{hint}</Text>}
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
        props.style,
      ]}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress}>
      <GlassView
        intensity={selected ? 20 : 5}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? CultureTokens.indigo : 'transparent',
            borderColor: selected ? CultureTokens.indigo : colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: selected ? '#fff' : colors.textSecondary }]}>{label}</Text>
      </GlassView>
    </Pressable>
  );
}

function EventPreviewCard({ draft, colors }: { draft: EventDraft; colors: any }) {
  const dateStr = draft.startDate ? formatEventDateTimeBadge(draft.startDate, draft.startTime) : 'Sat, Jun 12 · 6:30 PM';
  const location = draft.locationType === 'Virtual' ? 'Online Event' : draft.venueName || 'Sydney, Australia';

  return (
    <View style={styles.previewCardOuter}>
      <GlassView intensity={15} style={[styles.previewCard, { borderColor: colors.borderLight }]}>
        <View style={styles.previewImageArea}>
           <CultureImage
             uri={draft.heroImageUrl}
             style={StyleSheet.absoluteFillObject}
             placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
           />
           <LinearGradient
             colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
             locations={[0, 0.4, 1]}
             style={StyleSheet.absoluteFillObject}
           />
           <View style={styles.previewBadge}>
             <Text style={styles.previewBadgeText}>{draft.category.toUpperCase()}</Text>
           </View>
           <View style={styles.previewPrice}>
              <Text style={styles.previewPriceText}>{draft.entryType === 'Ticketed' ? (draft.basePrice ? `${draft.currency} ${draft.basePrice}` : 'PAID') : draft.entryType.toUpperCase()}</Text>
           </View>
        </View>
        <View style={styles.previewBody}>
          <Text style={styles.previewDate}>{dateStr}</Text>
          <Text style={styles.previewTitle} numberOfLines={2}>{draft.title || 'Your Event Title'}</Text>
          <View style={styles.previewMeta}>
             <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
             <Text style={styles.previewMetaText} numberOfLines={1}>{location}</Text>
          </View>
          <View style={styles.previewFooter}>
             <View style={styles.previewHost}>
                <View style={styles.previewAvatar} />
                <Text style={styles.previewHostName}>{draft.hostName || 'Organizer'}</Text>
             </View>
             <Ionicons name="share-outline" size={16} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  pageHeader: {
    gap: 8,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
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
    gap: 24,
  },
  previewColumn: {
    width: Platform.OS === 'web' ? 360 : '100%',
    gap: 20,
  },
  section: {
    gap: 16,
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
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  textarea: {
    minHeight: 120,
    paddingVertical: 12,
  },
  categoryGroups: {
    gap: 16,
  },
  categoryGroup: {
    gap: 8,
  },
  categoryGroupLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  tiersContainer: {
    gap: 12,
    marginBottom: 8,
  },
  tierCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  tierInput: {
    minHeight: 44,
    borderRadius: 10,
    fontSize: 14,
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
    marginTop: 20,
    marginBottom: 40,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  previewCardOuter: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  previewImageArea: {
    height: 180,
    position: 'relative',
    backgroundColor: '#18181B',
  },
  previewBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  previewBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  previewPrice: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: CultureTokens.teal + 'E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  previewPriceText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  previewBody: {
    padding: 16,
    gap: 8,
  },
  previewDate: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.coral,
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 26,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMetaText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  previewHost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewHostName: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.8)',
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
  floatingPreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  previewInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
    backgroundColor: CultureTokens.indigo,
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
});
