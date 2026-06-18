module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['.'],
        alias: {
          '@': '.',
        }
      }],
      // Remove console.log di production
      ['transform-remove-console', { exclude: ['error', 'warn'] }]
    ],
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
