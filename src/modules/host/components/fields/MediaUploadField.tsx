import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  Radius,
  Spacing,
  FontFamily,
} from '@/design-system/tokens/theme';
import { useMediaUpload, type MediaUploadOptions } from '@/modules/host/hooks/useMediaUpload';
import { ImageCropModal } from './ImageCropModal';
import { mediaUploadLabel } from '../../utils/accessibility';

export interface MediaUploadFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  type: 'logo' | 'hero' | 'gallery' | 'video';
  value: string | string[];
  onChange: (value: string | string[]) => void;
  storagePath: string; // e.g., 'profiles/123'
  aspectRatio?: number;
  minDimensions?: { width: number; height: number };
  maxSize?: number;
  maxItems?: number; // For gallery type
  showCropTool?: boolean;
  showBackgroundRemoval?: boolean; // Future feature
}

/**
 * MediaUploadField
 *
 * Comprehensive media upload component for HostSpace profile creation.
 * Supports images and videos with validation, preview, and editing.
 *
 * Features:
 * - Drag-and-drop upload (web) with visual feedback
 * - Camera/gallery picker (native)
 * - Image preview with edit/delete actions
 * - Crop tool for logos and hero images
 * - Gallery reordering (drag-to-reorder via move up/down buttons)
 * - Video preview with duration display
 * - Progress indicator for uploads
 * - Validation feedback (format, size, dimensions)
 * - Responsive design (mobile/tablet/desktop)
 *
 * Validation:
 * - Logo: 400×400px minimum, square aspect ratio
 * - Hero: 16:9 or 21:9 aspect ratio
 * - Gallery: up to 12 images
 * - Video: MP4/WebM, 3 minutes max, 100MB max
 * - Image formats: JPEG, PNG, 10MB max
 *
 * Validates: Requirements 7
 */
