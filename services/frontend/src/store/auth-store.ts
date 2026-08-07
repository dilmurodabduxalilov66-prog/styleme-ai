import { create } from 'zustand';
import { setCookie, deleteCookie, getCookie } from '@/utils/cookies';
import { decodeJwt } from '@/utils/jwt';

export interface UserPayload {
  userId: string;
  id?: string;
  role: 'USER' | 'BARBER' | 'ADMIN' | 'OWNER';
  email?: string;
  phone?: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserPayload, refreshToken?: string) => void;
  clearAuth: () => void;
  hydrateAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user, refreshToken) => {
    // Sync to state
    set({ token, user, isAuthenticated: true });
    
    // Sync to browser cookies for Next.js Server Components & Middleware visibility
    setCookie('access_token', token, 604800); // 7 days expiry matching JWT access_token lifetime
    setCookie('user_role', user.role, 2592000); // 30 days role memory
    if (refreshToken) {
      setCookie('refresh_token', refreshToken, 2592000);
    }
  },
  clearAuth: () => {
    // Clear state
    set({ token: null, user: null, isAuthenticated: false });
    
    // Clear cookies
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    deleteCookie('user_role');
  },
  hydrateAuth: () => {
    const token = getCookie('access_token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        set({ token, user: decoded, isAuthenticated: true });
      } else {
        // Invalid token
        deleteCookie('access_token');
        deleteCookie('user_role');
      }
    }
  }
}));


