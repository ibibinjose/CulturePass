import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCulturalTheme } from '@/providers/CulturalThemeProvider';
import { InputTokens, AccessibilityTokens } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

interface CulturalInputProps extends TextInputProps {
  label?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  helperText?: string;
  passwordToggle?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const CulturalInput = forwardRef<TextInput, CulturalInputProps>(({
  label,
  leftIcon,
  rightIcon,
  error,
  helperText,
  passwordToggle = false,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  secureTextEntry,
  ...textInputProps
}, ref) => {
  const theme = useCulturalTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const inputContainerStyle: ViewStyle = {
    backgroundColor: theme.isDark 
      ? withAlpha(theme.onSurface, 0.08) 
      : withAlpha(theme.onSurface, 0.04),
    borderRadius: InputTokens.radius,
    paddingHorizontal: InputTokens.paddingH,
    paddingVertical: InputTokens.paddingV,
    flexDirection: 'row',
    alignItems: 'center',
    gap: InputTokens.iconGap,
    borderWidth: 1,
    borderColor: hasError 
      ? theme.error 
      : isFocused 
        ? theme.primary 
        : theme.isDark 
          ? withAlpha(theme.onSurface, 0.12) 
          : withAlpha(theme.onSurface, 0.08),
    ...containerStyle,
  };

  const inputTextStyle: TextStyle = {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: InputTokens.fontSize,
    color: theme.onSurface,
    padding: 0,
    ...inputStyle,
  };

  const labelTextStyle: TextStyle = {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    color: hasError ? theme.error : theme.isDark 
      ? withAlpha(theme.onSurface, 0.87) 
      : withAlpha(theme.onSurface, 0.87),
    ...labelStyle,
  };

  const errorTextStyle: TextStyle = {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 4,
    color: theme.error,
    ...errorStyle,
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={labelTextStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={InputTokens.iconSize} 
            color={hasError ? theme.error : theme.isDark 
              ? withAlpha(theme.onSurface, 0.6) 
              : withAlpha(theme.onSurface, 0.6)} 
          />
        )}
        
        <TextInput
          ref={ref}
          style={inputTextStyle}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor={theme.isDark 
            ? withAlpha(theme.onSurface, 0.4) 
            : withAlpha(theme.onSurface, 0.4)}
          onFocus={(e) => {
            setIsFocused(true);
            if (textInputProps.onFocus) textInputProps.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (textInputProps.onBlur) textInputProps.onBlur(e);
          }}
          {...textInputProps}
        />
        
        {passwordToggle && (
          <TouchableOpacity onPress={togglePasswordVisibility} hitSlop={AccessibilityTokens.minTapTarget}>
            <Ionicons 
              name={isPasswordVisible ? 'eye-off' : 'eye'} 
              size={InputTokens.iconSize} 
              color={theme.isDark 
                ? withAlpha(theme.onSurface, 0.6) 
                : withAlpha(theme.onSurface, 0.6)} 
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !passwordToggle && (
          <Ionicons 
            name={rightIcon} 
            size={InputTokens.iconSize} 
            color={hasError ? theme.error : theme.isDark 
              ? withAlpha(theme.onSurface, 0.6) 
              : withAlpha(theme.onSurface, 0.6)} 
          />
        )}
      </View>
      
      {error && <Text style={errorTextStyle}>{error}</Text>}
      {!error && !!helperText && (
        <Text style={[errorTextStyle, { color: theme.isDark 
          ? withAlpha(theme.onSurface, 0.6) 
          : withAlpha(theme.onSurface, 0.6) }]}>{helperText}</Text>
      )}
    </View>
  );
});

CulturalInput.displayName = 'CulturalInput';

export default CulturalInput;