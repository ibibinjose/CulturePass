/**
 * LanguageSelector Component
 *
 * Provides multi-language profile support UI including:
 * - Language selector on wizard (default: English)
 * - Translation field duplication interface
 * - Language switcher on published profile
 * - RTL support for Arabic
 * - AI translation suggestions trigger
 * - Completeness indicators per language
 *
 * Requirements: 32
 *
 * Usage:
 * ```tsx
 * <LanguageSelector
 *   activeLanguage="eng"
 *   enabledLanguages={['eng', 'ara', 'hin']}
 *   primaryLanguage="eng"
 *   onLanguageChange={(code) => setActiveLanguage(code)}
 *   onAddLanguage={(code) => addLanguage(code)}
 *   onRemoveLanguage={(code) => removeLanguage(code)}
 *   getCompleteness={(code) => getCompleteness(code)}
 * />
 * ```
 */

import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/colors';
import {
  Spacing,
  Radius,
  Elevation,
  FontFamily,
  ButtonTokens,
} from '@/design-system/tokens/theme';
import {
  PROFILE_LANGUAGES,
  RTL_LANGUAGES,
  isRTLLanguage,
  type ProfileLanguageCode,
} from '../hooks/useMultiLanguage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LanguageSelectorProps {
  /** Currently active language being edited */
  activeLanguage: ProfileLanguageCode;
  /** All enabled languages for this profile */
  enabledLanguages: ProfileLanguageCode[];
  /** Primary (original) language */
  primaryLanguage: ProfileLanguageCode;
  /** Callback when user switches active language */
  onLanguageChange: (code: ProfileLanguageCode) => void;
  /** Callback when user adds a new language */
  onAddLanguage: (code: ProfileLanguageCode) => void;
  /** Callback when user removes a language */
  onRemoveLanguage: (code: ProfileLanguageCode) => void;
  /** Get completeness percentage for a language */
  getCompleteness: (code: ProfileLanguageCode) => number;
  /** Whether AI translation is in progress */
  isTranslating?: boolean;
  /** Callback to request AI translation for all fields */
  onRequestTranslation?: (targetLanguage: ProfileLanguageCode) => void;
  /** Variant: 'wizard' for in-form use, 'published' for profile view */
  variant?: 'wizard' | 'published';
}

export interface LanguageSwitcherProps {
  /** Currently displayed language */
  activeLanguage: ProfileLanguageCode;
  /** Available languages to switch between */
  availableLanguages: ProfileLanguageCode[];
  /** Callback when user switches language */
  onLanguageChange: (code: ProfileLanguageCode) => void;
}

// ---------------------------------------------------------------------------
// LanguageSelector (Wizard variant)
// ---------------------------------------------------------------------------

