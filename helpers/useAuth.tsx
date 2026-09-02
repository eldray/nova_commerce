import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

export type AuthState = 
  | { type: 'loading' }
  | { type: 'unauthenticated' }
  | { type: 'authenticated'; user: User };

async function fetchSession(): Promise<AuthState> {
  try {
    const response = await fetch('/_api/auth/session', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      return { type: 'unauthenticated' };
    }
    
    const data = await response.json();
    
    if (data && data.user) {
      return {
        type: 'authenticated',
        user: data.user,
      };
    }
    
    return { type: 'unauthenticated' };
  } catch (error) {
    return { type: 'unauthenticated' };
  }
}

const AuthContext = createContext<{
  authState: AuthState;
  refetchSession: () => void;
}>({
  authState: { type: 'loading' },
  refetchSession: () => {},
});

// MAKE SURE THIS IS EXPORTED
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const authState = isLoading ? { type: 'loading' as const } : (data || { type: 'unauthenticated' as const });

  return (
    <AuthContext.Provider value={{ authState, refetchSession: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

// MAKE SURE THIS IS EXPORTED
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
