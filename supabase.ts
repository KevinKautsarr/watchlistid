import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';
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

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoProvider,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type TableNames = keyof Database['public']['Tables'];

import type { PostgrestQueryBuilder } from '@supabase/supabase-js';

/**
 * Type-safe query builder wrapper around supabase.from()
 * Prevents querying non-existent tables automatically via Database types.
 */
export const typedFrom = <T extends TableNames>(table: T) => {
  return supabase.from(table as string);
};
