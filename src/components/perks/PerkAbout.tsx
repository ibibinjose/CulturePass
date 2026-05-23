import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Perk } from './types';

interface PerkAboutProps {
  perk: Perk;
}

export function PerkAbout({ perk }: PerkAboutProps) {
  const colors = useColors();

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>{perk.title}</Text>
        <View style={styles.providerRow}>
          <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.providerText, { color: colors.textSecondary }]}>
            {perk.providerName || 'CulturePass'}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About this perk</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {perk.description || 'No description available.'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  providerText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 23,
  },
});
