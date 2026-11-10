import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true
        });
        return data;
      },

      register: async (full_name, email, password) => {
        const { data } = await api.post('/auth/register', { full_name, email, password });
        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true
        });
        return data;
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        // Force-clear persisted storage so a hard reload stays logged out
        localStorage.removeItem('auth-storage');
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
