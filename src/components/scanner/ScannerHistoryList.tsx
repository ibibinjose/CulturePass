import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { TicketScanResult } from './types';
import { getOutcomeConfig } from './utils';

type Props = {
  history: TicketScanResult[];
};

export function ScannerHistoryList({ history }: Props) {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>Recent scans</Text>
      {history.map((item, idx) => {
        const cfg = getOutcomeConfig(item);
        return (
          <View
            key={`${item.scannedAt}-${idx}`}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <View style={[styles.icon, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon as never} size={16} color={cfg.color} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.event, { color: colors.text }]} numberOfLines={1}>
                {item.ticket?.eventTitle || 'Ticket'}
              </Text>
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                {cfg.title} · {new Date(item.scannedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8, marginTop: 4 },
  title: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  event: { fontSize: 14, fontFamily: FontFamily.semibold },
  meta: { fontSize: 12, fontFamily: FontFamily.regular },
});
