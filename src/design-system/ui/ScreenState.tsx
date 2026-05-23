import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  FontSize,
  Radius,
  Spacing,
  ButtonTokens,
  FontFamily,
} from '@/design-system/tokens/theme';
import { Button } from './Button';
import { Skeleton } from './Skeleton';

// ---------------------------------------------------------------------------
// Original ScreenState (V1)
// ---------------------------------------------------------------------------

export interface ScreenStateProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenState({ children, style, ...rest }: ScreenStateProps) {
  return <View style={style} {...rest}>{children}</View>;
}

export interface ScreenStateCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'info' | 'error' | 'success';
  style?: StyleProp<ViewStyle>;
}

export function ScreenStateCard({
  icon = 'information-circle-outline',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'info',
  style,
}: ScreenStateCardProps) {
  const colors = useColors();
  const accentColor =
    tone === 'error' ? colors.error :
    tone === 'success' ? CultureTokens.emerald :
    CultureTokens.indigo;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.borderLight,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={accentColor} />
      {title ? (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      ) : null}
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.actionWrap}
        >
          <Text style={[styles.action, { color: accentColor }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ScreenState V2 — Enhanced component with variant-based states
// ---------------------------------------------------------------------------

/** Action button configuration for ScreenStateV2 */
interface ScreenStateAction {
  label: string;
  onPress: () => void;
}

export interface ScreenStateV2Props extends ScreenStateProps {
  /** The state variant to display */
  variant: 'loading' | 'empty' | 'error' | 'offline' | 'timeout';
  /** Optional illustration displayed above the title */
  illustration?: ImageSource;
  /** Title text displayed below the illustration */
  title?: string;
  /** Description text displayed below the title */
  description?: string;
  /** Primary action button (e.g., "Discover Events", "Retry") */
  primaryAction?: ScreenStateAction;
  /** Secondary action button (e.g., "Go Back") */
  secondaryAction?: ScreenStateAction;
  /** Cached content to display in offline mode */
  cachedContent?: React.ReactNode;
  /** Retry callback for error/offline states */
  onRetry?: () => void;
  /** Current retry count (unlimited manual retries per Req 12.6) */
  retryCount?: number;
  /** Timeout duration in ms before showing timeout message (default 3000) */
  timeoutMs?: number;
  /** Callback when timeout is reached */
  onTimeout?: () => void;
  /** Required role name for 403/role error display (Req 12.5) */
  requiredRole?: string;
  /** Back navigation handler for 403/role errors */
  onBack?: () => void;
}

/**
 * ScreenStateV2 — Consistent loading, empty, error, offline, and timeout states.
 *
 * Layout structure (Req 12.3):
 *   illustration (centered) → title → description → primary action button
 *
 * Behaviors:
 * - `loading`: Shimmer skeletons matching expected layout (Req 17.4)
 * - `empty`: Illustration + title + description + primary action (Req 12.2)
 * - `error`: Error message + retry action, unlimited retries (Req 12.6)
 * - `offline`: Cached content if available + offline indicator + retry (Req 12.1)
 * - `timeout`: After timeoutMs (default 3000), shows "Taking longer than usual" + cancel (Req 17.5)
 */
export function ScreenStateV2({
  variant,
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  cachedContent,
  onRetry,
  retryCount,
  timeoutMs = 3000,
  onTimeout,
  requiredRole,
  onBack,
  style,
  children,
}: ScreenStateV2Props) {
  const colors = useColors();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timeout logic for loading variant (Req 17.5)
  useEffect(() => {
    if (variant === 'loading' || variant === 'timeout') {
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        onTimeout?.();
      }, timeoutMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [variant, timeoutMs, onTimeout]);

  // Reset timeout state when variant changes
  useEffect(() => {
    if (variant !== 'loading' && variant !== 'timeout') {
      setHasTimedOut(false);
    }
  }, [variant]);

  const handleCancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onTimeout?.();
  }, [onTimeout]);

  // --- Loading variant ---
  if (variant === 'loading' && !hasTimedOut) {
    return (
      <View
        style={[v2Styles.container, { backgroundColor: colors.background }, style]}
        accessibilityLabel="Loading content"
        accessibilityRole="none"
      >
        <LoadingSkeletons />
        {children}
      </View>
    );
  }

  // --- Timeout variant (or loading that has timed out) ---
  if (variant === 'timeout' || (variant === 'loading' && hasTimedOut)) {
    return (
      <View
        style={[v2Styles.container, v2Styles.centered, { backgroundColor: colors.background }, style]}
        accessibilityLabel="Content is taking longer than usual"
        accessibilityRole="alert"
      >
        <Ionicons
          name="time-outline"
          size={48}
          color={colors.textTertiary}
          style={v2Styles.icon}
        />
        <Text style={[v2Styles.title, { color: colors.text }]}>
          Taking longer than usual
        </Text>
        <Text style={[v2Styles.description, { color: colors.textSecondary }]}>
          {description ?? 'The content is still loading. You can wait or go back.'}
        </Text>
        <Button
          variant="secondary"
          onPress={handleCancel}
          accessibilityLabel="Cancel loading and go back"
          style={v2Styles.primaryButton}
        >
          Cancel
        </Button>
        {children}
      </View>
    );
  }

  // --- Offline variant ---
  if (variant === 'offline') {
    return (
      <View
        style={[v2Styles.container, { backgroundColor: colors.background }, style]}
        accessibilityRole="none"
      >
        {/* Offline indicator banner */}
        <View
          style={[v2Styles.offlineBanner, { backgroundColor: colors.warning + '1A' }]}
          accessibilityLabel="You are offline"
          accessibilityRole="alert"
        >
          <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
          <Text style={[v2Styles.offlineBannerText, { color: colors.warning }]}>
            You&apos;re offline
          </Text>
        </View>

        {/* Show cached content if available (Req 12.1) */}
        {cachedContent ? (
          <View style={v2Styles.cachedContentContainer}>
            {cachedContent}
          </View>
        ) : (
          <View style={v2Styles.centered}>
            {illustration ? (
              <Image
                source={illustration}
                style={v2Styles.illustration}
                contentFit="contain"
                accessibilityLabel="Offline illustration"
              />
            ) : (
              <Ionicons
                name="cloud-offline-outline"
                size={64}
                color={colors.textTertiary}
                style={v2Styles.icon}
              />
            )}
            <Text style={[v2Styles.title, { color: colors.text }]}>
              {title ?? 'No connection'}
            </Text>
            <Text style={[v2Styles.description, { color: colors.textSecondary }]}>
              {description ?? 'Check your internet connection and try again.'}
            </Text>
          </View>
        )}

        {/* Retry action */}
        {onRetry ? (
          <Button
            variant="primary"
            onPress={onRetry}
            accessibilityLabel="Retry loading content"
            style={v2Styles.primaryButton}
            fullWidth
          >
            Retry
          </Button>
        ) : null}

        {children}
      </View>
    );
  }

  // --- Error variant ---
  if (variant === 'error') {
    // 403/role error display (Req 12.5)
    if (requiredRole) {
      return (
        <View
          style={[v2Styles.container, v2Styles.centered, { backgroundColor: colors.background }, style]}
          accessibilityRole="alert"
          accessibilityLabel={`Access denied. Required role: ${requiredRole}`}
        >
          {illustration ? (
            <Image
              source={illustration}
              style={v2Styles.illustration}
              contentFit="contain"
              accessibilityLabel="Access denied illustration"
            />
          ) : (
            <Ionicons
              name="lock-closed-outline"
              size={64}
              color={colors.textTertiary}
              style={v2Styles.icon}
            />
          )}
          <Text style={[v2Styles.title, { color: colors.text }]}>
            {title ?? 'Access Restricted'}
          </Text>
          <Text style={[v2Styles.description, { color: colors.textSecondary }]}>
            {description ?? `This content requires the "${requiredRole}" role.`}
          </Text>
          {onBack ? (
            <Button
              variant="secondary"
              onPress={onBack}
              accessibilityLabel="Go back to previous screen"
              style={v2Styles.primaryButton}
              leftIcon="arrow-back"
            >
              Go Back
            </Button>
          ) : null}
          {children}
        </View>
      );
    }

    // General error state (Req 12.6 — unlimited manual retries)
    return (
      <View
        style={[v2Styles.container, v2Styles.centered, { backgroundColor: colors.background }, style]}
        accessibilityRole="alert"
        accessibilityLabel="An error occurred"
      >
        {illustration ? (
          <Image
            source={illustration}
            style={v2Styles.illustration}
            contentFit="contain"
            accessibilityLabel="Error illustration"
          />
        ) : (
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
            style={v2Styles.icon}
          />
        )}
        <Text style={[v2Styles.title, { color: colors.text }]}>
          {title ?? 'Something went wrong'}
        </Text>
        <Text style={[v2Styles.description, { color: colors.textSecondary }]}>
          {description ?? 'An error occurred while loading this content.'}
        </Text>
        {retryCount !== undefined && retryCount > 0 ? (
          <Text style={[v2Styles.retryHint, { color: colors.textTertiary }]}>
            {`Retry attempt ${retryCount}`}
          </Text>
        ) : null}
        {(onRetry || primaryAction) ? (
          <Button
            variant="primary"
            onPress={onRetry ?? primaryAction?.onPress}
            accessibilityLabel={primaryAction?.label ?? 'Retry'}
            style={v2Styles.primaryButton}
            fullWidth
          >
            {primaryAction?.label ?? 'Retry'}
          </Button>
        ) : null}
        {secondaryAction ? (
          <Button
            variant="ghost"
            onPress={secondaryAction.onPress}
            accessibilityLabel={secondaryAction.label}
            style={v2Styles.secondaryButton}
          >
            {secondaryAction.label}
          </Button>
        ) : null}
        {children}
      </View>
    );
  }

  // --- Empty variant (Req 12.2) ---
  return (
    <View
      style={[v2Styles.container, v2Styles.centered, { backgroundColor: colors.background }, style]}
      accessibilityRole="none"
      accessibilityLabel={title ?? 'No content available'}
    >
      {illustration ? (
        <Image
          source={illustration}
          style={v2Styles.illustration}
          contentFit="contain"
          accessibilityLabel="Empty state illustration"
        />
      ) : (
        <Ionicons
          name="albums-outline"
          size={64}
          color={colors.textTertiary}
          style={v2Styles.icon}
        />
      )}
      {title ? (
        <Text style={[v2Styles.title, { color: colors.text }]}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={[v2Styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {primaryAction ? (
        <Button
          variant="primary"
          onPress={primaryAction.onPress}
          accessibilityLabel={primaryAction.label}
          style={v2Styles.primaryButton}
          fullWidth
        >
          {primaryAction.label}
        </Button>
      ) : null}
      {secondaryAction ? (
        <Button
          variant="ghost"
          onPress={secondaryAction.onPress}
          accessibilityLabel={secondaryAction.label}
          style={v2Styles.secondaryButton}
        >
          {secondaryAction.label}
        </Button>
      ) : null}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeletons — shimmer placeholders matching expected layout (Req 17.4)
// ---------------------------------------------------------------------------

function LoadingSkeletons() {
  return (
    <View style={v2Styles.skeletonContainer}>
      {/* Hero/illustration placeholder */}
      <Skeleton width="100%" height={160} borderRadius={Radius.md} />
      {/* Title placeholder */}
      <Skeleton width="60%" height={22} borderRadius={Radius.sm} style={v2Styles.skeletonTitle} />
      {/* Description lines */}
      <Skeleton width="90%" height={14} borderRadius={Radius.xs} style={v2Styles.skeletonLine} />
      <Skeleton width="75%" height={14} borderRadius={Radius.xs} style={v2Styles.skeletonLine} />
      {/* Action button placeholder */}
      <Skeleton
        width="50%"
        height={ButtonTokens.height.md}
        borderRadius={ButtonTokens.radius}
        style={v2Styles.skeletonButton}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.body2,
    textAlign: 'center',
  },
  actionWrap: {
    marginTop: 4,
  },
  action: {
    fontSize: FontSize.body2,
    fontFamily: 'Poppins_600SemiBold',
  },
});

const v2Styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: 180,
    height: 180,
    marginBottom: Spacing.lg,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.title2,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  retryHint: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  primaryButton: {
    marginTop: Spacing.sm,
  },
  secondaryButton: {
    marginTop: Spacing.xs,
  },
  // Offline
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  offlineBannerText: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.semibold,
  },
  cachedContentContainer: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  // Skeletons
  skeletonContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  skeletonTitle: {
    marginTop: Spacing.lg,
  },
  skeletonLine: {
    marginTop: Spacing.sm,
  },
  skeletonButton: {
    marginTop: Spacing.xl,
  },
});

export default ScreenState;
