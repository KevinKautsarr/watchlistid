import { installExpoGlobalPolyfill } from 'expo-modules-core/src/polyfill/dangerous-internal';

try {
  installExpoGlobalPolyfill();
} catch (e) {
  console.warn('[ExpoPolyfill] Failed to install expo-modules-core polyfill:', e);
}
