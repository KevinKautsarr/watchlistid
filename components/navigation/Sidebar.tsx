import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle, Platform, Alert, Modal, Pressable, Image } from 'react-native';
import { Home, Compass, Bookmark, User, LogOut, Bell, Info, ChevronLeft, ChevronRight, AlertTriangle, Globe, Key, Download } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useSocial } from '@/context/SocialContext';
import { exportWatchlistToCSV } from '@/utils/exportWatchlist';
import LanguageSheet from '@/components/settings/LanguageSheet';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import Toast from '@/components/common/Toast';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

const PRIMARY  = Colors.primary;
const INACTIVE = Colors.overlay.light50;
const BRAND_ICON = require('@/assets/images/icon.png');

interface NavEntry {
  name: string;
  key: string;
  Icon: typeof Home;
  /** Route lives under the (tabs) group rather than at the app root. */
  tab?: boolean;
  /** Requires an authenticated user — guests get the login prompt. */
  auth?: boolean;
  /** Action trigger instead of router navigation */
  action?: 'language' | 'export' | 'password';
}

const PRIMARY_NAV: NavEntry[] = [
  { name: 'index',     key: 'tabHome',      Icon: Home,     tab: true },
  { name: 'search',    key: 'tabDiscover',  Icon: Compass,  tab: true },
  { name: 'watchlist', key: 'tabWatchlist', Icon: Bookmark, tab: true, auth: true },
  { name: 'profile',   key: 'tabProfile',   Icon: User,     tab: true, auth: true },
];

const MORE_NAV: NavEntry[] = [
  { name: 'notifications', key: 'notifications', Icon: Bell, auth: true },
  { name: 'about',         key: 'aboutNav',      Icon: Info },
];

const SETTINGS_NAV: NavEntry[] = [
  { name: 'language', key: 'language',        Icon: Globe,    action: 'language' },
  { name: 'export',   key: 'exportWatchlist', Icon: Download, action: 'export',   auth: true },
  { name: 'password', key: 'changePassword',  Icon: Key,      action: 'password', auth: true },
];

