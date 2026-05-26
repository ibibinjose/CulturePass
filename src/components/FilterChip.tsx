import { Text, Pressable, StyleSheet, ScrollView, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ChipTokens, CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

export interface FilterItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  count?: number;
}

interface FilterChipProps {
  item: FilterItem;
  isActive: boolean;
  onPress: () => void;
  size?: 'small' | 'medium';
}

export function FilterChip({ item, isActive, onPress, size = 'medium' }: FilterChipProps) {
  const colors = useColors();
  const isSmall = size === 'small';
  const accentColor = item.color || colors.primary;
  const activeBackground = item.color || colors.primary;
  const activeTextColor = colors.textInverse;
  const inactiveBackground = item.backgroundColor || colors.surfaceSecondary;
  const inactiveBorder = item.color ? item.color + '40' : colors.borderLight;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${item.label}`}
      accessibilityHint="Applies this filter"
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.chip,
        isSmall && styles.chipSmall,
        isActive
          ? { backgroundColor: activeBackground, borderColor: activeBackground }
          : { backgroundColor: inactiveBackground, borderColor: inactiveBorder },
        pressed && !isActive && styles.chipPressed,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        isActive && styles.chipActiveShadow,
        isActive && styles.chipActiveRing,
        Platform.OS === 'web' && { cursor: 'pointer' as any },
      ]}
    >
      {item.icon ? (
        <Ionicons
          name={item.icon as any}
          size={isSmall ? 14 : 16}
          color={isActive ? activeTextColor : accentColor}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          isActive
            ? { color: activeTextColor, fontFamily: 'Poppins_600SemiBold' }
            : { color: colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {item.count != null && item.count > 0 ? (
        <View
          style={[
            styles.badge,
            isActive
              ? { backgroundColor: 'rgba(255,255,255,0.25)' }
              : { backgroundColor: (accentColor || Colors.primary) + '18' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isActive ? activeTextColor : accentColor },
            ]}
          >
            {item.count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

interface FilterChipRowProps {
  items: FilterItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  size?: 'small' | 'medium';
}

export function FilterChipRow({ items, selectedId, onSelect, size = 'medium' }: FilterChipRowProps) {
  const colors = useColors();

  return (
    <View style={[
      styles.rowContainer,
      {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.borderLight,
      },
    ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        {items.map(item => (
          <FilterChip
            key={item.id}
            item={item}
            isActive={selectedId === item.id}
            onPress={() => onSelect(item.id)}
            size={size}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: ChipTokens.radius + 2,
    borderWidth: 1,
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ChipTokens.paddingH,
    paddingVertical: ChipTokens.paddingV,
    minHeight: ChipTokens.height,
    borderRadius: ChipTokens.radius,
    borderWidth: 1.5,
  },
  chipSmall: {
    paddingHorizontal: ChipTokens.paddingH - 4,
    paddingVertical: ChipTokens.paddingV - 2,
    minHeight: ChipTokens.height - 6,
  },
  icon: {
    marginRight: ChipTokens.gap - 2,
  },
  chipPressed: {
    opacity: 0.92,
  },
  chipActiveShadow: {
    boxShadow: '0px 2px 6px rgba(0,0,0,0.12)',
  },
  chipActiveRing: {
    borderWidth: 2,
  },
  label: {
    fontSize: ChipTokens.fontSize,
    fontFamily: 'Poppins_500Medium',
    marginBottom: Platform.OS === 'ios' ? -2 : 0,
  },
  labelSmall: {
    fontSize: ChipTokens.fontSize - 1,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
});
