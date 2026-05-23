/**
 * Property-Based Tests for InlineRetryManager
 *
 * **Validates: Requirements 12.7**
 *
 * Property 25: Inline Retry Collapse Logic
 * For any sequence of retry attempts on a Discover Tab section, the section
 * SHALL collapse (become hidden with a notice) if and only if 2 consecutive
 * retry attempts fail. A successful retry at any point SHALL reset the
 * consecutive failure counter.
 */

import * as fc from 'fast-check';

import { createInlineRetryManager } from '../inline-retry-manager';
import type { InlineRetryManagerInterface } from '../inline-retry-manager';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary action: either a 'success' or 'failure' retry attempt. */
const actionArb = fc.oneof(fc.constant('success' as const), fc.constant('failure' as const));

/** Arbitrary non-empty sequence of actions. */
const actionSequenceArb = fc.array(actionArb, { minLength: 1, maxLength: 50 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replays a sequence of actions on a fresh manager and returns the final state.
 */
function replaySequence(
  actions: ReadonlyArray<'success' | 'failure'>,
  sectionKey: string = 'test-section'
): { manager: InlineRetryManagerInterface; isCollapsed: boolean; consecutiveFailures: number } {
  const manager = createInlineRetryManager();
  let lastState = manager.getState(sectionKey);

  for (const action of actions) {
    if (action === 'failure') {
      lastState = manager.recordFailure(sectionKey);
    } else {
      lastState = manager.recordSuccess(sectionKey);
    }
  }

  return {
    manager,
    isCollapsed: lastState.isCollapsed,
    consecutiveFailures: lastState.consecutiveFailures,
  };
}

/**
 * Counts the number of trailing consecutive failures in a sequence.
 */
function trailingConsecutiveFailures(actions: ReadonlyArray<'success' | 'failure'>): number {
  let count = 0;
  for (let i = actions.length - 1; i >= 0; i--) {
    if (actions[i] === 'failure') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('InlineRetryManager — Property 25: Inline Retry Collapse Logic', () => {
  it('isCollapsed is true iff the last 2+ actions were all failures', () => {
    fc.assert(
      fc.property(actionSequenceArb, (actions) => {
        const { isCollapsed } = replaySequence(actions);
        const trailing = trailingConsecutiveFailures(actions);

        // Section collapses iff 2 or more consecutive trailing failures
        expect(isCollapsed).toBe(trailing >= 2);
      }),
      { numRuns: 200 }
    );
  });

  it('a success anywhere in the sequence resets the consecutive failure counter', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant('failure' as const), { minLength: 1, maxLength: 10 }),
        fc.array(actionArb, { minLength: 0, maxLength: 10 }),
        (failurePrefix, suffix) => {
          // Start with some failures, then inject a success, then apply suffix
          const actions: Array<'success' | 'failure'> = [
            ...failurePrefix,
            'success',
            ...suffix,
          ];

          const { consecutiveFailures } = replaySequence(actions);
          const trailing = trailingConsecutiveFailures(actions);

          // The consecutive failure count should match trailing failures after the last success
          expect(consecutiveFailures).toBe(trailing);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('the collapse threshold is exactly 2 (not 1, not 3)', () => {
    fc.assert(
      fc.property(
        fc.array(actionArb, { minLength: 0, maxLength: 20 }),
        (prefix) => {
          const sectionKey = 'threshold-test';

          // Apply prefix then test the exact threshold boundary
          const manager = createInlineRetryManager();
          for (const action of prefix) {
            if (action === 'failure') {
              manager.recordFailure(sectionKey);
            } else {
              manager.recordSuccess(sectionKey);
            }
          }

          // Reset to known state
          manager.reset(sectionKey);

          // 1 failure: NOT collapsed
          const after1 = manager.recordFailure(sectionKey);
          expect(after1.isCollapsed).toBe(false);
          expect(after1.consecutiveFailures).toBe(1);

          // 2 failures: collapsed
          const after2 = manager.recordFailure(sectionKey);
          expect(after2.isCollapsed).toBe(true);
          expect(after2.consecutiveFailures).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple sections are independent', () => {
    fc.assert(
      fc.property(
        actionSequenceArb,
        actionSequenceArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (actionsA, actionsB, keyA, keyB) => {
          // Ensure distinct keys
          const sectionA = `section-${keyA}-a`;
          const sectionB = `section-${keyB}-b`;

          const manager = createInlineRetryManager();

          // Apply actions to section A
          for (const action of actionsA) {
            if (action === 'failure') {
              manager.recordFailure(sectionA);
            } else {
              manager.recordSuccess(sectionA);
            }
          }

          // Apply actions to section B
          for (const action of actionsB) {
            if (action === 'failure') {
              manager.recordFailure(sectionB);
            } else {
              manager.recordSuccess(sectionB);
            }
          }

          // Each section's state should reflect only its own actions
          const trailingA = trailingConsecutiveFailures(actionsA);
          const trailingB = trailingConsecutiveFailures(actionsB);

          expect(manager.isCollapsed(sectionA)).toBe(trailingA >= 2);
          expect(manager.isCollapsed(sectionB)).toBe(trailingB >= 2);

          const stateA = manager.getState(sectionA);
          const stateB = manager.getState(sectionB);

          expect(stateA.consecutiveFailures).toBe(trailingA);
          expect(stateB.consecutiveFailures).toBe(trailingB);
        }
      ),
      { numRuns: 100 }
    );
  });
});
