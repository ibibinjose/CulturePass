import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Head from 'expo-router/head';
import { useLocalSearchParams, router, Stack, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { queryClient } from '@/lib/query-client';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3TopAppBar, M3Card, M3Button, M3SectionHeader } from '@/design-system/ui';
import { CultureTokens, M3Typography } from '@/design-system/tokens/theme';
import type { ActivityData } from '@/shared/schema';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600';

function ActivityDetailScreenInner() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { windowSizeClass } = useLayout();
  const navigation = useNavigation();
  const { userId } = useAuth();
  
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
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
      Alert.alert('Success', 'Activity deleted successfully.', [
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

  const handleDelete = useCallback(() => {
    if (!activity) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete activity',
      `Are you sure you want to delete "${activity.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(activity.id),
        },
      ]
    );
  }, [activity, deleteMutation]);

  const handleEdit = useCallback(() => {
    if (!activity) return;
    Alert.alert('Edit Activity', 'Editing activities is managed via the HostSpace creation panel.');
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
        <M3Button variant="filled" onPress={goBack} style={{ marginTop: 16 }}>
          Return to Activities
        </M3Button>
      </View>
    );
  }

  const canEdit = userId === activity.ownerId || __DEV__;
  const heroImage = activity.imageUrl || PLACEHOLDER_IMAGE;
  const ratingVal = activity.rating ?? 0;
  const reviewsVal = activity.reviewsCount ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: m3Colors.background }]}>
      <Stack.Screen options={{ title: activity.name, headerShown: false }} />
      <Head>
        <title>{`${activity.name} | CulturePass`}</title>
        <meta name="description" content={activity.description ?? `Discover ${activity.name} on CulturePass.`} />
        <meta property="og:title" content={`${activity.name} | CulturePass`} />
        <meta property="og:description" content={activity.description ?? `Discover ${activity.name} on CulturePass.`} />
        <meta property="og:image" content={heroImage} />
      </Head>

      <M3TopAppBar
        title="Activity"
        onBack={goBack}
        variant={isExpanded ? 'large' : 'medium'}
        actions={
          canEdit
            ? [
                { icon: 'create-outline', onPress: handleEdit },
                { icon: 'trash-outline', onPress: handleDelete },
              ]
            : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      >
        {/* HERO IMAGE */}
        <View style={[styles.heroContainer, { height: isExpanded ? 400 : 280 }]}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* Main Info Card */}
          <M3Card variant="elevated" style={[styles.infoCard, { marginTop: -40, backgroundColor: m3Colors.surface }]}>
            <View style={{ padding: 20 }}>
              {/* Category Badge */}
              <View style={[styles.categoryBadge, { backgroundColor: CultureTokens.teal + '15' }]}>
                <Text style={[styles.categoryText, { color: CultureTokens.teal }]}>
                  {activity.category.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.nameText, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>
                {activity.name}
              </Text>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={m3Colors.primary} />
                <Text style={[styles.locationText, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>
                  {[activity.location, activity.city, activity.state, activity.country].filter(Boolean).join(', ')}
                </Text>
              </View>

              {activity.culturePassId && (
                <View style={[styles.cpidRow, { backgroundColor: m3Colors.primaryContainer }]}>
                  <Ionicons name="finger-print" size={16} color={m3Colors.onPrimaryContainer} />
                  <Text style={[styles.cpidText, M3Typography.labelLarge, { color: m3Colors.onPrimaryContainer }]}>
                    CPID: {activity.culturePassId}
                  </Text>
                </View>
              )}
            </View>
          </M3Card>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            {activity.duration && (
              <M3Card variant="filled" style={[styles.statCard, { flex: 1 }]}>
                <View style={{ padding: 16, alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time" size={20} color={m3Colors.primary} />
                  <Text style={[styles.statValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                    {activity.duration}
                  </Text>
                  <Text style={[styles.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
                    DURATION
                  </Text>
                </View>
              </M3Card>
            )}
            <M3Card variant="filled" style={[styles.statCard, { flex: 1 }]}>
              <View style={{ padding: 16, alignItems: 'center', gap: 6 }}>
                <Ionicons name="card" size={20} color={m3Colors.tertiary} />
                <Text style={[styles.statValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                  {activity.priceLabel || 'Free'}
                </Text>
                <Text style={[styles.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
                  COST
                </Text>
              </View>
            </M3Card>
            {activity.ageGroup && (
              <M3Card variant="filled" style={[styles.statCard, { flex: 1 }]}>
                <View style={{ padding: 16, alignItems: 'center', gap: 6 }}>
                  <Ionicons name="people" size={20} color={m3Colors.secondary} />
                  <Text style={[styles.statValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                    {activity.ageGroup}
                  </Text>
                  <Text style={[styles.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
                    AGE GROUP
                  </Text>
                </View>
              </M3Card>
            )}
          </View>

          {/* Ratings */}
          {ratingVal > 0 && (
            <M3Card variant="outlined" style={{ marginBottom: 24 }}>
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.ratingIconBox, { backgroundColor: CultureTokens.gold + '15' }]}>
                  <Ionicons name="star" size={22} color={CultureTokens.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface }]}>
                    {ratingVal.toFixed(1)} out of 5
                  </Text>
                  <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
                    Based on {reviewsVal} reviews
                  </Text>
                </View>
              </View>
            </M3Card>
          )}

          {/* About / Description */}
          {activity.description && (
            <View style={styles.section}>
              <M3SectionHeader title="About this Activity" />
              <Text style={[styles.bodyText, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>
                {activity.description}
              </Text>
            </View>
          )}

          {/* Highlights */}
          {activity.highlights && activity.highlights.length > 0 && (
            <View style={styles.section}>
              <M3SectionHeader title="Highlights" />
              <View style={{ gap: 10 }}>
                {activity.highlights.map((highlight, idx) => (
                  <View key={idx} style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={18} color={CultureTokens.teal} />
                    <Text style={[M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant, flex: 1 }]}>
                      {highlight}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function ActivityDetailScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ActivityDetailScreenInner />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 24,
    marginBottom: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  nameText: {
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  locationText: {
    flex: 1,
  },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  cpidText: {},
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 20,
  },
  statValue: {
    textAlign: 'center',
  },
  statLabel: {
    letterSpacing: 0.5,
  },
  ratingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 32,
  },
  bodyText: {
    lineHeight: 26,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
