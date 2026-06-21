import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { APP_URL } from '@/config';

// Hostname of the production web deployment. Must match APP_URL's host.
const PROD_WEB_HOSTNAME = 'watchlistid.vercel.app';

/**
 * The correct OAuth / email (recovery & confirmation) callback URL for the
 * current runtime.
 *
 * IMPORTANT: this uses **runtime hostname detection**, NOT `__DEV__`. Expo sets
 * `__DEV__ = true` even in production web exports, so a `__DEV__`-based check
 * would send production password-reset / confirmation links to localhost.
 *
 * - Web (production): https://watchlistid.vercel.app/auth/callback
 * - Web (local dev):  http://localhost:8081/auth/callback  (via Linking.createURL)
 * - Native:           moviewatchlist://auth/callback
 */
export function getAuthRedirectUrl(): string {
  if (Platform.OS !== 'web') {
    return 'moviewatchlist://auth/callback';
  }
  const isProd =
    typeof window !== 'undefined' &&
    window.location?.hostname === PROD_WEB_HOSTNAME;
  return isProd ? `${APP_URL}/auth/callback` : Linking.createURL('/auth/callback');
}
