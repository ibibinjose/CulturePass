import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import Head from "expo-router/head";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { Profile } from "@shared/schema";
import { modulesApi } from "@/modules/api";
import { formatLocationLabel } from "@/lib/format";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { ErrorBoundary } from "@/modules/core/ui/ErrorBoundary";
import { useColors } from "@/hooks/useColors";
import { useM3Colors } from "@/hooks/useM3Colors";
import { useLayout } from "@/hooks/useLayout";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import * as ImagePicker from "expo-image-picker";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { M3TopAppBar, M3Button, M3Card, M3FilterChip, M3SectionHeader } from "@/design-system/ui";
import { canonicalVenuePath, siteUrl } from "@/lib/publicPaths";
import { M3Typography } from "@/design-system/tokens/theme";

function VenueDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={260} borderRadius={0} />
        <View style={{ padding: 20, gap: 20 }}>
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
            <Skeleton width="30%" height={20} borderRadius={10} />
            <Skeleton width="70%" height={32} borderRadius={10} />
            <Skeleton width="50%" height={16} borderRadius={8} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="31%" height={80} borderRadius={16} />
            <Skeleton width="31%" height={80} borderRadius={16} />
            <Skeleton width="31%" height={80} borderRadius={16} />
          </View>
          
          <Skeleton width="100%" height={80} borderRadius={16} />
          
          <View style={{ gap: 12, marginTop: 12 }}>
            <Skeleton width="25%" height={24} borderRadius={8} />
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function VenueDetailScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const safeInsets = useSafeAreaInsetsWeb();
  const { windowSizeClass } = useLayout();
  const topInset = safeInsets.top;
  const navigation = useNavigation();
  const bottomInset = safeInsets.bottom;
  const isWeb = Platform.OS === "web";
  const isExpanded = windowSizeClass === "expanded";

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [navigation]);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
    queryFn: () => modulesApi.profiles.get(id),
  });

  const { userId } = useAuth();
  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickCover = useCallback(async () => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isWeb) {
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
  }, [profile, id, uploadImage, deleteImage, isWeb]);

  const canEdit = userId === profile?.ownerId || userId === profile?.creatorId || __DEV__;

  const handleShare = useCallback(async () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const url = siteUrl(canonicalVenuePath(id as string));
      const location = formatLocationLabel(profile?.city, profile?.country, '');
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: profile?.name ?? "Venue on CulturePass", url });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          Alert.alert("Link Copied", "Link copied to clipboard");
        }
      } else {
        await Share.share({
          title: `${profile?.name ?? 'Venue'} on CulturePass`,
          message: `Check out ${profile?.name} on CulturePass!${location ? ` Located in ${location}.` : ''}\n\n${url}`,
          url: url,
        });
      }
    } catch {}
  }, [id, profile, isWeb]);

  const openDirections = useCallback(() => {
    if (!profile) return;
    const locationText = [profile.address, profile.city, profile.country].filter(Boolean).join(', ');
    const hasCoordinates = !!(profile.location?.lat && profile.location?.lng) || !!(profile.latitude && profile.longitude);

    if (hasCoordinates) {
      const lat = profile.location?.lat || profile.latitude;
      const lng = profile.location?.lng || profile.longitude;
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    } else if (locationText) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(locationText)}`);
    }
  }, [profile]);

  if (isLoading) {
    return <VenueDetailSkeleton />;
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset + 16 }]}> 
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.textTertiary} />
            <Text style={styles.errorText}>Venue not found</Text>
            <Pressable onPress={goBack} style={styles.backLinkBtn}>
              <Text style={styles.backLinkText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  const heroImage = profile.coverImageUrl || profile.avatarUrl || (profile.images && profile.images.length > 0 ? profile.images[0] : null);
  const location = formatLocationLabel(profile.city, profile.country, '');

  const venueTitle = `${profile.name} | CulturePass`;
  const venueDesc = profile.bio || profile.description || `Discover ${profile.name}${location ? ` in ${location}` : ''} on CulturePass.`;
  const venueUrl = siteUrl(canonicalVenuePath(id as string));

  return (
    <ErrorBoundary>
      <Head>
        <title>{venueTitle}</title>
        <meta name="description" content={venueDesc} />
        <meta property="og:title" content={venueTitle} />
        <meta property="og:description" content={venueDesc} />
        <meta property="og:url" content={venueUrl} />
        {heroImage && <meta property="og:image" content={heroImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={venueTitle} />
        <meta name="twitter:description" content={venueDesc} />
        {heroImage && <meta name="twitter:image" content={heroImage} />}
        <link rel="canonical" href={venueUrl} />
      </Head>
      <View style={[styles.container, { backgroundColor: m3Colors.background }]}>
        <M3TopAppBar
          title="Venue"
          onBack={goBack}
          variant={isExpanded ? "large" : "medium"}
          actions={[
              { icon: 'share-outline', onPress: handleShare },
              { icon: 'navigate-outline', onPress: openDirections }
          ]}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        >
          <View style={[styles.heroContainer, { height: isExpanded ? 400 : 280 }]}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" transition={300} />
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
              style={styles.heroGradient}
            />
          </View>

          <View style={styles.content}>
            <M3Card variant="elevated" style={[styles.heroInfoCard, { marginTop: -40, backgroundColor: m3Colors.surface }]}>
              <View style={{ padding: 20 }}>
                {profile.isVerified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: m3Colors.secondaryContainer, borderColor: 'transparent' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={m3Colors.onSecondaryContainer} />
                    <Text style={[styles.verifiedBadgeText, { color: m3Colors.onSecondaryContainer }]}>Verified</Text>
                    </View>
                ) : null}
                <Text style={[styles.heroTitle, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>{profile.name}</Text>
                {location ? (
                    <View style={styles.heroLocationRow}>
                    <Ionicons name="location" size={18} color={m3Colors.primary} />
                    <Text style={[styles.heroLocation, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>{location}</Text>
                    </View>
                ) : null}
                <View style={[styles.cpidRow, { backgroundColor: m3Colors.primaryContainer, borderColor: 'transparent', marginTop: 12 }]}>
                    <Ionicons name="finger-print" size={18} color={m3Colors.onPrimaryContainer} />
                    <Text style={[styles.cpidText, M3Typography.labelLarge, { color: m3Colors.onPrimaryContainer }]}>CPID: {profile.culturePassId ?? profile.id}</Text>
                </View>
              </View>
            </M3Card>

            <View style={[styles.statsRow, { marginBottom: 24 }]}>
              <M3Card variant="filled" style={[styles.statCard, { flex: 1 }]}>
                <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                    <View style={[styles.statIconBox, { backgroundColor: m3Colors.secondaryContainer }]}>
                    <Ionicons name="people" size={20} color={m3Colors.onSecondaryContainer} />
                    </View>
                    <Text style={[styles.statValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{profile.followersCount ?? 0}</Text>
                    <Text style={[styles.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>FOLLOWERS</Text>
                </View>
              </M3Card>
              <M3Card variant="filled" style={[styles.statCard, { flex: 1 }]}>
                <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                    <View style={[styles.statIconBox, { backgroundColor: m3Colors.tertiaryContainer }]}>
                    <Ionicons name="star" size={20} color={m3Colors.onTertiaryContainer} />
                    </View>
                    <Text style={[styles.statValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{profile.rating ? profile.rating.toFixed(1) : "—"}</Text>
                    <Text style={[styles.statLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>RATING</Text>
                </View>
              </M3Card>
            </View>

            {profile.address && (
              <M3Card variant="outlined" onPress={openDirections} style={{ marginBottom: 24 }}>
                <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={[styles.addressIconBox, { backgroundColor: m3Colors.primaryContainer }]}>
                    <Ionicons name="location" size={20} color={m3Colors.onPrimaryContainer} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurface }]}>{profile.address}</Text>
                  </View>
                  <M3Button variant="filled" onPress={openDirections}>Directions</M3Button>
                </View>
              </M3Card>
            )}

            {(profile.bio || profile.description) && (
              <View style={styles.section}>
                <M3SectionHeader title="About" />
                <Text style={[styles.descriptionText, M3Typography.bodyLarge, { color: m3Colors.onSurfaceVariant }]}>{profile.bio || profile.description}</Text>
              </View>
            )}

            {profile.tags && profile.tags.length > 0 && (
              <View style={styles.section}>
                <M3SectionHeader title="Tags" />
                <View style={styles.tagsGrid}>
                  {profile.tags.map((tag, idx) => (
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

            {profile.openingHours && (
              <View style={styles.section}>
                <M3SectionHeader title="Opening Hours" />
                <M3Card variant="filled" style={{ padding: 16 }}>
                  <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>{profile.openingHours}</Text>
                </M3Card>
              </View>
            )}

            {(profile.email || profile.contactEmail || profile.phone || profile.website) && (
              <View style={styles.section}>
                <M3SectionHeader title="Contact" />
                <M3Card variant="filled" style={{ gap: 4 }}>
                    {(profile.email || profile.contactEmail) && (
                    <M3Button
                        variant="text"
                        onPress={() => Linking.openURL(`mailto:${profile.email || profile.contactEmail}`)}
                        leftIcon="mail"
                        style={{ justifyContent: 'flex-start' }}
                    >
                        {profile.email || profile.contactEmail}
                    </M3Button>
                    )}
                    {profile.phone && (
                    <M3Button
                        variant="text"
                        onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                        leftIcon="call"
                        style={{ justifyContent: 'flex-start' }}
                    >
                        {profile.phone}
                    </M3Button>
                    )}
                    {profile.website && (
                    <M3Button
                        variant="text"
                        onPress={() => openExternalUrl(profile.website!)}
                        leftIcon="globe"
                        style={{ justifyContent: 'flex-start' }}
                    >
                        {profile.website}
                    </M3Button>
                    )}
                </M3Card>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  errorText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: colors.textSecondary },
  backLinkBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  backLinkText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },

  heroContainer: { position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFill },
  heroTopBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  heroBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(11,11,20,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  heroInfoCard: {
    marginBottom: 20,
    borderRadius: 24,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  verifiedBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroLocation: {
  },

  content: { padding: 16 },

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
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: { alignItems: 'center', gap: 2 },
  statValue: {},
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cpidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  cpidText: {},

  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    lineHeight: 22,
  },

  section: { marginBottom: 32 },
  descriptionText: {
    lineHeight: 24,
  },

  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  hoursCard: {
    padding: 16,
    borderRadius: 20,
  },
  hoursText: {
    lineHeight: 24,
  },

  divider: {
    height: 1,
    marginVertical: 24,
    opacity: 0.1,
  },
});
