import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export interface ShareInput {
  /** Full message body (may already contain the URL). */
  message: string;
  /** Canonical link — used as the clipboard fallback content. */
  url: string;
  title?: string;
}

export type ShareResult = 'shared' | 'copied' | 'dismissed';

/**
 * Opens the native / Web Share sheet, falling back to copying the URL to the
 * clipboard on web browsers without the Web Share API (e.g. Firefox desktop).
 *
 * - `'shared'`    — the share sheet was used
 * - `'copied'`    — fell back to copying the link (caller should surface feedback)
 * - `'dismissed'` — the user cancelled the share sheet
 */
export async function shareOrCopy({ message, url, title }: ShareInput): Promise<ShareResult> {
  const noWebShare =
    Platform.OS === 'web' && (typeof navigator === 'undefined' || !(navigator as any).share);

  if (noWebShare) {
    try { await Clipboard.setStringAsync(url); } catch { /* clipboard unavailable */ }
    return 'copied';
  }

  try {
    await Share.share({ message, url, title });
    return 'shared';
  } catch (e: any) {
    if (e?.name === 'AbortError') return 'dismissed'; // user closed the sheet
    try { await Clipboard.setStringAsync(url); } catch { /* clipboard unavailable */ }
    return 'copied';
  }
}
