import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [granjas, setGranjas] = useState([]);
  const [granjaActiva, setGranjaActiva] = useState(
    () => Number(localStorage.getItem('granjaId')) || null
  );
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const applySession = useCallback((data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setGranjas(data.granjas || []);
    if (data.granjas?.length === 1) {
      localStorage.setItem('granjaId', String(data.granjas[0].id));
      setGranjaActiva(data.granjas[0].id);
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

  const logout = async () => {
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
    localStorage.removeItem('granjaId');
  };

  const seleccionarGranja = (id) => {
    setGranjaActiva(id);
    localStorage.setItem('granjaId', String(id));
  };

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
