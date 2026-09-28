'use client';

import { Navigate } from '@/navigation';
import { useAuth } from '@/context/AuthContext';
import SeleccionGranja from '@/views/SeleccionGranja';

export default function SeleccionGranjaGate() {
  const { token, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>;
  }
  if (!token) return <Navigate to="/login" replace />;
  return <SeleccionGranja />;
}
