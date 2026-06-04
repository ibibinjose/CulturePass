/**
 * VerificationStatusBanner
 *
 * Reusable, production-grade component for surfacing verification status
 * with clear livelihood impact messaging.
 *
 * Used in:
 *  - Wizard Step 3 & Step 6
 *  - Post-publish success screen
 *  - HostSpace profile cards / dashboard
 *  - Entity detail views
 *
 * Trust Principles:
 * - Transparency over opacity
 * - "What you can do today" > "Pending"
 * - Actionable next step when relevant
 * - Culturally warm but professionally competent tone
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  Radius,
  Spacing,
  TextStyles,
} from '@/design-system/tokens/theme';
import type { EntityType } from '../hooks/useFormWizard';

export type VerificationStatus =
  | 'not_started'
  | 'in_review'
  | 'approved'
  | 'needs_more_info';

export interface VerificationStatusBannerProps {
  status: VerificationStatus;
  entityType: EntityType;
  /** What this status currently unlocks for the creator */
  unlocksToday?: string[];
  /** What this status will unlock once completed */
  unlocksAfter?: string[];
  /** Optional verification notes (e.g. from backend) */
  notes?: string;
  /** Optional callback for primary action (e.g. "Complete verification") */
  onAction?: () => void;
  /** Render in compact form (for inside wizard steps) */
  compact?: boolean;
  /** Optional override label */
  actionLabel?: string;
  /** Analytics location hint */
  location?: 'wizard' | 'post_publish' | 'dashboard' | 'profile_card';
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    label: string;
    tone: 'positive' | 'neutral' | 'attention';
  }
> = {
  not_started: {
    icon: 'shield-outline',
    color: CultureTokens.gold,
    label: 'Verification not started',
    tone: 'neutral',
  },
  in_review: {
    icon: 'time-outline',
    color: CultureTokens.teal,
    label: 'Verification in review',
    tone: 'neutral',
  },
  approved: {
    icon: 'checkmark-circle',
    color: CultureTokens.success,
    label: 'Verified',
    tone: 'positive',
  },
  needs_more_info: {
    icon: 'alert-circle-outline',
    color: CultureTokens.coral,
    label: 'More information needed',
    tone: 'attention',
  },
};

export function VerificationStatusBanner({
  status,
  entityType,
  unlocksToday = [],
  unlocksAfter = [],
  notes,
  onAction,
  compact = false,
  actionLabel,
  location,
}: VerificationStatusBannerProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  const config = STATUS_CONFIG[status];
  const showAction = !!onAction && status !== 'approved';

  const defaultActionLabel =
    status === 'needs_more_info'
      ? 'Add documents'
      : status === 'in_review'
        ? 'Check status'
        : 'Start verification';

  const finalActionLabel = actionLabel || defaultActionLabel;

  // Entity-specific context (kept lightweight — can be expanded)
  const entityLabel = getEntityDisplayLabel(entityType);

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: colors.surfaceElevated,
            borderLeftColor: config.color,
          },
        ]}
        accessibilityRole="text"
      >
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textSecondary, marginLeft: Spacing.xs },
          ]}
          numberOfLines={1}
        >
          {config.label}
          {unlocksToday.length > 0 && ` • ${unlocksToday[0]}`}
          {notes && ` • ${notes}`}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.borderLight,
        },
      ]}
      accessibilityRole="summary"
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.statusRow}>
          <Ionicons
            name={config.icon}
            size={20}
            color={config.color}
            style={{ marginRight: Spacing.sm }}
          />
          <Text style={[TextStyles.callout, { color: colors.text, fontWeight: '600' }]}>
            {config.label}
          </Text>
        </View>

        {status === 'approved' && (
          <View style={[styles.badge, { backgroundColor: CultureTokens.success + '20' }]}>
            <Text style={[TextStyles.caption, { color: CultureTokens.success, fontWeight: '600' }]}>
              Active
            </Text>
          </View>
        )}
      </View>

      {/* Notes (if any) */}
      {notes && (
        <View style={{ marginTop: Spacing.xs }}>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            {notes}
          </Text>
        </View>
      )}

      {/* Impact messaging */}
      {unlocksToday.length > 0 && (
        <View style={styles.section}>
          <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
            You can do this now:
          </Text>
          {unlocksToday.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <Ionicons name="checkmark" size={14} color={CultureTokens.success} />
              <Text style={[TextStyles.bodySmall, { color: colors.text, marginLeft: 6 }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}

      {unlocksAfter.length > 0 && status !== 'approved' && (
        <View style={styles.section}>
          <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
            Complete verification to unlock:
          </Text>
          {unlocksAfter.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
              <Text style={[TextStyles.bodySmall, { color: colors.textSecondary, marginLeft: 6 }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action */}
      {showAction && (
        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor:
                status === 'needs_more_info' ? CultureTokens.coral : CultureTokens.violet,
            },
          ]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={finalActionLabel}
        >
          <Text style={[TextStyles.callout, { color: '#FFFFFF', fontWeight: '600' }]}>
            {finalActionLabel}
          </Text>
        </Pressable>
      )}

      {/* Subtle entity context for non-compact */}
      {!compact && (
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' },
          ]}
        >
          Applies to your {entityLabel} profile
        </Text>
      )}
    </View>
  );
}

function getEntityDisplayLabel(entityType: EntityType): string {
  const map: Record<EntityType, string> = {
    community: 'community',
    organiser: 'organiser',
    organizer: 'organiser',
    venue: 'venue',
    business: 'business',
    artist: 'artist',
    professional: 'professional profile',
  };
  return map[entityType] || 'profile';
}


const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  section: {
    marginTop: Spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionButton: {
    marginTop: Spacing.md,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
