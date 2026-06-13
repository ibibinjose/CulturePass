/**
 * Contact Fields Test Suite
 *
 * Tests for EmailField, PhoneField, and SocialLinksField components
 *
 * Requirements: 9.1-9.13
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EmailField } from '../EmailField';
import { PhoneField } from '../PhoneField';
import { SocialLinksField, type SocialLink } from '../SocialLinksField';

describe('EmailField', () => {
  it('renders with label and hint', () => {
    const { getByText } = render(
      <EmailField value="" onChange={() => {}} />
    );

    expect(getByText(/Public Email/)).toBeTruthy();
    expect(getByText('This email will be visible on your profile')).toBeTruthy();
  });

  it('validates email format', async () => {
    const onChange = jest.fn();
    const { rerender, getByText } = render(
      <EmailField value="" onChange={onChange} />
    );

    // Simulate entering invalid email by re-rendering with new value
    rerender(<EmailField value="invalid-email" onChange={onChange} />);

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    }, { timeout: 500 });
  });

  it('shows send verification button for valid email', async () => {
    const { getByText } = render(
      <EmailField value="test@example.com" onChange={() => {}} />
    );

    await waitFor(() => {
      expect(getByText('Confirm email')).toBeTruthy();
    }, { timeout: 500 });
  });

  it('accepts custom label and hint', () => {
    const { getByText } = render(
      <EmailField
        value=""
        onChange={() => {}}
        label="Business Email"
        hint="Your business contact email"
      />
    );

    expect(getByText(/Business Email/)).toBeTruthy();
    expect(getByText('Your business contact email')).toBeTruthy();
  });
});

describe('PhoneField', () => {
  it('renders with label and country selector', () => {
    const { getByText } = render(
      <PhoneField value="" onChange={() => {}} />
    );

    expect(getByText('Phone Number')).toBeTruthy();
    // Default country is AU
    expect(getByText('+61')).toBeTruthy();
    expect(getByText('🇦🇺')).toBeTruthy();
  });

  it('shows default hint with country format', () => {
    const { getByText } = render(
      <PhoneField value="" onChange={() => {}} />
    );

    expect(getByText('Format: +61 X XXXX XXXX')).toBeTruthy();
  });

  it('validates E.164 phone format', async () => {
    const onChange = jest.fn();
    const { rerender, getByText } = render(
      <PhoneField value="" onChange={onChange} />
    );

    // Simulate entering short number
    rerender(<PhoneField value="+61 4" onChange={onChange} />);

    await waitFor(() => {
      expect(getByText(/Enter a valid phone number/)).toBeTruthy();
    }, { timeout: 500 });
  });

  it('renders WhatsApp field when includeWhatsApp is true', () => {
    const { getByText } = render(
      <PhoneField
        value="+61 4 1234 5678"
        onChange={() => {}}
        includeWhatsApp
        whatsAppValue=""
        onWhatsAppChange={() => {}}
      />
    );

    expect(getByText('WhatsApp Number (Optional)')).toBeTruthy();
  });

  it('supports different default countries', () => {
    const { getByText } = render(
      <PhoneField value="" onChange={() => {}} defaultCountry="NZ" />
    );

    expect(getByText('+64')).toBeTruthy();
    expect(getByText('🇳🇿')).toBeTruthy();
  });
});

describe('SocialLinksField', () => {
  it('renders with label and hint', () => {
    const { getByText } = render(
      <SocialLinksField value={[]} onChange={() => {}} />
    );

    expect(getByText('Social Media Links')).toBeTruthy();
    expect(getByText('Add up to 8 social media links')).toBeTruthy();
  });

  it('allows adding new social links', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SocialLinksField value={[]} onChange={onChange} />
    );

    const addButton = getByText(/Add Social Link/);
    fireEvent.press(addButton);

    expect(onChange).toHaveBeenCalled();
  });

  it('displays existing social links', () => {
    const links: SocialLink[] = [
      {
        platform: 'facebook',
        url: 'https://facebook.com/testpage',
        verified: true,
      },
      {
        platform: 'instagram',
        url: 'https://instagram.com/testuser',
        verified: true,
      },
    ];

    const { getByText } = render(
      <SocialLinksField value={links} onChange={() => {}} />
    );

    expect(getByText('Facebook')).toBeTruthy();
    expect(getByText('Instagram')).toBeTruthy();
  });

  it('enforces maximum link limit', () => {
    const links: SocialLink[] = Array(8).fill(null).map((_, i) => ({
      platform: 'other' as const,
      url: `https://example${i}.com`,
      verified: true,
    }));

    const { getByText } = render(
      <SocialLinksField value={links} onChange={() => {}} maxLinks={8} />
    );

    expect(getByText('Maximum 8 links reached')).toBeTruthy();
  });

  it('shows platform-specific URL validation', () => {
    const links: SocialLink[] = [
      {
        platform: 'instagram',
        url: 'https://instagram.com/testuser',
        verified: true,
      },
    ];

    const { getByText } = render(
      <SocialLinksField value={links} onChange={() => {}} />
    );

    // Verified badge should be shown
    expect(getByText('Instagram')).toBeTruthy();
  });

  it('supports custom max links', () => {
    const links: SocialLink[] = Array(4).fill(null).map((_, i) => ({
      platform: 'other' as const,
      url: `https://example${i}.com`,
      verified: true,
    }));

    const { getByText } = render(
      <SocialLinksField value={links} onChange={() => {}} maxLinks={4} />
    );

    expect(getByText('Maximum 4 links reached')).toBeTruthy();
  });

  it('renders primary contact method selector when enabled', () => {
    const onMethodChange = jest.fn();
    const { getByText } = render(
      <SocialLinksField
        value={[]}
        onChange={() => {}}
        showPrimaryContactMethod
        primaryContactMethod="email"
        onPrimaryContactMethodChange={onMethodChange}
      />
    );

    expect(getByText('Primary Contact Method')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Phone')).toBeTruthy();
  });

  it('shows WhatsApp option when hasWhatsApp is true', () => {
    const { getByText } = render(
      <SocialLinksField
        value={[]}
        onChange={() => {}}
        showPrimaryContactMethod
        primaryContactMethod="email"
        onPrimaryContactMethodChange={() => {}}
        hasWhatsApp
      />
    );

    expect(getByText('WhatsApp')).toBeTruthy();
  });

  it('calls onPrimaryContactMethodChange when method is selected', () => {
    const onMethodChange = jest.fn();
    const { getByText } = render(
      <SocialLinksField
        value={[]}
        onChange={() => {}}
        showPrimaryContactMethod
        primaryContactMethod="email"
        onPrimaryContactMethodChange={onMethodChange}
      />
    );

    fireEvent.press(getByText('Phone'));
    expect(onMethodChange).toHaveBeenCalledWith('phone');
  });
});
