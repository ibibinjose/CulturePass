import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import Head from "expo-router/head";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { SocialLinksBar } from "@/modules/core/components";
import * as Haptics from "expo-haptics";
import type { Profile } from "@shared/schema";
import { modulesApi } from "@/modules/api";
import { formatLocationLabel } from "@/lib/format";
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { useColors } from "@/hooks/useColors";
import { useM3Colors } from "@/hooks/useM3Colors";
import { useLayout } from "@/hooks/useLayout";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import * as ImagePicker from "expo-image-picker";
import { captureEvent } from "@/lib/analytics";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { M3TopAppBar, M3Card, M3FilterChip, M3SectionHeader } from "@/design-system/ui";
import { canonicalTalentPath, siteUrl } from "@/lib/publicPaths";
import { M3Typography } from "@/design-system/tokens/theme";

function ArtistDetailSkeleton() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={280} borderRadius={0} />
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 }}>
          {/* Info Card Skeleton */}
          <View style={{ 
            marginTop: -40, 
            backgroundColor: colors.surface, 
            borderRadius: 16, 
            padding: 16, 
            gap: 12,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
            <Skeleton width="40%" height={20} borderRadius={10} />
            <Skeleton width="80%" height={36} borderRadius={10} />
            <Skeleton width="50%" height={20} borderRadius={10} />
          </View>

          {/* Stats Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="48%" height={80} borderRadius={16} />
            <Skeleton width="48%" height={80} borderRadius={16} />
          </View>

          {/* Bio Skeleton */}
          <View style={{ gap: 12, marginTop: 12 }}>
            <Skeleton width="30%" height={24} borderRadius={8} />
            <Skeleton width="100%" height={100} borderRadius={16} />
          </View>

          {/* Tags Skeleton */}
          <View style={{ gap: 12, marginTop: 12 }}>
            <Skeleton width="25%" height={24} borderRadius={8} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} width={70} height={32} borderRadius={12} />)}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ArtistDetailScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const styles = getStyles(colors);
  const { id, source, featuredArtistId } = useLocalSearchParams<{ id: string; source?: string; featuredArtistId?: string }>();
  const insets = useSafeAreaInsets();
  const { windowSizeClass } = useLayout();
  const navigation = useNavigation();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const isWeb = Platform.OS === "web";
  const isExpanded = windowSizeClass === "expanded";

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles", id],
    queryFn: () => modulesApi.profiles.get(id),
  });

  React.useEffect(() => {
    if (!profile) return;
    captureEvent('artist_profile_viewed', {
      artistId: profile.id,
      artistName: profile.name,
      source,
      featuredArtistId,
    });
  }, [featuredArtistId, profile, source]);

  const goBack = useCallback(() => (
    navigation.canGoBack() ? router.back() : router.replace("/")
  ), [navigation]);

  const { userId } = useAuth();
  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickCover = useCallback(async () => {
    if(!Platform.OS.match(/web/)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access in Settings to upload an image.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        if (profile?.coverImageUrl || profile?.avatarUrl) {
          const oldUrl = profile.coverImageUrl || profile.avatarUrl;
          await deleteImage('profiles', profile.id, oldUrl!, profile.coverImageUrl ? 'coverImageUrl' : 'avatarUrl');
        }
        await uploadImage(result, 'profiles', profile!.id, 'coverImageUrl');
        queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      } catch (err) {
        Alert.alert('Upload Error', String(err));
      }
    }
  }, [profile, id, uploadImage, deleteImage]);

  const canEdit = userId === profile?.ownerId || userId === profile?.creatorId || __DEV__;

  const handleShare = useCallback(async () => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const url = siteUrl(canonicalTalentPath(id as string));
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: profile?.name ?? "Artist on CulturePass", url });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          Alert.alert("Link Copied", "Link copied to clipboard");
        }
      } else {
        await Share.share({
          title: `${profile?.name ?? 'Artist'} on CulturePass`,
          message: `Check out ${profile?.name} on CulturePass!${profile?.category ? ` ${profile.category}.` : ''}\n\n${url}`,
          url: url,
        });
      }
    } catch {}
  }, [id, profile, isWeb]);

  if (isLoading) {
    return <ArtistDetailSkeleton />;
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={styles.notFound}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={styles.notFoundText}>Artist not found</Text>
          <Pressable onPress={goBack} style={styles.backLinkBtn}>
            <Text style={styles.backLink}>Return Home</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  const heroImage = profile.coverImageUrl || (profile.images && profile.images.length > 0 ? profile.images[0] : null) || profile.avatarUrl;
  const location = formatLocationLabel(profile.city, profile.country, '');

  const artistTitle = `${profile.name} | CulturePass`;
  const artistDesc = profile.bio || profile.description || `Discover ${profile.name}${location ? ` based in ${location}` : ''} on CulturePass.`;
  const artistUrl = siteUrl(canonicalTalentPath(id as string));

  return (
    <ErrorBoundary>
      <Head>
        <title>{artistTitle}</title>
        <meta name="description" content={artistDesc} />
        <meta property="og:title" content={artistTitle} />
        <meta property="og:description" content={artistDesc} />
        <meta property="og:url" content={artistUrl} />
        {heroImage && <meta property="og:image" content={heroImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={artistTitle} />
        <meta name="twitter:description" content={artistDesc} />
        {heroImage && <meta name="twitter:image" content={heroImage} />}
        <link rel="canonical" href={artistUrl} />
      </Head>
      <View style={[styles.container, { backgroundColor: m3Colors.background }]}>
        <M3TopAppBar
          title="Artist"
          onBack={goBack}
          variant={isExpanded ? "large" : "medium"}
          actions={[
              { icon: 'share-outline', onPress: handleShare }
          ]}
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={[styles.heroContainer, { height: isExpanded ? 400 : 280 }]}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <LinearGradient
                colors={[m3Colors.primary, m3Colors.surfaceContainerLowest]}
                style={styles.heroImage}
              />
            )}
            
            {canEdit && (
              <Pressable 
                onPress={handlePickCover} 
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }]}
              >
                {uploading ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
                    <Ionicons name="camera" size={24} color="white" />
                  </View>
                )}
              </Pressable>
            )}

            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <M3Card variant="elevated" style={[styles.heroInfoCard, { marginTop: -40, backgroundColor: m3Colors.surface }]}>
              <View style={{ padding: 20 }}>
                {profile.isVerified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: m3Colors.secondaryContainer, borderColor: 'transparent' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={m3Colors.onSecondaryContainer} />
                    <Text style={[styles.verifiedText, { color: m3Colors.onSecondaryContainer }]}>Verified Artist</Text>
                    </View>
                )}
                <Text style={[styles.artistName, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>{profile.name}</Text>
                {profile.category ? (
                    <Text style={[styles.artistGenre, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant, marginTop: 4 }]}>{profile.category}</Text>
                ) : null}
                <View style={[styles.cpidChip, { backgroundColor: m3Colors.primaryContainer, borderColor: 'transparent', marginTop: 12 }]}>
                    <Ionicons name="finger-print" size={18} color={m3Colors.onPrimaryContainer} />
                    <Text style={[styles.cpidText, M3Typography.labelLarge, { color: m3Colors.onPrimaryContainer }]}>CPID: {profile.culturePassId ?? profile.id}</Text>
                </View>
              </View>
            </M3Card>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard
                icon="people"
                value={profile.followersCount ?? 0}
                label="Followers"
                color={m3Colors.primary}
              />
              <StatCard
                icon="star"
                value={profile.rating ? profile.rating.toFixed(1) : "—"}
                label="Rating"
                color={m3Colors.tertiary}
              />
            </View>

            {/* About */}
            {(profile.bio || profile.description) && (
              <View style={styles.section}>
                <M3SectionHeader title="About" />
                <Text style={[styles.bio, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>
                  {profile.bio || profile.description}
                </Text>
              </View>
            )}

            {/* Tags */}
            {(profile.tags?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <M3SectionHeader title="Tags" />
                <View style={styles.tagsRow}>
                  {(profile.tags ?? []).map((tag: string, idx: number) => (
                    <M3FilterChip
                        key={idx}
                        label={tag}
                        onPress={() => {}}
                        selected
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Social */}
            {(profile.socialLinks && Object.values(profile.socialLinks).some(Boolean)) && (
              <View style={styles.section}>
                <M3SectionHeader title="Follow" />
                <SocialLinksBar
                  socialLinks={profile.socialLinks}
                  website={profile.website}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

/* ---------------- Components ---------------- */

function StatCard({
  icon,
  value,
  label,
  color,
  onPress,
}: any) {
  const colors = useColors();
  const styles = getStyles(colors);
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper 
      style={styles.statCard} 
      onPress={() => {
        if(onPress && Platform.OS !== 'web') Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Wrapper>
  );
}

/* ---------------- Styles ---------------- */

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
  },

  heroContainer: {
    position: 'relative'
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroInfoCard: {
    marginBottom: 20,
    borderRadius: 24,
  },

  verifiedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },

  verifiedText: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  artistName: {
  },

  artistGenre: {
  },

  content: {
    padding: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    borderRadius: 20,
  },

  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },

  statValue: {
  },

  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cpidChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  cpidText: {
  },

  section: {
    marginBottom: 32,
  },

  bio: {
    lineHeight: 24,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tagText: {
  },

  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  notFoundText: {
  },

  backLinkBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  backLink: {
  },
  divider: {
    height: 1,
    marginVertical: 24,
    opacity: 0.1,
  },
});
