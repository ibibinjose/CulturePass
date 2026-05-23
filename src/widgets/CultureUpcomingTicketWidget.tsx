import { HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  font,
  foregroundColor,
  frame,
  lineLimit,
  opacity,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import { Platform } from 'react-native';
import { CultureTokens } from '@/design-system/tokens/theme';

export type CultureUpcomingTicketWidgetProps = {
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  venue: string;
  ticketCode?: string;
  status: string;
  /** ISO string used to compute the countdown label */
  startsAtIso?: string;
};

const DEEP_LINK = 'culturepass://tickets';

function countdownLabel(iso?: string): string | null {
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

function statusAccent(status: string): string {
  if (status === 'used' || status === 'checked_in') return CultureTokens.teal;
  if (status === 'cancelled' || status === 'refunded') return CultureTokens.coral;
  return CultureTokens.gold;
}

const CultureUpcomingTicketLayout = (props: CultureUpcomingTicketWidgetProps) => {
  'widget';

  const when = [props.eventDate, props.eventTime].filter(Boolean).join(' · ');
  const countdown = countdownLabel(props.startsAtIso);
  const accent = statusAccent(props.status);

  return (
    <ZStack modifiers={[cornerRadius(20), widgetURL(DEEP_LINK)]}>
      {/* Background */}
      <VStack
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          background(CultureTokens.indigo),
        ]}
      >
        {null}
      </VStack>

      {/* Ticket watermark */}
      <Image
        systemName="ticket.fill"
        modifiers={[
          foregroundColor('#FFFFFF'),
          opacity(0.06),
          frame({ width: 90, height: 90 }),
        ]}
      />

      {/* Content */}
      <VStack
        spacing={4}
        alignment="leading"
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          padding({ all: 14 }),
        ]}
      >
        {/* Header */}
        <HStack spacing={6} alignment="center">
          <Image
            systemName="ticket.fill"
            modifiers={[foregroundColor(CultureTokens.gold), frame({ width: 11, height: 11 })]}
          />
          <Text
            modifiers={[
              font({ size: 9, weight: 'semibold' }),
              foregroundColor(CultureTokens.gold),
            ]}
          >
            NEXT TICKET
          </Text>
          <Spacer />
          {countdown ? (
            <Text
              modifiers={[
                font({ size: 9, weight: 'semibold' }),
                foregroundColor(accent),
              ]}
            >
              {countdown}
            </Text>
          ) : null}
        </HStack>

        <Spacer minLength={6} />

        {/* Title */}
        <Text
          modifiers={[
            font({ size: 15, weight: 'bold' }),
            lineLimit(2),
            foregroundColor('#FFFFFF'),
          ]}
        >
          {props.eventTitle}
        </Text>

        {/* Date + time */}
        <HStack spacing={5} alignment="center">
          <Image
            systemName="clock.fill"
            modifiers={[foregroundColor('#FFFFFF70'), frame({ width: 10, height: 10 })]}
          />
          <Text
            modifiers={[
              font({ size: 11 }),
              lineLimit(1),
              foregroundColor('#FFFFFFCC'),
            ]}
          >
            {when || 'Date TBA'}
          </Text>
        </HStack>

        {/* Venue */}
        {props.venue ? (
          <HStack spacing={5} alignment="center">
            <Image
              systemName="mappin.circle.fill"
              modifiers={[foregroundColor(CultureTokens.teal), frame({ width: 10, height: 10 })]}
            />
            <Text
              modifiers={[
                font({ size: 11 }),
                lineLimit(1),
                foregroundColor(CultureTokens.teal),
              ]}
            >
              {props.venue}
            </Text>
          </HStack>
        ) : null}

        {/* Code / CTA */}
        <Text
          modifiers={[
            font({ size: 9 }),
            lineLimit(1),
            foregroundColor('#FFFFFF55'),
            padding({ top: 2 }),
          ]}
        >
          {props.ticketCode ? `Code: ${props.ticketCode}` : 'Open app for QR'}
        </Text>
      </VStack>
    </ZStack>
  );
};

const CultureUpcomingTicketWidget = Platform.OS === 'ios'
  ? createWidget<CultureUpcomingTicketWidgetProps>(
      'CultureUpcomingTicketWidget',
      CultureUpcomingTicketLayout
    )
  : ({} as any);

export default CultureUpcomingTicketWidget;
