import React from 'react';
import { View, Text, Platform, useWindowDimensions, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Home, Compass, Bookmark, User, Film } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomMobileTabBar from '../../components/navigation/CustomMobileTabBar';
import { useLanguage } from '../../context/LanguageContext';

const PRIMARY  = '#E50914';
const INACTIVE = 'rgba(255,255,255,0.45)';
const BAR_BG   = '#0F0F0F';

// ─── Nav items keys ──────────────────────────────────────────────────────────
const NAV_KEYS = [
  { name: 'index',     key: 'tabHome',      Icon: Home     },
  { name: 'search',    key: 'tabDiscover',  Icon: Compass  },
  { name: 'watchlist', key: 'tabWatchlist', Icon: Bookmark },
  { name: 'profile',   key: 'tabProfile',   Icon: User     },
];

// ─── Sidebar for tablet/desktop ──────────────────────────────────────────────
const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const router   = useRouter();
  const segments = useSegments();
  const { t } = useLanguage();
  const activeTab = segments[1] || 'index';

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
                onPress={() => router.push(`/(tabs)/${name === 'index' ? '' : name}` as any)}
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

// ─── Root layout ─────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile  = width < 768;
  const isTablet  = width >= 768 && width < 1100;
  const isDesktop = width >= 1100;
  const isLarge   = !isMobile;
  const collapsed = isTablet; // tablet = icon-only sidebar

  return (
    <View style={styles.root}>
      {isLarge && <Sidebar collapsed={collapsed} />}
      <View style={styles.content}>
        <Tabs
          tabBar={(props) => (isMobile ? <CustomMobileTabBar {...props} /> : null)}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="search" />
          <Tabs.Screen name="watchlist" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#141414' },
  content: { flex: 1, overflow: 'hidden' },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: BAR_BG,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 12 },
      web:     { boxShadow: '4px 0 24px rgba(0,0,0,0.4)' } as any,
    }),
    zIndex: 20,
  },
  sidebarCollapsed: { width: 72 },

  // Brand
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
    }),
  },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  brandSub:   { fontSize: 11, fontWeight: '700', color: PRIMARY, letterSpacing: 1.5, marginTop: -1 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16, marginVertical: 4 },

  // Nav
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
    backgroundColor: 'rgba(229,9,20,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.25)',
  },
  navLabel: { fontSize: 15, fontWeight: '600', color: INACTIVE, flex: 1 },
  navLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  activePip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  sideBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  sideBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Footer
  sidebarFooter: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12, textAlign: 'center' },
});
