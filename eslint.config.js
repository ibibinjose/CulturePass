const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", "node_modules/**", "ios/**", "android/**", "web/.next/**", "**/.next/**", ".next/**", "web/out/**", "**/[...missing].ts"],
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      },
    },
    rules: {
      "import/no-restricted-paths": ["error", {
        zones: [
          // modules must not depend on routes
          { target: "./src/modules", from: "./src.app" },
          // platform/shared must not depend on routes or modules
          { target: "./src/lib", from: "./src.app" },
          { target: "./src/lib", from: "./src.modules" },
          { target: "./src/hooks", from: "./src.app" },
          { target: "./src/hooks", from: "./src.modules" },
          { target: "./src/contexts", from: "./src.app" },
          { target: "./src/contexts", from: "./src.modules" },
          { target: "./src/constants", from: "./src.app" },
          { target: "./src/constants", from: "./src.modules" },
          { target: "./src/shared", from: "./src.app" },
          { target: "./src.shared", from: "./src.modules" },
          { target: "./src/design-system", from: "./src.app" },
          { target: "./src.design-system", from: "./src.modules" },
        ],
      }],
      "no-restricted-imports": ["error", {
        paths: [{
          name: "react-native",
          importNames: ["Image"],
          message: "Use Image from 'expo-image' instead for proper caching and performance."
        }],
      }],
    }
  },
  {
    files: ["src/hooks/useDiscoverData.ts"],
    rules: {
      // Temporary migration seam: legacy hook path delegates to canonical module hook.
      "import/no-restricted-paths": "off",
    },
  },
  {
    files: ["functions/scripts/fullRebuildWipe.ts"],
    rules: {
      // Allow dynamic env access in this specific script file
      "expo/no-dynamic-env-var": "off",
    },
  },
  {
    files: ["src/lib/reanimated-stub.js"],
    rules: {
      // Web stub re-export RN primitives; expo-image is unavailable in this no-op bundle path.
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["functions/src/**/*.ts"],
    rules: {
      // Allow unresolved imports for schema and service modules that may not exist yet
      "import/no-unresolved": ["warn", { "ignore": ["../schemas/", "../services/"] }],
    },
  },
  {
    files: ["web/.next/**/*"],
    rules: {
      // Disable problematic rules for generated .next files
      "no-undef": "off",
      "no-var": "off",
      "no-unused-expressions": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/first": "off",
      "@typescript-eslint/no-redeclare": "off"
    }
  },
  prettier, // Must be last — disables ESLint rules that conflict with Prettier
]);
