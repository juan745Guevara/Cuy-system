'use client';

import { usePathname } from 'next/navigation';
import { Navigate } from '@/navigation';

/** Restricts admin-only routes (replaces nested RoleRoute). */
export default function RoleGate({ children, paths, roles, userRole }) {
  const pathname = usePathname();
  const restricted = paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (restricted && !roles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
