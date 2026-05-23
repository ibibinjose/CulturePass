import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { BrowseItem } from '@/modules/core/components';

interface PromotedRailProps {
  title: string;
  items: BrowseItem[];
  accentColor: string;
  accentIcon: string;
  onItemPress: (item: BrowseItem) => void;
}

function PromotedRailComponent({ title, items, accentColor, accentIcon, onItemPress }: PromotedRailProps) {
  const colors = useColors();

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.promotedBadge, { backgroundColor: colors.surfaceElevated, borderColor: accentColor + '66' }]}>
          <Ionicons name="star" size={10} color={colors.text} />
          <Text style={[styles.promotedBadgeText, { color: colors.text }]}>Promoted</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.promoRailContent}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.promoCard, 
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={() => onItemPress(item)}
            accessibilityLabel={item.title}
            accessibilityRole="button"
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.promoImage} contentFit="cover" transition={200} />
            ) : (
              <View style={[styles.promoImage, styles.promoImageFallback, { backgroundColor: colors.surfaceElevated, borderColor: accentColor + '55' }]}>
                <Ionicons name={accentIcon as keyof typeof Ionicons.glyphMap} size={32} color={accentColor} />
              </View>
            )}
            <View style={styles.promoInfo}>
              <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              {item.subtitle && <Text style={[styles.promoSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>}
              <View style={styles.promoBottom}>
                {item.priceLabel && <Text style={[styles.promoPrice, { color: accentColor }]}>{item.priceLabel}</Text>}
                {item.rating != null && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={CultureTokens.gold} />
                    <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.rating}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    paddingTop: 10,
  },
  sectionDot: { width: 6, height: 20, borderRadius: 3 },
  sectionTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', flex: 1 },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  promotedBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoRailContent: { paddingHorizontal: 20, gap: 14 },
  promoCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  promoImage: { width: '100%', height: 140 },
  promoImageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  promoInfo: { padding: 16, gap: 4 },
  promoName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  promoSub: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  promoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  promoPrice: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

export const PromotedRail = React.memo(PromotedRailComponent);
