/**
 * UpcomingTicketCard — persistent card shown at the top of Discover for events
 * starting within the next 24 hours.
 *
 * Shows up to 3 cards stacked, sorted by soonest event start (Req 4.3).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { getUpcomingTicketCards } from '@/lib/ticket-utils';
import { useColors } from '@/hooks/useColors';
import { FontFamily, Radius, Spacing, CultureTokens } from '@/design-system/tokens/theme';
import type { Ticket } from '@/shared/schema';

export default function UpcomingTicketCard() {
  const { userId, isAuthenticated } = useAuth();
  const colors = useColors();

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['tickets', 'user', userId],
    queryFn: () => api.tickets.forUser(userId!),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const cards = getUpcomingTicketCards(tickets, Date.now());

  if (cards.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {cards.map(({ ticket, countdown }) => (
        <Pressable
          key={ticket.id}
          onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } })}
          style={({ pressed }) => [
            styles.card,
            { borderColor: colors.border },
            pressed && { opacity: 0.9 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View ticket: ${ticket.eventTitle ?? 'Event'}. Starts in ${countdown}.`}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface + 'F0' }]} />
          )}

          <View style={styles.inner}>
            <View style={styles.left}>
              <Text style={[styles.badge, { backgroundColor: CultureTokens.coral + '22', color: CultureTokens.coral }]}>
                🎟 In {countdown}
              </Text>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {ticket.eventTitle ?? ticket.eventName ?? 'Upcoming Event'}
              </Text>
              {ticket.eventVenue ? (
                <Text style={[styles.venue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {ticket.eventVenue}
                </Text>
              ) : null}
            </View>
            <View style={[styles.viewBtn, { backgroundColor: CultureTokens.violet }]}>
              <Text style={styles.viewBtnText}>View Ticket</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 72,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  venue: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
});
