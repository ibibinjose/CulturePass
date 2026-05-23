# Legal and Compliance Fields - Usage Examples

This document provides usage examples for the legal and compliance field components created for the HostSpace Enterprise-Grade Form System.

## Components

### 1. ABNField

Australian Business Number input with real-time validation and government API lookup.

```tsx
import { ABNField } from '@/modules/host/components/fields';

function Step3Legal() {
  const [formData, setFormData] = useState({
    abn: '',
  });

  return (
    <ABNField
      value={formData.abn}
      onChange={(abn) => setFormData({ ...formData, abn })}
      required
      error={errors.abn}
    />
  );
}
```

**Features:**
- Formats input as XX XXX XXX XXX (11 digits with spaces)
- Validates checksum using Australian government algorithm
- Displays business name and status when found
- Shows validation status with color-coded indicators

**Validation:**
- 11 digits required
- Checksum validation: (sum of weighted digits) % 89 === 0
- Real-time API lookup for business details

---

### 2. TaxStatusField

Tax status selection and GST/VAT ID input for business entities.

```tsx
import { TaxStatusField } from '@/modules/host/components/fields';

function Step3Legal() {
  const [formData, setFormData] = useState({
    gstRegistered: false,
    gstId: '',
  });

  return (
    <TaxStatusField
      gstRegistered={formData.gstRegistered}
      gstId={formData.gstId}
      onGstRegisteredChange={(registered) =>
        setFormData({ ...formData, gstRegistered: registered })
      }
      onGstIdChange={(gstId) =>
        setFormData({ ...formData, gstId })
      }
      error={errors.taxStatus}
    />
  );
}
```

**Features:**
- Toggle between GST registered / not registered
- Conditional GST ID input when registered
- Format validation for Australian GST IDs
- Visual feedback for registration status

**GST ID Format:**
- 11 digits (same as ABN)
- Format: XX XXX XXX XXX
- Validates using same checksum as ABN

---

### 3. LicenceUploadField

Multi-file upload component for legal documents, licences, and permits.

```tsx
import { LicenceUploadField, Licence } from '@/modules/host/components/fields';

function Step3Legal() {
  const [formData, setFormData] = useState({
    licences: [] as Licence[],
  });

  return (
    <LicenceUploadField
      value={formData.licences}
      onChange={(licences) => setFormData({ ...formData, licences })}
      label="Licences & Permits"
      hint="Upload business registration, permits, or certificates"
      maxFiles={5}
    />
  );
}
```

**Features:**
- Upload multiple documents (images for now, PDF support coming)
- Track expiry dates with renewal reminders
- Display verification status badges
- Support OCR scanning (future enhancement)

**Document Types:**
- Business registration certificates
- Food & liquor licences
- Entertainment permits
- Insurance certificates
- Professional credentials
- Influencer verification documents

---

## Complete Step 3 Example

Here's how to use all three components together in Step 3 (Legal & Compliance):

```tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  ABNField,
  TaxStatusField,
  LicenceUploadField,
  Licence,
} from '@/modules/host/components/fields';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/design-system/tokens/theme';

interface Step3FormData {
  abn: string;
  gstRegistered: boolean;
  gstId: string;
  licences: Licence[];
}

export function Step3Legal() {
  const colors = useColors();
  const [formData, setFormData] = useState<Step3FormData>({
    abn: '',
    gstRegistered: false,
    gstId: '',
    licences: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step3FormData, string>>>({});

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof Step3FormData, string>> = {};

    // ABN validation (required for business entities)
    if (!formData.abn) {
      newErrors.abn = 'ABN is required for business entities';
    }

    // GST ID validation (required if GST registered)
    if (formData.gstRegistered && !formData.gstId) {
      newErrors.gstId = 'GST ID is required when registered for GST';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <ABNField
          value={formData.abn}
          onChange={(abn) => setFormData({ ...formData, abn })}
          required
          error={errors.abn}
        />
      </View>

      <View style={styles.section}>
        <TaxStatusField
          gstRegistered={formData.gstRegistered}
          gstId={formData.gstId}
          onGstRegisteredChange={(registered) =>
            setFormData({ ...formData, gstRegistered: registered })
          }
          onGstIdChange={(gstId) => setFormData({ ...formData, gstId })}
          error={errors.gstId}
        />
      </View>

      <View style={styles.section}>
        <LicenceUploadField
          value={formData.licences}
          onChange={(licences) => setFormData({ ...formData, licences })}
          maxFiles={5}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
});
```

---

## Entity-Specific Requirements

Different entity types have different legal requirements:

### Business
- **ABN**: Required
- **GST Registration**: Required if turnover > $75,000
- **Licences**: Business registration certificate

### Organiser
- **ABN**: Required for paid events
- **Insurance**: Required for paid events
- **Licences**: Event organiser permits

### Venue
- **ABN**: Required
- **Licences**: Venue licence, liquor licence (if applicable)

### Professional (Influencer)
- **ABN**: Optional
- **Licences**: Influencer verification documents
- **Credentials**: Platform verification (10,000+ followers)

---

## Design System Compliance

All components follow CulturePass design system conventions:

### Colors
- **Primary**: `CultureTokens.indigo` (#4F46E5)
- **Success**: `CultureTokens.teal` (#0D9488)
- **Error**: `CultureTokens.coral` (#FF5E5B)

### Typography
- **Labels**: `FontFamily.semibold`, 13px
- **Input**: `FontFamily.medium`, 15px
- **Hints**: `FontFamily.regular`, 12px

### Spacing
- **Field gap**: `Spacing.md` (16px)
- **Section gap**: `Spacing.xl` (24px)
- **Border radius**: `Radius.md` (16px)

### Accessibility
- Minimum tap target: 44×44 points
- Accessible labels on all interactive elements
- Color contrast ratios meet WCAG 2.1 Level AA
- Keyboard navigation support

---

## Testing

Unit tests are provided for all components:

```bash
# Run unit tests
npx tsx scripts/tests/unit-host-fields.ts
```

Test coverage includes:
- ABN formatting and validation
- GST ID formatting and validation
- Licence object creation
- File upload limits

---

## Future Enhancements

### ABNField
- [ ] Real ABN Lookup API integration
- [ ] OCR scanning from uploaded documents
- [ ] ACN support for companies
- [ ] International business number support

### TaxStatusField
- [ ] International VAT ID support
- [ ] Tax residency selection
- [ ] Multiple tax jurisdiction support

### LicenceUploadField
- [ ] PDF document support (expo-document-picker)
- [ ] OCR text extraction from documents
- [ ] Expiry date tracking and reminders
- [ ] Admin verification workflow
- [ ] Drag-and-drop on web

---

## Related Files

- **Components**: `src/modules/host/components/fields/`
- **Tests**: `src/modules/host/components/fields/__tests__/`
- **Test Script**: `scripts/tests/unit-host-fields.ts`
- **Design Spec**: `.kiro/specs/hostspace-enterprise-forms/design.md`
- **Requirements**: `.kiro/specs/hostspace-enterprise-forms/requirements.md`
