/**
 * InlineRetryManager — Tracks per-section retry state for partial page failures.
 *
 * Used by DiscoverRailErrorBoundary to determine when a section should collapse
 * after consecutive failures. A section collapses (becomes hidden with a
 * "temporarily unavailable" notice) if and only if 2 consecutive retry attempts fail.
 * A successful retry at any point resets the consecutive failure counter.
 *
 * This is a pure utility — no React dependencies.
 *
 * Usage:
 *   import { inlineRetryManager } from '@/lib/inline-retry-manager';
 *   const state = inlineRetryManager.recordFailure('community-events-rail');
 *   if (state.isCollapsed) { // show "temporarily unavailable" notice }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** State of a single section's retry tracking. */
export interface InlineRetryState {
  consecutiveFailures: number;
  isCollapsed: boolean;
  lastAttemptTimestamp: number;
}

/** Public interface for the InlineRetryManager. */
export interface InlineRetryManagerInterface {
  /** Record a failure for a section. Returns updated state. */
  recordFailure(sectionKey: string): InlineRetryState;
  /** Record a success for a section. Resets failure counter. */
  recordSuccess(sectionKey: string): InlineRetryState;
  /** Get current state for a section. */
  getState(sectionKey: string): InlineRetryState;
  /** Check if a section should be collapsed (2+ consecutive failures). */
  isCollapsed(sectionKey: string): boolean;
  /** Reset state for a section. */
  reset(sectionKey: string): void;
  /** Reset all sections. */
  resetAll(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of consecutive failures required to collapse a section. */
const COLLAPSE_THRESHOLD = 2;

// ---------------------------------------------------------------------------
// Default State
// ---------------------------------------------------------------------------

/** Returns the initial state for a section that has never been tracked. */
function getDefaultState(): InlineRetryState {
  return {
    consecutiveFailures: 0,
    isCollapsed: false,
    lastAttemptTimestamp: 0,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a new InlineRetryManager instance.
 * Each instance maintains its own independent state map.
 */
export function createInlineRetryManager(): InlineRetryManagerInterface {
  const stateMap = new Map<string, InlineRetryState>();

  function recordFailure(sectionKey: string): InlineRetryState {
    const current = stateMap.get(sectionKey) ?? getDefaultState();
    const consecutiveFailures = current.consecutiveFailures + 1;
    const updated: InlineRetryState = {
      consecutiveFailures,
      isCollapsed: consecutiveFailures >= COLLAPSE_THRESHOLD,
      lastAttemptTimestamp: Date.now(),
    };
    stateMap.set(sectionKey, updated);
    return updated;
  }

  function recordSuccess(sectionKey: string): InlineRetryState {
    const updated: InlineRetryState = {
      consecutiveFailures: 0,
      isCollapsed: false,
      lastAttemptTimestamp: Date.now(),
    };
    stateMap.set(sectionKey, updated);
    return updated;
  }

  function getState(sectionKey: string): InlineRetryState {
    return stateMap.get(sectionKey) ?? getDefaultState();
  }

  function isCollapsed(sectionKey: string): boolean {
    const state = stateMap.get(sectionKey);
    if (!state) return false;
    return state.isCollapsed;
  }

  function reset(sectionKey: string): void {
    stateMap.delete(sectionKey);
  }

  function resetAll(): void {
    stateMap.clear();
  }

  return {
    recordFailure,
    recordSuccess,
    getState,
    isCollapsed,
    reset,
    resetAll,
  };
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

/**
 * Default singleton instance for app-wide use.
 * Import this for standard usage across error boundaries.
 */
export const inlineRetryManager = createInlineRetryManager();
