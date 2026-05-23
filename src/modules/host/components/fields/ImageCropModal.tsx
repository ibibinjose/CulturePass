import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  // eslint-disable-next-line no-restricted-imports
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  Radius,
  Spacing,
  FontFamily,
} from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for wide
  onCrop: (croppedUri: string) => void;
  onCancel: () => void;
}

interface CropRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * ImageCropModal
 *
 * Modal for cropping and adjusting images before upload.
 * Supports aspect ratio constraints and provides visual feedback.
 *
 * Features:
 * - Aspect ratio enforcement (square for logos, wide for hero images)
 * - Visual crop overlay with corner handles
 * - Zoom controls (slider + buttons)
 * - Real-time preview of crop area
 * - Cancel and confirm actions
 * - Responsive layout for mobile and desktop
 */
export function ImageCropModal({
  visible,
  imageUri,
  aspectRatio = 1,
  onCrop,
  onCancel,
}: ImageCropModalProps) {
  const colors = useColors();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [processing, setProcessing] = useState(false);
  const [zoom, setZoom] = useState(1); // 1 = fit, 2 = 2x zoom

  // Calculate initial crop region when image loads
  const handleImageLoad = useCallback(() => {
    RNImage.getSize(imageUri, (width: number, height: number) => {
      setImageSize({ width, height });

      // Calculate initial crop region centered on image
      const imageAspect = width / height;
      let cropWidth: number;
      let cropHeight: number;

      if (imageAspect > aspectRatio) {
        // Image is wider than target aspect ratio
        cropHeight = height;
        cropWidth = height * aspectRatio;
      } else {
        // Image is taller than target aspect ratio
        cropWidth = width;
        cropHeight = width / aspectRatio;
      }

      const originX = (width - cropWidth) / 2;
      const originY = (height - cropHeight) / 2;

      setCropRegion({
        originX,
        originY,
        width: cropWidth,
        height: cropHeight,
      });
    });
  }, [imageUri, aspectRatio]);

  // Perform the crop operation
  const handleCrop = useCallback(async () => {
    if (!cropRegion) return;

    setProcessing(true);

    try {
      // Apply zoom to crop region (zoom in = smaller crop area)
      const zoomedRegion: CropRegion = {
        originX: cropRegion.originX + (cropRegion.width * (1 - 1 / zoom)) / 2,
        originY: cropRegion.originY + (cropRegion.height * (1 - 1 / zoom)) / 2,
        width: cropRegion.width / zoom,
        height: cropRegion.height / zoom,
      };

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(Math.max(0, zoomedRegion.originX)),
              originY: Math.round(Math.max(0, zoomedRegion.originY)),
              width: Math.round(Math.min(zoomedRegion.width, imageSize.width)),
              height: Math.round(Math.min(zoomedRegion.height, imageSize.height)),
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
      );

      onCrop(result.uri);
    } catch (error) {
      if (__DEV__) console.error('Crop failed:', error);
    } finally {
      setProcessing(false);
    }
  }, [imageUri, cropRegion, zoom, imageSize, onCrop]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // Calculate display dimensions to fit screen
  const getDisplayDimensions = () => {
    const maxWidth = SCREEN_WIDTH - Spacing.xl * 2;
    const maxHeight = SCREEN_HEIGHT * 0.5;

    if (!imageSize.width || !imageSize.height) {
      return { width: maxWidth, height: maxHeight };
    }

    const imageAspect = imageSize.width / imageSize.height;
    let displayWidth = maxWidth;
    let displayHeight = maxWidth / imageAspect;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = maxHeight * imageAspect;
    }

    return { width: displayWidth, height: displayHeight };
  };

  const displayDimensions = getDisplayDimensions();

  // Calculate crop overlay position on screen
  const getCropOverlayStyle = () => {
    if (!cropRegion || !imageSize.width || !imageSize.height) {
      return {};
    }

    const scaleX = displayDimensions.width / imageSize.width;
    const scaleY = displayDimensions.height / imageSize.height;

    // Apply zoom to visual representation
    const zoomFactor = 1 / zoom;
    const visibleWidth = cropRegion.width * zoomFactor;
    const visibleHeight = cropRegion.height * zoomFactor;
    const visibleOriginX = cropRegion.originX + (cropRegion.width - visibleWidth) / 2;
    const visibleOriginY = cropRegion.originY + (cropRegion.height - visibleHeight) / 2;

    return {
      left: visibleOriginX * scaleX,
      top: visibleOriginY * scaleY,
      width: visibleWidth * scaleX,
      height: visibleHeight * scaleY,
    };
  };

  const getAspectRatioLabel = (): string => {
    if (aspectRatio === 1) return 'Square (1:1)';
    if (Math.abs(aspectRatio - 16 / 9) < 0.01) return 'Wide (16:9)';
    if (Math.abs(aspectRatio - 21 / 9) < 0.01) return 'Ultra-wide (21:9)';
    return `${aspectRatio.toFixed(2)}:1`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel crop"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Crop Image</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Image Preview with Crop Overlay */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: displayDimensions.width,
                  height: displayDimensions.height,
                },
              ]}
              onLoad={handleImageLoad}
              resizeMode="contain"
            />

            {/* Crop Overlay */}
            {cropRegion && (
              <>
                {/* Darkened areas outside crop */}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                  ]}
                  pointerEvents="none"
                />

                {/* Crop frame (clear area) */}
                <View
                  style={[
                    styles.cropFrame,
                    getCropOverlayStyle(),
                    { borderColor: CultureTokens.indigo },
                  ]}
                  pointerEvents="none"
                >
                  {/* Grid lines */}
                  <View style={styles.gridContainer}>
                    <View style={[styles.gridLineH, { top: '33%' }]} />
                    <View style={[styles.gridLineH, { top: '66%' }]} />
                    <View style={[styles.gridLineV, { left: '33%' }]} />
                    <View style={[styles.gridLineV, { left: '66%' }]} />
                  </View>

                  {/* Corner handles */}
                  <View style={[styles.cornerHandle, styles.topLeft]} />
                  <View style={[styles.cornerHandle, styles.topRight]} />
                  <View style={[styles.cornerHandle, styles.bottomLeft]} />
                  <View style={[styles.cornerHandle, styles.bottomRight]} />
                </View>
              </>
            )}
          </View>

          {/* Aspect Ratio & Zoom Info */}
          <View style={[styles.infoBar, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Ionicons name="crop-outline" size={16} color="#FFFFFF" />
            <Text style={[styles.infoText, { color: '#FFFFFF' }]}>
              {getAspectRatioLabel()}
            </Text>
            {zoom > 1 && (
              <Text style={[styles.zoomBadge, { color: CultureTokens.indigo }]}>
                {zoom.toFixed(2)}×
              </Text>
            )}
          </View>
        </View>

        {/* Zoom Controls */}
        <View style={[styles.zoomControls, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
          <Pressable
            onPress={handleZoomOut}
            disabled={zoom <= 1}
            style={[
              styles.zoomButton,
              { opacity: zoom <= 1 ? 0.4 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
          >
            <Ionicons name="remove-circle-outline" size={28} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleZoomReset}
            style={styles.zoomResetButton}
            accessibilityRole="button"
            accessibilityLabel="Reset zoom"
          >
            <Text style={styles.zoomResetText}>
              {Math.round(zoom * 100)}%
            </Text>
          </Pressable>

          <Pressable
            onPress={handleZoomIn}
            disabled={zoom >= 3}
            style={[
              styles.zoomButton,
              { opacity: zoom >= 3 ? 0.4 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
          >
            <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
          <Button
            variant="secondary"
            onPress={onCancel}
            style={styles.actionButton}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleCrop}
            style={styles.actionButton}
            loading={processing}
            disabled={!cropRegion}
          >
            Apply Crop
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    // Dimensions set dynamically
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  infoText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  zoomBadge: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    marginLeft: 8,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  zoomButton: {
    padding: 8,
  },
  zoomResetButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomResetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
