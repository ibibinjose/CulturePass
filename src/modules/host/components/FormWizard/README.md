# FormWizard Components

Enterprise-grade wizard container components for the HostSpace profile creation system.

## Components

### WizardContainer

Main orchestrator component that manages the 6-step wizard flow.

**Features:**
- 6-step wizard flow with validation
- Progress indicator
- Auto-save integration (every 8 seconds)
- Draft recovery
- Mobile-responsive design
- Browser back button handling (web)
- Unsaved changes warning

**Usage:**
```tsx
import { WizardContainer } from '@/modules/host/components/FormWizard';

<WizardContainer
  entityType="community"
  draftId={draftId}
  onPublishSuccess={(profileId) => {
    router.push(`/profile/${profileId}`);
  }}
  onCancel={() => {
    router.back();
  }}
/>
```

### WizardProgress

Displays current step and allows navigation to completed steps.

**Features:**
- Visual step indicators with checkmarks
- Click to navigate to completed steps
- Responsive layout:
  - Desktop: Horizontal step indicators with labels
  - Mobile: Compact progress bar with step title
- Accessibility support

**Usage:**
```tsx
import { WizardProgress } from '@/modules/host/components/FormWizard';

<WizardProgress
  currentStep={3}
  totalSteps={6}
  completedSteps={new Set([1, 2])}
  stepLabels={[
    'Basic Identity',
    'Media & Branding',
    'Legal & Compliance',
    'Location & Operations',
    'Rich Description',
    'Review & Publish',
  ]}
  onStepClick={(step) => goToStep(step)}
/>
```

### WizardNavigation

Navigation controls for the wizard (Back, Next, Cancel, Publish).

**Features:**
- Back/Next navigation with validation
- Cancel button with unsaved changes warning
- Publish button on final step
- Loading states
- Responsive layout:
  - Desktop: Cancel | Back | Next/Publish (horizontal)
  - Mobile: Stacked buttons with primary action on top

**Usage:**
```tsx
import { WizardNavigation } from '@/modules/host/components/FormWizard';

<WizardNavigation
  currentStep={3}
  totalSteps={6}
  isFirstStep={false}
  isLastStep={false}
  isValidating={false}
  isPublishing={false}
  onBack={() => goToPreviousStep()}
  onNext={() => goToNextStep()}
  onCancel={() => handleCancel()}
  onPublish={() => handlePublish()}
/>
```

### WizardStep

Wrapper component that renders the appropriate step content.

**Features:**
- Dynamic step content rendering
- Props forwarding to step components
- Placeholder components for unimplemented steps

**Usage:**
```tsx
import { WizardStep } from '@/modules/host/components/FormWizard';

<WizardStep
  step={3}
  entityType="community"
  formData={formData}
  updateFormData={updateFormData}
  validationErrors={errors}
  getFieldError={getFieldError}
  isValidating={false}
/>
```

### AutoSaveIndicator

Displays auto-save status feedback.

**Features:**
- Status-based visual feedback (saving, saved, error)
- Smooth fade in/out animations
- Relative time display ("Saved 2 minutes ago")
- Fixed positioning:
  - Desktop: Bottom-right corner
  - Mobile: Bottom-center

**Usage:**
```tsx
import { AutoSaveIndicator } from '@/modules/host/components/AutoSaveIndicator';

<AutoSaveIndicator
  status="saved"
  lastSaved={new Date()}
/>
```

## Integration with Form State

The wizard components integrate with the form state management hooks:

```tsx
import { useFormWizard } from '@/modules/host/hooks/useFormWizard';
import { WizardContainer } from '@/modules/host/components/FormWizard';

function ProfileCreateScreen() {
  return (
    <WizardContainer
      entityType="community"
      onPublishSuccess={(profileId) => {
        // Navigate to profile
      }}
    />
  );
}
```

The `WizardContainer` internally uses:
- `useFormWizard` - Main form state management
- `useAutoSave` - Auto-save every 8 seconds
- `useDraftRecovery` - Restore incomplete forms

## Design System Compliance

All components follow the CulturePass design system:

- **Colors**: `useColors()` hook for theme-aware colors
- **Layout**: `useLayout()` hook for responsive breakpoints
- **Tokens**: `CultureTokens`, `Spacing`, `Radius`, `Elevation`
- **Components**: `Button` from design system
- **Typography**: `TextStyles` for consistent text styling

## Accessibility

All components include:
- `accessibilityRole` and `accessibilityLabel` attributes
- `accessibilityState` for interactive elements
- Keyboard navigation support
- Screen reader support
- Minimum touch target sizes (44×44 points)

## Mobile Responsiveness

Components adapt to screen sizes:
- **Mobile** (<768px): Vertical layout, compact UI
- **Tablet** (768-1023px): Optimized spacing
- **Desktop** (≥1024px): Horizontal layout, expanded UI

## Next Steps

The following step components need to be implemented:
1. `Step1Identity.tsx` - Basic identity fields
2. `Step2Media.tsx` - Media upload fields
3. `Step3Legal.tsx` - Legal/compliance fields
4. `Step4Location.tsx` - Location/operations fields
5. `Step5Description.tsx` - Rich description fields
6. `Step6Review.tsx` - Review and publish

These will be created in Task 4 (Wizard Steps).
