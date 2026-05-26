module.exports = {
  preset: 'jest-expo',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text-summary'],
  // Nested `react-native/node_modules/@react-native/js-polyfills` is Flow; default RN preset
  // only whitelists top-level `react-native/`, so those files were skipped by Babel.
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase)',
  ],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  /** Local agent worktrees under `.claude/` — exclude from haste map (duplicate names + occasional bad JSON). */
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  /** Local agent worktrees live under .gitignored `.claude/`; skip so Jest does not scan duplicate package trees. */
  testPathIgnorePatterns: ['/node_modules/', '\\.claude\\/', '<rootDir>/functions/'],
};
