module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure Flow and TypeScript transforms happen before class feature transforms
      // to strip type-only annotations before class properties transforms run.
      // For Flow, this prevents type-only fields from being transformed into class
      // properties (which can crash when prototype properties are read-only, like Event.js).
      ['@babel/plugin-transform-flow-strip-types', { all: false }],
      // We use isTSX: true and allExtensions: true so it also handles JS/JSX files
      // without getting confused by JSX tags (thinking they are type parameters).
      ['@babel/plugin-transform-typescript', { allowDeclareFields: true, isTSX: true, allExtensions: true }],
      // Hermes does not support private class fields (#foo) or private methods.
      // These loose transforms are required for modern libs (Reanimated 4, TanStack, etc.)
      // when targeting Hermes bytecode (iOS/Android dev client + production).
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      'react-native-reanimated/plugin', // Reanimated plugin must be last
    ],
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
      },
    },
  };
};