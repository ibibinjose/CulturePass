import { describe, it, expect } from '@jest/globals';
import {
  isLocalOnboardingMidFlow,
  isServerOnboardingProfileComplete,
} from '../onboardingCompletion';

describe('onboardingCompletion', () => {
  it('detects complete server profile', () => {
    expect(
      isServerOnboardingProfileComplete({
        city: 'Sydney',
        country: 'Australia',
        interests: ['a', 'b', 'c', 'd', 'e'],
      }),
    ).toBe(true);
  });

  it('rejects incomplete server profile', () => {
    expect(
      isServerOnboardingProfileComplete({
        city: 'Sydney',
        country: 'Australia',
        interests: ['a'],
      }),
    ).toBe(false);
  });

  it('detects local mid-flow onboarding', () => {
    expect(
      isLocalOnboardingMidFlow(
        { city: 'Sydney', country: 'Australia', interests: ['a'] },
        0,
      ),
    ).toBe(true);
  });

  it('allows auto-complete for returning users with empty local state', () => {
    expect(isLocalOnboardingMidFlow({ city: '', country: '', interests: [] }, 5)).toBe(false);
  });
});