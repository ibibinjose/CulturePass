import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, ActivityIndicator,
  ScrollView, RefreshControl, Alert, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { modulesApi } from '@/modules/api';
import { getApiErrorMessage } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useIsCreator } from '@/hooks/useCanEdit';
import { useRole } from '@/hooks/useRole';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { CreatorFAB } from '@/design-system/ui/CreatorActions';
import type { MovieData } from '@/shared/schema';
import { navigateToCreateById } from '@/lib/creationRouting';
import { CultureTokens, FontFamily, TextStyles } from '@/design-system/tokens/theme';

const isWeb = Platform.OS === 'web';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRE_FILTERS = [
  'All', 'Drama', 'Comedy', 'Action', 'Thriller', 'Romance',
  'Horror', 'Sci-Fi', 'Documentary', 'Animation', 'Musical',
] as const;

const SKELETON_COUNT = 6;

// ─── Skeleton card ────────────────────────────────────────────────────────────

function MovieCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[s.posterSkeleton, { backgroundColor: colors.surfaceElevated }]} />
      <View style={s.cardBody}>
        <View style={[s.skeletonLine, { width: '75%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[s.skeletonLine, { width: '50%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[s.skeletonLine, { width: '40%', backgroundColor: colors.surfaceElevated }]} />
      </View>
    </View>
  );
}

// ─── Movie card ───────────────────────────────────────────────────────────────

