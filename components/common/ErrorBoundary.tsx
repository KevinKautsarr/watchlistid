import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

// sessionStorage key used to throttle auto-reload so a genuinely broken build
// can't trap the user in an infinite reload loop.
const RELOAD_KEY = 'wl_chunk_reload_at';
const RELOAD_THROTTLE_MS = 10_000;

/**
 * Detects a failure to load an async JS chunk. On web the app is code-split per
 * route (Expo Router `asyncRoutes`); after a redeploy the content-hashed chunk
 * names change, so a still-open (or bfcache'd) client that holds the previous
 * route manifest requests a chunk that no longer exists → 404 → this error.
 * The cure is to reload once, which re-fetches the current (no-cache) manifest.
 */
function isChunkLoadError(error?: Error | null): boolean {
  if (!error) return false;
  const msg = `${error.name || ''} ${error.message || ''}`;
  return /AsyncRequireError|Loading module .*failed|Loading chunk \S+ failed|dynamically imported module|module script failed/i.test(msg);
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Self-heal stale-chunk errors: reload once to fetch the current manifest.
    if (this.shouldAutoReload(error)) {
      try { window.sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch {}
      window.location.reload();
      return;
    }
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private shouldAutoReload(error: Error): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    if (!isChunkLoadError(error)) return false;
    let last = 0;
    try { last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0); } catch {}
    // Only auto-reload if we haven't already tried very recently.
    return Date.now() - last > RELOAD_THROTTLE_MS;
  }

  private handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try { window.sessionStorage.removeItem(RELOAD_KEY); } catch {}
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null, isChunkError: false });
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      const chunk = this.state.isChunkError;
      return (
        <View style={styles.container}>
          <Text style={styles.emoji} allowFontScaling={false}>🎬</Text>
          <Text style={styles.title} allowFontScaling={false}>Ups, Ada Kesalahan</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            {chunk
              ? 'Versi aplikasi telah diperbarui. Muat ulang halaman untuk melanjutkan.'
              : 'Aplikasi mengalami kendala saat memuat halaman ini.'}
          </Text>
          {!chunk && (
            <View style={styles.debugBox}>
              <Text style={styles.debugText} allowFontScaling={false}>
                {this.state.error?.toString()}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={chunk ? this.handleReload : this.handleRetry}
          >
            <Text style={styles.retry} allowFontScaling={false}>
              {chunk ? 'Muat Ulang' : 'Coba Lagi'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  retry: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },
  debugBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.overlay.red10,
    borderRadius: Radius.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.overlay.red20,
  },
  debugText: {
    color: Colors.text.accent,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    textAlign: 'center',
  }
});

export default ErrorBoundary;
