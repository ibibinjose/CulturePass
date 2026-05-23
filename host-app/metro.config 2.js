const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so Metro can resolve ../shared/* imports
config.watchFolders = [workspaceRoot];

// Prefer host-app's node_modules, fall back to workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Deduplicate singleton packages — prevents "two copies" of React, Firebase,
// and TanStack Query when Metro resolves files from both apps' node_modules.
const SINGLETON_PACKAGES = [
  'react',
  'react-native',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
  'firebase',
  '@tanstack/react-query',
  '@tanstack/query-core',
  'expo-router',
  'expo',
];

config.resolver.extraNodeModules = SINGLETON_PACKAGES.reduce((acc, pkg) => {
  acc[pkg] = path.resolve(workspaceRoot, 'node_modules', pkg);
  return acc;
}, {});

module.exports = config;
