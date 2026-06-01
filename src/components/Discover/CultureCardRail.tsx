import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import SectionHeader from './SectionHeader';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { useColors } from '@/hooks/useColors';
import { FontFamily } from '@/design-system/tokens/theme';
import type { CultureCardModel } from '@/shared/schema';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

/** 1:1 square image + name + sub text layout (matches the new Culture Hubs rail treatment) */
const CARD_WIDTH = 160;
const CARD_HEIGHT = 218;
const SQUARE_SIZE = 154;
const SNAP = CARD_WIDTH + 12;

interface CultureCardRailProps {
  title: string;
  subtitle: string;
  items: CultureCardModel[];
}

function RailOneToOneCard({ item }: { item: CultureCardModel }) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(item.primaryAction.route as never);
  };

  const displaySubtitle = item.subtitle || item.meta || '';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && { opacity: 0.88 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${displaySubtitle}`}
    >
      {/* 3/4 area - 1:1 square image */}
      <View style={s.imageSection}>
        <View style={s.squareFrame}>
          {item.imageUrl ? (
            <Image
              source={{ uri: normalizeRemoteImageUri(item.imageUrl) ?? undefined }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f4f0e6' }]} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>

      {/* 1/4 area - Name and sub text */}
      <View style={s.infoSection}>
        <Text style={s.name} numberOfLines={1}>{item.title}</Text>
        {displaySubtitle ? (
          <Text style={s.sub} numberOfLines={2}>{displaySubtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function CultureCardRailComponent({ title, subtitle, items }: CultureCardRailProps) {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: vPad }}>
      <View style={headerPadStyle}>
        <SectionHeader title={title} subtitle={subtitle} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={[scrollPadStyle, { gap: 12, flexDirection: 'row' }]}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {items.map((item) => (
          <RailOneToOneCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

export const CultureCardRail = React.memo(CultureCardRailComponent);

const s = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageSection: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareFrame: {
    width: SQUARE_SIZE,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#1C1917',
  },
  sub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#57534E',
    lineHeight: 14,
    marginTop: 2,
  },
});
