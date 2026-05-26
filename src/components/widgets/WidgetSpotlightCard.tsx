import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CultureTokens, CardTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import type { WidgetSpotlightItem } from '@/lib/api';

interface WidgetSpotlightCardProps {
  item: WidgetSpotlightItem;
}

export function WidgetSpotlightCard({ item }: WidgetSpotlightCardProps) {
  const colors = useColors();

  const categoryLabel = (item as { category?: string }).category ?? 'Spotlight';

  return (
    <Pressable
      style={[styles.card, { borderColor: colors.borderLight }]}
      onPress={() => {
        if (item.type === 'event') {
          router.push({ pathname: '/e/[id]', params: { id: item.id } });
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open spotlight: ${item.title}`}
    >
      {/* Hero image */}
      <Image
        source={item.imageUrl ?? undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Gradient overlay — 4-stop for depth */}
      <LinearGradient
        colors={['transparent', 'rgba(15,14,46,0.4)', 'rgba(15,14,46,0.85)', 'rgba(15,14,46,0.97)']}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Eyebrow badge — top-left */}
      <View style={styles.badge}>
        <Ionicons name="sparkles" size={10} color={CultureTokens.gold} />
        <Text style={[styles.badgeText, { color: CultureTokens.gold }]}>
          {categoryLabel.toUpperCase()}
        </Text>
      </View>

      {/* Content block — bottom */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description ?? 'Featured cultural moment'}
        </Text>
        {item.city ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={11} color={CultureTokens.teal} />
            <Text style={[styles.metaText, { color: CultureTokens.teal }]} numberOfLines={1}>
              {item.city}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 210,
    borderRadius: CardTokens.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#0F0E2E',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${CultureTokens.gold}50`,
    backgroundColor: 'rgba(15,14,46,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.6,
  },
  content: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    gap: 5,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});
