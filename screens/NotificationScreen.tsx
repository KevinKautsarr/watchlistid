import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, CheckCircle2, Info, AlertTriangle, ChevronLeft, Trash2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, Shadow } from '@/constants/theme';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { cursorPointer } from '@/utils/webStyles';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.overlay.light5,
    height: 100,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.5 },
  
  listContent: { paddingVertical: Spacing.sm },
  item: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 16,
  },
  itemUnread: { backgroundColor: Colors.overlay.light5 },
  
  itemLeft: { position: 'relative' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay.light5,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  
  itemCenter: { flex: 1, gap: 2 },
  itemTitle: { color: Colors.white, fontWeight: FontWeight.black, fontSize: FontSize.md },
  itemMessage: { fontSize: FontSize.md, color: Colors.text.secondary, lineHeight: 19 },
  itemDate: { fontSize: FontSize.xs, color: Colors.overlay.light30, marginTop: 2 },
  
  itemRight: { marginLeft: 4 },

  empty: { flex: 1, paddingTop: 120, alignItems: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.overlay.light2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 8 },
  emptySub: { fontSize: FontSize.base, color: Colors.overlay.light40, textAlign: 'center', lineHeight: 22 },
});

const NotificationScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllAsRead();
  };

  const handleNotificationPress = (item: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAsRead(item.id);
    
    // Smart navigation logic
    if (item.movie_id) {
      router.push({ pathname: '/movie/[id]', params: { id: item.movie_id.toString() } });
    } else if (item.message.toLowerCase().includes('follow')) {
      // If it's a follow notification, we'd ideally go to the user's profile
      // For now, since we don't have actor_id in the interface, we'll stay or go to search
      // router.push({ pathname: '/(tabs)/search' });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.is_read;
    const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'warning' ? AlertTriangle : Bell;
    const iconColor = item.type === 'success' ? '#4CAF50' : item.type === 'warning' ? '#FFC107' : Colors.primary;

    return (
      <TouchableOpacity 
        style={[s.item, isUnread && s.itemUnread, cursorPointer]} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}: ${item.message}`}
        accessibilityState={{ expanded: false }}
      >
        <View style={s.itemLeft}>
          <View style={[s.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Icon size={IconSize.md} color={iconColor} strokeWidth={2.5} />
          </View>
          {isUnread && <View style={s.unreadDot} />}
        </View>

        <View style={s.itemCenter}>
          <Text style={s.itemMessage} numberOfLines={3} allowFontScaling={false}>
            <Text style={s.itemTitle}>{item.title} </Text>
            {item.message}
          </Text>
          <Text style={s.itemDate} allowFontScaling={false}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={s.itemRight}>
          <ChevronRight size={IconSize.sm} color={Colors.overlay.light20} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      
      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={[s.headerBtn, cursorPointer]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft size={IconSize.lg} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text style={s.headerTitle} allowFontScaling={false}>{t('notifications')}</Text>
        
        <TouchableOpacity style={[s.headerBtn, cursorPointer]} onPress={handleMarkAllRead} accessibilityRole="button" accessibilityLabel="Clear all notifications">
          <Trash2 size={IconSize.md} color={Colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[s.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={(
          <View style={s.empty}>
            <EmptyStateIcon name="notifications" size={96} style={{ marginBottom: Spacing.xl }} />
            <Text style={s.emptyTitle} allowFontScaling={false}>{t('allCaughtUp')}</Text>
            <Text style={s.emptySub} allowFontScaling={false}>
              {t('noNotifications')}
            </Text>
          </View>
        )}
      />
    </View>
  );
};


export default NotificationScreen;
