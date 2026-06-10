import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '@/design-system/tokens/theme';
import { PassQrCode } from '@/modules/profile/components/digitalId/PassQrCode';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

/**
 * Apple Wallet–style Event Ticket Pass.
 * 
 * Anatomy (Apple eventTicket style):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  [accent header: logo · EVENT badge]                │
 *   │  [background strip / image area]                    │
 *   ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ┤
 *   │  Event Title                                        │
 *   │  Attendee · Date · Venue                            │
 *   ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ┤
 *   │                  [QR code]                          │
 *   │       Ticket code · "Scan at entry"                 │
 *   └─────────────────────────────────────────────────────┘
 *
 * Removed: confetti dots, barcode lines, "ADMIT ONE" inside badge
 *          (it's on the strip now), perforated dots (replaced with
 *          clean hairline separator), stubHint text.
 */

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

export function EventTicketPassPreview({
  width,
  attendeeName,
  eventTitle = 'Your next event',
  eventDate = 'Date TBA',
  venue,
  ticketCode = 'TICKET',
  qrValue,
  qrSize,
  accentColor = '#00ADEF',
  onPress,
}: EventTicketPassPreviewProps) {
  const height = Math.round(width * 0.72);
  const resolvedQrSize = qrSize ?? Math.min(Math.round(width * 0.38), 128);

  const card = (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          ...Platform.select({
            web: { boxShadow: '0 4px 20px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)' } as object,
            default: {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            },
          }),
        },
      ]}
    >
      {/* Header strip */}
      <LinearGradient
        colors={[accentColor, accentColor + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerStrip}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="planet-outline" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.headerBrand}>CulturePass</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerBadge}>EVENT</Text>
        </View>
      </LinearGradient>

      {/* Event info */}
      <View style={styles.eventSection}>
        <Text style={styles.eventTitle} numberOfLines={2} accessibilityRole="header">
          {eventTitle}
        </Text>
        <Text style={styles.attendee} numberOfLines={1}>{attendeeName}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem} numberOfLines={1}>{eventDate}</Text>
          {venue ? (
            <>
              <View style={styles.metaDot} />
              <Text style={[styles.metaItem, styles.metaVenue]} numberOfLines={1}>{venue}</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Hairline separator */}
      <View style={styles.separator} />

      {/* QR section */}
      <View style={styles.qrSection}>
        <View style={styles.qrWhiteBox}>
          <PassQrCode
            value={qrValue}
            size={resolvedQrSize}
            borderColor="transparent"
            accessibilityLabel={`Event ticket QR code ${ticketCode}`}
          />
        </View>
        <Text style={[styles.ticketCode, { color: accentColor }]}>{ticketCode}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.93 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="View event ticket"
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
    backgroundColor: WALLET_PASS_THEME.whiteHex,
    borderWidth: 1,
    borderColor: WALLET_PASS_THEME.borderOnWhite,
    overflow: 'hidden',
  },
  headerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBrand: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  headerRight: {},
  headerBadge: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  eventSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 3,
  },
  eventTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: WALLET_PASS_THEME.darkText,
    lineHeight: 22,
  },
  attendee: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: WALLET_PASS_THEME.mutedText,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'nowrap',
  },
  metaItem: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: WALLET_PASS_THEME.subtleText,
    flexShrink: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: WALLET_PASS_THEME.subtleText,
    opacity: 0.5,
    flexShrink: 0,
  },
  metaVenue: {
    flexShrink: 2,
  },
  separator: {
    marginHorizontal: 16,
    height: 0.5,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
  qrSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  qrWhiteBox: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 1px 8px rgba(15,23,42,0.08)' } as object,
    }),
  },
  ticketCode: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
});