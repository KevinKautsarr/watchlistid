import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, IconSize, Radius, Shadow, Spacing } from '@/constants/theme';
import { SearchFilterRow } from './SearchFilterRow';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { cursorPointer } from '@/utils/webStyles';

interface SearchHeaderProps {
  activeCat: string | null;
  searchText: string;
  setSearchText: (text: string) => void;
  searchMode: 'media' | 'users';
  setSearchMode: (mode: 'media' | 'users') => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  inputRef: React.RefObject<TextInput | null>;
  inputScale: Animated.Value;
  onFocus: () => void;
  onBlur: () => void;
  withMargin: boolean;
  contentPadding: number;
  t: (key: any) => string;
  user: any;
  filterChips: { id: string; labelKey: string }[];
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  activeCat,
  searchText,
  setSearchText,
  searchMode,
  setSearchMode,
  activeFilter,
  setActiveFilter,
  inputRef,
  inputScale,
  onFocus,
  onBlur,
  withMargin,
  contentPadding,
  t,
  user,
  filterChips,
}) => {
  const { showLoginPrompt } = useLoginPrompt();

  if (activeCat) return null;

  return (
    <View style={styles.container}>
      {/* Search Wrap */}
      <Animated.View
        style={[
          styles.searchWrap,
          {
            marginHorizontal: withMargin ? contentPadding : 0,
            transform: [{ scale: inputScale }],
          },
        ]}
      >
        <Search size={IconSize.md} color={Colors.primary} strokeWidth={2} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={
            searchMode === 'users'
              ? t('searchUserPlaceholder')
              : t('searchMoviesTVPeople')
          }
          placeholderTextColor={Colors.text.secondary}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
          allowFontScaling={false}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setSearchText('')}
          >
            <X size={IconSize.xs} color={Colors.white} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Pill Tab Switcher */}
      <View
        style={[
          styles.tabSwitcher,
          { marginHorizontal: withMargin ? contentPadding : 0 },
        ]}
        accessibilityRole="tablist"
      >
        <Pressable
          style={({ pressed }) => [
            styles.pill,
            searchMode === 'media' && styles.pillActive,
            cursorPointer,
            pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSearchMode('media');
          }}
          accessibilityRole="tab"
          accessibilityLabel="Cari Film & TV"
        >
          <Text
            style={[
              styles.pillText,
              searchMode === 'media' && styles.pillTextActive,
            ]}
          >
            🎬 Film & TV
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.pill,
            searchMode === 'users' && styles.pillActive,
            cursorPointer,
            pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!user) {
              showLoginPrompt();
            } else {
              setSearchMode('users');
            }
          }}
          accessibilityRole="tab"
          accessibilityLabel={t('searchUsers')}
        >
          <Text
            style={[
              styles.pillText,
              searchMode === 'users' && styles.pillTextActive,
            ]}
          >
            👥 {t('usersTab')}
          </Text>
        </Pressable>
      </View>

      {/* Filter Chips */}
      {searchMode === 'media' && (
        <SearchFilterRow
          filters={filterChips}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          t={t}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    paddingVertical: 8,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 99,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: Colors.accentBlue,
  },
  pillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  pillTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
