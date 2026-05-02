import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe({
    query: { retry: false },
  });
  
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isError) {
      // If we are not on login/signup, redirect to login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
        setLocation("/login");
      }
    }
  }, [isLoading, isError, setLocation]);

  const value = {
    user: user || null,
    isLoading,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
