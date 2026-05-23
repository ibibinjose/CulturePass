import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Accepted image MIME types */
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

/** Accepted video MIME types */
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

/** Maximum video duration in seconds (3 minutes) */
const MAX_VIDEO_DURATION_SECONDS = 180;

/** Maximum video file size in bytes (100 MB) */
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

/** Maximum image file size in bytes (10 MB) */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaUploadOptions {
  type: 'logo' | 'hero' | 'gallery' | 'video';
  aspectRatio?: number;
  minDimensions?: { width: number; height: number };
  maxSize?: number; // bytes
  compress?: number; // 0-1
}

export interface UploadResult {
  downloadURL: string;
  width?: number;
  height?: number;
  duration?: number; // seconds, for video
  thumbhash?: string; // Automatically populated via Cloud Functions post-upload
  aiTags?: string[]; // AI-generated tags for searchability (populated async)
}

export interface MediaUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
}

export interface WebFileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a local URI to a Blob for Firebase uploadBytesResumable.
 * fetch(file://) works on both iOS and Android via the React Native bridge.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((r) => r.blob());
}

/**
 * Get the MIME type from a file extension or URI.
 */
function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}


// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * HostSpace Media Upload Hook
 *
 * Specialized hook for uploading profile media (logos, hero images, gallery, videos)
 * with validation, compression, and progress tracking.
 *
 * Features:
 * - Type-specific validation (logo: square 400×400 min, hero: 16:9 or 21:9)
 * - Image format validation (JPEG, PNG only, 10MB max)
 * - Video format validation (MP4, WebM only, 3 min max, 100MB max)
 * - Client-side compression to save bandwidth
 * - Progress tracking for large uploads
 * - Automatic cleanup of old files
 * - Support for drag-and-drop (web) and camera/gallery (native)
 * - Web File API support for drag-and-drop uploads
 */
