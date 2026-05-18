import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase, typedFrom } from '../supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { mapAuthError } from '@/utils/authErrors';
import { FetchState } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWatchlist } from './WatchlistContext';

// Required for OAuth flow to work on native
WebBrowser.maybeCompleteAuthSession();

// Platform-aware redirect URL:
// - Web (production): https://watchlistid.vercel.app/auth/callback
// - Web (local dev):  http://localhost:8081/auth/callback  (via Linking.createURL)
// - Native:           moviewatchlist://auth/callback
//
// IMPORTANT: We do NOT use __DEV__ here because Expo sets __DEV__ = true even
// in Vercel production builds (expo export), causing localhost redirects in prod.
// Instead, we use runtime hostname detection which is always accurate.
const PROD_WEB_URL = 'https://watchlistid.vercel.app';

const isWebProduction = Platform.OS === 'web'
  && typeof window !== 'undefined'
  && window.location?.hostname === 'watchlistid.vercel.app';

const REDIRECT_URL = Platform.OS === 'web'
  ? (isWebProduction
      ? `${PROD_WEB_URL}/auth/callback`
      : Linking.createURL('/auth/callback'))
  : 'moviewatchlist://auth/callback';

/** Logged-in user's own profile — separate from the social UserProfile in types/index.ts
 *  which has stricter requirements (id required, username required) suited for
 *  displaying other users. This type uses optional fields for the auth context. */
interface AuthUserProfile {
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

interface AuthContextType {
  session:    Session | null;
  user:       User    | null;
  profile:    FetchState<AuthUserProfile>;
  isLoading:  boolean; // Initial session check
  signIn:     (email: string, password: string, captchaToken?: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signUp:     (email: string, password: string, username?: string, captchaToken?: string) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  signOut:    () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  deleteAccount:  () => Promise<string | null>;
  profileError:   boolean;
}


// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session,   setSession]   = useState<Session | null>(null);
  const [user,      setUser]      = useState<User | null>(null);
  const [profile,   setProfile]   = useState<FetchState<AuthUserProfile>>({ status: 'idle', data: null, error: null });
  const [isLoading, setIsLoading] = useState(true);

  


  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes (login / logout / token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile({ status: 'idle', data: null, error: null });
      return;
    }


    // Fetch initial profile
    const fetchProfileWithRetry = async (retryCount = 0) => {
      setProfile(prev => ({ ...prev, status: 'loading' }));
      try {
        const { data, error } = await typedFrom('profiles').select('username, avatar_url, bio').eq('id', user.id).single();
        
        if (data) {
          setProfile({ status: 'success', data, error: null });
          const metaUsername = user.user_metadata?.username || user.user_metadata?.full_name;
          const metaAvatar   = user.user_metadata?.avatar_url || user.user_metadata?.picture;
          const needsSync = (!data.username && metaUsername) || (!data.avatar_url && metaAvatar);
          
          if (needsSync) {
            await typedFrom('profiles').update({
              username: data.username || metaUsername,
              avatar_url: data.avatar_url || metaAvatar,
            }).eq('id', user.id);
          }
        } else if (error && error.code === 'PGRST116') {
          const metaUsername = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0];
          const metaAvatar   = user.user_metadata?.avatar_url || user.user_metadata?.picture;
          
          const { error: insErr } = await typedFrom('profiles').insert({
            id: user.id,
            username: metaUsername,
            avatar_url: metaAvatar
          });

          if (insErr && retryCount < 2) {
            setTimeout(() => fetchProfileWithRetry(retryCount + 1), 2000);
          } else if (insErr) {
            console.error('Critical Profile Creation Failure:', insErr);
            setProfile({ status: 'error', data: null, error: insErr.message });
          }
        } else if (error) {
          setProfile({ status: 'error', data: null, error: error.message });
        }
      } catch (err) {
        console.error('Profile Fetch Error:', err);
        setProfile({ status: 'error', data: null, error: (err as Error).message });
      }
    };

    fetchProfileWithRetry();

    // Subscribe to realtime changes on this user's profile
    const channel = supabase.channel(`public:profiles:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
        setProfile(prev => ({ ...prev, data: payload.new as AuthUserProfile, status: 'success' }));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await typedFrom('profiles').select('username, avatar_url, bio').eq('id', user.id).single();
    if (data) setProfile({ status: 'success', data: data as AuthUserProfile, error: null });
  };

  /** Returns null on success, or an error message string on failure. */
  const signIn = async (email: string, password: string, captchaToken?: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { captchaToken }
    });
    return error ? mapAuthError(error) : null;
  };

  /** Handles Google Sign-In via Supabase OAuth */
  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const redirectUrl = REDIRECT_URL;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          // Robust token extraction (handles both ?query and #fragment)
          const url = result.url.replace('#', '?');
          const { queryParams } = Linking.parse(url);
          
          const accessToken = queryParams?.access_token as string;
          const refreshToken = queryParams?.refresh_token as string;
          
          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (sessionError) throw sessionError;
          }
        }
      }
      return null;
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      return mapAuthError(err);
    }
  };

  /** Returns null on success, or an error message string on failure. */
  const signUp = async (
    email: string,
    password: string,
    username?: string,
    captchaToken?: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { username: username ?? email.split('@')[0] },
        captchaToken,
      },
    });
    return error ? mapAuthError(error) : null;
  };

  /** Fix 4: Password Update */
  const updatePassword = async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? mapAuthError(error) : null;
  };

  /** Fix 5: Account Deletion (Native Client side) */
  const deleteAccount = async (): Promise<string | null> => {
    if (!user) return 'Not authenticated';
    try {
      // 1. Delete profile (cascade will handle some things, but auth.users requires admin)
      // Note: Full deletion of auth.users usually needs an Edge Function.
      // Here we clear the profile and sign out as a minimum.
      const { error: profErr } = await typedFrom('profiles').delete().eq('id', user.id);
      if (profErr) throw profErr;

      await signOut();
      return null;
    } catch (err: any) {
      return mapAuthError(err);
    }
  };

  const signOut = async () => {
    // Fix 8: Comprehensive Cleanup
    // Note: clearWatchlist() is handled by child providers (WatchlistProvider) 
    // automatically by listening to the auth state / userId changes.
    await AsyncStorage.clear(); 
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      session, user, profile, isLoading,
      refreshProfile, signIn, signInWithGoogle, signUp, signOut, 
      updatePassword, deleteAccount,
      profileError: profile.status === 'error'
    }}>
      {children}
    </AuthContext.Provider>

  );
};

// ── Hook ───────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
