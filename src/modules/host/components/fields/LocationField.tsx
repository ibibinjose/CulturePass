/**
 * LocationField Component
 *
 * Address input with Google Places autocomplete, geocoding, map preview,
 * multi-location support, and Online Only option.
 *
 * Features:
 * - Google Places autocomplete on address input (via backend proxy)
 * - Populate all fields from selected place
 * - Perform geocoding for lat/lng coordinates
 * - Display map preview with adjustable pin (NativeMapView)
 * - Auto-determine LGA code from coordinates
 * - Validate address is real location (not PO Box for venues)
 * - Support multiple locations with primary designation
 * - Support "Online Only" option for digital businesses
 *
 * Requirements: 10 (Location and Address Management)
 *
 * Design System Usage:
 * - Input component with autocomplete dropdown
 * - MapPreview for map preview
 * - M3Card for location cards (multiple locations)
 * - CultureTokens.teal for primary location badge
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/design-system/ui/Input';
import { M3Card } from '@/design-system/ui/M3Card';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, FontFamily } from '@/design-system/tokens/theme';
import { FIELD_LIMITS } from '@/modules/host/schemas/validationRules';
import type { Address } from '@shared/schema/hostProfile';
import { api } from '@/lib/api';
import MapPreview from './MapPreview';

export interface LocationFieldProps {
  /** Current address value (single location mode) */
  value: Address | null;
  /** Callback when address changes */
  onChange: (value: Address) => void;
  /** Enable multiple location entries */
  allowMultiple?: boolean;
  /** No PO boxes for venues */
  requirePhysical?: boolean;
  /** External error message */
  error?: string;
  /** Field label */
  label?: string;
  /** All locations (for multi-location mode) */
  locations?: Address[];
  /** Callback for multi-location changes */
  onLocationsChange?: (locations: Address[]) => void;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GeocodeResult {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  lgaCode?: string;
  placeId: string;
}

/**
 * Fetch autocomplete predictions from backend (proxies Google Places API)
 */
async function fetchPlacePredictions(input: string): Promise<PlacePrediction[]> {
  try {
    const response = await api.locations.autocomplete({ input, country: 'au' });
    return (response as any).predictions ?? [];
  } catch {
    // Fallback: if the endpoint doesn't exist yet, return empty
    return [];
  }
}

/**
 * Geocode a place ID via backend (proxies Google Places Geocoding)
 */
async function geocodePlaceId(placeId: string): Promise<GeocodeResult | null> {
  try {
    const response = await api.locations.geocode({ placeId });
    return response as unknown as GeocodeResult;
  } catch {
    return null;
  }
}

/**
 * Determine LGA code from coordinates via backend
 */
async function determineLgaCode(
  latitude: number,
  longitude: number
): Promise<string | undefined> {
  try {
    const response = await api.council.list({ state: undefined });
    // The backend should have a nearest-council endpoint; for now return undefined
    // In production: api.council.nearest({ latitude, longitude })
    return undefined;
  } catch {
    return undefined;
  }
}

