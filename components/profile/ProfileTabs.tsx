import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LayoutGrid, MessageSquare, Bookmark } from 'lucide-react-native';
import { Colors, FontWeight } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import Animated, { useAnimatedStyle, SharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';

export type ContentTab = 'Reviews' | 'Diary' | 'Watchlist';

interface ProfileTabsProps {
  index: SharedValue<number>;
  tabNames: any;
  onTabPress: (name: string) => void;
  indexDecimal: SharedValue<number>;
  counts: {
    diary: number;
    reviews: number;
    watchlist: number;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  index: activeIndexVal,
  tabNames,
  onTabPress,
  indexDecimal,
  counts
}) => {
  const { t } = useLanguage();
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync indexDecimal to activeIndex state safely across JS thread
  useAnimatedReaction(
    () => {
      return indexDecimal ? Math.round(indexDecimal.value) : 0;
    },
    (nextIndex) => {
      if (nextIndex !== activeIndex) {
        runOnJS(setActiveIndex)(nextIndex);
      }
    },
    [activeIndex, indexDecimal]
  );

  const tabs: { key: ContentTab; Icon: any; count: number; label: string }[] = [
    { key: 'Reviews',   Icon: MessageSquare, count: counts.reviews,   label: t('reviews') },
    { key: 'Diary',     Icon: LayoutGrid,    count: counts.diary,     label: t('diary') },
    { key: 'Watchlist', Icon: Bookmark,      count: counts.watchlist, label: t('tabWatchlist') },
  ];

  const tabWidth = containerWidth / tabs.length;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    if (containerWidth === 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const val = indexDecimal ? indexDecimal.value : activeIndex;
    return {
      width: tabWidth,
      transform: [{ translateX: val * tabWidth }],
    };
  });

  return (
    <View 
      style={styles.tabBar}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {tabs.map(({ key, Icon, count, label }, tabIndex) => {
        const isActive = activeIndex === tabIndex;
        return (
          <Pressable 
            key={key}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
            onPress={() => {
              setActiveIndex(tabIndex);
              onTabPress(key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.tabIconWrapper}>
              <Icon size={18} color={isActive ? Colors.white : 'rgba(255,255,255,0.4)'} strokeWidth={isActive ? 2.5 : 2} />
              <Text style={[styles.tabLabelText, isActive && styles.tabLabelTextActive]} maxFontSizeMultiplier={1.3}>
                {label}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]} maxFontSizeMultiplier={1.3}>
                  {count}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
      
      {/* Animated red line indicator */}
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)', 
    position: 'relative',
    backgroundColor: Colors.background,
  },
  tab: { 
    flex: 1, 
    height: 48, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: Colors.primary,
  },
  tabIconWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabLabelText: { fontSize: 13, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.4)' },
  tabLabelTextActive: { color: Colors.white },
  tabBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, minWidth: 20, paddingVertical: 2, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(199,31,55,0.2)' },
  tabBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.6)' },
  tabBadgeTextActive: { color: Colors.primary },
});

export default ProfileTabs;
