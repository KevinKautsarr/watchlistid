import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Safe AsyncStorage read — returns null and removes key if data is corrupt.
 * On web, AsyncStorage maps to localStorage. Stale/corrupt JSON from old
 * app versions will cause a crash in normal browsers but not in incognito
 * (which has a fresh localStorage). This wrapper fixes that.
 */
export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('[Storage] Read failed, removing corrupt key:', key, error);
    try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
    return null;
  }
};

/**
 * Safe AsyncStorage write — silently ignores write errors (e.g. storage full).
 */
export const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('[Storage] Write failed for key:', key, error);
  }
};

/**
 * Scans all AsyncStorage keys for corrupt (non-parseable) JSON values
 * and removes them. Call once at startup to prevent crash loops in normal browser.
 *
 * The keys that store plain strings (not JSON) are listed in PLAIN_STRING_KEYS
 * and are not subject to JSON parsing validation.
 */
const PLAIN_STRING_KEYS = new Set(['app_language']);

export const safeClearCorruptStorage = async (): Promise<void> => {
  if (Platform.OS !== 'web') return; // Only needed on web/localStorage
  try {
    const keys = await AsyncStorage.getAllKeys();
    const removals: string[] = [];

    for (const key of keys) {
      // Skip Supabase auth tokens — they are managed internally by Supabase SDK
      if (key.startsWith('sb-') || key.includes('supabase')) continue;
      // Skip plain-string keys
      if (PLAIN_STRING_KEYS.has(key)) continue;

      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          JSON.parse(value); // Test: will throw if corrupt
        }
      } catch {
        console.warn('[Storage] Removing corrupt key:', key);
        removals.push(key);
      }
    }

    if (removals.length > 0) {
      await AsyncStorage.multiRemove(removals);
      console.log(`[Storage] Cleaned up ${removals.length} corrupt key(s):`, removals);
    }
  } catch (error) {
    console.error('[Storage] Cleanup scan failed:', error);
  }
};

/**
 * Validates the Supabase session stored in localStorage.
 * If the stored token is expired or malformed, clear it so the app
 * doesn't get stuck in an infinite loading/redirect loop.
 *
 * This specifically targets the "works in incognito but not normal browser"
 * pattern caused by stale auth tokens in localStorage.
 */
export const clearStaleSupabaseSession = async (): Promise<void> => {
  if (Platform.OS !== 'web') return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

    for (const key of authKeys) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const expiresAt: number | undefined = parsed?.expires_at;

        if (expiresAt && expiresAt * 1000 < Date.now()) {
          // Token is expired — remove it so Supabase can re-authenticate cleanly
          await AsyncStorage.removeItem(key);
          console.warn('[Storage] Removed expired Supabase session token:', key);
        }
      } catch {
        // Corrupt token — remove it
        await AsyncStorage.removeItem(key);
        console.warn('[Storage] Removed corrupt Supabase session token:', key);
      }
    }
  } catch (error) {
    console.error('[Storage] Supabase session validation failed:', error);
  }
};
