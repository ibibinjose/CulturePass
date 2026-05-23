import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MediaUploadField } from '../MediaUploadField';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('expo-image-picker');
jest.mock('expo-image', () => ({
  Image: 'Image',
}));
jest.mock('@/design-system/ui/Button', () => ({
  Button: ({ children, ...props }: any) => {
    const { Text, Pressable } = require('react-native');
    return <Pressable {...props}><Text>{children}</Text></Pressable>;
  },
}));
jest.mock('../ImageCropModal', () => ({
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
    error: '#FF5E5B',
    surfaceElevated: '#FFFFFF',
  }),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));
jest.mock('@/lib/firebase', () => ({
  storage: {},
}));
jest.mock('../../../utils/accessibility', () => ({
  mediaUploadLabel: jest.fn(() => 'Upload media'),
}));

describe('MediaUploadField', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    type: 'logo' as const,
    value: '',
    onChange: mockOnChange,
    storagePath: 'test/path',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  it('renders upload button when no value', () => {
    const { getByText } = render(<MediaUploadField {...defaultProps} />);
    expect(getByText('Upload Logo')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <MediaUploadField {...defaultProps} label="Profile Logo" />
    );
    expect(getByText('Profile Logo')).toBeTruthy();
  });

  it('renders with hint', () => {
    const { getAllByText } = render(
      <MediaUploadField {...defaultProps} hint="Minimum 400x400 pixels" />
    );
    expect(getAllByText('Minimum 400x400 pixels').length).toBeGreaterThan(0);
  });

  it('renders error message', () => {
    const { getByText } = render(
      <MediaUploadField {...defaultProps} error="Image is too small" />
    );
    expect(getByText('Image is too small')).toBeTruthy();
  });

  it('renders image preview when value is provided', () => {
    const { getByTestId } = render(
      <MediaUploadField
        {...defaultProps}
        value="https://example.com/image.jpg"
      />
    );
    // Image preview should be rendered
    expect(() => getByTestId('upload-button')).toThrow();
  });

  it('renders gallery grid for gallery type', () => {
    const { getByText } = render(
      <MediaUploadField
        {...defaultProps}
        type="gallery"
        value={['https://example.com/1.jpg', 'https://example.com/2.jpg']}
      />
    );
    expect(getByText(/Add More Images/)).toBeTruthy();
  });

  it('shows correct button text for video type', () => {
    const { getByText } = render(
      <MediaUploadField {...defaultProps} type="video" />
    );
    expect(getByText('Upload Video')).toBeTruthy();
  });

  it('shows correct button text for hero type', () => {
    const { getByText } = render(
      <MediaUploadField {...defaultProps} type="hero" />
    );
    expect(getByText('Upload Image')).toBeTruthy();
  });

  it('limits gallery items to maxItems', () => {
    const maxItems = 3;
    const { queryByText } = render(
      <MediaUploadField
        {...defaultProps}
        type="gallery"
        value={['url1', 'url2', 'url3']}
        maxItems={maxItems}
      />
    );
    // Should not show "Add More" when at max
    expect(queryByText(/Add More Images/)).toBeNull();
  });

  it('handles permission denial gracefully', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const { getByText } = render(<MediaUploadField {...defaultProps} />);
    const uploadButton = getByText('Upload Logo');

    // This should trigger permission request
    fireEvent.press(uploadButton);

    // Wait for async operations
    await waitFor(() => {
      // Component should handle permission denial
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });
  });
});
