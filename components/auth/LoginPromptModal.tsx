import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { LogIn, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function LoginPromptModal({ 
  visible, 
  onClose, 
  title = "Masuk untuk Melanjutkan",
  message = "Daftar tontonan dan profil hanya tersedia untuk pengguna yang sudah masuk." 
}: LoginPromptModalProps) {
  const router = useRouter();

  React.useEffect(() => {
    if (visible && Platform.OS === 'web') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }, [visible]);

  const handleLogin = () => {
    onClose();
    router.push('/auth/login');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <X size={20} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <View style={s.iconBox}>
            <LogIn size={32} color={Colors.primary} strokeWidth={2.5} />
          </View>

          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Nanti</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.loginBtn} onPress={handleLogin}>
              <Text style={s.loginText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1C1C1E',
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
      android: { elevation: 20 },
      web: { boxShadow: '0 10px 40px rgba(0,0,0,0.5)' } as unknown as ViewStyle,
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(199,31,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  loginBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  loginText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
