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
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (password !== confirm) {
      setError('Password dan konfirmasi tidak cocok.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const err = await signUp(email.trim().toLowerCase(), password, username.trim());
    setLoading(false);
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <LinearGradient colors={['#7E050B', '#141414', '#141414']} style={StyleSheet.absoluteFill} />
        <View style={s.successWrap}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle} allowFontScaling={false}>Akun Berhasil Dibuat!</Text>
          <Text style={s.successSub} allowFontScaling={false}>
            Cek email kamu untuk verifikasi, lalu masuk ke aplikasi.
          </Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/auth/login' as any)}>
            <Text style={s.btnText} allowFontScaling={false}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
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
              Bergabung dan mulai track filmmu
            </Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle} allowFontScaling={false}>Daftar</Text>
            <Text style={s.cardSub} allowFontScaling={false}>
              Buat akun gratis sekarang ✨
            </Text>

            {/* Username */}
            <View style={s.fieldLabel}>
              <User size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>Username</Text>
            </View>
            <TextInput
              style={s.input}
              value={username}
              onChangeText={setUsername}
              placeholder="moviefan123"
              placeholderTextColor={Colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />

            {/* Email */}
            <View style={s.fieldLabel}>
              <Mail size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>Email</Text>
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
              <Text style={s.label} allowFontScaling={false}>Password</Text>
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

            {/* Confirm */}
            <View style={[s.fieldLabel, { marginTop: Spacing.lg }]}>
              <Lock size={15} color={Colors.primary} strokeWidth={2} />
              <Text style={s.label} allowFontScaling={false}>Konfirmasi Password</Text>
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
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : (
                  <>
                    <UserPlus size={18} color={Colors.white} strokeWidth={2.5} />
                    <Text style={s.btnText} allowFontScaling={false}>Buat Akun</Text>
                  </>
                )}
            </TouchableOpacity>

            {/* Back to login */}
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={s.backText} allowFontScaling={false}>
                Sudah punya akun? Masuk
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: {
    flexGrow:         1,
    justifyContent:   'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical:  Spacing.xxl,
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
    height:           50,
    backgroundColor:  Colors.background,
    borderRadius:     Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize:         FontSize.base,
    color:            Colors.text.primary,
    marginBottom:     Spacing.lg,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.1)',
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
    marginBottom:    Spacing.lg,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },

  backBtn:  { alignItems: 'center' },
  backText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  // Success state
  successWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xxl,
  },
  successEmoji: { fontSize: 64, marginBottom: Spacing.xl },
  successTitle: {
    fontSize:   FontSize.h2,
    fontWeight: FontWeight.black,
    color:      Colors.white,
    textAlign:  'center',
    marginBottom: Spacing.md,
  },
  successSub: {
    fontSize:   FontSize.base,
    color:      'rgba(255,255,255,0.7)',
    textAlign:  'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
});
