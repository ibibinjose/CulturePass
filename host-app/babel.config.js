module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@shared': '../shared',
            '@consumer': '../src',
          },
        },
      ],
    ],
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
      },
    },
  };
};
