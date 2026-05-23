/**
 * MapPreview Component
 *
 * Displays a map preview with a pin marker at the specified coordinates.
 * Supports pin adjustment via map press on native (react-native-maps)
 * and an embedded Google Maps iframe on web.
 *
 * Features:
 * - Display map centered on coordinates
 * - Show pin marker at location
 * - Allow manual pin adjustment via map press (native) or toggle mode (web)
 * - Open location in system maps app
 * - Responsive height
 *
 * Requirements: 10 (Location and Address Management)
 *
 * Design System Usage:
 * - M3Card for container
 * - CultureTokens.teal for pin marker
 * - Radius.lg for rounded corners
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Card } from '@/design-system/ui/M3Card';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, FontFamily } from '@/design-system/tokens/theme';

// Conditionally import MapView for native platforms
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch {
    // react-native-maps not available
  }
}

export interface MapPreviewProps {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Display address text */
  address: string;
  /** Callback when pin is adjusted to new coordinates */
  onPinAdjust?: (latitude: number, longitude: number) => void;
  /** Map container height */
  height?: number;
}

/** Dark map style matching CulturePass night-festival aesthetic */
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#18181B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A1A1AA' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181B' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#243045' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#27272A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3F3F46' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#18181B' }] },
];

export default function MapPreview({
  latitude,
  longitude,
  address,
  onPinAdjust,
  height = 220,
}: MapPreviewProps) {
  const colors = useColors();
  const [isPinAdjustMode, setIsPinAdjustMode] = useState(false);
  const [pinCoords, setPinCoords] = useState({ latitude, longitude });
  const mapRef = useRef<any>(null);

  // Sync pin coords when props change
  React.useEffect(() => {
    setPinCoords({ latitude, longitude });
  }, [latitude, longitude]);

  /**
   * Handle map press for pin adjustment (native only)
   */
  const handleMapPress = useCallback(
    (event: any) => {
      if (!isPinAdjustMode || !onPinAdjust) return;
      const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
      setPinCoords({ latitude: lat, longitude: lng });
      onPinAdjust(lat, lng);
    },
    [isPinAdjustMode, onPinAdjust]
  );

  /**
   * Toggle pin adjustment mode
   */
  const togglePinAdjustMode = useCallback(() => {
    setIsPinAdjustMode((prev) => !prev);
  }, []);

  /**
   * Open location in system maps app
   */
  const handleOpenInMaps = useCallback(() => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(address)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url!).catch(() => {});
    }
  }, [latitude, longitude, address]);

  /**
   * Render native map using react-native-maps
   */
  const renderNativeMap = () => {
    if (!MapView || !Marker) {
      // Fallback if react-native-maps is not available
      return (
        <View style={[styles.nativeMapPlaceholder, { backgroundColor: colors.surfaceElevated, height }]}>
          <Ionicons name="map" size={48} color={colors.textTertiary} />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Map preview
          </Text>
          <Text style={[styles.coordinatesText, { color: colors.textTertiary }]}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={{ width: '100%', height }}
        initialRegion={{
          latitude: pinCoords.latitude,
          longitude: pinCoords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        customMapStyle={darkMapStyle}
        onPress={handleMapPress}
        scrollEnabled={isPinAdjustMode}
        zoomEnabled={isPinAdjustMode}
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={pinCoords}
          draggable={isPinAdjustMode}
          onDragEnd={(e: any) => {
            const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
            setPinCoords({ latitude: lat, longitude: lng });
            onPinAdjust?.(lat, lng);
          }}
        />
      </MapView>
    );
  };

  /**
   * Render web map using Google Maps embed
   */
  const renderWebMap = () => {
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`;

    return (
      <View style={{ width: '100%', height }}>
        {/* @ts-ignore - iframe is valid on web */}
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: Radius.lg }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title="Location Map"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <M3Card
        style={[
          styles.mapCard,
          { backgroundColor: colors.card, borderColor: colors.borderLight },
        ]}
      >
        {/* Map Container */}
        <View style={[styles.mapContainer, { height }]}>
          {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}

          {/* Pin Adjust Mode Overlay */}
          {isPinAdjustMode && Platform.OS === 'web' && (
            <View style={styles.pinOverlay} pointerEvents="none">
              <Ionicons name="location" size={40} color={CultureTokens.coral} />
              <Text style={[styles.pinHint, { color: colors.text }]}>
                Drag the map to adjust pin location
              </Text>
            </View>
          )}
        </View>

        {/* Map Controls */}
        <View style={styles.controls}>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              {
                backgroundColor: pressed ? colors.surfaceElevated : colors.card,
                borderColor: colors.borderLight,
              },
            ]}
            onPress={handleOpenInMaps}
            accessibilityRole="button"
            accessibilityLabel="Open location in maps app"
          >
            <Ionicons name="navigate-outline" size={18} color={CultureTokens.indigo} />
            <Text style={[styles.controlButtonText, { color: colors.text }]}>
              Open in Maps
            </Text>
          </Pressable>

          {onPinAdjust && (
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                {
                  backgroundColor: isPinAdjustMode
                    ? CultureTokens.teal
                    : pressed
                      ? colors.surfaceElevated
                      : colors.card,
                  borderColor: isPinAdjustMode ? CultureTokens.teal : colors.borderLight,
                },
              ]}
              onPress={togglePinAdjustMode}
              accessibilityRole="button"
              accessibilityLabel={isPinAdjustMode ? 'Finish adjusting pin' : 'Adjust pin location'}
            >
              <Ionicons
                name={isPinAdjustMode ? 'checkmark' : 'move-outline'}
                size={18}
                color={isPinAdjustMode ? '#FFFFFF' : CultureTokens.indigo}
              />
              <Text
                style={[
                  styles.controlButtonText,
                  { color: isPinAdjustMode ? '#FFFFFF' : colors.text },
                ]}
              >
                {isPinAdjustMode ? 'Done' : 'Adjust Pin'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Address Label */}
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={16} color={CultureTokens.teal} />
          <Text
            style={[styles.addressText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {address}
          </Text>
        </View>
      </M3Card>

      {/* Pin Adjust Info */}
      {isPinAdjustMode && (
        <View
          style={[
            styles.infoNote,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
        >
          <Ionicons name="information-circle" size={16} color={CultureTokens.indigo} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {Platform.OS === 'web'
              ? 'Pin adjustment is limited on web. For precise placement, use the native app.'
              : 'Tap the map or drag the pin to adjust the exact location.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  mapCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  mapContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  nativeMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  pinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 8,
  },
  pinHint: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  controlButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    paddingTop: 0,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
});
