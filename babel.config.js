module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['.'],
        alias: {
          '@': '.',
          '@/components': './components',
          '@/screens': './screens',
          '@/context': './context',
          '@/hooks': './hooks',
          '@/services': './services',
          '@/types': './types',
          '@/constants': './constants',
          '@/utils': './utils',
        }
      }]
    ]
  };
};
