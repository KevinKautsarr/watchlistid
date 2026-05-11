const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

// Enable inline requires for better web performance (lazy module evaluation)
config.transformer.inlineRequires = true;

// Minify for web builds
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    mangle:   { toplevel: false },
    output:   { ascii_only: true, quote_style: 3, wrap_iife: true },
    sourceMap: { includeSources: false },
    compress: {
      reduce_funcs: false,
      keep_infinity: true,
      pure_getters: true,
    },
  };
}

module.exports = config;
