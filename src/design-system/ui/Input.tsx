import React, { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  Pressable,
  Platform,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  InputTokens,
  FontFamily,
} from '@/design-system/tokens/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  passwordToggle?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  passwordToggle,
  containerStyle,
  labelStyle,
  inputStyle,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props
}: InputProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const rowBorderColor = error
    ? colors.error
    : isFocused
      ? CultureTokens.indigo
      : colors.borderLight;
  const rowBorderWidth = isFocused || error ? 2 : 1.5;
  const rowBackground = isFocused ? colors.surfaceElevated : colors.card;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /** `passwordToggle` implies masked input by default; callers rarely pass `secureTextEntry`. */
  const actualSecureTextEntry = passwordToggle
    ? !isPasswordVisible
    : Boolean(secureTextEntry);

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }, labelStyle]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.row,
          {
            borderColor: rowBorderColor,
            borderWidth: rowBorderWidth,
            backgroundColor: rowBackground,
          },
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={InputTokens.iconSize}
            color={isFocused ? CultureTokens.indigo : colors.textSecondary}
            style={styles.iconLeft}
          />
        ) : null}

        <TextInput
          {...props}
          secureTextEntry={actualSecureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: InputTokens.fontSize,
              fontFamily: FontFamily.medium,
            },
            ...(Platform.OS === 'web'
              ? [
                  {
                    backgroundColor: 'transparent',
                    outlineStyle: 'none',
                    WebkitTextFillColor: colors.text,
                    caretColor: CultureTokens.indigo,
                  } as unknown as TextStyle,
                ]
              : []),
            inputStyle,
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          selectionColor={CultureTokens.indigo}
        />

        {passwordToggle ? (
          <Pressable
            onPress={togglePasswordVisibility}
            hitSlop={12}
            style={styles.iconRight}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={InputTokens.iconSize}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={12}
            style={styles.iconRight}
          >
            <Ionicons
              name={rightIcon}
              size={InputTokens.iconSize}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.hint, { color: colors.error, fontFamily: FontFamily.semibold }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  row: {
    minHeight: InputTokens.height,
    borderRadius: InputTokens.radius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: InputTokens.paddingH,
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s, background-color 0.2s',
      },
    }),
  },
  iconLeft: { marginRight: InputTokens.iconGap },
  iconRight: { marginLeft: InputTokens.iconGap },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: InputTokens.paddingV,
    alignSelf: 'stretch',
  },
  hint: {
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
  },
});

export default Input;
