import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Perk } from './types';

interface PerkAvailabilityProps {
  perk: Perk;
  typeInfo: { icon: string; color: string; label: string; gradient: string };
  remaining: number | null;
  usagePercent: number;
}

export function PerkAvailability({ perk, typeInfo, remaining, usagePercent }: PerkAvailabilityProps) {
  const colors = useColors();
  if (!perk.usageLimit) return null;

  const fillColor = usagePercent > 80 ? colors.error : typeInfo.color;

  return (
    <>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Availability</Text>
        <View style={[styles.availabilityCard, { backgroundColor: colors.surface }]}>
          <View style={styles.availRow}>
            <Text style={[styles.availLabel, { color: colors.text }]}>
              {remaining} of {perk.usageLimit} remaining
            </Text>
            <Text style={[styles.availPercent, { color: fillColor }]}>
              {usagePercent}% claimed
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(usagePercent, 100)}%` as any, backgroundColor: fillColor },
              ]}
            />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  availabilityCard: {
    borderRadius: 14,
    padding: 16,
  },
  availRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  availLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  availPercent: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
