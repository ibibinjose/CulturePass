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

export type CultureIdentityQRWidgetProps = {
  displayName: string;
  culturePassId: string;
  membershipTier?: string;
};

const DEEP_LINK = 'culturepass://profile/digital-id';

const CultureIdentityQRLayout = (props: CultureIdentityQRWidgetProps) => {
  'widget';

  const tier = props.membershipTier ?? 'Member';
  const isPlus =
    tier.toLowerCase().includes('+') ||
    tier.toLowerCase().includes('plus') ||
    tier.toLowerCase().includes('premium');

  return (
    <ZStack modifiers={[cornerRadius(20), widgetURL(DEEP_LINK)]}>
      {/* Dynamic background based on tier */}
      <VStack
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          background(isPlus ? CultureTokens.violet : CultureTokens.indigo),
        ]}
      >
        {null}
      </VStack>

      {/* Decorative background glow (if Plus) */}
      {isPlus ? (
        <ZStack>
          <Image
            systemName="sparkle"
            modifiers={[
              foregroundColor(CultureTokens.coral),
              opacity(0.2),
              frame({ width: 120, height: 120 }),
              padding({ leading: 100, bottom: 60 }),
            ]}
          />
          <Image
            systemName="circle.fill"
            modifiers={[
              foregroundColor(CultureTokens.indigo),
              opacity(0.15),
              frame({ width: 140, height: 140 }),
              padding({ trailing: 90, top: 50 }),
            ]}
          />
        </ZStack>
      ) : (
        <Image
          systemName="person.circle.fill"
          modifiers={[
            foregroundColor('#FFFFFF'),
            opacity(0.06),
            frame({ width: 90, height: 90 }),
          ]}
        />
      )}

      {/* Identity + QR side-by-side */}
      <HStack
        spacing={0}
        alignment="top"
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          padding({ all: 14 }),
        ]}
      >
        {/* Left: identity info */}
        <VStack spacing={4} alignment="leading" modifiers={[frame({ maxWidth: 99999 })]}>
          <HStack spacing={5} alignment="center">
            <Image
              systemName="person.crop.square.fill"
              modifiers={[
                foregroundColor(CultureTokens.gold),
                frame({ width: 10, height: 10 }),
              ]}
            />
            <Text
              modifiers={[
                font({ size: 9, weight: 'semibold' }),
                foregroundColor(CultureTokens.gold),
              ]}
            >
              CULTURE ID
            </Text>
          </HStack>

          <Spacer minLength={4} />

          <HStack spacing={4} alignment="center">
            <Text
              modifiers={[
                font({ size: 14, weight: 'bold' }),
                lineLimit(1),
                foregroundColor('#FFFFFF'),
              ]}
            >
              {props.displayName}
            </Text>
            <Image
              systemName="checkmark.seal.fill"
              modifiers={[
                foregroundColor(isPlus ? CultureTokens.gold : '#FFFFFF'),
                opacity(0.9),
                frame({ width: 12, height: 12 }),
              ]}
            />
          </HStack>

          <Text
            modifiers={[
              font({ size: 10 }),
              lineLimit(1),
              foregroundColor('#FFFFFF90'),
            ]}
          >
            {props.culturePassId}
          </Text>

          {/* Tier badge */}
          <Text
            modifiers={[
              font({ size: 9, weight: 'semibold' }),
              foregroundColor(isPlus ? CultureTokens.gold : CultureTokens.teal),
            ]}
          >
            {isPlus ? `★ ${tier}` : tier}
          </Text>
        </VStack>

        {/* Right: QR placeholder */}
        <VStack spacing={4} alignment="center">
          <VStack
            modifiers={[
              frame({ width: 52, height: 52 }),
              background('#FFFFFF'),
              cornerRadius(10),
              padding({ all: 5 }),
            ]}
          >
            <Image
              systemName="qrcode"
              modifiers={[
                foregroundColor(CultureTokens.indigo),
                frame({ width: 42, height: 42 }),
              ]}
            />
          </VStack>
          <Text
            modifiers={[
              font({ size: 8, weight: 'semibold' }),
              foregroundColor('#FFFFFF70'),
            ]}
          >
            SCAN TO ID
          </Text>
        </VStack>
      </HStack>
    </ZStack>
  );
};

const CultureIdentityQRWidget = Platform.OS === 'ios'
  ? createWidget<CultureIdentityQRWidgetProps>(
      'CultureIdentityQRWidget',
      CultureIdentityQRLayout
    )
  : ({} as any);

export default CultureIdentityQRWidget;
