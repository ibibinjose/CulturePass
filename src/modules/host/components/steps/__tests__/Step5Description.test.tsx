/**
 * Step5Description Component Tests
 * 
 * Tests for the Rich Description wizard step component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Step5Description } from '../Step5Description';
import type { WizardStepProps } from '../../FormWizard/WizardStep';

// Mock dependencies
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    card: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceElevated: '#FAFAFA',
    borderLight: '#E0E0E0',
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

jest.mock('../../fields/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange, label }: any) => {
    const { TextInput, Text } = require('react-native');
    return (
      <>
        <Text>{label}</Text>
        <TextInput
          testID="rich-text-editor"
          value={value}
          onChangeText={onChange}
        />
      </>
    );
  },
}));

describe('Step5Description', () => {
  const mockUpdateFormData = jest.fn();
  const mockGetFieldError = jest.fn();

  const defaultProps: WizardStepProps = {
    step: 5,
    entityType: 'community',
    formData: {
      entityType: 'community',
      officialName: 'Test Community',
      handle: 'testcommunity',
      categoryTags: [],
    },
    updateFormData: mockUpdateFormData,
    validationErrors: {},
    getFieldError: mockGetFieldError,
    isValidating: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<Step5Description {...defaultProps} />);
    expect(getByText('Rich Description')).toBeTruthy();
  });

  it('displays tagline input field', () => {
    const { getByPlaceholderText } = render(<Step5Description {...defaultProps} />);
    expect(getByPlaceholderText(/Celebrating Kerala culture/)).toBeTruthy();
  });

  it('displays long description editor', () => {
    const { getByTestId } = render(<Step5Description {...defaultProps} />);
    expect(getByTestId('rich-text-editor')).toBeTruthy();
  });

  it('updates tagline when changed', () => {
    const { getByPlaceholderText } = render(<Step5Description {...defaultProps} />);
    const input = getByPlaceholderText(/Celebrating Kerala culture/);
    
    fireEvent.changeText(input, 'New tagline');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({
      tagline: 'New tagline',
    });
  });

  it('updates description when changed', () => {
    const { getByTestId } = render(<Step5Description {...defaultProps} />);
    const editor = getByTestId('rich-text-editor');
    
    fireEvent.changeText(editor, 'New description');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({
      description: 'New description',
    });
  });

  it('displays category tags for entity type', () => {
    const { getByText } = render(<Step5Description {...defaultProps} />);
    
    // Community tags should be visible
    expect(getByText('Cultural Heritage')).toBeTruthy();
    expect(getByText('Language Learning')).toBeTruthy();
  });

  it('allows selecting tags', () => {
    const { getByText } = render(<Step5Description {...defaultProps} />);
    const tag = getByText('Cultural Heritage');
    
    fireEvent.press(tag);
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({
      categoryTags: ['Cultural Heritage'],
    });
  });

  it('allows deselecting tags', () => {
    const propsWithTags = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        categoryTags: ['Cultural Heritage'],
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithTags} />);
    const tag = getByText('Cultural Heritage');
    
    fireEvent.press(tag);
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({
      categoryTags: [],
    });
  });

  it('enforces maximum tag limit', () => {
    const propsWithMaxTags = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        categoryTags: Array(10).fill('Tag'),
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithMaxTags} />);
    
    // Try to select another tag
    const newTag = getByText('Cultural Heritage');
    fireEvent.press(newTag);
    
    // Should not add more tags
    expect(mockUpdateFormData).not.toHaveBeenCalled();
  });

  it('displays SEO preview with profile data', () => {
    const { getByText } = render(<Step5Description {...defaultProps} />);
    
    expect(getByText('Test Community')).toBeTruthy();
    expect(getByText('culturepass.com/@testcommunity')).toBeTruthy();
  });

  it('shows success badge when tagline is valid', () => {
    const propsWithTagline = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        tagline: 'Great tagline',
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithTagline} />);
    expect(getByText('Great tagline!')).toBeTruthy();
  });

  it('shows success badge when description is valid', () => {
    const propsWithDescription = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        description: 'A'.repeat(150), // Valid length
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithDescription} />);
    expect(getByText('Excellent description!')).toBeTruthy();
  });

  it('shows success badge when tags are valid', () => {
    const propsWithTags = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        categoryTags: ['Tag1', 'Tag2', 'Tag3'],
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithTags} />);
    expect(getByText('Perfect tag selection!')).toBeTruthy();
  });

  it('displays different tags for different entity types', () => {
    const { getByText, rerender } = render(<Step5Description {...defaultProps} />);
    
    // Community tags
    expect(getByText('Cultural Heritage')).toBeTruthy();
    
    // Change to venue
    rerender(<Step5Description {...defaultProps} entityType="venue" />);
    expect(getByText('Event Space')).toBeTruthy();
  });

  it('displays character count for tagline', () => {
    const propsWithTagline = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        tagline: 'Test',
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithTagline} />);
    expect(getByText('4/120 characters')).toBeTruthy();
  });

  it('displays tag selection count', () => {
    const propsWithTags = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        categoryTags: ['Tag1', 'Tag2'],
      },
    };
    
    const { getByText } = render(<Step5Description {...propsWithTags} />);
    expect(getByText('2 of 10 tags selected')).toBeTruthy();
  });

  it('shows minimum tags warning when below threshold', () => {
    const { getByText } = render(<Step5Description {...defaultProps} />);
    expect(getByText('(minimum 3 required)')).toBeTruthy();
  });
});
