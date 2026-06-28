import { createContext, useContext } from 'react';
import type { Me } from '@/types/api';

export interface AuthContextValue {
  /** Current user + tenant + companies; null until /me resolves or when logged out. */
  me: Me | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginCode: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
