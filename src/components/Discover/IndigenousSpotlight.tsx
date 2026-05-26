import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens } from '@/design-system/tokens/theme';
import SectionHeader from './SectionHeader';
import { GlassView } from '@/design-system/ui/GlassView';
import type { IndigenousOrganisation, IndigenousFestival, IndigenousBusiness } from '@/lib/api';


interface IndigenousSpotlightProps {
  land?: { landName: string; traditionalCustodians: string };
  organisations: IndigenousOrganisation[];
  festivals: IndigenousFestival[];
  businesses: IndigenousBusiness[];
}

function IndigenousSpotlightComponent({ land, organisations, festivals, businesses }: IndigenousSpotlightProps) {
  const colors = useColors();
  const { isDesktop, vPad } = useLayout();
  const { pad, scrollPadStyle, headerPadStyle } = useDiscoverRailInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View>
      {/* Land Acknowledgement Banner */}
      {land && (
        <View style={{ marginHorizontal: isDesktop ? 0 : pad, marginBottom: vPad + 8 }}>
          <GlassView
            borderRadius={24}
            style={styles.landBanner}
            contentStyle={styles.landBannerContentFull}
          >
            <LinearGradient
              colors={['rgba(212,165,116,0.15)', 'rgba(212,165,116,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.landBannerContent}>
              <View style={styles.landIconWrap}>
                <Ionicons name="leaf" size={18} color={CultureTokens.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.landBannerTitle}>You are on {land.landName}</Text>
                <Text style={styles.landBannerSub}>Traditional Custodians: {land.traditionalCustodians}</Text>
              </View>
            </View>
          </GlassView>
        </View>
      )}

      {/* Organisations Rail */}
      {organisations.length > 0 && (
        <View
          style={[
            styles.orgSection,
            { marginHorizontal: isDesktop ? 0 : pad, marginBottom: vPad },
          ]}
        >
          <View style={styles.orgSectionHeader}>
            <View style={[styles.orgSectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
              <Ionicons name="people-circle" size={26} color={CultureTokens.teal} />
            </View>
            <View>
              <Text style={styles.orgSectionTitle}>First Nations Organisations</Text>
              <Text style={styles.orgSectionSub}>Supporting community-led initiatives</Text>
            </View>
          </View>
          <FlatList
            horizontal
            data={organisations}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[scrollPadStyle, styles.orgRail]}
            renderItem={({ item }) => (
              <GlassView
                intensity={10}
                style={[styles.orgCard, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
              >
                <View style={styles.orgCardTop}>
                  <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
                  {item.featured && (
                    <View style={styles.orgFeaturedBadge}>
                      <Text style={styles.orgFeaturedText}>FEATURED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.orgMeta}>{item.city}, {item.country}</Text>
                {!!item.nationOrPeople && (
                  <Text style={styles.orgNation} numberOfLines={1}>
                    {item.nationOrPeople}
                  </Text>
                )}
                <View style={styles.orgFocusRow}>
                  {item.focusAreas.slice(0, 2).map((focus) => (
                    <View key={`${item.id}-${focus}`} style={[styles.orgFocusPill, { borderColor: colors.borderLight, backgroundColor: colors.background + '80' }]}>
                      <Text style={styles.orgFocusText}>{focus}</Text>
                    </View>
                  ))}
                </View>
              </GlassView>
            )}
          />
        </View>
      )}

      {/* Festivals Rail */}
      {festivals.length > 0 && (
        <View style={{ marginBottom: vPad }}>
          <View style={headerPadStyle}>
            <SectionHeader
              title="Indigenous Events & Festivals"
              subtitle="Celebrate living culture and Country-led stories"
              onSeeAll={() => router.push('/explore')}
            />
          </View>
          <FlatList
            horizontal
            data={festivals}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[scrollPadStyle, styles.scrollRail]}
            renderItem={({ item }) => (
              <GlassView
                intensity={10}
                style={[styles.indigenousCard, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
              >
                <View style={styles.indigenousCardHeader}>
                  <View style={styles.indigenousTagPill}>
                    <Ionicons name="calendar-outline" size={12} color={CultureTokens.teal} />
                    <Text style={styles.indigenousTagText}>Festival</Text>
                  </View>
                  {!!item.monthHint && (
                    <Text style={styles.indigenousMonth}>{item.monthHint}</Text>
                  )}
                </View>
                <Text style={styles.indigenousTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.indigenousMeta} numberOfLines={1}>
                  {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                </Text>
                <Text style={styles.indigenousDesc} numberOfLines={3}>{item.significance}</Text>
              </GlassView>
            )}
          />
        </View>
      )}

      {/* Business Rail */}
      {businesses.length > 0 && (
        <View style={{ marginBottom: vPad }}>
          <View style={headerPadStyle}>
            <SectionHeader
              title="Indigenous Business"
              subtitle="Support First Nations-owned local businesses"
              onSeeAll={() => router.push('/(tabs)/directory')}
            />
          </View>
          <FlatList
            horizontal
            data={businesses}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[scrollPadStyle, styles.scrollRail]}
            renderItem={({ item }) => (
              <GlassView
                intensity={10}
                style={[styles.indigenousCard, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
              >
                <View style={styles.indigenousCardHeader}>
                  <View style={styles.indigenousTagPill}>
                    <Ionicons name="storefront-outline" size={12} color={CultureTokens.teal} />
                    <Text style={styles.indigenousTagText}>Business</Text>
                  </View>
                  <Text style={styles.indigenousMonth}>{item.category}</Text>
                </View>
                <Text style={styles.indigenousTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.indigenousMeta} numberOfLines={1}>
                  {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                </Text>
                <Text style={styles.indigenousDesc} numberOfLines={3}>{item.description}</Text>
              </GlassView>
            )}
          />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  landBanner: {
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)' 
  },
  landBannerContentFull: {
    padding: 20,
  },
  landIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  landBannerTitle: { ...TextStyles.headline, color: colors.text, marginBottom: 2 },
  landBannerSub: { ...TextStyles.caption, color: colors.textSecondary, lineHeight: 18 },
  
  orgSection: {},
  orgSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  orgSectionIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  orgSectionTitle: { ...TextStyles.title3, color: colors.text },
  orgSectionSub: { ...TextStyles.caption, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
  orgRail: { gap: 16 },
  orgCard: { width: 260, borderWidth: 1, borderRadius: 20, padding: 16, overflow: 'hidden' },
  orgCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orgName: { ...TextStyles.cardTitle, color: colors.text, flex: 1 },
  orgFeaturedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: CultureTokens.teal + '22' },
  orgFeaturedText: { ...TextStyles.badgeCaps, color: CultureTokens.teal },
  orgMeta: { ...TextStyles.caption, color: colors.textSecondary, marginBottom: 4 },
  orgNation: { ...TextStyles.captionSemibold, color: colors.eventDate, marginBottom: 12 },
  orgFocusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  orgFocusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  orgFocusText: { ...TextStyles.badge, color: colors.textSecondary },

  scrollRail: { gap: 16 },
  indigenousCard: { width: 280, borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  indigenousCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  indigenousTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: CultureTokens.teal + '15',
  },
  indigenousTagText: { ...TextStyles.badgeCaps, color: CultureTokens.teal },
  indigenousMonth: { ...TextStyles.badge, color: colors.textTertiary },
  indigenousTitle: { ...TextStyles.title3, color: colors.text, marginBottom: 6 },
  indigenousMeta: { ...TextStyles.callout, color: colors.textSecondary, marginBottom: 8 },
  indigenousDesc: { ...TextStyles.bodyMedium, color: colors.textTertiary, lineHeight: 18 },
});

export const IndigenousSpotlight = React.memo(IndigenousSpotlightComponent);
