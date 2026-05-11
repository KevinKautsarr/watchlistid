import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { MovieLog, UserProfile } from '../types';
import Toast from '../components/common/Toast';

interface SocialContextType {
  userLogs: MovieLog[];
  loadingLogs: boolean;
  addLog: (log: Omit<MovieLog, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => Promise<boolean>;
  getUserLogs: (userId: string) => Promise<MovieLog[]>;
  deleteLog: (logId: string) => Promise<boolean>;
  refreshLogs: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const { data, error } = await supabase
      .from('movie_logs')
      .select('id, movie_id, movie_title, poster_path, watched_at, rating, review_text, is_spoiler, created_at')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserLogs(data as MovieLog[]);
    }
    setLoadingLogs(false);
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
      // Ensure watched_at is a valid ISO string for Postgres timestamp
      const formattedDate = new Date(logData.watched_at || new Date()).toISOString();

      // Destructure to separate media_type in case it's not in the DB schema
      const { media_type, ...otherLogData } = logData;

      const { error } = await supabase
        .from('movie_logs')
        .insert({
          user_id: user.id,
          ...otherLogData,
          watched_at: formattedDate,
          // We omit media_type here to avoid PGRST204 if the column is missing
          // If you add the column to Supabase, you can put it back or 
          // add it conditionally.
        });

      if (error) {
        console.error('Supabase Insert Error:', error);
        
        // If error is related to foreign key, user might not have a profile record
        if (error.code === '23503') {
          showToast('Profile Error', 'Your user profile is not fully set up. Please try again later.', 'error');
        } else {
          showToast('Failed', error.message || 'An error occurred while saving your log.', 'error');
        }
        return false;
      }

      showToast('Success', 'Movie log saved successfully!', 'success');
      fetchMyLogs(); // Refresh logs
      return true;
    } catch (err: any) {
      console.error('Logic Error adding log:', err);
      showToast('Error', err.message || 'Failed to process log data.', 'error');
      return false;
    }
  };

  const getUserLogs = async (userId: string): Promise<MovieLog[]> => {
    const { data, error } = await supabase
      .from('movie_logs')
      .select('id, movie_id, movie_title, poster_path, watched_at, rating, review_text, is_spoiler, created_at')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }
    return data as MovieLog[];
  };

  const deleteLog = async (logId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('movie_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id);

    if (error) {
      showToast('Failed', 'Could not delete log.', 'error');
      return false;
    }
    
    showToast('Success', 'Log deleted successfully.', 'success');
    setUserLogs(prev => prev.filter(l => l.id !== logId));
    return true;
  };

  return (
    <SocialContext.Provider value={{
      userLogs,
      loadingLogs,
      addLog,
      getUserLogs,
      deleteLog,
      refreshLogs: fetchMyLogs
    }}>
      {children}
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={hideToast} 
      />
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};
