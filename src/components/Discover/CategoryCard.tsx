import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { FontFamily } from '@/design-system/tokens/theme';

// M3 Expressive — Orange & Blue Metallic palettes
interface MetallicPalette {
  gradFrom: string;
  gradTo: string;
  surface: string;
  border: string;
  stripe: [string, string];
}

const ORANGE: MetallicPalette = {
  gradFrom: '#FF6B35',
  gradTo:   '#FF9A00',
  surface:  'rgba(255, 107, 53, 0.12)',
  border:   'rgba(255, 154,  0, 0.32)',
  stripe:   ['#FF6B35', '#FF9A00'],
};

const BLUE: MetallicPalette = {
  gradFrom: '#0284C7',
  gradTo:   '#38BDF8',
  surface:  'rgba(2, 132, 199, 0.12)',
  border:   'rgba(56, 189, 248, 0.32)',
  stripe:   ['#0284C7', '#38BDF8'],
};

// Category slug → palette (alternates orange / blue for visual rhythm)
const SLUG_PALETTE: Record<string, typeof ORANGE> = {
  festival:              ORANGE,
  fooddrink:             ORANGE,
  music:                 ORANGE,
  sportfitness:          ORANGE,
  shoppingmarketsfairs:  ORANGE,
  kidsyouth:             ORANGE,
  exhibitions:           BLUE,
  communitycauses:       BLUE,
  talkscoursesworkshops: BLUE,
  theatredancefilm:      BLUE,
  toursexperiences:      BLUE,
  family:                BLUE,
  nightlife:             BLUE,
};

function slug(id: string) {
  return id.toLowerCase().replace(/[^a-z]/g, '');
}

interface CategoryCardProps {
  item: {
    id: string;
    label: string;
    icon: string;
    color?: string;
    emoji?: string;
  };
  onPress?: () => void;
}

function CategoryCard({ item, onPress }: CategoryCardProps) {
  const colors = useColors();
  const palette = SLUG_PALETTE[slug(item.id)] ?? BLUE;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.91, { damping: 18, stiffness: 420 });
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1.0, { damping: 14, stiffness: 320 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  }, [onPress]);

  return (
    <Animated.View style={[{ width: 112 }, animStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
      >
        {/* Card surface — subtle tinted metallic fill */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>

          {/* Diagonal metallic shimmer */}
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Gradient icon container */}
          <LinearGradient
            colors={[palette.gradFrom, palette.gradTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            {/* Inner shine on icon capsule */}
            <LinearGradient
              colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.00)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {item.emoji ? (
              <Text style={styles.emoji}>{item.emoji}</Text>
            ) : (
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={26}
                color="#FFFFFF"
              />
            )}
          </LinearGradient>

          <Text
            style={[styles.label, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.label}
          </Text>

          {/* Bottom metallic accent stripe */}
          <LinearGradient
            colors={palette.stripe}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stripe}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 11,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {
    fontSize: 27,
  },
  label: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  stripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

export default React.memo(CategoryCard);
