import { Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
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

export type CultureSpotlightWidgetProps = {
  title: string;
  subtitle?: string;
  city?: string;
  startsAt?: string;
  category?: string;
};

const DEEP_LINK = 'culturepass://discover';

const CultureSpotlightLayout = (props: CultureSpotlightWidgetProps) => {
  'widget';

  const footerParts: string[] = [];
  if (props.city) footerParts.push(props.city);
  if (props.startsAt) footerParts.push(props.startsAt);
  const footer = footerParts.join(' · ');
  const headerLabel = props.category
    ? `★  ${props.category.toUpperCase()}`
    : '★  SPOTLIGHT';

  return (
    <ZStack modifiers={[cornerRadius(20), widgetURL(DEEP_LINK)]}>
      {/* Solid dark background */}
      <VStack
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          background('#0F0E2E'),
        ]}
      >
        {null}
      </VStack>

      {/* Decorative accent circle — top-right */}
      <Image
        systemName="sparkles"
        modifiers={[
          foregroundColor(CultureTokens.violet),
          opacity(0.18),
          frame({ width: 80, height: 80 }),
        ]}
      />

      {/* Content layer */}
      <VStack
        spacing={4}
        alignment="leading"
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          padding({ all: 16 }),
        ]}
      >
        {/* Eyebrow */}
        <Text
          modifiers={[
            font({ size: 9, weight: 'semibold' }),
            foregroundColor(CultureTokens.gold),
          ]}
        >
          {headerLabel}
        </Text>

        {/* Flexible gap pushes body to bottom */}
        <Spacer minLength={6} />

        {/* Main title */}
        <Text
          modifiers={[
            font({ size: 16, weight: 'bold' }),
            lineLimit(2),
            foregroundColor('#FFFFFF'),
          ]}
        >
          {props.title}
        </Text>

        {/* Subtitle */}
        <Text
          modifiers={[
            font({ size: 11 }),
            lineLimit(2),
            foregroundColor('#FFFFFFB0'),
          ]}
        >
          {props.subtitle ?? 'Featured cultural moment'}
        </Text>

        {/* City · Date */}
        {footer ? (
          <Text
            modifiers={[
              font({ size: 10, weight: 'semibold' }),
              lineLimit(1),
              foregroundColor(CultureTokens.gold),
            ]}
          >
            {footer}
          </Text>
        ) : null}
      </VStack>
    </ZStack>
  );
};

const CultureSpotlightWidget = Platform.OS === 'ios'
  ? createWidget<CultureSpotlightWidgetProps>(
      'CultureSpotlightWidget',
      CultureSpotlightLayout
    )
  : ({} as any);

export default CultureSpotlightWidget;
