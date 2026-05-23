import { View, Text, StyleSheet, Platform } from 'react-native';
import { Card } from '@/design-system/ui/Card';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles, CultureTokens } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';

interface NativeMapViewProps {
  cityGroups: Record<string, { label: string; coords: { latitude: number; longitude: number }; events: any[]; count: number }>;
  groupEntries: [string, { label: string; coords: { latitude: number; longitude: number }; events: any[]; count: number }][];
  preferredCity: string | null;
  selectedCity: string | null;
  selectedEvents: any[];
  onMarkerPress: (key: string) => void;
  onSelectCity: (key: string | null) => void;
  onClearCity: () => void;
  onEventPress: (id: string) => void;
  onOpenSystemMap: (key: string) => void;
  onOpenEventMap: (event: any) => void;
  bottomInset: number;
}

export default function NativeMapViewWeb({
  selectedCity,
  cityGroups,
}: NativeMapViewProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  const city = selectedCity ? cityGroups[selectedCity] : null;
  const mapQuery = city ? city.label : 'Australia';

  if (Platform.OS !== 'web') return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mapShell}>
        {/* Using standard web embed which doesn't require API key for search views */}
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 20 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
        />

        {/* Absolute Overlay Info */}
        {!selectedCity && (
          <View style={styles.overlay}>
             <Card glass style={styles.overlayCard} padding={12}>
                <Ionicons name="map-outline" size={20} color={CultureTokens.indigo} />
                <Text style={styles.overlayText}>Select a city to explore local events on the map</Text>
             </Card>
          </View>
        )}
      </View>

      <Card
        glass
        shadow="small"
        style={[
          styles.infoCard,
          {
            borderColor: colors.borderLight,
            maxWidth: isDesktop ? 680 : '90%',
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Discovering events on the map is easy! For the most immersive and interactive experience with real-time markers and directions, we recommend using the <Text style={{ fontFamily: 'Poppins_700Bold', color: colors.text }}>CulturePass Mobile App</Text>.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  mapShell: {
    flex: 1,
    width: '100%',
    minHeight: 400,
    borderRadius: 24,
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
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  overlayText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
  },
  infoCard: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: 16,
  },
  text: {
    ...TextStyles.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
