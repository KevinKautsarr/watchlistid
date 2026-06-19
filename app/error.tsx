import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ShieldAlert, Mail } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function ErrorScreen() {
  const { signOut } = useAuth();

  const handleSupport = () => {
    Linking.openURL('mailto:support@watchlistid.app?subject=Masalah Profil Akun');
  };

  return (
    <View style={s.container}>
      <View style={s.iconBox}>
        <ShieldAlert size={60} color={Colors.primary} strokeWidth={1.5} />
      </View>
      
      <Text style={s.title}>Akun Bermasalah</Text>
      <Text style={s.desc}>
        Sistem kami gagal menyiapkan profil kamu. Ini bisa terjadi karena kendala jaringan atau masalah teknis pada server kami.
      </Text>

      <View style={s.actionBox}>
        <TouchableOpacity style={s.supportBtn} onPress={handleSupport}>
          <Mail size={18} color={Colors.white} />
          <Text style={s.supportBtnText}>Hubungi Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.signOutBtn} onPress={() => signOut()}>
          <Text style={s.signOutBtnText}>Keluar & Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(199,31,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.black,
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  desc: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  actionBox: {
    width: '100%',
    gap: 16,
  },
  supportBtn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  supportBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  signOutBtn: {
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  signOutBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.4)',
  },
});
