/**
 * Web fallback for the native Event polyfill.
 *
 * See fix-native-event-polyfill.native.ts for the actual (fragile) native implementation.
 * Having a .web.ts (and this .ts fallback) prevents Metro from parsing the deep
 * react-native/Libraries requires when bundling for web.
 */
export {};
