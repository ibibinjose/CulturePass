/**
 * Standardized form validation utilities for CulturePass application
 * Implements security best practices and consistent validation patterns
 */

import { z } from 'zod';
import { sanitizeInput, validateEmail, validatePassword, validateUsername, validatePhoneNumber } from './security';

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * Email validation schema
   */
  email: z.string()
    .min(1, { message: 'Email is required' })
    .transform(sanitizeInput)
    .refine(validateEmail, { message: 'Invalid email format' }),

  /**
   * Password validation schema
   */
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .refine((val) => validatePassword(val).isValid, {
      message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character'
    }),

  /**
   * Username validation schema
   */
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be less than 30 characters' })
    .transform(sanitizeInput)
    .refine((val) => validateUsername(val).isValid, {
      message: 'Username can only contain letters, numbers, underscores, and hyphens'
    }),

  /**
   * Phone number validation schema
   */
  phoneNumber: z.string()
    .optional()
    .transform((val) => val ? sanitizeInput(val) : val)
    .refine((val) => !val || validatePhoneNumber(val), {
      message: 'Invalid phone number format'
    }),

  /**
   * Name validation schema (first name, last name, etc.)
   */
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(50, { message: 'Name must be less than 50 characters' })
    .transform(sanitizeInput)
    .refine((val) => /^[a-zA-Z\s\-'\.]+$/.test(val), {
      message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
    }),

  /**
   * Bio/Description validation schema
   */
  bio: z.string()
    .max(500, { message: 'Bio must be less than 500 characters' })
    .optional()
    .transform((val) => val ? sanitizeInput(val) : val),

  /**
   * URL validation schema
   */
  url: z.string()
    .optional()
    .transform((val) => val ? sanitizeInput(val) : val)
    .refine((val) => !val || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val), {
      message: 'Invalid URL format'
    }),
};

/**
 * User registration form validation schema
 */
export const RegistrationSchema = z.object({
  firstName: CommonSchemas.name,
  lastName: CommonSchemas.name,
  email: CommonSchemas.email,
  username: CommonSchemas.username,
  password: CommonSchemas.password,
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  phoneNumber: CommonSchemas.phoneNumber,
  bio: CommonSchemas.bio,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Login form validation schema
 */
export const LoginSchema = z.object({
  email: CommonSchemas.email,
  password: z.string().min(1, { message: 'Password is required' }),
});

/**
 * Profile update form validation schema
 */
export const ProfileUpdateSchema = z.object({
  firstName: CommonSchemas.name.optional(),
  lastName: CommonSchemas.name.optional(),
  email: CommonSchemas.email.optional(),
  username: CommonSchemas.username.optional(),
  phoneNumber: CommonSchemas.phoneNumber,
  bio: CommonSchemas.bio,
  website: CommonSchemas.url,
});

/**
 * Event creation form validation schema
 */
export const EventSchema = z.object({
  title: z.string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(100, { message: 'Title must be less than 100 characters' })
    .transform(sanitizeInput),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(1000, { message: 'Description must be less than 1000 characters' })
    .transform(sanitizeInput),
  startDate: z.string().datetime({ message: 'Start date is required' }),
  endDate: z.string().datetime({ message: 'End date is required' }),
  location: z.string()
    .min(5, { message: 'Location is required' })
    .max(200, { message: 'Location must be less than 200 characters' })
    .transform(sanitizeInput),
  category: z.string().min(1, { message: 'Category is required' }),
  price: z.number().min(0, { message: 'Price cannot be negative' }),
  maxAttendees: z.number().min(1, { message: 'Max attendees must be at least 1' }).optional(),
});

/**
 * Community creation form validation schema
 */
export const CommunitySchema = z.object({
  name: z.string()
    .min(3, { message: 'Community name must be at least 3 characters' })
    .max(50, { message: 'Community name must be less than 50 characters' })
    .transform(sanitizeInput),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(500, { message: 'Description must be less than 500 characters' })
    .transform(sanitizeInput),
  category: z.string().min(1, { message: 'Category is required' }),
  isPublic: z.boolean(),
  coverImage: z.string().optional(),
});

/**
 * Feedback/review form validation schema
 */
export const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string()
    .min(5, { message: 'Review title must be at least 5 characters' })
    .max(100, { message: 'Review title must be less than 100 characters' })
    .transform(sanitizeInput),
  comment: z.string()
    .min(10, { message: 'Review comment must be at least 10 characters' })
    .max(500, { message: 'Review comment must be less than 500 characters' })
    .transform(sanitizeInput),
});

/**
 * Utility function to validate form data against a schema
 */
export function validateFormData<T extends z.ZodSchema<any>>(
  schema: T,
  data: any
): { success: boolean; data?: z.infer<T>; errors?: Record<string, string[]> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      return { success: false, errors: fieldErrors };
    }
    
    return { success: false, errors: { general: ['An unexpected error occurred during validation'] } };
  }
}

/**
 * Sanitizes form input values
 */
export function sanitizeFormValues(values: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validates a specific field against a schema
 */
export function validateField<T extends z.ZodSchema<any>>(
  schema: T,
  value: any
): { success: boolean; errors?: string[] } {
  try {
    schema.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => err.message);
      return { success: false, errors };
    }
    
    return { success: false, errors: ['An unexpected error occurred during validation'] };
  }
}

/**
 * Creates a reusable validation function for forms
 */
export function createValidator<T extends z.ZodSchema<any>>(schema: T) {
  return (data: any) => validateFormData(schema, data);
}

// Export commonly used validators
export const validateRegistration = createValidator(RegistrationSchema);
export const validateLogin = createValidator(LoginSchema);
export const validateProfileUpdate = createValidator(ProfileUpdateSchema);
export const validateEvent = createValidator(EventSchema);
export const validateCommunity = createValidator(CommunitySchema);
export const validateFeedback = createValidator(FeedbackSchema);