import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Modal, Animated, Platform, Pressable 
} from 'react-native';
import { Check, Globe, Languages } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
// import { BlurView } from 'expo-blur'; // Temporarily disabled

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LanguageSheet: React.FC<LanguageSheetProps> = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = (id: 'en' | 'id') => {
    if (id === language) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(id);
    onClose();
  };

  const LANGUAGES = [
    { id: 'en', label: 'English', sub: 'Default language', flag: '🇬🇧' },
    { id: 'id', label: 'Indonesia', sub: 'Bahasa Indonesia', flag: '🇮🇩' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View 
          style={s.sheet}
        >
          {/* Fallback background while expo-blur installs */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A1A1A' }]} />

          <View style={s.handle} />
          
          <View style={s.header}>
            <View style={s.iconBg}>
              <Languages size={22} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={s.title} allowFontScaling={false}>{t('language')}</Text>
          </View>

          <View style={s.options}>
            {LANGUAGES.map((item) => {
              const active = language === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.option, active && s.optionActive]}
                  onPress={() => handleSelect(item.id as any)}
                  activeOpacity={0.7}
                >
                  <View style={s.flagContainer}>
                    <Text style={s.flagText}>{item.flag}</Text>
                  </View>
                  
                  <View style={s.labelContainer}>
                    <Text style={[s.label, active && s.labelActive]} allowFontScaling={false}>
                      {item.label}
                    </Text>
                    <Text style={s.subLabel} allowFontScaling={false}>
                      {item.sub}
                    </Text>
                  </View>

                  {active && (
                    <View style={s.checkWrap}>
                      <Check size={18} color={Colors.primary} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={s.closeBtn} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={s.closeBtnText} allowFontScaling={false}>{t('close')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229,9,20,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionActive: {
    backgroundColor: 'rgba(229,9,20,0.08)',
    borderColor: 'rgba(229,9,20,0.3)',
  },
  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  flagText: {
    fontSize: 22,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  labelActive: {
    color: Colors.white,
  },
  subLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229,9,20,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default LanguageSheet;
