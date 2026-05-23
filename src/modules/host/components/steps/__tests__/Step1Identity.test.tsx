/**
 * Step1Identity Component Tests
 * 
 * Tests for the first wizard step component that collects basic identity information.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Step1Identity } from '../Step1Identity';
import type { EntityType } from '../../../hooks/useFormWizard';
import type { PartialFormData } from '../../../services/formStateSerializer';

// Mock dependencies
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    surfaceElevated: '#F5F5F5',
    error: '#FF5E5B',
  }),
}));

jest.mock('@/hooks/useLayout', () => ({
  useLayout: () => ({
    isDesktop: false,
    isTablet: false,
    isMobile: true,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock the field components
jest.mock('../../fields/HandleField', () => ({
  HandleField: ({ value, onChange, error }: any) => {
    const { TextInput, View } = require('react-native');
    return (
      <View testID="handle-field">
        <TextInput
          testID="handle-input"
          value={value}
          onChangeText={onChange}
          placeholder="Handle"
        />
        {error && <View testID="handle-error">{error}</View>}
      </View>
    );
  },
}));

jest.mock('../../fields/NameField', () => ({
  NameField: ({ value, onChange, label, error }: any) => {
    const { TextInput, View, Text } = require('react-native');
    return (
      <View testID={`name-field-${label}`}>
        <Text>{label}</Text>
        <TextInput
          testID={`name-input-${label}`}
          value={value}
          onChangeText={onChange}
          placeholder={label}
        />
        {error && <View testID={`name-error-${label}`}>{error}</View>}
      </View>
    );
  },
}));

jest.mock('../../fields/DateField', () => ({
  DateField: ({ value, onChange, error }: any) => {
    const { TextInput, View } = require('react-native');
    return (
      <View testID="date-field">
        <TextInput
          testID="date-input"
          value={value}
          onChangeText={onChange}
          placeholder="Date"
        />
        {error && <View testID="date-error">{error}</View>}
      </View>
    );
  },
}));

describe('Step1Identity', () => {
  const mockUpdateFormData = jest.fn();
  const mockGetFieldError = jest.fn();

  const defaultProps = {
    entityType: 'community' as EntityType,
    formData: {} as PartialFormData,
    updateFormData: mockUpdateFormData,
    getFieldError: mockGetFieldError,
    isValidating: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<Step1Identity {...defaultProps} />);
    expect(getByText('Basic Identity')).toBeTruthy();
  });

  it('displays the correct entity type in subtitle', () => {
    const { getByText } = render(
      <Step1Identity {...defaultProps} entityType="venue" />
    );
    expect(getByText(/venue/i)).toBeTruthy();
  });

  it('renders all required fields', () => {
    const { getByTestId } = render(<Step1Identity {...defaultProps} />);
    
    expect(getByTestId('name-field-Official Name')).toBeTruthy();
    expect(getByTestId('handle-field')).toBeTruthy();
    expect(getByTestId('date-field')).toBeTruthy();
    expect(getByTestId('name-field-Trading Name')).toBeTruthy();
  });

  it('updates official name when changed', () => {
    const { getByTestId } = render(<Step1Identity {...defaultProps} />);
    
    const input = getByTestId('name-input-Official Name');
    fireEvent.changeText(input, 'My Community');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({ officialName: 'My Community' });
  });

  it('updates handle when changed', () => {
    const { getByTestId } = render(<Step1Identity {...defaultProps} />);
    
    const input = getByTestId('handle-input');
    fireEvent.changeText(input, 'my-community');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({ handle: 'my-community' });
  });

  it('updates founding date when changed', () => {
    const { getByTestId } = render(<Step1Identity {...defaultProps} />);
    
    const input = getByTestId('date-input');
    fireEvent.changeText(input, '2020-01-15');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({ foundingDate: '2020-01-15' });
  });

  it('updates trading name when changed', () => {
    const { getByTestId } = render(<Step1Identity {...defaultProps} />);
    
    const input = getByTestId('name-input-Trading Name');
    fireEvent.changeText(input, 'My Trading Name');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({
      tradingName: 'My Trading Name',
    });
  });

  it('displays pre-filled values from formData', () => {
    const formData: PartialFormData = {
      entityType: 'community',
      officialName: 'Existing Community',
      handle: 'existing-handle',
      foundingDate: '2019-05-10',
      tradingName: 'Existing Trading Name',
    };

    const { getByTestId } = render(
      <Step1Identity {...defaultProps} formData={formData} />
    );
    
    expect(getByTestId('name-input-Official Name').props.value).toBe('Existing Community');
    expect(getByTestId('handle-input').props.value).toBe('existing-handle');
    expect(getByTestId('date-input').props.value).toBe('2019-05-10');
    expect(getByTestId('name-input-Trading Name').props.value).toBe('Existing Trading Name');
  });

  it('displays handle preview when handle is entered', () => {
    const formData: PartialFormData = {
      entityType: 'community',
      handle: 'my-handle',
    };

    const { getByText } = render(
      <Step1Identity {...defaultProps} formData={formData} />
    );
    
    expect(getByText('culturepass.com/@my-handle')).toBeTruthy();
  });

  it('displays field errors when provided', () => {
    mockGetFieldError.mockImplementation((field: string) => {
      if (field === 'officialName') return 'Name is required';
      if (field === 'handle') return 'Handle is taken';
      return undefined;
    });

    const { getByTestId } = render(<Step1Identity {...defaultProps} />);
    
    expect(getByTestId('name-error-Official Name')).toBeTruthy();
    expect(getByTestId('handle-error')).toBeTruthy();
  });

  it('displays info banner with explanation', () => {
    const { getByText } = render(<Step1Identity {...defaultProps} />);
    
    expect(getByText('Why do we need this?')).toBeTruthy();
    expect(getByText(/Your official name and handle/i)).toBeTruthy();
  });
});
