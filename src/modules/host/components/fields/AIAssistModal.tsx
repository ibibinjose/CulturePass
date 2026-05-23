/**
 * AIAssistModal Component
 * 
 * Modal interface for AI text assistance.
 * Displays AI operation options and shows results with accept/reject/edit actions.
 * 
 * Requirements: 5, 11
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useColors } from '@/hooks/useColors';
import { M3Button } from '@/design-system/ui/M3Button';
import { M3Card } from '@/design-system/ui/M3Card';
import { CultureTokens, Radius, FontFamily } from '@/design-system/tokens/theme';
import { useAIAssist, type AIOperation, type FieldType } from '../../hooks/useAIAssist';

export interface AIAssistModalProps {
  visible: boolean;
  onClose: () => void;
  currentText: string;
  onApply: (newText: string) => void;
  fieldType: FieldType;
}

interface AIOperationOption {
  id: AIOperation;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPERATIONS: AIOperationOption[] = [
  {
    id: 'improve',
    label: 'Improve Writing',
    description: 'Enhance clarity and flow',
    icon: 'create-outline',
  },
  {
    id: 'professional',
    label: 'Make Professional',
    description: 'Polish for business context',
    icon: 'briefcase-outline',
  },
  {
    id: 'expand',
    label: 'Expand',
    description: 'Add more detail',
    icon: 'expand-outline',
  },
  {
    id: 'shorten',
    label: 'Shorten',
    description: 'Make more concise',
    icon: 'contract-outline',
  },
];

const TONE_OPTIONS: AIOperationOption[] = [
  {
    id: 'tone-friendly',
    label: 'Friendly',
    description: 'Warm and approachable',
    icon: 'happy-outline',
  },
  {
    id: 'tone-professional',
    label: 'Professional',
    description: 'Formal and polished',
    icon: 'business-outline',
  },
  {
    id: 'tone-enthusiastic',
    label: 'Enthusiastic',
    description: 'Energetic and exciting',
    icon: 'flash-outline',
  },
  {
    id: 'tone-formal',
    label: 'Formal',
    description: 'Traditional and respectful',
    icon: 'ribbon-outline',
  },
];

/**
 * AI Assist Modal
 * 
 * Provides a modal interface for AI text assistance with:
 * - Operation selection (improve, professional, expand, shorten)
 * - Tone selection (friendly, professional, enthusiastic, formal)
 * - Result preview with accept/reject/edit actions
 * - Readability score display for descriptions
 */
