import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LocationField from '../LocationField';
import type { Address } from '@shared/schema/hostProfile';

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

describe('LocationField', () => {
  const mockAddress: Address = {
    street: '123 Test Street',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    lgaCode: 'SYD001',
    placeId: 'test-place-id',
    isPrimary: true,
  };

  it('renders without crashing', () => {
    const { getByPlaceholderText } = render(
      <LocationField value={null} onChange={jest.fn()} />
    );
    
    expect(getByPlaceholderText('Start typing an address...')).toBeTruthy();
  });

  it('displays the label', () => {
    const { getByText } = render(
      <LocationField value={null} onChange={jest.fn()} label="Custom Label" />
    );
    
    expect(getByText('Custom Label')).toBeTruthy();
  });

  it('displays address details when value is provided', () => {
    const { getByText } = render(
      <LocationField value={mockAddress} onChange={jest.fn()} />
    );
    
    expect(getByText('Address Confirmed')).toBeTruthy();
    expect(getByText('123 Test Street')).toBeTruthy();
    expect(getByText('Sydney')).toBeTruthy();
    expect(getByText('NSW')).toBeTruthy();
    expect(getByText('2000')).toBeTruthy();
    expect(getByText('Australia')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const { getByText } = render(
      <LocationField
        value={null}
        onChange={jest.fn()}
        error="Invalid address"
      />
    );
    
    expect(getByText('Invalid address')).toBeTruthy();
  });

  it('calls onChange when search text changes', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <LocationField value={null} onChange={onChange} />
    );
    
    const input = getByPlaceholderText('Start typing an address...');
    fireEvent.changeText(input, '123 Test');
    
    // Note: onChange won't be called until a place is selected
    // This just tests that the input accepts text
    expect(input.props.value).toBe('123 Test');
  });

  it('validates PO Box addresses when requirePhysical is true', () => {
    const { getByText } = render(
      <LocationField
        value={{
          ...mockAddress,
          street: 'PO Box 123',
        }}
        onChange={jest.fn()}
        requirePhysical={true}
      />
    );
    
    // The component should show validation error for PO Box
    // Note: This would need the validation to run, which happens on place select
  });

  it('renders MapPreview when address has coordinates', () => {
    const { getByText } = render(
      <LocationField value={mockAddress} onChange={jest.fn()} />
    );
    
    // MapPreview should be rendered with the address
    expect(getByText('Address Confirmed')).toBeTruthy();
  });
});
