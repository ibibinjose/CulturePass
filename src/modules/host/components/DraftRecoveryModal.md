# DraftRecoveryModal Component

## Overview

The `DraftRecoveryModal` component provides a user interface for selecting and recovering incomplete profile drafts. It displays a list of available drafts with metadata including entity type, last modified timestamp, and completion progress.

## Features

- **Draft List Display**: Shows all available drafts with rich metadata
- **Entity Type Badges**: Color-coded badges for each entity type (community, organiser, venue, business, artist, professional)
- **Progress Indicators**: Visual progress bars showing completion percentage
- **Last Modified Timestamps**: Human-readable timestamps (e.g., "2 hours ago")
- **Current Step Display**: Shows which wizard step the draft is currently on
- **Multiple Actions**: Continue most recent, select specific draft, start fresh, or dismiss
- **Mobile-Responsive**: Works on screens from 320px to 2560px width
- **Accessibility**: WCAG 2.1 Level AA compliant with proper labels and roles

## Usage

### Basic Usage

```tsx
import { DraftRecoveryModal } from '@/modules/host/components/DraftRecoveryModal';
import { useDraftRecovery } from '@/modules/host/hooks/useDraftRecovery';

function MyComponent() {
  const {
    drafts,
    showRecoveryModal,
    handleSelectDraft,
    handleStartFresh,
    handleDismiss,
  } = useDraftRecovery({
    entityType: 'community',
    onSelectDraft: (draft) => {
      // Load draft into form
      console.log('Loading draft:', draft.id);
    },
    onStartFresh: () => {
      // Start with empty form
      console.log('Starting fresh');
    },
  });

  return (
    <DraftRecoveryModal
      visible={showRecoveryModal}
      drafts={drafts}
      onSelectDraft={handleSelectDraft}
      onStartFresh={handleStartFresh}
      onDismiss={handleDismiss}
    />
  );
}
```

### Integration with WizardContainer

The `DraftRecoveryModal` is automatically integrated into the `WizardContainer` component:

```tsx
import { WizardContainer } from '@/modules/host/components/FormWizard/WizardContainer';

function CreateProfileScreen() {
  return (
    <WizardContainer
      entityType="community"
      onPublishSuccess={(profileId) => {
        router.push(`/profile/${profileId}`);
      }}
    />
  );
}
```

The modal will automatically appear when:
1. The user navigates to the wizard
2. There are existing drafts for the entity type
3. No specific draft or profile is being loaded

## Props

### DraftRecoveryModalProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Whether the modal is visible |
| `drafts` | `ProfileDraft[]` | Yes | List of available drafts |
| `onSelectDraft` | `(draftId: string) => void` | Yes | Callback when a draft is selected |
| `onStartFresh` | `() => void` | Yes | Callback when user chooses to start fresh |
| `onDismiss` | `() => void` | Yes | Callback when modal is dismissed |

### ProfileDraft Type

```typescript
interface ProfileDraft {
  id: string;
  userId: string;
  entityType: string;
  formData: Partial<Profile>;
  currentStep: number;
  completedSteps: number[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}
```

## Entity Types

The modal supports six entity types, each with its own icon and color:

| Entity Type | Icon | Color |
|-------------|------|-------|
| Community | `people` | Indigo (`#4F46E5`) |
| Organiser | `calendar` | Violet (`#9333EA`) |
| Venue | `location` | Coral (`#FF5E5B`) |
| Business | `storefront` | Teal (`#0D9488`) |
| Artist | `color-palette` | Gold (`#FFC857`) |
| Professional | `briefcase` | Indigo (`#4F46E5`) |

## Helper Functions

The component uses several helper functions from `useDraftRecovery.ts`:

### formatDraftAge(updatedAt: string): string

Formats a timestamp into a human-readable age string.

**Examples:**
- `"Just now"` (< 1 minute)
- `"5 minutes ago"`
- `"2 hours ago"`
- `"3 days ago"`
- `"Jan 15, 2026"` (> 30 days)

### calculateDraftCompletion(draft: ProfileDraft): number

Calculates the completion percentage based on completed steps.

**Formula:** `(completedSteps.length / 6) * 100`

