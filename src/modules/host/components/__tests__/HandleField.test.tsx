/**
 * HandleField Component Tests
 *
 * Tests for the HandleField component covering:
 * - Rendering with label, hint, and character count
 * - Input formatting (lowercase, alphanumeric, hyphens only)
 * - Debounced uniqueness check (300ms)
 * - Availability status display (available/taken/checking)
 * - Reserved keyword validation
 * - Min/max length validation
 *
 * Validates: Requirements 36
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { HandleField } from '../fields/HandleField';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    profiles: {
      handleAvailable: jest.fn(),
    },
  },
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
          testID="handle-input"
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

describe('HandleField', () => {
  const mockOnChange = jest.fn();
  const mockOnValidationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    api.profiles.handleAvailable.mockResolvedValue({ available: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Rendering Tests
  // -------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders with default label and hint', () => {
      const { getByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      expect(getByText('Handle *')).toBeTruthy();
      expect(getByText('Your unique URL identifier (e.g., @yourhandle)')).toBeTruthy();
    });

    it('renders with custom label', () => {
      const { getByText } = render(
        <HandleField value="" onChange={mockOnChange} label="Username" />
      );

      expect(getByText('Username *')).toBeTruthy();
    });

    it('renders without required indicator when not required', () => {
      const { getByText, queryByText } = render(
        <HandleField value="" onChange={mockOnChange} required={false} />
      );

      expect(getByText('Handle')).toBeTruthy();
      expect(queryByText('Handle *')).toBeNull();
    });

    it('displays character count', () => {
      const { getByText } = render(
        <HandleField value="test-handle" onChange={mockOnChange} />
      );

      expect(getByText('11/30 characters')).toBeTruthy();
    });

    it('displays 0/30 characters when empty', () => {
      const { getByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      expect(getByText('0/30 characters')).toBeTruthy();
    });

    it('displays external error', () => {
      const { getByText } = render(
        <HandleField
          value="test"
          onChange={mockOnChange}
          error="Custom error message"
        />
      );

      expect(getByText('Custom error message')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Input Formatting Tests
  // -------------------------------------------------------------------------

  describe('Input Formatting', () => {
    it('converts input to lowercase', () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'MyHandle');

      expect(mockOnChange).toHaveBeenCalledWith('myhandle');
    });

    it('removes special characters (keeps alphanumeric and hyphens)', () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'my_handle@123!');

      // Underscores, @, ! are all removed; only lowercase alphanumeric and hyphens remain
      expect(mockOnChange).toHaveBeenCalledWith('myhandle123');
    });

    it('replaces consecutive hyphens with single hyphen', () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'my--handle');

      expect(mockOnChange).toHaveBeenCalledWith('my-handle');
    });

    it('removes leading hyphens', () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, '-myhandle');

      expect(mockOnChange).toHaveBeenCalledWith('myhandle');
    });

    it('removes trailing hyphens', () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'myhandle-');

      expect(mockOnChange).toHaveBeenCalledWith('myhandle');
    });

    it('handles spaces by removing them', () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'my handle');

      expect(mockOnChange).toHaveBeenCalledWith('myhandle');
    });
  });

  // -------------------------------------------------------------------------
  // Debounced Uniqueness Check Tests
  // -------------------------------------------------------------------------

  describe('Debounced Uniqueness Check', () => {
    it('debounces API call by 300ms', async () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'valid-handle');

      // API should not be called immediately
      expect(api.profiles.handleAvailable).not.toHaveBeenCalled();

      // Advance timers by 300ms (debounce period)
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Now the API should be called
      await waitFor(() => {
        expect(api.profiles.handleAvailable).toHaveBeenCalledWith('valid-handle');
      });
    });

    it('cancels previous debounce when typing rapidly', async () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');

      // Type first value
      fireEvent.changeText(input, 'first');
      jest.advanceTimersByTime(100);

      // Type second value before debounce fires
      fireEvent.changeText(input, 'second');
      jest.advanceTimersByTime(100);

      // Type third value before debounce fires
      fireEvent.changeText(input, 'third');

      // Advance past debounce
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Only the last value should trigger API call
      await waitFor(() => {
        expect(api.profiles.handleAvailable).toHaveBeenCalledTimes(1);
        expect(api.profiles.handleAvailable).toHaveBeenCalledWith('third');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Availability Status Tests
  // -------------------------------------------------------------------------

  describe('Availability Status', () => {
    it('shows available status when handle is available', async () => {
      api.profiles.handleAvailable.mockResolvedValue({ available: true });

      // Render with the value already set (simulating controlled component)
      const { getByTestId, findByText, rerender } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'available-handle');

      // Re-render with the new value (simulating parent state update)
      rerender(<HandleField value="available-handle" onChange={mockOnChange} />);

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const status = await findByText('@available-handle is available');
      expect(status).toBeTruthy();
    });

    it('shows taken error when handle is not available', async () => {
      api.profiles.handleAvailable.mockResolvedValue({
        available: false,
        reason: 'Handle is already taken',
      });

      const { getByTestId, findByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'taken-handle');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('Handle is already taken');
      expect(error).toBeTruthy();
    });

    it('shows error when API call fails', async () => {
      api.profiles.handleAvailable.mockRejectedValue(new Error('Network error'));

      const { getByTestId, findByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'some-handle');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('Unable to verify handle availability. Please try again.');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Reserved Keywords Tests
  // -------------------------------------------------------------------------

  describe('Reserved Keywords', () => {
    it('shows error for reserved keyword "admin"', async () => {
      const { getByTestId, findByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'admin');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('This handle is reserved and cannot be used');
      expect(error).toBeTruthy();
    });

    it('shows error for reserved keyword "support"', async () => {
      const { getByTestId, findByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'support');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('This handle is reserved and cannot be used');
      expect(error).toBeTruthy();
    });

    it('does not call API for reserved keywords', async () => {
      const { getByTestId } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'help');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // API should not be called since reserved keyword check fails first
      expect(api.profiles.handleAvailable).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Length Validation Tests
  // -------------------------------------------------------------------------

  describe('Length Validation', () => {
    it('shows error for handle shorter than 3 characters', async () => {
      const { getByTestId, findByText } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'ab');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const error = await findByText('Handle must be at least 3 characters');
      expect(error).toBeTruthy();
    });

    it('accepts handle with exactly 3 characters', async () => {
      api.profiles.handleAvailable.mockResolvedValue({ available: true });

      const { getByTestId, findByText, rerender } = render(
        <HandleField value="" onChange={mockOnChange} />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'abc');

      // Re-render with the new value (simulating parent state update)
      rerender(<HandleField value="abc" onChange={mockOnChange} />);

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      const status = await findByText('@abc is available');
      expect(status).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Suggested Handle Tests
  // -------------------------------------------------------------------------

  describe('Suggested Handle', () => {
    it('displays suggested handle when provided and field is empty', () => {
      const { getByText } = render(
        <HandleField
          value=""
          onChange={mockOnChange}
          suggestedHandle="my-community"
        />
      );

      expect(getByText(/Suggested:/)).toBeTruthy();
      expect(getByText(/@my-community/)).toBeTruthy();
    });

    it('applies suggested handle when clicked', () => {
      const { getByLabelText } = render(
        <HandleField
          value=""
          onChange={mockOnChange}
          suggestedHandle="my-community"
        />
      );

      const suggestion = getByLabelText('Use suggested handle: my-community');
      fireEvent.press(suggestion);

      expect(mockOnChange).toHaveBeenCalledWith('my-community');
    });

    it('does not show suggestion when field has value', () => {
      const { queryByText } = render(
        <HandleField
          value="existing-handle"
          onChange={mockOnChange}
          suggestedHandle="my-community"
        />
      );

      expect(queryByText(/Suggested:/)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Validation Callback Tests
  // -------------------------------------------------------------------------

  describe('Validation Callback', () => {
    it('calls onValidationComplete with true when valid', async () => {
      api.profiles.handleAvailable.mockResolvedValue({ available: true });

      const { getByTestId } = render(
        <HandleField
          value=""
          onChange={mockOnChange}
          onValidationComplete={mockOnValidationComplete}
        />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'valid-handle');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockOnValidationComplete).toHaveBeenCalledWith(true);
      });
    });

    it('calls onValidationComplete with false when invalid', async () => {
      api.profiles.handleAvailable.mockResolvedValue({
        available: false,
        reason: 'Handle is already taken',
      });

      const { getByTestId } = render(
        <HandleField
          value=""
          onChange={mockOnChange}
          onValidationComplete={mockOnValidationComplete}
        />
      );

      const input = getByTestId('handle-input');
      fireEvent.changeText(input, 'taken-handle');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockOnValidationComplete).toHaveBeenCalledWith(false);
      });
    });
  });
});