export function useMediaUpload() {
  const [state, setState] = useState<MediaUploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  // -------------------------------------------------------------------------
  // Permissions
  // -------------------------------------------------------------------------

  const requestPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required');
    }
  }, []);

  // -------------------------------------------------------------------------
  // Pickers
  // -------------------------------------------------------------------------

  /**
   * Pick an image from the gallery.
   */
  const pickImage = useCallback(
    async (options?: MediaUploadOptions): Promise<ImagePicker.ImagePickerResult> => {
      await requestPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          options?.type === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.type === 'logo',
        aspect: options?.aspectRatio ? [options.aspectRatio, 1] : undefined,
        quality: 1, // We compress manually
        allowsMultipleSelection: options?.type === 'gallery',
      });

      return result;
    },
    [requestPermissions],
  );

  /**
   * Take a photo with the camera.
   */
  const takePhoto = useCallback(
    async (options?: MediaUploadOptions): Promise<ImagePicker.ImagePickerResult> => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access camera is required');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.type === 'logo',
        aspect: options?.aspectRatio ? [options.aspectRatio, 1] : undefined,
        quality: 1,
      });

      return result;
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  /**
   * Validate image dimensions, aspect ratio, format, and size.
   */
  const validateImage = useCallback(
    (
      asset: ImagePicker.ImagePickerAsset,
      options?: MediaUploadOptions,
    ): { valid: boolean; error?: string } => {
      // Check image format (JPEG/PNG only)
      if (asset.mimeType && !ACCEPTED_IMAGE_TYPES.includes(asset.mimeType)) {
        return {
          valid: false,
          error: `Only JPEG and PNG images are accepted. Got: ${asset.mimeType}`,
        };
      }

      // Check minimum dimensions
      if (options?.minDimensions) {
        const { width, height } = options.minDimensions;
        if (asset.width < width || asset.height < height) {
          return {
            valid: false,
            error: `Image must be at least ${width}×${height} pixels. Current: ${asset.width}×${asset.height}`,
          };
        }
      }

      // Check aspect ratio for logos (must be square)
      if (options?.type === 'logo') {
        const aspectRatio = asset.width / asset.height;
        if (Math.abs(aspectRatio - 1) > 0.1) {
          return {
            valid: false,
            error: 'Logo must be square (1:1 aspect ratio)',
          };
        }
      }

      // Check aspect ratio for hero images (16:9 or 21:9)
      if (options?.type === 'hero') {
        const aspectRatio = asset.width / asset.height;
        if (aspectRatio < 1.5 || aspectRatio > 2.5) {
          return {
            valid: false,
            error: 'Hero image must have a wide aspect ratio (16:9 or 21:9)',
          };
        }
      }

      // Check file size (default 10MB for images)
      const maxSize = options?.maxSize ?? MAX_IMAGE_SIZE_BYTES;
      if (asset.fileSize && asset.fileSize > maxSize) {
        const maxMB = (maxSize / 1024 / 1024).toFixed(1);
        const currentMB = (asset.fileSize / 1024 / 1024).toFixed(1);
        return {
          valid: false,
          error: `File size must be less than ${maxMB}MB. Current: ${currentMB}MB`,
        };
      }

      return { valid: true };
    },
    [],
  );

  /**
   * Validate video file: format (MP4/WebM), duration (3 min max), size (100MB max).
   */
  const validateVideo = useCallback(
    (asset: ImagePicker.ImagePickerAsset): VideoValidationResult => {
      // Check video format
      if (asset.mimeType && !ACCEPTED_VIDEO_TYPES.includes(asset.mimeType)) {
        return {
          valid: false,
          error: `Only MP4 and WebM videos are accepted. Got: ${asset.mimeType}`,
        };
      }

      // Check duration (3 minutes max)
      if (asset.duration) {
        const durationSeconds = asset.duration / 1000; // expo-image-picker returns ms
        if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
          const minutes = Math.floor(durationSeconds / 60);
          const seconds = Math.round(durationSeconds % 60);
          return {
            valid: false,
            error: `Video must be 3 minutes or less. Current: ${minutes}m ${seconds}s`,
            duration: durationSeconds,
          };
        }
      }

      // Check file size (100MB max)
      const maxSize = MAX_VIDEO_SIZE_BYTES;
      if (asset.fileSize && asset.fileSize > maxSize) {
        const maxMB = (maxSize / 1024 / 1024).toFixed(0);
        const currentMB = (asset.fileSize / 1024 / 1024).toFixed(1);
        return {
          valid: false,
          error: `Video must be less than ${maxMB}MB. Current: ${currentMB}MB`,
        };
      }

      return { valid: true, duration: asset.duration ? asset.duration / 1000 : undefined };
    },
    [],
  );

  /**
   * Validate a web File object (for drag-and-drop uploads).
   */
  const validateWebFile = useCallback(
    (file: File, options?: MediaUploadOptions): WebFileValidationResult => {
      const isVideo = options?.type === 'video';
      const acceptedTypes = isVideo ? ACCEPTED_VIDEO_TYPES : ACCEPTED_IMAGE_TYPES;

      // Check MIME type
      if (!acceptedTypes.includes(file.type)) {
        const accepted = isVideo ? 'MP4, WebM' : 'JPEG, PNG';
        return {
          valid: false,
          error: `Only ${accepted} files are accepted. Got: ${file.type || 'unknown'}`,
        };
      }

      // Check file size
      const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : (options?.maxSize ?? MAX_IMAGE_SIZE_BYTES);
      if (file.size > maxSize) {
        const maxMB = (maxSize / 1024 / 1024).toFixed(0);
        const currentMB = (file.size / 1024 / 1024).toFixed(1);
        return {
          valid: false,
          error: `File must be less than ${maxMB}MB. Current: ${currentMB}MB`,
        };
      }

      return { valid: true, file };
    },
    [],
  );


  // -------------------------------------------------------------------------
  // Compression
  // -------------------------------------------------------------------------

  /**
   * Compress and optimize image based on type.
   */
  const compressImage = useCallback(
    async (uri: string, options?: MediaUploadOptions): Promise<ImageManipulator.ImageResult> => {
      const actions: ImageManipulator.Action[] = [];

      // Resize based on type
      if (options?.type === 'logo') {
        actions.push({ resize: { width: 400, height: 400 } });
      } else if (options?.type === 'hero') {
        actions.push({ resize: { width: 1920 } }); // Max width, preserve aspect
      } else if (options?.type === 'gallery') {
        actions.push({ resize: { width: 1200 } });
      }

      const compress = options?.compress ?? 0.8;

      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return result;
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Upload
  // -------------------------------------------------------------------------

  /**
   * Upload image to Firebase Storage with validation and compression.
   */
  const uploadImage = useCallback(
    async (
      pickerResult: ImagePicker.ImagePickerResult,
      storagePath: string,
      options?: MediaUploadOptions,
    ): Promise<UploadResult> => {
      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        throw new Error('No image selected');
      }

      setState({ uploading: true, progress: 0, error: null });

      if (!storage) {
        setState({ uploading: false, progress: 0, error: 'Storage not configured' });
        throw new Error('Firebase Storage is not configured');
      }

      try {
        const asset = pickerResult.assets[0];
        const isVideo = options?.type === 'video';

        // Validate based on type
        if (isVideo) {
          const videoValidation = validateVideo(asset);
          if (!videoValidation.valid) {
            throw new Error(videoValidation.error);
          }
        } else {
          const imageValidation = validateImage(asset, options);
          if (!imageValidation.valid) {
            throw new Error(imageValidation.error);
          }
        }

        // Compress image (skip for video)
        let blobUri = asset.uri;
        let resultWidth = asset.width;
        let resultHeight = asset.height;

        if (!isVideo) {
          const compressed = await compressImage(asset.uri, options);
          blobUri = compressed.uri;
          resultWidth = compressed.width;
          resultHeight = compressed.height;
        }

        // Convert to blob
        const blob = await uriToBlob(blobUri);

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const mimeType = isVideo ? getMimeType(asset.uri) : 'image/jpeg';
        const extension = isVideo
          ? (asset.uri.endsWith('.webm') ? 'webm' : 'mp4')
          : 'jpg';
        const fileName = `${timestamp}-${randomId}.${extension}`;
        const fullPath = `${storagePath}/${fileName}`;

        // Upload to Firebase Storage
        const storageRef = ref(storage, fullPath);
        const uploadTask = uploadBytesResumable(storageRef, blob, {
          contentType: mimeType,
        });

        // Track progress
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const currentProgress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setState((prev) => ({ ...prev, progress: currentProgress }));
            },
            (error) => {
              setState({ uploading: false, progress: 0, error: error.message });
              reject(error);
            },
            () => resolve(),
          );
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        setState({ uploading: false, progress: 100, error: null });

        return {
          downloadURL,
          width: resultWidth,
          height: resultHeight,
          duration: isVideo && asset.duration ? asset.duration / 1000 : undefined,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState({ uploading: false, progress: 0, error: errorMessage });
        throw error;
      }
    },
    [validateImage, validateVideo, compressImage],
  );

  /**
   * Upload a web File object (from drag-and-drop or file input).
   * Only available on web platform.
   */
  const uploadWebFile = useCallback(
    async (
      file: File,
      storagePath: string,
      options?: MediaUploadOptions,
    ): Promise<UploadResult> => {
      setState({ uploading: true, progress: 0, error: null });

      if (!storage) {
        setState({ uploading: false, progress: 0, error: 'Storage not configured' });
        throw new Error('Firebase Storage is not configured');
      }

      try {
        // Validate file
        const validation = validateWebFile(file, options);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileName = `${timestamp}-${randomId}.${extension}`;
        const fullPath = `${storagePath}/${fileName}`;

        // Upload to Firebase Storage
        const storageRef = ref(storage, fullPath);
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
        });

        // Track progress
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const currentProgress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setState((prev) => ({ ...prev, progress: currentProgress }));
            },
            (error) => {
              setState({ uploading: false, progress: 0, error: error.message });
              reject(error);
            },
            () => resolve(),
          );
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        setState({ uploading: false, progress: 100, error: null });

        return { downloadURL };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState({ uploading: false, progress: 0, error: errorMessage });
        throw error;
      }
    },
    [validateWebFile],
  );

  /**
   * Upload multiple images (for gallery).
   */
  const uploadMultipleImages = useCallback(
    async (
      pickerResults: ImagePicker.ImagePickerResult[],
      storagePath: string,
      options?: MediaUploadOptions,
    ): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];

      for (const result of pickerResults) {
        try {
          const uploadResult = await uploadImage(result, storagePath, options);
          results.push(uploadResult);
        } catch (error) {
          if (__DEV__) console.error('Failed to upload image:', error);
          // Continue with other images
        }
      }

      return results;
    },
    [uploadImage],
  );

  /**
   * Delete image from Firebase Storage.
   */
  const deleteImage = useCallback(async (url: string): Promise<void> => {
    if (!url || !storage) return;

    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('Failed to delete image:', error);
      // Don't throw - deletion failures are non-critical
    }
  }, []);

  /**
   * Request AI tagging for an uploaded image.
   * Sends the image URL to the backend AI service which returns
   * descriptive tags for searchability (Requirement 7.10).
   *
   * Tags are generated asynchronously and returned to the caller.
   * The caller can store them alongside the image URL.
   */
  const requestAITags = useCallback(
    async (imageUrl: string): Promise<string[]> => {
      try {
        // AI tagging is handled server-side via Cloud Functions trigger
        // on image upload (triggers/onImageUpload.ts). This function
        // provides a manual fallback for re-tagging or when the trigger
        // hasn't fired yet.
        const response = await fetch('/api/media/ai-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) {
          if (__DEV__) console.warn('AI tagging request failed:', response.status);
          return [];
        }

        const data = await response.json();
        return data.tags ?? [];
      } catch (error) {
        // AI tagging is non-critical; log and return empty
        if (__DEV__) console.warn('AI tagging unavailable:', error);
        return [];
      }
    },
    [],
  );

  /**
   * Request background removal for a logo image (Requirement 7.5).
   * Sends the image URL to the backend service which returns a new URL
   * with the background removed.
   *
   * Returns the new image URL with transparent background, or null if
   * the service is unavailable.
   */
  const removeBackground = useCallback(
    async (imageUrl: string, storagePath: string): Promise<string | null> => {
      setState((prev) => ({ ...prev, uploading: true, progress: 0, error: null }));

      try {
        const response = await fetch('/api/media/remove-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, storagePath }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Background removal failed');
          throw new Error(errorText);
        }

        const data = await response.json();
        setState({ uploading: false, progress: 100, error: null });
        return data.processedUrl ?? null;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Background removal failed';
        setState({ uploading: false, progress: 0, error: errorMessage });
        if (__DEV__) console.warn('Background removal failed:', error);
        return null;
      }
    },
    [],
  );

  /**
   * Clear error state.
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,

    // Methods
    pickImage,
    takePhoto,
    uploadImage,
    uploadWebFile,
    uploadMultipleImages,
    deleteImage,
    validateImage,
    validateVideo,
    validateWebFile,
    compressImage,
    requestAITags,
    removeBackground,
    clearError,
  };
}
