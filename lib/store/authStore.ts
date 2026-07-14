import { create } from 'zustand';
import type { User, Org } from '@/shared/types/auth';

const STORAGE_KEY = 'novora_auth';

interface AuthState {
  user: User | null;
  org: Org | null;
  token: string | null;
  isLoading: boolean;
  hydrated: boolean;
  setAuth: (user: User, org: Org, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isViewer: () => boolean;
  hydrate: () => void;
}

function persistAuth(user: User, org: Org, token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, org, token }));
  document.cookie = `novora_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

function clearPersistedAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = 'novora_token=; path=/; max-age=0; SameSite=Lax';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Must match SSR: never read localStorage during init (causes hydration errors).
  user: null,
  org: null,
  token: null,
  isLoading: true,
  hydrated: false,

  setAuth: (user, org, token) => {
    persistAuth(user, org, token);
    set({ user, org, token, isLoading: false, hydrated: true });
  },

  clearAuth: () => {
    clearPersistedAuth();
    set({
      user: null,
      org: null,
      token: null,
      isLoading: false,
      hydrated: true,
    });
  },

  isAdmin: () => get().user?.role === 'admin',
  isStaff: () => get().user?.role === 'staff',
  isViewer: () => get().user?.role === 'viewer',

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { user, org, token } = JSON.parse(raw) as {
          user: User;
          org: Org;
          token: string;
        };
        if (token) {
          document.cookie = `novora_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({ user, org, token, isLoading: false, hydrated: true });
        return;
      }
    } catch {
      clearPersistedAuth();
    }
    set({ isLoading: false, hydrated: true });
  },
}));
