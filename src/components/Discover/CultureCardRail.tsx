import React from 'react';
import { ScrollView, View } from 'react-native';
import SectionHeader from './SectionHeader';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { CultureCard } from './CultureCard';
import type { CultureCardModel } from '@/shared/schema';

/** Fixed width so every culture card in the rail matches (image + body grid) */
export const CULTURE_RAIL_CARD_WIDTH = 288;

interface CultureCardRailProps {
  title: string;
  subtitle: string;
  items: CultureCardModel[];
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
        contentContainerStyle={[scrollPadStyle, { gap: 18, alignItems: 'stretch' }]}
      >
        {items.map((item) => (
          <View key={item.id} style={{ width: CULTURE_RAIL_CARD_WIDTH }}>
            <CultureCard item={item} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const CultureCardRail = React.memo(CultureCardRailComponent);
