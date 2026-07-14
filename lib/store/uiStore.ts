import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  quickDispatchOpen: boolean;
  scannerOpen: boolean;
  shortcutsOpen: boolean;
  offline: boolean;
  syncing: boolean;
  toggleSidebar: () => void;
  openQuickDispatch: () => void;
  closeQuickDispatch: () => void;
  openScanner: () => void;
  closeScanner: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  setOffline: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  closeAll: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  quickDispatchOpen: false,
  scannerOpen: false,
  shortcutsOpen: false,
  offline: false,
  syncing: false,

  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openQuickDispatch: () => set({ quickDispatchOpen: true }),
  closeQuickDispatch: () => set({ quickDispatchOpen: false }),
  openScanner: () => set({ scannerOpen: true }),
  closeScanner: () => set({ scannerOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
  setOffline: (v) => set({ offline: v }),
  setSyncing: (v) => set({ syncing: v }),
  closeAll: () =>
    set({
      quickDispatchOpen: false,
      scannerOpen: false,
      shortcutsOpen: false,
    }),
}));
