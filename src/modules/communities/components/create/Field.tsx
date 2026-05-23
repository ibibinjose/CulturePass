import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.wrap}>
      <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
