import React from 'react';
import { Text, View } from 'react-native';

export function Badge({ children, variant = 'primary', style, shape, size }: any) {
  const bg =
    variant === 'error' ? '#fee2e2' :
    variant === 'warning' ? '#fef3c7' :
    variant === 'success' ? '#dcfce7' :
    '#e0e7ff';
  const color =
    variant === 'error' ? '#b91c1c' :
    variant === 'warning' ? '#92400e' :
    variant === 'success' ? '#166534' :
    '#3730a3';

  const padY = size === 'sm' ? 2 : 4;
  const radius = shape === 'caps' ? 999 : 8;
  return (
    <View style={[{ paddingHorizontal: 8, paddingVertical: padY, borderRadius: radius, backgroundColor: bg }, style]}>
      <Text style={{ fontSize: 11, color }}>{children}</Text>
    </View>
  );
}

export default Badge;
