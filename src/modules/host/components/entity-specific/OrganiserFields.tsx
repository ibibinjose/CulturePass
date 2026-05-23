/**
 * OrganiserFields Component
 *
 * Entity-specific fields for the "organiser" entity type in the HostSpace
 * Enterprise-Grade Form System.
 *
 * Features:
 * - Past Events Portfolio (auto-imported from platform + manual entry)
 * - Insurance Certificate upload with expiry tracking
 * - Producer Credentials text area
 * - Credential document uploads
 * - Events Hosted count (read-only, auto-calculated)
 * - Total Attendance metric (read-only, auto-calculated)
 *
 * Requirements: 13 (Organiser-Specific Fields)
 *
 * @example
 * ```tsx
 * <OrganiserFields
 *   formData={formData}
 *   updateFormData={updateFormData}
 *   getFieldError={getFieldError}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
} from '@/design-system/tokens/theme';
import type { PartialFormData } from '../../services/formStateSerializer';
import type { OrganiserData, PastEvent } from '@/shared/schema/hostProfile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrganiserFieldsProps {
  /** Current form data */
  formData: PartialFormData;
  /** Update form data callback */
  updateFormData: (data: Partial<PartialFormData>) => void;
  /** Get field error helper */
  getFieldError: (field: string) => string | undefined;
  /** Whether validation is in progress */
  isValidating?: boolean;
}

interface ManualEventForm {
  name: string;
  date: string;
  venue: string;
  attendance: string;
}

