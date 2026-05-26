/**
 * DraftRecoveryModal Component
 * 
 * Modal for selecting and recovering incomplete profile drafts.
 * Displays list of available drafts with metadata (entity type, last modified, progress).
 * Allows user to select a draft to continue or start fresh.
 * 
 * Features:
 * - List of available drafts with metadata
 * - Entity type badges
 * - Last modified timestamps
 * - Progress indicators
 * - "Continue" and "Start Fresh" actions
 * - Mobile-responsive design (320px+)
 * - Accessibility support (WCAG 2.1 Level AA)
 * 
 * Usage:
 * ```tsx
 * <DraftRecoveryModal
 *   visible={showRecoveryModal}
 *   drafts={drafts}
 *   onSelectDraft={(draftId) => handleSelectDraft(draftId)}
 *   onStartFresh={() => handleStartFresh()}
 *   onDismiss={() => handleDismiss()}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import type { ProfileDraft } from '@/platform/api/endpoints/createProfilesNamespace';
import {
  formatDraftAge,
  calculateDraftCompletion,
  getDraftStepLabel,
} from '../hooks/useDraftRecovery';
import {
  trackDraftRecoveryShown,
  trackDraftRecoveryUsed,
} from '../services/formAnalyticsService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DraftRecoveryModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  /**
   * List of available drafts
   */
  drafts: ProfileDraft[];
  /**
   * Callback when a draft is selected
   */
  onSelectDraft: (draftId: string) => void;
  /**
   * Callback when user chooses to start fresh
   */
  onStartFresh: () => void;
  /**
   * Callback when modal is dismissed
   */
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Entity Type Config
// ---------------------------------------------------------------------------

