import React, { useState } from 'react';
import { 
  Modal, View, Text, TouchableOpacity, TextInput, 
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
  Dimensions
} from 'react-native';
import { X, Camera, Check } from 'lucide-react-native';
import Avatar from '@/components/common/Avatar';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { username: string; full_name: string; bio: string; avatarUrl?: string | null }) => Promise<void>;
  initialData: {
    username: string;
    full_name: string;
    bio: string;
    avatarUrl?: string | null;
  };
  onPickImage: () => void;
  isSaving: boolean;
  t: (key: any) => string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  onPickImage,
  isSaving,
  t
}) => {
  const [username, setUsername] = useState(initialData.username || '');
  const [fullName, setFullName] = useState(initialData.full_name || '');
  const [bio, setBio] = useState(initialData.bio || '');

  React.useEffect(() => {
    if (visible) {
      setUsername(initialData.username || '');
      setFullName(initialData.full_name || '');
      setBio(initialData.bio || '');
      if (visible && Platform.OS === 'web') {
        (document.activeElement as HTMLElement)?.blur();
      }
    }
  }, [visible]);

  const handleSave = () => {
    onSave({ username, full_name: fullName, bio });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalRoot}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('editProfile')}</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Check size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Avatar Edit */}
            <TouchableOpacity style={styles.avatarSection} onPress={onPickImage}>
              <View style={styles.avatarContainer}>
                <Avatar uri={initialData.avatarUrl} name={username} size={100} />
                <View style={styles.cameraOverlay}>
                  <Camera size={24} color={Colors.white} />
                </View>
              </View>
              <Text style={styles.changePhotoText}>{t('changeAvatar')}</Text>
            </TouchableOpacity>

            {/* Form */}
            <View style={styles.form}>
              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your full name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              {/* Username Handle */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('username')} (@handle)</Text>
                <View style={styles.usernameRow}>
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={[styles.input, styles.usernameInput]}
                    value={username}
                    onChangeText={(v) => setUsername(v.toLowerCase().replace(/\s/g, '_'))}
                    placeholder="unique_handle"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('bio')}</Text>
                  <Text style={styles.charCount}>{bio.length}/150</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={(text) => text.length <= 150 && setBio(text)}
                  placeholder={t('bioPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  modalContent: { 
    flex: Platform.OS === 'web' ? undefined : 1, 
    width: Platform.OS === 'web' ? Math.min(Dimensions.get('window').width * 0.9, 500) : '100%',
    maxHeight: Platform.OS === 'web' ? '85%' : '100%',
    backgroundColor: Colors.background, 
    marginTop: Platform.OS === 'web' ? 0 : 50, 
    borderTopLeftRadius: Radius.xxl, 
    borderTopRightRadius: Radius.xxl, 
    borderBottomLeftRadius: Platform.OS === 'web' ? Radius.xxl : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? Radius.xxl : 0,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 },
      web:     { boxShadow: '0 10px 40px rgba(0,0,0,0.5)' } as any,
    })
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  closeBtn: { 
    padding: 8,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  saveBtn: { 
    padding: 8,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  scrollBody: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  avatarSection: { 
    alignItems: 'center', 
    marginTop: Spacing.xxl,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', position: 'relative' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  changePhotoText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: Spacing.md },
  form: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, gap: 24 },
  inputGroup: { width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: Colors.text.secondary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  charCount: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  input: { color: Colors.white, fontSize: FontSize.base, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingVertical: Spacing.sm },
  usernameRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  atSign: { color: Colors.text.secondary, fontSize: FontSize.base, paddingVertical: Spacing.sm, marginRight: 2 },
  usernameInput: { flex: 1, borderBottomWidth: 0 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
});

export default ProfileEditModal;
