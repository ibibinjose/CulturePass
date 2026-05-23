import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AccessibilityChecklistField from '../AccessibilityChecklistField';
import type { AccessibilityFeatures } from '@shared/schema/hostProfile';

// Mock dependencies
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    borderLight: '#E0E0E0',
    surfaceElevated: '#FAFAFA',
    error: '#FF3B30',
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('AccessibilityChecklistField', () => {
  const mockValue: AccessibilityFeatures = {
    wheelchairAccess: false,
    accessibleParking: false,
    accessibleToilets: false,
    hearingLoop: false,
    brailleSignage: false,
    serviceAnimalFriendly: false,
  };

  it('renders without crashing', () => {
    const { getByText } = render(
      <AccessibilityChecklistField value={mockValue} onChange={jest.fn()} />
    );
    
    expect(getByText('Accessibility Features')).toBeTruthy();
  });

  it('displays all accessibility options', () => {
    const { getByText } = render(
      <AccessibilityChecklistField value={mockValue} onChange={jest.fn()} />
    );
    
    expect(getByText('Wheelchair Access')).toBeTruthy();
    expect(getByText('Accessible Parking')).toBeTruthy();
    expect(getByText('Accessible Toilets')).toBeTruthy();
    expect(getByText('Hearing Loop')).toBeTruthy();
    expect(getByText('Braille Signage')).toBeTruthy();
    expect(getByText('Service Animal Friendly')).toBeTruthy();
  });

  it('displays custom label when provided', () => {
    const { getByText } = render(
      <AccessibilityChecklistField
        value={mockValue}
        onChange={jest.fn()}
        label="Custom Label"
      />
    );
    
    expect(getByText('Custom Label')).toBeTruthy();
  });

  it('calculates accessibility score correctly', () => {
    const partialValue: AccessibilityFeatures = {
      ...mockValue,
      wheelchairAccess: true,
      accessibleParking: true,
      accessibleToilets: true,
    };
    
    const { getByText } = render(
      <AccessibilityChecklistField value={partialValue} onChange={jest.fn()} />
    );
    
    // 3 out of 6 features = 50%
    expect(getByText('50%')).toBeTruthy();
  });

  it('calls onChange when checkbox is toggled', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <AccessibilityChecklistField value={mockValue} onChange={onChange} />
    );
    
    const wheelchairOption = getByText('Wheelchair Access');
    fireEvent.press(wheelchairOption);
    
    expect(onChange).toHaveBeenCalledWith({
      ...mockValue,
      wheelchairAccess: true,
    });
  });

  it('selects all features when Select All is pressed', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <AccessibilityChecklistField value={mockValue} onChange={onChange} />
    );
    
    const selectAllButton = getByText('Select All');
    fireEvent.press(selectAllButton);
    
    expect(onChange).toHaveBeenCalledWith({
      wheelchairAccess: true,
      accessibleParking: true,
      accessibleToilets: true,
      hearingLoop: true,
      brailleSignage: true,
      serviceAnimalFriendly: true,
    });
  });

  it('clears all features when Clear All is pressed', () => {
    const allEnabled: AccessibilityFeatures = {
      wheelchairAccess: true,
      accessibleParking: true,
      accessibleToilets: true,
      hearingLoop: true,
      brailleSignage: true,
      serviceAnimalFriendly: true,
    };
    
    const onChange = jest.fn();
    const { getByText } = render(
      <AccessibilityChecklistField value={allEnabled} onChange={onChange} />
    );
    
    const clearAllButton = getByText('Clear All');
    fireEvent.press(clearAllButton);
    
    expect(onChange).toHaveBeenCalledWith({
      wheelchairAccess: false,
      accessibleParking: false,
      accessibleToilets: false,
      hearingLoop: false,
      brailleSignage: false,
      serviceAnimalFriendly: false,
    });
  });

  it('displays 100% score when all features are enabled', () => {
    const allEnabled: AccessibilityFeatures = {
      wheelchairAccess: true,
      accessibleParking: true,
      accessibleToilets: true,
      hearingLoop: true,
      brailleSignage: true,
      serviceAnimalFriendly: true,
    };
    
    const { getByText } = render(
      <AccessibilityChecklistField value={allEnabled} onChange={jest.fn()} />
    );
    
    expect(getByText('100%')).toBeTruthy();
  });

  it('hides score when showScore is false', () => {
    const { queryByText } = render(
      <AccessibilityChecklistField
        value={mockValue}
        onChange={jest.fn()}
        showScore={false}
      />
    );
    
    expect(queryByText('0%')).toBeNull();
  });
});
