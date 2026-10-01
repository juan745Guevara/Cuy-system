'use client';

import { usePathname } from 'next/navigation';
import { Navigate } from '@/lib/navigation';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types/auth';
import {
  isSuperadmin,
  isSuperadminRouteAllowed,
  SUPERADMIN_HOME,
} from '@/lib/roles';

/** Restricts admin-only routes (replaces nested RoleRoute). */
export default function RoleGate({
  children,
  paths,
  roles,
  userRole,
}: {
  children: ReactNode;
  paths: string[];
  roles: UserRole[];
  userRole?: UserRole;
}) {
  const pathname = usePathname() || '/';

  if (isSuperadmin(userRole) && !isSuperadminRouteAllowed(pathname)) {
    return <Navigate to={SUPERADMIN_HOME} replace />;
  }

  const restricted = paths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (restricted && userRole && !roles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