interface SidebarProps {
  collapsed: boolean;
  /** Toggles the collapsed/expanded state (web only chevron control). */
  onToggle?: () => void;
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => [
                dialogStyles.btnCancel,
                hovered && { backgroundColor: 'rgba(255,255,255,0.1)' },
                pressed && { opacity: 0.8 },
                cursorPointer,
              ]}
              onPress={onCancel}
            >
              <Text style={dialogStyles.btnCancelText} maxFontSizeMultiplier={1.3}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => [
                dialogStyles.btnConfirm,
                hovered && { backgroundColor: '#B0182E' },
                pressed && { opacity: 0.8 },
                cursorPointer,
              ]}
              onPress={onConfirm}
            >
              <Text style={dialogStyles.btnConfirmText} maxFontSizeMultiplier={1.3}>{confirmLabel}</Text>
            </Pressable>
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
    ...Platform.select({
      web: { transition: 'background-color 0.2s ease-in-out' } as any
    })
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
      web: { 
        boxShadow: '0 4px 12px rgba(199,31,55,0.4)',
        transition: 'background-color 0.2s ease-in-out',
      } as unknown as ViewStyle,
    }),
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const router   = useRouter();
  const segments = useSegments();
  const { user, signOut, profile } = useAuth();
  const { watchlist } = useWatchlist();
  const { userLogs } = useSocial();
  const { t } = useLanguage();
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ visible: true, message, type });
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const [showConfirm, setShowConfirm] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  
  // Tracks the hovered item so we can show a tooltip while collapsed (web).
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const getTooltipTopStyle = (key: string): ViewStyle => {
    if (key === 'logout') {
      return { bottom: 18 };
    }
    
    const baseTop = 109; // ScrollView start + padding
    
    // Exact manual offset mapping for collapsed sidebar elements
    const offsets: Record<string, number> = {
      // navGroup 1 (MENU)
      index: baseTop + 5 + 2,
      search: baseTop + 5 + 44 + 2,
      watchlist: baseTop + 5 + 44 * 2 + 2,
      profile: baseTop + 5 + 44 * 3 + 2,
      
      // navGroup 2 (MORE) - starts after navGroup 1 (4 items) + sectionGap (12px)
      // navGroup 1 height = 4 * 44 + 10 = 186
      // Total before navGroup 2 = 109 + 186 + 12 = 307
      notifications: 307 + 5 + 2,
      about: 307 + 5 + 44 + 2,
      
      // navGroup 3 (SETTINGS) - starts after navGroup 2 (2 items) + sectionGap (12px)
      // navGroup 2 height = 2 * 44 + 10 = 98
      // Total before navGroup 3 = 307 + 98 + 12 = 417
      language: 417 + 5 + 2,
      export: 417 + 5 + 44 + 2,
      password: 417 + 5 + 44 * 2 + 2,
    };
    
    return { top: offsets[key] ?? baseTop };
  };

  const getTooltipLabel = (key: string): string => {
    if (key === 'logout') return t('signOut');
    const primaryItem = PRIMARY_NAV.find(item => item.name === key);
    if (primaryItem) return t(primaryItem.key as any);
    const moreItem = MORE_NAV.find(item => item.name === key);
    if (moreItem) return t(moreItem.key as any);
    const settingsItem = SETTINGS_NAV.find(item => item.name === key);
    if (settingsItem) return t(settingsItem.key as any);
    return '';
  };

  // Cast to string[] so segment indexing doesn't depend on generated
  // expo-router route types (.expo/types), which are absent in fresh CI.
  const seg0 = (segments as string[])[0];
  const seg1 = (segments as string[])[1];
  // Tab routes report as `(tabs)` + the tab name; root routes report directly.
  const currentKey = seg0 === '(tabs)' ? (seg1 || 'index') : seg0;

  const handlePress = (entry: NavEntry) => {
    if (entry.auth && !user) {
      (global as any).showLoginPrompt?.();
      return;
    }
    if (entry.action === 'language') {
      setShowLangSheet(true);
    } else if (entry.action === 'export') {
      setShowExportConfirm(true);
    } else if (entry.action === 'password') {
      setShowPasswordModal(true);
    } else if (entry.tab) {
      router.push(`/(tabs)/${entry.name === 'index' ? '' : entry.name}` as any);
    } else {
      router.push(`/${entry.name}` as any);
    }
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

  const exportLogsCount = userLogs.length;
  const totalItems = watchlist.length + exportLogsCount;
  const estimatedKb = Math.max(1, Math.round((totalItems * 150) / 1024));
  const exportMessage = t('cancel') === 'Batal'
    ? `Data watchlist (${watchlist.length} item) dan daftar tontonan (${exportLogsCount} item) akan diekspor dalam format spreadsheet CSV (perkiraan ukuran ~${estimatedKb} KB). Kamu bisa membukanya di Microsoft Excel atau Google Sheets.`
    : `Watchlist data (${watchlist.length} items) and watched list (${exportLogsCount} items) will be exported in CSV spreadsheet format (estimated size ~${estimatedKb} KB). You can open it in Microsoft Excel or Google Sheets.`;

  const handleExport = async () => {
    setShowExportConfirm(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const allLogs = userLogs.map(log => ({
      id: log.id,
      user_id: user?.id || '',
      movie_id: log.movie_id,
      movie_title: log.movie_title,
      poster_path: log.poster_path,
      watched_at: log.watched_at,
      rating: log.rating,
      review_text: log.review_text,
      is_spoiler: log.is_spoiler,
      media_type: log.media_type,
      created_at: log.created_at,
    }));

    try {
      await exportWatchlistToCSV(watchlist, allLogs, profile?.data?.username ?? 'user');
    } catch (err: any) {
      showToast(err?.message || t('exportFailedMsg'), 'error');
    }
  };

  const renderNavItem = (entry: NavEntry) => {
    const { name, key, Icon } = entry;
    const active = currentKey === name;
    const label = t(key as any);
    return (
      <Pressable
        key={name}
        onPress={() => handlePress(entry)}
        onHoverIn={() => setHoveredKey(name)}
        onHoverOut={() => setHoveredKey(prev => (prev === name ? null : prev))}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => [
          styles.navItem,
          collapsed && styles.navItemCollapsed,
          cursorPointer,
        ]}
      >
        {({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => (
          <>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBox, active && styles.iconBoxActive, (hovered || pressed) && !active && styles.iconBoxHover]}>
                <Icon
                  size={18}
                  color={active ? '#FFFFFF' : 'rgba(255,255,255,0.62)'}
                  strokeWidth={active ? 2.5 : 2}
                />
              </View>
            </View>
            <View style={[styles.labelWrapper, collapsed ? styles.labelWrapperCollapsed : styles.labelWrapperExpanded]}>
              <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {label}
              </Text>
            </View>
            {active && <View style={styles.activeLine} />}
          </>
        )}
      </Pressable>
    );
  };

  // On Web: sidebar is position:absolute inside a clip-wrapper (overflow:hidden).
  // The clip-wrapper animates its *own* width cheaply (no children layout).
  // Sidebar stays fixed at width:240 / left:0 — zero reflow on the sidebar itself.
  const webAbsoluteStyle: ViewStyle | null = Platform.OS === 'web' ? {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    zIndex: 20,
  } : null;

  return (
    <>
      <View style={[styles.sidebar, webAbsoluteStyle]}>
        <SafeAreaView edges={['top', 'bottom', 'left']} style={styles.safeArea}>
          {/* Brand */}
          <Pressable
            onPress={() => router.push('/(tabs)/' as any)}
            style={({ hovered }: { hovered?: boolean; pressed?: boolean }) => [styles.brand, hovered && styles.brandHover, cursorPointer]}
          >
            <View style={styles.brandIconContainer}>
              <View style={styles.brandIcon}>
                <Image source={BRAND_ICON} style={styles.brandImg} resizeMode="contain" />
              </View>
            </View>
            <View style={[styles.brandTextWrapper, collapsed ? styles.brandTextCollapsed : styles.brandTextExpanded]}>
              <Text style={styles.brandWordmark} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                Watchlist<Text style={styles.brandWordmarkAccent}>ID</Text>
              </Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          {/* Nav */}
          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            <View style={[styles.sectionHeaderWrapper, collapsed ? styles.sectionHeaderCollapsed : styles.sectionHeaderExpanded]}>
              <Text style={styles.navSection} maxFontSizeMultiplier={1.3}>MENU</Text>
            </View>
            <View style={[styles.navGroup, collapsed ? styles.navGroupCollapsed : styles.navGroupExpanded]}>
              {PRIMARY_NAV.map(renderNavItem)}
            </View>

            <View style={styles.sectionGap} />
            <View style={[styles.sectionHeaderWrapper, collapsed ? styles.sectionHeaderCollapsed : styles.sectionHeaderExpanded]}>
              <Text style={styles.navSection} maxFontSizeMultiplier={1.3}>MORE</Text>
            </View>
            <View style={[styles.navGroup, collapsed ? styles.navGroupCollapsed : styles.navGroupExpanded]}>
              {MORE_NAV.map(renderNavItem)}
            </View>

            <View style={styles.sectionGap} />
            <View style={[styles.sectionHeaderWrapper, collapsed ? styles.sectionHeaderCollapsed : styles.sectionHeaderExpanded]}>
              <Text style={styles.navSection} maxFontSizeMultiplier={1.3}>{t('settings').toUpperCase()}</Text>
            </View>
            <View style={[styles.navGroup, collapsed ? styles.navGroupCollapsed : styles.navGroupExpanded]}>
              {SETTINGS_NAV.map(renderNavItem)}
            </View>
          </ScrollView>

          {/* Sign Out */}
          {user && (
            <View style={styles.footerLogout}>
              <View style={[styles.navGroup, collapsed ? styles.navGroupCollapsed : styles.navGroupExpanded]}>
                <Pressable
                  onPress={handleSignOut}
                  onHoverIn={() => setHoveredKey('logout')}
                  onHoverOut={() => setHoveredKey(prev => (prev === 'logout' ? null : prev))}
                  accessibilityRole="button"
                  accessibilityLabel={t('signOut')}
                  style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => [
                    styles.logoutItem,
                    collapsed && styles.logoutItemCollapsed,
                    cursorPointer,
                  ]}
                >
                  {({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => (
                    <>
                      <View style={styles.iconContainer}>
                        <View style={[styles.iconBox, styles.iconBoxLogout, (hovered || pressed) && styles.iconBoxLogoutHover]}>
                          <LogOut size={16} color="#C71F37" strokeWidth={2} />
                        </View>
                      </View>
                      <View style={[styles.labelWrapper, collapsed ? styles.labelWrapperCollapsed : styles.labelWrapperExpanded]}>
                        <Text style={styles.logoutLabel} maxFontSizeMultiplier={1.3} numberOfLines={1}>{t('signOut')}</Text>
                      </View>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {!collapsed && (
            <View style={styles.sidebarFooter}>
              <View style={styles.divider} />
              <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>WatchlistID · v1.0</Text>
            </View>
          )}
        </SafeAreaView>

        {/* Tooltip */}
        {collapsed && Platform.OS === 'web' && hoveredKey && (
          <View style={[styles.tooltip, getTooltipTopStyle(hoveredKey)]} pointerEvents="none">
            <Text style={styles.tooltipText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {getTooltipLabel(hoveredKey)}
            </Text>
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={showConfirm}
        title={t('signOutConfirmTitle')}
        description={t('signOutConfirmDesc')}
        cancelLabel={t('cancel')}
        confirmLabel={t('signOut')}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); signOut(); }}
      />

      {/* Language Selection Sheet */}
      <LanguageSheet
        visible={showLangSheet}
        onClose={() => setShowLangSheet(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Export Watchlist Confirmation Dialog */}
      <ConfirmDialog
        visible={showExportConfirm}
        title={t('exportWatchlist')}
        description={exportMessage}
        cancelLabel={t('cancel')}
        confirmLabel="Download CSV"
        onCancel={() => setShowExportConfirm(false)}
        onConfirm={handleExport}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </>
  );
};

const BOX    = 38;   // icon box size (matches screenshot capsule fit)
const BOX_R  = 11;   // icon box border radius
const NAV_PX = 12;   // nav ScrollView horizontal padding (centers 48px capsule inside 72px sidebar)

const styles = StyleSheet.create({
  // ── Root sidebar ──
  sidebar: {
    width: 240,
    backgroundColor: '#070708',
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 12 },
      web:     { boxShadow: '4px 0 24px rgba(0,0,0,0.5)', contain: 'layout style' } as unknown as ViewStyle,
    }),
    zIndex: 20,
  },
  sidebarCollapsed: { width: 72 },
  safeArea: { flex: 1, overflow: 'hidden' },

  // ── Brand ──
  brand: { paddingTop: 20, paddingBottom: 16, paddingLeft: 0, paddingRight: 12, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  brandHover: { opacity: 0.8 },
  brandIconContainer: { width: 72, alignItems: 'center', justifyContent: 'center' },
  brandIcon: { width: BOX, height: BOX, borderRadius: BOX_R, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandImg: { width: 24, height: 24 },
  brandTextWrapper: {
    position: 'absolute', left: 60, top: 0, bottom: 0, justifyContent: 'center',
    ...Platform.select({ web: { transitionProperty: 'opacity, transform', transitionDuration: '0.2s', transitionTimingFunction: 'ease-in-out' } as any }),
  },
  brandTextCollapsed: { opacity: 0, transform: [{ translateX: -8 }] as any },
  brandTextExpanded:  { opacity: 1, transform: [{ translateX: 0  }] as any },
  brandWordmark: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  brandWordmarkAccent: { color: PRIMARY },

  // ── Divider ──
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 14, marginVertical: 4 },

  // ── Nav ScrollView ──
  nav: { flex: 1, paddingHorizontal: NAV_PX, paddingTop: 6 },
  navSection: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, paddingHorizontal: 4, paddingBottom: 6, paddingTop: 2 },
  sectionGap: { height: 12 },
  sectionHeaderWrapper: {
    overflow: 'hidden',
    ...Platform.select({ web: { transitionProperty: 'opacity, transform', transitionDuration: '0.2s', transitionTimingFunction: 'ease-in-out' } as any }),
  },
  sectionHeaderCollapsed: { opacity: 0, height: 0,  transform: [{ translateX: -8 }] as any },
  sectionHeaderExpanded:  { opacity: 1, height: 22, transform: [{ translateX: 0  }] as any },

  // ── Nav groups (the dark capsule containers) ──
  navGroup: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  navGroupCollapsed: {
    width: 48,
    paddingVertical: 5,
  },
  navGroupExpanded: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  // ── Nav item row ──
  navItem: { flexDirection: 'row', alignItems: 'center', height: 44, position: 'relative' },
  navItemCollapsed: { width: 48, justifyContent: 'center', alignItems: 'center' },
  navItemActive: {},
  navItemHover:  {},
  navLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.62)', flex: 1, ...Platform.select({ web: { whiteSpace: 'nowrap' } as any }) },
  navLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  activeLine: {
    position: 'absolute',
    left: 2,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: PRIMARY,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },

  // ── Icon container + box ──
  iconContainer: { width: 48, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: BOX, height: BOX, borderRadius: BOX_R,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({ web: { transitionProperty: 'background-color, border-color', transitionDuration: '0.15s', transitionTimingFunction: 'ease-in-out' } as any }),
  },
  iconBoxActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  iconBoxHover:  { backgroundColor: 'rgba(255,255,255,0.04)' },
  iconBoxLogout: { backgroundColor: 'transparent' },
  iconBoxLogoutHover: { backgroundColor: 'rgba(199,31,55,0.08)' },

  // ── Label wrapper (absolutely anchored beside icon area) ──
  labelWrapper: {
    position: 'absolute', left: 56, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center',
    ...Platform.select({ web: { transitionProperty: 'opacity, transform', transitionDuration: '0.2s', transitionTimingFunction: 'ease-in-out' } as any }),
  },
  labelWrapperCollapsed: { opacity: 0, transform: [{ translateX: -8 }] as any },
  labelWrapperExpanded:  { opacity: 1, transform: [{ translateX: 0  }] as any },

  // ── Tooltip ──
  tooltip: {
    position: 'absolute', left: 80, backgroundColor: '#1C1C21',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, zIndex: 100,
    ...Platform.select({ web: { boxShadow: '0 4px 14px rgba(0,0,0,0.6)', userSelect: 'none' } as unknown as ViewStyle }),
  },
  tooltipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // ── Footer / logout ──
  sidebarFooter: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  footerText: { fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 10, textAlign: 'center' },
  footerLogout: { paddingHorizontal: NAV_PX, marginBottom: 12 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', height: 44, position: 'relative' },
  logoutItemCollapsed: { width: 48, justifyContent: 'center', alignItems: 'center' },
  logoutItemHover: {},
  logoutLabel: { fontSize: 14, fontWeight: '600', color: '#C71F37', flex: 1, ...Platform.select({ web: { whiteSpace: 'nowrap' } as any }) },
});

export default Sidebar;