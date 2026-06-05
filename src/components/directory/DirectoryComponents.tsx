import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, EntityTypeColors, FontFamily, FontSize, LineHeight, Radius, shadows } from '@/design-system/tokens/theme';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import type { Profile, EventData } from '@/shared/schema';
import { Button } from '@/design-system/ui/Button';
import { M3Button } from '@/design-system/ui/M3Button';
import { formatPrice } from '@/lib/dateUtils';
import { routerProfileHref } from '@/lib/publicPaths';
import { GlassView } from '@/design-system/ui/GlassView';
import { SaveToggle } from '@/design-system/ui/SaveToggle';

export const isWeb = Platform.OS === 'web';

// ─── Constants ────────────────────────────────────────────────────────────────

export const TYPE_ICONS: Record<string, string> = {
  business:     'storefront',
  venue:        'location',
  organisation: 'business',
  council:      'shield-checkmark',
  government:   'flag',
  charity:      'heart',
  artist:       'brush',
  brand:        'ribbon',
};

export const ENTITY_FILTERS = [
  { label: 'All',          icon: 'grid',             color: CultureTokens.indigo,          display: 'All' },
  { label: 'event',        icon: 'calendar',          color: CultureTokens.gold,            display: 'Events' },
  { label: 'indigenous',   icon: 'leaf',              color: CultureTokens.teal,            display: '🪃 Indigenous' },
  { label: 'business',     icon: 'storefront',        color: EntityTypeColors.business,      display: 'Businesses' },
  { label: 'venue',        icon: 'location',          color: EntityTypeColors.venue,         display: 'Venues' },
  { label: 'organisation', icon: 'business',          color: EntityTypeColors.organisation,  display: 'Organisations' },
  { label: 'council',      icon: 'shield-checkmark',  color: EntityTypeColors.council,       display: 'Councils' },
  { label: 'government',   icon: 'flag',              color: EntityTypeColors.government,    display: 'Government' },
  { label: 'charity',      icon: 'heart',             color: EntityTypeColors.charity,       display: 'Charities' },
  { label: 'artist',       icon: 'mic',               color: CultureTokens.coral,           display: 'Artists' },
  { label: 'creator',      icon: 'sparkles',          color: CultureTokens.gold,            display: 'Creators' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTags(profile: Profile): string[] {
  return Array.isArray(profile.tags) ? (profile.tags as string[]) : [];
}

export function getDirectoryListingType(profile: Profile): string {
  const category = (profile.category ?? '').toLowerCase();
  if (category === 'council') return 'council';
  return profile.entityType;
}

export function getOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

// ─── FilterDivider ────────────────────────────────────────────────────────────

export function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />
  );
}

// ─── FeaturedRail ─────────────────────────────────────────────────────────────