export function AIAssistModal({
  visible,
  onClose,
  currentText,
  onApply,
  fieldType,
}: AIAssistModalProps) {
  const colors = useColors();
  const { isLoading, error, result, processText, clearResult, calculateReadability } = useAIAssist();
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleOperationSelect = async (operation: AIOperation) => {
    await processText(currentText, operation, fieldType);
  };

  const handleAccept = () => {
    if (result) {
      onApply(isEditing ? editedText : result.suggestedText);
      handleClose();
    }
  };

  const handleReject = () => {
    clearResult();
    setIsEditing(false);
    setEditedText('');
  };

  const handleEdit = () => {
    if (result) {
      setEditedText(result.suggestedText);
      setIsEditing(true);
    }
  };

  const handleClose = () => {
    clearResult();
    setIsEditing(false);
    setEditedText('');
    onClose();
  };

  const readabilityScore = result?.readabilityScore ?? 
    (fieldType === 'description' ? calculateReadability(currentText) : undefined);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 20 : 0} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={[styles.modalContainer, { maxWidth: 600 }]}>
          <M3Card style={[styles.modal, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="sparkles" size={24} color={CultureTokens.violet} />
                <Text style={[styles.title, { color: colors.text }]}>
                  AI Assist
                </Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Current Text Preview */}
              {!result && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    Current Text
                  </Text>
                  <View style={[styles.textPreview, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={4}>
                      {currentText || 'No text entered yet'}
                    </Text>
                  </View>
                  {readabilityScore !== undefined && (
                    <View style={styles.readabilityRow}>
                      <Text style={[styles.readabilityLabel, { color: colors.textSecondary }]}>
                        Readability Score:
                      </Text>
                      <Text style={[
                        styles.readabilityScore,
                        { color: readabilityScore < 60 ? CultureTokens.coral : CultureTokens.teal }
                      ]}>
                        {readabilityScore}/100
                      </Text>
                      {readabilityScore < 60 && (
                        <Text style={[styles.readabilityHint, { color: CultureTokens.coral }]}>
                          Consider simplifying
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Operations */}
              {!result && (
                <>
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Choose an operation
                    </Text>
                    <View style={styles.optionsGrid}>
                      {OPERATIONS.map((op) => (
                        <Pressable
                          key={op.id}
                          onPress={() => handleOperationSelect(op.id)}
                          disabled={isLoading || !currentText}
                          style={[
                            styles.optionCard,
                            { 
                              backgroundColor: colors.surface,
                              borderColor: colors.borderLight,
                            },
                          ]}
                        >
                          <Ionicons name={op.icon} size={24} color={CultureTokens.violet} />
                          <Text style={[styles.optionLabel, { color: colors.text }]}>
                            {op.label}
                          </Text>
                          <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                            {op.description}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Tone Options */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Or change tone
                    </Text>
                    <View style={styles.optionsGrid}>
                      {TONE_OPTIONS.map((op) => (
                        <Pressable
                          key={op.id}
                          onPress={() => handleOperationSelect(op.id)}
                          disabled={isLoading || !currentText}
                          style={[
                            styles.optionCard,
                            { 
                              backgroundColor: colors.surface,
                              borderColor: colors.borderLight,
                            },
                          ]}
                        >
                          <Ionicons name={op.icon} size={24} color={CultureTokens.violet} />
                          <Text style={[styles.optionLabel, { color: colors.text }]}>
                            {op.label}
                          </Text>
                          <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                            {op.description}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Loading State */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={CultureTokens.violet} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    AI is working on your text...
                  </Text>
                </View>
              )}

              {/* Error State */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Result */}
              {result && !isLoading && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    AI Suggestion
                  </Text>
                  
                  {isEditing ? (
                    <TextInput
                      value={editedText}
                      onChangeText={setEditedText}
                      multiline
                      style={[
                        styles.editInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: CultureTokens.indigo,
                          color: colors.text,
                        },
                      ]}
                      placeholderTextColor={colors.textSecondary}
                    />
                  ) : (
                    <View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: CultureTokens.teal }]}>
                      <Text style={[styles.resultText, { color: colors.text }]}>
                        {result.suggestedText}
                      </Text>
                    </View>
                  )}

                  {result.readabilityScore !== undefined && (
                    <View style={styles.readabilityRow}>
                      <Text style={[styles.readabilityLabel, { color: colors.textSecondary }]}>
                        New Readability Score:
                      </Text>
                      <Text style={[
                        styles.readabilityScore,
                        { color: result.readabilityScore < 60 ? CultureTokens.coral : CultureTokens.teal }
                      ]}>
                        {result.readabilityScore}/100
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <M3Button
                      variant="outlined"
                      onPress={handleReject}
                      style={styles.actionButton}
                    >
                      Reject
                    </M3Button>
                    {!isEditing && (
                      <M3Button
                        variant="outlined"
                        onPress={handleEdit}
                        style={styles.actionButton}
                      >
                        Edit
                      </M3Button>
                    )}
                    <M3Button
                      variant="filled"
                      onPress={handleAccept}
                      style={styles.actionButton}
                    >
                      Accept
                    </M3Button>
                  </View>
                </View>
              )}
            </ScrollView>
          </M3Card>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modal: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  content: {
    maxHeight: 600,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textPreview: {
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
  },
  readabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  readabilityLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  readabilityScore: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  readabilityHint: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    fontStyle: 'italic',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s, border-color 0.2s',
      },
    }),
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  resultBox: {
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 2,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
  },
  editInput: {
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 2,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
