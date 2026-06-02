import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  try {
    const { installExpoGlobalPolyfill } = require('expo-modules-core/src/polyfill/dangerous-internal');
    installExpoGlobalPolyfill();
  } catch (e) {
    console.warn('[ExpoPolyfill] Failed to install expo-modules-core polyfill:', e);
  }
}
