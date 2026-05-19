import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase, typedFrom } from '@/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
  movie_id?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendLocalNotification: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await typedFrom('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted: Notification[] = data.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: (n.type as 'info' | 'success' | 'warning') || 'info',
        is_read: !!n.is_read,
        movie_id: n.movie_id ?? undefined,
        created_at: n.created_at || new Date().toISOString()
      }));
      setNotifications(formatted);
      setUnreadCount(formatted.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Realtime subscription: only on native (iOS/Android app).
      // iOS WebKit blocks WebSocket with "The operation is insecure" —
      // skip Realtime on web and rely on fetchNotifications() on mount.
      if (Platform.OS === 'web') return;

      let channel: ReturnType<typeof supabase.channel> | null = null;
      try {
        channel = supabase
          .channel(`user-notifications-${user.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            sendLocalNotification(newNotif.title, newNotif.message);
          })
          .subscribe();
      } catch (err) {
        console.warn('[Notifications] Realtime subscription failed (expected on web):', err);
      }

      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    const { error } = await typedFrom('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const sendLocalNotification = (title: string, message: string) => {
    // Browser Notification (Web)
    if (Platform.OS === 'web' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.ico' });
          }
        });
      }
    }
    // Mobile logic would use expo-notifications (optional step)
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      sendLocalNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
