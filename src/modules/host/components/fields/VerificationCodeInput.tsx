import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/design-system/ui';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';

export interface VerificationCodeInputProps {
  /** Number of digits in the code */
  length?: number;
  /** Current code value */
  value: string;
  /** Called when code changes */
  onChange: (code: string) => void;
  /** Called when all digits are entered */
  onComplete?: (code: string) => void;
  /** Called when user requests code resend */
  onResend?: () => void;
  /** Error message to display */
  error?: string;
  /** Whether the code is being verified */
  loading?: boolean;
  /** Whether verification succeeded */
  verified?: boolean;
  /** Label text above the input */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Whether to auto-focus the first input on mount */
  autoFocus?: boolean;
  /** Cooldown in seconds before resend is available */
  resendCooldown?: number;
  /** Whether the resend button is visible */
  showResend?: boolean;
}

/**
 * VerificationCodeInput — OTP-style 6-digit code input
 *
 * Features:
 * - Individual digit cells with auto-advance on input
 * - Backspace navigates to previous cell
 * - Paste support for full code
 * - Auto-submit when all digits entered
 * - Resend cooldown timer
 * - Verified/error state display
 * - WCAG 2.1 Level AA accessible
 * - Mobile-responsive (320px+)
 *
 * Requirements: 9.6, 9.7 (SMS verification code flow)
 */
export function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  error,
  loading = false,
  verified = false,
  label = 'Verification Code',
  description,
  autoFocus = true,
  resendCooldown = 60,
  showResend = true,
}: VerificationCodeInputProps) {
  const colors = useColors();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
  const [cooldownRemaining, setCooldownRemaining] = useState(resendCooldown);
  const [cooldownActive, setCooldownActive] = useState(true);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (!cooldownActive || cooldownRemaining <= 0) {
      setCooldownActive(false);
      return;
    }

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          setCooldownActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownActive, cooldownRemaining]);

  // Split value into individual digits for display
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
      setFocusedIndex(index);
    }
  }, [length]);

  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      // Handle paste of full code
      const cleaned = text.replace(/\D/g, '');
      if (cleaned.length > 1) {
        const newCode = cleaned.slice(0, length);
        onChange(newCode);
        if (newCode.length === length) {
          onComplete?.(newCode);
          // Blur all inputs
          inputRefs.current[length - 1]?.blur();
        } else {
          focusInput(newCode.length);
        }
        return;
      }

      // Single digit input
      if (cleaned.length === 1) {
        const newDigits = [...digits];
        newDigits[index] = cleaned;
        const newCode = newDigits.join('').replace(/\s/g, '');
        onChange(newCode);

        if (index < length - 1) {
          focusInput(index + 1);
        } else if (newCode.length === length) {
          onComplete?.(newCode);
          inputRefs.current[index]?.blur();
        }
      }
    },
    [digits, length, onChange, onComplete, focusInput]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace') {
        if (digits[index]) {
          // Clear current digit
          const newDigits = [...digits];
          newDigits[index] = '';
          onChange(newDigits.join('').trimEnd());
        } else if (index > 0) {
          // Move to previous and clear it
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          onChange(newDigits.join('').trimEnd());
          focusInput(index - 1);
        }
      }
    },
    [digits, onChange, focusInput]
  );

  const handleResend = useCallback(() => {
    if (cooldownActive) return;
    setCooldownRemaining(resendCooldown);
    setCooldownActive(true);
    onChange('');
    focusInput(0);
    onResend?.();
  }, [cooldownActive, resendCooldown, onChange, focusInput, onResend]);

  const getCellBorderColor = (index: number): string => {
    if (error) return colors.error;
    if (verified) return CultureTokens.teal;
    if (focusedIndex === index) return CultureTokens.indigo;
    if (digits[index]) return CultureTokens.indigo + '60';
    return colors.borderLight;
  };

  const getCellBackgroundColor = (index: number): string => {
    if (verified) return CultureTokens.teal + '10';
    if (focusedIndex === index) return colors.surfaceElevated;
    return colors.card;
  };

  return (
    <View style={styles.container} accessibilityLabel={label}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}

      {/* Digit cells */}
      <View
        style={styles.cellsContainer}
        accessibilityRole="none"
        accessibilityLabel={`Enter ${length}-digit verification code`}
      >
        {digits.map((digit, index) => (
          <Pressable
            key={index}
            onPress={() => focusInput(index)}
            style={[
              styles.cell,
              {
                borderColor: getCellBorderColor(index),
                backgroundColor: getCellBackgroundColor(index),
                borderWidth: focusedIndex === index || error || verified ? 2 : 1.5,
              },
            ]}
            accessibilityLabel={`Digit ${index + 1} of ${length}${digit ? `, value ${digit}` : ', empty'}`}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={Platform.OS === 'web' ? 6 : 1}
              selectTextOnFocus
              autoFocus={autoFocus && index === 0}
              editable={!loading && !verified}
              style={[
                styles.cellInput,
                {
                  color: verified ? CultureTokens.teal : colors.text,
                },
                Platform.OS === 'web' && ({
                  outlineStyle: 'none',
                  caretColor: 'transparent',
                } as any),
              ]}
              accessibilityLabel={`Code digit ${index + 1}`}
              accessibilityHint={`Enter digit ${index + 1} of the verification code`}
            />
          </Pressable>
        ))}
      </View>

      {/* Status indicators */}
      {error && (
        <View style={styles.statusRow} accessibilityLabel={`Error: ${error}`}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {verified && (
        <View style={styles.statusRow} accessibilityLabel="Code verified successfully">
          <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
          <Text style={[styles.verifiedText, { color: CultureTokens.teal }]}>
            Verified successfully
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.statusRow} accessibilityLabel="Verifying code">
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Verifying...
          </Text>
        </View>
      )}

      {/* Resend button */}
      {showResend && !verified && (
        <View style={styles.resendContainer}>
          {cooldownActive ? (
            <Text
              style={[styles.cooldownText, { color: colors.textTertiary }]}
              accessibilityLabel={`Resend available in ${cooldownRemaining} seconds`}
            >
              Resend code in {cooldownRemaining}s
            </Text>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              leftIcon="refresh-outline"
              onPress={handleResend}
              accessibilityLabel="Resend verification code"
              accessibilityHint="Sends a new verification code"
            >
              Resend Code
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cell: {
    width: 44,
    height: 52,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s, background-color 0.2s',
      },
    }),
  },
  cellInput: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    width: '100%',
    height: '100%',
    padding: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  verifiedText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  cooldownText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
});

export default VerificationCodeInput;
