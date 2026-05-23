import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/design-system/ui/Input';
import { Button } from '@/design-system/ui';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { VALIDATION_TIMING } from '@/modules/host/schemas/validationRules';
import { api } from '@/lib/api';

export interface EmailFieldProps {
  /** Current email value */
  value: string;
  /** Callback when email changes */
  onChange: (value: string) => void;
  /** Callback when verification status changes */
  onVerificationStatusChange?: (verified: boolean) => void;
  /** Callback when validation completes */
  onValidationComplete?: (isValid: boolean) => void;
  /** Label text */
  label?: string;
  /** Hint text */
  hint?: string;
  /** External error message */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to show domain verification option for business emails */
  supportDomainVerification?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Initial verified state (e.g., when editing existing profile) */
  initialVerified?: boolean;
}

/**
 * RFC 5322 simplified email validation regex.
 * Validates local-part@domain format with proper character sets.
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * EmailField component for host profile creation
 *
 * Features:
 * - RFC 5322 email format validation
 * - Real-time validation with 300ms debounce
 * - Email verification flow with confirmation link
 * - Optional domain verification for business emails
 * - Verified badge indicator
 * - Green checkmark for valid, red X for invalid
 * - WCAG 2.1 Level AA accessible
 * - Mobile-responsive (320px+) with 44×44pt touch targets
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 4.1, 4.2, 4.3, 4.4
 */
export function EmailField({
  value,
  onChange,
  onVerificationStatusChange,
  onValidationComplete,
  label = 'Public Email',
  hint = 'This email will be visible on your profile',
  error: externalError,
  required = true,
  supportDomainVerification = false,
  disabled = false,
  initialVerified = false,
}: EmailFieldProps) {
  const colors = useColors();
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external error
  useEffect(() => {
    if (externalError) {
      setValidationError(externalError);
    }
  }, [externalError]);

  // Debounced validation
  useEffect(() => {
    if (!value) {
      setIsValid(false);
      setHasValidated(false);
      setValidationError(null);
      setIsValidating(false);
      return;
    }

    // Show validating state immediately
    setIsValidating(true);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const valid = EMAIL_REGEX.test(value);
      setIsValid(valid);
      setHasValidated(true);
      setIsValidating(false);

      if (!valid) {
        setValidationError('Please enter a valid email address');
      } else {
        setValidationError(null);
      }

      onValidationComplete?.(valid);
    }, VALIDATION_TIMING.fieldDebounce);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, onValidationComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSendVerification = useCallback(async () => {
    if (!isValid || isVerified || isSending) return;

    try {
      setIsSending(true);
      // Call API to send verification email
      await api.profiles.update('current', {
        publicEmail: value,
      } as any);
      setVerificationSent(true);
    } catch (err) {
      if (__DEV__) console.error('Failed to send verification email:', err);
      setValidationError('Failed to send verification email. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [isValid, isVerified, isSending, value]);

  const handleRequestDomainVerification = useCallback(async () => {
    if (!supportDomainVerification || !isValid) return;

    try {
      if (__DEV__) console.log('Domain verification requested for:', value);
      // Domain verification is initiated server-side when the profile is published
    } catch (err) {
      if (__DEV__) console.error('Failed to request domain verification:', err);
    }
  }, [supportDomainVerification, isValid, value]);

  // Notify parent of verification status changes
  useEffect(() => {
    onVerificationStatusChange?.(isVerified);
  }, [isVerified, onVerificationStatusChange]);

  const displayError = externalError || validationError;
  const displayHint = !displayError && !isVerified ? hint : undefined;

  /**
   * Determine right icon based on validation state
   */
  const getRightIcon = () => {
    if (isValidating && value) {
      return (
        <ActivityIndicator
          size="small"
          color={CultureTokens.indigo}
        />
      );
    }

    if (isVerified) {
      return (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={CultureTokens.teal}
        />
      );
    }

    if (hasValidated && value) {
      if (isValid) {
        return (
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={CultureTokens.teal}
          />
        );
      }
      if (displayError) {
        return (
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.error}
          />
        );
      }
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Input
          label={required ? `${label} *` : label}
          value={value}
          onChangeText={onChange}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          error={displayError ?? undefined}
          hint={displayHint}
          leftIcon="mail-outline"
          editable={!disabled}
          accessibilityLabel={label}
          accessibilityHint="Enter a valid email address for your public profile"
        />

        {/* Right icon overlay */}
        <View style={styles.rightIconContainer}>
          {getRightIcon()}
        </View>
      </View>

      {isValid && !isValidating && hasValidated && (
        <View style={styles.statusContainer}>
          {isVerified ? (
            <View
              style={[styles.badge, { backgroundColor: CultureTokens.teal + '20' }]}
              accessibilityLabel="Email verified"
              accessibilityRole="text"
            >
              <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
              <Text style={[styles.badgeText, { color: CultureTokens.teal }]}>Verified</Text>
            </View>
          ) : verificationSent ? (
            <View
              style={[styles.badge, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Verification email sent. Check your inbox."
              accessibilityRole="text"
            >
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                Verification email sent — check your inbox
              </Text>
            </View>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon="mail-outline"
              onPress={handleSendVerification}
              loading={isSending}
              disabled={isSending}
              accessibilityLabel="Send verification email"
              accessibilityHint="Sends a verification link to the email address you entered"
            >
              Send Verification Email
            </Button>
          )}

          {supportDomainVerification && !isVerified && (
            <Button
              variant="outline"
              size="sm"
              leftIcon="shield-checkmark-outline"
              onPress={handleRequestDomainVerification}
              accessibilityLabel="Verify domain ownership"
              accessibilityHint="Initiates domain verification for your business email"
            >
              Verify Domain
            </Button>
          )}
        </View>
      )}
    </View>
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
    top: 28,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    minHeight: 44,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
});

export default EmailField;
