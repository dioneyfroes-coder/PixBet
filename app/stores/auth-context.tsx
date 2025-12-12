import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { subscribeToTokens, type Tokens } from '../lib/token';

export type AuthContextValue = {
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  initialState,
  children,
}: {
  initialState: boolean;
  children: ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialState);

  useEffect(() => {
    const unsubscribe = subscribeToTokens((next: Tokens) => {
      setIsAuthenticated(Boolean(next.accessToken));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ isAuthenticated }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthState() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return ctx;
}
