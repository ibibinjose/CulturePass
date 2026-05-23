/**
 * Validation Service
 *
 * Business logic for real-time field validation including handle uniqueness,
 * ABN validation, email verification, and phone verification.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md (Requirement 4)
 */

import { db } from '../admin';
import { isReservedHandle } from '../../../shared/constants/reservedHandles';

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const profilesCol = () => db.collection('hostProfiles');

// ---------------------------------------------------------------------------
// Validation Service
// ---------------------------------------------------------------------------

export const validationService = {
  /**
   * Check if a handle already exists
   */
  async checkHandleExists(handle: string, excludeProfileId?: string): Promise<boolean> {
    if (isReservedHandle(handle)) {
      return true;
    }

    // Check if handle exists in database
    let query = profilesCol().where('handle', '==', handle) as FirebaseFirestore.Query;

    if (excludeProfileId) {
      // Exclude the current profile when checking (for updates)
      const snap = await query.get();
      const exists = snap.docs.some(doc => doc.id !== excludeProfileId);
      return exists;
    }

    const snap = await query.limit(1).get();
    return !snap.empty;
  },

  /**
   * Validate ABN format and checksum
   */
  validateABNFormat(abn: string): { valid: boolean; error?: string } {
    // Remove spaces and validate format
    const cleanAbn = abn.replace(/\s/g, '');

    if (!/^\d{11}$/.test(cleanAbn)) {
      return { valid: false, error: 'ABN must be 11 digits' };
    }

    // Validate checksum using Australian government algorithm
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = cleanAbn.split('').map(Number);

    // Subtract 1 from the first digit
    digits[0] -= 1;

    // Calculate weighted sum
    const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0);

    // Check if sum is divisible by 89
    if (sum % 89 !== 0) {
      return { valid: false, error: 'Invalid ABN checksum' };
    }

    return { valid: true };
  },

  /**
   * Validate ABN and lookup business details
   */
  async validateABN(abn: string): Promise<{
    valid: boolean;
    error?: string;
    businessName?: string;
    status?: string;
    gstRegistered?: boolean;
  }> {
    // First validate format
    const formatValidation = this.validateABNFormat(abn);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    // In production, you would call the ABN Lookup API here
    // For now, we'll return a mock response
    // API: https://abr.business.gov.au/abn/

    // Mock implementation
    // TODO: Integrate with ABN Lookup API
    // const apiKey = process.env.ABN_LOOKUP_API_KEY;
    // const response = await fetch(`https://abr.business.gov.au/json/AbnDetails.aspx?abn=${abn}&guid=${apiKey}`);
    // const data = await response.json();

    return {
      valid: true,
      businessName: 'Example Business Pty Ltd', // Would come from API
      status: 'Active', // Would come from API
      gstRegistered: true, // Would come from API
    };
  },

  /**
   * Validate email format (basic check, actual verification via email)
   */
  validateEmailFormat(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  },

  /**
   * Validate phone number format (E.164 international format)
   */
  validatePhoneFormat(phone: string): { valid: boolean; error?: string } {
    // E.164 format: +[country code][number]
    // Example: +61412345678 (Australia)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return {
        valid: false,
        error: 'Phone number must be in international format (e.g., +61412345678)',
      };
    }
    return { valid: true };
  },

  /**
   * Validate URL format
   */
  validateUrlFormat(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'https:') {
        return { valid: false, error: 'URL must use HTTPS protocol' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  },

  /**
   * Validate date is not in the future
   */
  validatePastDate(dateString: string): { valid: boolean; error?: string } {
    const date = new Date(dateString);
    const now = new Date();

    if (date > now) {
      return { valid: false, error: 'Date cannot be in the future' };
    }

    return { valid: true };
  },

  /**
   * Generate a suggested handle from a name
   */
  generateSuggestedHandle(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 30); // Limit to 30 characters
  },

  /**
   * Check if a handle is available and suggest alternatives if not
   */
  async checkHandleAvailability(
    handle: string,
    excludeProfileId?: string
  ): Promise<{
    available: boolean;
    suggestions?: string[];
  }> {
    const exists = await this.checkHandleExists(handle, excludeProfileId);

    if (!exists) {
      return { available: true };
    }

    // Generate suggestions
    const suggestions: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${handle}${i}`;
      const suggestionExists = await this.checkHandleExists(suggestion, excludeProfileId);
      if (!suggestionExists) {
        suggestions.push(suggestion);
      }
    }

    // Add random suffix suggestions
    const randomSuffix = Math.floor(Math.random() * 1000);
    const randomSuggestion = `${handle}${randomSuffix}`;
    const randomExists = await this.checkHandleExists(randomSuggestion, excludeProfileId);
    if (!randomExists) {
      suggestions.push(randomSuggestion);
    }

    return {
      available: false,
      suggestions: suggestions.slice(0, 5),
    };
  },
};
