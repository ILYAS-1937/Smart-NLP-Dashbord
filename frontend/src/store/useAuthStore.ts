import { create } from 'zustand';
import { User } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = localStorage.getItem('smartnow_user');
  const savedToken = localStorage.getItem('smartnow_token');
  const parsedUser: User | null = savedUser ? JSON.parse(savedUser) : null;

  return {
    user: parsedUser,
    token: savedToken,
    isAuthenticated: !!savedToken,
    isAdmin: parsedUser?.role === 'ADMIN',
    isAuthModalOpen: false,

    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),

    setAuth: (user: User, token: string) => {
      localStorage.setItem('smartnow_user', JSON.stringify(user));
      localStorage.setItem('smartnow_token', token);
      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isAuthModalOpen: false,
      });
    },

    logout: () => {
      localStorage.removeItem('smartnow_user');
      localStorage.removeItem('smartnow_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isAuthModalOpen: false,
      });
    },
  };
});