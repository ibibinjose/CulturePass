/**
 * Early native Event polyfill override.
 *
 * Problem:
 * expo-notifications pulls in `event-target-shim` (via abort-controller), which can
 * install its own global `Event` constructor on native. This version defines
 * static readonly properties (NONE, CAPTURING_PHASE, etc.).
 *
 * Later, React Native's own Event machinery (used by WebSockets, native modules,
 * AsyncFunctionQueue, etc.) tries to assign to these properties and crashes with:
 *   "Cannot assign to read-only property 'NONE'"
 *
 * This is especially visible in RN 0.74+ / Expo SDK 51+ and when using Hermes + JSI.
 *
 * Solution:
 * Force React Native's real Event implementation as early as possible in the bundle,
 * before reanimated, expo-router, notifications, or any other module can pull in the shim.
 *
 * This file must be imported **before** almost everything else.
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
