import { Platform, ViewStyle } from 'react-native';
export const Colors = {
  background:   '#141414',
  surface:      '#202020',
  primary:      '#E50914',
  dark:         '#000000',
  white:        '#FFFFFF',
  ratingGold:   '#F5C518',
  secondary:    '#112D4E',
  accentBlue:   '#3F72AF',
  tabBarBackground: '#141414',
  danger:       '#E50914',
  success:      '#22C55E',
  warning:      '#F59E0B',

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
    light10:    'rgba(255,255,255,0.1)',
    light20:    'rgba(255,255,255,0.2)',
    light50:    'rgba(255,255,255,0.5)',
    light2:     'rgba(255,255,255,0.02)',
    light3:     'rgba(255,255,255,0.03)',
    light5:     'rgba(255,255,255,0.05)',
    light8:     'rgba(255,255,255,0.08)',
    light15:    'rgba(255,255,255,0.15)',
    light30:    'rgba(255,255,255,0.3)',
    light40:    'rgba(255,255,255,0.4)',
    light60:    'rgba(255,255,255,0.6)',
    light85:    'rgba(255,255,255,0.85)',
    dark50:     'rgba(0,0,0,0.5)',
    dark60:     'rgba(0,0,0,0.6)',
    dark85:     'rgba(0,0,0,0.85)',
    dark70:     'rgba(0,0,0,0.7)',
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
  xs:   12,
  sm:   14,
  base: 16,
  md:   16,
  lg:   18,
  xl:   20,
  xxl:  24,
  xxxl: 32,
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

export const IconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const Shadow = {
  sm: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' } as unknown as ViewStyle,
    })
  },
  md: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.3)' } as unknown as ViewStyle,
    })
  },
  lg: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 16px rgba(0,0,0,0.4)' } as unknown as ViewStyle,
    })
  },
  primary: {
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 10px ${Colors.primary}66` } as unknown as ViewStyle,
    })
  },
} as const;

export const TMDB_IMAGE_SIZES = {
  thumb:    'https://image.tmdb.org/t/p/w92',
  small:    'https://image.tmdb.org/t/p/w185',
  medium:   'https://image.tmdb.org/t/p/w342',
  large:    'https://image.tmdb.org/t/p/w500',
  backdrop: 'https://image.tmdb.org/t/p/w780',
} as const;

