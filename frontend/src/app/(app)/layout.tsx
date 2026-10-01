'use client';

import { useAuth } from '@/context/AuthContext';
import { Navigate } from '@/lib/navigation';
import Layout from '@/components/Layout';
import RoleGate from '@/components/RoleGate';

const ADMIN_PATHS = ['/usuarios', '/granjas', '/auditoria'];
const ADMIN_ROLES = ['superadmin', 'admin'];

export default function AuthenticatedLayout({ children }) {
  const { token, loading, granjaActiva, user } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>;
  }
  if (!token) return <Navigate to="/login" replace />;
  if (!granjaActiva) return <Navigate to="/seleccionar-granja" replace />;

  return (
    <RoleGate paths={ADMIN_PATHS} roles={ADMIN_ROLES} userRole={user?.rol}>
      <Layout>{children}</Layout>
    </RoleGate>
  );
}
