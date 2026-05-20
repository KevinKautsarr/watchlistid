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
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

// Brand palette — Intense Cherry & Night Bordeaux (WatchlistID theme)
const BRAND_PRIMARY = Colors.primary;        // Intense Cherry #C71F37
const BRAND_DARK = Colors.surfaceElevated;   // Night Bordeaux #1E1218
const BG_DARK = Colors.background;           // Near-black #0A0A0B

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError(null);
    
    // 1. Password length validation
    if (password.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Password harus minimal 8 karakter.');
      return;
    }

    // 2. Confirm password match validation
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const errMessage = await updatePassword(password);
      setLoading(false);

      if (errMessage) {
        // Map error message to user friendly Indonesian
        if (errMessage.includes('same as old')) {
          setError('Password baru tidak boleh sama dengan password lama.');
        } else if (errMessage.includes('session') || errMessage.includes('invalid claim')) {
          setError('Sesi pemulihan tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.');
        } else {
          setError(errMessage);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        // Redirect to tabs page after showing success message briefly
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Terjadi kesalahan sistem saat mengatur ulang kata sandi.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient utilizing deep navy to black */}
      <LinearGradient colors={[BRAND_DARK, BG_DARK, BG_DARK]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <View style={s.logoWrap}>
            <Text style={s.logo} allowFontScaling={false}>
              WatchList<Text style={s.logoAccent}>ID</Text>
            </Text>
            <Text style={s.logoSub} allowFontScaling={false}>
              Atur Ulang Kata Sandi
            </Text>
          </View>

          {/* Card Wrapper */}
          <View style={s.card}>
            {success ? (
              <View style={s.successContainer}>
                <CheckCircle size={56} color="#22C55E" strokeWidth={2} />
                <Text style={s.successTitle} allowFontScaling={false}>Berhasil!</Text>
                <Text style={s.successMessage} allowFontScaling={false}>
                  Password Anda telah diperbarui. Mengalihkan Anda ke halaman utama...
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.cardTitle} allowFontScaling={false}>Kata Sandi Baru</Text>
                <Text style={s.cardSub} allowFontScaling={false}>
                  Masukkan kata sandi baru minimal 8 karakter.
                </Text>

                {/* Password Input */}
                <View style={s.fieldLabel}>
                  <Lock size={15} color={BRAND_PRIMARY} strokeWidth={2} />
                  <Text style={s.label} allowFontScaling={false}>Password Baru</Text>
                </View>
                <View style={s.inputRow}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                  <TouchableOpacity
                    style={s.eyeBtn}
                    onPress={() => setShowPass(v => !v)}
                    activeOpacity={0.7}
                  >
                    {showPass
                      ? <EyeOff size={18} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                      : <Eye    size={18} color="rgba(255,255,255,0.5)" strokeWidth={2} />}
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View style={s.fieldLabel}>
                  <Lock size={15} color={BRAND_PRIMARY} strokeWidth={2} />
                  <Text style={s.label} allowFontScaling={false}>Konfirmasi Password Baru</Text>
                </View>
                <View style={s.inputRow}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showConfirmPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    allowFontScaling={false}
                  />
                  <TouchableOpacity
                    style={s.eyeBtn}
                    onPress={() => setShowConfirmPass(v => !v)}
                    activeOpacity={0.7}
                  >
                    {showConfirmPass
                      ? <EyeOff size={18} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                      : <Eye    size={18} color="rgba(255,255,255,0.5)" strokeWidth={2} />}
                  </TouchableOpacity>
                </View>

                {/* Error Box */}
                {error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorText} allowFontScaling={false}>{error}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[s.btn, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={s.btnText} allowFontScaling={false}>Simpan Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { fontSize: 32, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: 0.5 },
  logoAccent: { color: BRAND_PRIMARY },
  logoSub: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  card: {
    backgroundColor: '#141014', // Match theme surface color
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Shadow.md,
  },
  cardTitle: { fontSize: FontSize.h2, fontWeight: FontWeight.black, color: '#F5F0F1', marginBottom: 4 },
  cardSub: { fontSize: FontSize.base, color: '#A89098', marginBottom: Spacing.xxl },

  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#F5F0F1', letterSpacing: 0.3 },

  input: {
    height: 50,
    backgroundColor: BG_DARK,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.base,
    color: '#F5F0F1',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  eyeBtn: {
    width: 50,
    height: 50,
    backgroundColor: BG_DARK,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  errorBox: {
    backgroundColor: 'rgba(220,53,69,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.2)',
  },
  errorText: { fontSize: FontSize.sm, color: '#DC3545', fontWeight: FontWeight.medium },

  btn: {
    height: 54,
    backgroundColor: BRAND_PRIMARY,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },

  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: '#FFFFFF',
    marginTop: Spacing.sm,
  },
  successMessage: {
    fontSize: FontSize.base,
    color: '#A89098',
    textAlign: 'center',
    lineHeight: 22,
  },
});
