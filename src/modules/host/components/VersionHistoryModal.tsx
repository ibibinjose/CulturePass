/**
 * VersionHistoryModal Component
 *
 * Modal for viewing profile version history with side-by-side diff,
 * rollback functionality, and JSON export.
 *
 * Features:
 * - Version list with timestamps and change summaries
 * - Side-by-side diff view for selected version
 * - Rollback to any previous version (creates new version, preserves history)
 * - JSON export of full version history
 * - Mobile-responsive design (320px+)
 * - Accessibility support (WCAG 2.1 Level AA)
 *
 * Usage:
 * ```tsx
 * <VersionHistoryModal
 *   visible={showVersionHistory}
 *   profileId={profileId}
 *   onDismiss={() => setShowVersionHistory(false)}
 *   onRollbackComplete={() => refetchProfile()}
 * />
 * ```
 *
 * Validates: Requirements 18
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import type { ProfileVersion } from '@/platform/api/endpoints/createProfilesNamespace';
import {
  useVersionHistory,
  formatVersionDate,
  formatDiffValue,
  type FieldDiff,
} from '../hooks/useVersionHistory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionHistoryModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Profile ID to show version history for */
  profileId: string;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
  /** Callback after a successful rollback */
  onRollbackComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VersionHistoryModal({
  visible,
  profileId,
  onDismiss,
  onRollbackComplete,
}: VersionHistoryModalProps) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  const {
    versions,
    isLoading,
    error,
    selectedVersion,
    selectVersion,
    diff,
    rollback,
    isRollingBack,
    exportAsJson,
  } = useVersionHistory({ profileId, enabled: visible });

  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  if (!visible) return null;

  const handleRollback = async () => {
    if (!selectedVersion) return;
    try {
      await rollback(selectedVersion.versionNumber);
      setShowRollbackConfirm(false);
      onRollbackComplete?.();
    } catch {
      // Error is handled by the mutation state
    }
  };

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.modal,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            maxWidth: isDesktop ? 920 : '100%',
          },
        ]}
        accessibilityRole="none"
        accessibilityLabel="Version history modal"
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="time" size={24} color={CultureTokens.violet} />
            <Text
              style={[TextStyles.title2, { color: colors.text, marginLeft: Spacing.sm }]}
              accessibilityRole="header"
              aria-level={1}
            >
              Version History
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.background }]}
              onPress={exportAsJson}
              accessibilityRole="button"
              accessibilityLabel="Export version history as JSON"
              disabled={versions.length === 0}
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={versions.length === 0 ? colors.textTertiary : colors.text}
              />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.background }]}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close version history"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={CultureTokens.violet} />
            <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              Loading version history…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={CultureTokens.coral} />
            <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              Failed to load version history
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: Spacing.xs }]}>
              {error.message}
            </Text>
          </View>
        ) : versions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              No version history yet
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: Spacing.xs }]}>
              Versions are created each time you save changes.
            </Text>
          </View>
        ) : (
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {/* Version List */}
            <ScrollView
              style={[
                styles.versionList,
                isDesktop && styles.versionListDesktop,
                {
                  borderRightColor: isDesktop ? colors.borderLight : 'transparent',
                  borderRightWidth: isDesktop ? 1 : 0,
                },
              ]}
              contentContainerStyle={styles.versionListContent}
              accessibilityRole="list"
              accessibilityLabel="Version list"
            >
              {versions.map((version) => (
                <VersionListItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersion?.id === version.id}
                  onSelect={() => selectVersion(version)}
                  colors={colors}
                />
              ))}
            </ScrollView>

            {/* Diff View */}
            <ScrollView
              style={styles.diffView}
              contentContainerStyle={styles.diffViewContent}
            >
              {selectedVersion && diff ? (
                <DiffPanel
                  diff={diff}
                  colors={colors}
                  isRollingBack={isRollingBack}
                  onRollback={() => setShowRollbackConfirm(true)}
                />
              ) : (
                <View style={styles.diffPlaceholder}>
                  <Ionicons
                    name="git-compare-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      TextStyles.body,
                      { color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
                    ]}
                  >
                    Select a version to view changes
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Rollback Confirmation */}
        {showRollbackConfirm && selectedVersion && (
          <RollbackConfirmation
            version={selectedVersion}
            isRollingBack={isRollingBack}
            onConfirm={handleRollback}
            onCancel={() => setShowRollbackConfirm(false)}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Version List Item
// ---------------------------------------------------------------------------

interface VersionListItemProps {
  version: ProfileVersion;
  isSelected: boolean;
  onSelect: () => void;
  colors: ReturnType<typeof useColors>;
}

function VersionListItem({
  version,
  isSelected,
  onSelect,
  colors,
}: VersionListItemProps) {
  const changeCount = version.changedFields.length;
  const formattedDate = formatVersionDate(version.createdAt);

  return (
    <Pressable
      style={[
        styles.versionItem,
        {
          backgroundColor: isSelected
            ? CultureTokens.violet + '15'
            : colors.background,
          borderColor: isSelected ? CultureTokens.violet : colors.borderLight,
        },
      ]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Version ${version.versionNumber}, ${formattedDate}, ${changeCount} field${changeCount === 1 ? '' : 's'} changed`}
      accessibilityState={{ selected: isSelected }}
    >
      {/* Version Number Badge */}
      <View style={styles.versionItemHeader}>
        <View
          style={[
            styles.versionBadge,
            {
              backgroundColor: isSelected
                ? CultureTokens.violet
                : colors.textTertiary,
            },
          ]}
        >
          <Text style={[TextStyles.caption, { color: '#FFFFFF', fontWeight: '700' }]}>
            v{version.versionNumber}
          </Text>
        </View>
        <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
          {formattedDate}
        </Text>
      </View>

      {/* Change Summary */}
      <Text
        style={[
          TextStyles.caption,
          { color: colors.textSecondary, marginTop: Spacing.xs },
        ]}
        numberOfLines={2}
      >
        {changeCount > 0
          ? `${changeCount} field${changeCount === 1 ? '' : 's'} changed`
          : 'Initial version'}
      </Text>

      {/* Changed Fields Preview */}
      {changeCount > 0 && (
        <View style={styles.changedFieldsPreview}>
          {version.changedFields.slice(0, 3).map((field) => (
            <View
              key={field}
              style={[styles.fieldChip, { backgroundColor: colors.borderLight }]}
            >
              <Text
                style={[TextStyles.caption, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {field}
              </Text>
            </View>
          ))}
          {changeCount > 3 && (
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
              +{changeCount - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Change Reason */}
      {version.changeReason && (
        <Text
          style={[
            TextStyles.caption,
            {
              color: colors.textTertiary,
              marginTop: Spacing.xs,
              fontStyle: 'italic',
            },
          ]}
          numberOfLines={1}
        >
          &ldquo;{version.changeReason}&rdquo;
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Diff Panel
// ---------------------------------------------------------------------------

interface DiffPanelProps {
  diff: {
    version: ProfileVersion;
    previousVersion: ProfileVersion | null;
    changes: FieldDiff[];
  };
  colors: ReturnType<typeof useColors>;
  isRollingBack: boolean;
  onRollback: () => void;
}

function DiffPanel({ diff, colors, isRollingBack, onRollback }: DiffPanelProps) {
  const { version, previousVersion, changes } = diff;

  return (
    <View>
      {/* Diff Header */}
      <View style={styles.diffHeader}>
        <View>
          <Text style={[TextStyles.headline, { color: colors.text }]}>
            Version {version.versionNumber}
          </Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {formatVersionDate(version.createdAt)}
            {previousVersion
              ? ` • Compared to v${previousVersion.versionNumber}`
              : ' • Initial version'}
          </Text>
        </View>

        {/* Rollback Button */}
        {previousVersion && (
          <Pressable
            style={[
              styles.rollbackButton,
              { borderColor: CultureTokens.coral },
              isRollingBack && { opacity: 0.5 },
            ]}
            onPress={onRollback}
            disabled={isRollingBack}
            accessibilityRole="button"
            accessibilityLabel={`Rollback to version ${version.versionNumber}`}
          >
            {isRollingBack ? (
              <ActivityIndicator size="small" color={CultureTokens.coral} />
            ) : (
              <>
                <Ionicons name="arrow-undo" size={16} color={CultureTokens.coral} />
                <Text style={[TextStyles.caption, { color: CultureTokens.coral, fontWeight: '600' }]}>
                  Rollback
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Changes */}
      {changes.length === 0 ? (
        <View style={styles.noChanges}>
          <Text style={[TextStyles.body, { color: colors.textSecondary }]}>
            No field changes detected in this version.
          </Text>
        </View>
      ) : (
        <View style={styles.changesList}>
          {changes.map((change) => (
            <DiffRow key={change.field} change={change} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Diff Row (Side-by-Side)
// ---------------------------------------------------------------------------

interface DiffRowProps {
  change: FieldDiff;
  colors: ReturnType<typeof useColors>;
}

function DiffRow({ change, colors }: DiffRowProps) {
  const oldFormatted = formatDiffValue(change.oldValue);
  const newFormatted = formatDiffValue(change.newValue);
  const isAdded = change.oldValue === undefined || change.oldValue === null;
  const isRemoved = change.newValue === undefined || change.newValue === null;

  return (
    <View
      style={[styles.diffRow, { borderBottomColor: colors.borderLight }]}
      accessibilityLabel={`${change.label}: changed from "${oldFormatted}" to "${newFormatted}"`}
    >
      {/* Field Label */}
      <Text style={[TextStyles.callout, { color: colors.text, fontWeight: '600' }]}>
        {change.label}
      </Text>

      {/* Side-by-Side Values */}
      <View style={styles.diffValues}>
        {/* Old Value */}
        <View
          style={[
            styles.diffValueBox,
            {
              backgroundColor: isAdded ? 'transparent' : CultureTokens.coral + '10',
              borderColor: isAdded ? colors.borderLight : CultureTokens.coral + '30',
            },
          ]}
        >
          <View style={styles.diffValueHeader}>
            <Ionicons
              name={isAdded ? 'remove-circle-outline' : 'remove-circle'}
              size={14}
              color={isAdded ? colors.textTertiary : CultureTokens.coral}
            />
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
              Before
            </Text>
          </View>
          <Text
            style={[
              TextStyles.caption,
              {
                color: isAdded ? colors.textTertiary : colors.text,
                fontStyle: isAdded ? 'italic' : 'normal',
              },
            ]}
            numberOfLines={6}
          >
            {isAdded ? '(not set)' : oldFormatted}
          </Text>
        </View>

        {/* Arrow */}
        <View style={styles.diffArrow}>
          <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
        </View>

        {/* New Value */}
        <View
          style={[
            styles.diffValueBox,
            {
              backgroundColor: isRemoved ? 'transparent' : CultureTokens.teal + '10',
              borderColor: isRemoved ? colors.borderLight : CultureTokens.teal + '30',
            },
          ]}
        >
          <View style={styles.diffValueHeader}>
            <Ionicons
              name={isRemoved ? 'remove-circle-outline' : 'add-circle'}
              size={14}
              color={isRemoved ? colors.textTertiary : CultureTokens.teal}
            />
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
              After
            </Text>
          </View>
          <Text
            style={[
              TextStyles.caption,
              {
                color: isRemoved ? colors.textTertiary : colors.text,
                fontStyle: isRemoved ? 'italic' : 'normal',
              },
            ]}
            numberOfLines={6}
          >
            {isRemoved ? '(removed)' : newFormatted}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rollback Confirmation
// ---------------------------------------------------------------------------

interface RollbackConfirmationProps {
  version: ProfileVersion;
  isRollingBack: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  colors: ReturnType<typeof useColors>;
}

function RollbackConfirmation({
  version,
  isRollingBack,
  onConfirm,
  onCancel,
  colors,
}: RollbackConfirmationProps) {
  return (
    <View style={styles.confirmOverlay}>
      <View
        style={[
          styles.confirmModal,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
        accessibilityRole="alert"
        accessibilityLabel="Confirm rollback"
      >
        <Ionicons name="warning" size={40} color={CultureTokens.coral} />
        <Text
          style={[TextStyles.title3, { color: colors.text, marginTop: Spacing.sm, textAlign: 'center' }]}
        >
          Rollback to Version {version.versionNumber}?
        </Text>
        <Text
          style={[
            TextStyles.body,
            { color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
          ]}
        >
          This will restore your profile to the state it was in at version{' '}
          {version.versionNumber}. A new version will be created — no history
          will be lost.
        </Text>

        <View style={styles.confirmActions}>
          <Pressable
            style={[styles.confirmCancelButton, { borderColor: colors.borderLight }]}
            onPress={onCancel}
            disabled={isRollingBack}
            accessibilityRole="button"
            accessibilityLabel="Cancel rollback"
          >
            <Text style={[TextStyles.callout, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.confirmRollbackButton,
              { backgroundColor: CultureTokens.coral },
              isRollingBack && { opacity: 0.6 },
            ]}
            onPress={onConfirm}
            disabled={isRollingBack}
            accessibilityRole="button"
            accessibilityLabel="Confirm rollback"
          >
            {isRollingBack ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[TextStyles.callout, { color: '#FFFFFF' }]}>
                Rollback
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    maxHeight: '90%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  content: {
    flex: 1,
    minHeight: 400,
  },
  contentDesktop: {
    flexDirection: 'row',
  },
  versionList: {
    maxHeight: 300,
  },
  versionListDesktop: {
    width: 280,
    maxHeight: undefined,
  },
  versionListContent: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  versionItem: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  versionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  changedFieldsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.xs,
  },
  fieldChip: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  diffView: {
    flex: 1,
  },
  diffViewContent: {
    padding: Spacing.md,
  },
  diffPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  diffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  rollbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  noChanges: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  changesList: {
    gap: Spacing.sm,
  },
  diffRow: {
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  diffValues: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  diffValueBox: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.xs,
  },
  diffValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  diffArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    padding: Spacing.lg,
  },
  confirmModal: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRollbackButton: {
    flex: 1,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
