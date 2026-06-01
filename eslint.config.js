const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/ios/**",
      "**/android/**",
      "**/.next/**",
      "**/web/out/**",
      "**/functions/**",
      "**/web/**",
      "**/shared/dist/**",
      "**/host-app/**",
      "**/server/**",
      "**/scripts/**",
      "**/[...missing].ts",
      "**/*.js"
    ],
  },
  ...expoConfig,
  {
    rules: {
      "import/no-restricted-paths": ["error", {
        zones: [
          { target: "./src/modules", from: "./src.app" },
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
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      // Discourage the old anti-pattern of hardcoding 0 insets on web.
      // Use `useSafeAreaInsetsWeb()` instead for proper mobile web (iOS Safari) support.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "VariableDeclarator[id.name=/[Tt]opInset/] > ConditionalExpression[consequent.value=0][alternate.property.name='top']",
          message: "Avoid `Platform.OS === 'web' ? 0 : insets.top`. Use `useSafeAreaInsetsWeb()` from '@/hooks/useSafeAreaInsetsWeb' instead for correct iOS Safari safe areas on mobile web."
        },
        {
          selector: "VariableDeclarator[id.name=/[Bb]ottomInset/] > ConditionalExpression[consequent.value=/^\\d+$/][alternate.property.name='bottom']",
          message: "Avoid hardcoding web bottom insets. Use `useSafeAreaInsetsWeb()` from '@/hooks/useSafeAreaInsetsWeb' for proper home indicator / safe area support on mobile web."
        }
      ],
      // @typescript-eslint/no-unused-vars is provided by eslint-config-expo/flat (which loads the plugin).
      // Explicit reference removed to avoid "plugin not found" in flat config.
    }
  },
  prettier,
];
