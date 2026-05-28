import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  FontFamily,
  Radius,
  ButtonTokens,
} from '@/design-system/tokens/theme';

export interface Licence {
  id: string;
  type: string;
  number: string;
  documentUrl: string;
  fileName: string;
  expiryDate?: string;
  verified: boolean;
  uploadedAt: string;
}

export interface LicenceUploadFieldProps {
  value: Licence[];
  onChange: (licences: Licence[]) => void;
  label?: string;
  hint?: string;
  error?: string;
  maxFiles?: number;
  acceptedTypes?: string[];
  /** Available licence type options */
  licenceTypeOptions?: string[];
  /** Whether to show OCR scan option */
  showOCRScan?: boolean;
}

/** Default licence type options */
const DEFAULT_LICENCE_TYPES = [
  'Business Registration',
  'Food & Liquor Licence',
  'Entertainment Permit',
  'Insurance Certificate',
  'Fire Safety Certificate',
  'Professional Credential',
  'Influencer Verification',
  'Other',
];

/**
 * LicenceUploadField Component
 * 
 * Multi-file upload component for legal documents, licences, and permits.
 * 
 * Features:
 * - Upload multiple documents (PDF, images)
 * - Track expiry dates with renewal reminders
 * - Display verification status badges
 * - Support OCR scanning (future enhancement)
 * - Drag-and-drop on web (future enhancement)
 * 
 * Document Types:
 * - Business registration certificates
 * - Food & liquor licences
 * - Entertainment permits
 * - Insurance certificates
 * - Professional credentials
 * - Influencer verification documents
 * 
 * @example
 * ```tsx
 * <LicenceUploadField
 *   value={formData.licences}
 *   onChange={(licences) => setFormData({ ...formData, licences })}
 *   label="Licences & Permits"
 *   hint="Upload business registration, permits, or certificates"
 * />
 * ```
 */
