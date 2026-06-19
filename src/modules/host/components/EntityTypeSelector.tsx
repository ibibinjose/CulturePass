import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import { navigateToCreateById, navigateToPageProEntity } from '@/lib/creationRouting';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Luxe, luxeDark, SignatureGradient, Spacing, Radius, CardTokens, TextStyles, CultureTokens } from '@/design-system/tokens/theme';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { Badge } from '@/design-system/ui/Badge';
import type { Profile } from '@/shared/schema';

// Entity types as defined in the spec
// Note: 'organiser' maps to Profile.entityType 'organiser', 'professional' is a new type
export type EntityType = 'community' | 'organiser' | 'venue' | 'business' | 'artist' | 'professional';

export interface EntityTypeSelectorProps {
  onSelect: (entityType: EntityType) => void;
  existingProfiles?: Profile[];
  /** Special intent from upstream flows (e.g. nation-builder) */
  intent?: string;
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
    color: Luxe.colors.dark.accent,
    requiresVerification: false,
    category: 'communities',
  },
  {
    type: 'organiser',
    icon: 'flag-outline',
    title: 'Organiser',
    description: 'Create the producing brand behind festivals, series, and ticketing. Showcase credentials and past events.',
    color: Luxe.colors.dark.accent,
    requiresVerification: true,
    category: 'communities',
  },
  // Venues category
  {
    type: 'venue',
    icon: 'location-outline',
    title: 'Venue',
    description: 'Register halls, galleries, clubs, theatres, and cultural spaces with capacity and technical specifications.',
    color: Luxe.colors.dark.emerald,
    requiresVerification: true,
    category: 'venues',
  },
  // Businesses category
  {
    type: 'business',
    icon: 'briefcase-outline',
    title: 'Business',
    description: 'Add shops, services, producers, and cultural brands with product catalogues and business hours.',
    color: Luxe.colors.dark.accent,
    requiresVerification: true,
    category: 'businesses',
  },
  {
    type: 'artist',
    icon: 'mic-outline',
    title: 'Artist',
    description: 'Create performer, maker, speaker, and creative profiles with portfolios and availability calendars.',
    color: Luxe.colors.dark.primary,
    requiresVerification: false,
    category: 'businesses',
  },
  {
    type: 'professional',
    icon: 'school-outline',
    title: 'Professional',
    description: 'Showcase freelancer, expert, or influencer credentials with rate cards and areas of expertise.',
    color: Luxe.colors.dark.primary,
    requiresVerification: true,
    category: 'businesses',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  communities: 'Communities & Organisers',
  venues: 'Venues & Spaces',
  businesses: 'Businesses & Creators',
};

