import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  font,
  foregroundColor,
  frame,
  lineLimit,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import { Platform } from 'react-native';
import { CultureTokens } from '@/design-system/tokens/theme';

export type CultureNearYouWidgetEvent = {
  title: string;
  startsAt: string;
  isFree?: boolean;
};

export type CultureNearYouWidgetProps = {
  locationLabel: string;
  events: CultureNearYouWidgetEvent[];
};

const DEEP_LINK = 'culturepass://city';

const CultureNearYouLayout = (props: CultureNearYouWidgetProps) => {
  'widget';

  const shown = props.events.slice(0, 3);
  const count = props.events.length;

  return (
    <VStack
      spacing={0}
      alignment="leading"
      modifiers={[
        padding({ all: 14 }),
        background('#0A0A0A'),
        cornerRadius(20),
        widgetURL(DEEP_LINK),
      ]}
    >
      {/* Header row */}
      <HStack spacing={6} alignment="center">
        <Image
          systemName="location.circle.fill"
          modifiers={[
            foregroundColor(CultureTokens.gold),
            frame({ width: 12, height: 12 }),
          ]}
        />
        <Text
          modifiers={[
            font({ size: 9, weight: 'semibold' }),
            foregroundColor(CultureTokens.gold),
          ]}
        >
          NEAR YOU
        </Text>
        <Spacer />
        {count > 0 ? (
          <Text
            modifiers={[
              font({ size: 9, weight: 'semibold' }),
              foregroundColor(CultureTokens.teal),
            ]}
          >
            {`${count} EVENT${count === 1 ? '' : 'S'}`}
          </Text>
        ) : null}
      </HStack>

      {/* Location label */}
      <Text
        modifiers={[
          font({ size: 10 }),
          lineLimit(1),
          foregroundColor('#FFFFFF60'),
          padding({ top: 3, bottom: 8 }),
        ]}
      >
        {props.locationLabel}
      </Text>

      {/* Event list */}
      {shown.length === 0 ? (
        <VStack spacing={4} modifiers={[frame({ maxWidth: 99999, maxHeight: 99999 })]}>
          <Spacer />
          <Text modifiers={[font({ size: 12 }), foregroundColor('#FFFFFF40')]}>
            No upcoming events.
          </Text>
          <Spacer />
        </VStack>
      ) : (
        <VStack spacing={7} alignment="leading" modifiers={[frame({ maxWidth: 99999 })]}>
          {shown.map((event, index) => (
            <HStack key={`${event.title}-${index}`} spacing={7} alignment="top">
              <Image
                systemName="circle.fill"
                modifiers={[
                  foregroundColor(
                    event.isFree ? CultureTokens.teal : CultureTokens.coral
                  ),
                  frame({ width: 5, height: 5 }),
                  padding({ top: 4 }),
                ]}
              />
              <VStack spacing={1} alignment="leading">
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'semibold' }),
                    lineLimit(1),
                    foregroundColor('#FFFFFF'),
                  ]}
                >
                  {event.title}
                </Text>
                <Text
                  modifiers={[
                    font({ size: 10 }),
                    lineLimit(1),
                    foregroundColor(CultureTokens.teal),
                  ]}
                >
                  {event.startsAt}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

const CultureNearYouWidget = Platform.OS === 'ios'
  ? createWidget<CultureNearYouWidgetProps>(
      'CultureNearYouWidget',
      CultureNearYouLayout
    )
  : ({} as any);

export default CultureNearYouWidget;
