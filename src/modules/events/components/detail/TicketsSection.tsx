import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/currency';
import { FontFamily, Spacing, CultureTokens, M3Typography } from '@/design-system/tokens/theme';
import type { EventData } from '@/shared/schema';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { M3Card } from '@/design-system/ui/M3Card';
import { useM3Colors } from '@/hooks/useM3Colors';

interface TicketTier {
  name: string;
  priceCents: number;
  available: number;
}

interface TicketsSectionProps {
  event: EventData;
  eventTiers: TicketTier[];
  openTicketModal: (tierIndex?: number) => void;
  colors: ColorTheme;
  s?: Record<string, unknown>;
}

export function TicketsSection({ event, eventTiers, openTicketModal, colors }: TicketsSectionProps) {
  const m3Colors = useM3Colors();

  if (!eventTiers || eventTiers.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: m3Colors.outlineVariant }]}>
        <Ionicons name="information-circle-outline" size={20} color={m3Colors.onSurfaceVariant} />
        <Text style={[styles.emptyText, { color: m3Colors.onSurfaceVariant }]}>
          No ticket tiers available at this time.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {eventTiers.map((tier, index) => (
        <M3Card
          key={`${tier.name}-${index}`}
          variant="outlined"
          onPress={() => openTicketModal(index)}
          style={styles.tierCard}
        >
            <View style={styles.tierContent}>
                <View style={styles.tierInfo}>
                    <Text style={[styles.tierName, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{tier.name}</Text>
                    <View style={styles.availRow}>
                        <View style={[styles.availDot, { backgroundColor: tier.available > 0 ? CultureTokens.emerald : CultureTokens.coral }]} />
                        <Text style={[styles.tierAvail, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                        {tier.available > 0 ? `${tier.available} spots left` : 'Sold out'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.priceBox, { backgroundColor: m3Colors.primaryContainer }]}>
                    <Text style={[styles.priceText, M3Typography.labelLarge, { color: m3Colors.onPrimaryContainer }]}>
                    {tier.priceCents === 0 ? 'FREE' : formatCurrency(tier.priceCents, event.country)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={m3Colors.onSurfaceVariant} />
            </View>
        </M3Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, marginBottom: Spacing.lg },
  tierCard: {
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  tierInfo: { flex: 1, gap: 4 },
  tierName: { letterSpacing: -0.2 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  tierAvail: {},
  priceBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {},
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 14, fontFamily: FontFamily.medium },
});
