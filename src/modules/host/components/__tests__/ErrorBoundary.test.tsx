/**
 * ErrorBoundary Tests
 *
 * Tests for the host module error boundary component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HostErrorBoundary } from '../ErrorBoundary';

// Suppress console.error in tests (ErrorBoundary logs errors)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test rendering error');
  }
  return <Text>Child content</Text>;
}

describe('HostErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </HostErrorBoundary>
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('should render fallback UI when an error occurs', () => {
    const { getByText } = render(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should display custom fallback title', () => {
    const { getByText } = render(
      <HostErrorBoundary fallbackTitle="Wizard Error">
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(getByText('Wizard Error')).toBeTruthy();
  });

  it('should display custom fallback message', () => {
    const { getByText } = render(
      <HostErrorBoundary fallbackMessage="Please try refreshing.">
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(getByText('Please try refreshing.')).toBeTruthy();
  });

  it('should display "Try Again" button', () => {
    const { getByText } = render(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should display "Go Back" button when onGoBack is provided', () => {
    const mockGoBack = jest.fn();
    const { getByText } = render(
      <HostErrorBoundary onGoBack={mockGoBack}>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('should not display "Go Back" button when onGoBack is not provided', () => {
    const { queryByText } = render(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(queryByText('Go Back')).toBeNull();
  });

  it('should call onGoBack when "Go Back" is pressed', () => {
    const mockGoBack = jest.fn();
    const { getByText } = render(
      <HostErrorBoundary onGoBack={mockGoBack}>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    fireEvent.press(getByText('Go Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback when error is caught', () => {
    const mockOnError = jest.fn();
    render(
      <HostErrorBoundary onError={mockOnError}>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should display reassurance message about data safety', () => {
    const { getByText } = render(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );
    expect(
      getByText('Your data is safe — auto-save has preserved your progress.')
    ).toBeTruthy();
  });

  it('should recover when "Try Again" is pressed and error is resolved', () => {
    // First render with error
    const { getByText, rerender } = render(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </HostErrorBoundary>
    );

    // Verify error state
    expect(getByText('Something went wrong')).toBeTruthy();

    // Re-render with non-throwing children BEFORE pressing retry,
    // so when the boundary resets state it renders the updated tree.
    rerender(
      <HostErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </HostErrorBoundary>
    );

    // Press "Try Again" — this resets the error boundary state and re-renders children
    fireEvent.press(getByText('Try Again'));

    expect(getByText('Child content')).toBeTruthy();
  });
});
