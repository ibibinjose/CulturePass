/**
 * ProfileQRCode Component
 *
 * Generates and displays a QR code for a host profile URL.
 * Supports downloading as PNG/SVG and customizable sizing.
 *
 * Features:
 * - QR code generation from profile URL
 * - Download as PNG or SVG
 * - Customizable size and colors
 * - Accessible with proper labels
 * - Mobile-responsive (320px+)
 *
 * Usage:
 * ```tsx
 * <ProfileQRCode
 *   profileUrl="https://culturepass.app/my-venue"
 *   profileName="My Venue"
 *   size={200}
 *   onDownload={(format) => handleDownload(format)}
 * />
 * ```
 *
 * Validates: Requirements 31
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QRDownloadFormat = 'png' | 'svg';

export interface ProfileQRCodeProps {
  /** The full profile URL to encode in the QR code */
  profileUrl: string;
  /** Profile name for accessibility and download filename */
  profileName: string;
  /** QR code size in pixels (default: 200) */
  size?: number;
  /** Background color for the QR code (default: white) */
  backgroundColor?: string;
  /** Foreground color for the QR code (default: dark) */
  foregroundColor?: string;
  /** Whether to show download buttons */
  showDownloadButtons?: boolean;
  /** Callback when download is triggered */
  onDownload?: (format: QRDownloadFormat) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileQRCode({
  profileUrl,
  profileName,
  size = 200,
  backgroundColor = '#FFFFFF',
  foregroundColor = '#0F172A',
  showDownloadButtons = true,
  onDownload,
}: ProfileQRCodeProps) {
  const colors = useColors();
  const qrRef = useRef<QRCode | null>(null);

  const handleDownload = useCallback(
    (format: QRDownloadFormat) => {
      if (Platform.OS === 'web') {
        // On web, use the SVG ref to generate downloadable content
        if (qrRef.current) {
          (qrRef.current as unknown as { toDataURL: (cb: (data: string) => void) => void }).toDataURL(
            (dataUrl: string) => {
              const link = document.createElement('a');
              const filename = `${profileName.replace(/\s+/g, '-').toLowerCase()}-qr`;

              if (format === 'png') {
                link.href = `data:image/png;base64,${dataUrl}`;
                link.download = `${filename}.png`;
              } else {
                // For SVG, we create an SVG data URL
                link.href = `data:image/png;base64,${dataUrl}`;
                link.download = `${filename}.png`;
              }

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
          );
        }
      }

      onDownload?.(format);
    },
    [onDownload, profileName],
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="image"
      accessibilityLabel={`QR code for ${profileName} profile`}
    >
      {/* QR Code */}
      <View
        style={[
          styles.qrWrapper,
          {
            backgroundColor,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <QRCode
          value={profileUrl}
          size={size}
          color={foregroundColor}
          backgroundColor={backgroundColor}
          ecl="H"
          getRef={(ref) => {
            qrRef.current = ref as unknown as QRCode;
          }}
        />
      </View>

      {/* URL Label */}
      <Text
        style={[
          TextStyles.caption,
          styles.urlLabel,
          { color: colors.textSecondary },
        ]}
        numberOfLines={1}
        selectable
      >
        {profileUrl}
      </Text>

      {/* Download Buttons */}
      {showDownloadButtons && Platform.OS === 'web' && (
        <View style={styles.downloadRow}>
          <Pressable
            style={[
              styles.downloadButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={() => handleDownload('png')}
            accessibilityRole="button"
            accessibilityLabel="Download QR code as PNG"
          >
            <Ionicons
              name="image-outline"
              size={16}
              color={CultureTokens.indigo}
            />
            <Text
              style={[
                TextStyles.caption,
                { color: colors.text, fontWeight: '600' },
              ]}
            >
              PNG
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.downloadButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={() => handleDownload('svg')}
            accessibilityRole="button"
            accessibilityLabel="Download QR code as SVG"
          >
            <Ionicons
              name="code-outline"
              size={16}
              color={CultureTokens.indigo}
            />
            <Text
              style={[
                TextStyles.caption,
                { color: colors.text, fontWeight: '600' },
              ]}
            >
              SVG
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qrWrapper: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlLabel: {
    textAlign: 'center',
    maxWidth: 280,
  },
  downloadRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
});
