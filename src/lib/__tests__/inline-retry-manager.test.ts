/**
 * InlineRetryManager Tests
 *
 * Tests for consecutive failure tracking, collapse logic,
 * success reset behavior, and multi-section independence.
 */

import { createInlineRetryManager, inlineRetryManager } from '../inline-retry-manager';
import type { InlineRetryManagerInterface } from '../inline-retry-manager';

// ---------------------------------------------------------------------------
// Factory / Fresh Instance Tests
// ---------------------------------------------------------------------------

describe('createInlineRetryManager', () => {
  let manager: InlineRetryManagerInterface;

  beforeEach(() => {
    manager = createInlineRetryManager();
  });

  describe('initial state', () => {
    it('returns default state for unknown section', () => {
      const state = manager.getState('unknown-section');
      expect(state.consecutiveFailures).toBe(0);
      expect(state.isCollapsed).toBe(false);
      expect(state.lastAttemptTimestamp).toBe(0);
    });

    it('reports section as not collapsed when never tracked', () => {
      expect(manager.isCollapsed('new-section')).toBe(false);
    });
  });

  describe('recordFailure', () => {
    it('increments consecutive failures on first failure', () => {
      const state = manager.recordFailure('rail-a');
      expect(state.consecutiveFailures).toBe(1);
      expect(state.isCollapsed).toBe(false);
    });

    it('collapses section after 2 consecutive failures', () => {
      manager.recordFailure('rail-a');
      const state = manager.recordFailure('rail-a');
      expect(state.consecutiveFailures).toBe(2);
      expect(state.isCollapsed).toBe(true);
    });

    it('remains collapsed after more than 2 consecutive failures', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      const state = manager.recordFailure('rail-a');
      expect(state.consecutiveFailures).toBe(3);
      expect(state.isCollapsed).toBe(true);
    });

    it('sets lastAttemptTimestamp to a recent value', () => {
      const before = Date.now();
      const state = manager.recordFailure('rail-a');
      const after = Date.now();
      expect(state.lastAttemptTimestamp).toBeGreaterThanOrEqual(before);
      expect(state.lastAttemptTimestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('recordSuccess', () => {
    it('resets consecutive failures to 0', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      const state = manager.recordSuccess('rail-a');
      expect(state.consecutiveFailures).toBe(0);
      expect(state.isCollapsed).toBe(false);
    });

    it('resets collapsed state even after collapse', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(true);

      manager.recordSuccess('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(false);
    });

    it('works on a section that was never tracked', () => {
      const state = manager.recordSuccess('new-section');
      expect(state.consecutiveFailures).toBe(0);
      expect(state.isCollapsed).toBe(false);
    });

    it('sets lastAttemptTimestamp to a recent value', () => {
      const before = Date.now();
      const state = manager.recordSuccess('rail-a');
      const after = Date.now();
      expect(state.lastAttemptTimestamp).toBeGreaterThanOrEqual(before);
      expect(state.lastAttemptTimestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('isCollapsed', () => {
    it('returns false after 1 failure', () => {
      manager.recordFailure('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(false);
    });

    it('returns true after 2 consecutive failures', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(true);
    });

    it('returns false after success resets the counter', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      manager.recordSuccess('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears state for a specific section', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      manager.reset('rail-a');

      const state = manager.getState('rail-a');
      expect(state.consecutiveFailures).toBe(0);
      expect(state.isCollapsed).toBe(false);
      expect(state.lastAttemptTimestamp).toBe(0);
    });

    it('does not affect other sections', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-b');

      manager.reset('rail-a');

      expect(manager.isCollapsed('rail-a')).toBe(false);
      expect(manager.getState('rail-b').consecutiveFailures).toBe(1);
    });
  });

  describe('resetAll', () => {
    it('clears state for all sections', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-b');
      manager.recordFailure('rail-b');

      manager.resetAll();

      expect(manager.isCollapsed('rail-a')).toBe(false);
      expect(manager.isCollapsed('rail-b')).toBe(false);
      expect(manager.getState('rail-a').consecutiveFailures).toBe(0);
      expect(manager.getState('rail-b').consecutiveFailures).toBe(0);
    });
  });

  describe('multi-section independence', () => {
    it('tracks sections independently', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-b');
      manager.recordFailure('rail-b');

      expect(manager.getState('rail-a').consecutiveFailures).toBe(1);
      expect(manager.isCollapsed('rail-a')).toBe(false);
      expect(manager.getState('rail-b').consecutiveFailures).toBe(2);
      expect(manager.isCollapsed('rail-b')).toBe(true);
    });

    it('success on one section does not affect another', () => {
      manager.recordFailure('rail-a');
      manager.recordFailure('rail-a');
      manager.recordSuccess('rail-b');

      expect(manager.isCollapsed('rail-a')).toBe(true);
      expect(manager.isCollapsed('rail-b')).toBe(false);
    });
  });

  describe('failure-success-failure sequence', () => {
    it('requires 2 NEW consecutive failures after a success to collapse again', () => {
      // Fail once, succeed, then need 2 more failures to collapse
      manager.recordFailure('rail-a');
      manager.recordSuccess('rail-a');
      manager.recordFailure('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(false);

      manager.recordFailure('rail-a');
      expect(manager.isCollapsed('rail-a')).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Singleton Export Test
// ---------------------------------------------------------------------------

describe('inlineRetryManager singleton', () => {
  beforeEach(() => {
    inlineRetryManager.resetAll();
  });

  it('is a valid InlineRetryManager instance', () => {
    expect(inlineRetryManager.recordFailure).toBeDefined();
    expect(inlineRetryManager.recordSuccess).toBeDefined();
    expect(inlineRetryManager.getState).toBeDefined();
    expect(inlineRetryManager.isCollapsed).toBeDefined();
    expect(inlineRetryManager.reset).toBeDefined();
    expect(inlineRetryManager.resetAll).toBeDefined();
  });

  it('tracks state correctly', () => {
    inlineRetryManager.recordFailure('test-section');
    inlineRetryManager.recordFailure('test-section');
    expect(inlineRetryManager.isCollapsed('test-section')).toBe(true);
  });
});
