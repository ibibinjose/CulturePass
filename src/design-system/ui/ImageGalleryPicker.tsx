import React, { useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useM3Colors } from '@/hooks/useM3Colors';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Radius, M3Typography, FontFamily } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';
import {
  DEFAULT_IMAGE_CONFIGS,
  makeDefaultUri,
  isDefaultImageUri,
  getDefaultKey,
  type DefaultImageKey,
} from '@/lib/defaultImages';

export type ImageGalleryPickerProps = {
  visible: boolean;
  onClose: () => void;
  currentUri?: string | null;
  onSelect: (uri: string) => void;
  /** Firebase Storage collection path, e.g. 'users', 'events', 'profiles' */
  collectionName: string;
  /** Document ID for the upload path */
  docId: string;
  /** Firestore field to write — only used when skipDbUpdate=false */
  fieldName?: string;
  /** Pass true when the parent form owns persistence (event/listing create flows) */
  skipDbUpdate?: boolean;
  /** Store the previous remote image URL in Firestore history when replacing */
  preservePrevious?: boolean;
  historyFieldName?: string;
  resizeWidth?: number;
};

const TILE_GAP = 10;
const NUM_COLS = 3;
const H_PAD = 20;

export function ImageGalleryPicker({
  visible,
  onClose,
  currentUri,
  onSelect,
  collectionName,
  docId,
  fieldName = 'imageUrl',
  skipDbUpdate = true,
  preservePrevious = false,
  historyFieldName,
  resizeWidth,
}: ImageGalleryPickerProps) {
  const m3Colors = useM3Colors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { uploadImage, uploading, progress } = useImageUpload();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const tileSize = (screenWidth - H_PAD * 2 - TILE_GAP * (NUM_COLS - 1)) / NUM_COLS;

  const currentDefaultKey: DefaultImageKey | null =
    currentUri && isDefaultImageUri(currentUri) ? getDefaultKey(currentUri) : null;

  const handlePickFromGallery = useCallback(async () => {
    setUploadError(null);
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setUploadError('Photo access required — allow it in Settings.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const { downloadURL } = await uploadImage(
        result,
        collectionName,
        docId,
        fieldName,
        skipDbUpdate,
        {
          historyFieldName,
          preservePrevious,
          previousUrl: currentUri && !isDefaultImageUri(currentUri) ? currentUri : null,
          resizeWidth,
        },
      );
      onSelect(downloadURL);
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  }, [collectionName, currentUri, docId, fieldName, historyFieldName, preservePrevious, resizeWidth, skipDbUpdate, uploadImage, onSelect, onClose]);

  const handleSelectDefault = useCallback(
    (key: DefaultImageKey) => {
      onSelect(makeDefaultUri(key));
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: m3Colors.surface, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Handle bar */}
          <View
            style={[styles.handle, { backgroundColor: withAlpha(m3Colors.onSurface, 0.2) }]}
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
              Choose image
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={m3Colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.grid}
          >
            {/* Upload from gallery tile */}
            <Pressable
              onPress={handlePickFromGallery}
              disabled={uploading}
              style={[
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  borderColor: uploading
                    ? m3Colors.primary
                    : m3Colors.outlineVariant,
                  backgroundColor: uploading
                    ? withAlpha(m3Colors.primary, 0.06)
                    : m3Colors.surfaceContainerLow,
                  // dashed border — web + iOS only (Android ignores borderStyle)
                  borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upload from gallery"
            >
              {uploading ? (
                <View style={styles.tileInner}>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: withAlpha(m3Colors.primary, 0.2) },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(progress)}%` as `${number}%`,
                          backgroundColor: m3Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.tileLabel, { color: m3Colors.primary }]}>
                    {Math.round(progress)}%
                  </Text>
                </View>
              ) : (
                <View style={styles.tileInner}>
                  <View
                    style={[
                      styles.uploadIconRing,
                      { backgroundColor: withAlpha(m3Colors.primary, 0.1) },
                    ]}
                  >
                    <Ionicons name="add" size={28} color={m3Colors.primary} />
                  </View>
                  <Text style={[styles.tileLabel, { color: m3Colors.onSurfaceVariant }]}>
                    Upload & crop
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Gradient default tiles */}
            {DEFAULT_IMAGE_CONFIGS.map((config) => {
              const isSelected = currentDefaultKey === config.key;
              return (
                <Pressable
                  key={config.key}
                  onPress={() => handleSelectDefault(config.key)}
                  style={[styles.tile, { width: tileSize, height: tileSize }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${config.label} default image`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <LinearGradient
                    colors={config.gradientColors as readonly [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientFill}
                  >
                    <Ionicons
                      name={config.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.gradientLabel}>{config.label}</Text>

                    {isSelected && (
                      <View style={styles.checkOverlay}>
                        <View
                          style={[
                            styles.checkCircle,
                            { backgroundColor: m3Colors.primary },
                          ]}
                        >
                          <Ionicons name="checkmark" size={14} color={m3Colors.onPrimary} />
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </ScrollView>

          {uploadError ? (
            <View
              style={[styles.errorRow, { backgroundColor: m3Colors.errorContainer }]}
            >
              <Ionicons name="alert-circle-outline" size={16} color={m3Colors.error} />
              <Text
                style={[
                  M3Typography.bodySmall,
                  { color: m3Colors.error, flex: 1 },
                ]}
              >
                {uploadError}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    paddingBottom: 16,
  },
  tile: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    textAlign: 'center',
  },

  // Gradient tile
  gradientFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gradientLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  checkOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Upload progress
  progressTrack: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.sm,
    marginTop: 4,
    marginBottom: 8,
  },
});
