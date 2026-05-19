import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../supabase';
import { Colors } from '@/constants/theme';

/**
 * OAuth callback handler — supports both PKCE and Implicit flows.
 *
 * PKCE flow (used by iOS web & modern browsers):
 *   URL: /auth/callback?code=<auth_code>
 *   Supabase SDK automatically exchanges the code for a session.
 *
 * Implicit flow (legacy, some desktop browsers):
 *   URL: /auth/callback#access_token=<token>&refresh_token=<token>
 *   We manually parse the hash and call setSession.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  const handleCallback = useCallback(async () => {
    try {
      // ── PKCE flow: URL contains ?code=... ──────────────────────────────────
      // Supabase's detectSessionInUrl=true automatically handles this.
      // We just need to wait a tick for it to exchange the code, then check.
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // Give Supabase SDK time to exchange the code for a session
        await new Promise(resolve => setTimeout(resolve, 800));
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/(tabs)');
          return;
        }
      }

      // ── Implicit flow: URL contains #access_token=... ─────────────────────
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken  = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type         = params.get('type');

        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken ?? '',
          });

          if (error) {
            console.error('Auth callback session error:', error.message);
            router.replace('/auth/login');
            return;
          }

          // Password reset flow
          if (type === 'recovery') {
            router.replace('/auth/reset-password' as any);
            return;
          }

          router.replace('/(tabs)');
          return;
        }
      }

      // ── Fallback: check existing session ──────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      router.replace('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


