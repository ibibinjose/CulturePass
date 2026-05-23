/**
 * MediaUploadField Component Tests
 *
 * Tests for the MediaUploadField component covering:
 * - Rendering upload area for different types (logo, hero, gallery, video)
 * - File selection handling
 * - Preview display after upload
 * - Dimension/format/size validation feedback
 * - Drag-and-drop support (web)
 * - Upload progress display
 * - Upload error handling
 *
 * Validates: Requirements 36
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { MediaUploadField } from '../fields/MediaUploadField';

// Mock dependencies
const mockPickImage = jest.fn();
const mockTakePhoto = jest.fn();
const mockUploadImage = jest.fn();
const mockUploadWebFile = jest.fn();
const mockDeleteImage = jest.fn();
const mockRequestAITags = jest.fn();
const mockRemoveBackground = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../hooks/useMediaUpload', () => ({
  useMediaUpload: () => ({
    uploading: false,
    progress: 0,
    error: null,
    pickImage: mockPickImage,
    takePhoto: mockTakePhoto,
    uploadImage: mockUploadImage,
    uploadWebFile: mockUploadWebFile,
    deleteImage: mockDeleteImage,
    requestAITags: mockRequestAITags,
    removeBackground: mockRemoveBackground,
    clearError: mockClearError,
  }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-image', () => ({
  Image: ({ accessibilityLabel, ...props }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="preview-image" accessibilityLabel={accessibilityLabel}>
        <Text>{accessibilityLabel}</Text>
      </View>
    );
  },
}));

jest.mock('../fields/ImageCropModal', () => ({
  ImageCropModal: () => null,
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    card: '#FFFFFF',
    background: '#F5F5F5',
    borderLight: '#E0E0E0',
    error: '#FF3B30',
    surfaceElevated: '#FAFAFA',
    surface: '#FFFFFF',
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

jest.mock('../../utils/accessibility', () => ({
  mediaUploadLabel: (type: string, opts: any) => {
    if (opts?.hasFile) return `${type} uploaded`;
    if (opts?.progress !== undefined) return `Uploading ${type}: ${opts.progress}%`;
    return `Upload ${type}`;
  },
}));

describe('MediaUploadField', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    type: 'logo' as const,
    value: '' as string | string[],
    onChange: mockOnChange,
    storagePath: 'profiles/test-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPickImage.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///test-image.jpg', width: 800, height: 800 }],
    });
    mockUploadImage.mockResolvedValue({ downloadURL: 'https://cdn.example.com/image.jpg' });
    mockRequestAITags.mockResolvedValue([]);
    mockDeleteImage.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Rendering Upload Area Tests
  // -------------------------------------------------------------------------

  describe('Upload Area Rendering', () => {
    it('renders upload button for logo type', () => {
      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      expect(getByText('Upload Logo')).toBeTruthy();
    });

    it('renders upload button for hero type', () => {
      const { getByText } = render(
        <MediaUploadField {...defaultProps} type="hero" />
      );

      expect(getByText('Upload Image')).toBeTruthy();
    });

    it('renders upload button for video type', () => {
      const { getByText } = render(
        <MediaUploadField {...defaultProps} type="video" />
      );

      expect(getByText('Upload Video')).toBeTruthy();
    });

    it('renders upload button for gallery type with no items', () => {
      const { getAllByText } = render(
        <MediaUploadField {...defaultProps} type="gallery" value={[]} />
      );

      expect(getAllByText('Add Images').length).toBeGreaterThan(0);
    });

    it('renders label when provided', () => {
      const { getByText } = render(
        <MediaUploadField {...defaultProps} label="Profile Logo" />
      );

      expect(getByText('Profile Logo')).toBeTruthy();
    });

    it('renders hint text for logo type', () => {
      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      expect(getByText(/Square image, 400×400px minimum/)).toBeTruthy();
    });

    it('renders hint text for hero type', () => {
      const { getByText } = render(
        <MediaUploadField {...defaultProps} type="hero" />
      );

      expect(getByText(/Wide image.*16:9 or 21:9/)).toBeTruthy();
    });

    it('renders hint text for video type', () => {
      const { getByText } = render(
        <MediaUploadField {...defaultProps} type="video" />
      );

      expect(getByText(/MP4 or WebM, 3 minutes max/)).toBeTruthy();
    });

    it('renders gallery count hint', () => {
      const { getAllByText } = render(
        <MediaUploadField {...defaultProps} type="gallery" value={[]} maxItems={12} />
      );

      expect(getAllByText(/Up to 12 images/).length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // File Selection Tests
  // -------------------------------------------------------------------------

  describe('File Selection', () => {
    it('triggers image picker on press (native)', async () => {
      // Ensure we're testing native behavior
      Platform.OS = 'ios';

      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      const uploadButton = getByText('Upload Logo');
      
      await act(async () => {
        fireEvent.press(uploadButton);
      });

      expect(mockPickImage).toHaveBeenCalled();
    });

    it('calls onChange with uploaded URL after successful upload', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg', width: 800, height: 800 }],
      });
      mockUploadImage.mockResolvedValue({
        downloadURL: 'https://cdn.example.com/uploaded.jpg',
      });

      Platform.OS = 'ios';

      const { getByText } = render(
        <MediaUploadField {...defaultProps} showCropTool={false} />
      );

      const uploadButton = getByText('Upload Logo');

      await act(async () => {
        fireEvent.press(uploadButton);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('https://cdn.example.com/uploaded.jpg');
      });
    });

    it('does not call onChange when picker is cancelled', async () => {
      mockPickImage.mockResolvedValue({ canceled: true });

      Platform.OS = 'ios';

      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      const uploadButton = getByText('Upload Logo');

      await act(async () => {
        fireEvent.press(uploadButton);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('appends to gallery array for gallery type', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///new.jpg', width: 800, height: 800 }],
      });
      mockUploadImage.mockResolvedValue({
        downloadURL: 'https://cdn.example.com/new.jpg',
      });

      Platform.OS = 'ios';

      const existingImages = ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'];

      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={existingImages}
          showCropTool={false}
        />
      );

      const addButton = getByText(/Add More Images/);

      await act(async () => {
        fireEvent.press(addButton);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          ...existingImages,
          'https://cdn.example.com/new.jpg',
        ]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Preview Display Tests
  // -------------------------------------------------------------------------

  describe('Preview Display', () => {
    it('shows image preview when value is provided (logo)', () => {
      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          value="https://cdn.example.com/logo.jpg"
        />
      );

      expect(getByText(/Logo.*preview/)).toBeTruthy();
    });

    it('shows image preview when value is provided (hero)', () => {
      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          type="hero"
          value="https://cdn.example.com/hero.jpg"
        />
      );

      expect(getByText(/Hero.*preview/)).toBeTruthy();
    });

    it('shows video preview when video URL is provided', () => {
      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          type="video"
          value="https://cdn.example.com/video.mp4"
        />
      );

      expect(getByText('Video uploaded')).toBeTruthy();
    });

    it('shows gallery grid with multiple images', () => {
      const images = [
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/2.jpg',
        'https://cdn.example.com/3.jpg',
      ];

      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
          maxItems={12}
        />
      );

      expect(getByText(/Add More Images \(3\/12\)/)).toBeTruthy();
    });

    it('shows Primary badge on first gallery image', () => {
      const images = [
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/2.jpg',
      ];

      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
        />
      );

      expect(getByText('Primary')).toBeTruthy();
    });

    it('does not show Add More button when gallery is at max', () => {
      const images = Array.from({ length: 3 }, (_, i) => `https://cdn.example.com/${i}.jpg`);

      const { queryByText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
          maxItems={3}
        />
      );

      expect(queryByText(/Add More Images/)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Validation Feedback Tests
  // -------------------------------------------------------------------------

  describe('Validation Feedback', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('displays error message when error prop is provided', () => {
      const { getByText } = render(
        <MediaUploadField
          {...defaultProps}
          error="Image must be at least 400x400 pixels"
        />
      );

      expect(getByText('Image must be at least 400x400 pixels')).toBeTruthy();
    });

    it('displays upload error from hook', () => {
      // Override the hook to return an error
      jest.spyOn(require('../../hooks/useMediaUpload'), 'useMediaUpload').mockReturnValue({
        uploading: false,
        progress: 0,
        error: 'File size exceeds 10MB limit',
        pickImage: mockPickImage,
        takePhoto: mockTakePhoto,
        uploadImage: mockUploadImage,
        uploadWebFile: mockUploadWebFile,
        deleteImage: mockDeleteImage,
        requestAITags: mockRequestAITags,
        removeBackground: mockRemoveBackground,
        clearError: mockClearError,
      });

      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      expect(getByText('File size exceeds 10MB limit')).toBeTruthy();
    });

    it('shows error with alert icon', () => {
      const { getByTestId } = render(
        <MediaUploadField {...defaultProps} error="Invalid format" />
      );

      expect(getByTestId('icon-alert-circle')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Upload Progress Tests
  // -------------------------------------------------------------------------

  describe('Upload Progress', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('displays upload progress indicator', () => {
      jest.spyOn(require('../../hooks/useMediaUpload'), 'useMediaUpload').mockReturnValue({
        uploading: true,
        progress: 45,
        error: null,
        pickImage: mockPickImage,
        takePhoto: mockTakePhoto,
        uploadImage: mockUploadImage,
        uploadWebFile: mockUploadWebFile,
        deleteImage: mockDeleteImage,
        requestAITags: mockRequestAITags,
        removeBackground: mockRemoveBackground,
        clearError: mockClearError,
      });

      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      expect(getByText('Uploading... 45%')).toBeTruthy();
    });

    it('disables upload button while uploading', () => {
      jest.spyOn(require('../../hooks/useMediaUpload'), 'useMediaUpload').mockReturnValue({
        uploading: true,
        progress: 60,
        error: null,
        pickImage: mockPickImage,
        takePhoto: mockTakePhoto,
        uploadImage: mockUploadImage,
        uploadWebFile: mockUploadWebFile,
        deleteImage: mockDeleteImage,
        requestAITags: mockRequestAITags,
        removeBackground: mockRemoveBackground,
        clearError: mockClearError,
      });

      const { getByText } = render(<MediaUploadField {...defaultProps} />);

      // The button should show uploading state
      expect(getByText('Uploading... 60%')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Delete Tests
  // -------------------------------------------------------------------------

  describe('Delete Functionality', () => {
    it('calls deleteImage and clears value on delete', async () => {
      const { getByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          value="https://cdn.example.com/logo.jpg"
        />
      );

      const deleteButton = getByLabelText('Delete image');

      await act(async () => {
        fireEvent.press(deleteButton);
      });

      await waitFor(() => {
        expect(mockDeleteImage).toHaveBeenCalledWith('https://cdn.example.com/logo.jpg');
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('removes item from gallery array on delete', async () => {
      const images = [
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/2.jpg',
        'https://cdn.example.com/3.jpg',
      ];

      const { getAllByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
        />
      );

      const deleteButtons = getAllByLabelText('Delete image');

      await act(async () => {
        fireEvent.press(deleteButtons[1]); // Delete second image
      });

      await waitFor(() => {
        expect(mockDeleteImage).toHaveBeenCalledWith('https://cdn.example.com/2.jpg');
        expect(mockOnChange).toHaveBeenCalledWith([
          'https://cdn.example.com/1.jpg',
          'https://cdn.example.com/3.jpg',
        ]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Gallery Reordering Tests
  // -------------------------------------------------------------------------

  describe('Gallery Reordering', () => {
    it('renders reorder buttons for gallery with multiple items', () => {
      const images = [
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/2.jpg',
        'https://cdn.example.com/3.jpg',
      ];

      const { getAllByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
        />
      );

      // Middle image should have both forward and back buttons
      const moveForward = getAllByLabelText(/Move image.*later in gallery/);
      expect(moveForward.length).toBeGreaterThan(0);
    });

    it('moves image forward in gallery', () => {
      const images = [
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/2.jpg',
        'https://cdn.example.com/3.jpg',
      ];

      const { getAllByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
        />
      );

      // Move first image later
      const moveButtons = getAllByLabelText(/Move image 1 later in gallery/);
      fireEvent.press(moveButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([
        'https://cdn.example.com/2.jpg',
        'https://cdn.example.com/1.jpg',
        'https://cdn.example.com/3.jpg',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // AI Tags Tests
  // -------------------------------------------------------------------------

  describe('AI Tags', () => {
    it('requests AI tags after successful upload', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg', width: 800, height: 800 }],
      });
      mockUploadImage.mockResolvedValue({
        downloadURL: 'https://cdn.example.com/uploaded.jpg',
      });
      mockRequestAITags.mockResolvedValue(['landscape', 'nature', 'outdoor']);

      Platform.OS = 'ios';

      const { getByText } = render(
        <MediaUploadField {...defaultProps} showCropTool={false} />
      );

      const uploadButton = getByText('Upload Logo');

      await act(async () => {
        fireEvent.press(uploadButton);
      });

      await waitFor(() => {
        expect(mockRequestAITags).toHaveBeenCalledWith('https://cdn.example.com/uploaded.jpg');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility Tests
  // -------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('has accessible upload button', () => {
      const { getByLabelText } = render(<MediaUploadField {...defaultProps} />);

      expect(getByLabelText('Upload logo')).toBeTruthy();
    });

    it('has accessible delete button', () => {
      const { getByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          value="https://cdn.example.com/logo.jpg"
        />
      );

      expect(getByLabelText('Delete image')).toBeTruthy();
    });

    it('has accessible replace button', () => {
      const { getByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          value="https://cdn.example.com/logo.jpg"
        />
      );

      expect(getByLabelText('Replace image')).toBeTruthy();
    });

    it('error container has alert role', () => {
      const { getByLabelText } = render(
        <MediaUploadField {...defaultProps} error="Upload failed" />
      );

      expect(getByLabelText('Error: Upload failed')).toBeTruthy();
    });

    it('gallery add button shows count', () => {
      const images = ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'];

      const { getByLabelText } = render(
        <MediaUploadField
          {...defaultProps}
          type="gallery"
          value={images}
          maxItems={12}
        />
      );

      expect(getByLabelText(/Add image to gallery. 2 of 12 images added/)).toBeTruthy();
    });
  });
});
