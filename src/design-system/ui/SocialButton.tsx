import React from 'react';
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, FontFamily, FontSize } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SocialButton({
  provider,
  onPress,
  disabled,
  comingSoon,
  fullWidth,
  compact,
  style,
  accessibilityLabel,
}: SocialButtonProps) {
  const colors = useColors();
  const isApple = provider === 'apple';
  const isDisabled = disabled || comingSoon;

  const label = comingSoon
    ? `${isApple ? 'Apple' : 'Google'} (soon)`
    : compact
      ? (isApple ? 'Apple' : 'Google')
      : `Continue with ${isApple ? 'Apple' : 'Google'}`;

  const appleBg = colors.text;
  const appleContentColor = colors.background;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.fullWidth : styles.halfWidth,
        isApple
          ? [styles.appleBase, { backgroundColor: appleBg }]
          : [
              styles.googleBase,
              { backgroundColor: colors.card, borderColor: colors.borderLight },
            ],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {isApple ? (
        <Ionicons name="logo-apple" size={19} color={appleContentColor} />
      ) : (
        <View style={styles.googleIconWrap}>
          <Text style={styles.googleG} allowFontScaling={false}>G</Text>
        </View>
      )}
      <Text
        style={[
          styles.label,
          { color: isApple ? appleContentColor : colors.text },
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 12,
    minWidth: 0,
  },
  fullWidth: { alignSelf: 'stretch' },
  halfWidth: { flex: 1 },
  appleBase: {},
  googleBase: {
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  googleIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: CultureTokens.indigo,
    lineHeight: 20,
  },
  label: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.semibold,
    flexShrink: 1,
  },
});

export default SocialButton;
