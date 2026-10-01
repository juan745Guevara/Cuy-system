import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthUser } from '../auth/auth-user.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Not authenticated');

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
