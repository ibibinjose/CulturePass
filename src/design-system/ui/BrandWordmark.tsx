import React from 'react';
import { View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { APP_AKA, TAGLINE_PRIMARY } from '@/lib/app-meta';
import { NameTaglineLockup } from './NameTaglineLockup';
import { CulturePassWordmark } from './CulturePassWordmark';

export function BrandWordmark({
  size = 'md',
  withTagline = false,
  centered = false,
  color,
  tagline = TAGLINE_PRIMARY,
}: {
  size?: string;
  withTagline?: boolean;
  centered?: boolean;
  color?: string;
  tagline?: string;
}) {
  const colors = useColors();

  const isOfficialBrand = !color;

  if (isOfficialBrand) {
    // Official app branding: "Culture" red + "Pass" green + ".App"
    return (
      <View style={{ alignItems: centered ? 'center' : 'flex-start' }}>
        <CulturePassWordmark
          size={size === 'xl' ? 'xl' : size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'}
          showSuffix
        />
        {withTagline && !!tagline && (
          <View style={{ marginTop: 4 }}>
            <NameTaglineLockup
              name=""
              tagline={tagline}
              taglineColor={colors.textSecondary}
              size={size === 'xl' || size === 'lg' ? 'md' : 'sm'}
              align={centered ? 'center' : 'left'}
              marginBottom={0}
            />
          </View>
        )}
      </View>
    );
  }

  // Custom color usage (themed sections, etc.) — fall back to previous treatment
  const resolvedNameColor = color;
  const resolvedTaglineColor = color ? `${color}99` : colors.textSecondary;

  return (
    <View style={{ alignItems: centered ? 'center' : 'flex-start' }}>
      <NameTaglineLockup
        name={APP_AKA}
        tagline={withTagline ? tagline : undefined}
        nameColor={resolvedNameColor}
        taglineColor={resolvedTaglineColor}
        size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'}
        align={centered ? 'center' : 'left'}
        marginBottom={0}
      />
    </View>
  );
}

export default BrandWordmark;
