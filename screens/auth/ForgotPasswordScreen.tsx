import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';

import { supabase } from '../../supabase';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  const handleReset = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'watchlistid://reset-password' },
    );
    setLoading(false);
    if (err) {
      setError(err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#7E050B', '#141414', '#141414']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Back button */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={s.content}>
          {/* Logo */}
          <View style={s.logoWrap}>
            <Text style={s.logo} allowFontScaling={false}>
              WatchList<Text style={s.logoAccent}>ID</Text>
            </Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {sent ? (
              // ── Success state ──────────────────────────────────────────
              <View style={s.sentWrap}>
                <Text style={s.sentEmoji}>📬</Text>
                <Text style={s.sentTitle} allowFontScaling={false}>
                  Email Terkirim!
                </Text>
                <Text style={s.sentSub} allowFontScaling={false}>
                  Cek inbox kamu di{' '}
                  <Text style={{ fontWeight: FontWeight.bold, color: Colors.primary }}>
                    {email}
                  </Text>
                  {' '}untuk link reset password.
                </Text>
                <TouchableOpacity
                  style={s.btn}
                  onPress={() => router.replace('/auth/login' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={s.btnText} allowFontScaling={false}>Kembali ke Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // ── Form ───────────────────────────────────────────────────
              <>
                <Text style={s.cardTitle} allowFontScaling={false}>Lupa Password?</Text>
                <Text style={s.cardSub} allowFontScaling={false}>
                  Masukkan email akun kamu. Kami akan kirimkan link untuk reset password.
                </Text>

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

                {error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorText} allowFontScaling={false}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.btn, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : (
                      <>
                        <Send size={18} color={Colors.white} strokeWidth={2.5} />
                        <Text style={s.btnText} allowFontScaling={false}>Kirim Link Reset</Text>
                      </>
                    )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  backBtn: {
    position: 'absolute',
    top:      56,
    left:     Spacing.xl,
    zIndex:   10,
    width:    40,
    height:   40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  content: {
    flex:             1,
    justifyContent:   'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical:  Spacing.xxl,
  },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo:     { fontSize: 32, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 0.5 },
  logoAccent: { color: Colors.primary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.xxl,
    padding:         Spacing.xxl,
    ...Shadow.md,
  },
  cardTitle: { fontSize: FontSize.h2, fontWeight: FontWeight.black, color: Colors.text.primary, marginBottom: 4 },
  cardSub:   {
    fontSize:    FontSize.base,
    color:       Colors.text.secondary,
    marginBottom: Spacing.xxl,
    lineHeight:  22,
  },

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
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },

  // Sent state
  sentWrap:  { alignItems: 'center' },
  sentEmoji: { fontSize: 56, marginBottom: Spacing.xl },
  sentTitle: {
    fontSize:     FontSize.xxl,
    fontWeight:   FontWeight.black,
    color:        Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign:    'center',
  },
  sentSub: {
    fontSize:     FontSize.base,
    color:        Colors.text.secondary,
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: Spacing.xxl,
  },
});
