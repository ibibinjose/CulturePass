import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { BrandWordmark } from './BrandWordmark';
import { CulturePassWordmark } from './CulturePassWordmark';

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
  const colors = useColors();
  const logoSize = LOGO_SIZES[size] ?? 36;
  const radius = Math.round(logoSize * 0.26);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        justifyContent: centered ? 'center' : 'flex-start',
      }}
    >
      <View style={{ width: logoSize, height: logoSize, borderRadius: radius, overflow: 'hidden' }}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            margin: 1.5,
            flex: 1,
            borderRadius: radius - 1,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={[
              { width: logoSize - 6, height: logoSize - 6 },
              Platform.OS === 'web'
                ? ({ objectFit: 'contain' } as object)
                : null,
            ]}
            contentFit="contain"
          />
        </View>
      </View>
      {/* Use the modern split-color wordmark when no custom color is provided */}
      {color ? (
        <BrandWordmark size={size} withTagline={withTagline} color={color} />
      ) : (
        <CulturePassWordmark size={(size as any) || 'md'} showSuffix />
      )}
    </View>
  );
}

export default BrandLockup;
