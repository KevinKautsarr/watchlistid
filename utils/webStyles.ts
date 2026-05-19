import { Platform, ViewStyle, TextStyle } from 'react-native';

/**
 * Professional web-only styles for enhanced interactive experience.
 */
export const webHover = (Platform.OS === 'web' ? {
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, transform 0.15s ease',
} : {}) as unknown as ViewStyle;

export const cursorPointer = (Platform.OS === 'web' ? { cursor: 'pointer' } : {}) as unknown as ViewStyle;

export const textShadow = (
  color: string,
  offsetX: number,
  offsetY: number,
  blur: number
) => Platform.select({
  web: {
    textShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}`,
  },
  default: {
    textShadowColor: color,
    textShadowOffset: { width: offsetX, height: offsetY },
    textShadowRadius: blur,
  }
}) as unknown as TextStyle;

export const boxShadow = (
  color: string,
  offsetX: number,
  offsetY: number,
  blur: number,
  opacity: number,
  elevation?: number
) => Platform.select({
  web: {
    boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${color.replace(')', `, ${opacity})`).replace('rgb', 'rgba')}`,
  },
  default: {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation: elevation ?? 4,
  }
}) as unknown as ViewStyle;

