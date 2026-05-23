import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';

export function CalendarEmptyState({
  colors,
  title,
  subtitle,
  onSubtitlePress,
}: {
  colors: ReturnType<typeof useColors>;
  title: string;
  subtitle: string;
  onSubtitlePress?: () => void;
}) {
  return (
    <View
      style={[
        s.wrap,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <View style={[s.iconCircle, { backgroundColor: CultureTokens.indigo + '14' }]}>
        <Ionicons name="calendar-outline" size={32} color={CultureTokens.indigo} />
      </View>
      <Text style={[s.title, { color: colors.text }]}>{title}</Text>
      {onSubtitlePress ? (
        <Pressable onPress={onSubtitlePress} accessibilityRole="link">
          <Text style={[s.link, { color: CultureTokens.indigo }]}>{subtitle} →</Text>
        </Pressable>
      ) : (
        <Text style={[s.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  sub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  link: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});
