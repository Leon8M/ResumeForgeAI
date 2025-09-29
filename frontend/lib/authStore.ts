import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: { id: string; username: string; email: string } | null;
  login: (accessToken: string, user: { id: string; username: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  login: (accessToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    set({ isAuthenticated: true, accessToken, user });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ isAuthenticated: false, accessToken: null, user: null });
  },
}));
