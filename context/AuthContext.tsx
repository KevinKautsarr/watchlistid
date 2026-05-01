import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  username?: string;
  avatar_url?: string;
}

interface AuthContextType {
  session:    Session | null;
  user:       User    | null;
  profile:    UserProfile | null;
  isLoading:  boolean;
  signIn:     (email: string, password: string) => Promise<string | null>;
  signUp:     (email: string, password: string, username?: string) => Promise<string | null>;
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
    supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
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
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  /** Returns null on success, or an error message string on failure. */
  const signUp = async (
    email: string,
    password: string,
    username?: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username ?? email.split('@')[0] } },
    });
    return error ? error.message : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signIn, signUp, signOut }}>
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
