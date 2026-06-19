import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import type { EventData } from '@/shared/schema';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { Spacing } from '@/design-system/tokens/theme';
import { externalTicketProviderLabel, usesExternalTicketing } from '@/modules/events/utils/externalTicketing';

interface PrimaryActionSectionProps {
  event: EventData;
  saved: boolean;
  isFreeOrOpen: boolean;
  myRsvp: 'going' | 'maybe' | 'not_going' | null;
  userId: string | null;
  pathname: string;
  rsvpMutation: { isPending: boolean };
  handlePrimaryGoingPress: () => void;
  handleRsvp: (status: 'going' | 'maybe' | 'not_going') => void;
  handleExternalTicketPress?: () => void;
  openTicketModal?: (tierIndex?: number) => void;
  handleShare: () => void;
  handleSave: () => void;
  colors: ColorTheme;
  s: Record<string, unknown>;
}

export function PrimaryActionSection({
  event,
  isFreeOrOpen,
  handlePrimaryGoingPress,
  handleExternalTicketPress,
  openTicketModal,
  rsvpMutation,
  myRsvp,
}: PrimaryActionSectionProps) {
  const isGoing = myRsvp === 'going';
  const externalTickets = usesExternalTicketing(event);
  const provider = externalTicketProviderLabel(event);

  const label = externalTickets
    ? `Buy on ${provider}`
    : isFreeOrOpen
      ? isGoing
        ? "You're going"
        : "I'm Going"
      : 'Get Tickets';

  const onPress = externalTickets
    ? handleExternalTicketPress
    : isFreeOrOpen
      ? handlePrimaryGoingPress
      : () => openTicketModal?.();

  const leftIcon = externalTickets
    ? 'open-outline'
    : isGoing
      ? 'checkmark-circle'
      : isFreeOrOpen
        ? 'calendar'
        : 'ticket-outline';

  return (
    <View style={styles.container}>
      <LuxeButton
        variant={isGoing && !externalTickets ? 'glass' : 'filled'}
        size="lg"
        fullWidth
        haptic
        loading={rsvpMutation.isPending}
        onPress={onPress}
        leftIcon={leftIcon}
      >
        {label}
      </LuxeButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    gap: 12,
  },
});