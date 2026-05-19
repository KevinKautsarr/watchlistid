import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase Project URL derived from the Project ID
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
} else if (supabaseUrl && supabaseUrl.startsWith('http://') && supabaseUrl.includes('supabase.co')) {
  supabaseUrl = supabaseUrl.replace('http://', 'https://');
}

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

// C4 note: Switched to createClient<Database> after successful type generation.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoProvider,
    autoRefreshToken: true,
    persistSession: true,
    // On web, Supabase must read the #access_token from the URL hash after OAuth redirect.
    // We enable this for ALL web environments — it safely no-ops when no hash token is present.
    // On native, URL detection is not needed (tokens are set manually via setSession).
    detectSessionInUrl: typeof window !== 'undefined',
  },
});

export type TableNames = keyof Database['public']['Tables'];

/**
 * Type-safe query builder wrapper around supabase.from().
 * Enforces valid table names at compile time — prevents typos like
 * typedFrom('notificaitons') from compiling.
 *
 * This is the primary table-name safety mechanism for this project.
 * Column-level type safety will be fully unlocked after running:
 *   npx supabase gen types typescript --project-id <ref>
 */
export const typedFrom = <T extends TableNames>(table: T) => {
  return supabase.from(table);
};

