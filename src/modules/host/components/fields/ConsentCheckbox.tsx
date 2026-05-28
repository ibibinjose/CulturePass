/**
 * ConsentCheckbox Component
 *
 * Consent management checkbox for the HostSpace Enterprise-Grade Form System.
 * Supports required consent (e.g., terms of service, privacy policy) with
 * links to full text documents.
 *
 * Features:
 * - Required/optional consent modes
 * - Link to full consent text (opens in browser/modal)
 * - Error state for unchecked required consent
 * - Timestamp tracking for consent given/withdrawn
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant with proper ARIA labels
 * - Touch targets minimum 44×44pt
 *
 * Requirements: 24 (Privacy and Data Protection)
 *
 * @example
 * ```tsx
 * <ConsentCheckbox
 *   id="terms"
 *   checked={termsAccepted}
 *   onChange={(checked) => setTermsAccepted(checked)}
 *   label="I agree to the Terms of Service"
 *   linkText="Terms of Service"
 *   linkUrl="https://culturepass.co/legal/terms"
 *   required
 * />
 * ```
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  FontFamily,
} from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsentCheckboxProps {
  /**
   * Unique identifier for this consent item
   */
  id: string;

  /**
   * Whether the checkbox is checked
   */
  checked: boolean;

  /**
   * Callback when checkbox state changes
   */
  onChange: (checked: boolean) => void;

  /**
   * Main label text for the consent
   */
  label: string;

  /**
   * Text for the link within the label (e.g., "Terms of Service")
   */
  linkText?: string;

  /**
   * URL to the full consent document
   */
  linkUrl?: string;

  /**
   * Callback when link is pressed (alternative to linkUrl for in-app navigation)
   */
  onLinkPress?: () => void;

  /**
   * Whether this consent is required (shows error if unchecked on validation)
   */
  required?: boolean;

  /**
   * Error message to display (e.g., "You must accept the terms")
   */
  error?: string;

  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean;

  /**
   * Optional description text below the label
   */
  description?: string;

  /**
   * Callback with timestamp when consent is given or withdrawn
   */
  onConsentChange?: (consent: { id: string; given: boolean; timestamp: string }) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  linkText,
  linkUrl,
  onLinkPress,
  required = false,
  error,
  disabled = false,
  description,
  onConsentChange,
}: ConsentCheckboxProps) {
  const colors = useColors();

  const handleToggle = useCallback(() => {
    if (disabled) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const newValue = !checked;
    onChange(newValue);

    // Track consent timestamp
    if (onConsentChange) {
      onConsentChange({
        id,
        given: newValue,
        timestamp: new Date().toISOString(),
      });
    }

    // Announce to screen readers
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(
        newValue ? 'Consent given' : 'Consent withdrawn'
      );
    }
  }, [checked, disabled, id, onChange, onConsentChange]);

  const handleLinkPress = useCallback(() => {
    if (onLinkPress) {
      onLinkPress();
      return;
    }
    if (linkUrl) {
      Linking.openURL(linkUrl).catch(() => {
        // Silently fail if URL can't be opened
      });
    }
  }, [linkUrl, onLinkPress]);

  const boxColor = checked ? CultureTokens.indigo : 'transparent';
  const boxBorderColor = error
    ? colors.error
    : checked
      ? CultureTokens.indigo
      : colors.border;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleToggle}
        disabled={disabled}
        style={({ pressed }) => [
          styles.row,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={`${required ? 'Required: ' : ''}${label}${linkText ? `. Link to ${linkText}` : ''}`}
        accessibilityHint={
          checked
            ? 'Double tap to withdraw consent'
            : 'Double tap to give consent'
        }
      >
        {/* Checkbox box */}
        <View
          style={[
            styles.box,
            {
              backgroundColor: boxColor,
              borderColor: boxBorderColor,
            },
          ]}
        >
          {checked && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>

        {/* Label area */}
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: colors.text }]}>
            {renderLabelWithLink(label, linkText, linkUrl || '', handleLinkPress, colors)}
            {required && (
              <Text style={[styles.requiredAsterisk, { color: colors.error }]}>
                {' *'}
              </Text>
            )}
          </Text>

          {description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helper: Render label with embedded link
// ---------------------------------------------------------------------------

function renderLabelWithLink(
  label: string,
  linkText: string | undefined,
  linkUrl: string,
  onLinkPress: () => void,
  colors: ReturnType<typeof useColors>
): React.ReactNode {
  if (!linkText) {
    return label;
  }

  // Split label around the link text
  const linkIndex = label.indexOf(linkText);
  if (linkIndex === -1) {
    // Link text not found in label — append as separate link
    return (
      <>
        {label}{' '}
        <Text
          style={styles.link}
          onPress={onLinkPress}
          accessibilityRole="link"
          accessibilityLabel={`Open ${linkText}`}
        >
          {linkText}
        </Text>
      </>
    );
  }

  const before = label.slice(0, linkIndex);
  const after = label.slice(linkIndex + linkText.length);

  return (
    <>
      {before}
      <Text
        style={styles.link}
        onPress={onLinkPress}
        accessibilityRole="link"
        accessibilityLabel={`Open ${linkText}`}
      >
        {linkText}
      </Text>
      {after}
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    minHeight: 44, // Touch target
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  labelContainer: {
    marginLeft: 12,
    flex: 1,
    gap: 3,
  },
  labelText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  requiredAsterisk: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  description: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  link: {
    color: CultureTokens.indigo,
    fontFamily: FontFamily.semibold,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 34, // Align with label text (22px box + 12px margin)
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});

export default ConsentCheckbox;
