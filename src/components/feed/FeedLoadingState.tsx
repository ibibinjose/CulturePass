import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { SkeletonCard } from '@/components/feed/FeedComponents';

type Props = {
  listBottomPad: number;
  hPad: number;
};

export function FeedLoadingState({ listBottomPad, hPad }: Props) {
  const colors = useColors();
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: listBottomPad, paddingHorizontal: hPad }]}
      scrollEnabled={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Loading feed"
    >
      <View style={styles.shimmerTrack}>
        <View style={[styles.shimmerBar, { backgroundColor: colors.borderLight }]} />
      </View>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} colors={colors} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    gap: 0,
  },
  shimmerTrack: {
    marginBottom: 16,
  },
  shimmerBar: {
    height: 4,
    borderRadius: 2,
    width: '36%',
    opacity: 0.6,
  },
});
