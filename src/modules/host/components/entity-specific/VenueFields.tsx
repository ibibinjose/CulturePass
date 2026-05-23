/**
 * VenueFields Component
 *
 * Venue-specific fields for the HostSpace form wizard.
 * Handles capacity, technical rider, opening hours, exception dates,
 * parking/EV/transport info, and accessibility score.
 *
 * Requirements: 14 (Venue-Specific Fields)
 *
 * Design System Usage:
 * - M3Card for section containers
 * - TextInput for text/number fields
 * - Checkbox for boolean toggles
 * - CultureTokens.coral for venue accent
 * - Radius.md for card corners
 * - AccessibilityChecklistField for accessibility score
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Card } from '@/design-system/ui/M3Card';
import { Checkbox } from '@/design-system/ui/Checkbox';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, Spacing, TextStyles, FontFamily } from '@/design-system/tokens/theme';
import { validateFireSafetyCapacity, MEDIA_CONSTRAINTS } from '../../schemas/validationRules';
import AccessibilityChecklistField from '../fields/AccessibilityChecklistField';
import type { WizardStepProps } from '../FormWizard/WizardStep';
import type {
  VenueData,
  RecurringSchedule,
  ExceptionDate,
  AccessibilityFeatures,
} from '@shared/schema/hostProfile';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
] as const;

type DayKey = (typeof DAYS_OF_WEEK)[number]['key'];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

interface CapacitySectionProps {
  seated: number;
  standing: number;
  fireSafetyMax: number;
  onSeatedChange: (value: number) => void;
  onStandingChange: (value: number) => void;
  onFireSafetyChange: (value: number) => void;
  error?: string | null;
}

function CapacitySection({
  seated,
  standing,
  fireSafetyMax,
  onSeatedChange,
  onStandingChange,
  onFireSafetyChange,
  error,
}: CapacitySectionProps) {
  const colors = useColors();

  const parseNumber = (text: string): number => {
    const num = parseInt(text, 10);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  return (
    <M3Card
      style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
    >
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${CultureTokens.coral}15` }]}>
          <Ionicons name="people" size={20} color={CultureTokens.coral} />
        </View>
        <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Capacity</Text>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>Required</Text>
        </View>
      </View>

      <View style={styles.capacityGrid}>
        <View style={styles.capacityField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Seated</Text>
          <TextInput
            style={[styles.numberInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
            value={seated > 0 ? String(seated) : ''}
            onChangeText={(text) => onSeatedChange(parseNumber(text))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Seated capacity"
          />
        </View>

        <View style={styles.capacityField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Standing</Text>
          <TextInput
            style={[styles.numberInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
            value={standing > 0 ? String(standing) : ''}
            onChangeText={(text) => onStandingChange(parseNumber(text))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Standing capacity"
          />
        </View>

        <View style={styles.capacityField}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Fire Safety Max
          </Text>
          <TextInput
            style={[
              styles.numberInput,
              { color: colors.text, borderColor: error ? CultureTokens.coral : colors.borderLight, backgroundColor: colors.surfaceElevated },
            ]}
            value={fireSafetyMax > 0 ? String(fireSafetyMax) : ''}
            onChangeText={(text) => onFireSafetyChange(parseNumber(text))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Fire safety maximum capacity"
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={CultureTokens.coral} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={[styles.infoBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Ionicons name="information-circle" size={14} color={CultureTokens.indigo} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Fire safety capacity must be ≥ seated and standing capacities.
        </Text>
      </View>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Technical Rider Section
// ---------------------------------------------------------------------------

interface TechnicalRiderSectionProps {
  documentUrl: string;
  parsedSpecs: Record<string, string | undefined>;
  onUpload: () => void;
  onParseComplete: (specs: Record<string, string | undefined>) => void;
}

function TechnicalRiderSection({
  documentUrl,
  parsedSpecs,
  onUpload,
  onParseComplete,
}: TechnicalRiderSectionProps) {
  const colors = useColors();
  const hasDocument = !!documentUrl;
  const hasParsedSpecs = Object.keys(parsedSpecs).length > 0;

  return (
    <M3Card
      style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
    >
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${CultureTokens.indigo}15` }]}>
          <Ionicons name="document-text" size={20} color={CultureTokens.indigo} />
        </View>
        <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Technical Rider</Text>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>Required</Text>
        </View>
      </View>

      {/* Upload Area */}
      <Pressable
        style={({ pressed }) => [
          styles.uploadArea,
          {
            borderColor: hasDocument ? CultureTokens.teal : colors.borderLight,
            backgroundColor: pressed ? colors.surfaceElevated : 'transparent',
          },
        ]}
        onPress={onUpload}
        accessibilityRole="button"
        accessibilityLabel="Upload technical rider PDF"
      >
        <Ionicons
          name={hasDocument ? 'checkmark-circle' : 'cloud-upload-outline'}
          size={32}
          color={hasDocument ? CultureTokens.teal : colors.textSecondary}
        />
        <Text style={[styles.uploadText, { color: hasDocument ? CultureTokens.teal : colors.text }]}>
          {hasDocument ? 'Technical rider uploaded' : 'Upload Technical Rider (PDF)'}
        </Text>
        <Text style={[styles.uploadHint, { color: colors.textTertiary }]}>
          PDF format, max {MEDIA_CONSTRAINTS.technicalRider.maxSizeBytes / (1024 * 1024)}MB
        </Text>
      </Pressable>

      {/* AI Parsed Specs */}
      {hasParsedSpecs && (
        <View style={styles.parsedSpecsContainer}>
          <View style={styles.parsedSpecsHeader}>
            <Ionicons name="sparkles" size={16} color={CultureTokens.violet} />
            <Text style={[styles.parsedSpecsTitle, { color: colors.text }]}>
              AI-Parsed Specifications
            </Text>
          </View>
          {Object.entries(parsedSpecs)
            .filter(([, val]) => val !== undefined)
            .map(([key, val]) => (
              <View key={key} style={[styles.specRow, { borderColor: colors.borderLight }]}>
                <Text style={[styles.specKey, { color: colors.textSecondary }]}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                </Text>
                <Text style={[styles.specValue, { color: colors.text }]}>{val}</Text>
              </View>
            ))}
        </View>
      )}
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Opening Hours Section
// ---------------------------------------------------------------------------

