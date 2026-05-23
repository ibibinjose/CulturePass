import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator, ScrollView, TextInput, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FontFamily, Radius } from '@/design-system/tokens/theme';
import { modulesApi } from '@/modules/api';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { NativeMapView } from '@/modules/core/components';
import type { EventData } from '@/shared/schema';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLayout } from '@/hooks/useLayout';
import { isIndigenousEvent } from '@/lib/indigenous';
import { GlassView } from '@/design-system/ui/GlassView';
import { Button } from '@/design-system/ui/Button';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { useSafeBack } from '@/lib/navigation';

type MapGroup = {
  label: string;
  coords: { latitude: number; longitude: number };
  events: EventData[];
  count: number;
};

function toSortableDate(date?: string, time?: string): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const iso = `${date}T${time || '00:00'}:00`;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

function formatDate(date?: string): string {
  if (!date) return 'Date TBA';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, month, day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function openCityInMaps(city: string) {
  const query = encodeURIComponent(city);
  const url = Platform.select({
    ios: `maps://?q=${query}`,
    android: `geo:0,0?q=${query}`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`,
  });
  if (url) {
    Linking.openURL(url).catch(() => undefined);
  }
}

function WebCityList({
  cityGroups,
  selectedCity,
  onSelectCity,
  onEventPress,
  colors,
  onOpenSystemMap,
  groupEntries,
  onClearFilters,
}: {
  cityGroups: Record<string, MapGroup>;
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
  onEventPress: (eventId: string) => void;
  colors: ReturnType<typeof useColors>;
  onOpenSystemMap: (key: string) => void;
  groupEntries: [string, MapGroup][];
  onClearFilters: () => void;
}) {
  const selectedEvents = selectedCity ? (cityGroups[selectedCity]?.events || []) : [];
  const allEventsSorted = useMemo(() => 
    groupEntries
      .flatMap((group) => group[1].events)
      .sort((a, b) => toSortableDate(a.date, a.time) - toSortableDate(b.date, b.time)),
    [groupEntries]
  );
  const visibleEvents = selectedCity ? selectedEvents : allEventsSorted;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {selectedCity && (
          <GlassView style={{ marginBottom: 20 }} contentStyle={{ padding: 20, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontFamily: FontFamily.bold, color: colors.text }}>{selectedCity}</Text>
              <Text style={{ fontSize: 15, fontFamily: FontFamily.medium, color: colors.textSecondary }}>{selectedEvents.length} upcoming events</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button variant="primary" size="sm" style={{ flex: 1 }} leftIcon="navigate" onPress={() => onOpenSystemMap(selectedCity)}>Maps</Button>
              <Button variant="outline" size="sm" style={{ flex: 1 }} onPress={() => onSelectCity(null)}>Clear</Button>
            </View>
          </GlassView>
        )}

        {groupEntries.length === 0 || visibleEvents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 16 }}>
            <Ionicons name="calendar-clear" size={48} color={colors.textTertiary} />
            <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: colors.text }}>No events found</Text>
            <Button variant="outline" onPress={onClearFilters}>Reset Search</Button>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 20, fontFamily: FontFamily.bold, color: colors.text, marginBottom: 16, marginLeft: 4 }}>
              {selectedCity ? 'Local Results' : 'All Upcoming'}
            </Text>

            <View style={{ gap: 12 }}>
              {visibleEvents.map((event) => (
                <GlassView key={event.id} contentStyle={{ padding: 0 }}>
                    <Pressable
                        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'stretch' }, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
                        onPress={() => onEventPress(event.id)}
                    >
                        {event.imageUrl ? (
                            <Image source={{ uri: event.imageUrl }} style={{ width: 100, minHeight: 120 }} contentFit="cover" transition={200} />
                        ) : (
                            <View style={{ width: 100, minHeight: 120, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="calendar" size={32} color={colors.primary} />
                            </View>
                        )}

                        <View style={{ flex: 1, padding: 14, gap: 6, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: colors.primary }}>{formatDate(event.date).toUpperCase()}</Text>
                            <Text style={{ fontSize: 16, fontFamily: FontFamily.bold, color: colors.text }} numberOfLines={2}>
                                {event.title}
                            </Text>
                            {event.venue && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                                    <Text style={{ fontSize: 12, fontFamily: FontFamily.medium, color: colors.textSecondary }} numberOfLines={1}>
                                        {event.venue}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Pressable>
                </GlassView>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function MapScreen() {
  const colors = useColors();
  const goBack = useSafeBack();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const bottomInset = Platform.OS === 'web' ? 26 : insets.bottom;
  const { state } = useOnboarding();
  const { isDesktop } = useLayout();
  const params = useLocalSearchParams<{ city?: string }>();

  const [selectedCity, setSelectedCity] = useState<string | null>(params.city || null);
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const { data: events = [], isLoading, isError, refetch } = useQuery<EventData[]>({
    queryKey: ['/api/events/map', state.city, state.country],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const res = await modulesApi.events.list({
        city: state.city || undefined,
        country: state.country || undefined,
        pageSize: 200,
        dateFrom: today,
      });
      return Array.isArray(res.events) ? res.events : [];
    },
    staleTime: 60_000,
  });

  const filteredEvents = useMemo(
    () => (indigenousOnly ? events.filter((event) => isIndigenousEvent(event)) : events),
    [events, indigenousOnly],
  );

  const allMapGroups = useMemo<Record<string, MapGroup>>(() => {
    const groups: Record<string, MapGroup> = {};
    for (const event of filteredEvents) {
      const hasCoords = event.lat && event.lng;
      const key = hasCoords ? `${event.lat},${event.lng}` : (event.city || 'Australia').trim();
      const label = hasCoords ? (event.venue || event.city || 'Venue') : (event.city || 'Australia');

      if (!groups[key]) {
        let latitude = event.lat || -25.0;
        let longitude = event.lng || 134.0;

        if (!hasCoords && event.city) {
          const place = getPostcodesByPlace(event.city.trim())[0];
          if (place) {
            latitude = place.latitude;
            longitude = place.longitude;
          }
        }

        groups[key] = { label, coords: { latitude, longitude }, events: [], count: 0 };
      }
      groups[key].events.push(event);
      groups[key].count += 1;
    }
    return groups;
  }, [filteredEvents]);

  const groupEntries = useMemo(
    () =>
      Object.entries(allMapGroups)
        .filter(([_, group]) => group.label.toLowerCase().includes(citySearch.trim().toLowerCase()))
        .sort((a, b) => b[1].count - a[1].count),
    [allMapGroups, citySearch],
  );

  const selectedEvents = selectedCity ? allMapGroups[selectedCity]?.events ?? [] : [];

  const onEventPress = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/e/[id]', params: { id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <M3TopAppBar
        title="Map"
        onBack={goBack}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
        actions={[
          {
            icon: 'refresh',
            onPress: () => { setSelectedCity(null); setIndigenousOnly(false); setCitySearch(''); }
          }
        ]}
      />

      <View style={[{ paddingHorizontal: 16, marginTop: isWeb ? 8 : 12 }, { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
          <GlassView intensity={10} style={[styles.searchField, { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.borderLight, borderWidth: 1 }]}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                  value={citySearch}
                  onChangeText={setCitySearch}
                  placeholder="Search locations..."
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, { color: colors.text, fontSize: 14, fontFamily: FontFamily.medium }]}
              />
              {citySearch.length > 0 && (
                  <Pressable onPress={() => setCitySearch('')} hitSlop={12}>
                      <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </Pressable>
              )}
          </GlassView>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Could not load map events</Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' }]}>
            <Text style={{ color: colors.primary, fontSize: 14, fontFamily: FontFamily.semibold }}>Retry</Text>
          </Pressable>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          <View style={{ flex: 1 }}>
            <WebCityList
              cityGroups={allMapGroups}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              onEventPress={onEventPress}
              colors={colors}
              onOpenSystemMap={openCityInMaps}
              onClearFilters={() => setSelectedCity(null)}
              groupEntries={groupEntries}
            />
          </View>
          {isDesktop && (
             <View style={{ flex: 1.5, borderLeftWidth: 1, borderLeftColor: colors.borderLight }}>
                <NativeMapView
                  cityGroups={allMapGroups}
                  groupEntries={groupEntries}
                  preferredCity={state.city || null}
                  selectedCity={selectedCity}
                  selectedEvents={selectedEvents}
                  onMarkerPress={setSelectedCity}
                  onSelectCity={setSelectedCity}
                  onClearCity={() => setSelectedCity(null)}
                  onEventPress={onEventPress}
                  onOpenSystemMap={(key) => openCityInMaps(allMapGroups[key]?.label || key)}
                  onOpenEventMap={(event) => openCityInMaps(event.city || event.venue || '')}
                  bottomInset={bottomInset}
                />
             </View>
          )}
        </View>
      ) : (
        <NativeMapView
          cityGroups={allMapGroups}
          groupEntries={groupEntries}
          preferredCity={state.city || null}
          selectedCity={selectedCity}
          selectedEvents={selectedEvents}
          onMarkerPress={setSelectedCity}
          onSelectCity={setSelectedCity}
          onClearCity={() => setSelectedCity(null)}
          onEventPress={onEventPress}
          onOpenSystemMap={(key) => openCityInMaps(allMapGroups[key]?.label || key)}
          onOpenEventMap={(event) => openCityInMaps(event.city || event.venue || '')}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 2, zIndex: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.5, opacity: 0.8 },
  headBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  searchField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 40, borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, height: '100%' },

  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, minWidth: 22, alignItems: 'center' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 15, fontFamily: FontFamily.medium, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
});
