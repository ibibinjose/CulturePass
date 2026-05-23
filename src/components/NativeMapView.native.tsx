import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/design-system/tokens/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import type { EventData } from '@/shared/schema';

import { useColors } from '@/hooks/useColors';

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[monthIndex] || ''} ${day}`;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#18181B' }] }, // Colors.surface or dark background
  { elementType: 'labels.text.fill', stylers: [{ color: '#A1A1AA' }] }, // colors.textSecondary
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181B' }] }, // Colors.surface
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#243045' }] }, // Colors.cardBorder
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#27272A' }] }, // Colors.surfaceElevated
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3F3F46' }] }, // Colors.surfaceSecondary
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#18181B' }] }, // Colors.surface
];

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

export default function NativeMapViewComponent({
  cityGroups, groupEntries, preferredCity, selectedCity, selectedEvents, onMarkerPress, onSelectCity, onClearCity, onEventPress, onOpenSystemMap, onOpenEventMap, bottomInset
}: NativeMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = useColors();

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedCity) return;
    const group = cityGroups[selectedCity];
    if (!group) return;
    mapRef.current?.animateToRegion(
      {
        latitude: group.coords.latitude,
        longitude: group.coords.longitude,
        latitudeDelta: 3.5,
        longitudeDelta: 3.5,
      },
      380
    );
  }, [selectedCity, cityGroups]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: -25.0,
          longitude: 134.0,
          latitudeDelta: 50,
          longitudeDelta: 80,
        }}
        customMapStyle={darkMapStyle}
      >
        {Object.entries(cityGroups).map(([key, group]) => (
          <Marker
            key={key}
            coordinate={group.coords}
            onPress={() => onMarkerPress(key)}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerBubble, selectedCity === key && styles.markerBubbleSelected]}>
                <Ionicons name="calendar" size={14} color={selectedCity === key ? colors.textInverse : colors.primary} />
                <Text style={[styles.markerCount, selectedCity === key && styles.markerCountSelected]}>{group.count}</Text>
              </View>
              <View style={[styles.markerArrow, selectedCity === key && styles.markerArrowSelected]} />
            </View>
          </Marker>
        ))}
      </MapView>


      {selectedCity && selectedEvents.length > 0 && (
        <Animated.View entering={FadeInUp.duration(300)} style={[styles.bottomSheet, { paddingBottom: bottomInset + 10 }]}>
          <Pressable onPress={() => setIsExpanded(true)} style={styles.sheetHandleArea}>
            <View style={styles.sheetHandle} />
          </Pressable>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetCity}>{cityGroups[selectedCity]?.label || selectedCity}</Text>
              <Text style={styles.sheetCount}>{selectedEvents.length} events</Text>
            </View>
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setIsExpanded(true)} hitSlop={10} style={{ marginRight: 8 }}>
                <Ionicons name="expand" size={24} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => onOpenSystemMap(selectedCity)} hitSlop={10}>
                <Ionicons name="navigate-circle" size={28} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={onClearCity} hitSlop={10}>
                <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {selectedEvents.map((event) => (
              <Pressable
                key={event.id}
                style={styles.eventCard}
                onPress={() => onEventPress(event.id)}
                onLongPress={() => onOpenEventMap(event)}
                accessibilityHint="Tap for event details, long press to open venue in maps"
              >
                {event.imageUrl ? (
                  <Image source={{ uri: event.imageUrl }} style={styles.eventImage} contentFit="cover" />
                ) : (
                  <View style={[styles.eventImage, { backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="calendar" size={24} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                  {event.venue && (
                    <View style={styles.eventMeta}>
                      <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                      <Text style={styles.eventVenue} numberOfLines={1}>{event.venue}</Text>
                      <Ionicons name="navigate-outline" size={11} color={colors.textTertiary} />
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* Full Screen Modal List */}
          <Modal visible={isExpanded} animationType="slide" transparent={true} onRequestClose={() => setIsExpanded(false)}>
            <View style={[styles.modalContainer, { paddingTop: bottomInset + 40 }]}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{cityGroups[selectedCity]?.label || selectedCity}</Text>
                  <Pressable onPress={() => setIsExpanded(false)} hitSlop={10}>
                    <Ionicons name="close-circle" size={32} color={Colors.primary} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
                  {selectedEvents.map((event) => (
                    <Pressable
                      key={`modal-${event.id}`}
                      style={styles.modalEventCard}
                      onPress={() => {
                        setIsExpanded(false);
                        onEventPress(event.id);
                      }}
                    >
                      {event.imageUrl ? (
                        <Image source={{ uri: event.imageUrl }} style={styles.modalEventImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.modalEventImage, { backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="calendar" size={32} color={Colors.primary} />
                        </View>
                      )}
                      <View style={styles.modalEventInfo}>
                        <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                        <Text style={styles.modalEventTitle} numberOfLines={2}>{event.title}</Text>
                        {event.venue && (
                          <View style={styles.eventMeta}>
                            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                            <Text style={styles.eventVenue} numberOfLines={1}>{event.venue}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: { alignItems: 'center' },
  markerBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 2, borderColor: Colors.primary,
  },
  markerBubbleSelected: { backgroundColor: Colors.primary },
  markerCount: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: Colors.primary },
  markerCountSelected: { color: '#FFF' },
  markerArrow: {
    width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.primary, marginTop: -1,
  },
  markerArrowSelected: { borderTopColor: Colors.primary },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, paddingBottom: 16, maxHeight: 300,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#636366', alignSelf: 'center', marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetCity: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.text },
  sheetCount: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#636366' },
  eventCard: { width: 220, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  eventImage: { width: '100%', height: 110 },
  eventInfo: { padding: 12 },
  eventDate: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Colors.primary, marginBottom: 4 },
  eventTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: Colors.text, lineHeight: 20, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  eventVenue: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8E8E93', flex: 1 },
  sheetHandleArea: { width: '100%', paddingTop: 8, paddingBottom: 4, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: Colors.borderLight || 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.text },
  modalEventCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight || 'rgba(255,255,255,0.06)' },
  modalEventImage: { width: 100, height: '100%' },
  modalEventInfo: { padding: 14, flex: 1 },
  modalEventTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: Colors.text, lineHeight: 22, marginBottom: 8 },
});
