import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCulturalTheme } from '@/providers/CulturalThemeProvider';
import { HeaderTokens, IconSize, AccessibilityTokens } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

export type CulturalTopAppBarVariant = 'small' | 'medium' | 'large';

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}

interface CulturalTopAppBarProps {
  title: string | React.ReactNode;
  variant?: CulturalTopAppBarVariant;
  titleLeading?: ReactNode;
  titleTrailing?: ReactNode;
  trailingStart?: ReactNode;
  actions?: ActionItem[];
  onBack?: () => void;
  denseWeb?: boolean;
  webChromeless?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const CulturalTopAppBar: React.FC<CulturalTopAppBarProps> = ({
  title,
  variant = 'medium',
  titleLeading,
  titleTrailing,
  trailingStart,
  actions = [],
  onBack,
  denseWeb = false,
  webChromeless = false,
  style,
  titleStyle,
}) => {
  const theme = useCulturalTheme();
  
  const appBarStyle: ViewStyle = {
    height: denseWeb && Platform.OS === 'web' 
      ? HeaderTokens.height - 6 
      : HeaderTokens.height,
    backgroundColor: webChromeless && Platform.OS === 'web' 
      ? 'transparent' 
      : theme.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HeaderTokens.paddingHorizontal,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    ...Platform.select({
      ios: {
        shadowColor: theme.onSurface,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: webChromeless 
          ? 'none' 
          : '0px 1px 2px rgba(0, 0, 0, 0.05), 0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
    ...style,
  };

  const titleContainerStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: HeaderTokens.iconSize / 2,
  };

  const titleTextStyle: TextStyle = {
    fontFamily: HeaderTokens.titleFontFamily,
    fontSize: HeaderTokens.titleFontSize,
    color: theme.onSurface,
    ...titleStyle,
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.surface }}>
      <View style={appBarStyle}>
        {/* Back button */}
        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={HeaderTokens.iconSize}
              color={theme.onSurface}
            />
          </Pressable>
        )}

        {/* Title section */}
        <View style={titleContainerStyle}>
          {titleLeading}
          {typeof title === 'string' ? (
            <Text style={titleTextStyle} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
          ) : (
            title
          )}
          {titleTrailing}
        </View>

        {/* Trailing start content */}
        {trailingStart}

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel || action.icon}
            >
              <Ionicons
                name={action.icon}
                size={HeaderTokens.iconSize}
                color={theme.onSurface}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderRadius: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
});

export default CulturalTopAppBar;