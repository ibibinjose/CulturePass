import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CardTokens, CultureTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import type { WidgetUpcomingTicketItem } from '@/lib/api';

interface WidgetUpcomingTicketCardProps {
  item: WidgetUpcomingTicketItem | null;
}

function formatStart(iso: string | null | undefined): string {
  if (!iso) return 'Date TBA';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Date TBA';
  return parsed.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function countdownLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const days = Math.floor((ms - Date.now()) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  if (days <= 7) return `IN ${days} DAYS`;
  return null;
}

function statusChipColor(status: string): { bg: string; text: string } {
  if (status === 'used' || status === 'checked_in') return { bg: CultureTokens.teal + '20', text: CultureTokens.teal };
  if (status === 'cancelled' || status === 'refunded') return { bg: CultureTokens.coral + '20', text: CultureTokens.coral };
  return { bg: CultureTokens.indigo + '20', text: CultureTokens.indigo };
}

export function WidgetUpcomingTicketCard({ item }: WidgetUpcomingTicketCardProps) {
  const colors = useColors();

  if (!item) {
    return (
      <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No active tickets.
          </Text>
          <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
            Book an event to see it here.
          </Text>
        </View>
      </View>
    );
  }

  const ticket = item.ticket;
  const event = item.event;

  const eventTitle = event?.title ?? ticket.eventTitle ?? ticket.eventName ?? 'CulturePass Ticket';
  const venue = event?.venue ?? ticket.eventVenue ?? 'See event details';
  const dateIso = item.startsAt ?? (event?.date && event?.time ? `${event.date}T${event.time}` : null);
  const dateLabel = formatStart(dateIso);
  const countdown = countdownLabel(item.startsAt);
  const chipColors = statusChipColor(ticket.status);
  const ticketId = ticket.id;

  return (
    <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
      <Pressable
        style={[styles.ticketBody, { borderColor: CultureTokens.indigo + '25' }]}
        onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: ticketId } })}
        accessibilityRole="button"
        accessibilityLabel={`Open ticket: ${eventTitle}`}
      >
        {/* Subtle gradient top-bar */}
        <LinearGradient
          colors={[CultureTokens.indigo + '18', 'transparent']}
          style={styles.gradientBar}
        />

        {/* Main content row */}
        <View style={styles.contentRow}>
          <View style={styles.textBlock}>
            {/* Countdown + status */}
            <View style={styles.metaTopRow}>
              {countdown ? (
                <View style={[styles.countdownChip, { backgroundColor: CultureTokens.gold + '20' }]}>
                  <Ionicons name="time-outline" size={10} color={CultureTokens.gold} />
                  <Text style={[styles.countdownText, { color: CultureTokens.gold }]}>
                    {countdown}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.statusChip, { backgroundColor: chipColors.bg }]}>
                <Text style={[styles.statusText, { color: chipColors.text }]}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {eventTitle}
            </Text>

            {/* Date */}
            <View style={styles.metaRow}>
              <Ionicons name="time" size={13} color={CultureTokens.indigo} />
              <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                {dateLabel}
              </Text>
            </View>

            {/* Venue */}
            <View style={styles.metaRow}>
              <Ionicons name="location" size={13} color={colors.textTertiary} />
              <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
                {venue}
              </Text>
            </View>
          </View>

          {/* QR stub */}
          <View style={[styles.qrStub, {
            backgroundColor: CultureTokens.indigo + '12',
            borderColor: CultureTokens.indigo + '35',
          }]}>
            <Ionicons name="qr-code" size={26} color={CultureTokens.indigo} />
            <Text style={[styles.qrLabel, { color: CultureTokens.indigo }]}>
              QR
            </Text>
          </View>
        </View>

        {/* Ticket code */}
        {ticket.ticketCode ? (
          <View style={[styles.codeRow, { borderTopColor: colors.divider }]}>
            <Text style={[styles.codeLabel, { color: colors.textTertiary }]}>Code</Text>
            <Text style={[styles.codeValue, { color: colors.text }]} numberOfLines={1}>
              {ticket.ticketCode}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1,
    padding: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  ticketBody: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBar: {
    height: 3,
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 5,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  countdownText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  qrStub: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flexShrink: 0,
  },
  qrLabel: {
    fontSize: 8,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  codeLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  codeValue: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    flex: 1,
  },
});
