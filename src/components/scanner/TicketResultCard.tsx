import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TicketScanResult } from './types';
import { getOutcomeConfig } from './utils';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Button } from '@/design-system/ui/Button';

export function TicketResultCard({
  result,
  onClose,
  onScanNext,
  onPrintBadge,
}: {
  result: TicketScanResult;
  onClose: () => void;
  onScanNext: () => void;
  onPrintBadge: () => void;
}) {
  const colors = useColors();
  const { isMobile } = useLayout();
  const cfg = getOutcomeConfig(result);
  const t = result.ticket;

  return (
    <Animated.View entering={FadeInUp.springify().damping(18)} style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <LinearGradient
          colors={[cfg.color + '22', cfg.color + '08']}
          style={styles.heroBand}
        >
          <View style={[styles.statusIcon, { backgroundColor: cfg.color + '20' }]}>
            <Ionicons name={cfg.icon as never} size={28} color={cfg.color} />
          </View>
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { color: cfg.color }]}>{cfg.title}</Text>
            <Text style={[styles.statusMsg, { color: colors.textSecondary }]} numberOfLines={2}>
              {result.message}
            </Text>
          </View>
        </LinearGradient>

        {t ? (
          <View style={styles.details}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {t.eventTitle}
            </Text>
            <View style={styles.metaGrid}>
              {t.eventDate ? (
                <Meta icon="calendar-outline" text={t.eventDate} colors={colors} />
              ) : null}
              {t.eventTime ? <Meta icon="time-outline" text={t.eventTime} colors={colors} /> : null}
              {t.eventVenue ? (
                <Meta icon="location-outline" text={t.eventVenue} colors={colors} full />
              ) : null}
            </View>
            <View style={styles.chips}>
              {t.tierName ? (
                <View style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.chipText, { color: colors.primary }]}>{t.tierName}</Text>
                </View>
              ) : null}
              {t.ticketCode ? (
                <View style={[styles.chip, { backgroundColor: cfg.color + '12' }]}>
                  <Text style={[styles.chipText, { color: cfg.color }]}>{t.ticketCode}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={[styles.actions, { borderTopColor: colors.borderLight }, isMobile && styles.actionsStack]}>
          <Button variant="primary" fullWidth={isMobile} onPress={onScanNext} leftIcon="scan-outline">
            Scan next
          </Button>
          <View style={[styles.secondaryRow, isMobile && styles.secondaryRowStack]}>
            <Button variant="outline" style={styles.secondaryBtn} onPress={onClose}>
              Done
            </Button>
            {t?.id ? (
              <Button variant="ghost" style={styles.secondaryBtn} onPress={onPrintBadge} leftIcon="print-outline">
                Print
              </Button>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function Meta({
  icon,
  text,
  colors,
  full,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: ReturnType<typeof useColors>;
  full?: boolean;
}) {
  return (
    <View style={[styles.metaItem, full && styles.metaFull]}>
      <Ionicons name={icon} size={14} color={colors.textTertiary} />
      <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={full ? 2 : 1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } as Record<string, unknown>,
    }),
  },
  heroBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: { flex: 1, gap: 4 },
  statusTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.4 },
  statusMsg: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20 },
  details: { paddingHorizontal: 18, paddingBottom: 16, gap: 12 },
  eventTitle: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '48%' },
  metaFull: { maxWidth: '100%' },
  metaText: { fontSize: 13, fontFamily: FontFamily.medium, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  chipText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.4 },
  actions: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsStack: {},
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryRowStack: { flexDirection: 'column' },
  secondaryBtn: { flex: 1 },
});