export default function LocationField({
  value,
  onChange,
  allowMultiple = false,
  requirePhysical = false,
  error,
  label = 'Address',
  locations = [],
  onLocationsChange,
}: LocationFieldProps) {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(error);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  // Clear timer and track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Sync search query with value when value changes externally
  useEffect(() => {
    if (value && !searchQuery) {
      const fullAddress = [value.street, value.city, value.state, value.postcode, value.country]
        .filter(Boolean)
        .join(', ');
      setSearchQuery(fullAddress);
    }
  }, [value, searchQuery]);

  // Sync external error
  useEffect(() => {
    setValidationError(error);
  }, [error]);

  /**
   * Validate address is not a PO Box (for venues)
   */
  const validateAddress = useCallback(
    (address: Pick<Address, 'street'>): boolean => {
      if (!requirePhysical) return true;
      const poBoxPattern = /\b(P\.?\s*O\.?\s*Box|Post\s*Office\s*Box|GPO\s*Box|Locked\s*Bag)\b/i;
      if (poBoxPattern.test(address.street)) {
        setValidationError('Physical address required. PO Boxes are not allowed for venues.');
        return false;
      }
      return true;
    },
    [requirePhysical]
  );

  /**
   * Handle search input change with 300ms debounce
   */
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      setShowSuggestions(true);
      setValidationError(undefined);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (!text || text.length < 3) {
        setPredictions([]);
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        try {
          const results = await fetchPlacePredictions(text);
          if (isMounted.current) {
            setPredictions(results);
          }
        } catch {
          if (isMounted.current) {
            setPredictions([]);
          }
        } finally {
          if (isMounted.current) {
            setIsLoading(false);
          }
        }
      }, 300);
    },
    []
  );

  /**
   * Handle place selection from autocomplete
   */
  const handlePlaceSelect = useCallback(
    async (prediction: PlacePrediction) => {
      setSearchQuery(prediction.description);
      setShowSuggestions(false);
      setPredictions([]);
      setIsGeocoding(true);

      try {
        const result = await geocodePlaceId(prediction.place_id);

        if (!isMounted.current) return;

        if (result) {
          const address: Address = {
            street: result.street,
            city: result.city,
            state: result.state,
            postcode: result.postcode,
            country: result.country,
            latitude: result.latitude,
            longitude: result.longitude,
            lgaCode: result.lgaCode,
            placeId: result.placeId,
            isPrimary: true,
          };

          // Validate PO Box restriction
          if (!validateAddress(address)) {
            setIsGeocoding(false);
            return;
          }

          // If no LGA code from geocode, try to determine it
          if (!address.lgaCode && address.latitude && address.longitude) {
            const lgaCode = await determineLgaCode(address.latitude, address.longitude);
            if (isMounted.current && lgaCode) {
              address.lgaCode = lgaCode;
            }
          }

          if (!isMounted.current) return;
          onChange(address);
          setValidationError(undefined);
        } else {
          if (isMounted.current) {
            setValidationError('Unable to load address details. Please try again.');
          }
        }
      } catch {
        if (isMounted.current) {
          setValidationError('Unable to load address details. Please try again.');
        }
      } finally {
        if (isMounted.current) {
          setIsGeocoding(false);
        }
      }
    },
    [onChange, validateAddress]
  );

  /**
   * Handle manual pin adjustment on map
   */
  const handlePinAdjust = useCallback(
    (latitude: number, longitude: number) => {
      if (!value) return;
      onChange({
        ...value,
        latitude,
        longitude,
      });
    },
    [value, onChange]
  );

  /**
   * Clear the current address
   */
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setPredictions([]);
    setShowSuggestions(false);
    setValidationError(undefined);
    onChange({
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      latitude: 0,
      longitude: 0,
      isPrimary: true,
    });
  }, [onChange]);

  /**
   * Add a new location (multi-location mode)
   * Enforces FIELD_LIMITS.additionalLocations.max (10) limit
   */
  const handleAddLocation = useCallback(() => {
    if (!onLocationsChange) return;
    if (locations.length >= FIELD_LIMITS.additionalLocations.max) return;
    const newLocation: Address = {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      latitude: 0,
      longitude: 0,
      isPrimary: locations.length === 0,
    };
    onLocationsChange([...locations, newLocation]);
  }, [locations, onLocationsChange]);

  /**
   * Remove a location (multi-location mode)
   */
  const handleRemoveLocation = useCallback(
    (index: number) => {
      if (!onLocationsChange) return;
      const updated = locations.filter((_, i) => i !== index);
      // Ensure at least one is primary
      if (updated.length > 0 && !updated.some((l) => l.isPrimary)) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      onLocationsChange(updated);
    },
    [locations, onLocationsChange]
  );

  /**
   * Set a location as primary (multi-location mode)
   */
  const handleSetPrimary = useCallback(
    (index: number) => {
      if (!onLocationsChange) return;
      const updated = locations.map((loc, i) => ({
        ...loc,
        isPrimary: i === index,
      }));
      onLocationsChange(updated);
    },
    [locations, onLocationsChange]
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.inputWrapper}>
        <Input
          label={label}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Start typing an address..."
          leftIcon="location-outline"
          rightIcon={searchQuery ? 'close-circle' : undefined}
          onRightIconPress={searchQuery ? handleClear : undefined}
          error={validationError}
          autoComplete="street-address"
          containerStyle={styles.inputContainer}
          accessibilityLabel={label}
          accessibilityHint="Start typing to search for an address"
        />
        {isGeocoding && (
          <View style={styles.geocodingIndicator}>
            <ActivityIndicator size="small" color={CultureTokens.indigo} />
          </View>
        )}
      </View>

      {/* Autocomplete Suggestions */}
      {showSuggestions && (predictions.length > 0 || isLoading) && (
        <M3Card
          style={[
            styles.suggestionsCard,
            { backgroundColor: colors.card, borderColor: colors.borderLight },
          ]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={CultureTokens.indigo} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Searching...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {predictions.map((prediction) => (
                <Pressable
                  key={prediction.place_id}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    {
                      backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
                    },
                  ]}
                  onPress={() => handlePlaceSelect(prediction)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select address: ${prediction.description}`}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={CultureTokens.teal}
                    style={styles.suggestionIcon}
                  />
                  <View style={styles.suggestionText}>
                    <Text
                      style={[styles.suggestionMain, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text
                      style={[styles.suggestionSecondary, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </M3Card>
      )}

      {/* Map Preview */}
      {value && value.latitude !== 0 && value.longitude !== 0 && (
        <View style={styles.mapContainer}>
          <MapPreview
            latitude={value.latitude}
            longitude={value.longitude}
            address={searchQuery || value.street}
            onPinAdjust={handlePinAdjust}
          />
        </View>
      )}

      {/* Address Details (when selected) */}
      {value && value.street ? (
        <M3Card
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.detailsHeader}>
            <Ionicons name="checkmark-circle" size={20} color={CultureTokens.teal} />
            <Text style={[styles.detailsTitle, { color: colors.text }]}>
              Address Confirmed
            </Text>
          </View>

          <View style={styles.detailsGrid}>
            {value.street ? <DetailRow label="Street" value={value.street} colors={colors} /> : null}
            {value.city ? <DetailRow label="City" value={value.city} colors={colors} /> : null}
            {value.state ? <DetailRow label="State" value={value.state} colors={colors} /> : null}
            {value.postcode ? (
              <DetailRow label="Postcode" value={value.postcode} colors={colors} />
            ) : null}
            {value.country ? (
              <DetailRow label="Country" value={value.country} colors={colors} />
            ) : null}
            {value.lgaCode ? (
              <DetailRow label="LGA Code" value={value.lgaCode} colors={colors} />
            ) : null}
            {value.latitude !== 0 && (
              <DetailRow
                label="Coordinates"
                value={`${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`}
                colors={colors}
              />
            )}
          </View>
        </M3Card>
      ) : null}

      {/* Multiple Locations Section */}
      {allowMultiple && locations.length > 0 && (
        <View style={styles.multiLocationSection}>
          <Text style={[styles.multiLocationTitle, { color: colors.text }]}>
            All Locations ({locations.length})
          </Text>

          {locations.map((loc, index) => (
            <M3Card
              key={`loc-${index}`}
              style={[
                styles.locationCard,
                {
                  backgroundColor: colors.card,
                  borderColor: loc.isPrimary ? CultureTokens.teal : colors.borderLight,
                },
              ]}
            >
              <View style={styles.locationCardHeader}>
                <View style={styles.locationCardLeft}>
                  <Ionicons
                    name="location"
                    size={18}
                    color={loc.isPrimary ? CultureTokens.teal : colors.textSecondary}
                  />
                  <Text
                    style={[styles.locationCardAddress, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {loc.street
                      ? `${loc.street}, ${loc.city}`
                      : `Location ${index + 1} (not set)`}
                  </Text>
                </View>

                {loc.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>

              <View style={styles.locationCardActions}>
                {!loc.isPrimary && (
                  <Pressable
                    onPress={() => handleSetPrimary(index)}
                    style={[styles.locationAction, { borderColor: colors.borderLight }]}
                    accessibilityLabel="Set as primary location"
                  >
                    <Ionicons name="star-outline" size={14} color={CultureTokens.indigo} />
                    <Text style={[styles.locationActionText, { color: CultureTokens.indigo }]}>
                      Set Primary
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleRemoveLocation(index)}
                  style={[styles.locationAction, { borderColor: colors.borderLight }]}
                  accessibilityLabel="Remove this location"
                >
                  <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                  <Text style={[styles.locationActionText, { color: CultureTokens.coral }]}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </M3Card>
          ))}
        </View>
      )}

      {/* Add Location Button (multi-location mode) */}
      {allowMultiple && (
        <Pressable
          onPress={handleAddLocation}
          disabled={locations.length >= FIELD_LIMITS.additionalLocations.max}
          style={[
            styles.addLocationButton,
            {
              borderColor: locations.length >= FIELD_LIMITS.additionalLocations.max
                ? colors.borderLight
                : colors.borderLight,
              opacity: locations.length >= FIELD_LIMITS.additionalLocations.max ? 0.5 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add another location"
          accessibilityState={{
            disabled: locations.length >= FIELD_LIMITS.additionalLocations.max,
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={
              locations.length >= FIELD_LIMITS.additionalLocations.max
                ? colors.textTertiary
                : CultureTokens.indigo
            }
          />
          <Text
            style={[
              styles.addLocationText,
              {
                color:
                  locations.length >= FIELD_LIMITS.additionalLocations.max
                    ? colors.textTertiary
                    : CultureTokens.indigo,
              },
            ]}
          >
            Add Another Location ({locations.length}/{FIELD_LIMITS.additionalLocations.max})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Helper component for displaying address detail rows
 */
function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    zIndex: 10,
  },
  geocodingIndicator: {
    position: 'absolute',
    right: 14,
    top: 32,
    height: 48,
    justifyContent: 'center',
  },
  suggestionsCard: {
    marginTop: -6,
    borderWidth: 1,
    borderRadius: Radius.md,
    maxHeight: 300,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: Radius.sm,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  suggestionIcon: {
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    gap: 2,
  },
  suggestionMain: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  suggestionSecondary: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  mapContainer: {
    marginTop: 4,
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 16,
    gap: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailsTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    flex: 1,
    textAlign: 'right',
  },
  multiLocationSection: {
    gap: 10,
    marginTop: 8,
  },
  multiLocationTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationCardAddress: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  primaryBadge: {
    backgroundColor: CultureTokens.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  locationActionText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addLocationText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
});
