import { create } from 'zustand';

// Define the shape of the user object
interface User {
  id: string;
  username: string;
  email: string;
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitializing: boolean; // To track initial auth check
  setUser: (user: User | null, accessToken: string | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true, // Start in an initializing state
  
  setUser: (user, accessToken) => {
    set({ user, accessToken, isInitializing: false });
  },

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  setInitializing: (isInitializing) => {
    set({ isInitializing });
  },

  logout: () => {
    // Clear user and token from memory
    set({ user: null, accessToken: null, isInitializing: false });
  },
}));