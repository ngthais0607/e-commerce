import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'new-order' | 'new-review' | 'low-stock';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (n) =>
        set((state) => {
          const isDuplicate = state.notifications.some(
            (existing) =>
              existing.type === n.type &&
              existing.message === n.message &&
              Math.abs(new Date(existing.createdAt).getTime() - new Date(n.createdAt).getTime()) < 5000,
          );
          if (isDuplicate) return state;
          return {
            notifications: [
              { ...n, id: `${Date.now()}-${Math.random()}`, read: false },
              ...state.notifications,
            ].slice(0, 50),
          };
        }),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clear: () => set({ notifications: [] }),
    }),
    { name: 'admin-notifications' },
  ),
);