const ENTITY_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  community: {
    label: 'Community',
    icon: 'people',
    color: CultureTokens.indigo,
  },
  organiser: {
    label: 'Organiser',
    icon: 'calendar',
    color: CultureTokens.violet,
  },
  venue: {
    label: 'Venue',
    icon: 'location',
    color: CultureTokens.coral,
  },
  business: {
    label: 'Business',
    icon: 'storefront',
    color: CultureTokens.teal,
  },
  artist: {
    label: 'Artist',
    icon: 'color-palette',
    color: CultureTokens.gold,
  },
  professional: {
    label: 'Professional',
    icon: 'briefcase',
    color: CultureTokens.indigo,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DraftRecoveryModal({
  visible,
  drafts,
  onSelectDraft,
  onStartFresh,
  onDismiss,
}: DraftRecoveryModalProps) {
  const colors = useColors();
  const hasTrackedShown = useRef(false);

  useEffect(() => {
    if (visible && drafts.length > 0 && !hasTrackedShown.current) {
      // Trust signal: we are proactively surfacing saved work
      trackDraftRecoveryShown(
        {
          sessionId: `draft-${Date.now()}`,
          userId: 'current',
          entityType: drafts[0]?.entityType as any,
          device: { platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web' },
        } as any,
        drafts.length,
      );
      hasTrackedShown.current = true;
    }
    if (!visible) {
      hasTrackedShown.current = false;
    }
  }, [visible, drafts.length]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.modal,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="document-text"
              size={32}
              color={CultureTokens.violet}
            />
          </View>
          <Text
            style={[TextStyles.title2, { color: colors.text }]}
            accessibilityRole="header"
            aria-level={1}
          >
            Continue Your Work?
          </Text>
          <Text
            style={[
              TextStyles.body,
              { color: colors.textSecondary, marginTop: Spacing.xs },
            ]}
          >
            We saved your progress. Pick up exactly where you left off — nothing is lost.
          </Text>
          <Text
            style={[
              TextStyles.caption,
              { color: colors.textTertiary, marginTop: Spacing.xs },
            ]}
          >
            You have {drafts.length} incomplete profile{drafts.length === 1 ? '.' : 's'}
          </Text>
        </View>

        {/* Draft List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onSelect={() => {
                // Trust signal: creator chose to continue a draft
                const completion = calculateDraftCompletion(draft);
                trackDraftRecoveryUsed(
                  {
                    sessionId: `draft-${Date.now()}`,
                    userId: 'current',
                    entityType: draft.entityType as any,
                    device: { platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web' },
                  } as any,
                  draft.id,
                  completion,
                );
                onSelectDraft(draft.id);
              }}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: CultureTokens.violet },
            ]}
            onPress={() => {
              // Select the most recent draft by default
              if (drafts.length > 0) {
                onSelectDraft(drafts[0].id);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Continue with most recent draft"
          >
            <Text style={[TextStyles.callout, { color: '#FFFFFF', fontWeight: '600' }]}>
              Continue Most Recent
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={onStartFresh}
            accessibilityRole="button"
            accessibilityLabel="Start fresh profile"
          >
            <Text
              style={[TextStyles.callout, { color: colors.textSecondary }]}
            >
              Start Fresh
            </Text>
          </Pressable>

          <Pressable
            style={styles.tertiaryButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          >
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Draft Card Component
// ---------------------------------------------------------------------------

interface DraftCardProps {
  draft: ProfileDraft;
  onSelect: () => void;
  colors: ReturnType<typeof useColors>;
}

function DraftCard({ draft, onSelect, colors }: DraftCardProps) {
  const entityConfig: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string } = ENTITY_TYPE_CONFIG[draft.entityType] || {
    label: draft.entityType,
    icon: 'document' as keyof typeof Ionicons.glyphMap,
    color: CultureTokens.indigo,
  };

  const completion = calculateDraftCompletion(draft);
  const age = formatDraftAge(draft.updatedAt);
  const currentStepLabel = getDraftStepLabel(draft.currentStep);

  return (
    <Pressable
      style={[
        styles.draftCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Continue ${entityConfig.label} draft — ${completion}% complete. Last worked on ${age}. Tap to resume.`}
    >
      <>
      {/* Entity Type Badge */}
      <View style={styles.draftHeader}>
        <View
          style={[
            styles.entityBadge,
            { backgroundColor: entityConfig.color + '20' },
          ]}
        >
          <Ionicons
            name={entityConfig.icon}
            size={16}
            color={entityConfig.color}
          />
          <Text
            style={[
              TextStyles.caption,
              { color: entityConfig.color, fontWeight: '600' },
            ]}
          >
            {entityConfig.label}
          </Text>
        </View>

        <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
          {age}
        </Text>
      </View>

      {/* Profile Name (if available) */}
      {(() => {
        const data = draft.formData as Record<string, unknown>;
        const name = (data.officialName || data.name || data.displayName || data.title) as string | undefined;
        if (!name) return null;
        return (
          <Text
            style={[
              TextStyles.callout,
              { color: colors.text, marginTop: Spacing.xs },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
        );
      })()}

      {/* Current Step */}
      <Text
        style={[
          TextStyles.caption,
          { color: colors.textSecondary, marginTop: Spacing.xs },
        ]}
      >
        On: {currentStepLabel}
      </Text>

      {/* Progress Bar - Elevated Trust Visual */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.borderLight },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${completion}%`,
                backgroundColor: entityConfig.color,
              },
            ]}
          />
        </View>
        <Text
          style={[
            TextStyles.captionStrong,
            { color: entityConfig.color, minWidth: 36, textAlign: 'right' },
          ]}
        >
          {completion}%
        </Text>
      </View>

      {/* Continue Arrow */}
      <View style={styles.continueIcon}>
        <Ionicons
          name="arrow-forward-circle"
          size={24}
          color={CultureTokens.violet}
        />
      </View>
      </>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: Spacing.md,
  },
  modal: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: Spacing.sm,
  },
  scrollView: {
    maxHeight: 320,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
  },
  draftCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    position: 'relative',
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  continueIcon: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  actions: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  primaryButton: {
    borderRadius: Radius.full,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
