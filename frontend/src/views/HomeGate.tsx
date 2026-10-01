'use client';

import { Navigate } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomeGate() {
  const { token, loading, granjaActiva } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>;
  }
  if (!token) return <Navigate to="/login" replace />;
  if (!granjaActiva) return <Navigate to="/seleccionar-granja" replace />;
  return <Navigate to="/dashboard" replace />;
}
