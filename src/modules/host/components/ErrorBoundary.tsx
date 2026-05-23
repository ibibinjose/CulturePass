/**
 * ErrorBoundary Component (Host Module)
 *
 * Error boundary specific to the host module wizard flow. Catches React
 * rendering errors, displays a user-friendly error state, and provides
 * retry/recovery options without losing form data.
 *
 * Features:
 * - Catches React rendering errors in the wizard flow
 * - Displays a friendly error state with retry button
 * - Logs errors (console.error in dev)
 * - Preserves form state when possible (doesn't lose user data)
 * - Provides "Go Back" and "Try Again" actions
 * - CulturePass design system compliance
 * - Mobile-responsive layout
 * - Accessible error messaging
 *
 * Usage:
 * ```tsx
 * <HostErrorBoundary
 *   onGoBack={() => router.back()}
 *   fallbackTitle="Something went wrong"
 * >
 *   <WizardContainer entityType="community" />
 * </HostErrorBoundary>
 * ```
 */

import React, { Component, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CultureTokens } from '@/design-system/tokens/colors';
import {
  Spacing,
  Radius,
  ButtonTokens,
  Elevation,
} from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HostErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Callback when user taps "Go Back" */
  onGoBack?: () => void;
  /** Custom fallback title */
  fallbackTitle?: string;
  /** Custom fallback message */
  fallbackMessage?: string;
  /** Optional callback when error is caught (for analytics/logging) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface HostErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class HostErrorBoundary extends Component<
  HostErrorBoundaryProps,
  HostErrorBoundaryState
> {
  constructor(props: HostErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<HostErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log in development
    if (__DEV__) {
      console.error('[HostErrorBoundary] Caught error:', error);
      console.error('[HostErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    // Notify parent if callback provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoBack = (): void => {
    this.props.onGoBack?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title={this.props.fallbackTitle}
          message={this.props.fallbackMessage}
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoBack={this.props.onGoBack ? this.handleGoBack : undefined}
        />
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Fallback UI (Functional Component for hooks)
// ---------------------------------------------------------------------------

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  error: Error | null;
  onRetry: () => void;
  onGoBack?: () => void;
}

function ErrorFallback({
  title = 'Something went wrong',
  message = "We hit an unexpected issue. Your progress has been saved — you can try again or go back.",
  error,
  onRetry,
  onGoBack,
}: ErrorFallbackProps) {
  // We use inline styles for colors since this is a class component boundary
  // and we can't guarantee useColors() context is available after an error.
  // Using CultureTokens directly for reliability.

  return (
    <View
      style={styles.fallbackContainer}
      {...(Platform.OS === 'web'
        ? { role: 'alert', 'aria-live': 'assertive' }
        : { accessibilityRole: 'alert', accessibilityLiveRegion: 'assertive' })}
    >
      <View style={styles.fallbackContent}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="warning-outline"
            size={48}
            color={CultureTokens.coral}
          />
        </View>

        {/* Title */}
        <Text
          style={styles.fallbackTitle}
          accessibilityRole="header"
        >
          {title}
        </Text>

        {/* Message */}
        <Text style={styles.fallbackMessage}>
          {message}
        </Text>

        {/* Error details in dev */}
        {__DEV__ && error && (
          <View style={styles.devErrorContainer}>
            <Text style={styles.devErrorLabel}>Dev Error:</Text>
            <Text style={styles.devErrorText} numberOfLines={4}>
              {error.message}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Try Again (Primary) */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onRetry}
            accessibilityLabel="Try again"
            accessibilityHint="Attempts to reload the form"
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>

          {/* Go Back (Secondary) */}
          {onGoBack && (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onGoBack}
              accessibilityLabel="Go back"
              accessibilityHint="Returns to the previous screen"
            >
              <Ionicons name="arrow-back" size={18} color={CultureTokens.indigo} />
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </Pressable>
          )}
        </View>

        {/* Reassurance */}
        <View style={styles.reassuranceRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={CultureTokens.teal}
          />
          <Text style={styles.reassuranceText}>
            Your data is safe — auto-save has preserved your progress.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#FFFBF7', // light background fallback
  },
  fallbackContent: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    ...Elevation[2],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${CultureTokens.coral}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  fallbackMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: '#44403C',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  devErrorContainer: {
    width: '100%',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: Spacing.lg,
  },
  devErrorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: CultureTokens.coral,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devErrorText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#7F1D1D',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: ButtonTokens.height.md,
    paddingHorizontal: ButtonTokens.paddingH.lg,
    borderRadius: Radius.md,
    backgroundColor: CultureTokens.indigo,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: ButtonTokens.height.md,
    paddingHorizontal: ButtonTokens.paddingH.lg,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: CultureTokens.indigo,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: CultureTokens.indigo,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: ButtonTokens.pressScale }],
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reassuranceText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#78716C',
    flex: 1,
  },
});
