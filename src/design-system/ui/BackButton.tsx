import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_APP_BACK_FALLBACK, useSafeBack } from '@/lib/navigation';

export interface BackButtonProps extends PressableProps {
  fallback?: string;
  color?: string;
}

export function BackButton({ fallback = DEFAULT_APP_BACK_FALLBACK, color, style, ...rest }: BackButtonProps) {
  const colors = useColors();
  const resolvedColor = color ?? colors.text;
  const onPress = useSafeBack(fallback);

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={style}
    >
      <Ionicons name="chevron-back" size={18} color={resolvedColor} />
      <Text style={[styles.label, { color: resolvedColor }]}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
  },
});

export default BackButton;
