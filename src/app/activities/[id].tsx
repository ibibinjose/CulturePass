import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
} from 'react-native';
import Head from 'expo-router/head';
import { useLocalSearchParams, router, Stack, useNavigation } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { navigateToCreateById } from '@/lib/creationRouting';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { Button } from '@/design-system/ui/Button';
import { CultureTokens, FontFamily, TextStyles } from '@/design-system/tokens/theme';
import type { ActivityData } from '@/shared/schema';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200';

function MetaChip({ icon, label, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.metaChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
      <Ionicons name={icon} size={14} color={CultureTokens.indigo} />
      <Text style={[styles.metaChipText, { color: colors.textSecondary }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function ActivityDetailScreenInner() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const safeInsets = useSafeAreaInsetsWeb();
  const { isDesktop, hPad, windowSizeClass } = useLayout();
  const navigation = useNavigation();
  const { user, hasRole } = useAuth();

  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const isExpanded = windowSizeClass === 'expanded';

  const { data: activity, isLoading } = useQuery<ActivityData>({
    queryKey: ['/api/activities', id],
    queryFn: () => modulesApi.activities.get(id) as Promise<ActivityData>,
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (actId: string) => modulesApi.activities.remove(actId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      Alert.alert('Deleted', 'Activity removed successfully.', [
        { text: 'OK', onPress: () => router.replace('/activities') },
      ]);
    },
  });

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/activities');
    }
  }, [navigation]);

  const handleShare = useCallback(async () => {
    if (!activity) return;
    const url = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/activities/${activity.id}`
      : `https://culturepass.app/activities/${activity.id}`;
    try {
      await Share.share({
        message: `Check out ${activity.name} on CulturePass — ${url}`,
        url,
      });
    } catch {
      // user cancelled
    }
  }, [activity]);

  const handleEdit = useCallback(() => {
    navigateToCreateById('activity', { source: 'activities_detail_edit' });
  }, []);

  const handleDelete = useCallback(() => {
    if (!activity) return;
    Alert.alert(
      'Delete activity',
      `Remove "${activity.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(activity.id),
        },
      ],
    );
  }, [activity, deleteMutation]);

  const handleMap = useCallback(() => {
    if (!activity?.latitude || !activity?.longitude) {
      router.push('/map');
      return;
    }
    router.push({
      pathname: '/map',
      params: {
        lat: String(activity.latitude),
        lng: String(activity.longitude),
        label: activity.name,
      },
    } as never);
  }, [activity]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={CultureTokens.teal} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, padding: 40 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.text }]}>Activity not found</Text>
        <Button variant="primary" onPress={goBack} style={{ marginTop: 16 }}>
          Back to Activities
        </Button>
      </View>
    );
  }

  const canEdit =
    !!user &&
    (user.id === activity.ownerId || hasRole('admin', 'platformAdmin', 'moderator'));
  const heroImage = activity.imageUrl || PLACEHOLDER_IMAGE;
  const locationLine = [activity.location, activity.city, activity.state, activity.country]
    .filter(Boolean)
    .join(', ');
  const ratingVal = activity.rating ?? 0;
  const reviewsVal = activity.reviewsCount ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <Stack.Screen options={{ title: activity.name, headerShown: false }} />
      <Head>
        <title>{`${activity.name} | CulturePass`}</title>
        <meta name="description" content={activity.description ?? `Discover ${activity.name} on CulturePass.`} />
        <meta property="og:title" content={`${activity.name} | CulturePass`} />
        <meta property="og:description" content={activity.description ?? `Discover ${activity.name} on CulturePass.`} />
        <meta property="og:image" content={heroImage} />
        <link rel="canonical" href={`https://culturepass.app/activities/${activity.id}`} />
      </Head>

      <View style={[styles.topBar, { paddingHorizontal: hPad }]}>
        <BackButton
          fallback="/activities"
          style={[styles.backBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
        />
        <View style={styles.topActions}>
          <Pressable
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Share activity"
          >
            <Ionicons name="share-social-outline" size={18} color={colors.text} />
          </Pressable>
          {canEdit ? (
            <>
              <Pressable
                onPress={handleEdit}
                style={[styles.iconBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel="Create similar activity"
              >
                <Ionicons name="create-outline" size={18} color={CultureTokens.indigo} />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={[styles.iconBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel="Delete activity"
              >
                <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
      >
        <View style={[styles.heroContainer, { height: isExpanded ? 380 : isDesktop ? 320 : 260 }]}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroCaption, { paddingHorizontal: hPad }]}>
            <View style={[styles.categoryBadge, { backgroundColor: CultureTokens.teal + '30' }]}>
              <Text style={styles.categoryText}>{activity.category}</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>{activity.name}</Text>
            {locationLine ? (
              <View style={styles.heroLocationRow}>
                <Ionicons name="location" size={14} color="#fff" />
                <Text style={styles.heroLocation} numberOfLines={2}>{locationLine}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.contentShell, isDesktop && styles.contentShellDesktop, { paddingHorizontal: hPad }]}>
          <View style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>From</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>{activity.priceLabel || 'Free'}</Text>
            </View>
            {ratingVal > 0 ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={CultureTokens.gold} />
                <Text style={[styles.ratingText, { color: colors.text }]}>{ratingVal.toFixed(1)}</Text>
                {reviewsVal > 0 ? (
                  <Text style={[styles.reviewsText, { color: colors.textTertiary }]}>({reviewsVal})</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.metaGrid}>
            {activity.duration ? <MetaChip icon="time-outline" label={activity.duration} colors={colors} /> : null}
            {activity.scheduleText || activity.recurrence ? (
              <MetaChip icon="calendar-outline" label={activity.scheduleText || activity.recurrence || ''} colors={colors} />
            ) : null}
            {activity.difficulty ? <MetaChip icon="barbell-outline" label={activity.difficulty} colors={colors} /> : null}
            {activity.ageGroup ? <MetaChip icon="people-outline" label={activity.ageGroup} colors={colors} /> : null}
            {activity.instructorName ? <MetaChip icon="person-outline" label={activity.instructorName} colors={colors} /> : null}
            {activity.locationType ? <MetaChip icon="globe-outline" label={activity.locationType} colors={colors} /> : null}
            {activity.primaryCulture ? <MetaChip icon="color-palette-outline" label={activity.primaryCulture} colors={colors} /> : null}
            {activity.maxParticipants ? (
              <MetaChip icon="people-circle-outline" label={`Up to ${activity.maxParticipants}`} colors={colors} />
            ) : null}
          </View>

          {activity.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{activity.description}</Text>
            </View>
          ) : null}

          {activity.highlights && activity.highlights.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights</Text>
              <View style={{ gap: 10 }}>
                {activity.highlights.map((highlight, idx) => (
                  <View key={idx} style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={18} color={CultureTokens.teal} />
                    <Text style={[styles.bodyText, { color: colors.textSecondary, flex: 1 }]}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {activity.culturePassId ? (
            <View style={[styles.cpidRow, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '30' }]}>
              <Ionicons name="finger-print" size={16} color={CultureTokens.indigo} />
              <Text style={[styles.cpidText, { color: CultureTokens.indigo }]}>CPID: {activity.culturePassId}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Button variant="primary" fullWidth leftIcon="map-outline" onPress={handleMap}>
              View on map
            </Button>
            <Button variant="outline" fullWidth leftIcon="share-social-outline" onPress={handleShare}>
              Share
            </Button>
          </View>

          <Pressable onPress={() => router.push('/activities')} style={styles.browseLink}>
            <Text style={[styles.browseLinkText, { color: CultureTokens.indigo }]}>Browse all activities</Text>
            <Ionicons name="arrow-forward" size={14} color={CultureTokens.indigo} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ActivityDetailScreen() {
  return (
    <ErrorBoundary>
      <ActivityDetailScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    zIndex: 2,
  },
  topActions: { flexDirection: 'row', gap: 8 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
  },
  heroImage: { width: '100%', height: '100%' },
  heroCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 24,
    gap: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLocation: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    flex: 1,
  },
  contentShell: {
    paddingTop: 20,
    gap: 20,
  },
  contentShellDesktop: {
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  priceLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: FontFamily.semibold, fontSize: 16 },
  reviewsText: { fontFamily: FontFamily.regular, fontSize: 13 },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '100%',
  },
  metaChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  section: { gap: 10 },
  sectionTitle: {
    ...TextStyles.title3,
    lineHeight: 24,
  },
  bodyText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  cpidText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  actionRow: {
    gap: 10,
    marginTop: 4,
  },
  browseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  browseLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
});