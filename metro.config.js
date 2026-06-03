const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Disable unstable package exports resolution to prevent Node.js built-ins from being loaded (e.g. stream, events in ws)
config.resolver.unstable_enablePackageExports = false;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-secure-store') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo-secure-store/build/SecureStore.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

