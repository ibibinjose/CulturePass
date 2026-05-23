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
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';
import { Platform } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { CultureTokens } from '@/design-system/tokens/theme';

export type CultureLiveEventTrackerProps = {
  eventTitle: string;
  venue?: string;
  startsAt?: string;
  status: 'upcoming' | 'doors_open' | 'checked_in' | 'finished';
};

type StatusMeta = { label: string; bg: string; accent: string; icon: SFSymbol };

const STATUS: Record<CultureLiveEventTrackerProps['status'], StatusMeta> = {
  upcoming:   { label: 'UPCOMING',    bg: '#0F0E2E', accent: CultureTokens.indigo, icon: 'clock.fill' as SFSymbol },
  doors_open: { label: 'DOORS OPEN',  bg: '#042F2E', accent: CultureTokens.teal,  icon: 'door.left.hand.open' as SFSymbol },
  checked_in: { label: 'CHECKED IN',  bg: '#14532D', accent: '#22C55E',            icon: 'checkmark.seal.fill' as SFSymbol },
  finished:   { label: 'ENDED',       bg: '#1C1C1E', accent: '#8E8E93',            icon: 'flag.checkered' as SFSymbol },
};

const CultureLiveEventTrackerLayout = (props: CultureLiveEventTrackerProps) => {
  'widget';

  const meta = STATUS[props.status] ?? STATUS.upcoming;

  return {
    // ─── Lock Screen Dynamic Island banner ───────────────────────────
    banner: (
      <ZStack modifiers={[cornerRadius(18)]}>
        {/* Background */}
        <VStack
          modifiers={[
            frame({ maxWidth: 99999, maxHeight: 99999 }),
            background(meta.bg),
          ]}
        >
          {null}
        </VStack>

        {/* Decorative watermark */}
        <Image
          systemName="music.note.house"
          modifiers={[
            foregroundColor('#FFFFFF'),
            opacity(0.05),
            frame({ width: 80, height: 80 }),
          ]}
        />

        {/* Main content */}
        <VStack
          spacing={6}
          alignment="leading"
          modifiers={[
            frame({ maxWidth: 99999, maxHeight: 99999 }),
            padding({ all: 16 }),
          ]}
        >
          {/* Status row */}
          <HStack spacing={6} alignment="center">
            <Image
              systemName={meta.icon}
              modifiers={[foregroundColor(meta.accent), frame({ width: 13, height: 13 })]}
            />
            <Text
              modifiers={[font({ size: 10, weight: 'semibold' }), foregroundColor(meta.accent)]}
            >
              {`LIVE EVENT  ·  ${meta.label}`}
            </Text>
            <Spacer />
            <Text
              modifiers={[font({ size: 10, weight: 'bold' }), foregroundColor(CultureTokens.gold)]}
            >
              CP
            </Text>
          </HStack>

          {/* Event title */}
          <Text
            modifiers={[
              font({ size: 16, weight: 'bold' }),
              lineLimit(2),
              foregroundColor('#FFFFFF'),
            ]}
          >
            {props.eventTitle}
          </Text>

          {/* Venue + time */}
          <HStack spacing={14} alignment="center">
            {props.startsAt ? (
              <HStack spacing={5} alignment="center">
                <Image
                  systemName="clock.fill"
                  modifiers={[foregroundColor('#FFFFFF60'), frame({ width: 10, height: 10 })]}
                />
                <Text
                  modifiers={[font({ size: 12 }), foregroundColor('#FFFFFF90')]}
                >
                  {props.startsAt}
                </Text>
              </HStack>
            ) : null}
            {props.venue ? (
              <HStack spacing={5} alignment="center">
                <Image
                  systemName="mappin.circle.fill"
                  modifiers={[foregroundColor(CultureTokens.teal), frame({ width: 10, height: 10 })]}
                />
                <Text
                  modifiers={[
                    font({ size: 12 }),
                    lineLimit(1),
                    foregroundColor(CultureTokens.teal),
                  ]}
                >
                  {props.venue}
                </Text>
              </HStack>
            ) : null}
          </HStack>
        </VStack>
      </ZStack>
    ),

    // ─── Dynamic Island compact ──────────────────────────────────────
    compactLeading: (
      <Image
        systemName={meta.icon}
        modifiers={[foregroundColor(meta.accent), frame({ width: 16, height: 16 })]}
      />
    ),

    compactTrailing: (
      <Text
        modifiers={[
          font({ size: 11, weight: 'semibold' }),
          lineLimit(1),
          foregroundColor(meta.accent),
        ]}
      >
        {meta.label}
      </Text>
    ),

    // ─── Dynamic Island minimal (small pill) ────────────────────────
    minimal: (
      <Image
        systemName={meta.icon}
        modifiers={[foregroundColor(meta.accent), frame({ width: 14, height: 14 })]}
      />
    ),
  };
};

const CultureLiveEventTracker = Platform.OS === 'ios'
  ? createLiveActivity<CultureLiveEventTrackerProps>(
      'WidgetLiveActivity',
      CultureLiveEventTrackerLayout
    )
  : ({} as any);

export default CultureLiveEventTracker;
