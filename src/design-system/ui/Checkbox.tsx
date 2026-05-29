import React from 'react';
import {
  Pressable,
  Platform,
  Text,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { FontFamily, FontSize } from '@/design-system/tokens/theme';

export interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onToggle,
  label,
  color,
  style,
  disabled,
  ...rest
}: CheckboxProps) {
  const colors = useColors();
  const activeColor = color || colors.primary;

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onToggle(!checked);
  };

  // Use plain View + static colors — Reanimated springs on backgroundColor are unreliable on web
  // and can leave the box transparent while the checkmark stays white (invisible on light UI).
  const boxColors = {
    backgroundColor: checked ? activeColor : 'transparent',
    borderColor: checked ? activeColor : colors.border,
  };

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        style,
        disabled && { opacity: 0.5 },
        pressed && !disabled && styles.pressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.box, boxColors]}>
        {checked ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : null}
      </View>
      {label && (
        <View style={styles.labelContainer}>
          {typeof label === 'string' ? (
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          ) : (
            label
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize?.body2 ?? 14,
  },
});

export default Checkbox;
