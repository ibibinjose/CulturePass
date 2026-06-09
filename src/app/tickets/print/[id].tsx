import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/modules/api';
import type { Ticket, User } from '@/shared/schema';
import { TICKET_PRINT } from '@/design-system/tokens/ticketPrintTokens';
import { goBackOrReplace } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';

type TicketPrintLayout = 'full' | 'badge';

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return 'TBA';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PrintableBadge({ ticket, attendeeName }: { ticket: Ticket; attendeeName: string }) {
  return (
    <View style={styles.badgeWrap}>
      <View style={styles.badgeHole} />
      <View style={styles.badgeCard}>
        <View style={[styles.badgeTop, { backgroundColor: ticket.imageColor ?? TICKET_PRINT.primary }]}>
          <Text style={styles.badgeBrand} numberOfLines={1}>CulturePass</Text>
          <Text style={styles.badgeEvent} numberOfLines={1}>{ticket.eventTitle ?? ticket.eventName ?? 'Event Ticket'}</Text>
        </View>
        <View style={styles.badgeBody}>
          <Text style={styles.badgeName} numberOfLines={1}>{attendeeName}</Text>
          <Text style={styles.badgeMeta} numberOfLines={1}>{formatEventDate(ticket.eventDate ?? ticket.date)}</Text>
          {ticket.eventVenue ? <Text style={styles.badgeMeta} numberOfLines={1}>{ticket.eventVenue}</Text> : null}
          <View style={styles.badgeBottom}>
            <View style={styles.badgeCodePill}>
              <Ionicons name="qr-code-outline" size={12} color={TICKET_PRINT.primary} />
              <Text style={styles.badgeCode} numberOfLines={1}>{ticket.ticketCode ?? ticket.qrCode ?? 'TICKET'}</Text>
            </View>
            <Text style={styles.badgeQty} numberOfLines={1}>x{ticket.quantity ?? 1}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PrintableFull({ ticket, attendeeName }: { ticket: Ticket; attendeeName: string }) {
  return (
    <View style={styles.fullCard}>
      <View style={[styles.fullHeader, { backgroundColor: ticket.imageColor ?? TICKET_PRINT.primary }]}>
        <Text style={styles.fullHeaderTitle} numberOfLines={1}>CulturePass Event Ticket</Text>
      </View>
      <View style={styles.fullBody}>
        <Text style={styles.fullEvent} numberOfLines={2}>{ticket.eventTitle ?? ticket.eventName ?? 'Event Ticket'}</Text>
        <View style={styles.fullRow}>
          <Text style={styles.fullLabel} numberOfLines={1}>Attendee</Text>
          <Text style={styles.fullValue} numberOfLines={2}>{attendeeName}</Text>
        </View>
        <View style={styles.fullRow}>
          <Text style={styles.fullLabel} numberOfLines={1}>Date</Text>
          <Text style={styles.fullValue} numberOfLines={1}>{formatEventDate(ticket.eventDate ?? ticket.date)}</Text>
        </View>
        <View style={styles.fullRow}>
          <Text style={styles.fullLabel} numberOfLines={1}>Time</Text>
          <Text style={styles.fullValue} numberOfLines={1}>{ticket.eventTime ?? 'TBA'}</Text>
        </View>
        <View style={styles.fullRow}>
          <Text style={styles.fullLabel} numberOfLines={1}>Venue</Text>
          <Text style={styles.fullValue} numberOfLines={2}>{ticket.eventVenue ?? 'TBA'}</Text>
        </View>
        <View style={styles.fullRow}>
          <Text style={styles.fullLabel} numberOfLines={1}>Tier</Text>
          <Text style={styles.fullValue} numberOfLines={1}>{ticket.tierName ?? 'General'}</Text>
        </View>
        <View style={styles.fullRow}>
          <Text style={styles.fullLabel} numberOfLines={1}>Ticket Code</Text>
          <Text style={styles.fullCode} numberOfLines={1}>{ticket.ticketCode ?? ticket.qrCode ?? 'TICKET'}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TicketPrintScreen() {
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ id?: string; layout?: string; autoPrint?: string }>();
  const ticketId = String(params.id ?? '');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(routeWithRedirect('/(onboarding)/login', `/tickets/print/${ticketId}`));
    }
  }, [isAuthenticated, ticketId]);
  const [layout, setLayout] = useState<TicketPrintLayout>(params.layout === 'badge' ? 'badge' : 'full');

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId, 'print'],
    queryFn: () => modulesApi.tickets.get(ticketId),
    enabled: Boolean(ticketId),
  });

  const { data: attendee } = useQuery<User>({
    queryKey: ['ticket', ticketId, 'attendee', ticket?.userId ?? ''],
    queryFn: () => modulesApi.users.get(String(ticket?.userId)),
    enabled: Boolean(ticket?.userId),
  });

  const attendeeName = useMemo(
    () => attendee?.displayName ?? attendee?.username ?? 'CulturePass Guest',
    [attendee?.displayName, attendee?.username]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (params.autoPrint !== '1') return;
    if (!ticket) return;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [params.autoPrint, ticket]);

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
      return;
    }
    Alert.alert('Print', 'Printing is available on web. Open this ticket on web to print.');
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={TICKET_PRINT.primary} />
        <Text style={styles.centerText} numberOfLines={2}>Loading printable ticket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="ticket-outline" size={36} color={TICKET_PRINT.textSecondary} />
        <Text style={styles.centerText} numberOfLines={1}>Ticket not found</Text>
        <Pressable style={styles.backBtn} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.backBtnText} numberOfLines={1}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable style={styles.toolbarBtn} onPress={() => goBackOrReplace('/(tabs)')}>
          <Ionicons name="chevron-back" size={18} color={TICKET_PRINT.text} />
          <Text style={styles.toolbarBtnText} numberOfLines={1}>Back</Text>
        </Pressable>
        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchBtn, layout === 'full' && styles.switchBtnActive]}
            onPress={() => setLayout('full')}
          >
            <Text style={[styles.switchText, layout === 'full' && styles.switchTextActive]} numberOfLines={1}>Full Ticket</Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, layout === 'badge' && styles.switchBtnActive]}
            onPress={() => setLayout('badge')}
          >
            <Text style={[styles.switchText, layout === 'badge' && styles.switchTextActive]} numberOfLines={1}>Badge / Lanyard</Text>
          </Pressable>
        </View>
        <Pressable style={styles.toolbarPrimary} onPress={handlePrint}>
          <Ionicons name="print-outline" size={16} color={TICKET_PRINT.textInverse} />
          <Text style={styles.toolbarPrimaryText} numberOfLines={1}>Print</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.printArea}>
        {layout === 'badge' ? (
          <PrintableBadge ticket={ticket} attendeeName={attendeeName} />
        ) : (
          <PrintableFull ticket={ticket} attendeeName={attendeeName} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TICKET_PRINT.pageBg },
  toolbar: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TICKET_PRINT.toolbarBorder,
    backgroundColor: TICKET_PRINT.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolbarBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: TICKET_PRINT.text },
  toolbarPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TICKET_PRINT.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolbarPrimaryText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: TICKET_PRINT.textInverse },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: TICKET_PRINT.switchTrack,
    borderRadius: 10,
    padding: 3,
    flex: 1,
    maxWidth: 320,
  },
  switchBtn: { flex: 1, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  switchBtnActive: { backgroundColor: TICKET_PRINT.surface },
  switchText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: TICKET_PRINT.text },
  switchTextActive: { color: TICKET_PRINT.text, fontFamily: 'Poppins_600SemiBold' },
  printArea: { padding: 24, alignItems: 'center' },

  fullCard: {
    width: 720,
    maxWidth: '100%',
    borderRadius: 16,
    backgroundColor: TICKET_PRINT.surface,
    borderWidth: 1,
    borderColor: TICKET_PRINT.cardBorder,
    overflow: 'hidden',
  },
  fullHeader: { paddingHorizontal: 24, paddingVertical: 16 },
  fullHeaderTitle: { color: TICKET_PRINT.textInverse, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  fullBody: { padding: 22, gap: 10 },
  fullEvent: { fontSize: 23, fontFamily: 'Poppins_700Bold', color: TICKET_PRINT.text, marginBottom: 4 },
  fullRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: TICKET_PRINT.rowDivider,
    paddingBottom: 8,
  },
  fullLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: TICKET_PRINT.text },
  fullValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: TICKET_PRINT.text, maxWidth: '65%', textAlign: 'right' },
  fullCode: { fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: 1, color: TICKET_PRINT.primary },

  badgeWrap: { alignItems: 'center', marginTop: 8 },
  badgeHole: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TICKET_PRINT.badgeHole,
    marginBottom: -15,
    zIndex: 2,
    borderWidth: 8,
    borderColor: TICKET_PRINT.pageBg,
  },
  badgeCard: {
    width: 340,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TICKET_PRINT.badgeBorder,
    backgroundColor: TICKET_PRINT.surface,
  },
  badgeTop: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 },
  badgeBrand: { color: TICKET_PRINT.badgeBrandMuted, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  badgeEvent: { color: TICKET_PRINT.textInverse, fontSize: 17, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  badgeBody: { paddingHorizontal: 16, paddingVertical: 14 },
  badgeName: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: TICKET_PRINT.text },
  badgeMeta: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: TICKET_PRINT.text, marginTop: 4 },
  badgeBottom: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TICKET_PRINT.primary + '12',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeCode: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: TICKET_PRINT.primary, letterSpacing: 0.6 },
  badgeQty: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: TICKET_PRINT.text },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  centerText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: TICKET_PRINT.text },
  backBtn: { backgroundColor: TICKET_PRINT.primary + '12', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  backBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: TICKET_PRINT.primary },
});