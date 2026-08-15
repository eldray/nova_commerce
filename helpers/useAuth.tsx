import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "./User";
import { getSession } from "../endpoints/auth/session_GET.schema";
import { postLogout } from "../endpoints/auth/logout_POST.schema";

export type AuthState =
  | { type: "loading" }
  | { type: "unauthenticated" }
  | { type: "authenticated"; user: User };

interface AuthContextType {
  authState: AuthState;
  logout: () => Promise<void>;
  refetchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => getSession(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => postLogout(),
    onSuccess: () => {
      queryClient.setQueryData(["auth-session"], { user: null });
      queryClient.invalidateQueries();
    },
  });

  let authState: AuthState = { type: "loading" };
  if (!isLoading) {
    if (data?.user) {
      authState = { type: "authenticated", user: data.user };
    } else {
      authState = { type: "unauthenticated" };
    }
  }

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ authState, logout, refetchSession: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
