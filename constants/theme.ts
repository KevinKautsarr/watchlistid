export const Colors = {
  background:   '#F9F7F7',
  surface:      '#DBE2EF',
  primary:      '#3F72AF',
  dark:         '#112D4E',
  white:        '#FFFFFF',
  ratingGold:   '#F5C518',

  // Semantic aliases
  text: {
    primary:    '#112D4E',
    secondary:  'rgba(17,45,78,0.45)',
    inverse:    '#F9F7F7',
    accent:     '#3F72AF',
  },
  overlay: {
    dark:       'rgba(17,45,78,0.7)',
    medium:     'rgba(17,45,78,0.45)',
    light:      'rgba(17,45,78,0.08)',
  },
  shadow: {
    color:      '#112D4E',
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
    shadowColor:   '#112D4E',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  6,
    elevation:     2,
  },
  md: {
    shadowColor:   '#112D4E',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  10,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#112D4E',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius:  16,
    elevation:     8,
  },
  primary: {
    shadowColor:   '#3F72AF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  10,
    elevation:     6,
  },
} as const;

export const TMDB_IMAGE_SIZES = {
  thumb:    'https://image.tmdb.org/t/p/w92',
  small:    'https://image.tmdb.org/t/p/w185',
  medium:   'https://image.tmdb.org/t/p/w342',
  large:    'https://image.tmdb.org/t/p/w500',
  backdrop: 'https://image.tmdb.org/t/p/w1280',
} as const;
