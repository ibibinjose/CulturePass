/**
 * Step5Description Component
 * 
 * Fifth wizard step for rich text description and SEO content.
 * 
 * Features:
 * - Short tagline (120 chars max) with AI tone suggestions
 * - Long description with rich text editor and AI assistance
 * - Category tags selection (3-10 tags)
 * - Readability score and AI rewrite suggestions
 * - Auto-generated SEO meta description
 * 
 * Requirements: 11
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { useLayout } from '@/hooks/useLayout';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { Input } from '@/design-system/ui/Input';
import { Spacing, Radius, FontFamily } from '@/design-system/tokens/theme';
import { SITE_ORIGIN } from '@/lib/app-meta';
import { RichTextEditor } from '../fields/RichTextEditor';
import type { WizardStepProps } from '../FormWizard/WizardStep';

const LazyArtistFields = React.lazy(() => import('../../components/entity-specific/ArtistFields')) as React.ComponentType<any>;
const LazyBusinessFields = React.lazy(() => import('../../components/entity-specific/BusinessFields')) as React.ComponentType<any>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAGLINE_MAX_LENGTH = 120;
const DESCRIPTION_MIN_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 5000;
const MIN_TAGS = 3;
const MAX_TAGS = 10;

const INDIGENOUS_TAGS = [
  'Aboriginal Owned',
  'Torres Strait Islander Owned',
  'Traditional Lands',
  'First Nations Led',
  'Indigenous Design',
  'Indigenous Language',
  'Native Ingredients',
];

/**
 * Predefined category tags organized by entity type
 */
