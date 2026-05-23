/**
 * ABNField Component Tests
 *
 * Tests for the ABNField component covering:
 * - Rendering with label, hint, and required indicator
 * - Input formatting (XX XXX XXX XXX)
 * - Checksum algorithm validation
 * - Business name display on successful lookup
 * - API error handling
 * - OCR scanning trigger
 *
 * Validates: Requirements 36
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ABNField } from '../fields/ABNField';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    profiles: {
      abnLookup: jest.fn(),
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
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
  Ionicons: 'Ionicons',
}));

jest.mock('@/design-system/ui/Input', () => ({
  Input: ({ label, value, onChangeText, placeholder, error, hint, ...props }: any) => {
    const { View, Text, TextInput } = require('react-native');
    return (
      <View>
        {label && <Text>{label}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID="abn-input"
          {...props}
        />
        {error && <Text testID="error-text">{error}</Text>}
        {hint && <Text testID="hint-text">{hint}</Text>}
      </View>
    );
  },
}));

// Import the mocked api after jest.mock
const { api } = require('@/lib/api');
const ImagePicker = require('expo-image-picker');

describe('ABNField', () => {
  const mockOnChange = jest.fn();
  const mockOnValidationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    api.profiles.abnLookup.mockResolvedValue({
      ok: true,
      validated: true,
      entityName: 'Test Business Pty Ltd',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Rendering Tests
  // -------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders with default label', () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      expect(getByText('Australian Business Number (ABN)')).toBeTruthy();
    });

    it('renders with required indicator when required', () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} required />
      );

      expect(getByText('Australian Business Number (ABN) *')).toBeTruthy();
    });

    it('renders with custom label', () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} label="Business ABN" />
      );

      expect(getByText('Business ABN')).toBeTruthy();
    });

    it('renders placeholder text', () => {
      const { getByPlaceholderText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      expect(getByPlaceholderText('XX XXX XXX XXX')).toBeTruthy();
    });

    it('renders external error message', () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} error="ABN is required" />
      );

      expect(getByText('ABN is required')).toBeTruthy();
    });

    it('renders OCR scan button by default', () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      expect(getByText('Scan from document')).toBeTruthy();
    });

    it('hides OCR scan button when showOCRScan is false', () => {
      const { queryByText } = render(
        <ABNField value="" onChange={mockOnChange} showOCRScan={false} />
      );

      expect(queryByText('Scan from document')).toBeNull();
    });

    it('renders required note when required', () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} required />
      );

      expect(getByText(/Required for business entities/)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Input Formatting Tests
  // -------------------------------------------------------------------------

  describe('Input Formatting', () => {
    it('formats input with spaces: XX XXX XXX XXX', () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      // Should format as XX XXX XXX XXX
      expect(mockOnChange).toHaveBeenCalledWith('51 824 753 556');
    });

    it('formats partial input (2 digits)', () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51');

      expect(mockOnChange).toHaveBeenCalledWith('51');
    });

    it('formats partial input (5 digits)', () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824');

      expect(mockOnChange).toHaveBeenCalledWith('51 824');
    });

    it('formats partial input (8 digits)', () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753');

      expect(mockOnChange).toHaveBeenCalledWith('51 824 753');
    });

    it('strips non-numeric characters', () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51-824-753-556');

      expect(mockOnChange).toHaveBeenCalledWith('51 824 753 556');
    });

    it('limits to 11 digits', () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '518247535561234');

      // Should only take first 11 digits
      expect(mockOnChange).toHaveBeenCalledWith('51 824 753 556');
    });
  });

  // -------------------------------------------------------------------------
  // Checksum Validation Tests
  // -------------------------------------------------------------------------

  describe('Checksum Validation', () => {
    it('validates a known valid ABN (51 824 753 556)', async () => {
      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} onValidationComplete={mockOnValidationComplete} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(api.profiles.abnLookup).toHaveBeenCalledWith('51824753556');
      });
    });

    it('shows error for invalid checksum', async () => {
      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} onValidationComplete={mockOnValidationComplete} />
      );

      const input = getByTestId('abn-input');
      // 12345678901 is not a valid ABN checksum
      fireEvent.changeText(input, '12345678901');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('Invalid ABN checksum');
      expect(error).toBeTruthy();
      expect(mockOnValidationComplete).toHaveBeenCalledWith(false);
    });

    it('does not call API for invalid checksum', async () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '12345678901');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(api.profiles.abnLookup).not.toHaveBeenCalled();
    });

    it('does not trigger validation for incomplete ABN (less than 11 digits)', async () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} onValidationComplete={mockOnValidationComplete} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '5182475');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Should not call API for incomplete input
      expect(api.profiles.abnLookup).not.toHaveBeenCalled();
      // Should not call validation complete for partial input
      expect(mockOnValidationComplete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Business Name Display Tests
  // -------------------------------------------------------------------------

  describe('Business Name Display', () => {
    it('displays business name on successful API lookup', async () => {
      api.profiles.abnLookup.mockResolvedValue({
        ok: true,
        validated: true,
        entityName: 'Acme Corporation Pty Ltd',
      });

      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const businessName = await findByText('Acme Corporation Pty Ltd');
      expect(businessName).toBeTruthy();
    });

    it('displays verified badge on successful lookup', async () => {
      api.profiles.abnLookup.mockResolvedValue({
        ok: true,
        validated: true,
        entityName: 'Test Business',
      });

      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const verified = await findByText('Verified');
      expect(verified).toBeTruthy();
    });

    it('calls onValidationComplete with business name', async () => {
      api.profiles.abnLookup.mockResolvedValue({
        ok: true,
        validated: true,
        entityName: 'My Business',
      });

      const { getByTestId } = render(
        <ABNField
          value=""
          onChange={mockOnChange}
          onValidationComplete={mockOnValidationComplete}
        />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockOnValidationComplete).toHaveBeenCalledWith(true, 'My Business');
      });
    });

    it('shows checksum-only success when API returns no business name', async () => {
      api.profiles.abnLookup.mockRejectedValue(new Error('API unavailable'));

      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Falls back to checksum-only validation
      const status = await findByText('Checksum valid (lookup unavailable)');
      expect(status).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // API Error Handling Tests
  // -------------------------------------------------------------------------

  describe('API Error Handling', () => {
    it('handles API returning not found gracefully', async () => {
      api.profiles.abnLookup.mockResolvedValue({
        ok: false,
        validated: false,
        message: 'ABN not found or inactive',
      });

      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} onValidationComplete={mockOnValidationComplete} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('ABN not found or inactive');
      expect(error).toBeTruthy();
      expect(mockOnValidationComplete).toHaveBeenCalledWith(false);
    });

    it('falls back to checksum validation when API is unavailable', async () => {
      api.profiles.abnLookup.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <ABNField
          value=""
          onChange={mockOnChange}
          onValidationComplete={mockOnValidationComplete}
        />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should still report valid since checksum passes
        expect(mockOnValidationComplete).toHaveBeenCalledWith(true);
      });
    });

    it('shows validating indicator during API call', async () => {
      // Make API call hang
      api.profiles.abnLookup.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByTestId, findByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const validating = await findByText('Validating ABN...');
      expect(validating).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // OCR Scanning Tests
  // -------------------------------------------------------------------------

  describe('OCR Scanning', () => {
    it('triggers image picker when scan button is pressed', async () => {
      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const scanButton = getByText('Scan from document');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });

    it('handles permission denial for OCR scan', async () => {
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'denied',
      });

      // Define global.alert for the test environment
      const alertMock = jest.fn();
      (global as any).alert = alertMock;

      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const scanButton = getByText('Scan from document');

      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          'Camera roll permission is needed to scan documents.'
        );
      });

      delete (global as any).alert;
    });

    it('handles cancelled image selection', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });

      const { getByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const scanButton = getByText('Scan from document');

      await act(async () => {
        fireEvent.press(scanButton);
      });

      // onChange should not be called when cancelled
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('hides scan button when disabled', () => {
      const { queryByText } = render(
        <ABNField value="" onChange={mockOnChange} disabled />
      );

      expect(queryByText('Scan from document')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Debounce Behavior Tests
  // -------------------------------------------------------------------------

  describe('Debounce Behavior', () => {
    it('debounces validation by 300ms', async () => {
      const { getByTestId } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');
      fireEvent.changeText(input, '51824753556');

      // Should not validate immediately
      expect(api.profiles.abnLookup).not.toHaveBeenCalled();

      // Advance by 200ms - still should not validate
      await act(async () => {
        jest.advanceTimersByTime(200);
      });
      expect(api.profiles.abnLookup).not.toHaveBeenCalled();

      // Advance remaining 100ms to hit 300ms total
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(api.profiles.abnLookup).toHaveBeenCalled();
      });
    });

    it('resets validation state when input changes', () => {
      const { getByTestId, queryByText } = render(
        <ABNField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('abn-input');

      // Type a valid ABN
      fireEvent.changeText(input, '51824753556');

      // Type something else before validation completes
      fireEvent.changeText(input, '51824');

      // Previous validation result should be cleared
      expect(queryByText('Verified')).toBeNull();
    });
  });
});