const EMPTY_EVENT_FORM: ManualEventForm = {
  name: '',
  date: '',
  venue: '',
  attendance: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrganiserFields({
  formData,
  updateFormData,
  getFieldError,
  isValidating = false,
}: OrganiserFieldsProps) {
  const colors = useColors();
  const { isDesktop, isMobile } = useLayout();

  // Local state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEvent, setManualEvent] = useState<ManualEventForm>(EMPTY_EVENT_FORM);
  const [isUploadingInsurance, setIsUploadingInsurance] = useState(false);
  const [isUploadingCredential, setIsUploadingCredential] = useState(false);

  // ---------------------------------------------------------------------------
  // Derived Data
  // ---------------------------------------------------------------------------

  const organiserData: OrganiserData = formData.organiserData ?? {
    pastEvents: [],
    producerCredentials: '',
    credentialDocuments: [],
    eventsHostedCount: 0,
    totalAttendance: 0,
  };

  const pastEvents = organiserData.pastEvents ?? [];
  const insuranceCertificate = organiserData.insuranceCertificate;
  const producerCredentials = organiserData.producerCredentials ?? '';
  const credentialDocuments = organiserData.credentialDocuments ?? [];
  const eventsHostedCount = organiserData.eventsHostedCount ?? 0;
  const totalAttendance = organiserData.totalAttendance ?? 0;

  // Calculate average attendance
  const averageAttendance =
    pastEvents.length > 0
      ? Math.round(
          pastEvents.reduce((sum, e) => sum + e.attendance, 0) / pastEvents.length
        )
      : 0;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const updateOrganiserData = useCallback(
    (updates: Partial<OrganiserData>) => {
      updateFormData({
        organiserData: { ...organiserData, ...updates },
      });
    },
    [organiserData, updateFormData]
  );

  /**
   * Check if insurance certificate is expiring within 30 days
   */
  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  /**
   * Check if insurance certificate has expired
   */
  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleAddManualEvent = () => {
    if (!manualEvent.name || !manualEvent.date || !manualEvent.venue) return;

    const newEvent: PastEvent = {
      name: manualEvent.name.trim(),
      date: manualEvent.date.trim(),
      venue: manualEvent.venue.trim(),
      attendance: parseInt(manualEvent.attendance, 10) || 0,
    };

    updateOrganiserData({
      pastEvents: [...pastEvents, newEvent],
    });

    setManualEvent(EMPTY_EVENT_FORM);
    setShowManualEntry(false);
  };

  const handleRemoveEvent = (index: number) => {
    const updated = pastEvents.filter((_, i) => i !== index);
    updateOrganiserData({ pastEvents: updated });
  };

  const handleUploadInsurance = async () => {
    try {
      setIsUploadingInsurance(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera roll permissions are required to upload documents.');
        setIsUploadingInsurance(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        setIsUploadingInsurance(false);
        return;
      }

      const file = result.assets[0];

      // Simulate upload (in production, upload to Firebase Storage)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      updateOrganiserData({
        insuranceCertificate: {
          documentUrl: file.uri,
          expiryDate: '', // User will set this
          verified: false,
        },
      });

      setIsUploadingInsurance(false);
    } catch (err) {
      console.error('Error uploading insurance certificate:', err);
      setIsUploadingInsurance(false);
    }
  };

  const handleRemoveInsurance = () => {
    updateOrganiserData({ insuranceCertificate: undefined });
  };

  const handleInsuranceExpiryChange = (dateString: string) => {
    if (!insuranceCertificate) return;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateString && !dateRegex.test(dateString)) return;
    updateOrganiserData({
      insuranceCertificate: {
        ...insuranceCertificate,
        expiryDate: dateString,
      },
    });
  };

  const handleUploadCredential = async () => {
    try {
      setIsUploadingCredential(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera roll permissions are required to upload documents.');
        setIsUploadingCredential(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        setIsUploadingCredential(false);
        return;
      }

      const file = result.assets[0];

      // Simulate upload (in production, upload to Firebase Storage)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      updateOrganiserData({
        credentialDocuments: [...credentialDocuments, file.uri],
      });

      setIsUploadingCredential(false);
    } catch (err) {
      console.error('Error uploading credential document:', err);
      setIsUploadingCredential(false);
    }
  };

  const handleRemoveCredential = (index: number) => {
    const updated = credentialDocuments.filter((_, i) => i !== index);
    updateOrganiserData({ credentialDocuments: updated });
  };

  const handleCredentialsTextChange = (text: string) => {
    updateOrganiserData({ producerCredentials: text });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surfaceElevated },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={28}
            color={CultureTokens.indigo}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Organiser Details
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Showcase your event history, credentials, and insurance to build trust
          with venues and attendees.
        </Text>
      </View>

      {/* Metrics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Performance Metrics
        </Text>
        <View style={[styles.metricsRow, isMobile && styles.metricsRowMobile]}>
          <MetricCard
            icon="trophy-outline"
            label="Events Hosted"
            value={eventsHostedCount.toString()}
            colors={colors}
          />
          <MetricCard
            icon="people-outline"
            label="Total Attendance"
            value={totalAttendance.toLocaleString()}
            colors={colors}
          />
          <MetricCard
            icon="stats-chart-outline"
            label="Avg. Attendance"
            value={averageAttendance.toLocaleString()}
            colors={colors}
          />
        </View>
      </View>

      {/* Past Events Portfolio */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Past Events Portfolio
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
          Events you&apos;ve hosted on CulturePass are auto-imported. Add external
          events manually.
        </Text>

        {getFieldError('organiserData.pastEvents') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('organiserData.pastEvents')}
          </Text>
        )}

        {/* Auto-imported events */}
        {pastEvents.filter((e) => e.culturePassEventId).length > 0 && (
          <View style={styles.eventGroup}>
            <View style={styles.eventGroupHeader}>
              <Ionicons
                name="cloud-done-outline"
                size={16}
                color={CultureTokens.teal}
              />
              <Text
                style={[
                  styles.eventGroupLabel,
                  { color: CultureTokens.teal },
                ]}
              >
                Auto-imported from CulturePass
              </Text>
            </View>
            {pastEvents
              .filter((e) => e.culturePassEventId)
              .map((event, index) => (
                <EventCard
                  key={`auto-${index}`}
                  event={event}
                  isAutoImported
                  colors={colors}
                />
              ))}
          </View>
        )}

        {/* Manually added events */}
        {pastEvents.filter((e) => !e.culturePassEventId).length > 0 && (
          <View style={styles.eventGroup}>
            <View style={styles.eventGroupHeader}>
              <Ionicons
                name="create-outline"
                size={16}
                color={CultureTokens.indigo}
              />
              <Text
                style={[
                  styles.eventGroupLabel,
                  { color: CultureTokens.indigo },
                ]}
              >
                Manually Added
              </Text>
            </View>
            {pastEvents
              .filter((e) => !e.culturePassEventId)
              .map((event, index) => {
                const actualIndex = pastEvents.findIndex(
                  (e) =>
                    !e.culturePassEventId &&
                    e.name === event.name &&
                    e.date === event.date
                );
                return (
                  <EventCard
                    key={`manual-${index}`}
                    event={event}
                    isAutoImported={false}
                    onRemove={() => handleRemoveEvent(actualIndex)}
                    colors={colors}
                  />
                );
              })}
          </View>
        )}

        {/* Manual Entry Form */}
        {showManualEntry ? (
          <View
            style={[
              styles.manualEntryForm,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Text style={[styles.manualEntryTitle, { color: colors.text }]}>
              Add External Event
            </Text>

            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Event Name *
              </Text>
              <TextInput
                value={manualEvent.name}
                onChangeText={(text) =>
                  setManualEvent((prev) => ({ ...prev, name: text }))
                }
                placeholder="e.g. Summer Music Festival 2024"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
                accessibilityLabel="Event name"
              />
            </View>

            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Date *
              </Text>
              <TextInput
                value={manualEvent.date}
                onChangeText={(text) =>
                  setManualEvent((prev) => ({ ...prev, date: text }))
                }
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
                maxLength={10}
                keyboardType={
                  Platform.OS === 'web' ? 'default' : 'numeric'
                }
                accessibilityLabel="Event date"
                accessibilityHint="Enter date in YYYY-MM-DD format"
              />
            </View>

            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Venue *
              </Text>
              <TextInput
                value={manualEvent.venue}
                onChangeText={(text) =>
                  setManualEvent((prev) => ({ ...prev, venue: text }))
                }
                placeholder="e.g. Sydney Opera House"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
                accessibilityLabel="Event venue"
              />
            </View>

            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Attendance
              </Text>
              <TextInput
                value={manualEvent.attendance}
                onChangeText={(text) =>
                  setManualEvent((prev) => ({ ...prev, attendance: text }))
                }
                placeholder="e.g. 500"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
                keyboardType="numeric"
                accessibilityLabel="Event attendance"
                accessibilityHint="Number of attendees"
              />
            </View>

            <View style={styles.manualEntryActions}>
              <Pressable
                onPress={() => {
                  setShowManualEntry(false);
                  setManualEvent(EMPTY_EVENT_FORM);
                }}
                style={({ pressed }) => [
                  styles.cancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancel adding event"
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAddManualEvent}
                disabled={
                  !manualEvent.name || !manualEvent.date || !manualEvent.venue
                }
                style={({ pressed }) => [
                  styles.addEventButton,
                  {
                    backgroundColor: CultureTokens.indigo,
                    opacity:
                      !manualEvent.name ||
                      !manualEvent.date ||
                      !manualEvent.venue
                        ? 0.5
                        : pressed
                          ? 0.8
                          : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add event to portfolio"
                accessibilityState={{
                  disabled:
                    !manualEvent.name ||
                    !manualEvent.date ||
                    !manualEvent.venue,
                }}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowManualEntry(true)}
            style={({ pressed }) => [
              styles.addManualButton,
              {
                borderColor: colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add external event manually"
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={CultureTokens.indigo}
            />
            <Text
              style={[
                styles.addManualButtonText,
                { color: CultureTokens.indigo },
              ]}
            >
              Add External Event
            </Text>
          </Pressable>
        )}
      </View>

      {/* Insurance Certificate */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Insurance Certificate
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
          Required for organisers planning paid events. Upload your public
          liability insurance certificate.
        </Text>

        {getFieldError('organiserData.insuranceCertificate') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('organiserData.insuranceCertificate')}
          </Text>
        )}

        {insuranceCertificate ? (
          <View
            style={[
              styles.insuranceCard,
              { backgroundColor: colors.surfaceElevated },
              isExpired(insuranceCertificate.expiryDate) &&
                styles.insuranceCardExpired,
            ]}
            accessibilityLabel={`Insurance certificate uploaded. ${
              insuranceCertificate.verified ? 'Verified' : 'Pending verification'
            }${
              insuranceCertificate.expiryDate
                ? `. Expires ${new Date(insuranceCertificate.expiryDate).toLocaleDateString()}`
                : ''
            }`}
          >
            <View style={styles.insuranceHeader}>
              <View style={styles.insuranceIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={CultureTokens.teal}
                />
              </View>
              <View style={styles.insuranceInfo}>
                <Text
                  style={[styles.insuranceTitle, { color: colors.text }]}
                >
                  Public Liability Insurance
                </Text>
                <Text
                  style={[
                    styles.insuranceFileName,
                    { color: colors.textSecondary },
                  ]}
                >
                  {insuranceCertificate.documentUrl.split('/').pop() ||
                    'certificate.jpg'}
                </Text>
              </View>
              <Pressable
                onPress={handleRemoveInsurance}
                hitSlop={8}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel="Remove insurance certificate"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Expiry Date */}
            <View style={styles.insuranceFieldRow}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Expiry Date
              </Text>
              <TextInput
                value={insuranceCertificate.expiryDate || ''}
                onChangeText={handleInsuranceExpiryChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
                maxLength={10}
                keyboardType={
                  Platform.OS === 'web' ? 'default' : 'numeric'
                }
                accessibilityLabel="Insurance expiry date"
                accessibilityHint="Enter date in YYYY-MM-DD format"
              />
            </View>

            {/* Status Badges */}
            <View style={styles.insuranceStatus}>
              {insuranceCertificate.verified ? (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${CultureTokens.teal}15` },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={CultureTokens.teal}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: CultureTokens.teal },
                    ]}
                  >
                    Verified
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${CultureTokens.indigo}10` },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={CultureTokens.indigo}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: CultureTokens.indigo },
                    ]}
                  >
                    Pending Verification
                  </Text>
                </View>
              )}

              {isExpired(insuranceCertificate.expiryDate) && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${CultureTokens.coral}15` },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color={CultureTokens.coral}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: CultureTokens.coral },
                    ]}
                  >
                    Expired
                  </Text>
                </View>
              )}

              {isExpiringSoon(insuranceCertificate.expiryDate) &&
                !isExpired(insuranceCertificate.expiryDate) && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: '#FFC85715' },
                    ]}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={14}
                      color="#B8860B"
                    />
                    <Text style={[styles.statusText, { color: '#B8860B' }]}>
                      Expiring Soon
                    </Text>
                  </View>
                )}
            </View>

            {/* Renewal reminder info */}
            {isExpiringSoon(insuranceCertificate.expiryDate) &&
              !isExpired(insuranceCertificate.expiryDate) && (
                <View
                  style={[
                    styles.reminderBanner,
                    { backgroundColor: '#FFC85710' },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={14}
                    color="#B8860B"
                  />
                  <Text style={[styles.reminderText, { color: '#B8860B' }]}>
                    A renewal reminder will be sent 30 days before expiry.
                  </Text>
                </View>
              )}
          </View>
        ) : (
          <Pressable
            onPress={handleUploadInsurance}
            disabled={isUploadingInsurance}
            style={({ pressed }) => [
              styles.uploadButton,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Upload insurance certificate"
            accessibilityHint="Opens image picker to select your insurance document"
          >
            {isUploadingInsurance ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={CultureTokens.indigo}
                />
                <Text
                  style={[styles.uploadButtonText, { color: colors.text }]}
                >
                  Uploading...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={24}
                  color={CultureTokens.indigo}
                />
                <Text
                  style={[styles.uploadButtonText, { color: colors.text }]}
                >
                  Upload Insurance Certificate
                </Text>
                <Text
                  style={[
                    styles.uploadButtonHint,
                    { color: colors.textSecondary },
                  ]}
                >
                  Images (JPG, PNG) • Max 10MB
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Producer Credentials */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Producer Credentials
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
          Describe your professional affiliations, qualifications, and
          experience as an event producer.
        </Text>

        {getFieldError('organiserData.producerCredentials') && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getFieldError('organiserData.producerCredentials')}
          </Text>
        )}

        <TextInput
          value={producerCredentials}
          onChangeText={handleCredentialsTextChange}
          placeholder="e.g. Member of Live Performance Australia, 10+ years producing cultural festivals, certified event safety manager..."
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.credentialsInput,
            {
              color: colors.text,
              borderColor: colors.borderLight,
              backgroundColor: colors.surfaceElevated,
            },
          ]}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
          accessibilityLabel="Producer credentials"
          accessibilityHint="Describe your qualifications and experience"
        />
        <Text style={[styles.charCount, { color: colors.textTertiary }]}>
          {producerCredentials.length}/1000
        </Text>

        {/* Credential Documents */}
        <View style={styles.credentialDocs}>
          <Text
            style={[styles.fieldLabel, { color: colors.textSecondary }]}
          >
            Supporting Documents
          </Text>

          {credentialDocuments.length > 0 && (
            <View style={styles.docsList}>
              {credentialDocuments.map((docUrl, index) => (
                <View
                  key={index}
                  style={[
                    styles.docItem,
                    { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={16}
                    color={CultureTokens.indigo}
                  />
                  <Text
                    style={[styles.docName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {docUrl.split('/').pop() || `Document ${index + 1}`}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveCredential(index)}
                    hitSlop={8}
                    style={styles.removeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove credential document ${index + 1}`}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={handleUploadCredential}
            disabled={isUploadingCredential}
            style={({ pressed }) => [
              styles.uploadCredentialButton,
              {
                borderColor: colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Upload credential document"
            accessibilityHint="Opens image picker to select a credential document"
          >
            {isUploadingCredential ? (
              <ActivityIndicator
                size="small"
                color={CultureTokens.indigo}
              />
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={CultureTokens.indigo}
                />
                <Text
                  style={[
                    styles.uploadCredentialText,
                    { color: CultureTokens.indigo },
                  ]}
                >
                  Upload Document
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}

function MetricCard({ icon, label, value, colors }: MetricCardProps) {
  return (
    <View
      style={[styles.metricCard, { backgroundColor: colors.surfaceElevated }]}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <Ionicons name={icon} size={20} color={CultureTokens.indigo} />
      <Text style={[styles.metricValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

interface EventCardProps {
  event: PastEvent;
  isAutoImported: boolean;
  onRemove?: () => void;
  colors: ReturnType<typeof useColors>;
}

function EventCard({ event, isAutoImported, onRemove, colors }: EventCardProps) {
  return (
    <View
      style={[styles.eventCard, { backgroundColor: colors.surfaceElevated }]}
      accessibilityLabel={`Event: ${event.name}, ${event.date}, at ${event.venue}, ${event.attendance} attendees`}
    >
      <View style={styles.eventCardContent}>
        <Text style={[styles.eventName, { color: colors.text }]}>
          {event.name}
        </Text>
        <View style={styles.eventMeta}>
          <View style={styles.eventMetaItem}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.eventMetaText, { color: colors.textSecondary }]}
            >
              {event.date}
            </Text>
          </View>
          <View style={styles.eventMetaItem}>
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.eventMetaText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {event.venue}
            </Text>
          </View>
          <View style={styles.eventMetaItem}>
            <Ionicons
              name="people-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.eventMetaText, { color: colors.textSecondary }]}
            >
              {event.attendance.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
      {!isAutoImported && onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${event.name} from portfolio`}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      )}
      {isAutoImported && (
        <View style={[styles.autoImportBadge, { backgroundColor: `${CultureTokens.teal}15` }]}>
          <Ionicons name="link" size={12} color={CultureTokens.teal} />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  contentDesktop: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricsRowMobile: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 100,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    lineHeight: 30,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },

  // Events
  eventGroup: {
    gap: Spacing.sm,
  },
  eventGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  eventGroupLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  eventCardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  eventName: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  autoImportBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Manual Entry Form
  manualEntryForm: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  manualEntryTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  formField: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  textInput: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: Radius.sm,
    minHeight: 44,
  },
  manualEntryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    minHeight: 44,
  },
  addEventButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  addManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 44,
  },
  addManualButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },

  // Insurance
  insuranceCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  insuranceCardExpired: {
    borderWidth: 1,
    borderColor: `${CultureTokens.coral}40`,
  },
  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insuranceIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: `${CultureTokens.teal}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insuranceInfo: {
    flex: 1,
    gap: 2,
  },
  insuranceTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  insuranceFileName: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  insuranceFieldRow: {
    gap: Spacing.xs,
  },
  insuranceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },

  // Upload Button
  uploadButton: {
    minHeight: 120,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  uploadButtonHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  // Credentials
  credentialsInput: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    textAlign: 'right',
  },
  credentialDocs: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  docsList: {
    gap: Spacing.sm,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  docName: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  uploadCredentialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 44,
  },
  uploadCredentialText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },

  // Common
  removeButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});

export default OrganiserFields;
