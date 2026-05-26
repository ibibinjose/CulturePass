/**
 * HelpPanel Component
 *
 * Contextual help system for the profile creation wizard. Provides
 * step-specific help content, FAQ, contact support, video tutorials,
 * and tracks help interactions for analytics.
 *
 * Features:
 * - "Need Help?" floating button on every wizard step
 * - Slide-in panel with contextual help content
 * - Step-specific help explaining each field
 * - FAQ section with common questions per step
 * - Contact Support option (opens chat/support form)
 * - Video tutorial links for complex steps
 * - Help interaction tracking for analytics
 * - Mobile-responsive (320px+)
 * - Accessible (WCAG 2.1 Level AA)
 *
 * Usage:
 * ```tsx
 * <HelpPanel
 *   currentStep={2}
 *   entityType="venue"
 *   onContactSupport={() => openSupportChat()}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/colors';
import { TextStyles } from '@/design-system/tokens/typography';
import {
  Spacing,
  Radius,
  Duration,
  ZIndex,
} from '@/design-system/tokens/theme';
import type { EntityType } from '@/shared/schema/common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HelpPanelProps {
  /** Current wizard step (1-6) */
  currentStep: number;
  /** Entity type being created */
  entityType: EntityType;
  /** Callback when user requests contact support */
  onContactSupport?: (context: SupportContext) => void;
  /** Callback for tracking help interactions */
  onHelpInteraction?: (interaction: HelpInteraction) => void;
  /** Test ID for testing */
  testID?: string;
}

export interface SupportContext {
  currentStep: number;
  entityType: EntityType;
  timestamp: string;
}

