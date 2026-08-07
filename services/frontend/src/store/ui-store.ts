import { create } from 'zustand';

interface UIState {
  activeDrawer: string | null;
  sidebarExpanded: boolean;
  themeMode: 'dark' | 'light';
  openDrawer: (drawerId: string) => void;
  closeDrawer: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeDrawer: null,
  sidebarExpanded: true,
  themeMode: 'dark', // StyleMe AI defaults to premium Space Black theme
  openDrawer: (drawerId) => set({ activeDrawer: drawerId }),
  closeDrawer: () => set({ activeDrawer: null }),
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  setTheme: (theme) => set({ themeMode: theme }),
}));
