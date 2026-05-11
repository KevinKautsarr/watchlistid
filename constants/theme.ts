import { Platform } from 'react-native';
export const Colors = {
  background:   '#141414',
  surface:      '#202020',
  primary:      '#E50914',
  dark:         '#000000',
  white:        '#FFFFFF',
  ratingGold:   '#F5C518',

  // Semantic aliases
  text: {
    primary:    '#FFFFFF',
    secondary:  'rgba(255,255,255,0.6)',
    inverse:    '#141414',
    accent:     '#E50914',
  },
  overlay: {
    dark:       'rgba(0,0,0,0.8)',
    medium:     'rgba(0,0,0,0.5)',
    light:      'rgba(255,255,255,0.1)',
  },
  shadow: {
    color:      '#000000',
  },
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  xxxl: 40,
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  xxl:  24,
  full: 9999,
} as const;

export const FontSize = {
  xs:   10,
  sm:   11,
  md:   13,
  base: 14,
  lg:   16,
  xl:   18,
  xxl:  20,
  xxxl: 24,
  h2:   26,
  h1:   32,
} as const;

export const FontWeight = {
  regular:    '400' as const,
  medium:     '500' as const,
  semibold:   '600' as const,
  bold:       '700' as const,
  extrabold:  '800' as const,
  black:      '900' as const,
} as const;

export const Shadow = {
  sm: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' } as any,
    })
  },
  md: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.3)' } as any,
    })
  },
  lg: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 16px rgba(0,0,0,0.4)' } as any,
    })
  },
  primary: {
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 10px ${Colors.primary}66` } as any,
    })
  },
} as const;

export const TMDB_IMAGE_SIZES = {
  thumb:    'https://image.tmdb.org/t/p/w92',
  small:    'https://image.tmdb.org/t/p/w185',
  medium:   'https://image.tmdb.org/t/p/w342',
  large:    'https://image.tmdb.org/t/p/w500',
  backdrop: 'https://image.tmdb.org/t/p/w780',  // was w1280 — saves ~50% image size
} as const;
