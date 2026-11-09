import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // 'light' | 'dark' — dark is default (Lumina360 style)

      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
      }),

      setTheme: (theme) => set(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        return { theme };
      })
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Always default to dark
        const theme = state?.theme || 'dark';
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    }
  )
);
