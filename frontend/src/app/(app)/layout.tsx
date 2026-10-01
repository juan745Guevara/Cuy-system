'use client';

import { useAuth } from '@/context/AuthContext';
import { Navigate } from '@/lib/navigation';
import Layout from '@/components/Layout';
import RoleGate from '@/components/RoleGate';
import { isSuperadmin } from '@/lib/roles';

const ADMIN_PATHS = ['/usuarios', '/auditoria'];
const ADMIN_ROLES = ['superadmin', 'admin'];
const SUPERADMIN_PATHS = ['/granjas'];
const SUPERADMIN_ROLES = ['superadmin'];

export default function AuthenticatedLayout({ children }) {
  const { token, loading, granjaActiva, user } = useAuth();
  const superadmin = isSuperadmin(user?.rol);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>;
  }
  if (!token) return <Navigate to="/login" replace />;
  if (!superadmin && !granjaActiva) return <Navigate to="/seleccionar-granja" replace />;

  return (
    <RoleGate paths={ADMIN_PATHS} roles={ADMIN_ROLES} userRole={user?.rol}>
      <RoleGate paths={SUPERADMIN_PATHS} roles={SUPERADMIN_ROLES} userRole={user?.rol}>
        <Layout>{children}</Layout>
      </RoleGate>
    </RoleGate>
  );
}
