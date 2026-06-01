import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';

export type HostInfoRow = { label: string; value: string };

export function HostspaceCreateVerifyCard({
  hostInfoVerified,
  onToggleVerified,
  hostInfoRows,
}: {
  hostInfoVerified: boolean;
  onToggleVerified: () => void;
  hostInfoRows: HostInfoRow[];
}) {
  const colors = useColors();

  return (
    <GlassView
      intensity={14}
      borderRadius={28}
      style={[
        styles.verifyCard,
        {
          backgroundColor: colors.surface + '90',
          borderColor: hostInfoVerified ? CultureTokens.teal + '70' : colors.borderLight,
        },
      ]}
      contentStyle={styles.verifyInner}
    >
      <View style={styles.verifyHeader}>
        <View style={[styles.verifyIcon, { backgroundColor: CultureTokens.indigo + '15' }]}>
          <Ionicons name="id-card-outline" size={22} color={CultureTokens.indigo} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.verifyTitle, { color: colors.text }]}>Verify host setup</Text>
          <Text style={[styles.verifySub, { color: colors.textSecondary }]}>
            Exported from your CulturePass account and host profile details. Confirm this is correct before creating.
          </Text>
        </View>
        <Pressable
          onPress={onToggleVerified}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hostInfoVerified }}
          accessibilityLabel="Verify host information"
          style={({ pressed }) => [
            styles.verifyCheck,
            {
              borderColor: hostInfoVerified ? CultureTokens.teal : colors.borderLight,
              backgroundColor: hostInfoVerified ? CultureTokens.teal : 'transparent',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {hostInfoVerified ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
        </Pressable>
      </View>

      <View style={styles.verifyGrid}>
        {hostInfoRows.map((row) => (
          <View
            key={row.label}
            style={[styles.verifyField, { borderColor: colors.borderLight, backgroundColor: colors.background + '70' }]}
          >
            <Text style={[styles.verifyLabel, { color: colors.textTertiary }]}>{row.label}</Text>
            <Text style={[styles.verifyValue, { color: colors.text }]} numberOfLines={2}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  verifyCard: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  verifyInner: {
    padding: Platform.OS === 'web' ? 18 : 20,
    gap: 16,
  },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  verifySub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
  },
  verifyCheck: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  verifyField: {
    flexGrow: 1,
    flexBasis: Platform.OS === 'web' ? 220 : '47%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  verifyLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  verifyValue: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
