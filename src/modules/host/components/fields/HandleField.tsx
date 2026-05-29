/**
 * HandleField Component
 * 
 * Handle input field with real-time uniqueness validation for the HostSpace
 * Enterprise-Grade Form System. Provides immediate feedback on handle availability
 * and format validation.
 * 
 * Features:
 * - Real-time format validation (lowercase, alphanumeric, hyphens)
 * - Uniqueness check with 300ms debounce
 * - Auto-suggestion based on official name
 * - Platform keyword reservation (admin, support, help, etc.)
 * - Visual availability indicators (checkmark for available, X for taken)
 * - Character count display
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 * 
 * @example
 * ```tsx
 * <HandleField
 *   value={handle}
 *   onChange={setHandle}
 *   suggestedHandle="my-community"
 *   error={formErrors.handle}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useFieldValidation } from '@/modules/host/hooks/useFieldValidation';
import { handleSchema } from '@/modules/host/schemas/profileSchema';
import { CultureTokens, Radius, FontFamily } from '@/design-system/tokens/theme';
import { api } from '@/lib/api';

export interface HandleFieldProps {
  /**
   * Current handle value
   */
  value: string;
  
  /**
   * Callback when handle changes
   */
  onChange: (value: string) => void;
  
  /**
   * Suggested handle based on official name (optional)
   */
  suggestedHandle?: string;
  
  /**
   * External error message (e.g., from form validation)
   */
  error?: string;
  
  /**
   * Label text (default: "Handle")
   */
  label?: string;
  
  /**
   * Hint text (default: "Your unique URL identifier")
   */
  hint?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Callback when validation completes
   */
  onValidationComplete?: (isValid: boolean) => void;
}

/**
 * Reserved platform keywords that cannot be used as handles
 */
const RESERVED_KEYWORDS = [
  'admin',
  'support',
  'help',
  'api',
  'app',
  'about',
  'contact',
  'terms',
  'privacy',
  'settings',
  'profile',
  'user',
  'users',
  'event',
  'events',
  'community',
  'communities',
  'venue',
  'venues',
  'business',
  'artist',
  'professional',
  'hostspace',
  'discover',
  'calendar',
  'search',
  'login',
  'signup',
  'logout',
  'auth',
  'account',
  'dashboard',
  'analytics',
  'reports',
  'billing',
  'payments',
  'tickets',
  'checkout',
  'cart',
  'wallet',
  'perks',
  'offers',
  'membership',
  'notifications',
  'messages',
  'inbox',
  'feed',
  'activity',
  'network',
  'followers',
  'following',
  'explore',
  'trending',
  'featured',
  'popular',
  'new',
  'latest',
  'upcoming',
  'past',
  'live',
  'online',
  'offline',
  'public',
  'private',
  'draft',
  'published',
  'pending',
  'approved',
  'rejected',
  'suspended',
  'banned',
  'deleted',
  'archived',
  'test',
  'demo',
  'example',
  'sample',
  'culturepass',
  'culture-pass',
];

/**
 * Format handle input (lowercase, alphanumeric, hyphens only)
 */
function formatHandle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/--+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if handle is a reserved keyword
 */
function isReservedKeyword(handle: string): boolean {
  return RESERVED_KEYWORDS.includes(handle.toLowerCase());
}

