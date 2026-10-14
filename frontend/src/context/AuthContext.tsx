'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import api, { clearApiCache } from '@/lib/api';
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
      if (data.granjas[0].id_especie) {
        localStorage.setItem('speciesId', String(data.granjas[0].id_especie));
      }
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
        const farms = res.data.granjas || [];
        setGranjas(farms);
        const current = farms.find((g) => Number(g.id) === Number(storedFarm));
        if (current?.id_especie) {
          localStorage.setItem('speciesId', String(current.id_especie));
        }
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

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      applySession(data);
      setLoading(false);
      return data;
    },
    [applySession],
  );

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
    clearApiCache();
    localStorage.removeItem('token');
    localStorage.removeItem('farmId');
    localStorage.removeItem('speciesId');
  }, []);

  const seleccionarGranja = useCallback(
    (id: number | null) => {
      const farm = granjas.find((g) => Number(g.id) === Number(id));
      setGranjaActiva(id);
      clearApiCache();
      if (id == null) {
        localStorage.removeItem('farmId');
        localStorage.removeItem('speciesId');
      } else {
        localStorage.setItem('farmId', String(id));
        if (farm?.id_especie) {
          localStorage.setItem('speciesId', String(farm.id_especie));
        } else {
          localStorage.removeItem('speciesId');
        }
      }
    },
    [granjas],
  );

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

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      granjas,
      granjaActiva,
      loading,
      login,
      logout,
      seleccionarGranja,
    }),
    [user, token, granjas, granjaActiva, loading, login, logout, seleccionarGranja],
  );

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
