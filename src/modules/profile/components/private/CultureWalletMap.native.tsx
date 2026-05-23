import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useColors } from '@/hooks/useColors';

import type { CultureWalletMapProps } from './CultureWalletMap';

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

export function CultureWalletMap({ cultures }: CultureWalletMapProps) {
  const colors = useColors();

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      customMapStyle={MAP_STYLE}
      initialRegion={{
        latitude: 20,
        longitude: 100,
        latitudeDelta: 120,
        longitudeDelta: 120,
      }}
      scrollEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      zoomEnabled={false}
      accessibilityLabel="Culture wallet map"
    >
      {cultures.map((culture) => (
        <Marker
          key={culture.id}
          coordinate={{ latitude: culture.lat, longitude: culture.lng }}
          accessibilityLabel={culture.id}
        >
          <View style={[styles.marker, { backgroundColor: culture.color, borderColor: colors.background }]}>
            <Text style={styles.markerEmoji}>{culture.emoji}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  markerEmoji: { fontSize: 16 },
});

export default CultureWalletMap;
