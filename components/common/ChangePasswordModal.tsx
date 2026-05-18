import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { Key, Eye, EyeOff, X } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing, Shadow } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose }) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState(false);

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('Password harus minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok. Coba lagi.');
      return;
    }
    setLoading(true);
    const err = await updatePassword(newPassword);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(handleClose, 1800);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.iconWrap}>
              <Key size={22} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={s.title} allowFontScaling={false}>Ganti Password</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn} activeOpacity={0.7}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={s.successWrap}>
              <Text style={s.successEmoji}>✅</Text>
              <Text style={s.successText} allowFontScaling={false}>Password berhasil diubah!</Text>
            </View>
          ) : (
            <>
              {/* New Password */}
              <Text style={s.label} allowFontScaling={false}>Password Baru</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor={Colors.text.secondary}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  allowFontScaling={false}
                />
                <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn}>
                  {showNew ? <EyeOff size={18} color={Colors.text.secondary} /> : <Eye size={18} color={Colors.text.secondary} />}
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={s.label} allowFontScaling={false}>Konfirmasi Password</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Ulangi password baru"
                  placeholderTextColor={Colors.text.secondary}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  allowFontScaling={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
                  {showConfirm ? <EyeOff size={18} color={Colors.text.secondary} /> : <Eye size={18} color={Colors.text.secondary} />}
                </TouchableOpacity>
              </View>

              {error && (
                <View style={s.errorBox}>
                  <Text style={s.errorText} allowFontScaling={false}>{error}</Text>
                </View>
              )}

              <View style={s.actions}>
                <TouchableOpacity style={s.cancelBtn} onPress={handleClose} activeOpacity={0.75}>
                  <Text style={s.cancelText} allowFontScaling={false}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.submitBtn, loading && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={s.submitText} allowFontScaling={false}>Simpan</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.white,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.white,
  },
  eyeBtn: {
    paddingHorizontal: Spacing.md,
    height: 50,
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(220,53,69,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.2)',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#DC3545',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: Colors.text.secondary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  submitBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default ChangePasswordModal;
