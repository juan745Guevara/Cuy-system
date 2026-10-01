'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import type {
  AuthContextValue,
  AuthUser,
  LoginResponse,
  UserFarm,
} from '../types/auth';
import { isSuperadmin } from '@/lib/roles';

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [granjas, setGranjas] = useState<UserFarm[]>([]);
  const [granjaActiva, setGranjaActiva] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setGranjas(data.granjas || []);
    if (isSuperadmin(data.user?.rol)) {
      localStorage.removeItem('farmId');
      localStorage.removeItem('speciesId');
      setGranjaActiva(null);
      return;
    }
    if (data.granjas?.length === 1) {
      localStorage.setItem('farmId', String(data.granjas[0].id));
      setGranjaActiva(data.granjas[0].id);
    } else {
      localStorage.removeItem('farmId');
      localStorage.removeItem('speciesId');
      setGranjaActiva(null);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      const storedToken = localStorage.getItem('token');
      const storedFarm = Number(localStorage.getItem('farmId')) || null;
      if (!alive) return;

      setToken(storedToken);
      setGranjaActiva(storedFarm);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (!alive) return;
        setUser(res.data.user);
        setGranjas(res.data.granjas || []);
      } catch {
        if (!alive) return;
        localStorage.removeItem('token');
        localStorage.removeItem('farmId');
        localStorage.removeItem('speciesId');
        setToken(null);
        setUser(null);
        setGranjas([]);
        setGranjaActiva(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    applySession(data);
    setLoading(false);
    return data;
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setUser(null);
    setToken(null);
    setGranjas([]);
    setGranjaActiva(null);
    localStorage.removeItem('token');
    localStorage.removeItem('farmId');
    localStorage.removeItem('speciesId');
  }, []);

  const seleccionarGranja = (id: number | null) => {
    const farm = granjas.find((g) => Number(g.id) === Number(id));
    setGranjaActiva(id);
    if (id == null) {
      localStorage.removeItem('farmId');
      localStorage.removeItem('speciesId');
    } else {
      localStorage.setItem('farmId', String(id));
      if (farm?.id_especie) {
        localStorage.setItem('speciesId', String(farm.id_especie));
      }
    }
  };

  useEffect(() => {
    if (!token) return undefined;
    const MAX_IDLE_MS = 30 * 60 * 1000;
    let timer = setTimeout(() => {
      logout();
    }, MAX_IDLE_MS);
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, MAX_IDLE_MS);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, bump));
    };
  }, [token, logout]);

  const value: AuthContextValue = {
    user,
    token,
    granjas,
    granjaActiva,
    loading,
    login,
    logout,
    seleccionarGranja,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
