import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  TextStyles,
  Radius,
  Spacing,
  SignatureGradient,
  CardTokens,
} from '@/design-system/tokens/theme';
import { M3Card } from '@/design-system/ui/M3Card';
import { Badge } from '@/design-system/ui/Badge';
import type { Profile } from '@/shared/schema';

// Entity types as defined in the spec
// Note: 'organizer' maps to Profile.entityType 'organizer', 'professional' is a new type
export type EntityType = 'community' | 'organizer' | 'venue' | 'business' | 'artist' | 'professional';

export interface EntityTypeSelectorProps {
  onSelect: (entityType: EntityType) => void;
  existingProfiles?: Profile[];
}

interface EntityTypeCard {
  type: EntityType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  requiresVerification: boolean;
  category: 'communities' | 'venues' | 'businesses';
}

const ENTITY_TYPES: EntityTypeCard[] = [
  // Communities category
  {
    type: 'community',
    icon: 'people-outline',
    title: 'Community',
    description: 'Launch a diaspora group, cultural association, or member community with free, paid, or invite-only membership models.',
    color: CultureTokens.indigo,
    requiresVerification: false,
    category: 'communities',
  },
  {
    type: 'organizer',
    icon: 'flag-outline',
    title: 'Organiser',
    description: 'Create the producing brand behind festivals, series, and ticketing. Showcase credentials and past events.',
    color: CultureTokens.indigo,
    requiresVerification: true,
    category: 'communities',
  },
  // Venues category
  {
    type: 'venue',
    icon: 'location-outline',
    title: 'Venue',
    description: 'Register halls, galleries, clubs, theatres, and cultural spaces with capacity and technical specifications.',
    color: CultureTokens.teal,
    requiresVerification: true,
    category: 'venues',
  },
  // Businesses category
  {
    type: 'business',
    icon: 'briefcase-outline',
    title: 'Business',
    description: 'Add shops, services, producers, and cultural brands with product catalogues and business hours.',
    color: CultureTokens.violet,
    requiresVerification: true,
    category: 'businesses',
  },
  {
    type: 'artist',
    icon: 'mic-outline',
    title: 'Artist',
    description: 'Create performer, maker, speaker, and creative profiles with portfolios and availability calendars.',
    color: CultureTokens.coral,
    requiresVerification: false,
    category: 'businesses',
  },
  {
    type: 'professional',
    icon: 'school-outline',
    title: 'Professional',
    description: 'Showcase freelancer, expert, or influencer credentials with rate cards and areas of expertise.',
    color: CultureTokens.coral,
    requiresVerification: true,
    category: 'businesses',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  communities: 'Communities & Organisers',
  venues: 'Venues & Spaces',
  businesses: 'Businesses & Creators',
};

export function EntityTypeSelector({ onSelect, existingProfiles = [] }: EntityTypeSelectorProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop, isCompact } = useLayout();

  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  // Group entity types by category
  const groupedTypes = React.useMemo(() => {
    const groups: Record<string, EntityTypeCard[]> = {
      communities: [],
      venues: [],
      businesses: [],
    };
    ENTITY_TYPES.forEach((type) => {
      groups[type.category].push(type);
    });
    return groups;
  }, []);

  // Check if user already has a profile of this type
  const hasProfile = (type: EntityType) => {
    return existingProfiles.some((profile) => profile.entityType === type);
  };

  const renderEntityCard = (entity: EntityTypeCard, index: number) => {
    const alreadyCreated = hasProfile(entity.type);

    return (
      <Animated.View
        key={entity.type}
        entering={FadeInDown.delay(index * 80).springify()}
        style={[
          styles.cardWrapper,
          isDesktop && styles.cardWrapperDesktop,
          isCompact && styles.cardWrapperCompact,
        ]}
      >
        <Pressable
          onPress={() => onSelect(entity.type)}
          style={({ pressed }) => [
            styles.cardPressable,
            pressed && styles.cardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Create ${entity.title} profile. ${entity.description}${entity.requiresVerification ? ' Requires verification.' : ''}${alreadyCreated ? ' Already created.' : ''}`}
          accessibilityHint="Tap to start creating this profile type"
        >
          <M3Card
            style={[
              styles.card,
              { backgroundColor: colors.surface },
              alreadyCreated && styles.cardExisting,
            ]}
            variant="elevated"
          >
            {/* Icon with colored background */}
            <View style={[styles.iconContainer, { backgroundColor: entity.color + '18' }]}>
              <Ionicons name={entity.icon} size={32} color={entity.color} />
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>{entity.title}</Text>
                {entity.requiresVerification && (
                  <Badge
                    variant="primary"
                    size="sm"
                    style={styles.verificationBadge}
                  >
                    Verification
                  </Badge>
                )}
              </View>

              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                {entity.description}
              </Text>

              {alreadyCreated && (
                <View style={styles.existingBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={CultureTokens.teal} />
                  <Text style={[styles.existingText, { color: CultureTokens.teal }]}>
                    Already created
                  </Text>
                </View>
              )}
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </M3Card>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + Spacing.xl, paddingHorizontal: hPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={SignatureGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroTitle}>Create Your Host Profile</Text>
            <Text style={styles.heroSubtitle}>
              Choose the type of profile that best represents your cultural presence on CulturePass
            </Text>
          </LinearGradient>
        </View>

        {/* Entity Type Cards by Category */}
        {Object.entries(groupedTypes).map(([category, types]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
              {CATEGORY_LABELS[category]}
            </Text>
            <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
              {types.map((entity, index) => renderEntityCard(entity, index))}
            </View>
          </View>
        ))}

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  heroSection: {
    marginBottom: Spacing.xl,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    ...TextStyles.title2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...TextStyles.body,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    maxWidth: 600,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryLabel: {
    ...TextStyles.title3,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  cardsGrid: {
    gap: Spacing.md,
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    width: '100%',
  },
  cardWrapperDesktop: {
    width: '48%' as unknown as import('react-native').DimensionValue,
  },
  cardWrapperCompact: {
    width: '100%',
  },
  cardPressable: {
    width: '100%',
  },
  cardPressed: {
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: CardTokens.radius,
    minHeight: 120,
  },
  cardExisting: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  title: {
    ...TextStyles.headline,
  },
  verificationBadge: {
    marginLeft: Spacing.xs,
  },
  description: {
    ...TextStyles.caption,
    lineHeight: 18,
  },
  existingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  existingText: {
    ...TextStyles.caption,
    fontWeight: '600',
  },
  arrowContainer: {
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
