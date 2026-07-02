import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WatchlistItem } from '@/types/watchlist';
import { MovieLog } from '@/types';

/**
 * Exports the user's watchlist and diary logs as a CSV file.
 * On web: triggers a file download via an anchor element.
 * On native: saves to a temporary file and triggers the native sharing sheet.
 *
 * This is a plain utility function (no React context), so it cannot show a
 * Toast itself — on failure it re-throws, and the caller is responsible for
 * catching the error and surfacing it via Toast (or another UI) instead of
 * a native Alert.
 */
export async function exportWatchlistToCSV(
  watchlist: WatchlistItem[],
  logs: MovieLog[],
  username: string = 'user',
): Promise<void> {
  try {
    // ── Watchlist CSV ─────────────────────────────────────────────────────
    const wlHeaders = ['Title', 'Type', 'Status', 'Rating', 'Added On'];
    const wlRows = watchlist.map(item => {
      const title = ('title' in item ? (item as any).title : (item as any).name) ?? '';
      const type  = (item as any).mediaType ?? (item as any).media_type ?? 'movie';
      const status = item.status === 'completed' ? 'Watched' : 'Plan to Watch';
      const rating = (item as any).vote_average?.toFixed(1) ?? '';
      const added  = formatSafeDate(item.addedAt);
      return [title, type, status, rating, added].map(csvEscape).join(',');
    });

    // ── Diary / Logs CSV ──────────────────────────────────────────────────
    const logHeaders = ['Title', 'Type', 'Rating', 'Watched On', 'Review'];
    const logRows = logs.map(log => {
      const title  = log.movie_title ?? '';
      const type   = log.media_type ?? 'movie';
      const rating = log.rating?.toString() ?? '';
      const date   = formatSafeDate(log.watched_at);
      const review = log.review_text ?? '';
      return [title, type, rating, date, review].map(csvEscape).join(',');
    });

    const csvContent = [
      '=== WATCHLIST ===',
      wlHeaders.join(','),
      ...wlRows,
      '',
      '=== DIARY / LOGS ===',
      logHeaders.join(','),
      ...logRows,
    ].join('\n');

    const fileName = `watchlistid_${username}_${new Date().toISOString().split('T')[0]}.csv`;

    if (Platform.OS === 'web') {
      // Web: create a Blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Native: Use expo-file-system and expo-sharing to share as a file attachment
      try {
        const fileUri = `${(FileSystem as any).cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: (FileSystem as any).EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export WatchlistID Data',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          // Fallback to text sharing if Sharing is not available
          await Share.share({ message: csvContent, title: fileName });
        }
      } catch (fileErr) {
        console.warn('File share failed, falling back to text share:', fileErr);
        // Fallback to text sharing
        await Share.share({ message: csvContent, title: fileName });
      }
    }
  } catch (err: any) {
    console.error('[exportWatchlistToCSV] failed:', err);
    throw err;
  }
}

function csvEscape(value: string): string {
  const str = String(value ?? '');
  // Wrap in quotes if it contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatSafeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString();
}
