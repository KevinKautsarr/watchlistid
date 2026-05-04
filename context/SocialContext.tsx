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
      .select('*')
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

    const { error } = await supabase
      .from('movie_logs')
      .insert({
        user_id: user.id,
        ...logData,
      });

    if (error) {
      console.error('Error adding log:', error);
      showToast('Failed', 'An error occurred while saving your log.', 'error');
      return false;
    }

    showToast('Success', 'Movie log saved successfully!', 'success');
    fetchMyLogs(); // Refresh logs
    return true;
  };

  const getUserLogs = async (userId: string): Promise<MovieLog[]> => {
    const { data, error } = await supabase
      .from('movie_logs')
      .select('*')
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
      deleteLog
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
