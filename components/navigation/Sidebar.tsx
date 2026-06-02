import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import { Home, Compass, Bookmark, User, Film } from 'lucide-react-native';
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

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const router   = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const { t } = useLanguage();

  // On root layout, segments[0] can be '(tabs)' and segments[1] is the tab name.
  // If segments[0] is 'movie', 'person', or 'user', no tab is active.
  const activeTab = segments[0] === '(tabs)' ? (segments[1] || 'index') : '';

  const handlePress = (name: string) => {
    if (!user && (name === 'watchlist' || name === 'profile')) {
      (global as any).showLoginPrompt?.();
      return;
    }
    router.push(`/(tabs)/${name === 'index' ? '' : name}` as any);
  };

  return (
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
              <Text style={styles.brandTitle} allowFontScaling={false}>WatchList</Text>
              <Text style={styles.brandSub} allowFontScaling={false}>ID</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Nav */}
        <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
          {!collapsed && (
            <Text style={styles.navSection} allowFontScaling={false}>MENU</Text>
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
                    allowFontScaling={false}
                  >
                    {t(key as any)}
                  </Text>
                )}
                {active && !collapsed && <View style={styles.activePip} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom — version */}
        {!collapsed && (
          <View style={styles.sidebarFooter}>
            <View style={styles.divider} />
            <Text style={styles.footerText} allowFontScaling={false}>WatchList ID · v1.0</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
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
});

export default Sidebar;
