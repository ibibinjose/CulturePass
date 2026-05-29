/**
 * AutoSaveIndicator Component
 * 
 * Displays auto-save status feedback to the user.
 * Shows "Saving...", "Saved", or error states with smooth animations.
 * 
 * Features:
 * - Status-based visual feedback
 * - Smooth fade in/out animations
 * - Relative time display ("Saved 2 minutes ago")
 * - Error state with retry option
 * - Fixed positioning (bottom-right on desktop, bottom-center on mobile)
 * 
 * Usage:
 * ```tsx
 * <AutoSaveIndicator
 *   status="saved"
 *   lastSaved={new Date()}
 * />
 * ```
 */

import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/colors';
import { Spacing, Radius, Elevation } from '@/design-system/tokens/theme';
import { USE_NATIVE_DRIVER } from '@/design-system/tokens/animations';
import type { SaveStatus } from '../hooks/useAutoSave';
import { formatLastSaved } from '../hooks/useAutoSave';
import { announceAutoSaveStatus, liveRegionProps } from '../utils/accessibility';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoSaveIndicatorProps {
  /**
   * Current save status
   */
  status: SaveStatus;
  /**
   * Last successful save timestamp
   */
  lastSaved: Date | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AutoSaveIndicator = memo(function AutoSaveIndicator({
  status,
  lastSaved,
}: AutoSaveIndicatorProps) {
  const colors = useColors();
  const layout = useLayout();
  const [opacity] = useState(new Animated.Value(0));
  const [lastSavedText, setLastSavedText] = useState('');

  // ---------------------------------------------------------------------------
  // Update Last Saved Text
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (lastSaved) {
      setLastSavedText(formatLastSaved(lastSaved));

      // Update every 10 seconds
      const interval = setInterval(() => {
        setLastSavedText(formatLastSaved(lastSaved));
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [lastSaved]);

  // ---------------------------------------------------------------------------
  // Fade In/Out Animation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (status === 'saving' || status === 'saved' || status === 'error') {
      // Announce to screen readers
      announceAutoSaveStatus(status);

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();

      // Auto-hide after 2 seconds for 'saved' status
      if (status === 'saved') {
        const timer = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        }, 2000);

        return () => clearTimeout(timer);
      }
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  }, [status, opacity]);

  // ---------------------------------------------------------------------------
  // Don't render if idle
  // ---------------------------------------------------------------------------

  if (status === 'idle') {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Status Content
  // ---------------------------------------------------------------------------

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return {
          icon: 'cloud-upload-outline' as const,
          text: 'Saving...',
          color: colors.textSecondary,
          backgroundColor: colors.surface,
        };

      case 'saved':
        return {
          icon: 'checkmark-circle' as const,
          text: lastSavedText || 'Saved',
          color: CultureTokens.teal,
          backgroundColor: colors.surface,
        };

      case 'error':
        return {
          icon: 'alert-circle' as const,
          text: 'Error saving',
          color: CultureTokens.coral,
          backgroundColor: colors.surface,
        };

      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: content.backgroundColor,
          borderColor: colors.border,
          ...Elevation[2],
        },
        layout.isDesktop ? styles.desktopPosition : styles.mobilePosition,
      ]}
      {...liveRegionProps('polite')}
      accessibilityLabel={content.text}
    ><Ionicons name={content.icon} size={16} color={content.color} /><Text
        style={[
          styles.text,
          {
            color: content.color,
          },
        ]}
      >{content.text}</Text></Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      position: 'fixed' as const,
    } as Record<string, unknown>),
  },
  desktopPosition: {
    bottom: Spacing.lg,
    right: Spacing.lg,
  },
  mobilePosition: {
    bottom: Spacing.lg,
    left: '50%',
    transform: [{ translateX: -100 }], // Approximate centering
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
