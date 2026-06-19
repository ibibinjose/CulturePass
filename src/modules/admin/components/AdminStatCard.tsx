import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function AdminStatCard({
  label,
  value,
  change,
  icon,
  color,
  onPress,
  index = 0,
}: {
  label: string;
  value: string;
  change?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
  index?: number;
}) {
  const colors = useColors();
  const content = (
    <GlassView contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {change ? (
          <Text style={[styles.change, { color: change.startsWith('-') ? '#EF4444' : '#10B981' }]}>
            {change}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </GlassView>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} style={styles.card}>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          {content}
        </Pressable>
      ) : (
        content
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150 },
  content: { padding: 16, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  change: { fontSize: 12, fontFamily: FontFamily.medium },
  value: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  label: { fontSize: 13, fontFamily: FontFamily.medium },
});