const MovieCard = React.memo(function MovieCard({
  movie,
  canManage,
  onEdit,
  onDelete,
}: {
  movie: MovieData;
  canManage: boolean;
  onEdit: (m: MovieData) => void;
  onDelete: (m: MovieData) => void;
}) {
  const colors = useColors();

  const ratingColor = movie.imdbScore >= 7
    ? CultureTokens.teal
    : movie.imdbScore >= 5
      ? CultureTokens.gold
      : CultureTokens.coral;

  return (
    <View style={s.cardWrapper}>
      <Pressable
        onPress={() => router.push(`/movies/${movie.id}`)}
        style={({ pressed }) => [
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${movie.title} — ${movie.rating}`}
      >
        {/* Poster */}
        <View style={s.posterContainer}>
          {movie.posterUrl ? (
            <ExpoImage
              source={{ uri: movie.posterUrl }}
              style={s.poster}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[s.poster, s.posterPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="film-outline" size={32} color={colors.textTertiary} />
            </View>
          )}
          {/* IMDB score badge */}
          {movie.imdbScore > 0 && (
            <View style={[s.scoreBadge, { backgroundColor: ratingColor }]}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={s.scoreText}>{movie.imdbScore.toFixed(1)}</Text>
            </View>
          )}
          {/* Rating badge */}
          {movie.rating ? (
            <View style={[s.ratingBadge, { backgroundColor: colors.surface + 'E6' }]}>
              <Text style={[s.ratingText, { color: colors.text }]}>{movie.rating}</Text>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View style={s.cardBody}>
          <Text style={[s.movieTitle, { color: colors.text }]} numberOfLines={2}>
            {movie.title}
          </Text>
          {movie.genre.length > 0 && (
            <Text style={[s.genreText, { color: colors.textSecondary }]} numberOfLines={1}>
              {movie.genre.slice(0, 2).join(' · ')}
            </Text>
          )}
          <View style={s.metaRow}>
            {movie.language ? (
              <View style={s.metaItem}>
                <Ionicons name="language-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.metaText, { color: colors.textTertiary }]}>{movie.language}</Text>
              </View>
            ) : null}
            {movie.duration ? (
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.metaText, { color: colors.textTertiary }]}>{movie.duration}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Edit/Delete bar for creators */}
        {canManage && (
          <View style={[s.manageRow, { borderTopColor: colors.borderLight }]}>
            <Pressable
              onPress={() => onEdit(movie)}
              style={[s.manageBtn, { backgroundColor: CultureTokens.indigo + '14' }]}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${movie.title}`}
            >
              <Ionicons name="create-outline" size={14} color={CultureTokens.indigo} />
              <Text style={[s.manageBtnText, { color: CultureTokens.indigo }]}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(movie)}
              style={[s.manageBtn, { backgroundColor: CultureTokens.coral + '14' }]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${movie.title}`}
            >
              <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
              <Text style={[s.manageBtnText, { color: CultureTokens.coral }]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MoviesScreen() {
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const colors = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();
  const { isAdmin, isModerator } = useRole();
  const isCreator = useIsCreator();

  const numCols = isDesktop ? 3 : 2;
  const colGap = isDesktop ? 20 : 12;

  // Filter & search state
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const city = state.city || '';
  const country = state.country || '';

  const { data: movies, isLoading, refetch, isRefetching } = useQuery<MovieData[]>({
    queryKey: ['movies', city, country],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (city) params.city = city;
      if (country) params.country = country;
      return modulesApi.movies.list(params);
    },
  });

  // Filter movies client-side by genre + search
  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    let result = movies;
    if (selectedGenre !== 'All') {
      result = result.filter(m =>
        m.genre.some(g => g.toLowerCase() === selectedGenre.toLowerCase()),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.director?.toLowerCase().includes(q) ||
        m.language?.toLowerCase().includes(q) ||
        m.genre.some(g => g.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [movies, selectedGenre, searchQuery]);

  const canManage = isCreator || isAdmin || isModerator;

  const handleEdit = useCallback((movie: MovieData) => {
    router.push(`/movies/${movie.id}`);
  }, []);

  const handleDelete = useCallback((movie: MovieData) => {
    Alert.alert(
      'Delete movie',
      `Remove "${movie.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await modulesApi.movies.remove(movie.id);
                await queryClient.invalidateQueries({ queryKey: ['movies'] });
              } catch (err) {
                Alert.alert('Delete failed', getApiErrorMessage(err, 'Could not delete this movie.'));
              }
            })();
          },
        },
      ],
    );
  }, []);

  const locationLabel = city
    ? `${city}${country ? `, ${country}` : ''}`
    : country || 'your region';

  const clearFilters = useCallback(() => {
    setSelectedGenre('All');
    setSearchQuery('');
  }, []);

  const filtersActive = selectedGenre !== 'All' || searchQuery.trim().length > 0;

  // ── Render grid rows (ScrollView + manual grid layout) ──────────────────
  const rows = useMemo(() => {
    const result: MovieData[][] = [];
    for (let i = 0; i < filteredMovies.length; i += numCols) {
      result.push(filteredMovies.slice(i, i + numCols));
    }
    return result;
  }, [filteredMovies, numCols]);

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>

        {/* ── Header ── */}
        <View
          style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}
        >
          <View style={s.headerContent}>
            <BackButton
              fallback="/(tabs)"
              style={[s.backBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, { color: colors.text }]}>Movies</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location" size={11} color={CultureTokens.indigo} />
                <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {locationLabel}
                  {!isLoading && filteredMovies.length > 0
                    ? ` · ${filteredMovies.length} movie${filteredMovies.length !== 1 ? 's' : ''}`
                    : ''}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => refetch()}
              style={[s.iconBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh movies"
            >
              {isRefetching
                ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
                : <Ionicons name="refresh" size={18} color={colors.text} />}
            </Pressable>
          </View>
        </View>

        {/* ── Centred content shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>

          {/* ── Search bar ── */}
          <View style={[s.searchRow, { paddingHorizontal: hPad }]}>
            <View style={[s.searchInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
              <TextInput
                placeholder="Search movies..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[s.searchTextInput, { color: colors.text }]}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Search movies"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Genre filter chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.chipRow, { paddingHorizontal: hPad, paddingRight: hPad + 32 }]}
            style={s.chipScroll}
          >
            {GENRE_FILTERS.map(genre => {
              const active = selectedGenre === genre;
              return (
                <Pressable
                  key={genre}
                  onPress={() => setSelectedGenre(genre)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: active ? CultureTokens.indigo : colors.surfaceElevated,
                      borderColor: active ? CultureTokens.indigo : colors.borderLight,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${genre}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.chipText, { color: active ? '#fff' : colors.text }]}>{genre}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Movie grid ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={CultureTokens.indigo} />
            }
            contentContainerStyle={[s.gridContent, { paddingHorizontal: hPad, paddingBottom: bottomInset + 100 }]}
          >
            {isLoading ? (
              <View style={[s.gridRow, { gap: colGap }]}>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <View key={`sk-${i}`} style={[s.gridCell, numCols === 3 && s.gridCell3]}>
                    <MovieCardSkeleton colors={colors} />
                  </View>
                ))}
              </View>
            ) : filteredMovies.length === 0 ? (
              /* ── Empty state ── */
              <View style={s.emptyState}>
                <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Ionicons name="film-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No movies found</Text>
                <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                  {filtersActive
                    ? 'Try adjusting your search or genre filter.'
                    : `No movies yet in ${locationLabel}.`}
                </Text>
                {filtersActive && (
                  <Pressable
                    style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                    onPress={clearFilters}
                    accessibilityRole="button"
                  >
                    <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
                    <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              rows.map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={[s.gridRow, { gap: colGap }]}>
                  {row.map((movie) => (
                    <View key={movie.id} style={[s.gridCell, numCols === 3 && s.gridCell3]}>
                      <MovieCard
                        movie={movie}
                        canManage={canManage}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </View>
                  ))}
                  {/* Fill empty cells so the last row aligns */}
                  {row.length < numCols &&
                    Array.from({ length: numCols - row.length }).map((_, i) => (
                      <View key={`empty-${i}`} style={[s.gridCell, numCols === 3 && s.gridCell3]} />
                    ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* ── Creator FAB ── */}
        {isCreator && (
          <CreatorFAB
            label="Add Movie"
            icon="film-outline"
            onPress={() => navigateToCreateById('movie', { source: 'movies_index_cta' })}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },

  shell: { flex: 1 },
  shellDesktop: { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  // Search
  searchRow: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    padding: 0,
    ...(isWeb ? { outlineStyle: 'none' } : {}),
  } as Record<string, unknown>,

  // Genre chips
  chipScroll: { flexGrow: 0 },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },

  // Grid
  gridContent: { paddingTop: 8, gap: 16 },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gridCell: { flex: 1, minWidth: 0 },
  gridCell3: { flex: 1, maxWidth: '33.33%' as unknown as number },

  // Card
  cardWrapper: { flex: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  posterContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 2 / 3,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#fff',
    lineHeight: 14,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  movieTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  genreText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  manageRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },

  // Skeleton
  posterSkeleton: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: {
    ...TextStyles.title3,
    lineHeight: 24,
  },
  emptyDesc: {
    ...TextStyles.callout,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  resetBtnText: {
    ...TextStyles.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 19,
  },
});
