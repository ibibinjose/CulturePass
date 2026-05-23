/**
 * VerificationChecklist
 * =====================
 * Admin checklist component for reviewing verification tasks.
 * Displays checklist items with toggle and optional notes per item.
 *
 * Related: Requirement 8 (Legal and Compliance Fields)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { Radius } from '@/design-system/tokens/spacing';
import { GlassView } from '@/design-system/ui/GlassView';
import type { VerificationChecklistItem } from '@/shared/schema';

interface VerificationChecklistProps {
  /** The checklist items to display */
  checklist: VerificationChecklistItem[];
  /** Callback when checklist changes. If undefined, checklist is read-only. */
  onChange?: (updatedChecklist: VerificationChecklistItem[]) => void;
  /** Whether the checklist is disabled (non-interactive) */
  disabled?: boolean;
}

export function VerificationChecklist({ checklist, onChange, disabled }: VerificationChecklistProps) {
  const colors = useColors();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const completedCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = (index: number) => {
    if (disabled || !onChange) return;
    const updated = checklist.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    onChange(updated);
  };

  const handleNotesChange = (index: number, notes: string) => {
    if (disabled || !onChange) return;
    const updated = checklist.map((item, i) =>
      i === index ? { ...item, notes } : item
    );
    onChange(updated);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <GlassView intensity={8} style={styles.card} contentStyle={styles.cardContent}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Checklist</Text>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {completedCount}/{totalCount}
          </Text>
          {completedCount === totalCount && totalCount > 0 && (
            <Ionicons name="checkmark-done-circle" size={16} color={CultureTokens.teal} />
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: completedCount === totalCount ? CultureTokens.teal : CultureTokens.indigo,
            },
          ]}
        />
      </View>

      {/* Checklist Items */}
      {checklist.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          No checklist items defined
        </Text>
      ) : (
        checklist.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={index} style={[styles.itemContainer, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.itemRow}>
                <Pressable
                  onPress={() => handleToggle(index)}
                  disabled={disabled || !onChange}
                  accessibilityLabel={`${item.checked ? 'Uncheck' : 'Check'} ${item.item}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.checked }}
                  style={styles.checkboxArea}
                >
                  <View
                    style={[
                      styles.checkbox,
                      item.checked && styles.checkboxChecked,
                      disabled && styles.checkboxDisabled,
                    ]}
                  >
                    {item.checked && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>

                <Pressable
                  style={styles.itemTextArea}
                  onPress={() => toggleExpand(index)}
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} notes for ${item.item}`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.itemText,
                      { color: colors.text },
                      item.checked && styles.itemTextChecked,
                    ]}
                  >
                    {item.item}
                  </Text>
                  {item.notes && !isExpanded && (
                    <Text style={[styles.notePreview, { color: colors.textTertiary }]} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => toggleExpand(index)}
                  accessibilityLabel={isExpanded ? 'Collapse notes' : 'Add notes'}
                  accessibilityRole="button"
                  style={styles.expandBtn}
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chatbubble-ellipses-outline'}
                    size={16}
                    color={colors.textTertiary}
                  />
                </Pressable>
              </View>

              {/* Expanded Notes */}
              {isExpanded && (
                <View style={styles.notesContainer}>
                  {disabled || !onChange ? (
                    <Text style={[styles.notesReadOnly, { color: colors.textSecondary }]}>
                      {item.notes || 'No notes'}
                    </Text>
                  ) : (
                    <TextInput
                      style={[styles.notesInput, { color: colors.text, borderColor: colors.borderLight }]}
                      value={item.notes ?? ''}
                      onChangeText={(text) => handleNotesChange(index, text)}
                      placeholder="Add notes for this item..."
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      numberOfLines={2}
                      accessibilityLabel={`Notes for ${item.item}`}
                    />
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg },
  cardContent: { padding: 16, gap: 12 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  progressInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressText: { fontSize: 12, fontFamily: FontFamily.bold },

  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  emptyText: { fontSize: 13, fontFamily: FontFamily.medium, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  itemContainer: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxArea: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CultureTokens.indigo + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: CultureTokens.teal,
    borderColor: CultureTokens.teal,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  itemTextArea: {
    flex: 1,
  },
  itemText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  notePreview: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  expandBtn: {
    padding: 6,
  },

  notesContainer: {
    marginLeft: 36,
    marginTop: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 8,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  notesReadOnly: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    fontStyle: 'italic',
  },
});
