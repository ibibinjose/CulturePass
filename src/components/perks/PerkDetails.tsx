import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Perk } from './types';
import { CATEGORY_LABELS } from './constants';

interface PerkDetailsProps {
  perk: Perk;
  typeInfo: { icon: string; color: string; label: string; gradient: string };
}

export function PerkDetails({ perk, typeInfo }: PerkDetailsProps) {
  const colors = useColors();

  const isActive = perk.status === 'active';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
      <View style={styles.detailsGrid}>
        <View style={[styles.detailItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.detailIcon, { backgroundColor: typeInfo.color + '15' }]}>
            <Ionicons name="albums" size={18} color={typeInfo.color} />
          </View>
          <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Category</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {CATEGORY_LABELS[perk.category || ''] || perk.category || 'General'}
          </Text>
        </View>

        <View style={[styles.detailItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.detailIcon, { backgroundColor: typeInfo.color + '15' }]}>
            <Ionicons name="business" size={18} color={typeInfo.color} />
          </View>
          <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Provider</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {perk.providerType === 'platform'
              ? 'CulturePass'
              : perk.providerType === 'business'
                ? 'Business'
                : 'Partner'}
          </Text>
        </View>

        {perk.perUserLimit ? (
          <View style={[styles.detailItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.detailIcon, { backgroundColor: CultureTokens.gold + '20' }]}>
              <Ionicons name="person" size={18} color={CultureTokens.gold} />
            </View>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Limit</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{perk.perUserLimit}/user</Text>
          </View>
        ) : null}

        <View style={[styles.detailItem, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.detailIcon,
              { backgroundColor: isActive ? CultureTokens.emerald + '20' : CultureTokens.coral + '15' },
            ]}
          >
            <Ionicons
              name={isActive ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={isActive ? CultureTokens.emerald : CultureTokens.coral}
            />
          </View>
          <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Status</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '47%' as any,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },
});
