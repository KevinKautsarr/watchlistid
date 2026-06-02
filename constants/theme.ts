import { Platform, ViewStyle } from 'react-native';

// ─── Red Gradient Palette ────────────────────────────────────────────────────
// Fierce, passionate, commanding — Letterboxd meets Netflix premium aesthetics
export const Colors = {
  // === PRIMARY BRAND (Red Gradient) ===
  primary:        '#C71F37',  // Intense Cherry — main CTA, buttons
  primaryDark:    '#A11D33',  // Ruby Red — hover states, pressed
  primaryDeep:    '#6E1423',  // Burgundy — dark accents
  primaryDarkest: '#641220',  // Night Bordeaux — deepest shade

  // Gradient stops
  gradient: {
    start: '#E01E37',  // Scarlet Rush — brightest
    mid:   '#C71F37',  // Intense Cherry
    end:   '#641220',  // Night Bordeaux — darkest
  },

  // === BACKGROUNDS ===
  background:      '#0A0A0B',  // Near black — main bg
  surface:         '#141014',  // Slightly warm dark — cards
  surfaceElevated: '#1E1218',  // Elevated cards — bordeaux tint
  surfaceBorder:   '#2A1520',  // Border with red undertone
  dark:            '#000000',
  white:           '#FFFFFF',

  // === TEXT ===
  text: {
    primary:   '#F5F0F1',  // Warm white
    secondary: '#A89098',  // Muted rose-gray
    inverse:   '#0A0A0B',
    accent:    '#E01E37',  // Scarlet Rush
  },

  // === ACCENT ===
  ratingGold:  '#F5C518',  // Rating gold (unchanged)
  accentRed:   '#E01E37',  // Scarlet Rush — highlights
  accentBlue:  '#E01E37',  // Remapped to red for social CTAs (Pill tab etc.)
  secondary:   '#1E1218',  // surfaceElevated used as secondary bg
  success:     '#22C55E',
  warning:     '#F59E0B',
  danger:      '#E01E37',  // Scarlet Rush

  // === TAB BAR ===
  tabBarBackground: '#0F080A',
  tabBarActive:     '#E01E37',
  tabBarInactive:   '#6B5058',

  // === OVERLAY ===
  overlay: {
    // Red-tinted overlays
    red10: 'rgba(199, 31, 55, 0.1)',
    red20: 'rgba(199, 31, 55, 0.2)',
    red50: 'rgba(199, 31, 55, 0.5)',

    // Neutral overlays (preserved for backward compat)
    dark:    'rgba(0,0,0,0.8)',
    medium:  'rgba(0,0,0,0.5)',
    dark50:  'rgba(0,0,0,0.5)',
    dark60:  'rgba(0,0,0,0.6)',
    dark70:  'rgba(0,0,0,0.7)',
    dark85:  'rgba(0,0,0,0.85)',
    dark90:  'rgba(0,0,0,0.9)',

    // Light overlays (preserved for backward compat)
    light:   'rgba(255,255,255,0.1)',
    light2:  'rgba(255,255,255,0.02)',
    light3:  'rgba(255,255,255,0.03)',
    light5:  'rgba(255,255,255,0.05)',
    light8:  'rgba(255,255,255,0.08)',
    light10: 'rgba(255,255,255,0.1)',
    light15: 'rgba(255,255,255,0.15)',
    light20: 'rgba(255,255,255,0.2)',
    light30: 'rgba(255,255,255,0.3)',
    light40: 'rgba(255,255,255,0.4)',
    light50: 'rgba(255,255,255,0.5)',
    light60: 'rgba(255,255,255,0.6)',
    light85: 'rgba(255,255,255,0.85)',
  },
  shadow: {
    color: '#000000',
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
  xxs:  10,
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
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
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
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' } as unknown as ViewStyle,
    })
  },
  md: {
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web:     { boxShadow: '0 4px 20px rgba(100,18,32,0.3)' } as unknown as ViewStyle,
    })
  },
  lg: {
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 8 },
      web:     { boxShadow: '0 8px 32px rgba(100,18,32,0.4)' } as unknown as ViewStyle,
    })
  },
  primary: {
    ...Platform.select({
      ios:     { shadowColor: '#C71F37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12 },
      android: { elevation: 6 },
      web:     { boxShadow: '0 4px 16px rgba(199,31,55,0.45)' } as unknown as ViewStyle,
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
