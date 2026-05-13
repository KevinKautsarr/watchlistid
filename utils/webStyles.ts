import { Platform } from 'react-native';

/**
 * Professional web-only styles for enhanced interactive experience.
 */
export const webHover = (Platform.OS === 'web' ? {
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, transform 0.15s ease',
} : {}) as any;

export const cursorPointer = (Platform.OS === 'web' ? { cursor: 'pointer' } : {}) as any;
