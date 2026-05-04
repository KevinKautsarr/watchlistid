import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, BellOff, CheckCircle2, Info, AlertTriangle, ChevronLeft, Trash2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useNotifications, Notification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 100,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.5 },
  
  listContent: { paddingVertical: Spacing.sm },
  item: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 16,
  },
  itemUnread: { backgroundColor: 'rgba(255,255,255,0.03)' },
  
  itemLeft: { position: 'relative' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  itemTitle: { color: Colors.white, fontWeight: FontWeight.black, fontSize: 14.5 },
  itemMessage: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 19 },
  itemDate: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  
  itemRight: { marginLeft: 4 },

  empty: { flex: 1, paddingTop: 120, alignItems: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 8 },
  emptySub: { fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22 },
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
      router.push(`/movie/${item.movie_id}` as any);
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
        style={[s.item, isUnread && s.itemUnread]} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={s.itemLeft}>
          <View style={[s.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Icon size={20} color={iconColor} strokeWidth={2.5} />
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
          <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      
      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text style={s.headerTitle} allowFontScaling={false}>{t('notifications')}</Text>
        
        <TouchableOpacity style={s.headerBtn} onPress={handleMarkAllRead}>
          <Trash2 size={20} color={Colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[s.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={(
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <BellOff size={40} color="rgba(255,255,255,0.1)" strokeWidth={1.5} />
            </View>
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
