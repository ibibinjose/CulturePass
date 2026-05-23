import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function ReviewRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
      <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, width: 90 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 }}>{value || '—'}</Text>
    </View>
  );
}
