import { Platform } from 'react-native';

export const nativeDriver = { useNativeDriver: Platform.OS !== 'web' };
