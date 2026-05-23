# Identity Fields Documentation

This document describes the identity field components created for Task 3.1 of the HostSpace Enterprise-Grade Form System.

## Overview

The identity fields provide basic identity input components with real-time validation for host profile creation. These fields are used in Step 1 (Basic Identity) of the form wizard.

## Components

### 1. HandleField

A handle input field with real-time uniqueness validation and format checking.

**Features:**
- Real-time format validation (lowercase, alphanumeric, hyphens only)
- Uniqueness check with 300ms debounce via API
- Auto-suggestion based on official name
- Platform keyword reservation (admin, support, help, etc.)
- Visual availability indicators (checkmark for available, X for taken)
- Character count display (3-30 characters)
- Mobile-responsive (320px+)
- WCAG 2.1 Level AA compliant

**Usage:**
```tsx
import { HandleField } from '@/modules/host/components/fields';

<HandleField
  value={handle}
  onChange={setHandle}
  suggestedHandle="my-community"
  required
  onValidationComplete={(isValid) => console.log('Valid:', isValid)}
/>
```

**Props:**
- `value: string` - Current handle value
- `onChange: (value: string) => void` - Callback when handle changes
- `suggestedHandle?: string` - Suggested handle based on official name
- `error?: string` - External error message
- `label?: string` - Label text (default: "Handle")
- `hint?: string` - Hint text
- `required?: boolean` - Whether field is required (default: true)
- `disabled?: boolean` - Whether field is disabled
- `onValidationComplete?: (isValid: boolean) => void` - Validation callback

**Validation Rules:**
- Pattern: `/^[a-z0-9-]+$/` (lowercase, alphanumeric, hyphens only)
- Min length: 3 characters
- Max length: 30 characters
- No consecutive hyphens
- No leading/trailing hyphens
- Not a reserved keyword
- Unique across all profiles

**Reserved Keywords:**
The following handles are reserved and cannot be used:
- Platform: admin, support, help, api, app, about, contact, terms, privacy, settings
- Entity types: profile, user, event, community, venue, business, artist, professional
- Features: hostspace, discover, calendar, search, login, signup, auth, account
- Status: draft, published, pending, approved, rejected, suspended, banned, deleted
- Special: test, demo, example, sample, culturepass, culture-pass

### 2. NameField

A name input field with character count and validation.

**Features:**
- Real-time validation (2-120 characters)
- Character count display with color coding
- Auto-trim whitespace
- Visual validation feedback (checkmark for valid)
- Mobile-responsive (320px+)
- WCAG 2.1 Level AA compliant

**Usage:**
```tsx
import { NameField } from '@/modules/host/components/fields';

<NameField
  value={officialName}
  onChange={setOfficialName}
  label="Official Name"
  hint="Legal name of your organization"
  required
  onValidationComplete={(isValid) => console.log('Valid:', isValid)}
/>
```

**Props:**
- `value: string` - Current name value
- `onChange: (value: string) => void` - Callback when name changes
- `error?: string` - External error message
- `label?: string` - Label text (default: "Name")
- `hint?: string` - Hint text
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Whether field is required (default: true)
- `disabled?: boolean` - Whether field is disabled
- `minLength?: number` - Minimum character length (default: 2)
- `maxLength?: number` - Maximum character length (default: 120)
- `onValidationComplete?: (isValid: boolean) => void` - Validation callback
- `showCharCount?: boolean` - Whether to show character count (default: true)

**Validation Rules:**
- Min length: 2 characters (configurable)
- Max length: 120 characters (configurable)
- Trimmed whitespace

**Character Count Status:**
- Gray: Empty or within limits
- Red: Below minimum or above maximum
- Orange: Approaching maximum (>90%)
- Green: Valid

### 3. DateField

A date input field with picker interface and past date validation.

**Features:**
- Native date picker on iOS/Android
- Web-friendly date input
- Past date validation (no future dates)
- ISO 8601 format (YYYY-MM-DD)
- Visual validation feedback
- Mobile-responsive (320px+)
- WCAG 2.1 Level AA compliant