export function FeaturedCard({
  p,
  colors,
}: {
  p: Profile;
  colors: ReturnType<typeof useColors>;
}) {
  const [hovered, setHovered] = useState(false);
  const color = (EntityTypeColors as Record<string, string>)[p.entityType] ?? CultureTokens.indigo;
  const accent = ['artist', 'creator', 'brand'].includes(p.entityType) ? CultureTokens.gold : color;

  return (
    <Pressable
      key={p.id}
      onPress={() => router.push(routerProfileHref(p) as Parameters<typeof router.push>[0])}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        fr.card,
        { borderColor: colors.borderLight, backgroundColor: colors.surface },
        pressed && { transform: [{ scale: 0.96 }] },
        hovered && Platform.OS === 'web' && {
          transform: [{ scale: 1.04 }],
          borderColor: accent,
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowColor: accent,
        },
        Platform.OS !== 'web' && shadows.small,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${p.name} profile`}
    >
      {p.imageUrl ? (
        <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      ) : (
        <View style={[fr.imgPlaceholder, { backgroundColor: color + '15' }]}>
          <Ionicons
            name={(TYPE_ICONS[p.entityType] ?? 'business') as keyof typeof Ionicons.glyphMap}
            size={36}
            color={color}
          />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={fr.cardInfo}>
        {p.isVerified && (
          <GlassView intensity={20} colorScheme="dark" style={fr.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
          </GlassView>
        )}
        <Text style={[fr.cardName, { color: '#FFFFFF' }]} numberOfLines={2}>{p.name}</Text>
        <Text style={[fr.cardType, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
          {p.category ?? p.entityType}
        </Text>
      </View>
    </Pressable>
  );
}

export function FeaturedRail({
  profiles,
  colors,
}: {
  profiles: Profile[];
  colors: ReturnType<typeof useColors>;
}) {
  if (profiles.length === 0) return null;

  return (
    <View style={fr.wrap}>
      <View style={fr.header}>
        <View style={fr.headerLeft}>
          <View style={[fr.accentBar, { backgroundColor: CultureTokens.indigo }]} />
          <Text style={[fr.title, { color: colors.text }]}>Featured</Text>
        </View>
        <Ionicons name="star" size={14} color={CultureTokens.gold} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fr.scroll}
      >
        {profiles.slice(0, 8).map(p => (
          <FeaturedCard key={p.id} p={p} colors={colors} />
        ))}
      </ScrollView>
    </View>
  );
}

export function CommunityCard({
  c,
  colors,
}: {
  c: Profile;
  colors: ReturnType<typeof useColors>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      key={c.id}
      onPress={() => router.push(routerProfileHref(c) as any)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        cr.communityItem,
        pressed && { transform: [{ scale: 0.95 }] },
        hovered && Platform.OS === 'web' && { transform: [{ scale: 1.05 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${c.name} community`}
    >
      <LinearGradient
        colors={[CultureTokens.teal, CultureTokens.indigo, CultureTokens.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cr.communityRing}
      >
        <View style={[cr.communityIconInner, { backgroundColor: colors.background }]}>
          {c.imageUrl ? (
            <Image source={{ uri: c.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <Ionicons name="people" size={20} color={colors.textTertiary} />
          )}
        </View>
      </LinearGradient>
      <Text style={[cr.communityName, { color: colors.text }]} numberOfLines={1}>
        {c.name}
      </Text>
    </Pressable>
  );
}

export function CommunityRail({
  communities,
  colors,
}: {
  communities: Profile[];
  colors: ReturnType<typeof useColors>;
}) {
  if (communities.length === 0) return null;

  return (
    <View style={fr.wrap}>
      <View style={fr.header}>
        <View style={fr.headerLeft}>
          <View style={[fr.accentBar, { backgroundColor: CultureTokens.teal }]} />
          <Text style={[fr.title, { color: colors.text }]}>Communities</Text>
        </View>
        <Pressable onPress={() => router.push('/communities' as any)}>
          <Text style={{ fontSize: 13, color: colors.primary, fontFamily: FontFamily.semibold }}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fr.scroll}
      >
        {communities.map(c => (
          <CommunityCard key={c.id} c={c} colors={colors} />
        ))}
      </ScrollView>
    </View>
  );
}

const cr = StyleSheet.create({
  communityItem: { width: 80, alignItems: 'center', gap: 8 },
  communityRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  communityIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityName: { fontSize: 11, fontFamily: FontFamily.semibold, textAlign: 'center', marginTop: 2 },
});

const fr = StyleSheet.create({
  wrap:       { marginBottom: 12, paddingTop: 4 },
  header:     {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accentBar:  { width: 3, height: 20, borderRadius: 2 },
  title:      { fontSize: 18, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  scroll:     { paddingHorizontal: 20, gap: 12, paddingRight: 32 },
  card: {
    width: 140,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    ...Platform.select({
      ios:     shadows.small,
      android: { elevation: 3 },
      web:     { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
    }),
  },
  imgPlaceholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  cardInfo:       { position: 'absolute', bottom: 12, left: 12, right: 12 },
  verifiedBadge:  {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardName: { fontSize: 13, fontFamily: FontFamily.bold, lineHeight: 17 },
  cardType: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

// ─── DirectoryEventCard ───────────────────────────────────────────────────────

export function DirectoryEventCard({
  event,
  isSaved,
  onSave,
  colors,
}: {
  event: EventData;
  isSaved: boolean;
  onSave: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const handleSave = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(event.id);
  };

  const priceLabel = event.isFree ? 'Free' : event.priceCents ? formatPrice(event.priceCents, event.country) : null;
  const priceAccent = priceLabel === 'Free' ? CultureTokens.teal : CultureTokens.indigo;

  let dayNum = '', monthStr = '';
  const dateObj = new Date(event.date);
  if (!isNaN(dateObj.getTime())) {
    dayNum = dateObj.toLocaleString(undefined, { day: 'numeric' });
    monthStr = dateObj.toLocaleString(undefined, { month: 'short' });
  }

  const hasImage = Boolean(event.imageUrl);

  return (
    <View style={s.cardOuter}>
      <Pressable
        onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
        style={({ pressed }) => [
          s.directoryCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 },
          pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
          Platform.OS !== 'web' && shadows.small,
        ]}
        accessibilityRole="link"
        accessibilityLabel={`View event: ${event.title}`}
      >
        <View style={s.eventCardInner}>
          {/* Left: image thumbnail with date overlay, or plain date block */}
          {hasImage ? (
            <View style={s.eventImgBlock}>
              <Image source={{ uri: event.imageUrl! }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.4 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={s.eventDateOverlay}>
                <Text style={[s.eventDateDay, { color: '#FFFFFF' }]}>{dayNum}</Text>
                <Text style={[s.eventDateMonth, { color: '#FFFFFF' }]}>{monthStr.toUpperCase()}</Text>
              </View>
            </View>
          ) : (
            <GlassView
              intensity={20}
              colorScheme="dark"
              style={[s.eventDateBlock, { backgroundColor: colors.primary + '80' }]}
            >
              <Text style={[s.eventDateDay, { color: '#FFFFFF' }]}>{dayNum}</Text>
              <Text style={[s.eventDateMonth, { color: '#FFFFFF' }]}>{monthStr.toUpperCase()}</Text>
            </GlassView>
          )}

          {/* Content */}
          <View style={s.eventCardContent}>
            {event.category ? (
              <View style={[s.eventCatBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20', borderWidth: 1 }]}>
                <Text style={[s.eventCatText, { color: colors.primary }]}>{event.category}</Text>
              </View>
            ) : null}
            <Text style={[s.eventCardTitle, { color: colors.text }]} numberOfLines={2}>
              {event.title}
            </Text>
            {event.city ? (
              <View style={s.eventLocationRow}>
                <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.eventLocationText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {event.city}
                </Text>
              </View>
            ) : null}
            <View style={s.eventCardFooter}>
              {priceLabel ? (
                <GlassView intensity={10} style={[s.eventPriceBadge, { backgroundColor: priceAccent + '15', borderColor: priceAccent + '30', borderWidth: 1 }]}>
                  <Text style={[s.eventPriceText, { color: priceAccent }]}>{priceLabel}</Text>
                </GlassView>
              ) : null}
              <Text style={[s.viewLink, { color: colors.primary }]}>View →</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={s.saveBtnContainer}>
        <SaveToggle saved={isSaved} onToggle={handleSave} tone="glass" size="md" />
      </View>
    </View>
  );
}

// ─── DirectoryCard ────────────────────────────────────────────────────────────

export function DirectoryCard({
  profile,
  colors,
}: {
  profile: Profile;
  colors: ReturnType<typeof useColors>;
}) {
  const [hovered, setHovered] = useState(false);
  const color = (EntityTypeColors as Record<string, string>)[profile.entityType] ?? CultureTokens.indigo;
  const icon = TYPE_ICONS[profile.entityType] ?? 'business';
  const tags = getTags(profile);
  const profileRecord = profile as unknown as Record<string, unknown>;
  const address = getOptionalString(profileRecord, 'address');
  const isCouncil = (profile.category ?? '').toLowerCase() === 'council';
  const isProfessional = ['artist', 'creator', 'brand'].includes(profile.entityType);
  const accent = isProfessional ? CultureTokens.gold : color;
  const followersCount = (profileRecord.followersCount as number | undefined) ?? 0;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(routerProfileHref(profile) as Parameters<typeof router.push>[0]);
  };

  const renderStars = (rating: number) =>
    [1, 2, 3, 4, 5].map((star) => (
      <Ionicons key={star} name={star <= Math.round(rating) ? 'star' : 'star-outline'} size={11} color={CultureTokens.gold} />
    ));

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        s.directoryCard,
        { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 },
        isProfessional && { borderColor: CultureTokens.gold + '60', borderWidth: 1.5 },
        isCouncil && { borderColor: CultureTokens.indigo + '60', borderWidth: 1.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        hovered && Platform.OS === 'web' && {
          transform: [{ scale: 1.02 }],
          borderColor: accent,
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowColor: accent,
        },
        Platform.OS !== 'web' && shadows.small,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${profile.name} profile`}
    >
      {(isCouncil || isProfessional) && (
        <LinearGradient
          colors={isProfessional
            ? [`${CultureTokens.gold}08`, 'transparent']
            : [`${CultureTokens.indigo}08`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={s.profileCardInner}>
        {/* Avatar / Icon */}
        {profile.imageUrl ? (
          <Image
            source={{ uri: profile.imageUrl }}
            style={s.profileAvatar}
            contentFit="cover"
            accessibilityLabel={`${profile.name} logo`}
            transition={300}
          />
        ) : (
          <View style={[s.profileIconBox, { backgroundColor: color + '12', borderWidth: 1, borderColor: color + '25' }]}>
            <Ionicons
              name={isCouncil ? 'shield-checkmark' : (icon as keyof typeof Ionicons.glyphMap)}
              size={28}
              color={color}
            />
          </View>
        )}

        {/* Content */}
        <View style={s.profileCardContent}>
          <View style={s.profileNameRow}>
            <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
              {profile.name}
            </Text>
            {(profile.isVerified || isProfessional) && (
              <Ionicons
                name="shield-checkmark"
                size={15}
                color={isProfessional ? CultureTokens.gold : colors.primary}
              />
            )}
          </View>

          <View style={s.profileBadgeRow}>
            <View style={[s.categoryBadge, { backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '25' }]}>
              <Text style={[s.categoryBadgeText, { color: accent }]} numberOfLines={1}>
                {profile.category ?? profile.entityType}
              </Text>
            </View>
            {(address || profile.city) ? (
              <View style={s.profileLocationRow}>
                <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                <Text style={[s.profileLocationText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {address ?? (profile.city ?? '')}
                </Text>
              </View>
            ) : null}
          </View>

          {profile.description ? (
            <Text style={[s.profileDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {profile.description}
            </Text>
          ) : null}

          <View style={s.profileMetaRow}>
            {profile.rating != null ? (
              <View style={s.starsRow}>
                {renderStars(profile.rating)}
                {(profile.reviewsCount ?? 0) > 0 ? (
                  <Text style={[s.reviewCountText, { color: colors.textTertiary }]}>
                    ({profile.reviewsCount})
                  </Text>
                ) : null}
              </View>
            ) : followersCount > 0 ? (
              <Text style={[s.followersText, { color: colors.textTertiary }]}>
                {followersCount >= 1000
                  ? `${(followersCount / 1000).toFixed(1)}k`
                  : followersCount}{' '}followers
              </Text>
            ) : tags.length > 0 ? (
              <View style={s.tagsRow}>
                {tags.slice(0, 2).map(tag => (
                  <GlassView key={tag} intensity={5} style={[s.tagPill, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight }]}>
                    <Text style={[s.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                  </GlassView>
                ))}
                {tags.length > 2 ? (
                  <Text style={[s.moreTagsText, { color }]}>+{tags.length - 2}</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={[s.viewLink, { color: colors.primary }]}>View →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── DirectoryEmptyState ──────────────────────────────────────────────────────

export function DirectoryEmptyState({
  selectedType,
  city,
  hasActiveFilters,
  colors,
  onReset,
}: {
  selectedType: string;
  city: string | null | undefined;
  hasActiveFilters: boolean;
  colors: ReturnType<typeof useColors>;
  onReset: () => void;
}) {
  const filter = ENTITY_FILTERS.find(f => f.label === selectedType);
  const entityLabel = filter?.display ?? 'listings';
  const icon = filter?.icon ?? 'search';
  const cityLabel = city ? ` in ${city}` : '';

  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIconBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Ionicons name={icon as any} size={40} color={CultureTokens.indigo} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>
        No {entityLabel.replace('🪃 ', '').toLowerCase()} found{cityLabel}
      </Text>
      <Text style={[s.emptySubtext, { color: colors.textSecondary }]}>
        {hasActiveFilters
          ? 'Try adjusting your filters or search term to discover more cultural gems.'
          : 'Check back soon! We are constantly adding new venues, artists, and organisations to the directory.'}
      </Text>
      {hasActiveFilters && (
        <M3Button
          variant="tonal"
          onPress={onReset}
          style={{ marginTop: 16 }}
          leftIcon="refresh"
        >
          Reset Filters
        </M3Button>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const s = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden',
  },
  title: {
    fontSize: FontSize.title2,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.title2,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    opacity: 0.8,
  },

  // ── Search ──
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    height: '100%',
    padding: 0,
    minWidth: 0,
  },

  // ── Filter block ──
  filterBlock:  { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 10, paddingBottom: 6 },
  filterRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  clearBtnText: { fontSize: 12, fontFamily: FontFamily.semibold },

  // ── Divider ──
  divider: { height: StyleSheet.hairlineWidth },

  // ── List ──
  list: { paddingTop: 16 },

  // ── Web 2-col grid (FlashList row: use flex so cells fill the row, not a fixed % width) ──
  resultsGridWeb:     { flexDirection: 'row', flexWrap: 'wrap' },
  resultsGridItemWeb: { flex: 1, minWidth: 0, alignSelf: 'stretch' },
  resultsCardWrapperWeb: {
    padding: 10,
    flex: 1,
    minWidth: 0,
  },
  resultsCardWrapperMobile: {
    marginBottom: 16,
    width: '100%',
  },

  // ── Directory card (shared base) ──
  cardOuter: { width: '100%', position: 'relative', marginBottom: 16 },
  directoryCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  // ── Event card ──
  eventCardInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 116,
  },
  eventImgBlock: {
    width: 100,
    alignSelf: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 116,
  },
  eventDateOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 1,
  },
  eventDateBlock: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 2,
    overflow: 'hidden',
  },
  eventDateDay: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    lineHeight: 26,
  },
  eventDateMonth: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
  },
  eventCardContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    justifyContent: 'center',
  },
  eventCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 2,
  },
  eventCatText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  eventCardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eventLocationText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventPriceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventPriceText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  saveBtnContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },

  // ── Profile card ──
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 18,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileCardContent: {
    flex: 1,
    gap: 6,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    flexShrink: 1,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  profileLocationText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    flexShrink: 1,
  },
  profileDesc: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
    opacity: 0.95,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewCountText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },
  followersText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'nowrap',
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    overflow: 'hidden',
  },
  tagText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  moreTagsText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  viewLink: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    marginLeft: 'auto',
  },

  // ── Empty state ──
  emptyState:  { alignItems: 'center', paddingVertical: 48 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    overflow: 'hidden',
  },
  emptyTitle:   { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.4, textAlign: 'center' },
  emptySubtext: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  // ── Acknowledgement footer ──
  acknowledgementWrap: {
    padding: 32,
    marginTop: 24,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    gap: 16,
  },
  acknowledgementText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 440,
  },
});
