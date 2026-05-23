import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Skeleton } from '@/design-system/ui/Skeleton';
import SectionHeader from './SectionHeader';
import { RailErrorBanner } from './RailErrorBanner';
import type { ActivityData } from '@/lib/api';

interface ActivityRailProps {
  title: string;
  subtitle?: string;
  data: (ActivityData | string)[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function ActivityRailComponent({ title, subtitle, data, isLoading, onSeeAll, errorMessage, onRetry }: ActivityRailProps) {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();
  const colors = useColors();

  const hasRealItems = data.some((item) => typeof item !== 'string');

  if (!isLoading && !hasRealItems && !errorMessage) return null;

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      </View>
      {errorMessage && !isLoading && !hasRealItems ? (
        <RailErrorBanner message={errorMessage} onRetry={onRetry} />
      ) : (
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        renderItem={({ item }) =>
          typeof item === 'string' ? (
            <View style={[styles.activityTile, { backgroundColor: colors.surface }]}>
              <Skeleton width={80} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
              <Skeleton width="50%" height={12} borderRadius={4} />
            </View>
          ) : (
            <Pressable
              onPress={() => router.push({ pathname: '/a/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.activityTile,
                { backgroundColor: colors.surface, borderColor: CultureTokens.teal + '35' },
                pressed && { backgroundColor: colors.backgroundSecondary }
              ]}
            >
              <View style={[styles.accentStrip, { backgroundColor: CultureTokens.teal }]} />
              <Text style={[styles.activityCategory, { color: colors.textTertiary }]}>{item.category}</Text>
              <Text numberOfLines={1} style={[styles.activityName, { color: colors.text }]}>{item.name}</Text>
              <Text numberOfLines={2} style={[styles.activityDescription, { color: colors.textSecondary }]}>{item.description}</Text>
              <View style={styles.activityMetaRow}>
                <View style={[styles.metaPill, { borderColor: CultureTokens.teal + '50' }]}>
                  <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                  <Text style={[styles.activityMetaText, { color: colors.textSecondary }]}>{item.city}</Text>
                </View>
                <View style={[styles.metaPill, { borderColor: CultureTokens.gold + '50' }]}>
                  <Ionicons name="pricetag-outline" size={11} color={colors.textTertiary} />
                  <Text style={[styles.activityMetaText, { color: colors.textSecondary }]}>{item.priceLabel || 'Free'}</Text>
                </View>
              </View>
            </Pressable>
          )
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 22 }]}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  activityTile: { 
    width: 200, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  accentStrip: { 
    position: 'absolute', 
    left: 0, 
    top: 16, 
    bottom: 16, 
    width: 4, 
    borderTopRightRadius: 2, 
    borderBottomRightRadius: 2 
  },
  activityCategory: { 
    fontSize: 10, 
    fontFamily: 'Poppins_600SemiBold', 
    textTransform: 'uppercase', 
    marginBottom: 4 
  },
  activityName: { ...TextStyles.cardTitle, marginBottom: 4 },
  activityDescription: { 
    fontSize: 12, 
    fontFamily: 'Poppins_400Regular', 
    lineHeight: 18, 
    marginBottom: 12 
  },
  activityMetaRow: { flexDirection: 'row', gap: 8 },
  metaPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6, 
    borderWidth: 1 
  },
  activityMetaText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
});

export const ActivityRail = React.memo(ActivityRailComponent);
