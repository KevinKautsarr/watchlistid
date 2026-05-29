const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

// Web platform resolver: redirect @react-native-community/netinfo to our
// browser-native shim when bundling for web. resolveRequest works for all
// platforms including web (unlike extraNodeModules which is native-only).
const netinfoShim = path.resolve(__dirname, 'shims/netinfo.web.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    moduleName === '@react-native-community/netinfo'
  ) {
    return { filePath: netinfoShim, type: 'sourceFile' };
  }
  // Fall back to default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

// Minifier optimization
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: {
    keep_classnames: false,
    keep_fnames: false
  },
  output: {
    comments: false
  }
};

// Enable inline requires for better web performance (lazy module evaluation)
config.transformer.inlineRequires = true;

// Tree shaking — exclude unused modules for web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
