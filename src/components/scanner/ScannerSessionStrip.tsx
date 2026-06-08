import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import type { SessionStats } from './types';

type Props = {
  session: SessionStats;
  durationLabel: string;
};

export function ScannerSessionStrip({ session, durationLabel }: Props) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <StatPill
        value={session.accepted}
        label="Checked in"
        color={Luxe.colors.emerald}
        tint={Luxe.colors.emerald + '14'}
        colors={colors}
      />
      <StatPill
        value={session.duplicates}
        label="Duplicate"
        color={Luxe.colors.gold}
        tint={Luxe.colors.gold + '14'}
        colors={colors}
      />
      <StatPill
        value={session.rejected}
        label="Declined"
        color={Luxe.colors.terracotta}
        tint={Luxe.colors.terracotta + '14'}
        colors={colors}
      />
      <StatPill
        value={durationLabel}
        label="Session"
        color={Luxe.colors.indigo}
        tint={Luxe.colors.indigo + '12'}
        colors={colors}
        isTime
      />
    </View>
  );
}

function StatPill({
  value,
  label,
  color,
  tint,
  colors,
  isTime,
}: {
  value: number | string;
  label: string;
  color: string;
  tint: string;
  colors: ReturnType<typeof useColors>;
  isTime?: boolean;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: tint, borderColor: color + '28' }]}>
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
    padding: 14,
  },
  pill: {
    flex: 1,
    minWidth: 72,
    paddingVertical: 11,
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