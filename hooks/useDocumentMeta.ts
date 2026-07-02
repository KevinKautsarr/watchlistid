import { useEffect } from 'react';
import { Platform } from 'react-native';

export interface DocumentMeta {
  title: string;
  description: string;
  /** Absolute image URL. Falls back to the default OG image when omitted. */
  image?: string;
  /** Absolute canonical URL for this page. */
  url?: string;
}

const DEFAULT_TITLE = 'WatchlistID — Track, Rate, and Discover Movies & TV Shows';
const DEFAULT_DESCRIPTION =
  'WatchlistID is your personal movie and TV show tracker. Discover trending films, build your watchlist, rate what you have watched, and follow friends.';
const DEFAULT_IMAGE = 'https://watchlistid.vercel.app/og-image.png';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function applyMeta(meta: DocumentMeta) {
  document.title = meta.title;
  setMeta('description', meta.description);
  setMeta('og:title', meta.title, 'property');
  setMeta('og:description', meta.description, 'property');
  setMeta('og:image', meta.image || DEFAULT_IMAGE, 'property');
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.description);
  setMeta('twitter:image', meta.image || DEFAULT_IMAGE);
  if (meta.url) {
    setMeta('og:url', meta.url, 'property');
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = meta.url;
  }
}

/**
 * Updates document title + Open Graph/Twitter meta tags for the current
 * screen (web only). This is a client-side-only SPA (no SSR), so this does
 * NOT help crawlers that don't execute JS — but it fixes the browser tab
 * title, and general link-preview tools that do execute JS still benefit.
 *
 * Restores the app-wide default meta on unmount so navigating away doesn't
 * leave a stale title/OG tag from a previously visited detail page.
 */
export function useDocumentMeta(meta: DocumentMeta | null) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !meta) return;
    applyMeta(meta);
    return () => {
      applyMeta({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, image: DEFAULT_IMAGE });
    };
  }, [meta?.title, meta?.description, meta?.image, meta?.url]);
}
