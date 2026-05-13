import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { typedFrom } from '../supabase';
import { useAuth } from './AuthContext';
import { MovieLog } from '@/types';
import Toast from '@/components/common/Toast';

interface LogContextType {
  userLogs: MovieLog[];
  loadingLogs: boolean;
  addLog: (log: Omit<MovieLog, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => Promise<boolean>;
  getUserLogs: (userId: string) => Promise<MovieLog[]>;
  deleteLog: (logId: string) => Promise<boolean>;
  refreshLogs: () => Promise<void>;
  getAverageRating: (movieId: number) => Promise<{ average: number; count: number }>;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userLogs, setUserLogs] = useState<MovieLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; title?: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, title, message, type });
  };

  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const fetchMyLogs = useCallback(async () => {
    if (!user) {
      setUserLogs([]);
      return;
    }
    setLoadingLogs(true);
    try {
      const { data, error } = await typedFrom('movie_logs')
        .select('id,movie_id,movie_title,poster_path,watched_at,rating,review_text,is_spoiler,created_at')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserLogs(data as MovieLog[]);
      }
    } finally {
      setLoadingLogs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyLogs();
  }, [fetchMyLogs]);

  const addLog = async (logData: Omit<MovieLog, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => {
    if (!user) {
      showToast('Error', 'You must be logged in to log a movie.', 'error');
      return false;
    }

    try {
      const formattedDate = new Date(logData.watched_at || new Date()).toISOString();

      const { error } = await typedFrom('movie_logs')
        .insert({
          user_id: user.id,
          movie_id: logData.movie_id,
          movie_title: logData.movie_title,
          poster_path: logData.poster_path,
          rating: logData.rating,
          review_text: logData.review_text,
          is_spoiler: logData.is_spoiler,
          watched_at: formattedDate,
        });

      if (error) {
        showToast('Failed', error.message || 'An error occurred while saving your log.', 'error');
        return false;
      }

      showToast('Success', 'Movie log saved successfully!', 'success');
      fetchMyLogs();
      return true;
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to process log data.', 'error');
      return false;
    }
  };

  const getUserLogs = async (userId: string): Promise<MovieLog[]> => {
    const { data, error } = await typedFrom('movie_logs')
      .select('id, movie_id, movie_title, poster_path, watched_at, rating, review_text, is_spoiler, created_at')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });

    if (error) return [];
    return data as MovieLog[];
  };

  const deleteLog = async (logId: string) => {
    if (!user) return false;
    const { error } = await typedFrom('movie_logs').delete().eq('id', logId).eq('user_id', user.id);

    if (error) {
      showToast('Failed', 'Could not delete log.', 'error');
      return false;
    }
    
    showToast('Success', 'Log deleted successfully.', 'success');
    setUserLogs(prev => prev.filter(l => l.id !== logId));
    return true;
  };

  const getAverageRating = async (movieId: number) => {
    const { data, error } = await typedFrom('movie_logs').select('rating').eq('movie_id', movieId);
    if (error || !data || data.length === 0) return { average: 0, count: 0 };
    const sum = data.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return { average: sum / data.length, count: data.length };
  };

  return (
    <LogContext.Provider value={{
      userLogs,
      loadingLogs,
      addLog,
      getUserLogs,
      deleteLog,
      refreshLogs: fetchMyLogs,
      getAverageRating
    }}>
      {children}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (context === undefined) throw new Error('useLogs must be used within a LogProvider');
  return context;
};