**Examples:**
- 1 completed step = 17%
- 3 completed steps = 50%
- 6 completed steps = 100%

### getDraftStepLabel(step: number): string

Returns the label for a wizard step.

**Step Labels:**
1. Basic Identity
2. Media & Branding
3. Legal & Compliance
4. Location & Operations
5. Rich Description
6. Review & Publish

## Design System Compliance

The component follows the CulturePass design system:

### Colors
- Uses `useColors()` hook for theme-aware colors
- Entity type colors from `CultureTokens`
- Signature violet (`#9333EA`) for primary actions

### Spacing
- Uses `Spacing` tokens from design system
- Consistent padding and margins

### Radius
- Modal: `Radius.xl` (24px)
- Cards: `Radius.lg` (20px)
- Badges: `Radius.sm` (10px)
- Buttons: `Radius.full` (9999px)

### Typography
- Uses `TextStyles` from design system
- Proper hierarchy with title2, callout, body, caption

### Shadows
- Platform-specific shadows
- Web: CSS box-shadow
- Native: shadowColor, shadowOffset, shadowOpacity, shadowRadius

## Accessibility

The component implements WCAG 2.1 Level AA compliance:

### Semantic HTML/Native Elements
- Proper `accessibilityRole` attributes
- Header with `aria-level={1}`
- Buttons with descriptive labels

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus management

### Screen Reader Support
- Descriptive `accessibilityLabel` for all buttons
- Draft cards announce: "Continue [Entity Type] draft, [X]% complete, last modified [time ago]"

### Color Contrast
- Text colors meet WCAG AA contrast ratios
- Entity type badges use sufficient contrast

## Mobile Responsiveness

The modal is fully responsive:

### Small Screens (320px - 767px)
- Full-width modal with padding
- Vertical stack layout
- Touch-optimized button sizes (44pt minimum)

### Medium Screens (768px - 1023px)
- Centered modal with max-width 480px
- Comfortable padding

### Large Screens (1024px+)
- Centered modal with max-width 480px
- Desktop-optimized interactions

## Performance Considerations

### Rendering Optimization
- Modal only renders when `visible={true}`
- Efficient list rendering with keys
- No unnecessary re-renders

### Data Loading
- Drafts are fetched via TanStack Query
- Automatic caching and stale-time management
- Expired drafts (> 90 days) are filtered out

### Memory Management
- Component unmounts cleanly
- No memory leaks from event listeners

## Testing

The component includes comprehensive unit tests:

```bash
# Run tests (if test runner is configured)
npm test -- src/modules/host/components/__tests__/DraftRecoveryModal.test.tsx
```

### Test Coverage
- ✅ Visibility toggle
- ✅ Draft list rendering
- ✅ Draft selection
- ✅ Start fresh action
- ✅ Dismiss action
- ✅ Progress calculation
- ✅ Step labels
- ✅ Entity type badges
- ✅ Singular/plural draft count

## Future Enhancements

Potential improvements for future iterations:

1. **Draft Deletion**: Allow users to delete old drafts
2. **Draft Comparison**: Show diff between drafts
3. **Draft Merging**: Merge data from multiple drafts
4. **Draft Sharing**: Share drafts across team members
5. **Draft Templates**: Save drafts as reusable templates
6. **Draft Search**: Search/filter drafts by name or type
7. **Draft Sorting**: Sort by date, progress, or entity type
8. **Draft Preview**: Quick preview of draft content
9. **Draft Expiry Warning**: Warn when drafts are about to expire
10. **Draft Auto-Save Indicator**: Show which draft is currently auto-saving

## Related Components

- `WizardContainer`: Main wizard orchestrator
- `AutoSaveIndicator`: Shows auto-save status
- `useDraftRecovery`: Hook for draft recovery logic
- `useFormWizard`: Hook for form wizard state

## Related Documentation

- [Requirements Document](/.kiro/specs/hostspace-enterprise-forms/requirements.md) - Requirement 3
- [Design Document](/.kiro/specs/hostspace-enterprise-forms/design.md) - Draft Recovery System
- [Tasks Document](/.kiro/specs/hostspace-enterprise-forms/tasks.md) - Task 7.1
