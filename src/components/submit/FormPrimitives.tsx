import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CardTokens, type ColorTheme } from '@/design-system/tokens/theme';

export function Card({ children, colors, hPad }: { children: React.ReactNode; colors: ColorTheme; hPad: number }) {
  return (
    <View style={[card.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginHorizontal: hPad }]}>
      {children}
    </View>
  );
}

export function SectionLabel({ label, icon, accent, colors }: { label: string; icon: string; accent: string; colors: ColorTheme }) {
  return (
    <View style={card.sectionHead}>
      <LinearGradient
        colors={[accent + '28', accent + '10']}
        style={card.sectionIconBg}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color={accent} />
      </LinearGradient>
      <Text style={[card.sectionTitle, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export function Field({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={card.field}>
      <View style={card.fieldLabelRow}>
        <Text style={[card.fieldLabel, { color: colors.textSecondary }]}>
          {label}{required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
        {hint ? <Text style={[card.fieldHint, { color: colors.textTertiary }]}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text style={[card.fieldError, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: CardTokens.radius, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0px 1px 6px rgba(0,0,0,0.06)' } as object,
      default: { shadowColor: 'black', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    }),
  },
  sectionHead:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  field:         { marginBottom: 12 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  fieldHint:     { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  fieldError:    { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 4 },
});

/** Canonical names for intake flows — also re-exported from `@/components/atomic/molecules`. */
export const SubmitCard = Card;
export const SubmitSectionLabel = SectionLabel;
export const SubmitField = Field;

/** HostSpace / Creation Lab embedded forms — shared Muji-themed primitives. */
export {
  CreateFormSection,
  CreateFormField,
  CreateFormInput,
  CreateFormDraftInput,
  CreateChoiceChip,
  CreateFormChipGrid,
  CreateFormTwoCol,
  useCreateFormTheme,
} from '@/components/forms';

