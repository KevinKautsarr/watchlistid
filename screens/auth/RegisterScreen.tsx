import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, CheckCircle2, XCircle, Loader } from 'lucide-react-native';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import CaptchaModal from '@/components/auth/CaptchaModal';
import { useLanguage } from '@/context/LanguageContext';
import { typedFrom } from '@/supabase';

// ─── Username validation ──────────────────────────────────────────────────────
const USERNAME_REGEX = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i;
const DOUBLE_SYMBOL   = /[._-]{2,}/;
const FORBIDDEN_NAMES = ['admin', 'administrator', 'owner', 'official', 'support', 'staff', 'mod', 'moderator'];

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function validateUsername(raw: string): string | null {
  if (/\s/.test(raw))                   return 'Username tidak boleh mengandung spasi';
  if (raw.length < 3)                   return 'Username minimal 3 karakter';
  if (raw.length > 30)                  return 'Username maksimal 30 karakter';
  if (!/^[a-zA-Z0-9._-]+$/.test(raw))  return 'Hanya huruf, angka, titik, underscore, dan strip yang diperbolehkan';
  if (/^[._-]|[._-]$/.test(raw))       return 'Username tidak boleh diawali atau diakhiri dengan simbol';
  if (DOUBLE_SYMBOL.test(raw))          return 'Tidak boleh ada dua simbol berurutan';
  const lower = raw.toLowerCase();
  if (FORBIDDEN_NAMES.some(n => lower.includes(n))) return 'Nama ini tidak diizinkan untuk alasan keamanan';
  return null; // valid
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [username,      setUsernameRaw] = useState('');
  const [email,         setEmail]       = useState('');
  const [password,      setPassword]    = useState('');
  const [confirm,       setConfirm]     = useState('');
  const [showPass,      setShowPass]    = useState(false);
  const [loading,       setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCaptcha,   setShowCaptcha] = useState(false);
  const [error,         setError]       = useState<string | null>(null);
  const [success,       setSuccess]     = useState(false);

  // Username live status
  const [usernameStatus,  setUsernameStatus]  = useState<UsernameStatus>('idle');
  const [usernameHint,    setUsernameHint]    = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Handle username change ──────────────────────────────────────────────────
  const handleUsernameChange = (raw: string) => {
    // Strip spaces immediately — never allowed
    const cleaned = raw.replace(/\s/g, '');
    setUsernameRaw(cleaned);
    setUsernameStatus('idle');
    setUsernameHint(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!cleaned) return;

    // Instant local format validation
    const formatErr = validateUsername(cleaned);
    if (formatErr) {
      setUsernameStatus('invalid');
      setUsernameHint(formatErr);
      return;
    }

    // Debounce availability check
    setUsernameStatus('checking');
    debounceRef.current = setTimeout(() => checkAvailability(cleaned), 500);
  };

  const checkAvailability = async (name: string) => {
    try {
      const { data } = await typedFrom('profiles')
        .select('id')
        .ilike('username', name)
        .limit(1)
        .maybeSingle();

      if (data) {
        setUsernameStatus('taken');
        setUsernameHint('Username sudah dipakai');
      } else {
        setUsernameStatus('available');
        setUsernameHint('Username tersedia');
      }
    } catch {
      setUsernameStatus('idle');
      setUsernameHint(null);
    }
  };

  // Clean up debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError(null);

    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError(t('allFieldsRequired'));
      return;
    }

    // Block if username not yet validated as available
    if (usernameStatus === 'checking') {
      setError('Sedang memeriksa ketersediaan username, harap tunggu...');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Username sudah dipakai, pilih username lain');
      return;
    }
    if (usernameStatus === 'invalid') {
      setError(usernameHint || 'Username tidak valid');
      return;
    }

    const formatErr = validateUsername(username);
    if (formatErr) { setError(formatErr); return; }

    if (password !== confirm) { setError(t('passwordsDontMatch')); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Format email tidak valid.');
      return;
    }

    if (password.length < 6) { setError(t('passwordTooShort')); return; }

    setShowCaptcha(true);
  };

  const handleCaptchaVerify = async (token: string) => {
    setShowCaptcha(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    // Always store username as lowercase
    const err = await signUp(email.trim().toLowerCase(), password, username.trim().toLowerCase(), token);
    setLoading(false);

    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <LinearGradient colors={['#7E050B', '#141414', '#141414']} style={StyleSheet.absoluteFill} />
        <View style={s.successWrap}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle} allowFontScaling={false}>{t('accountCreated')}</Text>
          <Text style={s.successSub} allowFontScaling={false}>{t('checkEmailVerification')}</Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/auth/login')}>
            <Text style={s.btnText} allowFontScaling={false}>{t('backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Username status indicator ───────────────────────────────────────────────
  const renderUsernameStatus = () => {
    if (!username || usernameStatus === 'idle') return null;
    if (usernameStatus === 'checking') {
      return (
        <View style={s.hintRow}>
          <ActivityIndicator size={12} color={Colors.text.secondary} />
          <Text style={[s.hintText, { color: Colors.text.secondary }]} allowFontScaling={false}>
            Memeriksa ketersediaan...
          </Text>
        </View>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <View style={s.hintRow}>
          <CheckCircle2 size={13} color="#22c55e" strokeWidth={2.5} />
          <Text style={[s.hintText, { color: '#22c55e' }]} allowFontScaling={false}>
            {usernameHint}
          </Text>
        </View>
      );
    }
    // taken or invalid
    return (
      <View style={s.hintRow}>
        <XCircle size={13} color="#ef4444" strokeWidth={2.5} />
        <Text style={[s.hintText, { color: '#ef4444' }]} allowFontScaling={false}>
          {usernameHint}
        </Text>
      </View>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#7E050B', '#141414', '#141414']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.logoWrap}>
            <Text style={s.logo} allowFontScaling={false}>
              WatchList<Text style={s.logoAccent}>ID</Text>
            </Text>
            <Text style={s.logoSub} allowFontScaling={false}>{t('joinCommunity')}</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle} allowFontScaling={false}>{t('signUp')}</Text>
            <Text style={s.cardSub} allowFontScaling={false}>{t('createAccount')} ✨</Text>

            {/* Username */}
            <View style={s.fieldLabel}>
              <User size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>{t('username')}</Text>
            </View>
            <TextInput
              style={[
                s.input,
                usernameStatus === 'available' && s.inputValid,
                (usernameStatus === 'taken' || usernameStatus === 'invalid') && s.inputError,
              ]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="moviefan123"
              placeholderTextColor={Colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
              maxLength={30}
            />
            {renderUsernameStatus()}

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
                placeholder="Min. 6 karakter"
                placeholderTextColor={Colors.text.secondary}
                secureTextEntry={!showPass}
                allowFontScaling={false}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)} activeOpacity={0.7}>
                {showPass
                  ? <EyeOff size={18} color={Colors.text.secondary} strokeWidth={2} />
                  : <Eye    size={18} color={Colors.text.secondary} strokeWidth={2} />}
              </TouchableOpacity>
            </View>

            {/* Confirm */}
            <View style={[s.fieldLabel, { marginTop: Spacing.lg }]}>
              <Lock size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>{t('confirmPassword')}</Text>
            </View>
            <TextInput
              style={s.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Ulangi password"
              placeholderTextColor={Colors.text.secondary}
              secureTextEntry={!showPass}
              allowFontScaling={false}
            />

            {/* Error */}
            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText} allowFontScaling={false}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[s.btn, (loading || googleLoading) && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : (
                  <>
                    <UserPlus size={18} color={Colors.white} strokeWidth={2.5} />
                    <Text style={s.btnText} allowFontScaling={false}>{t('signUp')}</Text>
                  </>
                )}
            </TouchableOpacity>

            {/* Google Signup */}
            <TouchableOpacity
              style={[s.googleBtn, (loading || googleLoading) && { opacity: 0.7 }]}
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading
                ? <ActivityIndicator color={Colors.text.primary} />
                : (
                  <>
                    <EmptyStateIcon name="google" size={24} />
                    <Text style={s.googleBtnText} allowFontScaling={false}>{t('orSignUpWith')} {t('google')}</Text>
                  </>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText} allowFontScaling={false}>{t('or')}</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Back to login */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={s.backText} allowFontScaling={false}>
                {t('alreadyHaveAccount')} {t('signIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CaptchaModal
        visible={showCaptcha}
        onCancel={() => setShowCaptcha(false)}
        onVerify={handleCaptchaVerify}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.xxl,
  },

  logoWrap:   { alignItems: 'center', marginBottom: Spacing.xxl },
  logo:       { fontSize: 32, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 0.5 },
  logoAccent: { color: Colors.primary },
  logoSub:    { fontSize: FontSize.base, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

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
    height:            50,
    backgroundColor:   Colors.background,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize:          FontSize.base,
    color:             Colors.text.primary,
    marginBottom:      Spacing.sm,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.1)',
  },
  inputValid: {
    borderColor: '#22c55e',
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.sm,
    gap:           Spacing.sm,
  },
  eyeBtn: {
    width:           50,
    height:          50,
    backgroundColor: Colors.background,
    borderRadius:    Radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
  },

  // Username hint row
  hintRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    marginBottom:   Spacing.md,
    paddingLeft:    2,
  },
  hintText: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
  },

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
    height:          54,
    backgroundColor: Colors.primary,
    borderRadius:    Radius.lg,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    ...Shadow.primary,
    marginBottom:    Spacing.md,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },

  googleBtn: {
    height:          54,
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.md,
    ...Shadow.sm,
  },
  googleBtnText: {
    fontSize:      FontSize.base,
    fontWeight:    FontWeight.bold,
    color:         '#000',
    letterSpacing: 0.2,
  },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: FontSize.sm, color: Colors.text.secondary },

  backBtn:  { alignItems: 'center' },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  successWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xxl,
  },
  successEmoji: { fontSize: 64, marginBottom: Spacing.xl },
  successTitle: {
    fontSize:     FontSize.h2,
    fontWeight:   FontWeight.black,
    color:        Colors.white,
    textAlign:    'center',
    marginBottom: Spacing.md,
  },
  successSub: {
    fontSize:     FontSize.base,
    color:        'rgba(255,255,255,0.7)',
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: Spacing.xxl,
  },
});
