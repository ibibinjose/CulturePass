/**
 * Create a Page — entity type & template selector
 * "Which option is best for you?"
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { navigateToCreateById } from '@/lib/creationRouting';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { LuxeCard, LuxeText } from '@/design-system/ui';
import { Badge } from '@/design-system/ui/Badge';
import { Luxe, SignatureGradient, Spacing, Radius, TextStyles, CultureTokens } from '@/design-system/tokens/theme';
import type { HostPage, Profile } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { PAGE_TEMPLATES } from '../config/pageTemplates.config';

export type PageEntityType = Exclude<HostEntityType, 'organizer'>;

export interface CreatePageSelectorProps {
  onSelect: (entityType: PageEntityType, templateId?: string) => void;
  existingPages?: HostPage[];
  existingProfiles?: Profile[];
  intent?: string;
}

interface EntityCard {
  type: PageEntityType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  requiresVerification: boolean;
  category: 'communities' | 'venues' | 'businesses';
}

const ENTITY_TYPES: EntityCard[] = [
  {
    type: 'community',
    icon: 'people-outline',
    title: 'Community',
    description: 'Launch a diaspora group or cultural association with free, paid, or invite-only membership.',
    color: Luxe.colors.dark.accent,
    requiresVerification: false,
    category: 'communities',
  },
  {
    type: 'organiser',
    icon: 'flag-outline',
    title: 'Organiser',
    description: 'The producing brand behind festivals, series, and ticketing experiences.',
    color: Luxe.colors.dark.accent,
    requiresVerification: true,
    category: 'communities',
  },
  {
    type: 'venue',
    icon: 'location-outline',
    title: 'Venue',
    description: 'Register halls, galleries, clubs, theatres, and cultural spaces.',
    color: Luxe.colors.dark.emerald,
    requiresVerification: true,
    category: 'venues',
  },
  {
    type: 'business',
    icon: 'briefcase-outline',
    title: 'Business',
    description: 'Shops, services, producers, and cultural brands.',
    color: Luxe.colors.dark.accent,
    requiresVerification: true,
    category: 'businesses',
  },
  {
    type: 'artist',
    icon: 'mic-outline',
    title: 'Artist',
    description: 'Performers, makers, speakers, and creative profiles.',
    color: Luxe.colors.dark.primary,
    requiresVerification: false,
    category: 'businesses',
  },
  {
    type: 'professional',
    icon: 'school-outline',
    title: 'Professional',
    description: 'Freelancers, experts, and cultural consultants.',
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

export function CreatePageSelector({
  onSelect,
  existingPages = [],
  existingProfiles = [],
  intent,
}: CreatePageSelectorProps) {
  const colors = useColors();
  const { hPad, isDesktop, isCompact } = useLayout();
  const topInset = useSafeAreaInsetsWeb().top;
  const isNationBuilder = intent === 'nation-builder';

  const groupedTypes = useMemo(() => {
    const groups: Record<string, EntityCard[]> = { communities: [], venues: [], businesses: [] };
    ENTITY_TYPES.forEach((t) => groups[t.category].push(t));
    return groups;
  }, []);

  const hasPage = (type: PageEntityType) =>
    existingPages.some((p) => p.entityType === type || (type === 'organiser' && p.entityType === 'organizer')) ||
    existingProfiles.some((p) => p.entityType === type);

  const renderCard = (entity: EntityCard, index: number) => {
    const alreadyCreated = hasPage(entity.type);
    return (
      <Animated.View
        key={entity.type}
        entering={FadeInDown.delay(index * 80).springify()}
        style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop, isCompact && styles.cardWrapperCompact]}
      >
        <Pressable
          onPress={() => onSelect(entity.type)}
          style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Create ${entity.title} page. ${entity.description}`}
          accessibilityHint="Opens the Page Pro Wizard"
        >
          <LuxeCard
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: alreadyCreated ? Luxe.colors.dark.emerald + '44' : colors.borderLight },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: entity.color + '18' }]}>
              <Ionicons name={entity.icon} size={32} color={entity.color} />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>{entity.title}</Text>
                {entity.requiresVerification && (
                  <Badge variant="primary" size="sm">Verification</Badge>
                )}
                <Badge variant="success" size="sm" style={{ marginLeft: 6 }}>Pro Wizard</Badge>
              </View>
              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                {entity.description}
              </Text>
              {alreadyCreated && (
                <View style={styles.existingBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Luxe.colors.dark.emerald} />
                  <Text style={[styles.existingText, { color: Luxe.colors.dark.emerald }]}>Already created</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </LuxeCard>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="create-page-selector">
      <View style={[styles.topBar, { paddingTop: topInset, backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/hostspace' as never))}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to host workspace"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>
            {isNationBuilder ? 'Nation Builder Partner' : 'Create a Page'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <LinearGradient colors={SignatureGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
            <Text style={styles.heroTitle}>Create a Page</Text>
            <Text style={styles.heroSubtitle}>
              Your Page is your home on CulturePass — where people discover your culture, events, stories and community.
            </Text>
            <Text style={[styles.heroSubtitle, { fontSize: 13, marginTop: 8, opacity: 0.9 }]}>
              Which option is best for you?
            </Text>
          </LinearGradient>
        </View>

        {Object.entries(groupedTypes).map(([category, types]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>{CATEGORY_LABELS[category]}</Text>
            <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
              {types.map((entity, index) => renderCard(entity, index))}
            </View>
          </View>
        ))}

        <View style={styles.templatesSection}>
          <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>Start with a template</Text>
          <View style={styles.templatesGrid}>
            {PAGE_TEMPLATES.map((tpl) => (
              <Pressable
                key={tpl.id}
                onPress={() => onSelect(tpl.entityType as PageEntityType, tpl.id)}
                style={[styles.templateCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel={`Template: ${tpl.title}. ${tpl.description}`}
              >
                <Ionicons name={`${tpl.icon}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={Luxe.colors.dark.accent} />
                <Text style={[styles.templateTitle, { color: colors.text }]}>{tpl.title}</Text>
                <Text style={[styles.templateDesc, { color: colors.textSecondary }]} numberOfLines={2}>{tpl.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isDesktop && (
          <View style={styles.quickSection}>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>Or publish something quickly</Text>
            <View style={styles.quickGrid}>
              {[
                { label: 'Event', icon: 'calendar-outline', categoryId: 'event' },
                { label: 'Listing', icon: 'pricetag-outline', categoryId: 'other-listing' },
                { label: 'Offer', icon: 'gift-outline', categoryId: 'offer' },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => navigateToCreateById(action.categoryId, { source: 'create_page_selector_quick' })}
                  style={[styles.quickCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick publish ${action.label}`}
                >
                  <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={22} color={Luxe.colors.dark.accent} />
                  <Text style={[styles.quickLabel, { color: colors.text }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { borderBottomWidth: 1, zIndex: 10 },
  topBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { ...TextStyles.title3, fontSize: 18, textAlign: 'center', flex: 1 },
  scrollContent: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  heroSection: { marginBottom: Spacing.xl, borderRadius: Radius.lg, overflow: 'hidden' },
  heroGradient: { paddingVertical: Spacing.xl * 1.5, paddingHorizontal: Spacing.xl, alignItems: 'center', borderRadius: Radius.lg },
  heroTitle: { ...TextStyles.title1, color: '#fff', textAlign: 'center' },
  heroSubtitle: { ...TextStyles.body, color: '#fff', textAlign: 'center', marginTop: 8, opacity: 0.95, maxWidth: 420 },
  categorySection: { marginBottom: Spacing.lg },
  categoryLabel: { ...TextStyles.caption, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  cardsGrid: { gap: Spacing.md },
  cardsGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  cardWrapper: { width: '100%' },
  cardWrapperDesktop: { width: '48%' },
  cardWrapperCompact: { width: '100%' },
  cardPressable: { borderRadius: Radius.lg },
  cardPressed: { opacity: 0.92 },
  card: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 4 },
  title: { ...TextStyles.title3, fontSize: 17 },
  description: { ...TextStyles.bodySmall, lineHeight: 20 },
  existingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  existingText: { ...TextStyles.caption, fontWeight: '600' },
  templatesSection: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  templateCard: { width: '47%', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, gap: 4 },
  templateTitle: { ...TextStyles.title3, fontSize: 15 },
  templateDesc: { ...TextStyles.caption },
  quickSection: { marginTop: Spacing.md },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  quickLabel: { ...TextStyles.body, fontWeight: '600' },
});