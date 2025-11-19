import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Clear any existing auth data before login
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;
        
        // Set new token and state
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      register: async (email: string, password: string, name: string, phone?: string) => {
        const response = await api.post('/auth/register', { email, password, name, phone });
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        // Clear all auth-related data
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        // Clear zustand state
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);

