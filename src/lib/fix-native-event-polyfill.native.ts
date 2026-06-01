/**
 * Early native Event polyfill override (NATIVE ONLY).
 *
 * Problem:
 * expo-notifications pulls in `event-target-shim` (via abort-controller), which can
 * install its own global `Event` constructor on native. This version defines
 * static readonly properties (NONE, CAPTURING_PHASE, etc.).
 *
 * Later, React Native's own Event machinery tries to assign to these properties
 * and crashes with: "Cannot assign to read-only property 'NONE'"
 *
 * This is especially visible in RN 0.74+ / Expo SDK 51+ with Hermes + JSI.
 *
 * NOTE (SDK 56 / RN 0.85+):
 * These deep imports (`react-native/Libraries/...` and private webapis paths) are
 * now deprecated and will produce Metro warnings on native dev:
 *   "Deep imports from the 'react-native' package are deprecated"
 *
 * This is the least-bad way we currently have to prevent the crash.
 * If the crash stops happening in future expo-notifications versions, delete this file
 * and its import from src/app/_layout.tsx.
 */

if (process.env.EXPO_OS !== 'web') {
  try {
    // Primary path in current RN
    // intentional global override
    global.Event = require('react-native/Libraries/Events/Event');
  } catch {
    try {
      // Fallback for newer private webapis path
      global.Event = require('react-native/src/private/webapis/dom/events/Event').default;
    } catch (err) {
      if (__DEV__) {
        console.warn(
          '[EventPolyfill] Could not force RN Event implementation. ' +
            'You may still hit the expo-notifications "read-only property NONE" crash on native.',
          err
        );
      }
    }
  }
}
