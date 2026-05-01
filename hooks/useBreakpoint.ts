import { useWindowDimensions } from 'react-native';

/**
 * Responsive breakpoints:
 *  - mobile:  < 768px
 *  - tablet:  768px – 1099px
 *  - desktop: >= 1100px
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** True for any non-mobile screen (tablet or desktop) */
  isLarge: boolean;
  /** Columns to use for grid layouts */
  columns: number;
  /** Card width for media cards in horizontal scroll rows */
  cardWidth: number;
  /** Horizontal content padding */
  contentPadding: number;
  /** Max width for centered content on desktop */
  maxContentWidth: number;
}

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= 1100 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';

  return {
    width,
    height,
    breakpoint,
    isMobile:  breakpoint === 'mobile',
    isTablet:  breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isLarge:   breakpoint !== 'mobile',
    columns:       breakpoint === 'desktop' ? 6 : breakpoint === 'tablet' ? 4 : 3,
    cardWidth:     breakpoint === 'desktop' ? 160 : breakpoint === 'tablet' ? 145 : 130,
    contentPadding: breakpoint === 'desktop' ? 40 : breakpoint === 'tablet' ? 28 : 20,
    maxContentWidth: breakpoint === 'desktop' ? 1400 : 9999,
  };
}
