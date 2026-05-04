import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import CaptchaModal from '../../components/auth/CaptchaModal';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(t('emailPasswordRequired'));
      return;
    }
    setError(null);
    setShowCaptcha(true);
  };

  const onCaptchaVerified = async (token: string) => {
    setShowCaptcha(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password, token);
    setLoading(false);
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      // Auth state listener in _layout.tsx handles redirect automatically
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoogleLoading(true);
    setError(null);
    const err = await signInWithGoogle();
    setGoogleLoading(false);
    
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      // Success is handled by the auth state listener in AuthContext
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient colors={['#7E050B', '#141414', '#141414']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoWrap}>
            <Text style={s.logo} allowFontScaling={false}>
              WatchList<Text style={s.logoAccent}>ID</Text>
            </Text>
            <Text style={s.logoSub} allowFontScaling={false}>
              {t('authTagline')}
            </Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle} allowFontScaling={false}>{t('signIn')}</Text>
            <Text style={s.cardSub} allowFontScaling={false}>
              {t('welcomeBack')}
            </Text>

            {/* Email */}
            <View style={s.fieldLabel}>
              <Mail size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>{t('email')}</Text>
            </View>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />

            {/* Password */}
            <View style={s.fieldLabel}>
              <Lock size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>{t('password')}</Text>
            </View>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.secondary}
                secureTextEntry={!showPass}
                allowFontScaling={false}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPass(v => !v)}
                activeOpacity={0.7}
              >
                {showPass
                  ? <EyeOff size={18} color={Colors.text.secondary} strokeWidth={2} />
                  : <Eye    size={18} color={Colors.text.secondary} strokeWidth={2} />}
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={s.forgotBtn}
              onPress={() => router.push('/auth/forgot' as any)}
              activeOpacity={0.7}
            >
              <Text style={s.forgotText} allowFontScaling={false}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Error */}
            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText} allowFontScaling={false}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : (
                  <>
                    <LogIn size={18} color={Colors.white} strokeWidth={2.5} />
                    <Text style={s.btnText} allowFontScaling={false}>{t('signIn')}</Text>
                  </>
                )}
            </TouchableOpacity>

            {/* Google Login Button */}
            <TouchableOpacity
              style={[s.googleBtn, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading
                ? <ActivityIndicator color={Colors.text.primary} />
                : (
                  <>
                    <View style={s.googleIconBg}>
                      <FontAwesome name="google" size={16} color="#4285F4" />
                    </View>
                    <Text style={s.googleBtnText} allowFontScaling={false}>{t('orContinueWith')} {t('google')}</Text>
                  </>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText} allowFontScaling={false}>{t('or')}</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Register link */}
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => router.push('/auth/register' as any)}
              activeOpacity={0.85}
            >
              <Text style={s.secondaryBtnText} allowFontScaling={false}>
                {t('createNewAccount')}
              </Text>
            </TouchableOpacity>

            {/* Skip & Explore */}
            <TouchableOpacity
              style={s.skipBtn}
              onPress={() => router.replace('/(tabs)' as any)}
              activeOpacity={0.7}
            >
              <Text style={s.skipText} allowFontScaling={false}>
                {t('skipAndExplore')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CaptchaModal 
        visible={showCaptcha} 
        onVerify={onCaptchaVerified} 
        onCancel={() => setShowCaptcha(false)} 
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  scroll: {
    flexGrow:         1,
    justifyContent:   'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical:  Spacing.xxl,
  },

  logoWrap:  { alignItems: 'center', marginBottom: Spacing.xxl },
  logo:      { fontSize: 32, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 0.5 },
  logoAccent:{ color: Colors.primary },
  logoSub:   { fontSize: FontSize.base, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.xxl,
    padding:         Spacing.xxl,
    ...Shadow.md,
  },
  cardTitle: { fontSize: FontSize.h2, fontWeight: FontWeight.black, color: Colors.text.primary, marginBottom: 4 },
  cardSub:   { fontSize: FontSize.base, color: Colors.text.secondary, marginBottom: Spacing.xxl },

  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label:      { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text.primary, letterSpacing: 0.3 },

  input: {
    height:          50,
    backgroundColor: Colors.background,
    borderRadius:    Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize:        FontSize.base,
    color:           Colors.text.primary,
    marginBottom:    Spacing.lg,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.sm,
    gap:           Spacing.sm,
  },
  eyeBtn: {
    width:          50,
    height:         50,
    backgroundColor: Colors.background,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.1)',
  },

  forgotBtn:  { alignSelf: 'flex-end', marginBottom: Spacing.xl, marginTop: 4 },
  forgotText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  errorBox: {
    backgroundColor: 'rgba(220,53,69,0.08)',
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
    borderWidth:     1,
    borderColor:     'rgba(220,53,69,0.2)',
  },
  errorText: { fontSize: FontSize.sm, color: '#DC3545', fontWeight: FontWeight.medium },

  btn: {
    height:         54,
    backgroundColor: Colors.primary,
    borderRadius:   Radius.lg,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.sm,
    ...Shadow.primary,
    marginBottom:   Spacing.md,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },

  googleBtn: {
    height:         54,
    backgroundColor: Colors.white,
    borderRadius:   Radius.lg,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.md,
    ...Shadow.sm,
  },
  googleIconBg: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#000',
    letterSpacing: 0.2,
  },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: FontSize.sm, color: Colors.text.secondary },

  secondaryBtn: {
    height:         54,
    backgroundColor: Colors.background,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },

  skipBtn: { alignItems: 'center', marginTop: Spacing.xl },
  skipText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },
});
