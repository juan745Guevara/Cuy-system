import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ok, fail } from '../../shared/kernel/service-result.kernel';
import { AuthRepositoryPort } from '../domain/ports/auth.repository.port';
import { UserFarm } from '../../shared/auth/auth-user.types';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepositoryPort) {}

  async login(body: { email?: string; password?: string }) {
    const { email, password } = body || {};
    if (!email || !password) {
      return fail('Email and password are required');
    }

    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.activo) {
      return fail('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return fail('Invalid credentials', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    );

    const granjas =
      user.rol === 'superadmin'
        ? await this.repository.findFarmsForSuperadmin()
        : await this.repository.findFarmsForUser(user.id);

    await this.repository.logLogin(user.id, user.email);

    return ok({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      granjas,
    });
  }

  async logout(userId: number) {
    await this.repository.logLogout(userId);
    return ok({ ok: true });
  }

  me(payload: { user: { id: number; nombre: string; email: string; rol: string }; granjas: UserFarm[] }) {
    const { user, granjas } = payload;
    return ok({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      granjas,
    });
  }
}
