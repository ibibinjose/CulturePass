import React from 'react';
import { View, StyleSheet } from 'react-native';
import { M3Button } from '@/design-system/ui/M3Button';
import type { EventData } from '@/shared/schema';
import type { ColorTheme } from '@/design-system/tokens/colors';
import { Spacing } from '@/design-system/tokens/theme';

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
  isFreeOrOpen,
  handlePrimaryGoingPress,
  openTicketModal,
  rsvpMutation,
  myRsvp,
}: PrimaryActionSectionProps) {
  const isGoing = myRsvp === 'going';

  return (
    <View style={styles.container}>
      <M3Button
        variant={isGoing ? 'outlined' : 'filled'}
        fullWidth
        haptic
        loading={rsvpMutation.isPending}
        onPress={isFreeOrOpen ? handlePrimaryGoingPress : () => openTicketModal?.()}
        leftIcon={isGoing ? 'checkmark-circle' : isFreeOrOpen ? 'calendar' : 'ticket-outline'}
      >
        {isFreeOrOpen ? (isGoing ? "You're going" : "I'm Going") : 'Get Tickets'}
      </M3Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    gap: 12,
  },
});
