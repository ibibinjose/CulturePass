import assert from 'node:assert/strict';
import { redirectSystemPath } from '../src/app/+native-intent';
import { sanitizeInternalRedirect } from '../src/lib/routes';

const cases: { input: string; initial?: boolean; expected: string }[] = [
  { input: '/events/e1', expected: '/e/e1' },
  { input: '/artists/a1', expected: '/t/a1' },
  { input: '/communities/c1?ref=push', expected: '/c/c1?ref=push' },
  { input: '/profiles/p1', expected: '/profile/p1' },
  { input: '/users/u1', expected: '/u/u1' },
  { input: '/businesses/b1', expected: '/b/b1' },
  { input: 'https://culturepass.app/event/e1?ref=email', expected: '/e/e1?ref=email' },
  { input: 'https://www.culturepass.app/restaurants', expected: '/restaurants' },
  { input: 'culturepass://event/e1', expected: '/e/e1' },
  { input: 'culturepass://home', initial: true, expected: '/(tabs)' },
  { input: 'https://example.com/event/e1', expected: '/' },
  { input: '/home', initial: true, expected: '/(tabs)' },
  { input: '/tickets/t1', expected: '/tickets/t1' },
];

for (const test of cases) {
  const actual = redirectSystemPath({ path: test.input, initial: Boolean(test.initial) });
  assert.equal(actual, test.expected, `Expected ${test.input} => ${test.expected}, got ${actual}`);
}

assert.equal(redirectSystemPath({ path: '', initial: false }), '/');
assert.equal(sanitizeInternalRedirect('/events/e1?ref=push'), '/e/e1?ref=push');
assert.equal(sanitizeInternalRedirect('/(onboarding)/login'), null);
assert.equal(sanitizeInternalRedirect('https://culturepass.app/event/e1'), null);

console.log('native-intent route normalization checks passed');
