/**
 * App Navigation Type Definitions
 * 
 * Centralized route mapping for Expo Router to ensure type-safe navigation
 * across the application.
 */

export type AppRoutes = {
  // Tabs
  '/': undefined;
  '/(tabs)': undefined;
  '/(tabs)/index': undefined;
  '/(tabs)/search': undefined;
  '/(tabs)/watchlist': undefined;
  '/(tabs)/profile': { userId?: string };

  // Dynamic Routes
  '/movie/[id]': { id: string; type?: 'movie' | 'tv' };
  '/person/[id]': { id: string; name?: string };

  // Static Pages
  '/notifications': undefined;
  '/search-users': undefined;
  '/about': undefined;
  '/privacy': undefined;
  '/terms': undefined;

  // Auth
  '/auth/login': undefined;
  '/auth/register': undefined;
};

/**
 * Helper to get params for a given route
 */
export type RouteParams<T extends keyof AppRoutes> = AppRoutes[T];
