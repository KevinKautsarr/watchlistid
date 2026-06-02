import { installExpoGlobalPolyfill } from 'expo-modules-core/src/polyfill/dangerous-internal';

export function initPolyfill() {
  try {
    installExpoGlobalPolyfill();
  } catch (e) {
    console.warn('[ExpoPolyfill] Failed to install expo-modules-core polyfill:', e);
  }
}
