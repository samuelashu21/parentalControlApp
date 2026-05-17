import { authFetch } from "@/services/api";
import React, { createContext, useCallback, useContext, useState } from "react";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "parent" | "child";
  linkedParent?: string;
  isTrackingPaused?: boolean;
  trackingConsent?: boolean;
  batteryLevel?: number;
  lastActive?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "admin" | "parent" | "child",
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setUser(data.user);
      setToken(data.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "admin" | "parent" | "child",
    ) => {
      setIsLoading(true);
      try {
        const res = await authFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        setUser(data.user);
        setToken(data.token);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch("/auth/profile", {}, token);
      const data = await res.json();
      if (res.ok) setUser(data.user);
    } catch {
      // silently fail refresh
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
