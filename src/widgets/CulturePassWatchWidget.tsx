import { AccessoryWidgetBackground, HStack, Image, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
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

/**
 * Lock Screen + Apple Watch Smart Stack glance.
 * Declared families: accessoryCircular, accessoryRectangular, accessoryInline.
 *
 * macOS 13+: the same WidgetKit code path renders this widget in the macOS
 * widget gallery when systemSmall/systemMedium are added to app.json.
 */
export type CulturePassWatchWidgetProps = {
  line1: string;
  line2?: string;
  /** Optional deep-link URL opened when the widget is tapped */
  deepLink?: string;
};

const CulturePassWatchLayout = (props: CulturePassWatchWidgetProps) => {
  'widget';

  const url = props.deepLink ?? 'culturepass://';

  return (
    <ZStack modifiers={[widgetURL(url), padding({ all: 4 })]}>
      {/* Accessory-family background (tinted on Apple Watch / vibrancy on Lock Screen) */}
      <AccessoryWidgetBackground modifiers={[frame({ maxWidth: 99999, maxHeight: 99999 })]} />

      {/* Content */}
      <HStack spacing={5} alignment="center">
        <Image
          systemName="music.note.house.fill"
          modifiers={[
            foregroundColor(CultureTokens.gold),
            frame({ width: 14, height: 14 }),
          ]}
        />
        <VStack spacing={1} alignment="leading">
          <Text
            modifiers={[
              font({ size: 13, weight: 'bold' }),
              lineLimit(1),
              foregroundColor('#FFFFFF'),
            ]}
          >
            {props.line1}
          </Text>
          {props.line2 ? (
            <Text
              modifiers={[
                font({ size: 10 }),
                lineLimit(1),
                foregroundColor(CultureTokens.gold),
              ]}
            >
              {props.line2}
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </ZStack>
  );
};

const CulturePassWatchWidget = Platform.OS === 'ios'
  ? createWidget<CulturePassWatchWidgetProps>(
      'CulturePassWatchWidget',
      CulturePassWatchLayout
    )
  : ({} as any);

export default CulturePassWatchWidget;
