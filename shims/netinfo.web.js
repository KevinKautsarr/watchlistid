/**
 * Web shim for @react-native-community/netinfo
 * Replaces the native module on web platform so we avoid
 * the NativeEventEmitter / EventEmitter crash.
 *
 * Uses browser-native navigator.onLine and the window "online"/"offline" events.
 */

function getState() {
  const isConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return {
    type: isConnected ? 'wifi' : 'none',
    isConnected,
    isInternetReachable: isConnected,
    details: null,
  };
}

const listeners = new Set();

function notifyListeners() {
  const state = getState();
  listeners.forEach((fn) => fn(state));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', notifyListeners);
  window.addEventListener('offline', notifyListeners);
}

const NetInfo = {
  addEventListener(listener) {
    listeners.add(listener);
    // Immediately call with current state
    listener(getState());
    return () => listeners.delete(listener);
  },

  fetch() {
    return Promise.resolve(getState());
  },

  refresh() {
    return Promise.resolve(getState());
  },

  configure() {
    // no-op on web
  },
};

export default NetInfo;
