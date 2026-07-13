"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('arvion_token');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          Cookies.remove('arvion_token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = (token: string, userData: User, refreshToken?: string) => {
    Cookies.set('arvion_token', token, { expires: 7 }); // 7 days
    if (refreshToken) {
      Cookies.set('arvion_refresh', refreshToken, { expires: 7 });
    }
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('arvion_token');
    Cookies.remove('arvion_refresh');
    setUser(null);
    router.push('/');
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
