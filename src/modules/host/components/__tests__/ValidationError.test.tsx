/**
 * ValidationError Tests
 *
 * Tests for the field-level validation error display component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ValidationError } from '../ValidationError';

// Mock hooks
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: '#000000',
    textSecondary: '#666666',
    surface: '#FFFFFF',
  }),
}));

describe('ValidationError', () => {
  it('should render nothing when no errors and not valid', () => {
    const { toJSON } = render(<ValidationError />);
    expect(toJSON()).toBeNull();
  });

  it('should render a single error message', () => {
    const { getByText } = render(
      <ValidationError error="Handle is already taken" />
    );
    expect(getByText('Handle is already taken')).toBeTruthy();
  });

  it('should render multiple error messages', () => {
    const { getByText } = render(
      <ValidationError errors={['Too short', 'Invalid characters']} />
    );
    expect(getByText('Too short')).toBeTruthy();
    expect(getByText('Invalid characters')).toBeTruthy();
  });

  it('should combine single error and errors array', () => {
    const { getByText } = render(
      <ValidationError
        error="Name is required"
        errors={['Handle is required']}
      />
    );
    expect(getByText('Name is required')).toBeTruthy();
    expect(getByText('Handle is required')).toBeTruthy();
  });

  it('should render valid state with checkmark', () => {
    const { getByText } = render(
      <ValidationError isValid />
    );
    expect(getByText('Valid')).toBeTruthy();
  });

  it('should show errors over valid state when both provided', () => {
    const { getByText, queryByText } = render(
      <ValidationError isValid error="Still has an error" />
    );
    expect(getByText('Still has an error')).toBeTruthy();
    expect(queryByText('Valid')).toBeNull();
  });

  it('should show error summary when showSummary is true and multiple errors', () => {
    const { getByText } = render(
      <ValidationError
        errors={['Name is required', 'Handle is required', 'Date is invalid']}
        showSummary
      />
    );
    expect(getByText('3 errors to fix')).toBeTruthy();
  });

  it('should show summary with custom label', () => {
    const { getByText } = render(
      <ValidationError
        errors={['Name is required', 'Handle is required']}
        showSummary
        summaryLabel="Step 1"
      />
    );
    expect(getByText('Step 1: 2 errors to fix')).toBeTruthy();
  });

  it('should not show summary for single error even when showSummary is true', () => {
    const { queryByText } = render(
      <ValidationError
        errors={['Name is required']}
        showSummary
      />
    );
    // Summary only shows when > 1 error
    expect(queryByText(/errors? to fix/)).toBeNull();
  });

  it('should apply testID prop', () => {
    const { getByTestId } = render(
      <ValidationError error="Test error" testID="validation-error" />
    );
    expect(getByTestId('validation-error')).toBeTruthy();
  });
});
