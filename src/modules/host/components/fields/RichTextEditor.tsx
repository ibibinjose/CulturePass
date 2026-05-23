/**
 * RichTextEditor Component
 * 
 * Rich text editing component with formatting toolbar and AI assistance.
 * Supports: bold, italic, bullet lists, numbered lists, headings.
 * Displays character/word count and readability score.
 * 
 * Requirements: 5, 11
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { M3Card } from '@/design-system/ui/M3Card';
import { CultureTokens, Radius, FontFamily, InputTokens } from '@/design-system/tokens/theme';
import { AIAssistButton } from './AIAssistButton';
import { AIAssistModal } from './AIAssistModal';
import { useAIAssist, type FieldType } from '../../hooks/useAIAssist';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showAIAssist?: boolean;
  showReadabilityScore?: boolean;
  fieldType?: FieldType;
  label?: string;
  hint?: string;
  error?: string;
  minHeight?: number;
}

type FormatType = 'bold' | 'italic' | 'h2' | 'h3' | 'bullet' | 'numbered';

interface FormatButton {
  type: FormatType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { type: 'bold', icon: 'text', label: 'Bold' },
  { type: 'italic', icon: 'text', label: 'Italic' },
  { type: 'h2', icon: 'text', label: 'Heading 2' },
  { type: 'h3', icon: 'text', label: 'Heading 3' },
  { type: 'bullet', icon: 'list', label: 'Bullet List' },
  { type: 'numbered', icon: 'list', label: 'Numbered List' },
];

/**
 * Rich Text Editor
 * 
 * A text editor with formatting toolbar and AI assistance.
 * Note: This is a simplified implementation. For production, consider using
 * a library like react-native-pell-rich-editor or draft-js (web).
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  maxLength,
  showAIAssist = true,
  showReadabilityScore = false,
  fieldType = 'description',
  label,
  hint,
  error,
  minHeight = 200,
}: RichTextEditorProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const { calculateReadability } = useAIAssist();

  // Calculate stats
  const stats = useMemo(() => {
    const charCount = value.length;
    const wordCount = value.trim().length > 0 
      ? value.trim().split(/\s+/).length 
      : 0;
    const readabilityScore = showReadabilityScore 
      ? calculateReadability(value)
      : undefined;

    return { charCount, wordCount, readabilityScore };
  }, [value, showReadabilityScore, calculateReadability]);

  const handleFormat = useCallback((format: FormatType) => {
    // This is a simplified implementation
    // In production, you'd want proper cursor position handling
    // and actual rich text formatting (HTML or Markdown)
    
    let formattedText = value;
    const selection = value; // Simplified: format entire text
    
    switch (format) {
      case 'bold':
        formattedText = `**${selection}**`;
        break;
      case 'italic':
        formattedText = `*${selection}*`;
        break;
      case 'h2':
        formattedText = `## ${selection}`;
        break;
      case 'h3':
        formattedText = `### ${selection}`;
        break;
      case 'bullet':
        formattedText = `• ${selection}`;
        break;
      case 'numbered':
        formattedText = `1. ${selection}`;
        break;
    }
    
    onChange(formattedText);
  }, [value, onChange]);

  const handleAIApply = useCallback((newText: string) => {
    onChange(newText);
    setShowAIModal(false);
  }, [onChange]);

  const borderColor = error
    ? colors.error
    : isFocused
      ? CultureTokens.indigo
      : colors.borderLight;
  const borderWidth = isFocused || error ? 2 : 1.5;

  const isOverLimit = maxLength ? stats.charCount > maxLength : false;

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>
            {label}
          </Text>
          {showAIAssist && (
            <AIAssistButton 
              onPress={() => setShowAIModal(true)}
              disabled={!value || value.trim().length === 0}
              size="small"
            />
          )}
        </View>
      )}

      {/* Editor Card */}
      <M3Card
        style={[
          styles.editorCard,
          {
            borderColor,
            borderWidth,
            backgroundColor: isFocused ? colors.surfaceElevated : colors.card,
          },
        ]}
      >
        {/* Toolbar */}
        <View style={[styles.toolbar, { borderBottomColor: colors.borderLight }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarContent}
          >
            {FORMAT_BUTTONS.map((button) => (
              <Pressable
                key={button.type}
                onPress={() => handleFormat(button.type)}
                style={[styles.toolbarButton, { backgroundColor: colors.surface }]}
                accessibilityLabel={button.label}
                accessibilityRole="button"
              >
                <Ionicons 
                  name={button.icon} 
                  size={18} 
                  color={colors.textSecondary} 
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={maxLength}
          accessibilityLabel={label || 'Rich text editor'}
          accessibilityHint="Enter formatted text content"
          style={[
            styles.input,
            {
              minHeight,
              color: colors.text,
              fontFamily: FontFamily.regular,
            },
            ...(Platform.OS === 'web'
              ? [
                  {
                    backgroundColor: 'transparent',
                    outlineStyle: 'none',
                    WebkitTextFillColor: colors.text,
                    caretColor: CultureTokens.indigo,
                  } as any,
                ]
              : []),
          ]}
          selectionColor={CultureTokens.indigo}
          textAlignVertical="top"
        />

        {/* Stats Bar */}
        <View style={[styles.statsBar, { borderTopColor: colors.borderLight }]}>
          <View style={styles.statsLeft}>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {stats.wordCount} {stats.wordCount === 1 ? 'word' : 'words'}
            </Text>
            <Text style={[styles.statDivider, { color: colors.borderLight }]}>•</Text>
            <Text style={[
              styles.statText, 
              { color: isOverLimit ? colors.error : colors.textSecondary }
            ]}>
              {stats.charCount}{maxLength ? `/${maxLength}` : ''} characters
            </Text>
          </View>

          {stats.readabilityScore !== undefined && (
            <View style={styles.statsRight}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Readability:
              </Text>
              <Text style={[
                styles.readabilityScore,
                { 
                  color: stats.readabilityScore < 60 
                    ? CultureTokens.coral 
                    : CultureTokens.teal 
                }
              ]}>
                {stats.readabilityScore}/100
              </Text>
              {stats.readabilityScore < 60 && (
                <Pressable 
                  onPress={() => setShowAIModal(true)}
                  style={styles.suggestButton}
                  accessibilityRole="button"
                  accessibilityLabel="Simplify text with AI. Readability score is below 60."
                >
                  <Text style={[styles.suggestText, { color: CultureTokens.violet }]}>
                    Simplify
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </M3Card>

      {/* Hint or Error */}
      {error ? (
        <Text style={[styles.hint, { color: colors.error, fontFamily: FontFamily.semibold }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {hint}
        </Text>
      ) : null}

      {/* AI Assist Modal */}
      {showAIAssist && (
        <AIAssistModal
          visible={showAIModal}
          onClose={() => setShowAIModal(false)}
          currentText={value}
          onApply={handleAIApply}
          fieldType={fieldType}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  editorCard: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s, background-color 0.2s',
      },
    }),
  },
  toolbar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toolbarContent: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      },
    }),
  },
  input: {
    padding: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  statDivider: {
    fontSize: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  readabilityScore: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  suggestButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  suggestText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  hint: {
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
  },
});
