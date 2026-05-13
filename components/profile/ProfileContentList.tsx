import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MediaItem, MovieLog } from '@/types';
import { Spacing, FontSize, Colors } from '@/constants/theme';
import DiaryCard from '@/components/movie/DiaryCard';
import MovieListItem from '@/components/movie/MovieListItem';

type ContentTab = 'Diary' | 'Watched' | 'Watchlist';

interface ProfileContentListProps {
  activeTab: ContentTab;
  userLogsList: MovieLog[];
  watchedMovies: MediaItem[];
  watchlistMovies: MediaItem[];
  t: (key: string) => string;
}

export const ProfileContentList: React.FC<ProfileContentListProps> = ({ 
  activeTab, userLogsList, watchedMovies, watchlistMovies, t 
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {activeTab === 'Diary' && (
        userLogsList.length > 0 ? (
          userLogsList.map((log: any) => <DiaryCard key={log.id} log={log} />)
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('noLogsYet')}</Text>
          </View>
        )
      )}

      {activeTab === 'Watched' && (
        watchedMovies.length > 0 ? (
          watchedMovies.map(movie => (
            <MovieListItem 
              key={movie.id} 
              movie={movie} 
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id.toString(), type: movie.media_type || 'movie' } })}
            />
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('noWatchedYet')}</Text>
          </View>
        )
      )}

      {activeTab === 'Watchlist' && (
        watchlistMovies.length > 0 ? (
          watchlistMovies.map(movie => (
            <MovieListItem 
              key={movie.id} 
              movie={movie} 
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id.toString(), type: movie.media_type || 'movie' } })}
            />
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('noWatchlistYet')}</Text>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.lg },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base, color: Colors.overlay.light30, textAlign: 'center' },
});
