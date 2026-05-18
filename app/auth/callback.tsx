import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../supabase';
import { Colors } from '@/constants/theme';

/**
 * Web-only OAuth callback handler.
 * Supabase redirects here after Google Sign-In on web.
 * The URL contains #access_token=...&refresh_token=... in the fragment.
 * We extract those tokens, set the session, then navigate to the app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase appends tokens in the URL hash fragment on web
        // e.g. /auth/callback#access_token=xxx&refresh_token=yyy&type=recovery
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', '?'));
        
        const accessToken  = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type         = params.get('type'); // 'recovery' for password reset

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

          // Password reset flow — redirect to update password page
          if (type === 'recovery') {
            router.replace('/auth/reset-password' as any);
            return;
          }
        }

        // Normal sign-in — go to home
        router.replace('/');
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, []);

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
