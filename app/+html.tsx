import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML shell for Expo Router web output.
 * Adds critical performance and security meta tags.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary SEO */}
        <title>WatchlistID — Track, Rate, and Discover Movies & TV Shows</title>
        <meta name="description" content="WatchlistID is your ultimate movie and TV show watchlist tracker. Rate what you've watched, discover trending media, and share logs with your friends." />
        <meta name="theme-color" content="#141414" />
        <link rel="canonical" href="https://watchlistid.vercel.app" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://watchlistid.vercel.app" />
        <meta property="og:title" content="WatchlistID — Track, Rate, and Discover Movies & TV Shows" />
        <meta property="og:description" content="WatchlistID is your ultimate movie and TV show watchlist tracker. Rate what you've watched, discover trending media, and share logs with your friends." />
        <meta property="og:site_name" content="WatchlistID" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://watchlistid.vercel.app" />
        <meta name="twitter:title" content="WatchlistID — Track, Rate, and Discover Movies & TV Shows" />
        <meta name="twitter:description" content="WatchlistID is your ultimate movie and TV show watchlist tracker. Rate what you've watched, discover trending media, and share logs with your friends." />

        {/* Performance: preconnect to 3rd party origins */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://xwdgpsvmqzilcmcbibvp.supabase.co" />

        {/* 
          Security headers should ideally be set at the HTTP server level.
          The X-Frame-Options meta tag is NOT valid and has been intentionally removed here.
          Use server-side headers instead (e.g., in Nginx, Vercel, or Netlify config).
        */}

        {/*
          Suppress the broken CSS resets that come from React Native Web
          Expo Router applies this automatically to prevent flash of unstyled content.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent layout shift on initial load */
            #root, body, html { height: 100%; }
            body { background-color: #141414; overflow: hidden; }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
