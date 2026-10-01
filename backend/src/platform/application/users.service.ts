import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ok, fail, fromError } from '../../shared/kernel/service-result.kernel';
import { UsersRepositoryPort } from '../domain/ports/users.repository.port';
import { SharedDepsService } from '../../shared/deps/shared-deps.service';
import { AuthUser } from '../../shared/auth/auth-user.types';

const ROLE_RANK: Record<string, number> = {
  superadmin: 5,
  admin: 4,
  encargado: 3,
  supervisor: 2,
  auxiliar: 1,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepositoryPort,
    private readonly sharedDeps: SharedDepsService,
  ) {}

  private get audit() {
    return this.sharedDeps.audit;
  }

  private async creatorFarmIds(userId: number, rol: string) {
    if (rol === 'superadmin') return this.repository.findActiveFarmIds();
    return this.repository.findFarmIdsByUser(userId);
  }

  private async validateGranjaScope(params: {
    userId: number;
    userRol: string;
    farmIds: number[];
    targetId?: number;
  }) {
    const allowed = await this.creatorFarmIds(params.userId, params.userRol);
    const requested = params.farmIds.map(Number);
    const invalid = requested.filter((id) => !allowed.includes(id));
    if (invalid.length) {
      await this.repository.logBlockedEscalation(params.userId, {
        invalid,
        requested,
        ...(params.targetId != null ? { target: params.targetId } : {}),
      });
      return fail('Cannot assign farms outside your scope', 403, {
        granjas_invalidas: invalid,
      });
    }
    return null;
  }

  async create({
    user,
    farmId,
    body,
  }: {
    user: AuthUser;
    farmId?: number;
    body: Record<string, unknown>;
  }) {
    const { nombre, email, password, rol, granja_ids = [], especie_ids = [] } =
      body || {};
    if (!nombre || !email || !password || !rol) {
      return fail('name, email, password and role are required');
    }
    const rolStr = String(rol);
    if (rolStr === 'admin' && user.rol !== 'superadmin') {
      return fail('Only superadmin can create admin accounts', 403);
    }
    if (rolStr === 'superadmin') {
      return fail('Cannot create another superadmin via the API', 403);
    }
    if (
      user.rol === 'admin' &&
      !['encargado', 'supervisor', 'auxiliar'].includes(rolStr)
    ) {
      return fail('Admin can only create operational roles', 403);
    }
    if (
      (ROLE_RANK[rolStr] || 0) >= (ROLE_RANK[user.rol] || 0) &&
      user.rol !== 'superadmin'
    ) {
      return fail('Cannot assign a role equal to or above your own', 403);
    }

    const farmIds = Array.isArray(granja_ids)
      ? (granja_ids as number[]).map(Number).filter(Boolean)
      : [];
    const speciesIds = Array.isArray(especie_ids)
      ? (especie_ids as number[]).map(Number).filter(Boolean)
      : [];

    if (user.rol === 'superadmin' && speciesIds.length) {
      if (!farmIds.length) {
        return fail('Asigne al menos una granja en los módulos seleccionados');
      }
      const farms = await this.repository.findFarmsByIds(farmIds);
      if (farms.length !== farmIds.length) {
        return fail('Una o más granjas no son válidas o están inactivas', 400);
      }
      const farmOutOfModule = farms.some(
        (f) => !speciesIds.includes(f.id_especie),
      );
      if (farmOutOfModule) {
        return fail('Hay granjas fuera de los módulos seleccionados', 400);
      }
      for (const sid of speciesIds) {
        const hasFarm = farms.some((f) => f.id_especie === sid);
        if (!hasFarm) {
          return fail(
            'Seleccione al menos una granja por cada módulo marcado',
            400,
          );
        }
      }
    }

    const scopeErr = await this.validateGranjaScope({
      userId: user.id,
      userRol: user.rol,
      farmIds,
    });
    if (scopeErr) return scopeErr;

    const hash = await bcrypt.hash(String(password), 10);
    const emailNorm = String(email).trim().toLowerCase();
    const nombreStr = String(nombre);
    const farmIdsNorm = farmIds.map(Number);

    try {
      const existing = await this.repository.findByEmail(emailNorm);
      if (existing) {
        if (existing.activo !== false) {
          return fail('Ya existe una cuenta activa con ese email', 409);
        }
        if (existing.rol === 'superadmin') {
          return fail('Cannot recreate superadmin via the API', 403);
        }
        if (existing.rol === 'admin' && user.rol !== 'superadmin') {
          return fail('Only superadmin can reactivate Admin accounts', 403);
        }
        if (
          user.rol === 'admin' &&
          existing.created_by !== user.id
        ) {
          return fail('You can only reactivate accounts you created', 403);
        }

        const reactivated = await this.repository.updateWithFarms({
          id: existing.id,
          nombre: nombreStr,
          rol: rolStr,
          activo: true,
          passwordHash: hash,
          farmIds: farmIdsNorm,
        });
        const full = await this.repository.findWithFarms(existing.id);
        await this.audit.write({
          userId: user.id,
          farmId,
          accion: 'reactivar',
          entidad: 'usuario',
          idEntidad: existing.id,
          antes: existing,
          despues: full || reactivated,
          detalle: `Account reactivated: ${emailNorm}`,
        });
        return ok({ ...(full || reactivated), reactivada: true }, 200);
      }

      const created = await this.repository.createWithFarms({
        nombre: nombreStr,
        email: emailNorm,
        passwordHash: hash,
        rol: rolStr,
        createdBy: user.id,
        farmIds: farmIdsNorm,
      });
      await this.audit.write({
        userId: user.id,
        farmId,
        accion: 'crear',
        entidad: 'usuario',
        idEntidad: created.id,
        despues: created,
        detalle: `User created: ${created.email}`,
      });
      return ok(created, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return fail('Ya existe una cuenta con ese email', 409);
      }
      return fromError(err);
    }
  }

  async list(user: AuthUser) {
    const rows = await this.repository.listVisible(user.rol, user.id);
    return ok(rows);
  }

  async update({
    user,
    farmId,
    id,
    body,
  }: {
    user: AuthUser;
    farmId?: number;
    id: number;
    body: Record<string, unknown>;
  }) {
    const { activo, granja_ids, password, nombre } = body || {};
    const target = await this.repository.findById(id);
    if (!target) return fail('User not found', 404);

    if (target.rol === 'superadmin') {
      if (target.id !== user.id) {
        return fail('Cannot edit the superadmin account', 403);
      }
      if (activo === false) {
        return fail('The superadmin account cannot be deactivated', 403);
      }
      if (granja_ids !== undefined) {
        return fail('Superadmin already has access to all farms', 400);
      }
    }
    if (target.rol === 'admin' && user.rol !== 'superadmin') {
      return fail('Only superadmin can edit Admin accounts', 403);
    }
    if (
      user.rol === 'admin' &&
      target.created_by !== user.id &&
      target.id !== user.id
    ) {
      return fail('You can only edit accounts you created', 403);
    }
    if (user.rol === 'admin' && target.id === user.id && granja_ids) {
      return fail('An admin cannot expand their own farm scope', 403);
    }

    if (granja_ids) {
      const farmIds = Array.isArray(granja_ids)
        ? (granja_ids as number[])
        : [];
      const scopeErr = await this.validateGranjaScope({
        userId: user.id,
        userRol: user.rol,
        farmIds,
        targetId: id,
      });
      if (scopeErr) return scopeErr;
    }

    let hash: string | null = null;
    if (password) hash = await bcrypt.hash(String(password), 10);

    const updated = await this.repository.updateWithFarms({
      id,
      nombre: nombre != null ? String(nombre) : undefined,
      activo: typeof activo === 'boolean' ? activo : undefined,
      passwordHash: hash,
      farmIds: Array.isArray(granja_ids) ? (granja_ids as number[]) : undefined,
    });
    const full = await this.repository.findWithFarms(id);
    let accion = 'editar';
    if (typeof activo === 'boolean') {
      if (activo === false && target.activo !== false) accion = 'eliminar';
      else if (activo === true && target.activo === false) accion = 'reactivar';
    }
    await this.audit.write({
      userId: user.id,
      farmId,
      accion,
      entidad: 'usuario',
      idEntidad: id,
      antes: target,
      despues: updated,
      detalle: `User updated: ${target.email}`,
    });
    return ok(full || updated);
  }
}
