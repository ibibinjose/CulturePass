/**
 * ShareProfileModal Component
 *
 * Modal for sharing a host profile across social platforms.
 * Includes platform share buttons, QR code generation,
 * embeddable widget code, and share event tracking.
 *
 * Features:
 * - Share to Facebook, Twitter, LinkedIn, WhatsApp, Email
 * - Copy link to clipboard
 * - QR code with download options (PNG/SVG)
 * - Embeddable widget code with theme/size customization
 * - Share event tracking for analytics
 * - Mobile-responsive design (320px+)
 * - Accessibility support (WCAG 2.1 Level AA)
 *
 * Usage:
 * ```tsx
 * <ShareProfileModal
 *   visible={showShareModal}
 *   profileId="abc123"
 *   handle="my-venue"
 *   name="My Venue"
 *   tagline="Best venue in Sydney"
 *   heroImageUrl="https://..."
 *   onDismiss={() => setShowShareModal(false)}
 * />
 * ```
 *
 * Validates: Requirements 31
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Spacing, Radius } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';

import { ProfileQRCode } from './ProfileQRCode';
import {
  useShareProfile,
  type SharePlatform,
  type WidgetTheme,
  type WidgetSize,
} from '../hooks/useShareProfile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShareProfileModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Profile ID for tracking */
  profileId: string;
  /** Profile handle (URL slug) */
  handle: string;
  /** Profile display name */
  name: string;
  /** Profile tagline */
  tagline?: string;
  /** Hero image URL for social previews */
  heroImageUrl?: string;
  /** Entity type */
  entityType?: string;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
}

type ModalTab = 'share' | 'qr' | 'embed';

// ---------------------------------------------------------------------------
// Platform Config
// ---------------------------------------------------------------------------

interface PlatformOption {
  id: SharePlatform;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SHARE_PLATFORMS: PlatformOption[] = [
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'twitter', label: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'email', label: 'Email', icon: 'mail-outline', color: CultureTokens.indigo },
  { id: 'copy-link', label: 'Copy Link', icon: 'link-outline', color: CultureTokens.teal },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareProfileModal({
  visible,
  profileId,
  handle,
  name,
  tagline,
  heroImageUrl,
  entityType,
  onDismiss,
}: ShareProfileModalProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ModalTab>('share');
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>('light');
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('compact');
  const [widgetCodeCopied, setWidgetCodeCopied] = useState(false);

  const {
    shareTo,
    profileUrl,
    linkCopied,
    getWidgetCode,
    isSharing,
  } = useShareProfile({
    profileId,
    handle,
    name,
    tagline,
    heroImageUrl,
    entityType,
  });

  const isMobile = screenWidth < 768;

  const handlePlatformShare = useCallback(
    async (platform: SharePlatform) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await shareTo(platform);
    },
    [shareTo],
  );