export const LanguageSelector = memo(function LanguageSelector({
  activeLanguage,
  enabledLanguages,
  primaryLanguage,
  onLanguageChange,
  onAddLanguage,
  onRemoveLanguage,
  getCompleteness,
  isTranslating = false,
  onRequestTranslation,
  variant = 'wizard',
}: LanguageSelectorProps) {
  const colors = useColors();
  const layout = useLayout();
  const [showAddModal, setShowAddModal] = useState(false);

  const availableToAdd = (Object.keys(PROFILE_LANGUAGES) as ProfileLanguageCode[]).filter(
    (code) => !enabledLanguages.includes(code)
  );

  const handleAddLanguage = useCallback((code: ProfileLanguageCode) => {
    onAddLanguage(code);
    setShowAddModal(false);
  }, [onAddLanguage]);

  // Published variant: simple dropdown-style switcher
  if (variant === 'published') {
    return (
      <LanguageSwitcher
        activeLanguage={activeLanguage}
        availableLanguages={enabledLanguages}
        onLanguageChange={onLanguageChange}
      />
    );
  }

  // Wizard variant: full language management UI
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      accessibilityRole="toolbar"
      accessibilityLabel="Language selector"
    >
      {/* Language tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {enabledLanguages.map((code) => {
          const lang = PROFILE_LANGUAGES[code];
          const isActive = code === activeLanguage;
          const isPrimary = code === primaryLanguage;
          const completeness = getCompleteness(code);
          const isRTL = isRTLLanguage(code);

          return (
            <Pressable
              key={code}
              style={[
                styles.languageTab,
                {
                  backgroundColor: isActive
                    ? CultureTokens.indigo + '15'
                    : 'transparent',
                  borderColor: isActive
                    ? CultureTokens.indigo
                    : colors.border,
                },
              ]}
              onPress={() => onLanguageChange(code)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${lang.name}${isPrimary ? ' (Primary)' : ''}, ${completeness}% complete`}
            >
              {/* Language name */}
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? CultureTokens.indigo : colors.text,
                      fontFamily: isActive ? FontFamily.bold : FontFamily.regular,
                    },
                  ]}
                >
                  {lang.name}
                </Text>

                {/* RTL indicator */}
                {isRTL && (
                  <View style={styles.rtlBadge}>
                    <Text style={styles.rtlBadgeText}>RTL</Text>
                  </View>
                )}

                {/* Primary badge */}
                {isPrimary && (
                  <View
                    style={[
                      styles.primaryBadge,
                      { backgroundColor: CultureTokens.teal + '20' },
                    ]}
                  >
                    <Text style={[styles.primaryBadgeText, { color: CultureTokens.teal }]}>
                      Primary
                    </Text>
                  </View>
                )}
              </View>

              {/* Completeness indicator */}
              {!isPrimary && (
                <View style={styles.completenessRow}>
                  <View
                    style={[
                      styles.completenessBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.completenessBarFill,
                        {
                          width: `${completeness}%`,
                          backgroundColor:
                            completeness === 100
                              ? CultureTokens.teal
                              : CultureTokens.indigo,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.completenessText, { color: colors.textSecondary }]}
                  >
                    {completeness}%
                  </Text>
                </View>
              )}

              {/* Remove button (non-primary only) */}
              {!isPrimary && isActive && (
                <Pressable
                  style={styles.removeButton}
                  onPress={() => onRemoveLanguage(code)}
                  accessibilityLabel={`Remove ${lang.name}`}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color={CultureTokens.coral} />
                </Pressable>
              )}
            </Pressable>
          );
        })}

        {/* Add language button */}
        {availableToAdd.length > 0 && (
          <Pressable
            style={[
              styles.addButton,
              { borderColor: colors.border },
            ]}
            onPress={() => setShowAddModal(true)}
            accessibilityLabel="Add language"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color={CultureTokens.indigo} />
            <Text style={[styles.addButtonText, { color: CultureTokens.indigo }]}>
              Add Language
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* AI Translation button */}
      {activeLanguage !== primaryLanguage && onRequestTranslation && (
        <Pressable
          style={[
            styles.translateButton,
            {
              backgroundColor: CultureTokens.violet + '10',
              borderColor: CultureTokens.violet + '30',
              opacity: isTranslating ? 0.6 : 1,
            },
          ]}
          onPress={() => onRequestTranslation(activeLanguage)}
          disabled={isTranslating}
          accessibilityLabel={
            isTranslating
              ? 'Translating...'
              : `AI translate all fields to ${PROFILE_LANGUAGES[activeLanguage].name}`
          }
          accessibilityRole="button"
        >
          <Ionicons
            name={isTranslating ? 'hourglass-outline' : 'sparkles'}
            size={16}
            color={CultureTokens.violet}
          />
          <Text style={[styles.translateButtonText, { color: CultureTokens.violet }]}>
            {isTranslating ? 'Translating...' : 'AI Translate All'}
          </Text>
        </Pressable>
      )}

      {/* Add Language Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                maxWidth: layout.isDesktop ? 400 : '90%',
                ...Elevation[4],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Language
              </Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Add a language version to reach more audiences. Text fields will be
              duplicated for translation.
            </Text>

            <ScrollView style={styles.languageList}>
              {availableToAdd.map((code) => {
                const lang = PROFILE_LANGUAGES[code];
                const isRTL = isRTLLanguage(code);

                return (
                  <Pressable
                    key={code}
                    style={[
                      styles.languageOption,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleAddLanguage(code)}
                    accessibilityLabel={`Add ${lang.name}${isRTL ? ' (right-to-left)' : ''}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.languageOptionContent}>
                      <Text style={[styles.languageOptionName, { color: colors.text }]}>
                        {lang.name}
                      </Text>
                      {lang.nativeName && lang.nativeName !== lang.name && (
                        <Text
                          style={[
                            styles.languageOptionNative,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {lang.nativeName}
                        </Text>
                      )}
                    </View>

                    <View style={styles.languageOptionMeta}>
                      {isRTL && (
                        <View style={styles.rtlBadge}>
                          <Text style={styles.rtlBadgeText}>RTL</Text>
                        </View>
                      )}
                      <Ionicons
                        name="add-circle-outline"
                        size={22}
                        color={CultureTokens.indigo}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

// ---------------------------------------------------------------------------
// LanguageSwitcher (Published profile variant)
// ---------------------------------------------------------------------------

export const LanguageSwitcher = memo(function LanguageSwitcher({
  activeLanguage,
  availableLanguages,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);

  if (availableLanguages.length <= 1) return null;

  const activeLang = PROFILE_LANGUAGES[activeLanguage];

  return (
    <View style={styles.switcherContainer}>
      <Pressable
        style={[
          styles.switcherButton,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        accessibilityRole="button"
        accessibilityLabel={`Language: ${activeLang.name}. Tap to change.`}
        accessibilityState={{ expanded: isOpen }}
      >
        <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.switcherButtonText, { color: colors.text }]}>
          {activeLang.name}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textSecondary}
        />
      </Pressable>

      {isOpen && (
        <View
          style={[
            styles.switcherDropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...Elevation[3],
            },
          ]}
        >
          {availableLanguages.map((code) => {
            const lang = PROFILE_LANGUAGES[code];
            const isActive = code === activeLanguage;

            return (
              <Pressable
                key={code}
                style={[
                  styles.switcherOption,
                  {
                    backgroundColor: isActive
                      ? CultureTokens.indigo + '10'
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  onLanguageChange(code);
                  setIsOpen(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={lang.name}
              >
                <Text
                  style={[
                    styles.switcherOptionText,
                    {
                      color: isActive ? CultureTokens.indigo : colors.text,
                      fontFamily: isActive ? FontFamily.bold : FontFamily.regular,
                    },
                  ]}
                >
                  {lang.name}
                </Text>
                {lang.nativeName && lang.nativeName !== lang.name && (
                  <Text
                    style={[
                      styles.switcherOptionNative,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {lang.nativeName}
                  </Text>
                )}
                {isActive && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={CultureTokens.indigo}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
});

// ---------------------------------------------------------------------------
// TranslationFieldIndicator (shows translation status on individual fields)
// ---------------------------------------------------------------------------

export interface TranslationFieldIndicatorProps {
  /** Translation status of the field */
  status: 'untranslated' | 'draft' | 'ai-suggested' | 'verified';
  /** Whether the field is in an RTL language */
  isRTL?: boolean;
  /** Callback to request AI translation for this field */
  onRequestTranslation?: () => void;
  /** Whether translation is in progress */
  isTranslating?: boolean;
}

export const TranslationFieldIndicator = memo(function TranslationFieldIndicator({
  status,
  isRTL = false,
  onRequestTranslation,
  isTranslating = false,
}: TranslationFieldIndicatorProps) {
  const colors = useColors();

  const statusConfig = {
    untranslated: {
      icon: 'alert-circle-outline' as const,
      color: CultureTokens.coral,
      label: 'Not translated',
    },
    draft: {
      icon: 'create-outline' as const,
      color: CultureTokens.indigo,
      label: 'Draft translation',
    },
    'ai-suggested': {
      icon: 'sparkles-outline' as const,
      color: CultureTokens.violet,
      label: 'AI suggested',
    },
    verified: {
      icon: 'checkmark-circle' as const,
      color: CultureTokens.teal,
      label: 'Verified',
    },
  };

  const config = statusConfig[status];

  return (
    <View
      style={[
        styles.fieldIndicator,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
      accessibilityLabel={config.label}
    >
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.fieldIndicatorText, { color: config.color }]}>
        {config.label}
      </Text>

      {status === 'untranslated' && onRequestTranslation && (
        <Pressable
          style={[
            styles.fieldTranslateButton,
            { borderColor: CultureTokens.violet + '40' },
          ]}
          onPress={onRequestTranslation}
          disabled={isTranslating}
          accessibilityLabel="AI translate this field"
          accessibilityRole="button"
          hitSlop={4}
        >
          <Ionicons
            name={isTranslating ? 'hourglass-outline' : 'sparkles'}
            size={12}
            color={CultureTokens.violet}
          />
          <Text style={[styles.fieldTranslateText, { color: CultureTokens.violet }]}>
            {isTranslating ? '...' : 'Translate'}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // LanguageSelector (Wizard)
  container: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  languageTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 100,
    position: 'relative',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: 13,
  },
  rtlBadge: {
    backgroundColor: CultureTokens.coral + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  rtlBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: CultureTokens.coral,
    textTransform: 'uppercase',
  },
  primaryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
  },
  completenessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completenessBar: {
    flex: 1,
    height: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  completenessBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  completenessText: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  translateButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  languageOptionContent: {
    flex: 1,
  },
  languageOptionName: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  languageOptionNative: {
    fontSize: 13,
    marginTop: 2,
  },
  languageOptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // LanguageSwitcher (Published)
  switcherContainer: {
    position: 'relative',
    zIndex: 100,
  },
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  switcherButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  switcherDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 180,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      // @ts-ignore - web-only shadow
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }),
  },
  switcherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  switcherOptionText: {
    fontSize: 14,
    flex: 1,
  },
  switcherOptionNative: {
    fontSize: 12,
  },

  // TranslationFieldIndicator
  fieldIndicator: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fieldIndicatorText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  fieldTranslateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginLeft: 4,
  },
  fieldTranslateText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
  },
});
