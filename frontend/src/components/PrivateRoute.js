import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Protege rutas privadas (NUC-01). */
const PrivateRoute = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>;
  }

  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default PrivateRoute;