const CATEGORY_TAGS: Record<string, string[]> = {
  community: [
    'Cultural Heritage',
    'Language Learning',
    'Social Events',
    'Youth Programs',
    'Seniors Group',
    'Religious',
    'Arts & Culture',
    'Sports & Recreation',
    'Professional Network',
    'Support Group',
    'Education',
    'Advocacy',
    'Charity',
    'Environmental',
    'Technology',
    'Food & Dining',
    'Music & Dance',
    'Literature',
    'Film & Media',
    'Wellness',
  ],
  organiser: [
    'Festivals',
    'Concerts',
    'Conferences',
    'Workshops',
    'Exhibitions',
    'Sports Events',
    'Cultural Celebrations',
    'Fundraisers',
    'Networking Events',
    'Educational Programs',
    'Community Gatherings',
    'Corporate Events',
    'Weddings',
    'Private Functions',
    'Markets',
    'Tours',
    'Performances',
    'Competitions',
    'Ceremonies',
    'Launches',
  ],
  venue: [
    'Event Space',
    'Performance Hall',
    'Gallery',
    'Community Center',
    'Conference Center',
    'Outdoor Space',
    'Restaurant',
    'Bar & Lounge',
    'Cafe',
    'Theater',
    'Studio',
    'Sports Facility',
    'Cultural Center',
    'Museum',
    'Library',
    'Park',
    'Rooftop',
    'Warehouse',
    'Historic Building',
    'Modern Venue',
  ],
  business: [
    'Retail',
    'Food & Beverage',
    'Services',
    'Entertainment',
    'Health & Wellness',
    'Beauty & Personal Care',
    'Fashion & Apparel',
    'Home & Garden',
    'Technology',
    'Education',
    'Professional Services',
    'Financial Services',
    'Real Estate',
    'Travel & Tourism',
    'Arts & Crafts',
    'Sports & Fitness',
    'Automotive',
    'Pet Services',
    'Media & Publishing',
    'Consulting',
  ],
  artist: [
    'Music',
    'Dance',
    'Visual Arts',
    'Theater',
    'Film & Video',
    'Photography',
    'Literature',
    'Sculpture',
    'Painting',
    'Digital Art',
    'Performance Art',
    'Street Art',
    'Crafts',
    'Design',
    'Fashion',
    'Culinary Arts',
    'Traditional Arts',
    'Contemporary',
    'Experimental',
    'Cultural Fusion',
  ],
  professional: [
    'Consulting',
    'Coaching',
    'Training',
    'Speaking',
    'Writing',
    'Design',
    'Photography',
    'Videography',
    'Marketing',
    'Social Media',
    'Event Planning',
    'Translation',
    'Legal',
    'Accounting',
    'Technology',
    'Healthcare',
    'Education',
    'Arts',
    'Entertainment',
    'Influencer',
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step5Description({
  entityType,
  formData,
  updateFormData,
  getFieldError,
}: WizardStepProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  // ---------------------------------------------------------------------------
  // State & Computed Values
  // ---------------------------------------------------------------------------

  const tagline = formData.tagline || '';
  const description = formData.description || '';
  const selectedTags = useMemo(() => formData.categoryTags || [], [formData.categoryTags]);
  const indigenousTags = useMemo(() => formData.indigenousTags || [], [formData.indigenousTags]);

  // Get available tags for this entity type
  const availableTags = useMemo(() => {
    return CATEGORY_TAGS[entityType] || CATEGORY_TAGS.community;
  }, [entityType]);

  // Calculate tag popularity (mock implementation - in production, fetch from backend)
  const tagPopularity = useMemo(() => {
    const popularity: Record<string, number> = {};
    availableTags.forEach((tag, index) => {
      // Mock popularity score (higher for earlier tags)
      popularity[tag] = Math.max(1, 5 - Math.floor(index / 4));
    });
    return popularity;
  }, [availableTags]);

  // Validation
  const taglineError = getFieldError('tagline');
  const descriptionError = getFieldError('description');
  const tagsError = getFieldError('tags');

  const isTaglineValid = tagline.length > 0 && tagline.length <= TAGLINE_MAX_LENGTH;
  const isDescriptionValid = 
    description.length >= DESCRIPTION_MIN_LENGTH && 
    description.length <= DESCRIPTION_MAX_LENGTH;
  const areTagsValid = 
    selectedTags.length >= MIN_TAGS && 
    selectedTags.length <= MAX_TAGS;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleTaglineChange = useCallback((value: string) => {
    updateFormData({ tagline: value });
  }, [updateFormData]);

  const handleDescriptionChange = useCallback((value: string) => {
    updateFormData({ description: value });
  }, [updateFormData]);

  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t: string) => t !== tag)
      : selectedTags.length < MAX_TAGS
        ? [...selectedTags, tag]
        : selectedTags;

    updateFormData({ categoryTags: newTags });
  }, [selectedTags, updateFormData]);

  const handleIndigenousTagToggle = useCallback((tag: string) => {
    const newTags = indigenousTags.includes(tag)
      ? indigenousTags.filter((t: string) => t !== tag)
      : [...indigenousTags, tag];

    updateFormData({ indigenousTags: newTags });
  }, [indigenousTags, updateFormData]);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const renderTagPopularityIndicator = (tag: string) => {
    const popularity = tagPopularity[tag] || 1;
    const stars = '★'.repeat(popularity) + '☆'.repeat(5 - popularity);
    
    return (
      <Text style={[styles.tagPopularity, { color: colors.textTertiary }]}>
        {stars}
      </Text>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Rich Description
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create compelling content that attracts and engages your audience
        </Text>
      </View>

      {/* Tagline Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons 
              name="pricetag" 
              size={20} 
              color={Luxe.colors.dark.accent} 
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tagline
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            A short, memorable phrase that captures your essence
          </Text>
        </View>

        <Input
          value={tagline}
          onChangeText={handleTaglineChange}
          placeholder="e.g., 'Celebrating Kerala culture in Melbourne'"
          maxLength={TAGLINE_MAX_LENGTH}
          error={taglineError}
          label="Short Tagline"
          hint={`${tagline.length}/${TAGLINE_MAX_LENGTH} characters`}
          autoCapitalize="sentences"
          returnKeyType="next"
        />

        {isTaglineValid && (
          <View style={[styles.successBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="checkmark-circle" size={16} color={Luxe.colors.dark.emerald} />
            <Text style={[styles.successText, { color: Luxe.colors.dark.emerald }]}>
              Great tagline!
            </Text>
          </View>
        )}
      </View>

      {/* Long Description Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons 
              name="document-text" 
              size={20} 
              color={Luxe.colors.dark.accent} 
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Long Description
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Tell your story in detail. What makes you unique? What can people expect?
          </Text>
        </View>

        <RichTextEditor
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Share your story, mission, and what makes you special..."
          maxLength={DESCRIPTION_MAX_LENGTH}
          showAIAssist={true}
          showReadabilityScore={true}
          fieldType="description"
          label="Full Description"
          hint={`${description.length}/${DESCRIPTION_MAX_LENGTH} characters (minimum ${DESCRIPTION_MIN_LENGTH})`}
          error={descriptionError}
          minHeight={300}
        />

        {isDescriptionValid && (
          <View style={[styles.successBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="checkmark-circle" size={16} color={Luxe.colors.dark.emerald} />
            <Text style={[styles.successText, { color: Luxe.colors.dark.emerald }]}>
              Excellent description!
            </Text>
          </View>
        )}
      </View>

      {/* Category Tags Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons 
              name="pricetags" 
              size={20} 
              color={Luxe.colors.dark.accent} 
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category Tags
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Select {MIN_TAGS}-{MAX_TAGS} tags that best describe your profile. 
            Stars indicate tag popularity for better discoverability.
          </Text>
        </View>

        {/* Selected Tags Count */}
        <View style={styles.tagsCounter}>
          <Text style={[styles.tagsCounterText, { color: colors.textSecondary }]}>
            {selectedTags.length} of {MAX_TAGS} tags selected
          </Text>
          {selectedTags.length < MIN_TAGS && (
            <Text style={[styles.tagsCounterHint, { color: Luxe.colors.dark.primary }]}>
              (minimum {MIN_TAGS} required)
            </Text>
          )}
        </View>

        {/* Tags Grid */}
        <View style={styles.tagsGrid}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS;

            return (
              <Pressable
                key={tag}
                onPress={() => !isDisabled && handleTagToggle(tag)}
                disabled={isDisabled}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isSelected 
                      ? Luxe.colors.dark.accent 
                      : colors.surface,
                    borderColor: isSelected 
                      ? Luxe.colors.dark.accent 
                      : colors.borderLight,
                    opacity: isDisabled ? 0.5 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${tag} tag, ${isSelected ? 'selected' : 'not selected'}`}
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {tag}
                </Text>
                {renderTagPopularityIndicator(tag)}
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            );
          })}
        </View>

        {!!tagsError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {tagsError}
          </Text>
        )}

        {areTagsValid && (
          <View style={[styles.successBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="checkmark-circle" size={16} color={Luxe.colors.dark.emerald} />
            <Text style={[styles.successText, { color: Luxe.colors.dark.emerald }]}>
              Perfect tag selection!
            </Text>
          </View>
        )}
      </View>

      {/* Indigenous Recognition Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="heart"
              size={20}
              color={Luxe.colors.dark.primary}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              First Nations Recognition
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Select relevant tags to highlight First Nations ownership or cultural relevance.
          </Text>
        </View>

        <View style={styles.tagsGrid}>
          {INDIGENOUS_TAGS.map((tag) => {
            const isSelected = indigenousTags.includes(tag);

            return (
              <Pressable
                key={tag}
                onPress={() => handleIndigenousTagToggle(tag)}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isSelected
                      ? Luxe.colors.dark.primary
                      : colors.surface,
                    borderColor: isSelected
                      ? Luxe.colors.dark.primary
                      : colors.borderLight,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${tag} tag, ${isSelected ? 'selected' : 'not selected'}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {tag}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* SEO Preview Section */}
      <View style={styles.section}><View style={styles.sectionHeader}><View style={styles.sectionTitleRow}><Ionicons
              name="search" 
              size={20} 
              color={Luxe.colors.dark.accent} 
            /><Text style={[styles.sectionTitle, { color: colors.text }]}>SEO Preview</Text></View><Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>How your profile will appear in search results</Text></View><LuxeCard variant="default" style={styles.seoPreview}><Text style={[styles.seoTitle, { color: Luxe.colors.dark.accent }]}>{formData.officialName || 'Your Profile Name'}</Text><Text style={[styles.seoUrl, { color: Luxe.colors.dark.emerald }]}>{SITE_ORIGIN.replace(/^https?:\/\//, '')}/@{formData.handle || 'yourhandle'}</Text><Text style={[styles.seoDescription, { color: colors.textSecondary }]}>{tagline || 'Your tagline will appear here'}{description && description.length > 0 && (
              <Text>{' — '}{description.substring(0, 100)}{description.length > 100 ? '...' : ''}</Text>
            )}</Text></LuxeCard></View>

      {/* Entity-Specific Details (unification: lazy-loaded rich profile fields now in wizard for artist/business etc. to consolidate on FormWizard) */}
      {(entityType === 'artist' || entityType === 'business') && (
        <React.Suspense fallback={<View style={{ padding: 20 }}><Text style={{ color: colors.textSecondary }}>Loading entity details...</Text></View>}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Entity-Specific Details</Text>
            </View>
            {entityType === 'artist' && (
              <LazyArtistFields formData={formData} updateFormData={updateFormData} getFieldError={getFieldError} />
            )}
            {entityType === 'business' && (
              <LazyBusinessFields formData={formData} updateFormData={updateFormData} getFieldError={getFieldError} />
            )}
          </View>
        </React.Suspense>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: 16,
  },
  contentDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginLeft: 28, // Align with title text (icon width + gap)
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  successText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  tagsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagsCounterText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  tagsCounterHint: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
      },
    }),
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  tagPopularity: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },
  seoPreview: {
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderRadius: Radius.md,
  },
  seoTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    textDecorationLine: 'underline',
  },
  seoUrl: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  seoDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default Step5Description;
