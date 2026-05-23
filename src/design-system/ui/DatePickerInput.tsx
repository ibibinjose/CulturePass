import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export type ISODateString = string;

export function DatePickerInput({
  label,
  value,
  onChangeDate,
  placeholder,
  containerStyle,
  ...rest
}: any) {
  const colors = useColors();
  return (
    <View style={containerStyle}>
      {label ? <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>{label}</Text> : null}
      <TextInput
        {...rest}
        value={value ?? ''}
        onChangeText={(t) => onChangeDate?.(t)}
        placeholder={placeholder ?? 'YYYY-MM-DD'}
        placeholderTextColor={colors.textTertiary}
        style={{
          minHeight: 42,
          borderWidth: 1,
          borderColor: colors.borderLight,
          borderRadius: 12,
          paddingHorizontal: 10,
          color: colors.text,
          backgroundColor: colors.surface,
        }}
      />
    </View>
  );
}

export default DatePickerInput;
