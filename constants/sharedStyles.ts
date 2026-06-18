import { StyleSheet, Platform } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from './theme';

/**
 * Shared styles for the WatchlistID application.
 * Use these to maintain consistency and reduce duplication.
 */
export const sharedStyles = StyleSheet.create({
  // Layouts
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  
  // Containers
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl },
  
  // Lists
  listContent: { 
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  
  // Shadows (Web-compatible)
  shadowSm: { ...Shadow.sm },
  shadowMd: { ...Shadow.md },
  shadowLg: { ...Shadow.lg },
  
  // Common UI Elements
  vDivider: { 
    width: 1, 
    height: '60%', 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  hDivider: { 
    height: 1, 
    width: '100%', 
    backgroundColor: 'rgba(255,255,255,0.05)' 
  },
  
  // Interactive
  buttonScale: {
    transform: [{ scale: 1 }],
  },
  
  // Text
  textCenter: { textAlign: 'center' },
  italic: { fontStyle: 'italic' },
});

export default sharedStyles;
