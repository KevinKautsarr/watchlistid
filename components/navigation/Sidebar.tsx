import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle, Platform, Alert, Modal, Pressable } from 'react-native';
import { Home, Compass, Bookmark, User, Film, LogOut, X, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const PRIMARY  = Colors.primary;
const INACTIVE = Colors.overlay.light50;

const NAV_KEYS = [
  { name: 'index',     key: 'tabHome',      Icon: Home     },
  { name: 'search',    key: 'tabDiscover',  Icon: Compass  },
  { name: 'watchlist', key: 'tabWatchlist', Icon: Bookmark },
  { name: 'profile',   key: 'tabProfile',   Icon: User     },
];

interface SidebarProps {
  collapsed: boolean;
}

// ─── Custom Confirm Dialog (works on web + native) ───────────────────────────
interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible, title, description, cancelLabel, confirmLabel, onCancel, onConfirm,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={dialogStyles.overlay} onPress={onCancel}>
        <Pressable style={dialogStyles.card} onPress={() => {}}>
          {/* Icon */}
          <View style={dialogStyles.iconWrap}>
            <AlertTriangle size={28} color="#C71F37" strokeWidth={2} />
          </View>

          {/* Text */}
          <Text style={dialogStyles.title} maxFontSizeMultiplier={1.3}>{title}</Text>
          <Text style={dialogStyles.desc} maxFontSizeMultiplier={1.3}>{description}</Text>

          {/* Buttons */}
          <View style={dialogStyles.btnRow}>
            <TouchableOpacity style={dialogStyles.btnCancel} onPress={onCancel} activeOpacity={0.75}>
              <Text style={dialogStyles.btnCancelText} maxFontSizeMultiplier={1.3}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dialogStyles.btnConfirm} onPress={onConfirm} activeOpacity={0.75}>
              <Text style={dialogStyles.btnConfirmText} maxFontSizeMultiplier={1.3}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1A1A1E',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(199,31,55,0.2)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 40 },
      android: { elevation: 20 },
      web: { boxShadow: '0 20px 60px rgba(0,0,0,0.6)' } as unknown as ViewStyle,
    }),
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(199,31,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199,31,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  btnConfirm: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#C71F37',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#C71F37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 12px rgba(199,31,55,0.4)' } as unknown as ViewStyle,
    }),
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const router   = useRouter();
  const segments = useSegments();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);

  const activeTab = segments[0] === '(tabs)' ? (segments[1] || 'index') : '';

  const handlePress = (name: string) => {
    if (!user && (name === 'watchlist' || name === 'profile')) {
      (global as any).showLoginPrompt?.();
      return;
    }
    router.push(`/(tabs)/${name === 'index' ? '' : name}` as any);
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      // Web: gunakan custom modal
      setShowConfirm(true);
      return;
    }
    // Native iOS/Android: gunakan Alert bawaan
    Alert.alert(
      t('signOutConfirmTitle'),
      t('signOutConfirmDesc'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('signOut'), style: 'destructive', onPress: signOut }
      ],
      { cancelable: true }
    );
  };

  return (
    <>
      <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
        <SafeAreaView edges={['top', 'bottom', 'left']} style={{ flex: 1 }}>
          {/* Brand */}
          <TouchableOpacity
            style={styles.brand}
            onPress={() => router.push('/(tabs)/' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.brandIcon}>
              <Film color="#FFFFFF" size={20} strokeWidth={2} />
            </View>
            {!collapsed && (
              <View>
                <Text style={styles.brandTitle} maxFontSizeMultiplier={1.3}>WatchList</Text>
                <Text style={styles.brandSub} maxFontSizeMultiplier={1.3}>ID</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Nav */}
          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {!collapsed && (
              <Text style={styles.navSection} maxFontSizeMultiplier={1.3}>MENU</Text>
            )}
            {NAV_KEYS.map(({ name, key, Icon }) => {
              const active = activeTab === name;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => handlePress(name)}
                  activeOpacity={0.75}
                >
                  <Icon
                    size={20}
                    color={active ? '#FFFFFF' : INACTIVE}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {!collapsed && (
                    <Text
                      style={[styles.navLabel, active && styles.navLabelActive]}
                      maxFontSizeMultiplier={1.3}
                    >
                      {t(key as any)}
                    </Text>
                  )}
                  {active && !collapsed && <View style={styles.activePip} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sign Out Button */}
          {user && (
            <View style={styles.footerLogout}>
              <TouchableOpacity
                style={[styles.logoutItem, collapsed && styles.logoutItemCollapsed]}
                onPress={handleSignOut}
                activeOpacity={0.75}
              >
                <LogOut size={20} color="#C71F37" strokeWidth={2} />
                {!collapsed && (
                  <Text style={styles.logoutLabel} maxFontSizeMultiplier={1.3}>
                    {t('signOut')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Footer version */}
          {!collapsed && (
            <View style={styles.sidebarFooter}>
              <View style={styles.divider} />
              <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>WatchList ID · v1.0</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* Custom confirm dialog — muncul di atas sidebar */}
      <ConfirmDialog
        visible={showConfirm}
        title={t('signOutConfirmTitle')}
        description={t('signOutConfirmDesc')}
        cancelLabel={t('cancel')}
        confirmLabel={t('signOut')}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          signOut();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: Colors.tabBarBackground,
    borderRightWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Platform.select({
      ios:     { shadowColor: '#C71F37', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 12 },
      web:     { boxShadow: '4px 0 32px rgba(100,18,32,0.3)' } as unknown as ViewStyle,
    }),
    zIndex: 20,
  },
  sidebarCollapsed: { width: 72 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10 },
      android: { elevation: 8 },
      web: { boxShadow: `0 6px 10px ${PRIMARY}80` } as unknown as ViewStyle,
    }),
  },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  brandSub:   { fontSize: 11, fontWeight: '700', color: PRIMARY, letterSpacing: 1.5, marginTop: -1 },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginHorizontal: 16, marginVertical: 4 },
  nav: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  navSection: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 14,
    marginBottom: 2,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(199,31,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(199,31,55,0.3)',
  },
  navLabel: { fontSize: 15, fontWeight: '600', color: INACTIVE, flex: 1 },
  navLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  activePip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  sidebarFooter: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12, textAlign: 'center' },
  footerLogout: {
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 14,
    backgroundColor: 'rgba(199,31,55,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(199,31,55,0.15)',
  },
  logoutItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C71F37',
    flex: 1,
  },
});

export default Sidebar;