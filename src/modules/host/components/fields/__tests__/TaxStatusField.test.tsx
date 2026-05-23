import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TaxStatusField } from '../TaxStatusField';

describe('TaxStatusField', () => {
  const mockOnTaxStatusChange = jest.fn();
  const mockOnGstIdChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and hint', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="not-registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    expect(getByText('Tax Status')).toBeTruthy();
    expect(getByText('Select your GST registration status')).toBeTruthy();
  });

  it('shows all three registration options', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="not-registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    expect(getByText('GST Registered')).toBeTruthy();
    expect(getByText('I am registered for GST/VAT')).toBeTruthy();
    expect(getByText('Not Registered')).toBeTruthy();
    expect(getByText('I am not registered for GST/VAT')).toBeTruthy();
    expect(getByText('GST Exempt')).toBeTruthy();
    expect(getByText('My organisation is exempt from GST (e.g., charity, education)')).toBeTruthy();
  });

  it('selects GST registered status', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="not-registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    const registeredOption = getByText('GST Registered');
    fireEvent.press(registeredOption);

    expect(mockOnTaxStatusChange).toHaveBeenCalledWith('registered');
  });

  it('selects not registered status', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    const notRegisteredOption = getByText('Not Registered');
    fireEvent.press(notRegisteredOption);

    expect(mockOnTaxStatusChange).toHaveBeenCalledWith('not-registered');
  });

  it('selects exempt status', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="not-registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    const exemptOption = getByText('GST Exempt');
    fireEvent.press(exemptOption);

    expect(mockOnTaxStatusChange).toHaveBeenCalledWith('exempt');
  });

  it('shows GST ID input when registered', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    expect(getByText('GST/VAT ID')).toBeTruthy();
    expect(getByText('Enter your 11-digit GST identification number')).toBeTruthy();
  });

  it('hides GST ID input when not registered', () => {
    const { queryByText } = render(
      <TaxStatusField
        taxStatus="not-registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    expect(queryByText('GST/VAT ID')).toBeNull();
  });

  it('hides GST ID input when exempt', () => {
    const { queryByText } = render(
      <TaxStatusField
        taxStatus="exempt"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    expect(queryByText('GST/VAT ID')).toBeNull();
  });

  it('formats GST ID with spaces', () => {
    const { getByPlaceholderText } = render(
      <TaxStatusField
        taxStatus="registered"
        gstId=""
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    const input = getByPlaceholderText('XX XXX XXX XXX');
    fireEvent.changeText(input, '12345678901');

    expect(mockOnGstIdChange).toHaveBeenCalledWith('12 345 678 901');
  });

  it('displays error prop', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="not-registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
        error="Tax status is required"
      />
    );

    expect(getByText('Tax status is required')).toBeTruthy();
  });

  it('shows info box when GST registered', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    expect(
      getByText(/Your GST ID is typically the same as your ABN/)
    ).toBeTruthy();
  });

  it('clears GST ID when switching away from registered', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        gstId="12 345 678 901"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    const notRegisteredOption = getByText('Not Registered');
    fireEvent.press(notRegisteredOption);

    expect(mockOnTaxStatusChange).toHaveBeenCalledWith('not-registered');
    expect(mockOnGstIdChange).toHaveBeenCalledWith('');
  });

  it('clears GST ID when switching to exempt', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        gstId="12 345 678 901"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
      />
    );

    const exemptOption = getByText('GST Exempt');
    fireEvent.press(exemptOption);

    expect(mockOnTaxStatusChange).toHaveBeenCalledWith('exempt');
    expect(mockOnGstIdChange).toHaveBeenCalledWith('');
  });

  it('shows verification status badge', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
        verificationStatus="verified"
      />
    );

    expect(getByText('Tax Status Verified')).toBeTruthy();
  });

  it('shows pending verification badge', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
        verificationStatus="pending"
      />
    );

    expect(getByText('Pending Verification')).toBeTruthy();
  });

  it('shows rejected verification badge with notes', () => {
    const { getByText } = render(
      <TaxStatusField
        taxStatus="registered"
        onTaxStatusChange={mockOnTaxStatusChange}
        onGstIdChange={mockOnGstIdChange}
        verificationStatus="rejected"
        verificationNotes="GST ID does not match ABN records"
      />
    );

    expect(getByText('Verification Rejected')).toBeTruthy();
    expect(getByText('GST ID does not match ABN records')).toBeTruthy();
  });

  // Backward compatibility tests
  describe('backward compatibility', () => {
    it('works with legacy gstRegistered boolean prop', () => {
      const mockOnGstRegisteredChange = jest.fn();
      const { getByText } = render(
        <TaxStatusField
          taxStatus="not-registered"
          gstRegistered={false}
          onTaxStatusChange={mockOnTaxStatusChange}
          onGstRegisteredChange={mockOnGstRegisteredChange}
          onGstIdChange={mockOnGstIdChange}
        />
      );

      const registeredOption = getByText('GST Registered');
      fireEvent.press(registeredOption);

      expect(mockOnTaxStatusChange).toHaveBeenCalledWith('registered');
      expect(mockOnGstRegisteredChange).toHaveBeenCalledWith(true);
    });
  });
});
