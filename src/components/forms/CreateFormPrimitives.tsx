import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  InputTokens,
  Radius,
  Spacing,
  TextStyles,
} from '@/design-system/tokens/theme';
import { useCreateFormTheme } from './createFormTheme';

// ─── Section ─────────────────────────────────────────────────────────────────

export type CreateFormSectionProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Optional accent override for section icon (e.g. CultureTokens.coral). */
  color?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CreateFormSection({
  title,
  icon,
  color,
  children,
  style,
}: CreateFormSectionProps) {
  const theme = useCreateFormTheme();
  const iconColor = color ?? theme.accent;

  return (
    <View
      style={[
        styles.section,
        {
          borderColor: theme.border,
          backgroundColor: theme.card,
        },
        style,
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.accentLight }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

export type CreateFormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export function CreateFormField({
  label,
  required,
  hint,
  error,
  children,
}: CreateFormFieldProps) {
  const theme = useCreateFormTheme();

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={2}>
          {label}
          {required ? (
            <Text style={{ color: theme.required }}> *</Text>
          ) : null}
        </Text>
        {hint ? (
          <Text style={[styles.hint, { color: theme.textMuted }]} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
      {error ? (
        <Text style={[styles.error, { color: theme.required }]} numberOfLines={2}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

export function CreateFormInput(props: TextInputProps) {
  const theme = useCreateFormTheme();
  const { multiline, style, ...rest } = props;

  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      style={[
        multiline ? styles.textarea : styles.input,
        {
          backgroundColor: theme.inputBg,
          borderColor: theme.border,
          color: theme.text,
        },
        style,
      ]}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...rest}
    />
  );
}

export type CreateFormDraftInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  accessibilityLabel: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
};

export function CreateFormDraftInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  accessibilityLabel,
  keyboardType,
  autoCapitalize,
  maxLength,
}: CreateFormDraftInputProps) {
  return (
    <CreateFormInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

// ─── Chips ───────────────────────────────────────────────────────────────────

export type CreateChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function CreateChoiceChip({ label, selected, onPress }: CreateChoiceChipProps) {
  const theme = useCreateFormTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? theme.accent : theme.inputBg,
            borderColor: selected ? theme.accent : theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: selected ? '#FFFFFF' : theme.text },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CreateFormChipGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipGrid}>{children}</View>;
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

export function CreateFormTwoCol({ children }: { children: React.ReactNode }) {
  return <View style={styles.twoCol}>{children}</View>;
}

export type CreateFormSwitchRowProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

export function CreateFormSwitchRow({
  label,
  hint,
  value,
  onValueChange,
  accessibilityLabel,
}: CreateFormSwitchRowProps) {
  const theme = useCreateFormTheme();

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.switchRow,
        { borderColor: theme.border, backgroundColor: theme.inputBg },
      ]}
    >
      <View style={styles.switchText}>
        <Text style={[styles.switchLabel, { color: theme.text }]} numberOfLines={2}>
          {label}
        </Text>
        {hint ? (
          <Text style={[styles.switchHint, { color: theme.textMuted }]} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={value ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={value ? theme.accent : theme.textMuted}
      />
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  sectionBody: {
    gap: 4,
  },
  field: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  hint: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    maxWidth: '42%',
    textAlign: 'right',
  },
  error: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 4,
  },
  input: {
    minHeight: InputTokens.height,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  textarea: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  chipText: {
    ...TextStyles.caption,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },
  twoCol: {
    gap: Spacing.md,
    ...(Platform.OS === 'web'
      ? ({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        } as Record<string, unknown>)
      : {}),
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: 8,
  },
  switchText: {
    flex: 1,
    minWidth: 0,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  switchHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
});