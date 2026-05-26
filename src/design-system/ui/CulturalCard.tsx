import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import { Image } from 'expo-image';
import { useCulturalTheme } from '@/providers/CulturalThemeProvider';
import { CardTokens, MotionTokens, AccessibilityTokens, CulturalAccents } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

export type CulturalCardVariant = 'elevated' | 'filled' | 'outlined' | 'culture-passport';

interface CulturalCardProps extends Omit<PressableProps, 'style'> {
  variant?: CulturalCardVariant;
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  header?: ReactNode;
  footer?: ReactNode;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export const CulturalCard: React.FC<CulturalCardProps> = ({
  variant = 'elevated',
  children,
  style,
  contentStyle,
  header,
  footer,
  imageUrl,
  title,
  subtitle,
  badge,
  onPress,
  disabled = false,
  ...pressableProps
}) => {
  const theme = useCulturalTheme();
  
  const getBackgroundColor = () => {
    if (variant === 'filled') {
      return theme.isDark ? withAlpha(theme.onSurface, 0.08) : withAlpha(theme.onSurface, 0.04);
    }
    if (variant === 'culture-passport') {
      return theme.isDark 
        ? `linear-gradient(135deg, ${withAlpha(theme.heritageGold, 0.1)}, ${withAlpha(theme.richIndigo, 0.1)})`
        : `linear-gradient(135deg, ${withAlpha(theme.heritageGold, 0.08)}, ${withAlpha(theme.richIndigo, 0.08)})`;
    }
    return theme.surface;
  };

  const getBorderColor = () => {
    if (variant === 'outlined') {
      return theme.isDark ? withAlpha(theme.onSurface, 0.12) : withAlpha(theme.onSurface, 0.08);
    }
    if (variant === 'culture-passport') {
      return theme.heritageGold;
    }
    return 'transparent';
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    borderWidth: variant === 'outlined' || variant === 'culture-passport' ? 1 : 0,
    borderColor: getBorderColor(),
    opacity: disabled ? 0.6 : 1,
    ...Platform.select({
      ios: {
        shadowColor: variant === 'elevated' || variant === 'culture-passport' ? theme.onSurface : 'transparent',
        shadowOffset: variant === 'elevated' || variant === 'culture-passport' ? { width: 0, height: 2 } : { width: 0, height: 0 },
        shadowOpacity: variant === 'elevated' || variant === 'culture-passport' ? 0.1 : 0,
        shadowRadius: variant === 'elevated' || variant === 'culture-passport' ? 4 : 0,
      },
      android: {
        elevation: variant === 'elevated' || variant === 'culture-passport' ? 4 : 0,
      },
      web: {
        boxShadow: variant === 'elevated' || variant === 'culture-passport' 
          ? `0px 2px 8px ${withAlpha(theme.onSurface, 0.12)}`
          : 'none',
      },
    }),
    ...style,
  };

  const contentStyleExtended: ViewStyle = {
    padding: CardTokens.padding,
    gap: CardTokens.gap.mobile,
    ...contentStyle,
  };

  const titleStyle: TextStyle = {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: theme.onSurface,
  };

  const subtitleStyle: TextStyle = {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: theme.isDark ? withAlpha(theme.onSurface, 0.7) : withAlpha(theme.onSurface, 0.6),
  };

  const WrapperComponent = onPress && !disabled ? Pressable : View;
  const wrapperProps = onPress && !disabled ? { onPress, ...pressableProps } : {};

  return (
    <WrapperComponent
      style={cardStyle}
      android_ripple={onPress && !disabled ? { color: withAlpha(theme.primary, 0.1) } : undefined}
      {...wrapperProps}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      )}
      
      <View style={contentStyleExtended}>
        {(header || title || subtitle || badge) && (
          <View style={styles.headerSection}>
            {badge}
            {title && <Text style={titleStyle}>{title}</Text>}
            {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
            {header}
          </View>
        )}
        
        {children}
        
        {footer && (
          <View style={styles.footerSection}>
            {footer}
          </View>
        )}
      </View>
    </WrapperComponent>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 128,
  },
  headerSection: {
    gap: 4,
  },
  footerSection: {
    marginTop: 12,
  },
});

export default CulturalCard;