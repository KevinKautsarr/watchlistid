import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../supabase';
import type { Session, User } from '@supabase/supabase-js';

// Required for OAuth flow to work on native
WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
  username?: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  session:    Session | null;
  user:       User    | null;
  profile:    UserProfile | null;
  isLoading:  boolean;
  signIn:     (email: string, password: string, captchaToken?: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signUp:     (email: string, password: string, username?: string, captchaToken?: string) => Promise<string | null>;
  signOut:    () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session,   setSession]   = useState<Session | null>(null);
  const [user,      setUser]      = useState<User | null>(null);
  const [profile,   setProfile]   = useState<UserProfile | null>(null);
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
      setProfile(null);
      return;
    }

    // Fetch initial profile
    supabase.from('profiles').select('username, avatar_url, bio').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });

    // Subscribe to realtime changes on this user's profile
    const channel = supabase.channel(`public:profiles:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
        setProfile(payload.new as UserProfile);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  /** Returns null on success, or an error message string on failure. */
  const signIn = async (email: string, password: string, captchaToken?: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: {
        captchaToken,
      }
    });
    return error ? error.message : null;
  };

  /** Handles Google Sign-In via Supabase OAuth */
  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      
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
      return err.message || 'Gagal login dengan Google';
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
    return error ? error.message : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signIn, signInWithGoogle, signUp, signOut }}>
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
