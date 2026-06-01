import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/typography';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

const CITY_IMAGES: Record<string, string> = {
  // Australian metro areas (used by default in FEATURED_CITIES)
  'Sydney': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/1280px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg',
  'Melbourne': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Melburnian_Skyline.jpg/1280px-Melburnian_Skyline.jpg',
  'Brisbane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Brisbane_CBD_seen_from_Kangaroo_Point%2C_2024%2C_01_%282%29.jpg/1280px-Brisbane_CBD_seen_from_Kangaroo_Point%2C_2024%2C_01_%282%29.jpg',
  'Perth': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Perth_CBD_skyline_from_State_War_Memorial_Lookout%2C_2023%2C_04_b.jpg/1280px-Perth_CBD_skyline_from_State_War_Memorial_Lookout%2C_2023%2C_04_b.jpg',
  'Adelaide': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Adelaide_skyline%2C_December_2022_b.jpg/1280px-Adelaide_skyline%2C_December_2022_b.jpg',
  'Gold Coast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Gold_Coast_skyline_%28Unsplash%29.jpg/1280px-Gold_Coast_skyline_%28Unsplash%29.jpg',
  'Canberra': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Canberra_panorama_from_Mount_Ainslie.jpg/1280px-Canberra_panorama_from_Mount_Ainslie.jpg',
  'Darwin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/DarwinOct172024_02.jpg/1280px-DarwinOct172024_02.jpg',
  'Hobart': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Franklin_Wharf_2015_b_%28cropped%29.jpg/1280px-Franklin_Wharf_2015_b_%28cropped%29.jpg',
  
  // international fallback set
  'Auckland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Auckland_skyline_-_May_2024_%282%29.jpg/1280px-Auckland_skyline_-_May_2024_%282%29.jpg',
  'Dubai': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Burj_Khalifa_2021.jpg/1280px-Burj_Khalifa_2021.jpg',
  'London': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/1280px-London_Skyline_%28125508655%29.jpeg',
  'Toronto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Toronto_Skyline_viewed_from_Algonquin_Island_%2816-9_crop%29.jpg/1280px-Toronto_Skyline_viewed_from_Algonquin_Island_%2816-9_crop%29.jpg',
  'Vancouver': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Concord_Pacific_Master_Plan_Area.jpg/1280px-Concord_Pacific_Master_Plan_Area.jpg',
};

const CITY_FALLBACK_IMAGES: Record<string, string> = {};

const FALLBACK_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Canberra_panorama_from_Mount_Ainslie.jpg/1280px-Canberra_panorama_from_Mount_Ainslie.jpg';

interface CityCardProps {
  city: {
    name: string;
    country: string;
    imageUrl?: string;
  };
  onPress?: () => void;
  width?: number;
  height?: number;
}

function CityCard({ city, onPress, width, height }: CityCardProps) {
  const colors = useColors();
  const cityPrimaryImage = city.imageUrl || CITY_IMAGES[city.name] || FALLBACK_IMAGE;
  const cityFallbackImage = CITY_FALLBACK_IMAGES[city.name];
  const [imageUri, setImageUri] = useState(cityPrimaryImage);
  const cardHeight = height ?? (width ? Math.round((width ?? 170) * (140 / 170)) : 140);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceSecondary },
        width ? { width } : null,
        height || width ? { height: cardHeight } : null,
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        Platform.OS === 'web' && { cursor: 'pointer' as any },
        Colors.shadows.medium,
      ]}
      onPress={onPress}
      accessibilityLabel={`Explore ${city.name}, ${city.country}`}
    >
      <Image
        source={{ uri: normalizeRemoteImageUri(imageUri) ?? undefined }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        onError={() => {
          if (cityFallbackImage && imageUri !== cityFallbackImage && imageUri !== FALLBACK_IMAGE) {
            setImageUri(cityFallbackImage);
            return;
          }
          if (imageUri !== FALLBACK_IMAGE) setImageUri(FALLBACK_IMAGE);
        }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
        locations={[0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.cityTextRibbon}>
          <Text style={[TextStyles.cardTitle, styles.cityName]}>{city.name}</Text>
        </View>
        <View style={[styles.cityTextRibbon, styles.countryRibbon]}>
          <Text style={[TextStyles.caption, styles.country]}>{city.country}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  cityTextRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,11,20,0.75)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
  },
  countryRibbon: {
    marginBottom: 0,
  },
  cityName: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  country: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  },
});

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders in lists
export default React.memo(CityCard);
