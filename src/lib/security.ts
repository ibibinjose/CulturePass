/**
 * Security utilities for CulturePass application
 * Implements input validation, sanitization, and secure operations
 */

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates email format securely
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format securely
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random string
 */
export function generateSecureRandomString(length: number = 32): string {
  if (typeof crypto === 'undefined') {
    throw new Error('Crypto API not available');
  }
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  // Convert to hex string
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validates and sanitizes a user-generated slug
 */
export function validateAndSanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  // Convert to lowercase and replace invalid characters with hyphens
  const sanitized = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return sanitized.substring(0, 50); // Limit length to 50 characters
}

/**
 * Validates a phone number format (basic validation)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Basic phone number validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  return phoneRegex.test(cleanedPhone);
}

/**
 * Sanitizes HTML content for safe display
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Basic HTML sanitization - remove dangerous tags and attributes
  return html
    .replace(/<(script|iframe|object|embed|form|input|button)[^>]*>.*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|form|input|button)[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
}

/**
 * Validates and normalizes a username
 */
export function validateUsername(username: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters' };
  }

  // Check for valid characters (letters, numbers, underscore, hyphen)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Normalize by converting to lowercase
  const normalized = username.toLowerCase();

  return { isValid: true, normalized };
}

/**
 * Hashes a value using SHA-256 for non-sensitive data identification
 */
export async function hashValue(value: string): Promise<string> {
  if (!value || typeof value !== 'string') {
    throw new Error('Value must be a non-empty string');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { isValid: boolean; requirements?: string[]; error?: string } {
  if (!password || typeof password !== 'string') {
    return { 
      isValid: false, 
      error: 'Password is required',
      requirements: ['Password is required']
    };
  }

  const requirements: string[] = [];
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('One number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character');
  }

  return {
    isValid: errors.length === 0,
    requirements: errors,
    error: errors.length > 0 ? `Password must contain: ${errors.join(', ')}` : undefined
  };
}

/**
 * Sanitizes a URL for safe linking
 */
export function sanitizeUrlForLink(url: string): string {
  if (!url || typeof url !== 'string') {
    return '#';
  }

  // If it doesn't start with http/https, treat as relative path
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Validate relative path format
    if (!url.startsWith('/') && !url.startsWith('./') && !url.startsWith('../')) {
      return '#';
    }
    return url;
  }

  // Validate as absolute URL
  if (validateUrl(url)) {
    return url;
  }

  return '#';
}