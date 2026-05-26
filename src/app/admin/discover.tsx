/**
 * Admin Discovery Curation
 * ========================
 * Manual control over Hero rails, featured cities, and trending spotlights.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';
import { Input } from '@/design-system/ui/Input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys, discoverKeys } from '@/hooks/queries/keys';

type HeroSlide = {
  id: string;
  title: string;
  city: string;
  status: 'active' | 'scheduled' | 'paused';
  image: string;
};

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  { id: '1', title: 'Summer Night Market', city: 'Sydney', status: 'active', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800' },
  { id: '2', title: 'CulturePass+ Launch', city: 'Global', status: 'active', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' },
  { id: '3', title: 'Melbourne Film Fest', city: 'Melbourne', status: 'scheduled', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800' },
];

export default function DiscoverCurationScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const queryClient = useQueryClient();

  const { data: adminCities } = useQuery({
    queryKey: adminKeys.citiesAdmin(),
    queryFn: () => api.cities.listAll(),
  });
  const { data: discoveryConfig } = useQuery({
    queryKey: adminKeys.discoveryConfig(),
    queryFn: () => api.admin.discoveryConfig(),
  });

  const [trendingMultiplier, setTrendingMultiplier] = useState('1.2');
  const [socialProofGate, setSocialProofGate] = useState('5');
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);

  useEffect(() => {
    if (!discoveryConfig) return;
    setTrendingMultiplier(String(discoveryConfig.trendingMultiplier ?? 1.2));
    setSocialProofGate(String(discoveryConfig.socialProofGate ?? 5));
    setHeroSlides(discoveryConfig.heroSlides?.length ? discoveryConfig.heroSlides : DEFAULT_HERO_SLIDES);
  }, [discoveryConfig]);

  const featuredCityIds = useMemo(
    () => (discoveryConfig?.featuredCityIds ?? []).filter((id): id is string => typeof id === 'string'),
    [discoveryConfig?.featuredCityIds],
  );

  const updateHeroSlide = (id: string, patch: Partial<HeroSlide>) => {
    setHeroSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)));
  };

  const moveHeroSlide = (id: string, direction: 'up' | 'down') => {
    setHeroSlides((prev) => {
      const idx = prev.findIndex((slide) => slide.id === id);
      if (idx === -1) return prev;
      const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const cloned = [...prev];
      const [item] = cloned.splice(idx, 1);
      cloned.splice(nextIdx, 0, item);
      return cloned;
    });
  };

  const removeHeroSlide = (id: string) => {
    setHeroSlides((prev) => prev.filter((slide) => slide.id !== id));
  };

  const addHeroSlide = () => {
    const seed = Date.now().toString(36).slice(-6);
    setHeroSlides((prev) => [
      ...prev,
      {
        id: `new-${seed}`,
        title: 'New Hero Slide',
        city: 'City',
        status: 'scheduled',
        image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800',
      },
    ]);
  };

  const saveDiscoveryConfig = useMutation({
    mutationFn: () =>
      api.admin.updateDiscoveryConfig({
        trendingMultiplier: Number(trendingMultiplier),
        socialProofGate: Number(socialProofGate),
        featuredCityIds,
        heroSlides,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.discoveryConfig() });
      queryClient.invalidateQueries({ queryKey: adminKeys.citiesAdmin() });
      queryClient.invalidateQueries({ queryKey: discoverKeys.all });
    },
  });

  const patchCityFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => api.cities.patch(id, { featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.citiesAdmin() });
      queryClient.invalidateQueries({ queryKey: discoverKeys.all });
    },
    onError: (e: Error) => Alert.alert('Could not update city', e.message ?? 'Request failed'),
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: hPad }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Discovery & Curation</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Editorial Control over Home Screen Surfaces</Text>
      </View>

      <View style={styles.layout}>
        {/* Main Column */}
        <View style={styles.mainCol}>
          {/* Hero Carousel */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>HERO CAROUSEL</Text>
            <M3Button variant="filled" onPress={addHeroSlide} leftIcon="add" style={{ height: 36 }}>
              Add Slide
            </M3Button>
          </View>

          <GlassView contentStyle={styles.glassContent}>
            {heroSlides.map((slide, i) => (
              <View key={slide.id}>
                <View style={styles.slideRow}>
                  <Image source={{ uri: slide.image }} style={styles.slideThumb} />

                  <View style={{ flex: 1, gap: 12 }}>
                    <Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text>
                    <Text style={[styles.slideMeta, { color: colors.textTertiary }]}>
                      {slide.city} • {slide.status.toUpperCase()}
                    </Text>

                    <Input
                      label="Title"
                      value={slide.title}
                      onChangeText={(value) => updateHeroSlide(slide.id, { title: value })}
                    />
                    <Input
                      label="City"
                      value={slide.city}
                      onChangeText={(value) => updateHeroSlide(slide.id, { city: value })}
                    />
                    <Input
                      label="Image URL"
                      value={slide.image}
                      onChangeText={(value) => updateHeroSlide(slide.id, { image: value })}
                    />

                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Status</Text>
                      <View style={styles.statusButtons}>
                        {(['active', 'scheduled', 'paused'] as const).map((status) => (
                          <Pressable
                            key={status}
                            style={[
                              styles.statusBtn,
                              {
                                backgroundColor: slide.status === status ? `${CultureTokens.coral}15` : colors.backgroundSecondary,
                                borderColor: slide.status === status ? CultureTokens.coral : colors.borderLight,
                              },
                            ]}
                            onPress={() => updateHeroSlide(slide.id, { status })}
                          >
                            <Text
                              style={[
                                styles.statusBtnText,
                                { color: slide.status === status ? CultureTokens.coral : colors.textSecondary },
                              ]}
                            >
                              {status.toUpperCase()}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.slideActions}>
                    <Pressable style={styles.actionIcon} onPress={() => moveHeroSlide(slide.id, 'up')}>
                      <Ionicons name="arrow-up-outline" size={20} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable style={styles.actionIcon} onPress={() => moveHeroSlide(slide.id, 'down')}>
                      <Ionicons name="arrow-down-outline" size={20} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable style={styles.actionIcon} onPress={() => removeHeroSlide(slide.id)}>
                      <Ionicons name="trash-outline" size={20} color={CultureTokens.coral} />
                    </Pressable>
                  </View>
                </View>

                {i < heroSlides.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                )}
              </View>
            ))}
          </GlassView>

          {/* Featured Cities */}
          <View style={[styles.sectionHeader, { marginTop: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>FEATURED CITIES</Text>
            <M3Button variant="tonal" style={{ height: 36 }} onPress={() => Alert.alert('City order', '...')}>
              About ordering
            </M3Button>
          </View>

          <View style={styles.cityGrid}>
            {(adminCities ?? []).map((city) => (
              <GlassView key={city.id} style={styles.cityCard} contentStyle={styles.cityContent}>
                <Text style={[styles.cityName, { color: colors.text }]}>
                  {city.countryEmoji} {city.name}
                </Text>
                <Text style={[styles.cityMeta, { color: colors.textTertiary }]}>{city.countryName}</Text>

                <View style={styles.cityActions}>
                  <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Featured</Text>
                  <Switch
                    value={city.featured}
                    onValueChange={(next) => patchCityFeatured.mutate({ id: city.id, featured: next })}
                    disabled={patchCityFeatured.isPending}
                    trackColor={{ false: colors.border, true: CultureTokens.coral }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </GlassView>
            ))}

            <Pressable
              style={[styles.addCity, { borderColor: colors.borderLight }]}
              onPress={() => Alert.alert('Add city', '...')}
            >
              <Ionicons name="add" size={28} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: 13, fontFamily: FontFamily.bold, marginTop: 4 }}>
                ADD CITY
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sidebar */}
        <View style={styles.sideCol}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginBottom: 16 }]}>
            ALGORITHMIC OVERRIDES
          </Text>

          <GlassView contentStyle={styles.glassContent}>
            <View style={styles.overrideRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.overrideLabel, { color: colors.text }]}>Trending Multiplier</Text>
                <Text style={[styles.overrideDesc, { color: colors.textSecondary }]}>
                  Boosts organic reach of newer events
                </Text>
              </View>
              <Text style={[styles.overrideVal, { color: CultureTokens.coral }]}>
                {Number(trendingMultiplier || 0).toFixed(1)}×
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight, marginVertical: 16 }]} />

            <View style={styles.overrideRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.overrideLabel, { color: colors.text }]}>Social Proof Gate</Text>
                <Text style={[styles.overrideDesc, { color: colors.textSecondary }]}>
                  Minimum RSVPs for Trending rail
                </Text>
              </View>
              <Text style={[styles.overrideVal, { color: CultureTokens.coral }]}>{socialProofGate}</Text>
            </View>

            <Input
              label="Trending Multiplier"
              value={trendingMultiplier}
              onChangeText={setTrendingMultiplier}
              style={{ marginTop: 12 }}
            />
            <Input
              label="Social Proof Gate"
              value={socialProofGate}
              onChangeText={setSocialProofGate}
            />

            <M3Button
              variant="filled"
              onPress={() => saveDiscoveryConfig.mutate()}
              style={{ marginTop: 16 }}
            >
              {saveDiscoveryConfig.isPending ? 'Saving…' : 'Save Discovery Controls'}
            </M3Button>
          </GlassView>

          <View style={{ height: 40 }} />

          <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginBottom: 12 }]}>
            QUICK ACTIONS
          </Text>

          <View style={{ gap: 12 }}>
            <M3Button variant="tonal" leftIcon="home-outline" onPress={() => router.push('/(tabs)')}>
              Preview Home (Discover)
            </M3Button>
            <M3Button
              variant="tonal"
              leftIcon="refresh"
              onPress={() => {
                queryClient.invalidateQueries({ queryKey: discoverKeys.all });
                queryClient.invalidateQueries({ queryKey: adminKeys.discoveryConfig() });
                Alert.alert('Cache invalidated');
              }}
            >
              Invalidate Discover Cache
            </M3Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 32, gap: 32 },
  header: { gap: 6 },
  title: { fontSize: 34, fontFamily: FontFamily.bold, letterSpacing: -1.2 },
  subtitle: { fontSize: 15, fontFamily: FontFamily.medium },

  layout: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  mainCol: { flex: 2, minWidth: 360 },
  sideCol: { flex: 1, minWidth: 300 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 11.5, fontFamily: FontFamily.bold, letterSpacing: 1.4, textTransform: 'uppercase' },

  glassContent: { padding: 6, borderRadius: 20 },

  slideRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 16 },
  slideThumb: { width: 92, height: 58, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)' },
  slideTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  slideMeta: { fontSize: 13, fontFamily: FontFamily.medium },
  slideActions: { flexDirection: 'row', gap: 8, paddingTop: 4 },

  actionIcon: { padding: 6, borderRadius: 8 },

  statusRow: { gap: 8 },
  statusLabel: { fontSize: 13, fontFamily: FontFamily.medium },
  statusButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  statusBtnText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.3 },

  divider: { height: 1, marginHorizontal: 14 },

  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cityCard: { width: '48%', minWidth: 168 },
  cityContent: { padding: 18, gap: 6, borderRadius: 18 },
  cityName: { fontSize: 15.5, fontFamily: FontFamily.bold },
  cityMeta: { fontSize: 12.5, fontFamily: FontFamily.medium },
  cityActions: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  addCity: {
    width: '48%',
    minWidth: 168,
    height: 92,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  overrideRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overrideLabel: { fontSize: 15, fontFamily: FontFamily.bold },
  overrideDesc: { fontSize: 13, marginTop: 2 },
  overrideVal: { fontSize: 18, fontFamily: FontFamily.bold },
});