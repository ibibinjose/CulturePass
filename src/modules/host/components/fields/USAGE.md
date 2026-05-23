# Location Fields Usage Guide

This guide demonstrates how to use the Location Fields components in the HostSpace Enterprise-Grade Form System.

## Components

### LocationField

Address input with Google Places autocomplete and map preview.

```tsx
import { LocationField } from '@/modules/host/components/fields';
import type { Address } from '@shared/schema/hostProfile';

function MyForm() {
  const [address, setAddress] = useState<Address | null>(null);

  return (
    <LocationField
      value={address}
      onChange={setAddress}
      label="Venue Address"
      requirePhysical={true} // Reject PO Boxes
      error={errors.address}
    />
  );
}
```

**Props:**
- `value: Address | null` - Current address value
- `onChange: (value: Address) => void` - Callback when address changes
- `allowMultiple?: boolean` - Support multiple locations (future feature)
- `requirePhysical?: boolean` - Reject PO Box addresses (for venues)
- `error?: string` - Validation error message
- `label?: string` - Field label (default: "Address")

**Features:**
- Google Places autocomplete (requires backend integration)
- Automatic geocoding for coordinates
- Map preview with location pin
- Address validation (PO Box detection)
- Auto-determine LGA code from coordinates

**Backend Integration Required:**

The LocationField component requires two backend endpoints:

1. **Autocomplete Endpoint:**
```typescript
POST /api/locations/autocomplete
Body: { input: string }
Response: { predictions: PlacePrediction[] }
```

2. **Geocode Endpoint:**
```typescript
POST /api/locations/geocode
Body: { placeId: string }
Response: { address: Address }
```

These endpoints should proxy to Google Places API to keep the API key secure.

---

### AccessibilityChecklistField

Standardized accessibility features checklist with score calculation.

```tsx
import { AccessibilityChecklistField } from '@/modules/host/components/fields';
import type { AccessibilityFeatures } from '@shared/schema/hostProfile';

function VenueForm() {
  const [accessibility, setAccessibility] = useState<AccessibilityFeatures>({
    wheelchairAccess: false,
    accessibleParking: false,
    accessibleToilets: false,
    hearingLoop: false,
    brailleSignage: false,
    serviceAnimalFriendly: false,
  });

  return (
    <AccessibilityChecklistField
      value={accessibility}
      onChange={setAccessibility}
      label="Accessibility Features"
      showScore={true}
    />
  );
}
```

**Props:**
- `value: AccessibilityFeatures` - Current accessibility features
- `onChange: (value: AccessibilityFeatures) => void` - Callback when features change
- `label?: string` - Field label (default: "Accessibility Features")
- `showScore?: boolean` - Display accessibility score (default: true)

**Features:**
- 6 standardized accessibility options
- Automatic score calculation (0-100%)
- Quick actions: Select All / Clear All
- Visual feedback with icons and colors
- Score-based color coding (green/gold/coral)

**Accessibility Options:**
1. Wheelchair Access
2. Accessible Parking
3. Accessible Toilets
4. Hearing Loop
5. Braille Signage
6. Service Animal Friendly

---

### MapPreview

Map preview component with adjustable pin location.

```tsx
import { MapPreview } from '@/modules/host/components/fields';

function LocationPreview() {
  const handlePinAdjust = (latitude: number, longitude: number) => {
    console.log('Pin adjusted:', latitude, longitude);
  };

  return (
    <MapPreview
      latitude={-33.8688}
      longitude={151.2093}
      address="123 Test Street, Sydney, NSW 2000, Australia"
      onPinAdjust={handlePinAdjust}
      height={300}
    />
  );
}
```

**Props:**
- `latitude: number` - Latitude coordinate
- `longitude: number` - Longitude coordinate
- `address: string` - Full address string for display
- `onPinAdjust?: (latitude: number, longitude: number) => void` - Callback when pin is adjusted
- `height?: number` - Map height in pixels (default: 300)

**Features:**
- Google Maps embed (web only)
- Native fallback with coordinates display
- "Open in Maps" button (system maps app)
- Pin adjustment mode (future feature)
- Responsive height

---

## Complete Example

Here's a complete example of using all three components together in a venue form:

```tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  LocationField,
  AccessibilityChecklistField,
} from '@/modules/host/components/fields';
import type { Address, AccessibilityFeatures } from '@shared/schema/hostProfile';

export default function VenueLocationStep() {
  const [address, setAddress] = useState<Address | null>(null);
  const [accessibility, setAccessibility] = useState<AccessibilityFeatures>({
    wheelchairAccess: false,
    accessibleParking: false,
    accessibleToilets: false,
    hearingLoop: false,
    brailleSignage: false,
    serviceAnimalFriendly: false,
  });

  return (
    <View style={styles.container}>
      <LocationField
        value={address}
        onChange={setAddress}
        label="Venue Address"
        requirePhysical={true}
      />

      {address && (
        <AccessibilityChecklistField
          value={accessibility}
          onChange={setAccessibility}
          label="Accessibility Features"
          showScore={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 16,
  },
});
```

---

## Design System Compliance

All components follow the CulturePass design system:

**Colors:**
- `CultureTokens.indigo` - Primary brand color
- `CultureTokens.teal` - Success/positive indicators
- `CultureTokens.coral` - Error/warning indicators
- `CultureTokens.gold` - Medium score indicators

**Components:**
- `Input` - Text input fields
- `M3Card` - Card containers
- `Checkbox` - Checkbox selections
- `Ionicons` - Icon library

**Spacing:**
- `Radius.sm` (10px) - Small elements
- `Radius.md` (16px) - Medium elements
- `Radius.lg` (20px) - Large elements
- `Radius.full` (9999px) - Circular elements

**Typography:**
- `Poppins_400Regular` - Body text
- `Poppins_600SemiBold` - Labels and emphasis
- `Poppins_700Bold` - Headings and strong emphasis

---

## Testing

Unit tests are available in `scripts/tests/unit-location-fields.ts`:

```bash
npx tsx scripts/tests/unit-location-fields.ts
```

Tests cover:
- Address validation (PO Box detection)
- Accessibility score calculation
- Address formatting
- Coordinate validation
- Feature toggling
- Select/clear all features

---

## Future Enhancements

1. **Google Places API Integration:**
   - Backend endpoints for autocomplete and geocoding
   - Real-time place suggestions
   - Address validation and normalization

2. **Pin Adjustment:**
   - Interactive map with draggable pin
   - Real-time coordinate updates
   - Reverse geocoding on pin move

3. **Multiple Locations:**
   - Support for multiple addresses
   - Primary location designation
   - Location management UI

4. **Native Maps:**
   - React Native Maps integration
   - Native map rendering on iOS/Android
   - Better performance and UX

5. **Accessibility Enhancements:**
   - Custom accessibility features
   - Photo uploads for accessibility features
   - Detailed accessibility descriptions
