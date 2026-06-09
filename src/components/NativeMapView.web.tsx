import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Card } from '@/design-system/ui/Card';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles, CultureTokens, FontFamily, Spacing, Radius } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';
import type { EventData } from '@/shared/schema';

interface NativeMapViewProps {
  cityGroups: Record<string, { label: string; coords: { latitude: number; longitude: number }; events: EventData[]; count: number }>;
  groupEntries: [string, { label: string; coords: { latitude: number; longitude: number }; events: EventData[]; count: number }][];
  preferredCity: string | null;
  selectedCity: string | null;
  selectedEvents: EventData[];
  onMarkerPress: (key: string) => void;
  onSelectCity: (key: string | null) => void;
  onClearCity: () => void;
  onEventPress: (id: string) => void;
  onOpenSystemMap: (key: string) => void;
  onOpenEventMap: (event: EventData) => void;
  bottomInset: number;
}

function buildMapEmbedUrl(
  city: { label: string; coords: { latitude: number; longitude: number } } | null,
  events: EventData[],
): string {
  if (city) {
    const { latitude, longitude } = city.coords;
    return `https://www.google.com/maps?q=${latitude},${longitude}&z=11&output=embed`;
  }
  const first = events[0] as EventData & { latitude?: number; longitude?: number };
  if (events.length > 0 && first.latitude != null && first.longitude != null) {
    return `https://www.google.com/maps?q=${first.latitude},${first.longitude}&z=12&output=embed`;
  }
  return 'https://www.google.com/maps?q=Australia&z=4&output=embed';
}

export default function NativeMapViewWeb({
  cityGroups,
  groupEntries,
  preferredCity,
  selectedCity,
  selectedEvents,
  onMarkerPress,
  onClearCity,
  onEventPress,
  onOpenSystemMap,
  bottomInset,
}: NativeMapViewProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  const city = selectedCity ? cityGroups[selectedCity] : null;

  if (Platform.OS !== 'web') return null;

  const mapUrl = buildMapEmbedUrl(city, selectedEvents);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: bottomInset }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cityChipRow}
      >
        {groupEntries.map(([key, group]) => {
          const active = selectedCity === key || (!selectedCity && preferredCity === key);
          return (
            <Pressable
              key={key}
              onPress={() => onMarkerPress(key)}
              style={[
                styles.cityChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.borderLight,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Show events in ${group.label}`}
            >
              <Ionicons
                name="location"
                size={14}
                color={active ? colors.textInverse : colors.primary}
              />
              <Text style={[styles.cityChipLabel, { color: active ? colors.textInverse : colors.text }]}>
                {group.label}
              </Text>
              <View style={[styles.cityChipCount, { backgroundColor: active ? colors.textInverse : colors.primarySoft }]}>
                <Text style={[styles.cityChipCountText, { color: active ? colors.primary : colors.primary }]}>
                  {group.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapShell}>
        <iframe
          title="CulturePass event map"
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: Radius.xl }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
        />

        {!selectedCity ? (
          <View style={styles.overlay}>
            <Card glass style={styles.overlayCard} padding={12}>
              <Ionicons name="map-outline" size={20} color={CultureTokens.indigo} />
              <Text style={[styles.overlayText, { color: colors.text }]}>
                Select a city chip to explore local events
              </Text>
            </Card>
          </View>
        ) : null}
      </View>

      {selectedCity && city ? (
        <View style={styles.eventsPanel}>
          <View style={styles.eventsPanelHeader}>
            <Text style={[styles.eventsPanelTitle, { color: colors.text }]}>
              {city.label} · {selectedEvents.length} events
            </Text>
            <Pressable onPress={onClearCity} accessibilityRole="button" accessibilityLabel="Clear city selection">
              <Text style={{ color: colors.primary, fontFamily: FontFamily.medium, fontSize: 13 }}>Clear</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: isDesktop ? 280 : 220 }} contentContainerStyle={{ gap: Spacing.sm }}>
            {selectedEvents.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => onEventPress(event.id)}
                style={[styles.eventRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel={`Open event ${event.title}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                    {event.venue || event.city || 'Venue TBA'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onOpenSystemMap(selectedCity)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Open in maps"
                >
                  <Ionicons name="navigate-outline" size={18} color={colors.primary} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Card glass shadow="small" style={[styles.infoCard, { borderColor: colors.borderLight, maxWidth: isDesktop ? 680 : '100%' }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tap a city to see events. For live markers and directions, use the{' '}
            <Text style={[styles.infoEmphasis, { color: colors.text }]}>CulturePass mobile app</Text>.
          </Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cityChipRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  cityChipLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  cityChipCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cityChipCountText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  mapShell: {
    flex: 1,
    width: '100%',
    minHeight: 360,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  overlayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overlayText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  eventsPanel: {
    gap: Spacing.sm,
  },
  eventsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventsPanelTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  eventMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  infoCard: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: Radius.lg,
  },
  infoText: {
    ...TextStyles.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoEmphasis: {
    fontFamily: FontFamily.bold,
  },
});