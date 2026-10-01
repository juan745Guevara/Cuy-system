import type { UserRole } from '@/types/auth';

export const isSuperadmin = (rol?: UserRole | null): boolean => rol === 'superadmin';

/** Pantalla principal del superadmin (solo administración de cuentas). */
export const SUPERADMIN_HOME = '/usuarios';

/** Rutas permitidas para superadmin (crear cuentas, granjas y alcance). */
export const SUPERADMIN_ALLOWED_PREFIXES = ['/usuarios', '/granjas'] as const;

export function isSuperadminRouteAllowed(pathname: string): boolean {
  const path = pathname || '/';
  return SUPERADMIN_ALLOWED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}