interface OpeningHoursSectionProps {
  schedule: RecurringSchedule;
  onChange: (schedule: RecurringSchedule) => void;
}

function OpeningHoursSection({ schedule, onChange }: OpeningHoursSectionProps) {
  const colors = useColors();

  const handleDayToggle = useCallback(
    (day: DayKey) => {
      const current = schedule[day];
      if (current) {
        // Remove the day
        const updated = { ...schedule };
        delete updated[day];
        onChange(updated);
      } else {
        // Add default hours
        onChange({ ...schedule, [day]: { open: '09:00', close: '17:00' } });
      }
    },
    [schedule, onChange]
  );

  const handleTimeChange = useCallback(
    (day: DayKey, field: 'open' | 'close', value: string) => {
      const current = schedule[day];
      if (!current) return;
      onChange({ ...schedule, [day]: { ...current, [field]: value } });
    },
    [schedule, onChange]
  );

  const enabledDaysCount = useMemo(
    () => DAYS_OF_WEEK.filter((d) => schedule[d.key]).length,
    [schedule]
  );

  return (
    <M3Card
      style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
    >
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${CultureTokens.teal}15` }]}>
          <Ionicons name="time" size={20} color={CultureTokens.teal} />
        </View>
        <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Opening Hours</Text>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>Required</Text>
        </View>
      </View>

      {enabledDaysCount === 0 && (
        <View style={[styles.warningBox, { backgroundColor: `${CultureTokens.coral}10`, borderColor: CultureTokens.coral }]}>
          <Ionicons name="warning" size={14} color={CultureTokens.coral} />
          <Text style={[styles.warningText, { color: CultureTokens.coral }]}>
            At least one day with opening hours is required.
          </Text>
        </View>
      )}

      <View style={styles.scheduleList}>
        {DAYS_OF_WEEK.map((day) => {
          const isEnabled = !!schedule[day.key];
          const hours = schedule[day.key];

          return (
            <View
              key={day.key}
              style={[
                styles.scheduleRow,
                { borderColor: colors.borderLight },
              ]}
            >
              <Pressable
                style={styles.dayToggle}
                onPress={() => handleDayToggle(day.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isEnabled }}
                accessibilityLabel={`${day.label} opening hours`}
              >
                <Checkbox checked={isEnabled} onToggle={() => handleDayToggle(day.key)} />
                <Text
                  style={[
                    styles.dayLabel,
                    { color: isEnabled ? colors.text : colors.textTertiary },
                  ]}
                >
                  {day.short}
                </Text>
              </Pressable>

              {isEnabled && hours ? (
                <View style={styles.timeInputs}>
                  <TextInput
                    style={[styles.timeInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                    value={hours.open}
                    onChangeText={(val) => handleTimeChange(day.key, 'open', val)}
                    placeholder="09:00"
                    placeholderTextColor={colors.textTertiary}
                    accessibilityLabel={`${day.label} opening time`}
                  />
                  <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>–</Text>
                  <TextInput
                    style={[styles.timeInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                    value={hours.close}
                    onChangeText={(val) => handleTimeChange(day.key, 'close', val)}
                    placeholder="17:00"
                    placeholderTextColor={colors.textTertiary}
                    accessibilityLabel={`${day.label} closing time`}
                  />
                </View>
              ) : (
                <Text style={[styles.closedLabel, { color: colors.textTertiary }]}>Closed</Text>
              )}
            </View>
          );
        })}
      </View>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Exception Dates Section
// ---------------------------------------------------------------------------

interface ExceptionDatesSectionProps {
  dates: ExceptionDate[];
  onChange: (dates: ExceptionDate[]) => void;
}

function ExceptionDatesSection({ dates, onChange }: ExceptionDatesSectionProps) {
  const colors = useColors();
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  const handleAdd = useCallback(() => {
    if (!newDate || !newReason) return;
    onChange([...dates, { date: newDate, reason: newReason, closed: true }]);
    setNewDate('');
    setNewReason('');
  }, [dates, newDate, newReason, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(dates.filter((_, i) => i !== index));
    },
    [dates, onChange]
  );

  return (
    <M3Card
      style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
    >
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${CultureTokens.gold}15` }]}>
          <Ionicons name="calendar-outline" size={20} color={CultureTokens.gold} />
        </View>
        <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Exception Dates</Text>
        <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.optionalText, { color: colors.textSecondary }]}>Optional</Text>
        </View>
      </View>

      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Add holidays, special closures, or other dates when normal hours don&apos;t apply.
      </Text>

      {/* Existing Exception Dates */}
      {dates.length > 0 && (
        <View style={styles.exceptionList}>
          {dates.map((item, index) => (
            <View
              key={`${item.date}-${index}`}
              style={[styles.exceptionItem, { borderColor: colors.borderLight }]}
            >
              <View style={styles.exceptionItemContent}>
                <Text style={[styles.exceptionDate, { color: colors.text }]}>{item.date}</Text>
                <Text style={[styles.exceptionReason, { color: colors.textSecondary }]}>
                  {item.reason}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemove(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove exception date ${item.date}`}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Add New Exception Date */}
      <View style={styles.addExceptionRow}>
        <TextInput
          style={[styles.exceptionInput, styles.dateInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
          value={newDate}
          onChangeText={setNewDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Exception date"
        />
        <TextInput
          style={[styles.exceptionInput, styles.reasonInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
          value={newReason}
          onChangeText={setNewReason}
          placeholder="Reason (e.g., Christmas)"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Exception reason"
        />
        <Pressable
          style={[styles.addButton, { backgroundColor: CultureTokens.indigo, opacity: newDate && newReason ? 1 : 0.5 }]}
          onPress={handleAdd}
          disabled={!newDate || !newReason}
          accessibilityRole="button"
          accessibilityLabel="Add exception date"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Parking & Transport Section
// ---------------------------------------------------------------------------

interface ParkingTransportSectionProps {
  parking: { available: boolean; capacity?: number; cost?: string };
  evCharging: boolean;
  publicTransport: { nearestStation: string; walkingDistance: string };
  onParkingChange: (parking: { available: boolean; capacity?: number; cost?: string }) => void;
  onEvChargingChange: (value: boolean) => void;
  onPublicTransportChange: (transport: { nearestStation: string; walkingDistance: string }) => void;
}

function ParkingTransportSection({
  parking,
  evCharging,
  publicTransport,
  onParkingChange,
  onEvChargingChange,
  onPublicTransportChange,
}: ParkingTransportSectionProps) {
  const colors = useColors();

  return (
    <M3Card
      style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
    >
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${CultureTokens.indigo}15` }]}>
          <Ionicons name="car" size={20} color={CultureTokens.indigo} />
        </View>
        <Text style={[styles.sectionCardTitle, { color: colors.text }]}>
          Parking & Transport
        </Text>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>Required</Text>
        </View>
      </View>

      {/* Parking Available Toggle */}
      <View style={[styles.toggleRow, { borderColor: colors.borderLight }]}>
        <View style={styles.toggleContent}>
          <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.toggleLabel, { color: colors.text }]}>Parking Available</Text>
        </View>
        <Checkbox
          checked={parking.available}
          onToggle={() => onParkingChange({ ...parking, available: !parking.available })}
        />
      </View>

      {/* Parking Details (shown when available) */}
      {parking.available && (
        <View style={styles.parkingDetails}>
          <View style={styles.parkingRow}>
            <View style={styles.parkingField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Spots</Text>
              <TextInput
                style={[styles.numberInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                value={parking.capacity ? String(parking.capacity) : ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  onParkingChange({ ...parking, capacity: isNaN(num) ? undefined : num });
                }}
                keyboardType="number-pad"
                placeholder="e.g., 50"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Parking capacity"
              />
            </View>
            <View style={styles.parkingField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cost</Text>
              <TextInput
                style={[styles.numberInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                value={parking.cost || ''}
                onChangeText={(text) => onParkingChange({ ...parking, cost: text || undefined })}
                placeholder="e.g., $5/hr or Free"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Parking cost"
              />
            </View>
          </View>
        </View>
      )}

      {/* EV Charging Toggle */}
      <View style={[styles.toggleRow, { borderColor: colors.borderLight }]}>
        <View style={styles.toggleContent}>
          <Ionicons name="flash-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.toggleLabel, { color: colors.text }]}>EV Charging Available</Text>
        </View>
        <Checkbox checked={evCharging} onToggle={() => onEvChargingChange(!evCharging)} />
      </View>

      {/* Public Transport */}
      <View style={styles.transportSection}>
        <View style={styles.transportHeader}>
          <Ionicons name="train-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.transportTitle, { color: colors.text }]}>Public Transport</Text>
        </View>
        <View style={styles.transportFields}>
          <View style={styles.transportField}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Nearest Station
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
              value={publicTransport.nearestStation}
              onChangeText={(text) =>
                onPublicTransportChange({ ...publicTransport, nearestStation: text })
              }
              placeholder="e.g., Central Station"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Nearest public transport station"
            />
          </View>
          <View style={styles.transportField}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Walking Distance
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
              value={publicTransport.walkingDistance}
              onChangeText={(text) =>
                onPublicTransportChange({ ...publicTransport, walkingDistance: text })
              }
              placeholder="e.g., 5 min walk"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Walking distance to nearest station"
            />
          </View>
        </View>
      </View>
    </M3Card>
  );
}

// ---------------------------------------------------------------------------
// Main VenueFields Component
// ---------------------------------------------------------------------------

export interface VenueFieldsProps {
  /** Current venue data from form state */
  formData: WizardStepProps['formData'];
  /** Update form data callback */
  updateFormData: WizardStepProps['updateFormData'];
  /** Get field error helper */
  getFieldError: WizardStepProps['getFieldError'];
}

export default function VenueFields({
  formData,
  updateFormData,
  getFieldError,
}: VenueFieldsProps) {
  const colors = useColors();

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const venueData = useMemo(() => {
    return (formData.venueData || {
      capacity: { seated: 0, standing: 0, fireSafetyMax: 0 },
      technicalRider: { documentUrl: '', parsedSpecs: {} },
      openingHours: {},
      exceptionDates: [],
      parking: { available: false },
      evCharging: false,
      publicTransport: { nearestStation: '', walkingDistance: '' },
      accessibility: {
        wheelchairAccess: false,
        accessibleParking: false,
        accessibleToilets: false,
        hearingLoop: false,
        brailleSignage: false,
        serviceAnimalFriendly: false,
      },
      accessibilityScore: 0,
    }) as VenueData;
  }, [formData.venueData]);

  // ---------------------------------------------------------------------------
  // Capacity Validation
  // ---------------------------------------------------------------------------

  const capacityError = useMemo(() => {
    const { seated, standing, fireSafetyMax } = venueData.capacity;
    if (fireSafetyMax > 0) {
      return validateFireSafetyCapacity(fireSafetyMax, seated, standing);
    }
    return null;
  }, [venueData.capacity]);

  // ---------------------------------------------------------------------------
  // Update Helpers
  // ---------------------------------------------------------------------------

  const updateVenueData = useCallback(
    (updates: Partial<VenueData>) => {
      updateFormData({
        venueData: { ...venueData, ...updates } as any,
      });
    },
    [venueData, updateFormData]
  );

  // Capacity handlers
  const handleSeatedChange = useCallback(
    (value: number) => {
      updateVenueData({ capacity: { ...venueData.capacity, seated: value } });
    },
    [venueData.capacity, updateVenueData]
  );

  const handleStandingChange = useCallback(
    (value: number) => {
      updateVenueData({ capacity: { ...venueData.capacity, standing: value } });
    },
    [venueData.capacity, updateVenueData]
  );

  const handleFireSafetyChange = useCallback(
    (value: number) => {
      updateVenueData({ capacity: { ...venueData.capacity, fireSafetyMax: value } });
    },
    [venueData.capacity, updateVenueData]
  );

  // Technical rider handlers
  const handleTechnicalRiderUpload = useCallback(() => {
    // In a real implementation, this would open a file picker
    // For now, we simulate the upload flow
    // The actual upload logic would use useMediaUpload hook
    if (__DEV__) {
      console.log('Technical rider upload triggered');
    }
  }, []);

  const handleParsedSpecsUpdate = useCallback(
    (specs: Record<string, string | undefined>) => {
      updateVenueData({
        technicalRider: { ...venueData.technicalRider, parsedSpecs: specs },
      });
    },
    [venueData.technicalRider, updateVenueData]
  );

  // Opening hours handler
  const handleOpeningHoursChange = useCallback(
    (schedule: RecurringSchedule) => {
      updateVenueData({ openingHours: schedule });
    },
    [updateVenueData]
  );

  // Exception dates handler
  const handleExceptionDatesChange = useCallback(
    (dates: ExceptionDate[]) => {
      updateVenueData({ exceptionDates: dates });
    },
    [updateVenueData]
  );

  // Parking handler
  const handleParkingChange = useCallback(
    (parking: { available: boolean; capacity?: number; cost?: string }) => {
      updateVenueData({ parking });
    },
    [updateVenueData]
  );

  // EV charging handler
  const handleEvChargingChange = useCallback(
    (value: boolean) => {
      updateVenueData({ evCharging: value });
    },
    [updateVenueData]
  );

  // Public transport handler
  const handlePublicTransportChange = useCallback(
    (transport: { nearestStation: string; walkingDistance: string }) => {
      updateVenueData({ publicTransport: transport });
    },
    [updateVenueData]
  );

  // Accessibility handler
  const handleAccessibilityChange = useCallback(
    (accessibility: AccessibilityFeatures) => {
      const enabledCount = Object.values(accessibility).filter(Boolean).length;
      const totalCount = 6;
      const score = Math.round((enabledCount / totalCount) * 100);
      updateVenueData({ accessibility, accessibilityScore: score });
    },
    [updateVenueData]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: `${CultureTokens.coral}15` }]}>
          <Ionicons name="business" size={28} color={CultureTokens.coral} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>Venue Details</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Specify your venue&apos;s capacity, technical capabilities, and operational details.
          </Text>
        </View>
      </View>

      {/* Capacity Section */}
      <CapacitySection
        seated={venueData.capacity.seated}
        standing={venueData.capacity.standing}
        fireSafetyMax={venueData.capacity.fireSafetyMax}
        onSeatedChange={handleSeatedChange}
        onStandingChange={handleStandingChange}
        onFireSafetyChange={handleFireSafetyChange}
        error={capacityError}
      />

      {/* Technical Rider Section */}
      <TechnicalRiderSection
        documentUrl={venueData.technicalRider.documentUrl}
        parsedSpecs={venueData.technicalRider.parsedSpecs}
        onUpload={handleTechnicalRiderUpload}
        onParseComplete={handleParsedSpecsUpdate}
      />

      {/* Opening Hours Section */}
      <OpeningHoursSection
        schedule={venueData.openingHours}
        onChange={handleOpeningHoursChange}
      />

      {/* Exception Dates Section */}
      <ExceptionDatesSection
        dates={venueData.exceptionDates}
        onChange={handleExceptionDatesChange}
      />

      {/* Parking & Transport Section */}
      <ParkingTransportSection
        parking={venueData.parking}
        evCharging={venueData.evCharging}
        publicTransport={venueData.publicTransport}
        onParkingChange={handleParkingChange}
        onEvChargingChange={handleEvChargingChange}
        onPublicTransportChange={handlePublicTransportChange}
      />

      {/* Accessibility Section */}
      <View style={styles.accessibilitySection}>
        <View style={styles.sectionCardHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: `${CultureTokens.teal}15` }]}>
            <Ionicons name="accessibility" size={20} color={CultureTokens.teal} />
          </View>
          <Text style={[styles.sectionCardTitle, { color: colors.text }]}>
            Accessibility
          </Text>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Select all accessibility features available at your venue. Higher scores improve
          visibility in accessibility-focused searches.
        </Text>
        <AccessibilityChecklistField
          value={venueData.accessibility}
          onChange={handleAccessibilityChange}
          showScore={true}
        />
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...TextStyles.title2,
    fontSize: 24,
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },
  requiredBadge: {
    backgroundColor: CultureTokens.coral,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  requiredText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  optionalText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  // Capacity styles
  capacityGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  capacityField: {
    flex: 1,
    minWidth: 90,
  },
  numberInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: CultureTokens.coral,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  // Technical Rider styles
  uploadArea: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  uploadHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  parsedSpecsContainer: {
    gap: Spacing.sm,
  },
  parsedSpecsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  parsedSpecsTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  specKey: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  specValue: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    maxWidth: '60%',
    textAlign: 'right',
  },
  // Opening Hours styles
  scheduleList: {
    gap: 0,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeInput: {
    width: 72,
    height: 36,
    borderWidth: 1,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  closedLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    fontStyle: 'italic',
  },
  // Exception Dates styles
  exceptionList: {
    gap: 8,
  },
  exceptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: Radius.xs,
  },
  exceptionItemContent: {
    flex: 1,
    gap: 2,
  },
  exceptionDate: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  exceptionReason: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  addExceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exceptionInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: Radius.xs,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  dateInput: {
    width: 120,
  },
  reasonInput: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Parking & Transport styles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  parkingDetails: {
    paddingLeft: Spacing.md,
    gap: Spacing.sm,
  },
  parkingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  parkingField: {
    flex: 1,
  },
  transportSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transportTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  transportFields: {
    gap: Spacing.sm,
  },
  transportField: {
    gap: 4,
  },
  // Accessibility section
  accessibilitySection: {
    gap: Spacing.md,
  },
  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xl,
  },
});
