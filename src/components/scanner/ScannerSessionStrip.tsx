import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import type { SessionStats } from './types';

type Props = {
  session: SessionStats;
  durationLabel: string;
};

export function ScannerSessionStrip({ session, durationLabel }: Props) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <StatPill value={session.accepted} label="Checked in" color={CultureTokens.emerald} colors={colors} />
      <StatPill value={session.duplicates} label="Duplicate" color={CultureTokens.gold} colors={colors} />
      <StatPill value={session.rejected} label="Declined" color={CultureTokens.coral} colors={colors} />
      <StatPill value={durationLabel} label="Session" color={colors.text} colors={colors} isTime />
    </View>
  );
}

function StatPill({
  value,
  label,
  color,
  colors,
  isTime,
}: {
  value: number | string;
  label: string;
  color: string;
  colors: ReturnType<typeof useColors>;
  isTime?: boolean;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Text style={[styles.value, { color }, isTime && styles.valueTime]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flex: 1,
    minWidth: 72,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.5,
  },
  valueTime: {
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
