import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  visible, 
  onClose, 
  onConfirm,
  title = "Delete Log?",
  message = "Are you sure you want to delete this movie from your Diary? This action cannot be undone."
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Trash2 size={32} color={Colors.primary} strokeWidth={2.5} />
          </View>
          
          <Text style={styles.title} allowFontScaling={false}>{title}</Text>
          <Text style={styles.message} allowFontScaling={false}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText} allowFontScaling={false}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => {
                onConfirm();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText} allowFontScaling={false}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: 30,
    alignItems: 'center',
    ...Shadow.lg,
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  deleteBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  deleteBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default DeleteConfirmModal;
