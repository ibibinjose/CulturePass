import React from 'react';
import { View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { BrandWordmark } from './BrandWordmark';

const LOGO_SIZES: Record<string, number> = { sm: 28, md: 36, lg: 44, xl: 52 };

export function BrandLockup({
  size = 'md',
  withTagline,
  centered,
  color,
}: {
  size?: string;
  withTagline?: boolean;
  centered?: boolean;
  color?: string;
}) {
  const logoSize = LOGO_SIZES[size] ?? 36;
  const radius = Math.round(logoSize * 0.26);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: centered ? 'center' : 'flex-start',
      }}
    >
      <Image
        source={require('@/assets/images/culturepass-logo.png')}
        style={[
          { width: logoSize, height: logoSize, borderRadius: radius },
          Platform.OS === 'web'
            ? ({ objectFit: 'contain' } as object)
            : null,
        ]}
        contentFit="contain"
      />
      <BrandWordmark size={size} withTagline={withTagline} color={color} />
    </View>
  );
}

export default BrandLockup;