  const handleCopyWidgetCode = useCallback(async () => {
    const code = getWidgetCode({ theme: widgetTheme, size: widgetSize });
    await Clipboard.setStringAsync(code);
    setWidgetCodeCopied(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => setWidgetCodeCopied(false), 2500);
  }, [getWidgetCode, widgetTheme, widgetSize]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close share modal"
      />
      <View
        style={[
          styles.modal,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            maxWidth: isMobile ? '100%' : 520,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="share-social"
              size={24}
              color={CultureTokens.violet}
            />
            <Text
              style={[TextStyles.title3, { color: colors.text }]}
              accessibilityRole="header"
              aria-level={1}
            >
              Share Profile
            </Text>
          </View>
          <Pressable
            onPress={onDismiss}
            style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabRow, { borderBottomColor: colors.borderLight }]}>
          {([
            { id: 'share' as ModalTab, label: 'Share', icon: 'share-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'qr' as ModalTab, label: 'QR Code', icon: 'qr-code-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'embed' as ModalTab, label: 'Embed', icon: 'code-slash-outline' as keyof typeof Ionicons.glyphMap },
          ]).map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && {
                  borderBottomColor: CultureTokens.violet,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.id }}
              accessibilityLabel={tab.label}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={
                  activeTab === tab.id
                    ? CultureTokens.violet
                    : colors.textTertiary
                }
              />
              <Text
                style={[
                  TextStyles.caption,
                  {
                    color:
                      activeTab === tab.id
                        ? CultureTokens.violet
                        : colors.textTertiary,
                    fontWeight: activeTab === tab.id ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'share' && (
            <ShareTab
              platforms={SHARE_PLATFORMS}
              onShare={handlePlatformShare}
              profileUrl={profileUrl}
              linkCopied={linkCopied}
              isSharing={isSharing}
              colors={colors}
            />
          )}

          {activeTab === 'qr' && (
            <QRTab
              profileUrl={profileUrl}
              profileName={name}
              colors={colors}
            />
          )}

          {activeTab === 'embed' && (
            <EmbedTab
              widgetTheme={widgetTheme}
              widgetSize={widgetSize}
              onThemeChange={setWidgetTheme}
              onSizeChange={setWidgetSize}
              widgetCode={getWidgetCode({ theme: widgetTheme, size: widgetSize })}
              onCopyCode={handleCopyWidgetCode}
              codeCopied={widgetCodeCopied}
              colors={colors}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Share Tab
// ---------------------------------------------------------------------------

interface ShareTabProps {
  platforms: PlatformOption[];
  onShare: (platform: SharePlatform) => void;
  profileUrl: string;
  linkCopied: boolean;
  isSharing: boolean;
  colors: ReturnType<typeof useColors>;
}

function ShareTab({
  platforms,
  onShare,
  profileUrl,
  linkCopied,
  isSharing,
  colors,
}: ShareTabProps) {
  return (
    <View style={styles.shareTab}>
      {/* Platform Grid */}
      <View style={styles.platformGrid}>
        {platforms.map((platform) => (
          <Pressable
            key={platform.id}
            style={[
              styles.platformButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={() => onShare(platform.id)}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel={`Share to ${platform.label}`}
          >
            <View
              style={[
                styles.platformIcon,
                { backgroundColor: platform.color + '15' },
              ]}
            >
              <Ionicons
                name={
                  platform.id === 'copy-link' && linkCopied
                    ? 'checkmark'
                    : platform.icon
                }
                size={22}
                color={platform.color}
              />
            </View>
            <Text
              style={[
                TextStyles.caption,
                { color: colors.text, fontWeight: '500' },
              ]}
              numberOfLines={1}
            >
              {platform.id === 'copy-link' && linkCopied
                ? 'Copied!'
                : platform.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Profile URL Display */}
      <View
        style={[
          styles.urlDisplay,
          {
            backgroundColor: colors.background,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Ionicons name="link" size={16} color={colors.textTertiary} />
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textSecondary, flex: 1 },
          ]}
          numberOfLines={1}
          selectable
        >
          {profileUrl}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// QR Tab
// ---------------------------------------------------------------------------

interface QRTabProps {
  profileUrl: string;
  profileName: string;
  colors: ReturnType<typeof useColors>;
}

function QRTab({ profileUrl, profileName, colors }: QRTabProps) {
  return (
    <View style={styles.qrTab}>
      <Text
        style={[
          TextStyles.body,
          { color: colors.textSecondary, textAlign: 'center' },
        ]}
      >
        Scan this QR code to visit the profile
      </Text>

      <ProfileQRCode
        profileUrl={profileUrl}
        profileName={profileName}
        size={180}
        showDownloadButtons={true}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Embed Tab
// ---------------------------------------------------------------------------

interface EmbedTabProps {
  widgetTheme: WidgetTheme;
  widgetSize: WidgetSize;
  onThemeChange: (theme: WidgetTheme) => void;
  onSizeChange: (size: WidgetSize) => void;
  widgetCode: string;
  onCopyCode: () => void;
  codeCopied: boolean;
  colors: ReturnType<typeof useColors>;
}

function EmbedTab({
  widgetTheme,
  widgetSize,
  onThemeChange,
  onSizeChange,
  widgetCode,
  onCopyCode,
  codeCopied,
  colors,
}: EmbedTabProps) {
  return (
    <View style={styles.embedTab}>
      {/* Theme Selector */}
      <View style={styles.optionGroup}>
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textSecondary, fontWeight: '600' },
          ]}
        >
          Theme
        </Text>
        <View style={styles.optionRow}>
          <ToggleButton
            label="Light"
            active={widgetTheme === 'light'}
            onPress={() => onThemeChange('light')}
            colors={colors}
          />
          <ToggleButton
            label="Dark"
            active={widgetTheme === 'dark'}
            onPress={() => onThemeChange('dark')}
            colors={colors}
          />
        </View>
      </View>

      {/* Size Selector */}
      <View style={styles.optionGroup}>
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textSecondary, fontWeight: '600' },
          ]}
        >
          Size
        </Text>
        <View style={styles.optionRow}>
          <ToggleButton
            label="Compact"
            active={widgetSize === 'compact'}
            onPress={() => onSizeChange('compact')}
            colors={colors}
          />
          <ToggleButton
            label="Full"
            active={widgetSize === 'full'}
            onPress={() => onSizeChange('full')}
            colors={colors}
          />
        </View>
      </View>

      {/* Code Preview */}
      <View
        style={[
          styles.codeBlock,
          {
            backgroundColor: colors.background,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text
            style={[
              styles.codeText,
              { color: colors.textSecondary },
            ]}
            selectable
          >
            {widgetCode}
          </Text>
        </ScrollView>
      </View>

      {/* Copy Button */}
      <Pressable
        style={[
          styles.copyCodeButton,
          {
            backgroundColor: codeCopied
              ? CultureTokens.teal + '15'
              : CultureTokens.violet + '15',
            borderColor: codeCopied
              ? CultureTokens.teal + '40'
              : CultureTokens.violet + '40',
          },
        ]}
        onPress={onCopyCode}
        accessibilityRole="button"
        accessibilityLabel={codeCopied ? 'Code copied' : 'Copy embed code'}
      >
        <Ionicons
          name={codeCopied ? 'checkmark-circle' : 'copy-outline'}
          size={18}
          color={codeCopied ? CultureTokens.teal : CultureTokens.violet}
        />
        <Text
          style={[
            TextStyles.callout,
            {
              color: codeCopied ? CultureTokens.teal : CultureTokens.violet,
              fontWeight: '600',
            },
          ]}
        >
          {codeCopied ? 'Copied!' : 'Copy Code'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toggle Button
// ---------------------------------------------------------------------------

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}

function ToggleButton({ label, active, onPress, colors }: ToggleButtonProps) {
  return (
    <Pressable
      style={[
        styles.toggleButton,
        {
          backgroundColor: active
            ? CultureTokens.violet + '15'
            : colors.background,
          borderColor: active
            ? CultureTokens.violet + '40'
            : colors.borderLight,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          TextStyles.caption,
          {
            color: active ? CultureTokens.violet : colors.textSecondary,
            fontWeight: active ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: Spacing.md,
  },
  modal: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  content: {
    maxHeight: 420,
  },
  contentInner: {
    padding: Spacing.lg,
  },

  // Share Tab
  shareTab: {
    gap: Spacing.lg,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformButton: {
    width: '30%',
    flexGrow: 1,
    minWidth: 90,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },

  // QR Tab
  qrTab: {
    alignItems: 'center',
    gap: Spacing.lg,
  },

  // Embed Tab
  embedTab: {
    gap: Spacing.md,
  },
  optionGroup: {
    gap: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  codeBlock: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    maxHeight: 140,
  },
  codeText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    lineHeight: 18,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
