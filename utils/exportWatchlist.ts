import { Platform, Share, Alert } from 'react-native';
import { WatchlistItem } from '@/types/watchlist';
import { MovieLog } from '@/types';

/**
 * Exports the user's watchlist and diary logs as a CSV file.
 * On web: triggers a file download via an anchor element.
 * On native: uses the Share API.
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
      const added  = item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '';
      return [title, type, status, rating, added].map(csvEscape).join(',');
    });

    // ── Diary / Logs CSV ──────────────────────────────────────────────────
    const logHeaders = ['Title', 'Type', 'Rating', 'Watched On', 'Review'];
    const logRows = logs.map(log => {
      const title  = log.movie_title ?? '';
      const type   = log.media_type ?? 'movie';
      const rating = log.rating?.toString() ?? '';
      const date   = log.watched_at ? new Date(log.watched_at).toLocaleDateString() : '';
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
      // Native: use Share sheet
      await Share.share({ message: csvContent, title: fileName });
    }
  } catch (err: any) {
    Alert.alert('Export Gagal', err?.message ?? 'Terjadi kesalahan saat mengekspor data.');
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