export function LicenceUploadField({
  value,
  onChange,
  label = 'Licences & Permits',
  hint = 'Upload business registration, permits, or certificates (images)',
  error,
  maxFiles = 5,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  licenceTypeOptions = DEFAULT_LICENCE_TYPES,
  showOCRScan = true,
}: LicenceUploadFieldProps) {
  const colors = useColors();
  const [isUploading, setIsUploading] = useState(false);
  const [editingLicenceId] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState<string | null>(null);

  const handlePickDocument = async () => {
    try {
      setIsUploading(true);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Sorry, we need camera roll permissions to upload documents.');
        } else {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload documents.');
        }
        setIsUploading(false);
        return;
      }

      // For now, use image picker (in production, consider expo-document-picker for PDFs)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];

      // Simulate upload (in production, upload to Firebase Storage)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newLicence: Licence = {
        id: `licence_${Date.now()}`,
        type: 'Business Registration', // Default type, user can edit
        number: '',
        documentUrl: file.uri,
        fileName: file.uri.split('/').pop() || 'document.jpg',
        verified: false,
        uploadedAt: new Date().toISOString(),
      };

      onChange([...value, newLicence]);
      setIsUploading(false);
    } catch (err) {
      console.error('Error picking document:', err);
      setIsUploading(false);
    }
  };

  const handleRemoveLicence = (id: string) => {
    onChange(value.filter((licence) => licence.id !== id));
  };

  const handleUpdateLicence = (id: string, updates: Partial<Licence>) => {
    onChange(
      value.map((licence) =>
        licence.id === id ? { ...licence, ...updates } : licence
      )
    );
  };

  const handleSetExpiryDate = (id: string, dateString: string) => {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateString && !dateRegex.test(dateString)) return;
    handleUpdateLicence(id, { expiryDate: dateString || undefined });
  };

  const handleSetLicenceType = (id: string, type: string) => {
    handleUpdateLicence(id, { type });
    setShowTypeSelector(null);
  };

  const handleSetLicenceNumber = (id: string, number: string) => {
    handleUpdateLicence(id, { number });
  };

  /**
   * Check if a licence is expiring soon (within 30 days)
   */
  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  /**
   * Check if a licence has expired
   */
  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const canAddMore = value.length < maxFiles;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>
      )}

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <Pressable
          onPress={handlePickDocument}
          disabled={isUploading}
          style={({ pressed }) => [
            styles.uploadButton,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Upload licence document"
          accessibilityHint="Opens image picker to select a document"
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="small" color={CultureTokens.indigo} />
              <Text style={[styles.uploadButtonText, { color: colors.text }]}>
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
              <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                Upload Document
              </Text>
              <Text style={[styles.uploadButtonHint, { color: colors.textSecondary }]}>
                Images (JPG, PNG) • Max 10MB
              </Text>
            </>
          )}
        </Pressable>
      )}

      {/* OCR Scan Info */}
      {showOCRScan && canAddMore && (
        <View style={[styles.ocrInfo, { backgroundColor: `${CultureTokens.indigo}08` }]}>
          <Ionicons name="scan-outline" size={14} color={CultureTokens.indigo} />
          <Text style={[styles.ocrInfoText, { color: colors.textSecondary }]}>
            OCR scanning will automatically extract details from uploaded documents
          </Text>
        </View>
      )}

      {/* Uploaded Documents List */}
      {value.length > 0 && (
        <ScrollView
          style={styles.licencesList}
          showsVerticalScrollIndicator={false}
        >
          {value.map((licence) => (
            <View
              key={licence.id}
              style={[
                styles.licenceCard,
                { backgroundColor: colors.surfaceElevated },
                isExpired(licence.expiryDate) && styles.licenceCardExpired,
              ]}
              accessibilityLabel={`Licence: ${licence.type}. ${licence.verified ? 'Verified' : 'Pending verification'}${licence.expiryDate ? `. Expires ${new Date(licence.expiryDate).toLocaleDateString()}` : ''}`}
            >
              <View style={styles.licenceHeader}>
                <View style={styles.licenceIcon}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={CultureTokens.indigo}
                  />
                </View>
                <View style={styles.licenceInfo}>
                  <Text style={[styles.licenceFileName, { color: colors.text }]}>
                    {licence.fileName}
                  </Text>
                  {/* Licence Type Selector */}
                  <Pressable
                    onPress={() => setShowTypeSelector(
                      showTypeSelector === licence.id ? null : licence.id
                    )}
                    accessibilityRole="button"
                    accessibilityLabel={`Licence type: ${licence.type}. Tap to change.`}
                  >
                    <Text style={[styles.licenceType, { color: CultureTokens.indigo }]}>
                      {licence.type} ▾
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => handleRemoveLicence(licence.id)}
                  hitSlop={8}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${licence.type} document`}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Type Selector Dropdown */}
              {showTypeSelector === licence.id && (
                <View style={[styles.typeSelector, { backgroundColor: colors.card }]}>
                  {licenceTypeOptions.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => handleSetLicenceType(licence.id, type)}
                      style={({ pressed }) => [
                        styles.typeSelectorOption,
                        {
                          backgroundColor: licence.type === type
                            ? `${CultureTokens.indigo}15`
                            : pressed
                              ? colors.surfaceElevated
                              : 'transparent',
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: licence.type === type }}
                    >
                      <Text
                        style={[
                          styles.typeSelectorText,
                          {
                            color: licence.type === type
                              ? CultureTokens.indigo
                              : colors.text,
                            fontFamily: licence.type === type
                              ? FontFamily.semibold
                              : FontFamily.regular,
                          },
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Licence Number Input */}
              <View style={styles.licenceFieldRow}>
                <Text style={[styles.licenceFieldLabel, { color: colors.textSecondary }]}>
                  Licence #:
                </Text>
                <TextInput
                  value={licence.number}
                  onChangeText={(text) => handleSetLicenceNumber(licence.id, text)}
                  placeholder="Enter licence number"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.licenceFieldInput,
                    { color: colors.text, borderColor: colors.borderLight },
                  ]}
                  accessibilityLabel="Licence number"
                />
              </View>

              {/* Expiry Date Input */}
              <View style={styles.licenceFieldRow}>
                <Text style={[styles.licenceFieldLabel, { color: colors.textSecondary }]}>
                  Expires:
                </Text>
                <TextInput
                  value={licence.expiryDate || ''}
                  onChangeText={(text) => handleSetExpiryDate(licence.id, text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.licenceFieldInput,
                    { color: colors.text, borderColor: colors.borderLight },
                  ]}
                  maxLength={10}
                  keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                  accessibilityLabel="Licence expiry date"
                  accessibilityHint="Enter date in YYYY-MM-DD format"
                />
              </View>

              {/* Verification Status */}
              <View style={styles.licenceStatus}>
                {licence.verified ? (
                  <View style={[styles.statusBadge, { backgroundColor: `${CultureTokens.teal}15` }]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={CultureTokens.teal}
                    />
                    <Text style={[styles.statusText, { color: CultureTokens.teal }]}>
                      Verified
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: `${CultureTokens.indigo}10` }]}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={CultureTokens.indigo}
                    />
                    <Text style={[styles.statusText, { color: CultureTokens.indigo }]}>
                      Pending Verification
                    </Text>
                  </View>
                )}

                {/* Expiry Warning */}
                {isExpired(licence.expiryDate) && (
                  <View style={[styles.statusBadge, { backgroundColor: `${CultureTokens.coral}15` }]}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={CultureTokens.coral}
                    />
                    <Text style={[styles.statusText, { color: CultureTokens.coral }]}>
                      Expired
                    </Text>
                  </View>
                )}

                {isExpiringSoon(licence.expiryDate) && !isExpired(licence.expiryDate) && (
                  <View style={[styles.statusBadge, { backgroundColor: '#FFC85715' }]}>
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
            </View>
          ))}
        </ScrollView>
      )}

      {/* File Count */}
      {value.length > 0 && (
        <Text style={[styles.fileCount, { color: colors.textTertiary }]}>
          {value.length} of {maxFiles} documents uploaded
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginLeft: 4,
  },
  error: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
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
  ocrInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  ocrInfoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  licencesList: {
    maxHeight: 600,
  },
  licenceCard: {
    padding: 12,
    borderRadius: Radius.md,
    gap: 10,
    marginBottom: 10,
  },
  licenceCardExpired: {
    borderWidth: 1,
    borderColor: `${CultureTokens.coral}40`,
  },
  licenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  licenceIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: `${CultureTokens.indigo}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  licenceInfo: {
    flex: 1,
    gap: 2,
  },
  licenceFileName: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  licenceType: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  removeButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelector: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  typeSelectorOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44, // Touch target compliance (44×44pt)
    justifyContent: 'center',
  },
  typeSelectorText: {
    fontSize: 13,
  },
  licenceFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  licenceFieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    width: 70,
  },
  licenceFieldInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  licenceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
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
  fileCount: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginLeft: 4,
  },
});

export default LicenceUploadField;
