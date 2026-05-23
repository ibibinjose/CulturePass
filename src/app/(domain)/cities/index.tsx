import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  type ListRenderItem,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { useFeaturedCities, type FeaturedCityData } from '@/hooks/useFeaturedCities';
import { M3Button } from '@/design-system/ui';

const WEB_DESKTOP_MAX_W = 920;
const INTRO_MAX_W = 640;

/** One or two cities per row (two only on desktop web). */
type CityRowChunk = FeaturedCityData[];

/**
 * Full list of curated featured cities (same data as the Discover “Explore Cities” rail).
 * Web desktop: centered column + two-column grid; avoids full-bleed layouts beside the sidebar.
 */
export default function CitiesHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isWeb, isDesktop } = useLayout();
  const { cities, isLoading, isError, isRefetching, refetch } = useFeaturedCities();

  const twoColWeb = isWeb && isDesktop;
  const thumbSize = twoColWeb ? 64 : 56;

  const rowChunks = useMemo((): CityRowChunk[] => {
    if (!twoColWeb) return cities.map((c) => [c]);
    const rows: CityRowChunk[] = [];
    for (let i = 0; i < cities.length; i += 2) {
      rows.push(cities.slice(i, i + 2));
    }
    return rows;
  }, [cities, twoColWeb]);

  const webShellStyle = useMemo(
    () => [
      styles.shell,
      isWeb && {
        width: '100%' as const,
        maxWidth: WEB_DESKTOP_MAX_W,
        alignSelf: 'center' as const,
      },
    ],
    [isWeb],
  );

  const onCityPress = useCallback((city: FeaturedCityData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push({
      pathname: '/city/[name]',
      params: { name: city.name, country: city.countryName },
    });
  }, []);

  const renderCityCard = useCallback(
    (item: FeaturedCityData) => (
      <Pressable
        onPress={() => onCityPress(item)}
        style={(state) => {
          const { pressed, hovered } = state as { pressed: boolean; hovered?: boolean };
          return [
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              opacity: pressed ? 0.92 : 1,
            },
            twoColWeb && {
              boxShadow: '0 2px 12px rgba(15, 23, 42, 0.07)',
            },
            twoColWeb && (hovered || pressed) && styles.rowHoverDesktop,
            Platform.OS === 'web' && { cursor: 'pointer' as const },
          ];
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}, ${item.countryName}`}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.thumb, { width: thumbSize, height: thumbSize, borderRadius: 14 }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.thumb,
              { width: thumbSize, height: thumbSize, borderRadius: 14, backgroundColor: colors.backgroundSecondary },
            ]}
          />
        )}
        <View style={styles.rowBody}>
          <Text style={[styles.titleLine, { color: colors.text }]} numberOfLines={1}>
            <Text style={styles.emoji}>{item.countryEmoji}</Text>
            {` ${item.name}`}
          </Text>
          <Text style={[styles.subLine, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.countryName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>
    ),
    [
      colors.backgroundSecondary,
      colors.borderLight,
      colors.surface,
      colors.text,
      colors.textSecondary,
      onCityPress,
      thumbSize,
      twoColWeb,
    ],
  );

  const renderChunk: ListRenderItem<CityRowChunk> = useCallback(
    ({ item: chunk }) => {
      if (chunk.length === 1 && !twoColWeb) {
        return <View style={styles.chunkSingle}>{renderCityCard(chunk[0])}</View>;
      }
      return (
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>{renderCityCard(chunk[0])}</View>
          {chunk[1] ? (
            <View style={styles.gridCell}>{renderCityCard(chunk[1])}</View>
          ) : twoColWeb ? (
            <View style={styles.gridCellSpacer} />
          ) : null}
        </View>
      );
    },
    [renderCityCard, twoColWeb],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Explore cities',
          headerBackTitle: 'Back',
        }}
      />
      <View style={[styles.screen, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <View style={[webShellStyle, { paddingHorizontal: hPad, flex: 1 }]}>
          <Text
            style={[
              styles.intro,
              isWeb && isDesktop && styles.introDesktop,
              { color: colors.textSecondary },
              isWeb && isDesktop && { maxWidth: INTRO_MAX_W },
            ]}
            maxFontSizeMultiplier={1.45}
          >
            Discover culture nationwide — festivals, communities, and events in each city we support.
          </Text>

          {isError && cities.length === 0 ? (
            <View style={[styles.errorPanel, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
              <Text style={[styles.err, { color: colors.textSecondary }]}>
                Could not load cities. Check your connection and try again.
              </Text>
              <View style={styles.errorActions}>
                <M3Button variant="tonal" style={{ height: 36 }} onPress={() => void refetch()}>
                  Retry
                </M3Button>
              </View>
            </View>
          ) : isLoading && cities.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={CultureTokens.indigo} />
            </View>
          ) : (
            <FlatList
              data={rowChunks}
              keyExtractor={(chunk) => chunk.map((c) => c.id).join('-')}
              renderItem={renderChunk}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(32, insets.bottom + 16) },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => void refetch()}
                  tintColor={CultureTokens.indigo}
                />
              }
              ListEmptyComponent={
                !isLoading ? (
                  <Text style={[styles.empty, { color: colors.textSecondary }]}>No cities available yet.</Text>
                ) : null
              }
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shell: { flex: 1 },
  intro: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 14,
  },
  introDesktop: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 20,
  },
  listContent: { paddingTop: 4, flexGrow: 1 },
  chunkSingle: { marginBottom: 12 },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'stretch',
  },
  gridCell: { flex: 1, minWidth: 0 },
  /** Balances a lone card in the last row so it stays ~half width on 2-col web */
  gridCellSpacer: { flex: 1, minWidth: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  rowHoverDesktop: {
    borderColor: 'rgba(0, 102, 204, 0.22)',
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  rowBody: { flex: 1, minWidth: 0 },
  emoji: { fontSize: 18 },
  titleLine: { fontSize: 16, fontFamily: FontFamily.bold },
  subLine: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  errorPanel: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    marginTop: 48,
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  err: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15, fontFamily: FontFamily.regular },
});
