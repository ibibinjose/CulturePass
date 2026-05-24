const path = require("path");
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const blockPath = (relativePath) =>
  new RegExp(`${escapeRegex(path.resolve(__dirname, relativePath))}[/\\\\].*`);

// CI/export reliability: Watchman can hang during Metro's initial file-map crawl
// on some macOS launch environments. The Node filesystem crawler is slower but
// deterministic for static web exports and Firebase deploys.
config.resolver.useWatchman = false;
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  blockPath("dist"),
  blockPath("dist-consumer"),
  blockPath(".firebase"),
  blockPath(".claude"),
  blockPath("android/app/build"),
  blockPath("ios/build"),
  blockPath("functions/lib"),
  blockPath("functions/node_modules"),
  blockPath("host-app/node_modules"),
];

// Metro sometimes fails to resolve bare "react" / "react-dom" from deep paths under
// node_modules (e.g. @expo/log-box). Pin them to the project root install so
// builds don't fail with "Unable to resolve module react".
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.resolve(__dirname, "node_modules/react"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
};

// Remove the unrecognised `watcher.unstable_workerThreads` option that Expo's
// default config injects but Metro doesn't recognise. Without this deletion
// expo-doctor reports a validation warning on every run.
if (config.watcher && 'unstable_workerThreads' in config.watcher) {
  delete config.watcher.unstable_workerThreads;
}

// On web, replace react-native-reanimated with a safe no-op stub.
// The real package's native initializer calls Object.values(null) in a browser
// environment, crashing the entire app before any component renders.
// react-native-gesture-handler wraps its Reanimated require in a try/catch
// and gracefully falls back when useSharedValue is absent, so this is safe.
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Web-only stubs: real Reanimated + keyboard-controller are required on native for
  // gestures, tab bar motion, and keyboard avoidance. On web, Reanimated's native
  // initializer can crash before first paint; GH gestures fall back without shared values.
  if (platform === "web") {
    if (moduleName === "react-native-reanimated" || moduleName.startsWith("react-native-reanimated/")) {
      return {
        filePath: path.resolve(__dirname, "src/lib/reanimated-stub.js"),
        type: "sourceFile",
      };
    }
    if (moduleName.includes("react-native-keyboard-controller")) {
      return {
        filePath: path.resolve(__dirname, "src/lib/keyboard-controller-stub.js"),
        type: "sourceFile",
      };
    }
    if (moduleName === "@posthog/core/surveys") {
      return {
        filePath: path.resolve(__dirname, "node_modules/@posthog/core/dist/surveys/index.js"),
        type: "sourceFile",
      };
    }
  }

  // Prevent crashes on web dev server requests
  if (platform === "web" && moduleName === "react-native/Libraries/Core/Devtools/getDevServer") {
    return {
      filePath: path.resolve(__dirname, "src/lib/empty-module.js"),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ── Performance: inline requires for faster cold start ──
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// ── Performance: enable package exports for tree-shaking (date-fns, Firebase, etc.) ──
config.resolver.unstable_enablePackageExports = false;

module.exports = config;