export function EntityTypeSelector({ onSelect, existingProfiles = [], intent }: EntityTypeSelectorProps) {
  const colors = useColors();
  const { hPad, isDesktop, isCompact } = useLayout();

  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const isNationBuilder = intent === 'nation-builder';

  // Mobile quick actions bottom sheet
  const [showMobileQuick, setShowMobileQuick] = useState(false);

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
          <LuxeCard
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: alreadyCreated ? Luxe.colors.dark.emerald + '44' : colors.borderLight },
              alreadyCreated && styles.cardExisting,
            ]}
            variant={alreadyCreated ? 'tonal' : 'default'}
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
                {/* Phase 1 Unification indicator */}
                {['business', 'venue', 'artist', 'professional', 'organiser', 'community'].includes(entity.type) && (
                  <Badge
                    variant="success"
                    size="sm"
                    style={styles.proWizardBadge}
                  >
                    Pro Wizard
                  </Badge>
                )}
              </View>

              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                {entity.description}
              </Text>

              {alreadyCreated && (
                <View style={styles.existingBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Luxe.colors.dark.emerald} />
                  <Text style={[styles.existingText, { color: Luxe.colors.dark.emerald }]}>
                    Already created
                  </Text>
                </View>
              )}
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>

            {/* Creator Trust indicator: Rich profiles use the full guided wizard */}
            {/* FIXES-001: absolute overlay badge — tracked for potential extraction (see docs/FIXES-001) */}
            {['community', 'organiser', 'venue', 'business', 'artist', 'professional'].includes(entity.type) && (
              <View style={styles.guidedBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color={Luxe.colors.dark.accent} />
                <Text style={styles.guidedBadgeText}>Guided wizard</Text>
              </View>
            )}
          </LuxeCard>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View 
        style={[
          styles.topBar, 
          { 
            paddingTop: topInset, 
            backgroundColor: colors.surface, 
            borderColor: colors.borderLight 
          }
        ]}
      >
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/hostspace' as never);
              }
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Back to host workspace"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>
            {isNationBuilder ? 'Nation Builder Partner' : 'Create a Page'}
          </Text>
          <View style={styles.topBarSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingHorizontal: hPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {isNationBuilder ? (
            <LinearGradient
              // FIXES-001: nation-builder gradient uses a deliberate warm variation for the hero.
              // The middle stop is intentionally a touch lighter than heritage gold for contrast on the dark overlay.
              colors={[Luxe.colors.dark.secondary, CultureTokens.heritageGold, CultureTokens.appBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.9 }}
              style={styles.heroGradient}
            >
              <View style={styles.nbHeroContent}>
                <View style={styles.nbBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.textInverse} />
                  <Text style={styles.nbBadgeText}>NATION BUILDER PARTNER</Text>
                </View>
                <Text style={[styles.nbHeroTitle, { color: colors.textOnBrandGradient }]}>Become a Nation Builder Partner</Text>
                <Text style={[styles.nbHeroSubtitle, { color: colors.textOnBrandGradient }]}>
                  Register your business or venue. Your employees get 50% off CulturePass+ and special Nation Builder badges. Powerful staff retention + visibility tool.
                </Text>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={SignatureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <Text style={[styles.heroTitle, { color: colors.textOnBrandGradient }]}>Create a Page</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textOnBrandGradient }]}>
                Your Page is your home on CulturePass — where people discover your culture, events, stories and community.
              </Text>
              <Text style={[styles.heroSubtitle, styles.heroSubtitleHint, { color: colors.textOnBrandGradient }]}>
                Which option is best for you?
              </Text>
            </LinearGradient>
          )}
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

        {/* Quick Content Section — prominent on web for fast publishing without full profiles */}
        {isDesktop && (
          <View style={styles.quickSection}>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
              Or publish something quickly
            </Text>
            <View style={styles.quickGrid}>
              {[
                { label: 'Event', icon: 'calendar-outline', categoryId: 'event' },
                { label: 'Listing', icon: 'pricetag-outline', categoryId: 'other-listing' },
                { label: 'Offer', icon: 'gift-outline', categoryId: 'offer' },
                { label: 'Activity', icon: 'flash-outline', categoryId: 'activity' },
              ].map((action, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => navigateToCreateById(action.categoryId, { source: 'entity_type_selector_quick' })}
                  style={({ pressed }) => [
                    styles.quickCard,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons name={action.icon as any} size={22} color={Luxe.colors.dark.accent} />
                  <Text style={[styles.quickLabel, { color: colors.text }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.quickHint, { color: colors.textTertiary }]}>
              These publish under one of your existing profiles (you can choose which one).
            </Text>
          </View>
        )}

        {/* Start with a template / Import inspiration */}
        <View style={styles.templatesSection}>
          <Text style={[styles.categoryLabel, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
            Start with a template
          </Text>
          <View style={styles.templatesGrid}>
            {[
              { title: 'Diaspora Festival', desc: 'Pre-filled for event organisers', icon: 'calendar' },
              { title: 'Indie Venue', desc: 'For spaces & stages', icon: 'location' },
              { title: 'Cultural Creator', desc: 'Artist or maker profile', icon: 'person' },
            ].map((tpl, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  // Future: prefill wizard formData with template values
                  navigateToPageProEntity('organiser', 'entity_type_selector_template');
                }}
                style={[styles.templateCard, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name={`${tpl.icon}-outline` as any} size={22} color={Luxe.colors.dark.accent} />
                <Text style={[styles.templateTitle, { color: colors.text }]}>{tpl.title}</Text>
                <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{tpl.desc}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.templateNote}>More templates coming soon. Or import data from an existing profile.</Text>
        </View>

        {/* Mobile Quick Actions - Bottom sheet style */}
        {!isDesktop && (
          <View style={styles.mobileQuickSection}>
            <Pressable
              onPress={() => setShowMobileQuick(true)}
              style={[styles.mobileQuickButton, { backgroundColor: colors.surfaceElevated, borderColor: Luxe.colors.dark.accent + '30' }]}
            >
              <Ionicons name="flash-outline" size={20} color={Luxe.colors.dark.accent} />
              <Text style={[styles.mobileQuickText, { color: colors.text }]}>Quick publish (Event, Listing, Offer...)</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Mobile Quick Actions Bottom Sheet */}
      <Modal
        visible={showMobileQuick}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMobileQuick(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowMobileQuick(false)}>
          <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Quick publish</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              Publish fast under an existing profile
            </Text>

            {[
              { label: 'New Event', icon: 'calendar-outline', categoryId: 'event', desc: 'Festivals, workshops, gigs' },
              { label: 'New Marketplace Listing', icon: 'pricetag-outline', categoryId: 'market-product', desc: 'Products, services, tickets' },
              { label: 'New Offer / Perk', icon: 'gift-outline', categoryId: 'offer', desc: 'Discounts, experiences' },
              { label: 'New Activity', icon: 'flash-outline', categoryId: 'activity', desc: 'Pop-ups, meetups' },
            ].map((item, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setShowMobileQuick(false);
                  navigateToCreateById(item.categoryId, { source: 'entity_type_selector_mobile_quick' });
                }}
                style={({ pressed }) => [
                  styles.sheetOption,
                  { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
                ]}
              >
                <View style={styles.sheetIconWrap}>
                  <Ionicons name={item.icon as any} size={24} color={Luxe.colors.dark.accent} />
                </View>
                <View style={styles.sheetOptionBody}>
                  <Text style={[styles.sheetOptionLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.sheetOptionDesc, { color: colors.textTertiary }]}>{item.desc}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            ))}

            <Pressable onPress={() => setShowMobileQuick(false)} style={styles.sheetCancel}>
              <Text style={[styles.sheetCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...TextStyles.title3,
    fontSize: 18,
    textAlign: 'center',
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
    paddingVertical: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  heroTitle: {
    ...TextStyles.title2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    opacity: 0.95,
    maxWidth: 600,
  },
  heroSubtitleHint: {
    fontSize: 13,
    marginTop: 8,
    opacity: 0.9,
  },
  topBarSpacer: {
    width: 40,
  },
  proWizardBadge: {
    marginLeft: 6,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  backBtnPressed: {
    opacity: 0.7,
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
    gap: Spacing.md,
  },
  cardWrapper: {
    width: '100%',
  },
  cardWrapperDesktop: {
    width: '31.5%' as unknown as import('react-native').DimensionValue,
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
    borderWidth: 1,
    borderColor: 'transparent',
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

  // Nation Builder Partner special hero
  nbHeroContent: {
    padding: Spacing.xl,
    alignItems: 'flex-start',
  },
  nbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28,25,23,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  nbBadgeText: {
    fontFamily: TextStyles.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: luxeDark.textInverse,
  },
  nbHeroTitle: {
    ...TextStyles.headline,
    color: luxeDark.textInverse,
    marginBottom: Spacing.xs,
  },
  nbHeroSubtitle: {
    ...TextStyles.body,
    color: 'rgba(28,25,23,0.85)',
    lineHeight: 22,
  },

  // Creator Trust: Visual signal that rich profiles use the full guided wizard (not quick form)
  // FIXES-001: absolute badge pattern — consider extracting to a shared AbsoluteBadge/OverlayBadge atom in a follow-up pass.
  guidedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Luxe.colors.dark.accent + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  guidedBadgeText: {
    ...TextStyles.caption,
    color: Luxe.colors.dark.accent,
    fontWeight: '600',
    fontSize: 10,
  },

  // Quick publish actions (web only, for fast creation without full profile wizard)
  quickSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 140,
  },
  quickLabel: {
    ...TextStyles.callout,
    fontWeight: '600',
  },
  quickHint: {
    ...TextStyles.caption,
    marginTop: Spacing.sm,
    fontSize: 12,
  },

  // Mobile quick actions
  mobileQuickSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  mobileQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  mobileQuickText: {
    ...TextStyles.callout,
    fontWeight: '600',
    flex: 1,
  },

  // Bottom sheet styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(120,120,128,0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...TextStyles.title3,
    textAlign: 'center',
  },
  sheetSubtitle: {
    ...TextStyles.caption,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  sheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Luxe.colors.dark.accent + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionBody: {
    flex: 1,
  },
  sheetOptionLabel: {
    ...TextStyles.callout,
    fontWeight: '600',
  },
  sheetOptionDesc: {
    ...TextStyles.caption,
    marginTop: 2,
  },
  sheetCancel: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontWeight: '600',
  },

  // Templates / Import inspiration
  templatesSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  templatesGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  templateCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'flex-start',
    gap: 6,
  },
  templateTitle: {
    ...TextStyles.callout,
    fontWeight: '700',
  },
  templateDesc: {
    ...TextStyles.caption,
  },
  templateNote: {
    ...TextStyles.caption,
    fontSize: 11,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
