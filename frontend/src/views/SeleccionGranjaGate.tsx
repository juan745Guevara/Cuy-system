'use client';

import { Navigate } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';
import SeleccionGranja from '@/views/SeleccionGranja';
import { isSuperadmin, SUPERADMIN_HOME } from '@/lib/roles';

export default function SeleccionGranjaGate() {
  const { token, loading, user } = useAuth();
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>;
  }
  if (!token) return <Navigate to="/login" replace />;
  if (isSuperadmin(user?.rol)) return <Navigate to={SUPERADMIN_HOME} replace />;
  return <SeleccionGranja />;
}
