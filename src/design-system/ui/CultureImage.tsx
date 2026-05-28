import React from 'react';
import { View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';
import { isDefaultImageUri, getDefaultConfigFromUri, getAlignFromUri } from '@/lib/defaultImages';

export type CultureImageProps = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  /** Low-res placeholder; merged into expo-image `source` with `uri` */
  thumbhash?: string;
  blurhash?: string;
  align?: 'top' | 'center' | 'bottom' | 'left' | 'right' | string;
  /** Pass a changing value (e.g. updatedAt) to force re-fetch after an update */
  recyclingKey?: string | number;
};

export function CultureImage({
  uri,
  style,
  thumbhash,
  blurhash,
  align,
  recyclingKey,
  ...rest
}: CultureImageProps) {
  const parsedAlign = align || getAlignFromUri(uri);
  const contentPosition = parsedAlign || rest.contentPosition || 'center';

  // Render gradient or stock image tile for @default: sentinel URIs
  if (isDefaultImageUri(uri)) {
    const config = getDefaultConfigFromUri(uri);
    if (config) {
      if (config.gradientColors) {
        return (
          <LinearGradient
            colors={config.gradientColors as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={style as StyleProp<ViewStyle>}
          />
        );
      } else if (config.imageAsset) {
        return (
          <Image
            source={config.imageAsset}
            style={style}
            contentFit="cover"
            contentPosition={contentPosition as any}
            cachePolicy="memory-disk"
            transition={150}
            {...rest}
          />
        );
      }
    }
  }

  const resolved = normalizeRemoteImageUri(uri ?? undefined);
  const source: ImageSource | null =
    resolved || thumbhash || blurhash
      ? {
          ...(resolved ? { uri: resolved } : {}),
          ...(thumbhash ? { thumbhash } : {}),
          ...(blurhash ? { blurhash } : {}),
        }
      : null;

  if (!source) {
    return (
      <View
        style={[{ backgroundColor: 'rgba(148,163,184,0.2)' } as ViewStyle, style as StyleProp<ImageStyle>]}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit="cover"
      contentPosition={contentPosition as any}
      cachePolicy="memory-disk"
      transition={150}
      recyclingKey={recyclingKey ? String(recyclingKey) : undefined}
      {...rest}
    />
  );
}

export default CultureImage;
