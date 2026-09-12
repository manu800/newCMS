"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { AUTH_COOKIE, api } from "@/lib/api-client";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "designer" | "viewer";
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...roles: CurrentUser["role"][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get(AUTH_COOKIE);
    const request = token ? api.get<CurrentUser>("/auth/me") : Promise.reject();
    request
      .then(setUser)
      .catch(() => {
        if (token) Cookies.remove(AUTH_COOKIE);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ access_token: string; user: CurrentUser }>("/auth/login", {
        email,
        password,
      });
      Cookies.set(AUTH_COOKIE, res.access_token, { expires: 1 });
      setUser(res.user);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    Cookies.remove(AUTH_COOKIE);
    setUser(null);
    router.push("/login");
  }, [router]);

  const can = useCallback(
    (...roles: CurrentUser["role"][]) => !!user && (user.role === "admin" || roles.includes(user.role)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
