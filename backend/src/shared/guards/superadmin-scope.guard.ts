import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthUser } from '../auth/auth-user.types';

/** Superadmin solo administra usuarios, granjas y catálogo de especies (alcance). */
const SUPERADMIN_ALLOWED = [
  /^\/api\/v1\/auth(\/|$)/,
  /^\/api\/v1\/users(\/|$)/,
  /^\/api\/v1\/farms(\/|$)/,
  /^\/api\/v1\/species(\/|$)/,
  /^\/api\/health$/,
];

@Injectable()
export class SuperadminScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = this.resolveUser(req);
    if (!user || user.rol !== 'superadmin') return true;

    const url = (req.originalUrl || req.url || '').split('?')[0];
    if (SUPERADMIN_ALLOWED.some((re) => re.test(url))) return true;

    throw new ForbiddenException(
      'La cuenta superadmin solo puede administrar usuarios y granjas',
    );
  }

  /** Runs as global guard before route JwtAuthGuard; decode token when req.user is unset. */
  private resolveUser(req: { user?: AuthUser; headers?: { authorization?: string } }): AuthUser | undefined {
    if (req.user) return req.user;
    const header = req.headers?.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return undefined;
    try {
      return jwt.verify(token, process.env.JWT_SECRET) as AuthUser;
    } catch {
      return undefined;
    }
  }
}
