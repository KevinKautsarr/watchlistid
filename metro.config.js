const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

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
