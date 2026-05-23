import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { locationPickerStyles as styles } from '@/components/location/locationPickerStyles';

export type LocationPickerTriggerVariant = 'icon' | 'full' | 'text';

export interface LocationPickerTriggersProps {
  variant: LocationPickerTriggerVariant;
  block: boolean;
  colors: ColorTheme;
  iconColor?: string;
  buttonStyle?: ViewStyle;
  textColor?: string;
  stateCity: string;
  stateCountry: string;
  countryFlag: string;
  locationLabel: string;
  onOpen: () => void;
}

export function LocationPickerTriggers({
  variant,
  block,
  colors,
  iconColor,
  buttonStyle,
  textColor,
  stateCity,
  stateCountry,
  countryFlag,
  locationLabel,
  onOpen,
}: LocationPickerTriggersProps) {
  const a11yLabel = stateCity
    ? `Location: ${stateCity}, ${stateCountry || 'selected country'}. Tap to change`
    : 'Select location';

  if (variant === 'text') {
    return (
      <Pressable
        style={styles.textTrigger}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <Text style={styles.textTriggerFlag}>{stateCity ? countryFlag : '📍'}</Text>
        <Text style={[styles.textTriggerLabel, { color: textColor ?? colors.textSecondary }]} numberOfLines={1}>
          {locationLabel}
        </Text>
        <Ionicons name="chevron-down" size={12} color={textColor ?? colors.textTertiary} />
      </Pressable>
    );
  }

  if (variant === 'icon') {
    return (
      <Pressable
        style={[styles.iconTrigger, { backgroundColor: 'rgba(255,255,255,0.15)' }, buttonStyle]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        {stateCity ? (
          <Text style={[styles.flagEmoji, { fontSize: 20 }]}>{countryFlag}</Text>
        ) : (
          <Ionicons name="location-outline" size={20} color={iconColor ?? '#fff'} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.trigger, block && styles.triggerBlock, { backgroundColor: colors.surface, borderColor: colors.border }, buttonStyle]}
      onPress={onOpen}
    >
      <View style={[styles.triggerDot, { backgroundColor: colors.primary }]}>
        <Text style={styles.triggerFlag}>{stateCity ? countryFlag : '📍'}</Text>
      </View>
      <Text
        style={[
          styles.triggerText,
          block ? styles.triggerTextBlock : styles.triggerTextClamped,
          { color: colors.text },
        ]}
        numberOfLines={block ? 2 : 1}
      >
        {locationLabel}
      </Text>
      <Ionicons name="chevron-down" size={block ? 18 : 14} color={colors.textTertiary} />
    </Pressable>
  );
}
