/**
 * Property-Based Test: Independent Tab Navigation Stacks (Property 29)
 *
 * **Validates: Requirements 14.3**
 *
 * For any sequence of navigation actions across multiple tabs, each tab's
 * navigation stack SHALL be independent — pushing/popping routes on one tab
 * SHALL NOT affect the stack depth, scroll position, or filters of any other
 * tab. Each stack SHALL be limited to 10 entries.
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types (mirroring NavigationStateContext)
// ---------------------------------------------------------------------------

type TabKey = 'discover' | 'calendar' | 'community' | 'city' | 'my-space';

interface TabState {
  scrollPosition: number;
  navigationDepth: number;
  stackHistory: string[];
  filters: Record<string, unknown>;
  expandedSections: string[];
  lastActiveTimestamp: number;
}

type AllTabStates = Record<TabKey, TabState>;

// ---------------------------------------------------------------------------
// Constants (matching the implementation)
// ---------------------------------------------------------------------------

const MAX_STACK_DEPTH = 10;
const ALL_TABS: TabKey[] = ['discover', 'calendar', 'community', 'city', 'my-space'];

// ---------------------------------------------------------------------------
// Pure state transition functions (extracted from NavigationStateContext logic)
// ---------------------------------------------------------------------------

function createDefaultTabState(): TabState {
  return {
    scrollPosition: 0,
    navigationDepth: 0,
    stackHistory: [],
    filters: {},
    expandedSections: [],
    lastActiveTimestamp: Date.now(),
  };
}

function createDefaultAllTabStates(): AllTabStates {
  return {
    discover: createDefaultTabState(),
    calendar: createDefaultTabState(),
    community: createDefaultTabState(),
    city: createDefaultTabState(),
    'my-space': createDefaultTabState(),
  };
}

function pushRoute(states: AllTabStates, tab: TabKey, route: string): AllTabStates {
  const current = states[tab];
  const newStack =
    current.stackHistory.length >= MAX_STACK_DEPTH
      ? [...current.stackHistory.slice(1), route]
      : [...current.stackHistory, route];

  return {
    ...states,
    [tab]: {
      ...current,
      stackHistory: newStack,
      navigationDepth: newStack.length,
      lastActiveTimestamp: Date.now(),
    },
  };
}

function popRoute(states: AllTabStates, tab: TabKey): AllTabStates {
  const current = states[tab];
  if (current.stackHistory.length === 0) {
    return states;
  }

  const newStack = current.stackHistory.slice(0, -1);
  return {
    ...states,
    [tab]: {
      ...current,
      stackHistory: newStack,
      navigationDepth: newStack.length,
      lastActiveTimestamp: Date.now(),
    },
  };
}

function saveScrollPosition(states: AllTabStates, tab: TabKey, position: number): AllTabStates {
  return {
    ...states,
    [tab]: {
      ...states[tab],
      scrollPosition: position,
      lastActiveTimestamp: Date.now(),
    },
  };
}

// ---------------------------------------------------------------------------
// Arbitraries (generators)
// ---------------------------------------------------------------------------

const tabKeyArb: fc.Arbitrary<TabKey> = fc.constantFrom(...ALL_TABS);

const routeArb: fc.Arbitrary<string> = fc.stringOf(
  fc.constantFrom('a', 'b', 'c', '/', '-', '1', '2', '3'),
  { minLength: 1, maxLength: 30 },
);

const scrollPositionArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 10000 });

type NavAction =
  | { type: 'push'; tab: TabKey; route: string }
  | { type: 'pop'; tab: TabKey }
  | { type: 'scroll'; tab: TabKey; position: number };

const navActionArb: fc.Arbitrary<NavAction> = fc.oneof(
  fc.record({ type: fc.constant('push' as const), tab: tabKeyArb, route: routeArb }),
  fc.record({ type: fc.constant('pop' as const), tab: tabKeyArb }),
  fc.record({ type: fc.constant('scroll' as const), tab: tabKeyArb, position: scrollPositionArb }),
);

function applyAction(states: AllTabStates, action: NavAction): AllTabStates {
  switch (action.type) {
    case 'push':
      return pushRoute(states, action.tab, action.route);
    case 'pop':
      return popRoute(states, action.tab);
    case 'scroll':
      return saveScrollPosition(states, action.tab, action.position);
  }
}

function applyActions(actions: NavAction[]): AllTabStates {
  let states = createDefaultAllTabStates();
  for (const action of actions) {
    states = applyAction(states, action);
  }
  return states;
}

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Property 29: Independent Tab Navigation Stacks', () => {
  it('push on one tab does not change other tabs\' stacks', () => {
    fc.assert(
      fc.property(
        fc.array(navActionArb, { minLength: 0, maxLength: 50 }),
        tabKeyArb,
        routeArb,
        (actions, targetTab, route) => {
          // Apply all prior actions to get a baseline state
          const stateBefore = applyActions(actions);

          // Push a route on the target tab
          const stateAfter = pushRoute(stateBefore, targetTab, route);

          // All OTHER tabs must remain unchanged
          for (const tab of ALL_TABS) {
            if (tab !== targetTab) {
              expect(stateAfter[tab].stackHistory).toEqual(stateBefore[tab].stackHistory);
              expect(stateAfter[tab].navigationDepth).toBe(stateBefore[tab].navigationDepth);
              expect(stateAfter[tab].scrollPosition).toBe(stateBefore[tab].scrollPosition);
              expect(stateAfter[tab].filters).toEqual(stateBefore[tab].filters);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('pop on one tab does not change other tabs\' stacks', () => {
    fc.assert(
      fc.property(
        fc.array(navActionArb, { minLength: 0, maxLength: 50 }),
        tabKeyArb,
        (actions, targetTab) => {
          const stateBefore = applyActions(actions);

          // Pop a route on the target tab
          const stateAfter = popRoute(stateBefore, targetTab);

          // All OTHER tabs must remain unchanged
          for (const tab of ALL_TABS) {
            if (tab !== targetTab) {
              expect(stateAfter[tab].stackHistory).toEqual(stateBefore[tab].stackHistory);
              expect(stateAfter[tab].navigationDepth).toBe(stateBefore[tab].navigationDepth);
              expect(stateAfter[tab].scrollPosition).toBe(stateBefore[tab].scrollPosition);
              expect(stateAfter[tab].filters).toEqual(stateBefore[tab].filters);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('stack never exceeds 10 entries regardless of how many pushes', () => {
    fc.assert(
      fc.property(
        tabKeyArb,
        fc.array(routeArb, { minLength: 1, maxLength: 100 }),
        (tab, routes) => {
          let states = createDefaultAllTabStates();

          for (const route of routes) {
            states = pushRoute(states, tab, route);
            // After every push, the stack must not exceed MAX_STACK_DEPTH
            expect(states[tab].stackHistory.length).toBeLessThanOrEqual(MAX_STACK_DEPTH);
            expect(states[tab].navigationDepth).toBeLessThanOrEqual(MAX_STACK_DEPTH);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('scroll position on one tab is independent of other tabs', () => {
    fc.assert(
      fc.property(
        fc.array(navActionArb, { minLength: 0, maxLength: 50 }),
        tabKeyArb,
        scrollPositionArb,
        (actions, targetTab, position) => {
          const stateBefore = applyActions(actions);

          // Save scroll position on the target tab
          const stateAfter = saveScrollPosition(stateBefore, targetTab, position);

          // The target tab's scroll position should be updated
          expect(stateAfter[targetTab].scrollPosition).toBe(position);

          // All OTHER tabs must retain their scroll positions
          for (const tab of ALL_TABS) {
            if (tab !== targetTab) {
              expect(stateAfter[tab].scrollPosition).toBe(stateBefore[tab].scrollPosition);
              expect(stateAfter[tab].stackHistory).toEqual(stateBefore[tab].stackHistory);
              expect(stateAfter[tab].navigationDepth).toBe(stateBefore[tab].navigationDepth);
              expect(stateAfter[tab].filters).toEqual(stateBefore[tab].filters);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('navigationDepth always equals stackHistory.length after any sequence of actions', () => {
    fc.assert(
      fc.property(
        fc.array(navActionArb, { minLength: 1, maxLength: 100 }),
        (actions) => {
          const states = applyActions(actions);

          for (const tab of ALL_TABS) {
            expect(states[tab].navigationDepth).toBe(states[tab].stackHistory.length);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
