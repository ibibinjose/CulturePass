import {
  isCreationLabDestination,
  normalizeTabShortcut,
  resolvePostOnboardingDestination,
  labelForOnboardingDestination,
} from '../onboardingDestination';

describe('onboardingDestination', () => {
  test('normalizeTabShortcut maps marketing paths to tab routes', () => {
    expect(normalizeTabShortcut('/community')).toBe('/(tabs)/community');
    expect(normalizeTabShortcut('/community?foo=1')).toBe('/(tabs)/community?foo=1');
  });

  test('resolvePostOnboardingDestination prefers redirect over creation lab', () => {
    expect(resolvePostOnboardingDestination('/community')).toBe('/(tabs)/community');
    expect(resolvePostOnboardingDestination('/(tabs)/community')).toBe('/(tabs)/community');
    expect(resolvePostOnboardingDestination(null)).toBe('/hostspace/create');
    expect(resolvePostOnboardingDestination('/pages/create')).toBe('/hostspace/create');
  });

  test('isCreationLabDestination detects creation lab paths', () => {
    expect(isCreationLabDestination(null)).toBe(true);
    expect(isCreationLabDestination('/pages/create')).toBe(true);
    expect(isCreationLabDestination('/(tabs)/community')).toBe(false);
  });

  test('labelForOnboardingDestination returns friendly labels', () => {
    expect(labelForOnboardingDestination('/(tabs)/community')).toBe('Community');
    expect(labelForOnboardingDestination('/pages/create')).toBe('Create a Page');
  });
});