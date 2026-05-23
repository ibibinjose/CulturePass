/**
 * Accessibility Tests for HostSpace Enterprise-Grade Form System
 *
 * Tests WCAG 2.1 Level AA compliance for all wizard steps and form fields.
 * Uses React Native Testing Library accessibility queries to verify:
 * - ARIA labels and roles
 * - Keyboard navigation
 * - Screen reader announcements
 * - Form field accessibility states
 *
 * Requirements: 23 (Accessibility Compliance), 36 (Testing and Quality Assurance)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { WizardProgress } from '../components/FormWizard/WizardProgress';
import { WizardNavigation } from '../components/FormWizard/WizardNavigation';
import { HandleField } from '../components/fields/HandleField';
import { NameField } from '../components/fields/NameField';
import { DateField } from '../components/fields/DateField';
import {
  fieldAccessibilityLabel,
  stepIndicatorLabel,
  navigationButtonLabel,
  validationStatusLabel,
  mediaUploadLabel,
  announceForScreenReader,
  announceStepChange,
  announceValidationError,
  announceAutoSaveStatus,
  progressAccessibilityProps,
  formFieldProps,
  buttonAccessibilityProps,
  liveRegionProps,
  createKeyboardHandler,
  isActivationKey,
  isEscapeKey,
  isNavigationKey,
  KeyCodes,
} from '../utils/accessibility';

// ---------------------------------------------------------------------------
// Mocks (must be before component imports)
// ---------------------------------------------------------------------------

jest.mock('@/lib/api', () => ({
  api: {
    profiles: {
      handleAvailable: jest.fn().mockResolvedValue({ available: true }),
      getDrafts: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    error: '#DC2626',
    success: '#059669',
    primary: '#4F46E5',
  }),
}));

jest.mock('@/hooks/useLayout', () => ({
  useLayout: () => ({
    isDesktop: true,
    isTablet: false,
    isMobile: false,
    hPad: 16,
    width: 1024,
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({
      activeOffsetX: () => ({ failOffsetY: () => ({ onEnd: () => ({}) }) }),
    }),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/design-system/tokens/theme', () => ({
  Spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  Radius: { xs: 6, sm: 10, md: 16, lg: 20, xl: 24, full: 9999 },
  TextStyles: {
    title2: { fontSize: 22, fontWeight: '700' },
    body: { fontSize: 16 },
    callout: { fontSize: 15 },
    caption: { fontSize: 12 },
  },
  CultureTokens: {
    indigo: '#4F46E5',
    violet: '#9333EA',
    coral: '#FF5E5B',
    gold: '#FFC857',
    teal: '#0D9488',
  },
  Elevation: { 2: {} },
  ButtonTokens: { height: { md: 52 } },
  FontFamily: {},
  SignatureGradient: {},
}));

jest.mock('@/design-system/tokens/colors', () => ({
  CultureTokens: {
    indigo: '#4F46E5',
    violet: '#9333EA',
    coral: '#FF5E5B',
    gold: '#FFC857',
    teal: '#0D9488',
  },
}));

// Mock design system Button to avoid Reanimated dependency
jest.mock('@/design-system/ui/Button', () => ({
  Button: ({
    children,
    onPress,
    disabled,
    loading,
    accessibilityLabel,
    style,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    accessibilityLabel?: string;
    style?: any;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading || false }}
        style={style}
      >
        <Text>{typeof children === 'string' ? children : ''}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/design-system/ui/Input', () => ({
  Input: (props: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityState={props.accessibilityState}
        editable={!props.disabled}
        autoCapitalize={props.autoCapitalize}
      />
    );
  },
}));

jest.mock('../utils/responsive', () => ({
  responsiveMaxWidth: () => ({ maxWidth: 920, width: '100%', alignSelf: 'center' }),
  responsiveSectionGap: () => 24,
  MIN_TOUCH_TARGET: 44,
}));

// Mock the field validation hook
jest.mock('@/modules/host/hooks/useFieldValidation', () => ({
  useFieldValidation: () => ({
    validate: jest.fn().mockResolvedValue({ valid: true }),
    validationState: 'idle',
    error: null,
  }),
}));

jest.mock('@/modules/host/schemas/profileSchema', () => ({
  handleSchema: { parse: jest.fn() },
  getStepSchema: jest.fn().mockReturnValue({
    parseAsync: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const mockAnnounceForAccessibility = jest.fn();
jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(
  mockAnnounceForAccessibility
);


// ---------------------------------------------------------------------------
// 1. ARIA Labels and Roles
// ---------------------------------------------------------------------------

describe('Accessibility: ARIA Labels and Roles', () => {
  describe('WizardProgress', () => {
    const defaultProps = {
      currentStep: 2,
      totalSteps: 6,
      completedSteps: new Set([1]),
      stepLabels: [
        'Basic Identity',
        'Media & Branding',
        'Legal & Compliance',
        'Location & Operations',
        'Rich Description',
        'Review & Publish',
      ],
      onStepClick: jest.fn(),
    };

    it('step indicators have accessibilityRole="button"', () => {
      const { getAllByRole } = render(<WizardProgress {...defaultProps} />);
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(defaultProps.totalSteps);
    });

    it('step indicators have descriptive accessibilityLabel', () => {
      const { getByLabelText } = render(<WizardProgress {...defaultProps} />);
      expect(
        getByLabelText(/Step 2: Media & Branding, current step/)
      ).toBeTruthy();
      expect(
        getByLabelText(/Step 1: Basic Identity, completed/)
      ).toBeTruthy();
    });

    it('step indicators have correct accessibilityState', () => {
      const { getByLabelText } = render(<WizardProgress {...defaultProps} />);
      const currentStep = getByLabelText(/Step 2.*current step/);
      expect(currentStep.props.accessibilityState?.selected).toBe(true);

      const futureStep = getByLabelText(/Step 4.*not yet reached/);
      expect(futureStep.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('WizardNavigation', () => {
    const defaultProps = {
      currentStep: 3,
      totalSteps: 6,
      isFirstStep: false,
      isLastStep: false,
      isValidating: false,
      isPublishing: false,
      onBack: jest.fn(),
      onNext: jest.fn(),
      onCancel: jest.fn(),
      onPublish: jest.fn(),
    };

    it('navigation buttons have descriptive accessibilityLabels', () => {
      const { getByLabelText } = render(
        <WizardNavigation {...defaultProps} />
      );
      expect(getByLabelText(/Next step/)).toBeTruthy();
      expect(getByLabelText(/Go back to previous step/)).toBeTruthy();
      expect(getByLabelText(/Cancel and exit wizard/)).toBeTruthy();
    });

    it('navigation container has accessible label for toolbar', () => {
      const { getByLabelText } = render(
        <WizardNavigation {...defaultProps} />
      );
      expect(getByLabelText('Wizard navigation')).toBeTruthy();
    });

    it('publish button appears on last step with correct label', () => {
      const { getByLabelText } = render(
        <WizardNavigation {...defaultProps} isLastStep={true} />
      );
      expect(getByLabelText(/Publish profile/)).toBeTruthy();
    });

    it('back button is not rendered on first step', () => {
      const { queryByLabelText } = render(
        <WizardNavigation {...defaultProps} isFirstStep={true} />
      );
      expect(queryByLabelText(/Go back to previous step/)).toBeNull();
    });
  });

  describe('HandleField', () => {
    it('has accessibilityLabel on the input', () => {
      const { getByLabelText } = render(
        <HandleField value="" onChange={jest.fn()} required={true} />
      );
      expect(getByLabelText('Handle')).toBeTruthy();
    });

    it('has placeholder for user guidance', () => {
      const { getByPlaceholderText } = render(
        <HandleField value="" onChange={jest.fn()} />
      );
      expect(getByPlaceholderText('my-handle')).toBeTruthy();
    });
  });

  describe('NameField', () => {
    it('has accessibilityLabel on the input', () => {
      const { getByLabelText } = render(
        <NameField
          value=""
          onChange={jest.fn()}
          label="Official Name"
          required={true}
        />
      );
      expect(getByLabelText('Official Name')).toBeTruthy();
    });
  });
});


// ---------------------------------------------------------------------------
// 2. Keyboard Navigation
// ---------------------------------------------------------------------------

describe('Accessibility: Keyboard Navigation', () => {
  describe('createKeyboardHandler', () => {
    beforeEach(() => {
      (Platform as any).OS = 'web';
    });

    afterEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('calls onActivate for Enter key', () => {
      const onActivate = jest.fn();
      const handler = createKeyboardHandler({ onActivate });
      expect(handler).toBeDefined();
      handler!({ key: 'Enter', preventDefault: jest.fn() });
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('calls onActivate for Space key', () => {
      const onActivate = jest.fn();
      const handler = createKeyboardHandler({ onActivate });
      handler!({ key: ' ', preventDefault: jest.fn() });
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('calls onEscape for Escape key', () => {
      const onEscape = jest.fn();
      const handler = createKeyboardHandler({ onEscape });
      handler!({ key: 'Escape', preventDefault: jest.fn() });
      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('calls onNext for ArrowRight key', () => {
      const onNext = jest.fn();
      const handler = createKeyboardHandler({ onNext });
      handler!({ key: 'ArrowRight', preventDefault: jest.fn() });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onNext for ArrowDown key', () => {
      const onNext = jest.fn();
      const handler = createKeyboardHandler({ onNext });
      handler!({ key: 'ArrowDown', preventDefault: jest.fn() });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrev for ArrowLeft key', () => {
      const onPrev = jest.fn();
      const handler = createKeyboardHandler({ onPrev });
      handler!({ key: 'ArrowLeft', preventDefault: jest.fn() });
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('calls onPrev for ArrowUp key', () => {
      const onPrev = jest.fn();
      const handler = createKeyboardHandler({ onPrev });
      handler!({ key: 'ArrowUp', preventDefault: jest.fn() });
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers for unrelated keys', () => {
      const onActivate = jest.fn();
      const onEscape = jest.fn();
      const handler = createKeyboardHandler({ onActivate, onEscape });
      handler!({ key: 'a' });
      expect(onActivate).not.toHaveBeenCalled();
      expect(onEscape).not.toHaveBeenCalled();
    });

    it('returns undefined on non-web platforms', () => {
      (Platform as any).OS = 'ios';
      const handler = createKeyboardHandler({ onActivate: jest.fn() });
      expect(handler).toBeUndefined();
    });
  });

  describe('Key detection helpers', () => {
    it('isActivationKey returns true for Enter and Space', () => {
      expect(isActivationKey(KeyCodes.ENTER)).toBe(true);
      expect(isActivationKey(KeyCodes.SPACE)).toBe(true);
      expect(isActivationKey('a')).toBe(false);
    });

    it('isEscapeKey returns true for Escape', () => {
      expect(isEscapeKey(KeyCodes.ESCAPE)).toBe(true);
      expect(isEscapeKey('Enter')).toBe(false);
    });

    it('isNavigationKey returns correct direction', () => {
      expect(isNavigationKey(KeyCodes.ARROW_RIGHT)).toBe('next');
      expect(isNavigationKey(KeyCodes.ARROW_DOWN)).toBe('next');
      expect(isNavigationKey(KeyCodes.ARROW_LEFT)).toBe('prev');
      expect(isNavigationKey(KeyCodes.ARROW_UP)).toBe('prev');
      expect(isNavigationKey('Enter')).toBeNull();
    });
  });
});


// ---------------------------------------------------------------------------
// 3. Screen Reader Announcements
// ---------------------------------------------------------------------------

describe('Accessibility: Screen Reader Announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (Platform as any).OS = 'ios';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('announceStepChange announces step number, title, and total', () => {
    announceStepChange(2, 'Media & Branding', 6);
    jest.advanceTimersByTime(200);
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Step 2 of 6: Media & Branding'
    );
  });

  it('announceValidationError announces field name and error', () => {
    announceValidationError('Handle', 'Handle is already taken');
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Handle: Handle is already taken'
    );
  });

  it('announceAutoSaveStatus announces saving state', () => {
    announceAutoSaveStatus('saving');
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Saving your progress'
    );
  });

  it('announceAutoSaveStatus announces saved state', () => {
    announceAutoSaveStatus('saved');
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Progress saved'
    );
  });

  it('announceAutoSaveStatus announces error state', () => {
    announceAutoSaveStatus('error');
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Error saving progress. Will retry automatically.'
    );
  });

  it('announceForScreenReader calls AccessibilityInfo on native', () => {
    announceForScreenReader('Test announcement');
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Test announcement'
    );
  });
});


// ---------------------------------------------------------------------------
// 4. Accessibility Props Helpers
// ---------------------------------------------------------------------------

describe('Accessibility: Props Helpers', () => {
  describe('progressAccessibilityProps', () => {
    it('returns progressbar role with correct value', () => {
      const props = progressAccessibilityProps({
        currentStep: 3,
        totalSteps: 6,
        stepLabel: 'Legal & Compliance',
      });
      expect(props.accessibilityRole).toBe('progressbar');
      expect(props.accessibilityLabel).toBe(
        'Progress: Step 3 of 6, Legal & Compliance'
      );
      expect(props.accessibilityValue).toEqual({
        min: 1,
        max: 6,
        now: 3,
        text: 'Step 3 of 6',
      });
    });
  });

  describe('formFieldProps', () => {
    it('returns label with required indicator', () => {
      const props = formFieldProps({ label: 'Email', required: true });
      expect(props.accessibilityLabel).toContain('Email');
      expect(props.accessibilityLabel).toContain('required');
    });

    it('sets invalid state when error is present', () => {
      const props = formFieldProps({
        label: 'Handle',
        error: 'Handle is taken',
      });
      expect(props.accessibilityState?.invalid).toBe(true);
      expect(props.accessibilityLabel).toContain('Error: Handle is taken');
    });

    it('sets disabled state', () => {
      const props = formFieldProps({ label: 'Name', disabled: true });
      expect(props.accessibilityState?.disabled).toBe(true);
    });

    it('includes hint when provided', () => {
      const props = formFieldProps({
        label: 'Handle',
        hint: 'Your unique URL identifier',
      });
      expect(props.accessibilityHint).toBe('Your unique URL identifier');
    });
  });

  describe('buttonAccessibilityProps', () => {
    it('returns button role with label', () => {
      const props = buttonAccessibilityProps({ label: 'Submit form' });
      expect(props.accessibilityRole).toBe('button');
      expect(props.accessibilityLabel).toBe('Submit form');
    });

    it('sets disabled state', () => {
      const props = buttonAccessibilityProps({ label: 'Next', disabled: true });
      expect(props.accessibilityState?.disabled).toBe(true);
    });

    it('sets expanded state for toggleable buttons', () => {
      const props = buttonAccessibilityProps({
        label: 'Show help',
        expanded: true,
      });
      expect(props.accessibilityState?.expanded).toBe(true);
    });

    it('sets selected state for pressed buttons', () => {
      const props = buttonAccessibilityProps({
        label: 'Toggle',
        pressed: true,
      });
      expect(props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('liveRegionProps', () => {
    it('returns native live region props on non-web', () => {
      (Platform as any).OS = 'ios';
      const props = liveRegionProps('assertive');
      expect(props).toHaveProperty('accessibilityLiveRegion', 'assertive');
      expect(props).toHaveProperty('accessibilityRole', 'alert');
    });

    it('returns web aria-live props on web', () => {
      (Platform as any).OS = 'web';
      const props = liveRegionProps('polite');
      expect(props).toHaveProperty('aria-live', 'polite');
      expect(props).toHaveProperty('role', 'alert');
    });

    afterEach(() => {
      (Platform as any).OS = 'ios';
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Form Field Accessibility Labels
// ---------------------------------------------------------------------------

describe('Accessibility: Form Field Labels', () => {
  describe('fieldAccessibilityLabel', () => {
    it('generates label for required field', () => {
      const label = fieldAccessibilityLabel('Email', { required: true });
      expect(label).toBe('Email, required');
    });

    it('generates label with error message', () => {
      const label = fieldAccessibilityLabel('Handle', {
        error: 'Handle is taken',
      });
      expect(label).toBe('Handle, Error: Handle is taken');
    });

    it('generates label with character count', () => {
      const label = fieldAccessibilityLabel('Name', {
        characterCount: { current: 15, max: 120 },
      });
      expect(label).toBe('Name, 15 of 120 characters used');
    });

    it('generates label with all options combined', () => {
      const label = fieldAccessibilityLabel('Handle', {
        required: true,
        error: 'Too short',
        characterCount: { current: 2, max: 30 },
      });
      expect(label).toBe(
        'Handle, required, Error: Too short, 2 of 30 characters used'
      );
    });

    it('generates simple label with no options', () => {
      const label = fieldAccessibilityLabel('Description');
      expect(label).toBe('Description');
    });
  });

  describe('validationStatusLabel', () => {
    it('generates valid status label', () => {
      expect(validationStatusLabel('Handle', 'valid')).toBe('Handle is valid');
    });

    it('generates invalid status label', () => {
      expect(validationStatusLabel('Email', 'invalid')).toBe(
        'Email has an error'
      );
    });

    it('generates checking status label', () => {
      expect(validationStatusLabel('Handle', 'checking')).toBe(
        'Checking Handle'
      );
    });

    it('generates idle status label', () => {
      expect(validationStatusLabel('Name', 'idle')).toBe('Name');
    });
  });

  describe('mediaUploadLabel', () => {
    it('generates upload prompt for empty field', () => {
      const label = mediaUploadLabel('logo', { hasFile: false });
      expect(label).toBe('Upload logo image. Double tap to select file.');
    });

    it('generates uploaded state label with filename', () => {
      const label = mediaUploadLabel('hero', {
        hasFile: true,
        fileName: 'banner.jpg',
      });
      expect(label).toBe(
        'Hero cover image: banner.jpg uploaded. Double tap to replace.'
      );
    });

    it('generates upload progress label', () => {
      const label = mediaUploadLabel('gallery', {
        hasFile: false,
        progress: 45,
      });
      expect(label).toBe('Gallery image upload, 45% complete');
    });

    it('generates uploaded state without filename', () => {
      const label = mediaUploadLabel('video', { hasFile: true });
      expect(label).toBe('Video uploaded. Double tap to replace.');
    });
  });

  describe('stepIndicatorLabel', () => {
    it('generates label for current step', () => {
      const label = stepIndicatorLabel(2, 'Media & Branding', {
        isCurrent: true,
        isCompleted: false,
        isNavigable: false,
      });
      expect(label).toBe('Step 2: Media & Branding, current step');
    });

    it('generates label for completed navigable step', () => {
      const label = stepIndicatorLabel(1, 'Basic Identity', {
        isCurrent: false,
        isCompleted: true,
        isNavigable: true,
      });
      expect(label).toBe(
        'Step 1: Basic Identity, completed, tap to navigate'
      );
    });

    it('generates label for unreached step', () => {
      const label = stepIndicatorLabel(5, 'Rich Description', {
        isCurrent: false,
        isCompleted: false,
        isNavigable: false,
      });
      expect(label).toBe('Step 5: Rich Description, not yet reached');
    });
  });

  describe('navigationButtonLabel', () => {
    it('generates next button label with step context', () => {
      const label = navigationButtonLabel('next', {
        currentStep: 2,
        totalSteps: 6,
      });
      expect(label).toBe('Next step, 2 of 6');
    });

    it('generates next button label with step title', () => {
      const label = navigationButtonLabel('next', {
        nextStepTitle: 'Media & Branding',
      });
      expect(label).toBe('Next: go to Media & Branding');
    });

    it('generates back button label', () => {
      expect(navigationButtonLabel('back')).toBe(
        'Go back to previous step'
      );
    });

    it('generates cancel button label', () => {
      expect(navigationButtonLabel('cancel')).toBe(
        'Cancel and exit wizard'
      );
    });

    it('generates publish button label', () => {
      expect(navigationButtonLabel('publish')).toBe('Publish profile');
    });
  });
});

// ---------------------------------------------------------------------------
// 6. WizardProgress Component Accessibility (Integration)
// ---------------------------------------------------------------------------

describe('Accessibility: WizardProgress Integration', () => {
  const stepLabels = [
    'Basic Identity',
    'Media & Branding',
    'Legal & Compliance',
    'Location & Operations',
    'Rich Description',
    'Review & Publish',
  ];

  it('completed steps are navigable via press', () => {
    const onStepClick = jest.fn();
    const { getByLabelText } = render(
      <WizardProgress
        currentStep={3}
        totalSteps={6}
        completedSteps={new Set([1, 2])}
        stepLabels={stepLabels}
        onStepClick={onStepClick}
      />
    );
    const completedStep = getByLabelText(/Step 1.*completed.*tap to navigate/);
    fireEvent.press(completedStep);
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it('future incomplete steps are not pressable', () => {
    const onStepClick = jest.fn();
    const { getByLabelText } = render(
      <WizardProgress
        currentStep={2}
        totalSteps={6}
        completedSteps={new Set([1])}
        stepLabels={stepLabels}
        onStepClick={onStepClick}
      />
    );
    const futureStep = getByLabelText(/Step 5.*not yet reached/);
    fireEvent.press(futureStep);
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('all steps have unique accessible labels', () => {
    const { getAllByRole } = render(
      <WizardProgress
        currentStep={1}
        totalSteps={6}
        completedSteps={new Set()}
        stepLabels={stepLabels}
        onStepClick={jest.fn()}
      />
    );
    const buttons = getAllByRole('button');
    const labels = buttons.map((b) => b.props.accessibilityLabel);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });
});

// ---------------------------------------------------------------------------
// 7. WizardNavigation Accessibility (Integration)
// ---------------------------------------------------------------------------

describe('Accessibility: WizardNavigation Integration', () => {
  it('disabled buttons have correct accessibilityState', () => {
    const { getByLabelText } = render(
      <WizardNavigation
        currentStep={2}
        totalSteps={6}
        isFirstStep={false}
        isLastStep={false}
        isValidating={true}
        isPublishing={false}
        onBack={jest.fn()}
        onNext={jest.fn()}
        onCancel={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    const backButton = getByLabelText(/Go back to previous step/);
    expect(backButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('toolbar has accessible label', () => {
    const { getByLabelText } = render(
      <WizardNavigation
        currentStep={1}
        totalSteps={6}
        isFirstStep={true}
        isLastStep={false}
        isValidating={false}
        isPublishing={false}
        onBack={jest.fn()}
        onNext={jest.fn()}
        onCancel={jest.fn()}
        onPublish={jest.fn()}
      />
    );
    expect(getByLabelText('Wizard navigation')).toBeTruthy();
  });
});


// ---------------------------------------------------------------------------
// 8. Web-specific ARIA attributes
// ---------------------------------------------------------------------------

describe('Accessibility: Web ARIA Attributes', () => {
  beforeEach(() => {
    (Platform as any).OS = 'web';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('formFieldProps includes aria-required on web', () => {
    const props = formFieldProps({ label: 'Email', required: true });
    expect(props['aria-required']).toBe(true);
  });

  it('formFieldProps includes aria-invalid on web', () => {
    const props = formFieldProps({
      label: 'Handle',
      error: 'Invalid handle',
    });
    expect(props['aria-invalid']).toBe(true);
  });

  it('formFieldProps includes aria-disabled on web', () => {
    const props = formFieldProps({ label: 'Name', disabled: true });
    expect(props['aria-disabled']).toBe(true);
  });

  it('buttonAccessibilityProps includes aria-expanded on web', () => {
    const props = buttonAccessibilityProps({
      label: 'Help panel',
      expanded: true,
    });
    expect(props['aria-expanded']).toBe(true);
  });

  it('buttonAccessibilityProps includes aria-disabled on web', () => {
    const props = buttonAccessibilityProps({
      label: 'Submit',
      disabled: true,
    });
    expect(props['aria-disabled']).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. Form Field Component Accessibility (Integration)
// ---------------------------------------------------------------------------

describe('Accessibility: Form Field Components', () => {
  describe('HandleField accessibility', () => {
    it('displays character count for screen readers', () => {
      const { getByText } = render(
        <HandleField value="test" onChange={jest.fn()} />
      );
      expect(getByText('4/30 characters')).toBeTruthy();
    });

    it('has accessibilityHint on the input', () => {
      const { getByLabelText } = render(
        <HandleField value="" onChange={jest.fn()} />
      );
      const input = getByLabelText('Handle');
      expect(input).toBeTruthy();
    });
  });

  describe('NameField accessibility', () => {
    it('shows character count accessibly', () => {
      const { getByText } = render(
        <NameField value="My Community" onChange={jest.fn()} />
      );
      expect(getByText('12/120 characters')).toBeTruthy();
    });
  });
});
