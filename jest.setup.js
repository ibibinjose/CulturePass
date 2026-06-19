// Jest setup file for CulturePass
// Mocks native modules that aren't available in the test environment

// expo-router pulls in standard-navigation (ESM) — mock before any app imports load it.
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');

  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
    setParams: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
  };

  const StackScreen = ({ children }) => React.createElement(View, null, children);
  const Stack = Object.assign(
    ({ children }) => React.createElement(View, null, children),
    { Screen: StackScreen },
  );

  return {
    __esModule: true,
    router,
    useRouter: jest.fn(() => router),
    useSegments: jest.fn(() => []),
    useLocalSearchParams: jest.fn(() => ({})),
    useGlobalSearchParams: jest.fn(() => ({})),
    usePathname: jest.fn(() => '/'),
    useRootNavigationState: jest.fn(() => ({ key: 'root' })),
    useNavigation: jest.fn(),
    Link: ({ children, ...props }) => React.createElement(View, props, children),
    Redirect: () => null,
    Stack,
    Tabs: Stack,
    Slot: () => null,
  };
});

jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }) => children ?? null,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
      Text: require('react-native').Text,
      createAnimatedComponent: (component) => component,
      addWhitelistedNativeProps: jest.fn(),
      addWhitelistedUIProps: jest.fn(),
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    useAnimatedScrollHandler: jest.fn(),
    useAnimatedGestureHandler: jest.fn(),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    withDelay: jest.fn((_, val) => val),
    withSequence: jest.fn((...vals) => vals[vals.length - 1]),
    withRepeat: jest.fn((val) => val),
    cancelAnimation: jest.fn(),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      bezier: jest.fn(() => jest.fn()),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    FadeIn: { duration: jest.fn().mockReturnThis() },
    FadeOut: { duration: jest.fn().mockReturnThis() },
    SlideInRight: { duration: jest.fn().mockReturnThis() },
    SlideOutLeft: { duration: jest.fn().mockReturnThis() },
    Layout: { duration: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
    createAnimatedComponent: (component) => component,
  };
});

// Mock react-native-worklets
jest.mock('react-native-worklets', () => ({
  createWorklet: jest.fn(),
  useWorklet: jest.fn(),
}));

// Mock expo-glass-effect (Liquid Glass / new glassmorphism native module)
// This prevents "Cannot find native module 'ExpoGlassEffect'" errors in Jest
jest.mock('expo-glass-effect', () => ({
  isLiquidGlassAvailable: jest.fn(() => false),
  GlassView: require('react-native').View,
  __esModule: true,
  default: {
    isLiquidGlassAvailable: jest.fn(() => false),
    GlassView: require('react-native').View,
  },
}));

// Also mock the internal native module lookup that expo-glass-effect + expo-router use
try {
  const expoModulesCore = require('expo-modules-core');
  const originalRequireNativeModule = expoModulesCore.requireNativeModule;
  expoModulesCore.requireNativeModule = (name: string) => {
    if (name === 'ExpoGlassEffect' || name.includes('GlassEffect')) {
      return { isLiquidGlassAvailable: false, default: {} };
    }
    return originalRequireNativeModule(name);
  };
} catch (e) {
  // expo-modules-core not present or not resolvable in this env — ignore
}

// Mock @react-native-community/datetimepicker (not installed as a dependency)
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockDateTimePicker = (props) => React.createElement(View, { testID: 'datetime-picker', ...props });
  MockDateTimePicker.displayName = 'DateTimePicker';
  return {
    __esModule: true,
    default: MockDateTimePicker,
  };
}, { virtual: true });

// Mock expo/fetch to avoid class inheritance issues in test env
jest.mock('expo/fetch', () => ({
  fetch: jest.fn(),
}), { virtual: true });

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock the firebase module to avoid ESM parsing issues with @firebase packages
jest.mock('@/lib/firebase', () => ({
  firebaseApp: null,
  auth: null,
  db: null,
  storage: null,
  functions: null,
  isFirebaseWebClientReady: false,
  FIREBASE_CLIENT_DISABLED_MESSAGE: 'Firebase not available in test environment',
}));

// Mock firebase/* packages directly for any transitive imports
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  getStorage: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteField: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  initializeAuth: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

// Mock firebase/storage to avoid ESM parsing issues
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

// Mock firebase/firestore to avoid ESM parsing issues
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteField: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));
