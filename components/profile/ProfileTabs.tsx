import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LayoutGrid, Play, Bookmark } from 'lucide-react-native';
import { Colors, FontWeight } from '@/constants/theme';

type ContentTab = 'Diary' | 'Watched' | 'Watchlist';

interface ProfileTabsProps {
  activeTab: ContentTab;
  onTabPress: (tab: ContentTab) => void;
  counts: {
    diary: number;
    watched: number;
    watchlist: number;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabPress,
  counts
}) => {
  const tabs: { key: ContentTab; Icon: any; count: number }[] = [
    { key: 'Diary',     Icon: LayoutGrid, count: counts.diary },
    { key: 'Watched',   Icon: Play,       count: counts.watched },
    { key: 'Watchlist', Icon: Bookmark,   count: counts.watchlist },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map(({ key, Icon, count }) => {
        const isActive = activeTab === key;
        return (
          <TouchableOpacity 
            key={key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabPress(key)}
          >
            <View style={styles.tabIconWrapper}>
              <Icon size={20} color={isActive ? Colors.white : 'rgba(255,255,255,0.4)'} strokeWidth={isActive ? 2.5 : 2} />
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]} allowFontScaling={false}>
                  {count}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', marginBottom: 2, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.white },
  tabIconWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, minWidth: 20, paddingVertical: 2, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(229,9,20,0.2)' },
  tabBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.6)' },
  tabBadgeTextActive: { color: Colors.primary },
});

export default ProfileTabs;