**Usage:**
```tsx
import { DateField } from '@/modules/host/components/fields';

<DateField
  value={foundingDate}
  onChange={setFoundingDate}
  label="Founding Date"
  hint="When was your organization founded?"
  required
  onValidationComplete={(isValid) => console.log('Valid:', isValid)}
/>
```

**Props:**
- `value: string` - Current date value (ISO 8601: YYYY-MM-DD)
- `onChange: (value: string) => void` - Callback when date changes
- `error?: string` - External error message
- `label?: string` - Label text (default: "Date")
- `hint?: string` - Hint text
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Whether field is required (default: true)
- `disabled?: boolean` - Whether field is disabled
- `maxDate?: Date` - Maximum date (default: today)
- `minDate?: Date` - Minimum date (optional)
- `onValidationComplete?: (isValid: boolean) => void` - Validation callback

**Validation Rules:**
- Format: ISO 8601 (YYYY-MM-DD)
- Must not be in the future (by default)
- Must be a valid date

**Platform Behavior:**
- **iOS**: Shows native spinner picker
- **Android**: Shows native calendar picker
- **Web**: Uses HTML5 date input with type="date"

## Hooks

### useFieldValidation

A hook for real-time field validation with debouncing.

**Features:**
- Debounced validation (300ms default)
- Zod schema integration
- Async validation support (e.g., API calls)
- Loading states
- Error message formatting

**Usage:**
```tsx
import { useFieldValidation } from '@/modules/host/hooks';
import { handleSchema } from '@/modules/host/schemas/profileSchema';

const {
  error,
  isValidating,
  isValid,
  hasValidated,
  validate,
  clearValidation,
  setError,
} = useFieldValidation({
  schema: handleSchema,
  asyncValidator: async (value) => {
    const response = await api.profiles.handleAvailable(value);
    if (!response.available) {
      throw new Error('Handle is already taken');
    }
  },
  debounceMs: 300,
});

// Trigger validation
validate(inputValue);
```

**Options:**
- `schema?: z.ZodSchema<T>` - Zod schema for synchronous validation
- `asyncValidator?: (value: T) => Promise<void>` - Async validator function
- `debounceMs?: number` - Debounce delay in milliseconds (default: 300)
- `validateOnMount?: boolean` - Whether to validate on mount
- `initialValue?: T` - Initial value to validate on mount
- `formatError?: (error: z.ZodError | Error) => string` - Custom error formatter

**Return Values:**
- `error: string | null` - Current validation error message
- `isValidating: boolean` - Whether validation is in progress
- `hasValidated: boolean` - Whether field has been validated at least once
- `isValid: boolean` - Whether field is valid
- `validate: (value: any) => Promise<boolean>` - Trigger validation
- `clearValidation: () => void` - Clear validation state
- `setError: (error: string | null) => void` - Set error manually

### useFormValidation

A hook for validating multiple fields together (form-level validation).

**Usage:**
```tsx
import { useFormValidation } from '@/modules/host/hooks';
import { step1IdentitySchema } from '@/modules/host/schemas/profileSchema';

const {
  errors,
  isValidating,
  isValid,
  validate,
  clearErrors,
  setFieldError,
} = useFormValidation(step1IdentitySchema);

// Validate entire form
const isFormValid = await validate({
  officialName: 'My Community',
  handle: 'my-community',
  foundingDate: '2020-01-15',
  entityType: 'community',
});
```

## Validation Schemas

All validation schemas are defined in `src/modules/host/schemas/profileSchema.ts` using Zod.

**Identity Schemas:**
- `handleSchema` - Handle validation (3-30 chars, lowercase, alphanumeric, hyphens)
- `officialNameSchema` - Official name validation (2-120 chars)
- `pastDateSchema` - Past date validation (ISO 8601, not in future)

**Step Schema:**
- `step1IdentitySchema` - Complete Step 1 validation (all identity fields)

## Design System Integration

All components follow the CulturePass design system:

**Tokens Used:**
- `CultureTokens.indigo` - Primary brand color (focus states)
- `CultureTokens.teal` - Success states (valid fields)
- `CultureTokens.coral` - Error states
- `CultureTokens.violet` - Active states
- `InputTokens.height` - Input height (48px)
- `InputTokens.radius` - Input border radius (16px)
- `Radius.md` - Card border radius (16px)
- `Radius.sm` - Small border radius (10px)
- `FontFamily.medium` - Medium font weight
- `FontFamily.semibold` - Semibold font weight
- `FontFamily.bold` - Bold font weight

**Hooks Used:**
- `useColors()` - Runtime theme colors
- `useLayout()` - Responsive breakpoints (if needed)

## Accessibility

All components are WCAG 2.1 Level AA compliant:

- **Keyboard Navigation**: All fields are keyboard accessible
- **Screen Readers**: Proper `accessibilityLabel` and `accessibilityHint` props
- **Focus Indicators**: Clear focus states with indigo border
- **Error Announcements**: Errors are announced to screen readers
- **Touch Targets**: Minimum 44×44 points on mobile
- **Color Contrast**: All text meets WCAG AA contrast ratios

## Mobile Responsiveness

All components are responsive from 320px to 2560px:

- **320px+**: Vertical stacking, full-width inputs
- **768px+**: Tablet layout (if applicable)
- **1024px+**: Desktop layout (if applicable)

## Testing

Tests are located in `src/modules/host/components/fields/__tests__/IdentityFields.test.tsx`.

**Test Coverage:**
- HandleField: Format validation, uniqueness check, suggestions, character count
- NameField: Length validation, character count, success indicators
- DateField: Format validation, future date prevention, platform-specific pickers

**Running Tests:**
```bash
npm run test:unit
```

## Example Usage

See `IdentityFieldsExample.tsx` for a complete example showing:
- Form state management
- Validation handling
- Auto-suggestion for handle based on name
- Form status display
- Data preview

## API Integration

The HandleField component integrates with the profiles API:

**Endpoint:**
```
GET /api/profiles/handles/available?handle=:handle
```

**Response:**
```typescript
{
  available: boolean;
  reason?: string;
}
```

**Implementation:**
```typescript
import api from '@/lib/api';

const response = await api.profiles.handleAvailable('my-handle');
if (!response.available) {
  // Handle is taken
}
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

**Requirement 4: Real-Time Field Validation**
- ✅ Validation within 300 milliseconds
- ✅ Error messages displayed below fields in red
- ✅ Green checkmark for valid fields
- ✅ Handle uniqueness check in real-time
- ✅ Date validation (no future dates)

**Requirement 6: Common Identity Fields (All Entity Types)**
- ✅ Official Name field (2-120 characters)
- ✅ Handle field with format validation
- ✅ Auto-generated handle suggestion
- ✅ Real-time handle uniqueness check
- ✅ Founding Date field with date picker
- ✅ Future date validation
- ✅ Trading Name field (optional)
- ✅ Character count display
- ✅ Reserved keyword prevention

## Files Created

1. `src/modules/host/hooks/useFieldValidation.ts` - Validation hook
2. `src/modules/host/components/fields/HandleField.tsx` - Handle input component
3. `src/modules/host/components/fields/NameField.tsx` - Name input component
4. `src/modules/host/components/fields/DateField.tsx` - Date input component
5. `src/modules/host/components/fields/IdentityFieldsExample.tsx` - Usage example
6. `src/modules/host/components/fields/__tests__/IdentityFields.test.tsx` - Tests
7. `src/modules/host/components/fields/IDENTITY_FIELDS.md` - This documentation

## Next Steps

These identity fields will be used in:
- **Task 4.1**: Step 1 - Basic Identity (wizard step implementation)
- **Task 6.x**: Entity-specific fields (community, organiser, venue, business, artist, professional)

## Notes

- All components use React Hook Form compatible patterns
- Validation is debounced to avoid excessive API calls
- Components are designed to work standalone or within a form wizard
- All validation schemas are centralized in `profileSchema.ts`
- Components follow the existing CulturePass design patterns
