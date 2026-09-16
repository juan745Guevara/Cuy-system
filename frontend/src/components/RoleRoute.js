import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Restringe rutas por rol. roles vacío = permitido a todos con sesión. */
const RoleRoute = ({ roles }) => {
  const { user } = useAuth();
  if (!roles || !roles.length || roles.includes(user?.rol)) return <Outlet />;
  return <Navigate to="/" replace />;
};

export default RoleRoute;