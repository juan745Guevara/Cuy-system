const bcrypt = require('bcryptjs');
const { ok, fail, fromError } = require('../../shared/kernel/ServiceResult');

const ROLE_RANK = {
  superadmin: 5,
  admin: 4,
  encargado: 3,
  supervisor: 2,
  auxiliar: 1,
};

function createUsersService({ repository, audit }) {
  async function creatorFarmIds(userId, rol) {
    if (rol === 'superadmin') return repository.findActiveFarmIds();
    return repository.findFarmIdsByUser(userId);
  }

  async function validateGranjaScope({ userId, userRol, farmIds, targetId }) {
    const allowed = await creatorFarmIds(userId, userRol);
    const requested = farmIds.map(Number);
    const invalid = requested.filter((id) => !allowed.includes(id));
    if (invalid.length) {
      await repository.logEscaladaBloqueada(userId, {
        invalid,
        requested,
        ...(targetId != null ? { target: targetId } : {}),
      });
      return fail('Cannot assign farms outside your scope', 403, {
        granjas_invalidas: invalid,
      });
    }
    return null;
  }

  return {
    async create({ user, farmId, body }) {
      const { nombre, email, password, rol, granja_ids = [] } = body || {};
      if (!nombre || !email || !password || !rol) {
        return fail('name, email, password and role are required');
      }
      if (rol === 'admin' && user.rol !== 'superadmin') {
        return fail('Only superadmin can create admin accounts', 403);
      }
      if (rol === 'superadmin') {
        return fail('Cannot create another superadmin via the API', 403);
      }
      if (user.rol === 'admin' && !['encargado', 'supervisor', 'auxiliar'].includes(rol)) {
        return fail('Admin can only create operational roles', 403);
      }
      if ((ROLE_RANK[rol] || 0) >= (ROLE_RANK[user.rol] || 0) && user.rol !== 'superadmin') {
        return fail('Cannot assign a role equal to or above your own', 403);
      }

      const scopeErr = await validateGranjaScope({
        userId: user.id,
        userRol: user.rol,
        farmIds: granja_ids,
      });
      if (scopeErr) return scopeErr;

      const hash = await bcrypt.hash(password, 10);
      try {
        const created = await repository.createWithGranjas({
          nombre,
          email: email.trim().toLowerCase(),
          passwordHash: hash,
          rol,
          createdBy: user.id,
          farmIds: granja_ids.map(Number),
        });
        await audit.write({
          userId: user.id,
          farmId,
          accion: 'crear',
          entidad: 'usuario',
          idEntidad: created.id,
          despues: created,
          detalle: `User created: ${created.email}`,
        });
        return ok(created, 201);
      } catch (err) {
        if (err.code === '23505') return fail('Email already registered', 409);
        return fromError(err);
      }
    },

    async list(user) {
      const rows = await repository.listVisible(user.rol, user.id);
      return ok(rows);
    },

    async update({ user, farmId, id, body }) {
      const { activo, granja_ids, password, nombre } = body || {};
      const target = await repository.findById(id);
      if (!target) return fail('User not found', 404);

      if (target.rol === 'superadmin') {
        return fail('Cannot edit the superadmin account', 403);
      }
      if (target.rol === 'admin' && user.rol !== 'superadmin') {
        return fail('Only superadmin can edit Admin accounts', 403);
      }
      if (user.rol === 'admin' && target.created_by !== user.id && target.id !== user.id) {
        return fail('You can only edit accounts you created', 403);
      }
      if (user.rol === 'admin' && target.id === user.id && granja_ids) {
        return fail('An admin cannot expand their own farm scope', 403);
      }

      if (granja_ids) {
        const scopeErr = await validateGranjaScope({
          userId: user.id,
          userRol: user.rol,
          farmIds: granja_ids,
          targetId: id,
        });
        if (scopeErr) return scopeErr;
      }

      let hash = null;
      if (password) hash = await bcrypt.hash(password, 10);

      const updated = await repository.updateWithGranjas({
        id,
        nombre,
        activo,
        passwordHash: hash,
        farmIds: granja_ids,
      });
      const full = await repository.findWithGranjas(id);
      await audit.write({
        userId: user.id,
        farmId,
        accion: activo === false ? 'deactivate' : 'editar',
        entidad: 'usuario',
        idEntidad: id,
        antes: target,
        despues: updated,
        detalle: `User updated: ${target.email}`,
      });
      return ok(full || updated);
    },
  };
}

module.exports = { createUsersService };