function MediaUploadField({
  label,
  hint,
  error,
  type,
  value,
  onChange,
  storagePath,
  aspectRatio,
  minDimensions,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxItems = 12,
  showCropTool = true,
  showBackgroundRemoval = false,
}: MediaUploadFieldProps) {
  const colors = useColors();
  const {
    uploading,
    progress,
    error: uploadError,
    pickImage,
    takePhoto,
    uploadImage,
    uploadWebFile,
    deleteImage,
    requestAITags,
    removeBackground,
    clearError,
  } = useMediaUpload();

  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isGallery = type === 'gallery';
  const isVideo = type === 'video';
  const currentValues = Array.isArray(value) ? value : value ? [value] : [];
  const hasValue = currentValues.length > 0;
  const canAddMore = isGallery && currentValues.length < maxItems;

  const uploadOptions: MediaUploadOptions = {
    type,
    aspectRatio,
    minDimensions,
    maxSize,
  };

  // ---------------------------------------------------------------------------
  // Web Drag-and-Drop Handlers
  // ---------------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        clearError();

        if (isGallery) {
          // Upload multiple files for gallery
          const remainingSlots = maxItems - currentValues.length;
          const filesToUpload = files.slice(0, remainingSlots);

          for (const file of filesToUpload) {
            const result = await uploadWebFile(file, storagePath, uploadOptions);
            onChange([...currentValues, result.downloadURL]);
          }
        } else {
          // Upload single file
          const file = files[0];
          const result = await uploadWebFile(file, storagePath, uploadOptions);
          onChange(result.downloadURL);
        }
      } catch (err) {
        if (__DEV__) console.error('Drop upload failed:', err);
      }
    },
    [
      isGallery,
      maxItems,
      currentValues,
      uploadWebFile,
      storagePath,
      uploadOptions,
      onChange,
      clearError,
    ],
  );

  /**
   * Handle web file input change (fallback for drag-and-drop).
   */
  const handleWebFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      try {
        clearError();

        if (isGallery) {
          const remainingSlots = maxItems - currentValues.length;
          const filesToUpload = files.slice(0, remainingSlots);

          for (const file of filesToUpload) {
            const result = await uploadWebFile(file, storagePath, uploadOptions);
            onChange([...currentValues, result.downloadURL]);
          }
        } else {
          const file = files[0];
          const result = await uploadWebFile(file, storagePath, uploadOptions);
          onChange(result.downloadURL);
        }
      } catch (err) {
        if (__DEV__) console.error('File input upload failed:', err);
      }

      // Reset input so the same file can be selected again
      if (e.target) e.target.value = '';
    },
    [isGallery, maxItems, currentValues, uploadWebFile, storagePath, uploadOptions, onChange, clearError],
  );

  // ---------------------------------------------------------------------------
  // Native Handlers
  // ---------------------------------------------------------------------------

  const handleUploadComplete = useCallback(
    (url: string) => {
      if (isGallery) {
        onChange([...currentValues, url]);
      } else {
        onChange(url);
      }

      // Trigger AI tagging asynchronously (Requirement 7.10)
      if (!isVideo) {
        requestAITags(url).then((tags) => {
          if (tags.length > 0) {
            setAiTags((prev) => [...new Set([...prev, ...tags])]);
          }
        });
      }
    },
    [isGallery, isVideo, currentValues, onChange, requestAITags],
  );

  const handlePickImage = useCallback(async () => {
    try {
      clearError();
      const result = await pickImage(uploadOptions);

      if (!result.canceled && result.assets?.[0]) {
        if (showCropTool && !isVideo && (type === 'logo' || type === 'hero')) {
          setSelectedImageForCrop(result.assets[0].uri);
          setShowCropModal(true);
        } else {
          const uploadResult = await uploadImage(result, storagePath, uploadOptions);
          handleUploadComplete(uploadResult.downloadURL);
        }
      }
    } catch (err) {
      if (__DEV__) console.error('Pick image failed:', err);
    }
  }, [pickImage, uploadImage, storagePath, uploadOptions, showCropTool, type, isVideo, clearError, handleUploadComplete]);

  const handleTakePhoto = useCallback(async () => {
    try {
      clearError();
      const result = await takePhoto(uploadOptions);

      if (!result.canceled && result.assets?.[0]) {
        if (showCropTool && (type === 'logo' || type === 'hero')) {
          setSelectedImageForCrop(result.assets[0].uri);
          setShowCropModal(true);
        } else {
          const uploadResult = await uploadImage(result, storagePath, uploadOptions);
          handleUploadComplete(uploadResult.downloadURL);
        }
      }
    } catch (err) {
      if (__DEV__) console.error('Take photo failed:', err);
    }
  }, [takePhoto, uploadImage, storagePath, uploadOptions, showCropTool, type, clearError, handleUploadComplete]);

  // Handle cropped image
  const handleCropComplete = useCallback(
    async (croppedUri: string) => {
      setShowCropModal(false);
      setSelectedImageForCrop(null);

      try {
        const pickerResult: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: croppedUri,
              width: 0,
              height: 0,
              assetId: undefined,
              fileName: undefined,
              fileSize: undefined,
              type: 'image',
              exif: undefined,
              base64: undefined,
              duration: undefined,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const uploadResult = await uploadImage(pickerResult, storagePath, uploadOptions);
        handleUploadComplete(uploadResult.downloadURL);
      } catch (err) {
        if (__DEV__) console.error('Upload cropped image failed:', err);
      }
    },
    [uploadImage, storagePath, uploadOptions, handleUploadComplete],
  );

  /**
   * Handle background removal for logo images (Requirement 7.5).
   */
  const handleRemoveBackground = useCallback(
    async (url: string) => {
      setIsRemovingBg(true);
      try {
        const processedUrl = await removeBackground(url, storagePath);
        if (processedUrl) {
          onChange(processedUrl);
        }
      } finally {
        setIsRemovingBg(false);
      }
    },
    [removeBackground, storagePath, onChange],
  );

  const handleDelete = useCallback(
    async (url: string) => {
      try {
        await deleteImage(url);

        if (isGallery) {
          onChange(currentValues.filter((v) => v !== url));
        } else {
          onChange('');
        }
      } catch (err) {
        if (__DEV__) console.error('Delete image failed:', err);
      }
    },
    [deleteImage, isGallery, currentValues, onChange],
  );

  // Handle gallery reordering
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!isGallery) return;

      const newValues = [...currentValues];
      const [removed] = newValues.splice(fromIndex, 1);
      newValues.splice(toIndex, 0, removed);
      onChange(newValues);
    },
    [isGallery, currentValues, onChange],
  );

  // ---------------------------------------------------------------------------
  // Trigger upload (platform-aware)
  // ---------------------------------------------------------------------------

  const triggerUpload = useCallback(() => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      handlePickImage();
    }
  }, [handlePickImage]);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const getAcceptAttribute = (): string => {
    if (isVideo) return 'video/mp4,video/webm';
    return 'image/jpeg,image/png';
  };

  const renderUploadButton = () => {
    const buttonLabel = isGallery
      ? `Add ${currentValues.length > 0 ? 'More ' : ''}Images`
      : isVideo
        ? 'Upload Video'
        : `Upload ${type === 'logo' ? 'Logo' : 'Image'}`;

    const hintText =
      hint ||
      (type === 'logo'
        ? 'Square image, 400×400px minimum. JPEG or PNG, 10MB max.'
        : type === 'hero'
          ? 'Wide image (16:9 or 21:9). JPEG or PNG, 10MB max.'
          : isVideo
            ? 'MP4 or WebM, 3 minutes max, 100MB max.'
            : isGallery
              ? `Up to ${maxItems} images. JPEG or PNG, 10MB each.`
              : 'JPEG or PNG, 10MB max.');

    // Web drag-and-drop wrapper props
    const webDragProps =
      Platform.OS === 'web'
        ? {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
          }
        : {};

    return (
      <Pressable
        onPress={triggerUpload}
        disabled={uploading}
        style={({ pressed }) => [
          styles.uploadButton,
          {
            backgroundColor: isDragOver ? `${CultureTokens.indigo}10` : colors.card,
            borderColor: isDragOver
              ? CultureTokens.indigo
              : error
                ? colors.error
                : colors.borderLight,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={mediaUploadLabel(type, {
          hasFile: false,
          progress: uploading ? progress : undefined,
        })}
        accessibilityHint={`Tap to select ${isVideo ? 'a video' : 'an image'} from your device`}
        accessibilityState={{ disabled: uploading }}
        {...webDragProps}
      >
        <View style={styles.uploadButtonContent}>
          {uploading ? (
            <>
              <ActivityIndicator color={CultureTokens.indigo} />
              <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                Uploading... {Math.round(progress)}%
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progress}%`,
                      backgroundColor: CultureTokens.indigo,
                    },
                  ]}
                />
              </View>
            </>
          ) : (
            <>
              <Ionicons
                name={isVideo ? 'videocam-outline' : 'cloud-upload-outline'}
                size={32}
                color={isDragOver ? CultureTokens.indigo : CultureTokens.indigo}
              />
              <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                {isDragOver ? 'Drop file here' : buttonLabel}
              </Text>
              <Text style={[styles.uploadButtonHint, { color: colors.textSecondary }]}>
                {Platform.OS === 'web'
                  ? `Drag & drop or click to browse. ${hintText}`
                  : hintText}
              </Text>
            </>
          )}
        </View>

        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept={getAcceptAttribute()}
            multiple={isGallery}
            onChange={handleWebFileChange as unknown as React.ChangeEventHandler<HTMLInputElement>}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        )}
      </Pressable>
    );
  };

  const renderImagePreview = (url: string, index?: number) => {
    const isFirst = index === 0;
    const isLast = index === currentValues.length - 1;
    const showReorderButtons = isGallery && currentValues.length > 1;

    return (
      <View
        key={url}
        style={[
          styles.previewContainer,
          isGallery && styles.galleryPreviewContainer,
        ]}
      >
        <Image
          source={{ uri: url }}
          style={[
            styles.previewImage,
            type === 'logo' && styles.logoPreview,
            type === 'hero' && styles.heroPreview,
            isGallery && styles.galleryPreview,
          ]}
          contentFit={type === 'logo' ? 'contain' : 'cover'}
          accessibilityLabel={`${type === 'logo' ? 'Logo' : type === 'hero' ? 'Hero' : `Gallery image ${(index ?? 0) + 1} of ${currentValues.length}`} preview`}
        />

        {/* Actions overlay */}
        <View style={styles.previewActions}>
          <View style={styles.previewTopRow}>
            {isGallery && isFirst && (
              <View style={[styles.primaryBadge, { backgroundColor: CultureTokens.teal }]}>
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            )}

            {/* Reorder buttons for gallery items */}
            {showReorderButtons && (
              <View style={styles.reorderButtons}>
                {!isFirst && (
                  <Pressable
                    onPress={() => handleReorder(index!, index! - 1)}
                    style={[styles.reorderButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Move image ${(index ?? 0) + 1} earlier in gallery`}
                  >
                    <Ionicons name="chevron-back" size={14} color="#FFFFFF" />
                  </Pressable>
                )}
                {!isLast && (
                  <Pressable
                    onPress={() => handleReorder(index!, index! + 1)}
                    style={[styles.reorderButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Move image ${(index ?? 0) + 1} later in gallery`}
                  >
                    <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {/* Background removal button for logos (Requirement 7.5) */}
            {showBackgroundRemoval && type === 'logo' && !isRemovingBg && (
              <Pressable
                onPress={() => handleRemoveBackground(url)}
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove background from logo"
              >
                <Ionicons name="cut-outline" size={16} color={CultureTokens.violet} />
              </Pressable>
            )}

            <Pressable
              onPress={triggerUpload}
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Replace image"
            >
              <Ionicons name="pencil" size={16} color={colors.text} />
            </Pressable>

            <Pressable
              onPress={() => handleDelete(url)}
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete image"
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderVideoPreview = (url: string) => {
    return (
      <View style={styles.previewContainer}>
        <View style={[styles.videoPreview, { backgroundColor: colors.card }]}>
          <Ionicons name="videocam" size={48} color={CultureTokens.indigo} />
          <Text style={[styles.videoPreviewText, { color: colors.text }]}>
            Video uploaded
          </Text>
          <Text
            style={[styles.videoPreviewUrl, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {url.split('/').pop()}
          </Text>
        </View>

        {/* Actions overlay */}
        <View style={[styles.previewActions, styles.videoActions]}>
          <View style={styles.actionButtons}>
            <Pressable
              onPress={triggerUpload}
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Replace video"
            >
              <Ionicons name="pencil" size={16} color={colors.text} />
            </Pressable>

            <Pressable
              onPress={() => handleDelete(url)}
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete video"
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderGallery = () => {
    return (
      <View style={styles.galleryGrid}>
        {currentValues.map((url, index) => renderImagePreview(url, index))}
        {canAddMore && (
          <Pressable
            onPress={triggerUpload}
            disabled={uploading}
            style={[
              styles.galleryAddButton,
              { backgroundColor: colors.card, borderColor: colors.borderLight },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Add image to gallery. ${currentValues.length} of ${maxItems} images added.`}
            accessibilityState={{ disabled: uploading }}
          >
            <Ionicons name="add" size={32} color={CultureTokens.indigo} />
            <Text style={[styles.galleryAddText, { color: colors.textSecondary }]}>
              Add More Images ({currentValues.length}/{maxItems})
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {/* Upload area or preview */}
      {hasValue && isVideo ? (
        renderVideoPreview(currentValues[0])
      ) : hasValue && !isGallery ? (
        renderImagePreview(currentValues[0])
      ) : isGallery && hasValue ? (
        renderGallery()
      ) : (
        renderUploadButton()
      )}

      {/* Gallery with no items shows upload button */}
      {isGallery && !hasValue && renderUploadButton()}

      {/* Error message */}
      {(error || uploadError) && (
        <View
          style={styles.errorContainer}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Error: ${error || uploadError}`}
        >
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || uploadError}
          </Text>
        </View>
      )}

      {/* AI Tags Display (Requirement 7.10) */}
      {aiTags.length > 0 && (
        <View style={styles.aiTagsContainer} accessibilityLabel={`AI-generated tags: ${aiTags.join(', ')}`}>
          <View style={styles.aiTagsHeader}>
            <Ionicons name="sparkles" size={14} color={CultureTokens.violet} />
            <Text style={[styles.aiTagsLabel, { color: colors.textSecondary }]}>
              AI Tags
            </Text>
          </View>
          <View style={styles.aiTagsList}>
            {aiTags.slice(0, 8).map((tag) => (
              <View
                key={tag}
                style={[styles.aiTag, { backgroundColor: `${CultureTokens.violet}15` }]}
              >
                <Text style={[styles.aiTagText, { color: CultureTokens.violet }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Background removal in progress */}
      {isRemovingBg && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color={CultureTokens.violet} />
          <Text style={[styles.processingText, { color: colors.textSecondary }]}>
            Removing background...
          </Text>
        </View>
      )}

      {/* Hint (only when no value and no error) */}
      {hint && !error && !uploadError && !hasValue && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
      )}

      {/* Crop Modal */}
      {showCropModal && selectedImageForCrop && (
        <ImageCropModal
          visible={showCropModal}
          imageUri={selectedImageForCrop}
          aspectRatio={aspectRatio || (type === 'logo' ? 1 : 16 / 9)}
          onCrop={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false);
            setSelectedImageForCrop(null);
          }}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  uploadButton: {
    minHeight: 160,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  uploadButtonContent: {
    alignItems: 'center',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  uploadButtonHint: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    maxWidth: 280,
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  logoPreview: {
    height: 200,
    aspectRatio: 1,
  },
  heroPreview: {
    height: 200,
    aspectRatio: 16 / 9,
  },
  galleryPreview: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    height: 160,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoPreviewText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  videoPreviewUrl: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    maxWidth: '80%',
  },
  videoActions: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  previewActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: Spacing.sm,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  galleryPreviewContainer: {
    width: '48%',
    aspectRatio: 1,
  },
  galleryAddButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  galleryAddText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },
  aiTagsContainer: {
    gap: 6,
  },
  aiTagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiTagsLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  aiTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  aiTagText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  processingText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
});

export { MediaUploadField };
export default MediaUploadField;
