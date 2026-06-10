import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, CultureTokens } from '@/design-system/tokens/theme';
import { TICKET_PRINT } from '@/design-system/tokens/ticketPrintTokens';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

export type EventTicketPassPreviewProps = {
  width: number;
  attendeeName: string;
  eventTitle?: string;
  eventDate?: string;
  venue?: string;
  ticketCode?: string;
  qrValue: string;
  qrSize?: number;
  accentColor?: string;
  onPress?: () => void;
};

/** Event ticket pass template — respectful, high-contrast layout aligned with CulturePass wallet passes. */
export function EventTicketPassPreview({
  width,
  attendeeName,
  eventTitle = 'Your next event',
  eventDate = 'Date TBA',
  venue,
  ticketCode = 'TICKET',
  qrValue,
  qrSize,
  accentColor = CultureTokens.indigo,
  onPress,
}: EventTicketPassPreviewProps) {
  const height = Math.round(width * 0.64);
  const resolvedQrSize = qrSize ?? Math.min(72, Math.round(width * 0.22));

  const card = (
    <View style={[styles.card, { width, height, borderColor: TICKET_PRINT.cardBorder }]}>
      <View style={[styles.strip, { backgroundColor: accentColor }]}>
        <Text style={styles.stripBrand}>CULTUREPASS</Text>
        <Text style={styles.stripTier}>EVENT</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.eventTitle} numberOfLines={2} accessibilityRole="header">
            {eventTitle}
          </Text>
          <Text style={styles.attendee} numberOfLines={1}>{attendeeName}</Text>
          <Text style={styles.date} numberOfLines={1}>{eventDate}</Text>
          {venue ? <Text style={styles.venue} numberOfLines={1}>{venue}</Text> : null}
          <View style={styles.codeRow}>
            <Ionicons name="ticket-outline" size={12} color={accentColor} />
            <Text style={[styles.code, { color: accentColor }]} numberOfLines={1}>{ticketCode}</Text>
          </View>
        </View>
        <PassQrCode
          value={qrValue}
          size={resolvedQrSize}
          logoRatio={0.2}
          accessibilityLabel={`Event ticket QR code ${ticketCode}`}
        />
      </View>
      <Text style={styles.footerNote}>Present at venue · Keep ticket private</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel="View your event tickets"
      >
        {card}
      </Pressable>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: TICKET_PRINT.surface,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)' } as object,
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stripBrand: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: TICKET_PRINT.textInverse,
    letterSpacing: 1.4,
  },
  stripTier: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: TICKET_PRINT.badgeBrandMuted,
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  meta: { flex: 1, gap: 3, minWidth: 0 },
  eventTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: TICKET_PRINT.text,
    lineHeight: 18,
  },
  attendee: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: TICKET_PRINT.textSecondary,
  },
  date: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: TICKET_PRINT.textSecondary,
  },
  venue: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: TICKET_PRINT.textSecondary,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  code: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: WALLET_PASS_THEME.mutedText,
    textAlign: 'center',
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
});