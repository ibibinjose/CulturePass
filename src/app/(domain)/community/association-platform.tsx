import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { GlassView } from '@/design-system/ui/GlassView';
import { cityAmbient } from '@/components/city/CityDestinationStyles';
import { CultureTokens, FontFamily, gradients } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { listingCreateNavigateParams } from '@/constants/navigation/experienceNav';
import { useSafeBack } from '@/lib/navigation';

const COMMUNITY_CATEGORIES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: 'people-circle-outline',
    title: 'Cultural & diaspora communities',
    body:
      'Heritage groups, language communities, and cultural hubs where members gather around shared identity, tradition, and place.',
  },
  {
    icon: 'ribbon-outline',
    title: 'Associations & member organisations',
    body:
      'Professional bodies, industry groups, and member-based associations that run programs, chapters, and volunteer-led initiatives.',
  },
  {
    icon: 'storefront-outline',
    title: 'Businesses & venues',
    body:
      'Hosts that list events, offers, and experiences—restaurants, venues, brands, and cultural businesses engaging local audiences.',
  },
  {
    icon: 'heart-outline',
    title: 'NGOs & charities',
    body:
      'Non-profits and community benefit organisations building visibility, volunteers, and donors around a clear mission.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Government & councils',
    body:
      'Civic entities and public programs connecting residents with culture, services, and local representation where relevant.',
  },
  {
    icon: 'football-outline',
    title: 'Clubs & societies',
    body:
      'Sports, hobby, and special-interest groups that need a simple way to organise members, events, and communication.',
  },
];

const PLATFORM_PILLARS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'git-network-outline',
    title: 'Flexibility for different association models',
    body: 'Adapt the platform to chapters, SIGs, volunteers, and hybrid membership structures.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Scalability as membership and programs grow',
    body: 'Grow headcount, geography, and programming without multiplying disconnected tools.',
  },
  {
    icon: 'construct-outline',
    title: 'Tools to build, manage, and engage',
    body: 'One place for identity, onboarding, events, and participation—not a patchwork of logins.',
  },
];

const PROBLEM_FRAGMENTS: { title: string; bullets: string[] }[] = [
  {
    title: 'Fragmented member experience',
    bullets: [
      'Members struggle with multiple accounts and logins across various systems.',
      'Complex onboarding processes deter engagement and participation.',
      'Scattered tools reduce activity and split attention across every platform.',
    ],
  },
  {
    title: 'Administrative inefficiencies',
    bullets: [
      'SIG leaders and volunteers lose time navigating and managing too many tools.',
      'Compiling data and analytics across disconnected systems makes success hard to measure.',
      'Managing multiple contracts and vendors adds unnecessary cost and complexity.',
    ],
  },
  {
    title: 'Organizational implications',
    bullets: [
      'Costs and operational overhead increase as systems and vendor relationships multiply.',
      'Programs and services become harder to scale efficiently.',
      'Innovation slows compared with associations using integrated systems.',
      'Leaders have less usable data for long-term planning and decision-making.',
    ],
  },
];

const SOLUTION_BLOCKS: { title: string; body: string; bullets: string[] }[] = [
  {
    title: 'One member journey',
    body: 'Bring identity, onboarding, communication, events, and participation into one connected experience.',
    bullets: [
      'Reduce login friction and make it easier for members to discover where they belong.',
    ],
  },
  {
    title: 'One operational system',
    body: 'Give association teams and volunteer leaders a shared platform instead of a patchwork of tools.',
    bullets: ['Simplify administration, reporting, and day-to-day community management.'],
  },
  {
    title: 'One scalable foundation',
    body: 'Use unified data to measure engagement, guide decisions, and support long-term planning.',
    bullets: [
      'Launch new programs faster and scale services without multiplying operational complexity.',
    ],
  },
];

export default function AssociationCommunityPlatformScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, contentWidth, isDesktop, tabBarHeight } = useLayout();
  const maxProse = 720;
  const bottomPad = Math.max(tabBarHeight, 28);
  const goBack = useSafeBack();

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cityAmbient.mesh}
          pointerEvents="none"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: bottomPad + 40,
            paddingTop: (Platform.OS === 'web' ? 0 : insets.top) + 16,
          }}
        >
          <View
            style={[
              styles.shell,
              { paddingHorizontal: hPad, maxWidth: isDesktop ? contentWidth : undefined, alignSelf: 'center', width: '100%' },
            ]}
          >
            <View style={styles.topBar}>
              <GlassView
                borderRadius={22}
                bordered={false}
                style={{ width: 44, height: 44 }}
                contentStyle={styles.glassCircle}
              >
                <Pressable
                  onPress={goBack}
                  style={styles.iconHit}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </Pressable>
              </GlassView>
            </View>

            <View style={[styles.prose, { maxWidth: maxProse }]}>
              <Text style={[styles.kicker, { color: CultureTokens.violet }]}>COMMUNITY ON CULTUREPASS</Text>
              <Text style={[styles.h1, { color: colors.text }]}>What is a community?</Text>
              <Text style={[styles.lead, { color: colors.textSecondary }]}>
                On CulturePass, a community is a dedicated space for a group of people—whether cultural, professional,
                civic, or commercial—to share identity, host events, surface offers, and stay connected. Communities can
                be open or invite-based, local or global, and sit alongside businesses, venues, and organisations in one
                directory members actually use.
              </Text>
            </View>

            <Text style={[styles.h2, { color: colors.text, marginTop: 8, marginBottom: 14, maxWidth: maxProse }]}>
              Types of communities & organisations
            </Text>
            <View style={styles.categoryGrid}>
              {COMMUNITY_CATEGORIES.map((item) => (
                <View
                  key={item.title}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                      flexBasis: isDesktop ? '47%' : '100%',
                      maxWidth: isDesktop ? (contentWidth - 12) / 2 : undefined,
                    },
                  ]}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.categoryBody, { color: colors.textSecondary }]}>{item.body}</Text>
                </View>
              ))}
            </View>

            <LinearGradient
              colors={[CultureTokens.indigo + '22', CultureTokens.teal + '18']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.platformBand, { borderColor: colors.borderLight }]}
            >
              <Text style={[styles.kicker, { color: CultureTokens.indigo, marginBottom: 6 }]}>
                ASSOCIATION COMMUNITY PLATFORM
              </Text>
              <Text style={[styles.h1, { color: colors.text, marginBottom: 12 }]}>
                Empower your association with CulturePass
              </Text>
              <Text style={[styles.lead, { color: colors.textSecondary, marginBottom: 20 }]}>
                CulturePass offers a full-stack online community platform designed for flexibility and scalability,
                empowering associations to build, manage, and engage vibrant communities with ease.
              </Text>
              {PLATFORM_PILLARS.map((p) => (
                <View key={p.title} style={styles.pillarRow}>
                  <Ionicons name={p.icon} size={20} color={CultureTokens.indigo} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pillarTitle, { color: colors.text }]}>{p.title}</Text>
                    <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>{p.body}</Text>
                  </View>
                </View>
              ))}
            </LinearGradient>

            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.h2, { color: colors.text, marginBottom: 6 }]}>The problem</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Fragmented tech, fragmented community
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary, marginBottom: 16 }]}>
                The true cost of using multiple disparate technologies to run your association’s community.
              </Text>
              {PROBLEM_FRAGMENTS.map((block) => (
                <View key={block.title} style={styles.block}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>{block.title}</Text>
                  {block.bullets.map((b) => (
                    <View key={b} style={styles.bulletRow}>
                      <Text style={[styles.bullet, { color: CultureTokens.coral }]}>•</Text>
                      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.h2, { color: colors.text, marginBottom: 6 }]}>The solution</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                One integrated platform for association growth
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary, marginBottom: 16 }]}>
                CulturePass brings community infrastructure into a single system so your association can build, manage,
                and grow member engagement without the drag of fragmented tools.
              </Text>
              {SOLUTION_BLOCKS.map((block) => (
                <View key={block.title} style={styles.block}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>{block.title}</Text>
                  <Text style={[styles.body, { color: colors.textSecondary, marginBottom: 8 }]}>{block.body}</Text>
                  {block.bullets.map((b) => (
                    <View key={b} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} style={{ marginTop: 2 }} />
                      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.push(listingCreateNavigateParams('community') as never)}
              style={[styles.cta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.ctaText, { color: colors.textInverse }]}>Start a community hub</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { gap: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  glassCircle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  iconHit: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  prose: { marginBottom: 24 },
  kicker: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  lead: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  categoryCard: {
    flexGrow: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    marginBottom: 6,
  },
  categoryBody: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  platformBand: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  pillarTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    marginBottom: 4,
  },
  pillarBody: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  block: { marginBottom: 18 },
  blockTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    width: 14,
  },
  bulletText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 8,
  },
  ctaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
});
