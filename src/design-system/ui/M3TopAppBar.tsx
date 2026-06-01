import React from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';
import { HeaderTokens, ScreenTokens } from '@/design-system/tokens/theme';

export interface M3TopAppBarProps {
  title: string;
  onBack?: () => void;
  actions?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string }[];
  /** Renders at the start of the trailing row (e.g. theme segment) before `actions` icons. */
  trailingStart?: React.ReactNode;
  centerTitle?: boolean;
  titleLeading?: React.ReactNode;
  variant?: 'small' | 'medium' | 'large' | 'center-aligned';
  denseWeb?: boolean;
  webHighContrast?: boolean;
  webChromeless?: boolean;
  webAccentColor?: string;
  webBackgroundColor?: string;
  webBorderColor?: string;
}

export function M3TopAppBar({
  title,
  onBack,
  actions,
  trailingStart,
  centerTitle,
  titleLeading,
  variant = 'small',
  denseWeb = false,
  webHighContrast = false,
  webChromeless = false,
  webAccentColor,
  webBackgroundColor,
  webBorderColor,
}: M3TopAppBarProps) {
  const colors = useM3Colors();
  const insets = useSafeAreaInsetsWeb();
  const isWeb = Platform.OS === 'web';
  const topPadding = insets.top + ScreenTokens.topOffset;

  const isCenterAligned = variant === 'center-aligned' || centerTitle;
  const showExpandedTitle = (variant === 'medium' || variant === 'large') && !isWeb;
  const actionIconSize = 24;
  const titleColor = isWeb && webAccentColor
    ? webAccentColor
    : (isWeb && webHighContrast ? '#000000' : colors.onSurface);
  const actionColor = isWeb && webAccentColor
    ? webAccentColor
    : (isWeb && webHighContrast ? '#0F172A' : colors.onSurfaceVariant);
  const barBackgroundColor = isWeb && webChromeless
    ? 'transparent'
    : (isWeb ? (webBackgroundColor ?? (webHighContrast ? '#EFF6FF' : colors.surface)) : colors.surface);
  const barBorderColor = isWeb && webChromeless
    ? 'transparent'
    : (isWeb ? (webBorderColor ?? (webHighContrast ? '#93C5FD' : colors.outlineVariant)) : colors.outlineVariant);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: barBackgroundColor,
          borderBottomColor: barBorderColor,
        },
        isWeb && styles.webContainer,
        isWeb && webChromeless && styles.webContainerChromeless,
        variant === 'large' && styles.largeContainer,
      ]}
    >
      <View style={[styles.content, isWeb && styles.webContent, isWeb && denseWeb && styles.webContentDense]}>
        <View style={[styles.leftSection, isWeb && styles.webLeftSection]}>
          {onBack && (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[
                styles.iconButton,
                isWeb && styles.webIconButton,
                isWeb && webHighContrast && styles.webIconButtonContrast,
              ]}
            >
              <Ionicons name="chevron-back" size={actionIconSize} color={titleColor} />
            </Pressable>
          )}
          {titleLeading ? <View style={styles.titleLeading}>{titleLeading}</View> : null}
          {!isCenterAligned && (variant === 'small' || isWeb) && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.title, { fontSize: HeaderTokens.titleFontSize, fontFamily: HeaderTokens.titleFontFamily, color: titleColor }]}
            >
              {title}
            </Text>
          )}
        </View>

        {isCenterAligned && (
          <View style={styles.centerSection}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.title, { fontSize: HeaderTokens.titleFontSize, fontFamily: HeaderTokens.titleFontFamily, color: titleColor }]}
            >
              {title}
            </Text>
          </View>
        )}

        <View style={[styles.rightSection, isWeb && styles.webRightSection]}>
          {trailingStart}
          {actions?.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label ?? 'Action'}
              style={[
                styles.iconButton,
                isWeb && styles.webIconButton,
                isWeb && webHighContrast && styles.webIconButtonContrast,
              ]}
            >
              <Ionicons name={action.icon} size={actionIconSize} color={actionColor} />
            </Pressable>
          ))}
        </View>
      </View>

      {showExpandedTitle && (
        <View style={styles.expandedTitleSection}>
          <Text
            style={[
              variant === 'large' ? M3Typography.headlineLarge : M3Typography.headlineSmall,
              { color: colors.onSurface },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  webContainer: {
    paddingBottom: 0,
  },
  webContainerChromeless: {
    borderBottomWidth: 0,
  },
  largeContainer: {
    paddingBottom: 24,
  },
  content: {
    height: HeaderTokens?.height ?? 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  webContent: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  webContentDense: {
    height: 48,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  webLeftSection: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  webRightSection: {
    marginLeft: 'auto',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  webIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  webIconButtonContrast: {
    backgroundColor: 'rgba(15,23,42,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.18)',
  },
  title: {
    marginLeft: 12,
    flexShrink: 1,
  },
  titleLeading: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedTitleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
