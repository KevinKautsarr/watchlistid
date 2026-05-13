import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, FlatList, 
  TouchableOpacity, ActivityIndicator, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, User, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

// Simple debounce implementation
function debounce<T extends (...args: string[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useSocial } from '@/context/SocialContext';
import { UserProfile, FetchState } from '@/types';

export default function UserSearchScreen() {
  const router = useRouter();
  const { searchUsers } = useSocial();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FetchState<UserProfile[]>>({
    status: 'idle',
    data: [],
    error: null
  });

  const performSearch = async (text: string) => {
    if (!text.trim()) {
      setResults({ status: 'idle', data: [], error: null });
      return;
    }
    
    setResults((prev: FetchState<UserProfile[]>) => ({ ...prev, status: 'loading' }));
    try {
      const users = await searchUsers(text);
      setResults({ status: 'success', data: users, error: null });
    } catch (err) {
      setResults({ status: 'error', data: [], error: (err as Error).message });
    }
  };

  const debouncedSearch = useCallback(
    debounce((text: string) => performSearch(text), 500),
    []
  );

  const handleTextChange = (text: string) => {
    setQuery(text);
    setResults((prev: FetchState<UserProfile[]>) => ({ ...prev, status: 'loading' }));
    debouncedSearch(text);
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ status: 'idle', data: [], error: null });
  };

  const renderItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={s.userCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/(tabs)/profile', params: { userId: item.id } } as any);
      }}
    >
      <Image 
        source={item.avatar_url || 'https://via.placeholder.com/50'} 
        style={s.avatar}
        contentFit="cover"
      />
      <View style={s.userInfo}>
        <Text style={s.username}>{item.username}</Text>
        <Text style={s.subText}>View Profile</Text>
      </View>
      <ChevronRight size={20} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={s.backBtn}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={s.searchBarContainer}>
          <Search size={18} color={Colors.text.secondary} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search users..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={handleTextChange}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={s.clearBtn}>
              <X size={16} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {results.status === 'loading' ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : results.data && results.data.length > 0 ? (
        <FlatList
          data={results.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: 86,
            offset: 86 * index,
            index
          })}
        />

      ) : query.length > 0 ? (
        <View style={s.center}>
          <User size={48} color="rgba(255,255,255,0.1)" />
          <Text style={s.emptyTitle}>No users found</Text>
          <Text style={s.emptySub}>Try searching for another username</Text>
        </View>
      ) : (
        <View style={s.center}>
          <Search size={48} color="rgba(255,255,255,0.05)" />
          <Text style={s.emptyTitle}>Find your friends</Text>
          <Text style={s.emptySub}>Search for movie enthusiasts by their username</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.base,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...Shadow.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  username: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  subText: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
  },
  emptySub: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 4,
  },
});
