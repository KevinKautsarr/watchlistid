import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase Project URL derived from the Project ID
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// The API key you provided
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const ExpoProvider = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoProvider,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
