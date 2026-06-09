import React from 'react';
import { View, Text, TextInput, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubmitField } from '@/components/submit/FormPrimitives';
import { socialUrlPreview, type SocialPlatformKey } from '@/shared/utils/socialLinks';

export type SocialHandleFieldVariant = 'submit' | 'icon';

export interface SocialHandleFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  variant: SocialHandleFieldVariant;
  platformKey?: SocialPlatformKey;
  keyboardType?: 'default' | 'url';
  /** submit variant */
  label?: string;
  inputStyle?: StyleProp<TextStyle>;
  /** icon variant */
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconWrapStyle?: StyleProp<ViewStyle>;
  inputTextStyle?: StyleProp<TextStyle>;
  previewTextStyle?: StyleProp<TextStyle>;
}

export function SocialHandleField({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  variant,
  platformKey,
  keyboardType = 'default',
  label,
  inputStyle,
  icon,
  iconColor,
  iconWrapStyle,
  inputTextStyle,
  previewTextStyle,
}: SocialHandleFieldProps) {
  const preview = platformKey ? socialUrlPreview(value, platformKey) : undefined;

  const input = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      autoCapitalize="none"
      keyboardType={platformKey === 'website' ? 'url' : keyboardType}
      returnKeyType="next"
      style={variant === 'submit' ? inputStyle : inputTextStyle}
    />
  );

  if (variant === 'submit') {
    return (
      <SubmitField label={label ?? ''} hint={preview ? `→ ${preview}` : undefined}>
        {input}
      </SubmitField>
    );
  }

  return (
    <View style={{ gap: 4 }}>
      <View style={iconWrapStyle}>
        {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
        {input}
      </View>
      {preview ? (
        <Text style={previewTextStyle}>→ {preview}</Text>
      ) : null}
    </View>
  );
}