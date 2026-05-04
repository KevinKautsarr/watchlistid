import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Modal, FlatList, TextInput, ActivityIndicator,
  Platform, Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { Search, UserPlus, UserMinus, X, ChevronRight, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

interface SocialUser {
  id: string;
  username: string;
  avatar_url?: string;
  full_name?: string;
  is_following?: boolean;
}

interface SocialListSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTab: 'followers' | 'following';
  data: SocialUser[];
  loading: boolean;
  onUserPress: (userId: string) => void;
  onFollowToggle: (userId: string) => void;
  currentUserId: string;
}

const SocialListSheet: React.FC<SocialListSheetProps> = ({
  visible, onClose, initialTab, data, loading, onUserPress, onFollowToggle, currentUserId
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const renderUser = ({ item }: { item: SocialUser }) => {
    const isMe = item.id === currentUserId;
    
    return (
      <TouchableOpacity 
        style={s.userRow} 
        onPress={() => onUserPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={s.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.placeholderAvatar]}>
              <Text style={s.placeholderText}>{item.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={s.userInfo}>
          <Text style={s.username} numberOfLines={1}>{item.username}</Text>
          {item.full_name && <Text style={s.fullName} numberOfLines={1}>{item.full_name}</Text>}
        </View>

        {!isMe && (
          <TouchableOpacity 
            style={[s.actionBtn, item.is_following ? s.followingBtn : s.followBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFollowToggle(item.id);
            }}
          >
            <Text style={[s.actionBtnText, item.is_following ? s.followingBtnText : s.followBtnText]}>
              {item.is_following ? t('following') : t('follow')}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

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
          
          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity 
              style={[s.tab, activeTab === 'followers' && s.activeTab]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('followers');
              }}
            >
              <Text style={[s.tabText, activeTab === 'followers' && s.activeTabText]}>
                {t('followers')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.tab, activeTab === 'following' && s.activeTab]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('following');
              }}
            >
              <Text style={[s.tabText, activeTab === 'following' && s.activeTabText]}>
                {t('following')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={s.searchContainer}>
            <View style={s.searchBar}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={s.searchInput}
                placeholder={t('searchPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          {loading ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={renderUser}
              keyExtractor={item => item.id}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.emptyContainer}>
                  <User size={48} color="rgba(255,255,255,0.1)" strokeWidth={1.5} />
                  <Text style={s.emptyText}>{t('noUsersFound')}</Text>
                </View>
              }
            />
          )}

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    height: '85%',
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.white,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.4)',
  },
  activeTabText: {
    color: Colors.white,
  },
  searchContainer: {
    padding: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  fullName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    minWidth: 90,
    alignItems: 'center',
  },
  followBtn: {
    backgroundColor: '#0095F6', // IG Blue
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  followBtnText: {
    color: Colors.white,
  },
  followingBtnText: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: FontSize.sm,
  },
  closeBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  closeBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
});

export default SocialListSheet;
