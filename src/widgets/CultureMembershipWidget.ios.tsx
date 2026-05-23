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

export type CultureMembershipWidgetProps = {
  memberName: string;
  tier: string;
  renewalLabel?: string;
  cashbackBalance?: string;
};

const DEEP_LINK = 'culturepass://membership';

const CultureMembershipLayout = (props: CultureMembershipWidgetProps) => {
  'widget';

  const isPlus =
    props.tier.toLowerCase().includes('+') ||
    props.tier.toLowerCase().includes('plus') ||
    props.tier.toLowerCase().includes('premium');

  const tierLabel = isPlus ? `★  ${props.tier.toUpperCase()}` : props.tier.toUpperCase();

  return (
    <ZStack modifiers={[cornerRadius(20), widgetURL(DEEP_LINK)]}>
      <VStack
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          background(CultureTokens.violet),
        ]}
      >
        {null}
      </VStack>

      <Image
        systemName="star.circle.fill"
        modifiers={[
          foregroundColor(CultureTokens.gold),
          opacity(0.12),
          frame({ width: 90, height: 90 }),
        ]}
      />

      <VStack
        spacing={4}
        alignment="leading"
        modifiers={[
          frame({ maxWidth: 99999, maxHeight: 99999 }),
          padding({ all: 16 }),
        ]}
      >
        <HStack spacing={5} alignment="center">
          <Image
            systemName={isPlus ? 'sparkles' : 'checkmark.circle.fill'}
            modifiers={[
              foregroundColor(CultureTokens.gold),
              frame({ width: 11, height: 11 }),
            ]}
          />
          <Text
            modifiers={[
              font({ size: 9, weight: 'semibold' }),
              foregroundColor(CultureTokens.gold),
            ]}
          >
            {tierLabel}
          </Text>
        </HStack>

        <Spacer minLength={4} />

        <Text
          modifiers={[
            font({ size: 15, weight: 'bold' }),
            lineLimit(1),
            foregroundColor('#FFFFFF'),
          ]}
        >
          {props.memberName}
        </Text>

        {props.renewalLabel ? (
          <Text
            modifiers={[
              font({ size: 11 }),
              lineLimit(1),
              foregroundColor('#FFFFFFB0'),
            ]}
          >
            {props.renewalLabel}
          </Text>
        ) : null}

        {props.cashbackBalance ? (
          <HStack spacing={5} alignment="center">
            <Image
              systemName="leaf.circle.fill"
              modifiers={[
                foregroundColor(CultureTokens.teal),
                frame({ width: 12, height: 12 }),
              ]}
            />
            <Text
              modifiers={[
                font({ size: 12, weight: 'semibold' }),
                foregroundColor(CultureTokens.teal),
              ]}
            >
              {`${props.cashbackBalance} cashback`}
            </Text>
          </HStack>
        ) : null}

        <Text
          modifiers={[
            font({ size: 9 }),
            lineLimit(1),
            foregroundColor('#FFFFFF50'),
            padding({ top: 2 }),
          ]}
        >
          Tap to view perks
        </Text>
      </VStack>
    </ZStack>
  );
};

const CultureMembershipWidget = Platform.OS === 'ios'
  ? createWidget<CultureMembershipWidgetProps>(
      'CultureMembershipWidget',
      CultureMembershipLayout
    )
  : ({} as any);

export default CultureMembershipWidget;
