import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { AlertTriangle, Info, Download } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'download';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm, onCancel,
}) => {
  const accentColor = variant === 'danger' ? '#DC3545' : variant === 'warning' ? '#FF9500' : variant === 'download' ? '#34A853' : Colors.primary;
  const IconComponent = variant === 'download' ? Download : variant === 'info' ? Info : AlertTriangle;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.overlay} onPress={onCancel}>
        <Pressable style={s.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={[s.iconWrap, { backgroundColor: accentColor + '18' }]}>
            <IconComponent size={28} color={accentColor} strokeWidth={2} />
          </View>

          <Text style={s.title} allowFontScaling={false}>{title}</Text>
          <Text style={s.message} allowFontScaling={false}>{message}</Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
              <Text style={s.cancelText} allowFontScaling={false}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: accentColor }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={s.confirmText} allowFontScaling={false}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
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
  dialog: {
    backgroundColor: '#1C1C1E',
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
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
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
});

export default ConfirmDialog;
