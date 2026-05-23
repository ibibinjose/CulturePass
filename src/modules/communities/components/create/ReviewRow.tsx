import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function ReviewRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.row}>
      <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={s.valueWrap}>
        {typeof value === 'string' ? (
          <Text style={[s.value, { color: colors.text }]}>{value || '—'}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  valueWrap: { flex: 1, alignItems: 'flex-end', marginLeft: 16 },
  value: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'right' },
});
