import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authFetch } from "@/services/api";

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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore login state when app opens
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("user");

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Navigate into app
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.log("Failed to restore auth", err);
      }
    };

    loadAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await authFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save state
      setUser(data.user);
      setToken(data.token);

      // Save locally
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // Navigate to app
      router.replace("/(tabs)");
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
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
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }

        // Save state
        setUser(data.user);
        setToken(data.token);

        // Save locally
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        // Navigate to app
        router.replace("/(tabs)");
      } catch (err: any) {
        throw new Error(err.message || "Registration failed");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      setUser(null);
      setToken(null);

      router.replace("/(auth)/login");
    } catch (err) {
      console.log("Logout failed", err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const res = await authFetch("/auth/profile", {}, token);

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);

        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (err) {
      console.log("Refresh failed", err);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
