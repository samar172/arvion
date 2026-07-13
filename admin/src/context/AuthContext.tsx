"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api, { TOKEN_COOKIE, REFRESH_COOKIE, clearSession } from "@/lib/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!Cookies.get(TOKEN_COOKIE)) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/profile")
      .then((res) => setUser(res.data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.user?.role !== "ADMIN") {
      throw new Error("This account does not have admin access.");
    }
    Cookies.set(TOKEN_COOKIE, res.data.access_token, { expires: 7 });
    if (res.data.refreshToken) {
      Cookies.set(REFRESH_COOKIE, res.data.refreshToken, { expires: 7 });
    }
    setUser(res.data.user);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
