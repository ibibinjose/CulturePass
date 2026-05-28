/**
 * useFieldValidation Hook
 * 
 * Provides real-time field validation with debouncing for the HostSpace
 * Enterprise-Grade Form System. Validates input within 300ms and provides
 * immediate feedback to users.
 * 
 * Features:
 * - Debounced validation (300ms)
 * - Zod schema integration
 * - Async validation support (e.g., handle uniqueness checks)
 * - Loading states
 * - Error message formatting
 * 
 * @example
 * ```tsx
 * const { error, isValidating, validate } = useFieldValidation({
 *   schema: handleSchema,
 *   asyncValidator: async (value) => {
 *     const isAvailable = await api.profiles.validateHandle(value);
 *     if (!isAvailable) throw new Error('Handle is already taken');
 *   },
 * });
 * 
 * <Input
 *   value={handle}
 *   onChangeText={(text) => {
 *     setHandle(text);
 *     validate(text);
 *   }}
 *   error={error}
 * />
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

export interface UseFieldValidationOptions<T = string> {
  /**
   * Zod schema for synchronous validation
   */
  schema?: z.ZodSchema<T>;
  
  /**
   * Async validator function (e.g., API calls for uniqueness checks)
   * Should throw an error with message if validation fails
   */
  asyncValidator?: (value: T) => Promise<void>;
  
  /**
   * Debounce delay in milliseconds (default: 300ms)
   */
  debounceMs?: number;
  
  /**
   * Whether to validate on mount with initial value
   */
  validateOnMount?: boolean;
  
  /**
   * Initial value to validate on mount
   */
  initialValue?: T;
  
  /**
   * Custom error message formatter
   */
  formatError?: (error: z.ZodError | Error) => string;
}

export interface UseFieldValidationReturn {
  /**
   * Current validation error message (null if valid)
   */
  error: string | null;
  
  /**
   * Whether validation is currently in progress
   */
  isValidating: boolean;
  
  /**
   * Whether the field has been validated at least once
   */
  hasValidated: boolean;
  
  /**
   * Whether the field is valid (no errors after validation)
   */
  isValid: boolean;
  
  /**
   * Trigger validation for a value
   */
  validate: (value: any) => Promise<boolean>;
  
  /**
   * Clear validation state
   */
  clearValidation: () => void;
  
  /**
   * Set error manually (useful for server-side validation)
   */
  setError: (error: string | null) => void;
}

/**
 * Default error formatter - extracts first error message from Zod errors
 */
function defaultFormatError(error: z.ZodError | Error): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || 'Validation failed';
  }
  return error.message || 'Validation failed';
}

/**
 * Hook for real-time field validation with debouncing
 */
export function useFieldValidation<T = string>(
  options: UseFieldValidationOptions<T> = {}
): UseFieldValidationReturn {
  const {
    schema,
    asyncValidator,
    debounceMs = 300,
    validateOnMount = false,
    initialValue,
    formatError = defaultFormatError,
  } = options;

  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Track the latest validation request to avoid race conditions
  const validationIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Perform validation (both sync and async)
   */
  const performValidation = useCallback(
    async (value: any, validationId: number): Promise<boolean> => {
      try {
        // Synchronous validation with Zod schema
        if (schema) {
          schema.parse(value);
        }

        // Asynchronous validation (e.g., API calls)
        if (asyncValidator) {
          await asyncValidator(value as T);
        }

        // Only update state if this is still the latest validation
        if (validationId === validationIdRef.current) {
          setError(null);
          setIsValid(true);
          setIsValidating(false);
          setHasValidated(true);
        }

        return true;
      } catch (err) {
        // Only update state if this is still the latest validation
        if (validationId === validationIdRef.current) {
          const errorMessage = formatError(err as z.ZodError | Error);
          setError(errorMessage);
          setIsValid(false);
          setIsValidating(false);
          setHasValidated(true);
        }

        return false;
      }
    },
    [schema, asyncValidator, formatError]
  );

  /**
   * Validate with debouncing
   */
  const validate = useCallback(
    async (value: any): Promise<boolean> => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Increment validation ID to track latest request
      validationIdRef.current += 1;
      const currentValidationId = validationIdRef.current;

      // Set validating state immediately
      setIsValidating(true);

      // Debounce the actual validation
      return new Promise((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          const result = await performValidation(value, currentValidationId);
          resolve(result);
        }, debounceMs);
      });
    },
    [performValidation, debounceMs]
  );

  /**
   * Clear validation state
   */
  const clearValidation = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setError(null);
    setIsValidating(false);
    setHasValidated(false);
    setIsValid(false);
  }, []);

  /**
   * Validate on mount if requested
   */
  useEffect(() => {
    if (validateOnMount && initialValue !== undefined) {
      validate(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally only on mount - validateOnMount + initialValue are for initial trigger only

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    error,
    isValidating,
    hasValidated,
    isValid,
    validate,
    clearValidation,
    setError,
  };
}

/**
 * Hook for validating multiple fields together
 * Useful for form-level validation
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback(
    async (values: T): Promise<boolean> => {
      setIsValidating(true);
      
      try {
        schema.parse(values);
        setErrors({});
        setIsValid(true);
        setIsValidating(false);
        return true;
      } catch (err) {
        if (err instanceof z.ZodError) {
          const fieldErrors: Partial<Record<keyof T, string>> = {};
          
          err.issues.forEach((issue) => {
            const field = issue.path[0] as keyof T;
            if (field && !fieldErrors[field]) {
              fieldErrors[field] = issue.message;
            }
          });
          
          setErrors(fieldErrors);
        }
        
        setIsValid(false);
        setIsValidating(false);
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const rest = { ...prev };
        delete rest[field];
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  return {
    errors,
    isValidating,
    isValid,
    validate,
    clearErrors,
    setFieldError,
  };
}
