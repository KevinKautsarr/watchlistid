import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase, typedFrom } from '@/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { mapAuthError } from '@/utils/authErrors';
import { FetchState } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeClearCorruptStorage, clearStaleSupabaseSession } from '@/utils/storage';

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
  full_name?: string | null;
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
    // ── Step 1: Clean up corrupt/stale localStorage data BEFORE session check ──
    // This prevents the "works in incognito, not in normal browser" crash loop
    // caused by expired or corrupt Supabase auth tokens in localStorage.
    const init = async () => {
      await safeClearCorruptStorage();
      await clearStaleSupabaseSession();

      // ── Step 2: Restore existing session ──
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error('Failed to get session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Listen for auth state changes (login / logout / token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Safety net: force-resolve loading after 5 seconds ─────────────────────
  // Prevents permanent loading spinner if getSession() never resolves
  // (e.g. network timeout, corrupt storage, Supabase SDK bug in normal browser).
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      console.warn('[Auth] Session check timed out — forcing isLoading=false');
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    if (!user) {
      setProfile({ status: 'idle', data: null, error: null });
      return;
    }


    // Fetch initial profile
    const fetchProfileWithRetry = async (retryCount = 0) => {
      setProfile(prev => ({ ...prev, status: 'loading' }));
      try {
        const { data, error } = await typedFrom('profiles').select('username, full_name, avatar_url, bio').eq('id', user.id).single();
        
        if (data) {
          setProfile({ status: 'success', data, error: null });
          const metaUsername = user.user_metadata?.username || user.user_metadata?.full_name;
          const metaAvatar   = user.user_metadata?.avatar_url || user.user_metadata?.picture;
          const needsSync = (!data.username && metaUsername) || (!data.avatar_url && metaAvatar);
          
          if (needsSync) {
            await typedFrom('profiles').update({
              username: data.username || metaUsername,
              full_name: data.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
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

    // Realtime subscription: only on native (iOS/Android app).
    // On web (including iOS Safari), WebKit blocks WebSocket with
    // "The operation is insecure" — we skip Realtime and rely on
    // one-time fetches + manual refreshProfile() calls instead.
    if (Platform.OS === 'web') return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase.channel(`public:profiles:${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          setProfile(prev => ({ ...prev, data: payload.new as AuthUserProfile, status: 'success' }));
        })
        .subscribe();
    } catch (err) {
      console.warn('[Auth] Realtime subscription failed (expected on web):', err);
    }

    return () => {
      channel?.unsubscribe();
    };
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await typedFrom('profiles').select('username, full_name, avatar_url, bio').eq('id', user.id).single();
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
      // On web (desktop & iOS browser): use direct redirect flow — no popup.
      // WebBrowser.openAuthSessionAsync is for native apps only.
      // iOS Safari blocks popups from TouchableOpacity events, so we must
      // redirect the current window instead.
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: REDIRECT_URL,
            skipBrowserRedirect: false, // Let Supabase redirect the window directly
          },
        });
        if (error) return mapAuthError(error);
        return null; // Page will redirect
      }

      // Native (iOS/Android app): use in-app browser session
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URL,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
        
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

  /** Fix 5: Account Deletion (Native Client side via RPC) */
  const deleteAccount = async (): Promise<string | null> => {
    if (!user) return 'Not authenticated';
    try {
      // Panggil fungsi RPC untuk menghapus akun secara permanen dari auth.users
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      await signOut();
      return null;
    } catch (err: any) {
      return mapAuthError(err);
    }
  };

  const signOut = async () => {
    // Fix 8: Non-destructive Cleanup
    // Note: clearData() di WatchlistProvider otomatis mendeteksi perubahan userId (menjadi null)
    // dan menghapus cache lokal (@watchlist, @userRatings, dll) tanpa merusak preferensi sistem.
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] SignOut error (expected if offline):', err);
    }
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