export interface HelpInteraction {
  type: 'panel_opened' | 'panel_closed' | 'faq_expanded' | 'video_clicked' | 'support_clicked';
  step: number;
  entityType: EntityType;
  detail?: string;
  timestamp: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface StepHelpContent {
  title: string;
  description: string;
  fields: { name: string; help: string }[];
  faqs: FAQItem[];
  videoUrl?: string;
  videoTitle?: string;
}

// ---------------------------------------------------------------------------
// Help Content Data
// ---------------------------------------------------------------------------

const STEP_HELP_CONTENT: Record<number, StepHelpContent> = {
  1: {
    title: 'Basic Identity',
    description:
      'Set up the core identity for your profile. This information helps users find and recognise you on CulturePass.',
    fields: [
      {
        name: 'Official Name',
        help: 'Your registered or legal entity name. 2-120 characters.',
      },
      {
        name: 'Handle',
        help: 'A unique URL-safe identifier (e.g. @your-handle). Lowercase letters, numbers, and hyphens only.',
      },
      {
        name: 'Founding Date',
        help: 'When your entity was established. Cannot be a future date.',
      },
      {
        name: 'Trading Name',
        help: 'Optional name you trade under if different from your official name.',
      },
    ],
    faqs: [
      {
        question: 'Can I change my handle later?',
        answer:
          'Yes, but changing your handle will break any existing links to your profile. We recommend choosing carefully.',
      },
      {
        question: 'What if my name is already taken?',
        answer:
          'Try adding a location suffix (e.g. your-name-sydney) or abbreviation. The system will suggest alternatives.',
      },
    ],
  },
  2: {
    title: 'Media & Branding',
    description:
      'Upload professional images to make your profile visually appealing. High-quality media significantly increases engagement.',
    fields: [
      {
        name: 'Logo',
        help: 'Square image, minimum 400×400px. JPEG or PNG, max 10MB.',
      },
      {
        name: 'Hero Image',
        help: 'Wide cover image (16:9 or 21:9 aspect ratio). This is the first thing visitors see.',
      },
      {
        name: 'Gallery',
        help: 'Up to 12 additional images. Drag to reorder. These showcase your space, work, or community.',
      },
      {
        name: 'Video',
        help: 'Optional video (MP4/WebM, max 3 minutes, 100MB). Great for virtual tours or introductions.',
      },
    ],
    faqs: [
      {
        question: 'What image dimensions work best?',
        answer:
          'Logo: 400×400px minimum (square). Hero: 1920×1080px (16:9) or 2560×1080px (21:9) for best quality.',
      },
      {
        question: 'Can I use AI to enhance my images?',
        answer:
          'Yes! We offer automatic background removal for logos and AI tagging for searchability.',
      },
    ],
    videoUrl: 'https://help.culturepass.co/tutorials/media-upload',
    videoTitle: 'How to upload and optimise your media',
  },
  3: {
    title: 'Legal & Compliance',
    description:
      'Provide required legal documentation to operate legitimately on the platform. Verification builds trust with your audience.',
    fields: [
      {
        name: 'ABN/ACN',
        help: 'Australian Business Number (11 digits) or Company Number. We validate against the government registry.',
      },
      {
        name: 'Licences',
        help: 'Upload relevant permits and licences. We track expiry dates and send renewal reminders.',
      },
      {
        name: 'Tax Status',
        help: 'Select whether you are registered for GST. If registered, provide your GST ID.',
      },
    ],
    faqs: [
      {
        question: 'Is an ABN required?',
        answer:
          'Required for businesses and organisers running paid events. Other entity types can skip this.',
      },
      {
        question: 'How long does verification take?',
        answer:
          'Standard verification takes up to 48 hours. You can publish your profile while verification is pending.',
      },
      {
        question: 'What if my ABN lookup fails?',
        answer:
          'The government API may be temporarily unavailable. You can save as draft and try again later.',
      },
    ],
    videoUrl: 'https://help.culturepass.co/tutorials/legal-compliance',
    videoTitle: 'Understanding legal requirements',
  },
  4: {
    title: 'Location & Operations',
    description:
      'Specify your location so users can find you geographically. Accurate location data improves local search visibility.',
    fields: [
      {
        name: 'Primary Address',
        help: 'Start typing and select from autocomplete suggestions. We use Google Places for accuracy.',
      },
      {
        name: 'Map Pin',
        help: 'Adjust the pin if the automatic placement is slightly off. Drag to reposition.',
      },
      {
        name: 'Accessibility',
        help: 'Check all accessibility features your location offers. This helps users with specific needs.',
      },
      {
        name: 'Online Only',
        help: 'Select this if you operate entirely online with no physical location.',
      },
    ],
    faqs: [
      {
        question: 'Can I add multiple locations?',
        answer:
          'Yes! Add as many locations as needed and designate one as primary.',
      },
      {
        question: 'What is LGA auto-detection?',
        answer:
          'We automatically determine your Local Government Area from coordinates for local search matching.',
      },
    ],
  },
  5: {
    title: 'Rich Description',
    description:
      'Write compelling descriptions that help your profile stand out and rank well in search results.',
    fields: [
      {
        name: 'Tagline',
        help: 'A short, catchy summary (max 120 characters). This appears in search results and cards.',
      },
      {
        name: 'Long Description',
        help: 'Detailed description with rich text formatting. Use AI Assist for writing help.',
      },
      {
        name: 'Category Tags',
        help: 'Select 3-10 tags that describe your entity. Tags improve discoverability in search.',
      },
    ],
    faqs: [
      {
        question: 'How does AI Assist work?',
        answer:
          'Click the sparkles icon to get AI suggestions for improving, expanding, or shortening your text. You always approve changes before they apply.',
      },
      {
        question: 'What is the readability score?',
        answer:
          'We use the Flesch-Kincaid formula to measure how easy your text is to read. Aim for 60+ for general audiences.',
      },
      {
        question: 'How many tags should I use?',
        answer:
          'We recommend 5-7 tags for optimal search visibility. The popularity indicator shows which tags are most searched.',
      },
    ],
    videoUrl: 'https://help.culturepass.co/tutorials/writing-descriptions',
    videoTitle: 'Writing descriptions that convert',
  },
  6: {
    title: 'Review & Publish',
    description:
      'Review all your information before publishing. Check each section carefully and use Preview to see how it will look to visitors.',
    fields: [
      {
        name: 'Section Review',
        help: 'Each section shows a summary. Click "Edit" to jump back to that step.',
      },
      {
        name: 'Preview',
        help: 'Opens a live preview showing exactly how your profile will appear to visitors.',
      },
      {
        name: 'Publish',
        help: 'Makes your profile live. If verification is required, it will be marked as pending.',
      },
    ],
    faqs: [
      {
        question: 'Can I edit after publishing?',
        answer:
          'Yes! You can edit your profile anytime. Changes are saved as new versions with full history.',
      },
      {
        question: 'What happens if verification is required?',
        answer:
          'Your profile will be published but marked as "Pending Verification". An admin will review within 48 hours.',
      },
      {
        question: 'Can I save as draft instead?',
        answer:
          'Yes, use "Save as Draft" to come back later. Drafts are preserved for 90 days.',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HelpPanel({
  currentStep,
  entityType,
  onContactSupport,
  onHelpInteraction,
  testID,
}: HelpPanelProps) {
  const colors = useColors();
  const { isMobile } = useLayout();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Animation
  const panelProgress = useSharedValue(0);

  const helpContent = STEP_HELP_CONTENT[currentStep] || STEP_HELP_CONTENT[1];

  // ---------------------------------------------------------------------------
  // Tracking helper
  // ---------------------------------------------------------------------------

  const trackInteraction = useCallback(
    (type: HelpInteraction['type'], detail?: string) => {
      onHelpInteraction?.({
        type,
        step: currentStep,
        entityType,
        detail,
        timestamp: new Date().toISOString(),
      });
    },
    [currentStep, entityType, onHelpInteraction]
  );

  // ---------------------------------------------------------------------------
  // Panel toggle
  // ---------------------------------------------------------------------------

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    panelProgress.value = withSpring(1, { damping: 22, stiffness: 280 });
    trackInteraction('panel_opened');
  }, [panelProgress, trackInteraction]);

  const closePanel = useCallback(() => {
    panelProgress.value = withTiming(0, { duration: Duration.normal });
    setTimeout(() => setIsPanelOpen(false), 200);
    trackInteraction('panel_closed');
  }, [panelProgress, trackInteraction]);

  // ---------------------------------------------------------------------------
  // FAQ toggle
  // ---------------------------------------------------------------------------

  const toggleFAQ = useCallback(
    (index: number) => {
      const next = expandedFAQ === index ? null : index;
      setExpandedFAQ(next);
      if (next !== null) {
        trackInteraction('faq_expanded', helpContent.faqs[index]?.question);
      }
    },
    [expandedFAQ, helpContent.faqs, trackInteraction]
  );

  // ---------------------------------------------------------------------------
  // Contact support
  // ---------------------------------------------------------------------------

  const handleContactSupport = useCallback(() => {
    trackInteraction('support_clicked');
    onContactSupport?.({
      currentStep,
      entityType,
      timestamp: new Date().toISOString(),
    });
  }, [currentStep, entityType, onContactSupport, trackInteraction]);

  // ---------------------------------------------------------------------------
  // Video tutorial
  // ---------------------------------------------------------------------------

  const handleVideoClick = useCallback(() => {
    trackInteraction('video_clicked', helpContent.videoTitle);
    if (helpContent.videoUrl) {
      Linking.openURL(helpContent.videoUrl);
    }
  }, [helpContent.videoUrl, helpContent.videoTitle, trackInteraction]);

  // ---------------------------------------------------------------------------
  // Animated styles
  // ---------------------------------------------------------------------------

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      panelProgress.value,
      [0, 1],
      [0, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          panelProgress.value,
          [0, 1],
          [320, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View testID={testID}>
      {/* Floating "Need Help?" Button */}
      <Pressable
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
          isMobile && styles.floatingButtonMobile,
        ]}
        onPress={openPanel}
        accessibilityRole="button"
        accessibilityLabel="Need help? Open contextual help panel"
      >
        <Ionicons
          name="help-circle-outline"
          size={20}
          color={CultureTokens.indigo}
        />
        {!isMobile && (
          <Text style={[styles.floatingButtonText, { color: colors.text }]}>
            Need Help?
          </Text>
        )}
      </Pressable>

      {/* Panel Overlay + Slide-in Panel */}
      {isPanelOpen && (
        <View style={styles.panelOverlayContainer}>
          {/* Backdrop */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePanel}
            accessibilityRole="button"
            accessibilityLabel="Close help panel"
          >
            <Animated.View
              style={[styles.backdrop, overlayStyle]}
            />
          </Pressable>

          {/* Panel */}
          <Animated.View
            style={[
              styles.panel,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              isMobile && styles.panelMobile,
              panelStyle,
            ]}
            accessibilityRole="none"
            accessibilityLabel={`Help for Step ${currentStep}: ${helpContent.title}`}
          >
            {/* Panel Header */}
            <View style={[styles.panelHeader, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.panelHeaderLeft}>
                <Ionicons
                  name="help-circle"
                  size={24}
                  color={CultureTokens.indigo}
                />
                <Text style={[TextStyles.title3, { color: colors.text }]}>
                  Help
                </Text>
              </View>
              <Pressable
                onPress={closePanel}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close help panel"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Panel Content */}
            <ScrollView
              style={styles.panelScroll}
              contentContainerStyle={styles.panelScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Step Title & Description */}
              <View style={styles.section}>
                <View style={[styles.stepBadge, { backgroundColor: `${CultureTokens.indigo}15` }]}>
                  <Text style={[styles.stepBadgeText, { color: CultureTokens.indigo }]}>
                    Step {currentStep} of 6
                  </Text>
                </View>
                <Text
                  style={[TextStyles.title2, { color: colors.text, marginTop: Spacing.sm }]}
                  accessibilityRole="header"
                >
                  {helpContent.title}
                </Text>
                <Text
                  style={[
                    styles.descriptionText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {helpContent.description}
                </Text>
              </View>

              {/* Field Help */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.text }]}
                  accessibilityRole="header"
                >
                  Field Guide
                </Text>
                {helpContent.fields.map((field, index) => (
                  <View
                    key={index}
                    style={[
                      styles.fieldHelpItem,
                      { borderBottomColor: colors.borderLight },
                      index === helpContent.fields.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={[styles.fieldName, { color: colors.text }]}>
                      {field.name}
                    </Text>
                    <Text style={[styles.fieldHelp, { color: colors.textSecondary }]}>
                      {field.help}
                    </Text>
                  </View>
                ))}
              </View>

              {/* FAQ Section */}
              {helpContent.faqs.length > 0 && (
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.text }]}
                    accessibilityRole="header"
                  >
                    Frequently Asked Questions
                  </Text>
                  {helpContent.faqs.map((faq, index) => (
                    <FAQAccordion
                      key={index}
                      question={faq.question}
                      answer={faq.answer}
                      isExpanded={expandedFAQ === index}
                      onToggle={() => toggleFAQ(index)}
                      colors={colors}
                    />
                  ))}
                </View>
              )}

              {/* Video Tutorial */}
              {helpContent.videoUrl && (
                <View style={styles.section}>
                  <Pressable
                    style={[
                      styles.videoCard,
                      {
                        backgroundColor: `${CultureTokens.violet}08`,
                        borderColor: `${CultureTokens.violet}20`,
                      },
                    ]}
                    onPress={handleVideoClick}
                    accessibilityRole="link"
                    accessibilityLabel={`Watch video tutorial: ${helpContent.videoTitle}`}
                  >
                    <View style={styles.videoIconContainer}>
                      <Ionicons
                        name="play-circle"
                        size={32}
                        color={CultureTokens.violet}
                      />
                    </View>
                    <View style={styles.videoTextContainer}>
                      <Text style={[styles.videoLabel, { color: colors.textTertiary }]}>
                        Video Tutorial
                      </Text>
                      <Text style={[styles.videoTitle, { color: colors.text }]}>
                        {helpContent.videoTitle}
                      </Text>
                    </View>
                    <Ionicons
                      name="open-outline"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>
              )}

              {/* Contact Support */}
              <View style={styles.section}>
                <Pressable
                  style={[
                    styles.supportCard,
                    {
                      backgroundColor: `${CultureTokens.teal}08`,
                      borderColor: `${CultureTokens.teal}20`,
                    },
                  ]}
                  onPress={handleContactSupport}
                  accessibilityRole="button"
                  accessibilityLabel="Contact support for help with this step"
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color={CultureTokens.teal}
                  />
                  <View style={styles.supportTextContainer}>
                    <Text style={[styles.supportTitle, { color: colors.text }]}>
                      Contact Support
                    </Text>
                    <Text style={[styles.supportSubtitle, { color: colors.textSecondary }]}>
                      Get help from our team
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textTertiary}
                  />
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion Sub-component
// ---------------------------------------------------------------------------

interface FAQAccordionProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
}

function FAQAccordion({
  question,
  answer,
  isExpanded,
  onToggle,
  colors,
}: FAQAccordionProps) {
  return (
    <View style={[styles.faqItem, { borderBottomColor: colors.borderLight }]}>
      <Pressable
        style={styles.faqQuestion}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={question}
      >
        <Text
          style={[
            styles.faqQuestionText,
            { color: colors.text },
            isExpanded && { color: CultureTokens.indigo },
          ]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {question}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={isExpanded ? CultureTokens.indigo : colors.textTertiary}
        />
      </Pressable>
      {isExpanded && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
          {answer}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    zIndex: ZIndex.raised,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  floatingButtonMobile: {
    paddingHorizontal: Spacing.sm,
    bottom: Spacing.md,
    right: Spacing.sm,
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Panel Overlay
  panelOverlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: ZIndex.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 360,
    borderLeftWidth: 1,
    zIndex: ZIndex.modal,
    ...Platform.select({
      web: {
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  panelMobile: {
    width: '100%',
    borderLeftWidth: 0,
  },

  // Panel Header
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Panel Content
  panelScroll: {
    flex: 1,
  },
  panelScrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },

  // Step Badge
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Description
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },

  // Field Help
  fieldHelpItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fieldHelp: {
    fontSize: 13,
    lineHeight: 18,
  },

  // FAQ
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    paddingBottom: Spacing.sm,
  },

  // Video Card
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  videoIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTextContainer: {
    flex: 1,
  },
  videoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },

  // Support Card
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
