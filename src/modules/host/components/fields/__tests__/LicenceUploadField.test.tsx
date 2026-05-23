import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LicenceUploadField, Licence } from '../LicenceUploadField';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///test/document.jpg' }],
  }),
  MediaTypeOptions: { Images: 'Images' },
}));

describe('LicenceUploadField', () => {
  const mockOnChange = jest.fn();

  const sampleLicence: Licence = {
    id: 'licence_1',
    type: 'Business Registration',
    number: 'BR-12345',
    documentUrl: 'file:///test/doc.jpg',
    fileName: 'doc.jpg',
    verified: false,
    uploadedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and hint', () => {
    const { getByText } = render(
      <LicenceUploadField value={[]} onChange={mockOnChange} />
    );

    expect(getByText('Licences & Permits')).toBeTruthy();
    expect(getByText('Upload business registration, permits, or certificates (images)')).toBeTruthy();
  });

  it('renders upload button when no files uploaded', () => {
    const { getByText } = render(
      <LicenceUploadField value={[]} onChange={mockOnChange} />
    );

    expect(getByText('Upload Document')).toBeTruthy();
    expect(getByText('Images (JPG, PNG) • Max 10MB')).toBeTruthy();
  });

  it('displays uploaded licence cards', () => {
    const { getByText } = render(
      <LicenceUploadField value={[sampleLicence]} onChange={mockOnChange} />
    );

    expect(getByText('doc.jpg')).toBeTruthy();
    expect(getByText('Business Registration ▾')).toBeTruthy();
    expect(getByText('Pending Verification')).toBeTruthy();
  });

  it('shows verified badge for verified licences', () => {
    const verifiedLicence = { ...sampleLicence, verified: true };
    const { getByText } = render(
      <LicenceUploadField value={[verifiedLicence]} onChange={mockOnChange} />
    );

    expect(getByText('Verified')).toBeTruthy();
  });

  it('shows expired badge for expired licences', () => {
    const expiredLicence = {
      ...sampleLicence,
      expiryDate: '2020-01-01',
    };
    const { getByText } = render(
      <LicenceUploadField value={[expiredLicence]} onChange={mockOnChange} />
    );

    expect(getByText('Expired')).toBeTruthy();
  });

  it('shows expiring soon badge for licences expiring within 30 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const expiringSoonLicence = {
      ...sampleLicence,
      expiryDate: futureDate.toISOString().split('T')[0],
    };
    const { getByText } = render(
      <LicenceUploadField value={[expiringSoonLicence]} onChange={mockOnChange} />
    );

    expect(getByText('Expiring Soon')).toBeTruthy();
  });

  it('removes a licence when remove button is pressed', () => {
    const { getByLabelText } = render(
      <LicenceUploadField value={[sampleLicence]} onChange={mockOnChange} />
    );

    const removeButton = getByLabelText('Remove Business Registration document');
    fireEvent.press(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('hides upload button when max files reached', () => {
    const licences = Array.from({ length: 5 }, (_, i) => ({
      ...sampleLicence,
      id: `licence_${i}`,
    }));

    const { queryByText } = render(
      <LicenceUploadField value={licences} onChange={mockOnChange} maxFiles={5} />
    );

    expect(queryByText('Upload Document')).toBeNull();
  });

  it('displays file count', () => {
    const { getByText } = render(
      <LicenceUploadField value={[sampleLicence]} onChange={mockOnChange} />
    );

    expect(getByText('1 of 5 documents uploaded')).toBeTruthy();
  });

  it('displays error prop', () => {
    const { getByText } = render(
      <LicenceUploadField
        value={[]}
        onChange={mockOnChange}
        error="At least one licence is required"
      />
    );

    expect(getByText('At least one licence is required')).toBeTruthy();
  });

  it('shows OCR scan info when enabled', () => {
    const { getByText } = render(
      <LicenceUploadField value={[]} onChange={mockOnChange} showOCRScan />
    );

    expect(
      getByText('OCR scanning will automatically extract details from uploaded documents')
    ).toBeTruthy();
  });

  it('hides OCR scan info when disabled', () => {
    const { queryByText } = render(
      <LicenceUploadField value={[]} onChange={mockOnChange} showOCRScan={false} />
    );

    expect(
      queryByText('OCR scanning will automatically extract details from uploaded documents')
    ).toBeNull();
  });

  it('shows type selector dropdown when type is pressed', () => {
    const { getByText, getByLabelText } = render(
      <LicenceUploadField value={[sampleLicence]} onChange={mockOnChange} />
    );

    const typeButton = getByLabelText('Licence type: Business Registration. Tap to change.');
    fireEvent.press(typeButton);

    // Should show all type options
    expect(getByText('Food & Liquor Licence')).toBeTruthy();
    expect(getByText('Entertainment Permit')).toBeTruthy();
    expect(getByText('Insurance Certificate')).toBeTruthy();
  });

  it('updates licence type when option is selected', () => {
    const { getByText, getByLabelText } = render(
      <LicenceUploadField value={[sampleLicence]} onChange={mockOnChange} />
    );

    // Open type selector
    const typeButton = getByLabelText('Licence type: Business Registration. Tap to change.');
    fireEvent.press(typeButton);

    // Select new type
    const newType = getByText('Insurance Certificate');
    fireEvent.press(newType);

    expect(mockOnChange).toHaveBeenCalledWith([
      { ...sampleLicence, type: 'Insurance Certificate' },
    ]);
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(
      <LicenceUploadField value={[]} onChange={mockOnChange} />
    );

    expect(getByLabelText('Upload licence document')).toBeTruthy();
  });
});
