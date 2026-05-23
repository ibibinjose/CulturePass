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
          <View style={styles.mainCol}>
              {/* ── Hero Carousel Curation ── */}
              <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>HERO CAROUSEL</Text>
                  <M3Button variant="filled" onPress={addHeroSlide} leftIcon="add" style={{ height: 32 }}>Add Slide</M3Button>
              </View>
              <GlassView contentStyle={{ padding: 4 }}>
                  {heroSlides.map((slide, i) => (
                      <View key={slide.id}>
                          <View style={styles.slideRow}>
                              <Image source={{ uri: slide.image }} style={styles.slideThumb} />
                              <View style={{ flex: 1, gap: 8 }}>
                                  <Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text>
                                  <Text style={[styles.slideMeta, { color: colors.textTertiary }]}>{slide.city} • {String(slide.status).toUpperCase()}</Text>
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
                                              backgroundColor: slide.status === status ? `${colors.primary}20` : colors.backgroundSecondary,
                                              borderColor: slide.status === status ? colors.primary : colors.borderLight,
                                            },
                                          ]}
                                          onPress={() => updateHeroSlide(slide.id, { status })}
                                        >
                                          <Text style={[styles.statusBtnText, { color: slide.status === status ? colors.primary : colors.textSecondary }]}>
                                            {status.toUpperCase()}
                                          </Text>
                                        </Pressable>
                                      ))}
                                    </View>
                                  </View>
                              </View>
                              <View style={styles.slideActions}>
                                  <Pressable style={styles.actionIcon} onPress={() => moveHeroSlide(slide.id, 'up')}>
                                    <Ionicons name="arrow-up-outline" size={18} color={colors.textSecondary} />
                                  </Pressable>
                                  <Pressable style={styles.actionIcon} onPress={() => moveHeroSlide(slide.id, 'down')}>
                                    <Ionicons name="arrow-down-outline" size={18} color={colors.textSecondary} />
                                  </Pressable>
                                  <Pressable style={styles.actionIcon} onPress={() => removeHeroSlide(slide.id)}>
                                    <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
                                  </Pressable>
                              </View>
                          </View>
                          {i < heroSlides.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                      </View>
                  ))}
              </GlassView>

              <View style={{ height: 32 }} />

              {/* ── Featured Cities ── */}
              <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>FEATURED CITIES</Text>
                  <M3Button
                    variant="tonal"
                    style={{ height: 32 }}
                    onPress={() => {
                      Alert.alert(
                        'City order',
                        'Ordering uses the `order` field on each city. Adjust in Firestore or extend PATCH to support drag-and-drop later.',
                      );
                    }}
                  >
                    About ordering
                  </M3Button>
              </View>
              <View style={styles.cityGrid}>
                  {(adminCities ?? []).map((city) => (
                      <GlassView key={city.id} style={styles.cityCard} contentStyle={styles.cityContent}>
                          <Text style={[styles.cityName, { color: colors.text }]}>{city.countryEmoji} {city.name}</Text>
                          <Text style={[styles.cityMeta, { color: colors.textTertiary }]}>{city.countryName}</Text>
                          <View style={styles.cityActions}>
                              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Featured</Text>
                              <Switch
                                value={city.featured}
                                onValueChange={(next) => patchCityFeatured.mutate({ id: city.id, featured: next })}
                                disabled={patchCityFeatured.isPending}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#FFFFFF"
                              />
                          </View>
                      </GlassView>
                  ))}
                  <Pressable
                    style={[styles.addCity, { borderColor: colors.borderLight }]}
                    onPress={() => {
                      Alert.alert(
                        'Add city',
                        'Use POST /api/cities/seed from tooling or create documents in Firestore; in-app city creation is not wired yet.',
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Information about adding cities"
                  >
                      <Ionicons name="add" size={24} color={colors.textTertiary} />
                      <Text style={{ color: colors.textTertiary, fontSize: 12, fontFamily: FontFamily.bold }}>ADD CITY</Text>
                  </Pressable>
              </View>
          </View>

          <View style={styles.sideCol}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>ALGORITHMIC OVERRIDES</Text>
              <GlassView contentStyle={{ padding: 20, gap: 20 }}>
                  <View style={styles.overrideRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[styles.overrideLabel, { color: colors.text }]}>Trending Multiplier</Text>
                          <Text style={[styles.overrideDesc, { color: colors.textSecondary }]}>Boosts organic reach of newer events.</Text>
                      </View>
                      <Text style={[styles.overrideVal, { color: colors.primary }]}>{Number(trendingMultiplier || 0).toFixed(1)}x</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
                  <View style={styles.overrideRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[styles.overrideLabel, { color: colors.text }]}>Social Proof Gate</Text>
                          <Text style={[styles.overrideDesc, { color: colors.textSecondary }]}>Minimum RSVPs for Trending rail.</Text>
                      </View>
                      <Text style={[styles.overrideVal, { color: colors.primary }]}>{socialProofGate}</Text>
                  </View>
                  <Input label="Trending Multiplier" value={trendingMultiplier} onChangeText={setTrendingMultiplier} />
                  <Input label="Social Proof Gate" value={socialProofGate} onChangeText={setSocialProofGate} />
                  <M3Button variant="filled" onPress={() => saveDiscoveryConfig.mutate()}>
                    {saveDiscoveryConfig.isPending ? 'Saving…' : 'Save Discovery Controls'}
                  </M3Button>
              </GlassView>

              <View style={{ height: 32 }} />

              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>QUICK ACTIONS</Text>
              <View style={{ gap: 12 }}>
                  <M3Button variant="tonal" leftIcon="home-outline" onPress={() => router.push('/(tabs)')}>
                    Preview home (Discover tab)
                  </M3Button>
                  <M3Button
                    variant="tonal"
                    leftIcon="refresh"
                    onPress={() => {
                      queryClient.invalidateQueries({ queryKey: discoverKeys.all });
                      queryClient.invalidateQueries({ queryKey: adminKeys.discoveryConfig() });
                      Alert.alert('Cache', 'Discover-related queries were invalidated on this device.');
                    }}
                  >
                    Invalidate discover cache
                  </M3Button>
              </View>
          </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 32, gap: 32 },
  header: { gap: 4 },
  title: { fontSize: 32, fontFamily: FontFamily.bold, letterSpacing: -1 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.medium, opacity: 0.7 },

  layout: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  mainCol: { flex: 2, minWidth: 340 },
  sideCol: { flex: 1, minWidth: 280 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 4 },

  slideRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
  slideThumb: { width: 80, height: 50, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.1)' },
  slideTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  slideMeta: { fontSize: 12, fontFamily: FontFamily.medium },
  slideActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  statusRow: { gap: 6 },
  statusLabel: { fontSize: 12, fontFamily: FontFamily.medium },
  statusButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusBtnText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.4 },

  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cityCard: { width: '48%', minWidth: 160 },
  cityContent: { padding: 16, gap: 4 },
  cityName: { fontSize: 14, fontFamily: FontFamily.bold },
  cityMeta: { fontSize: 11, fontFamily: FontFamily.medium, opacity: 0.6 },
  cityActions: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addCity: { width: '48%', minWidth: 160, height: 80, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },

  divider: { height: 1 },

  overrideRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overrideLabel: { fontSize: 14, fontFamily: FontFamily.bold },
  overrideDesc: { fontSize: 12, fontFamily: FontFamily.medium, opacity: 0.7 },
  overrideVal: { fontSize: 16, fontFamily: FontFamily.bold },
});
