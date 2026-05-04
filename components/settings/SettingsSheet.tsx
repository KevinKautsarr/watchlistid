import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Modal, Platform, Pressable, ScrollView 
} from 'react-native';
import { 
  Globe, LogOut, Info, Settings, 
  ChevronRight, Shield, Bell, HelpCircle, 
  Moon, Download, UserCircle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  onLanguagePress: () => void;
  onLogoutPress: () => void;
  onNotificationsPress?: () => void;
  onAboutPress?: () => void;
  onExportPress?: () => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  visible, onClose, onLanguagePress, onLogoutPress, onNotificationsPress, onAboutPress, onExportPress
}) => {
  const { t } = useLanguage();

  const menuItems = [
    { 
      id: 'lang', 
      label: t('language'), 
      icon: Globe, 
      color: '#4285F4',
      onPress: () => { onClose(); onLanguagePress(); }
    },
    { 
      id: 'notif', 
      label: t('notifications'), 
      icon: Bell, 
      color: '#FF9500',
      onPress: () => { onClose(); onNotificationsPress?.(); } 
    },
    { 
      id: 'export', 
      label: t('exportWatchlist'), 
      icon: Download, 
      color: '#34A853',
      onPress: () => { onClose(); onExportPress?.(); } 
    },
    { 
      id: 'about', 
      label: t('about'), 
      icon: Info, 
      color: '#9061F9',
      onPress: () => { onClose(); onAboutPress?.(); } 
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={s.dismissArea} onPress={onClose} />
        
        <View style={s.sheet}>
          <View style={s.handle} />
          
          <Text style={s.title} allowFontScaling={false}>{t('settings')}</Text>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.section}>
              {menuItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={s.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    item.onPress();
                  }}
                >
                  <View style={[s.iconBox, { backgroundColor: item.color + '15' }]}>
                    <item.icon size={20} color={item.color} strokeWidth={2} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={[s.section, { marginTop: 12 }]}>
              <TouchableOpacity 
                style={s.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                  onLogoutPress();
                }}
              >
                <View style={[s.iconBox, { backgroundColor: 'rgba(220,53,69,0.1)' }]}>
                  <LogOut size={20} color="#DC3545" strokeWidth={2} />
                </View>
                <Text style={[s.menuLabel, { color: '#DC3545' }]}>{t('signOut')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={s.footer}>
              <Text style={s.versionText}>WATCHLISTID v1.0.0</Text>
              <Text style={s.footerText}>Made with ❤️ for cinema lovers</Text>
            </View>
          </ScrollView>
        </View>
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
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: 12,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  footer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
  },
});

export default SettingsSheet;
