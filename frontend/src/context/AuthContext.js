import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [granjas, setGranjas] = useState([]);
  const [granjaActiva, setGranjaActiva] = useState(
    () => Number(localStorage.getItem('farmId')) || null
  );
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const applySession = useCallback((data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setGranjas(data.granjas || []);
    // Si solo hay una especie/granja, se selecciona sola
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
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        setGranjas(res.data.granjas || []);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data);
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

  const seleccionarGranja = (id) => {
    const farm = granjas.find((g) => Number(g.id) === Number(id));
    setGranjaActiva(id);
    if (id == null) {
      localStorage.removeItem('farmId');
      localStorage.removeItem('speciesId');
    }
    else {
      localStorage.setItem('farmId', String(id));
      if (farm?.id_especie) localStorage.setItem('speciesId', String(farm.id_especie));
    }
  };

  // Caducidad por inactividad (30 min)
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        granjas,
        granjaActiva,
        loading,
        login,
        logout,
        seleccionarGranja,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