export function HandleField({
  value,
  onChange,
  suggestedHandle,
  error: externalError,
  label = 'Handle',
  hint = 'Your unique URL identifier (e.g., @yourhandle)',
  required = true,
  disabled = false,
  onValidationComplete,
}: HandleFieldProps) {
  const colors = useColors();
  const [showSuggestion, setShowSuggestion] = useState(false);

  /**
   * Async validator for handle uniqueness
   */
  const asyncValidator = async (handle: string) => {
    // Check reserved keywords first
    if (isReservedKeyword(handle)) {
      throw new Error('This handle is reserved and cannot be used');
    }

    // Check uniqueness via API
    try {
      const response = await api.profiles.handleAvailable(handle);
      if (!response.available) {
        throw new Error(response.reason || 'Handle is already taken');
      }
    } catch (err: any) {
      // If API call fails, throw a generic error
      if (err.message && err.message.includes('already taken')) {
        throw err;
      }
      throw new Error('Unable to verify handle availability. Please try again.');
    }
  };

  /**
   * Field validation hook
   */
  const {
    error: validationError,
    isValidating,
    isValid,
    hasValidated,
    validate,
    setError,
  } = useFieldValidation({
    schema: handleSchema,
    asyncValidator,
    debounceMs: 300,
  });

  /**
   * Handle input change
   */
  const handleChange = (text: string) => {
    const formatted = formatHandle(text);
    onChange(formatted);
    
    // Only validate if there's a value
    if (formatted) {
      validate(formatted);
    } else {
      setError(null);
    }
  };

  /**
   * Apply suggested handle
   */
  const applySuggestion = () => {
    if (suggestedHandle) {
      onChange(suggestedHandle);
      validate(suggestedHandle);
      setShowSuggestion(false);
    }
  };

  /**
   * Show suggestion when suggested handle changes and field is empty
   */
  useEffect(() => {
    if (suggestedHandle && !value) {
      setShowSuggestion(true);
    }
  }, [suggestedHandle, value]);

  /**
   * Notify parent of validation state changes
   */
  useEffect(() => {
    if (hasValidated && onValidationComplete) {
      onValidationComplete(isValid);
    }
  }, [isValid, hasValidated, onValidationComplete]);

  /**
   * Determine which error to display (external or validation)
   */
  const displayError = externalError || validationError || undefined;

  /**
   * Determine right icon based on validation state
   */
  const getRightIcon = () => {
    if (isValidating) {
      return (
        <ActivityIndicator
          size="small"
          color={CultureTokens.indigo}
          style={styles.indicator}
        />
      );
    }

    if (hasValidated && value) {
      if (isValid) {
        return (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={CultureTokens.teal}
            style={styles.icon}
          />
        );
      } else if (displayError) {
        return (
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.error}
            style={styles.icon}
          />
        );
      }
    }

    return null;
  };

  /**
   * Character count color
   */
  const getCharCountColor = () => {
    if (value.length < 3) return colors.textTertiary;
    if (value.length > 30) return colors.error;
    return colors.textSecondary;
  };

  return (
    <View style={styles.container}><View style={styles.inputWrapper}><Input
          label={required ? `${label} *` : label}
          value={value}
          onChangeText={handleChange}
          placeholder="my-handle"
          leftIcon="at-outline"
          error={displayError}
          hint={displayError ? undefined : hint}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          editable={!disabled}
          maxLength={30}
          accessibilityLabel={label}
          accessibilityHint="Enter a unique handle for your profile"
        /><View style={styles.rightIconContainer}>{getRightIcon()}</View></View><View style={styles.footer}><Text style={[styles.charCount, { color: getCharCountColor() }]}>{value.length}/30 characters</Text></View>{showSuggestion && suggestedHandle && !value && (
        <Pressable
          onPress={applySuggestion}
          style={[styles.suggestion, { backgroundColor: colors.surfaceElevated }]}
          accessibilityRole="button"
          accessibilityLabel={`Use suggested handle: ${suggestedHandle}`}
        ><Ionicons
            name="bulb-outline"
            size={16}
            color={CultureTokens.indigo}
            style={styles.suggestionIcon}
          /><Text style={[styles.suggestionText, { color: colors.text }]}>Suggested: <Text style={styles.suggestionHandle}>@{suggestedHandle}</Text></Text><Ionicons
            name="arrow-forward"
            size={16}
            color={colors.textSecondary}
          /></Pressable>
      )}{hasValidated && value && !displayError && isValid && (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceElevated }]}><Ionicons
            name="checkmark-circle"
            size={16}
            color={CultureTokens.teal}
            style={styles.statusIcon}
          /><Text style={[styles.statusText, { color: CultureTokens.teal }]}>@{value} is available</Text></View>
      )}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  rightIconContainer: {
    position: 'absolute',
    right: 14,
    top: 38, // Adjust based on label height
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    // Icon styles
  },
  indicator: {
    // Indicator styles
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  suggestionIcon: {
    marginRight: 4,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  suggestionHandle: {
    fontFamily: FontFamily.semibold,
    color: CultureTokens.indigo,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.sm,
    gap: 6,
  },
  statusIcon: {
    // Status icon styles
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});

export default HandleField;
