import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { InputTokens, Radius } from '@/design-system/tokens/theme';
import { useCreateFormTheme } from './createFormTheme';

export type CreateFormSelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

export type CreateFormSelectProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: CreateFormSelectOption<T>[];
  placeholder?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function CreateFormSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  accessibilityLabel = 'Select option',
  disabled = false,
}: CreateFormSelectProps<T>) {
  const colors = useColors();
  const theme = useCreateFormTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrap}>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={accessibilityLabel}
          style={{
            width: '100%',
            minHeight: InputTokens.height,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.inputBg,
            color: theme.text,
            paddingLeft: 12,
            paddingRight: 36,
            fontSize: 14,
            fontFamily: 'Poppins_400Regular',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.description ? ` — ${opt.description}` : ''}
            </option>
          ))}
        </select>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.textMuted}
          style={styles.webChevron}
          pointerEvents="none"
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open, disabled }}
        style={[
          styles.trigger,
          {
            borderColor: open ? colors.primary : theme.border,
            backgroundColor: theme.inputBg,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.triggerText}>
          <Text style={[styles.triggerLabel, { color: theme.text }]} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          {selected?.description ? (
            <Text style={[styles.triggerDesc, { color: theme.textMuted }]} numberOfLines={2}>
              {selected.description}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{accessibilityLabel}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: active ? `${colors.primary}12` : 'transparent',
                        borderBottomColor: colors.borderLight,
                      },
                    ]}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                      {item.description ? (
                        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  webWrap: {
    position: 'relative',
    width: '100%',
  },
  webChevron: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -9,
  },
  trigger: {
    minHeight: InputTokens.height,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  triggerText: {
    flex: 1,
    minWidth: 0,
  },
  triggerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  triggerDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
});