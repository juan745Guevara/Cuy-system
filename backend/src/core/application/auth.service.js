const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ok, fail } = require('../../shared/kernel/ServiceResult');

function createAuthService({ repository }) {
  return {
    async login({ email, password }) {
      if (!email || !password) {
        return fail('Email and password are required');
      }

      const user = await repository.findUserByEmail(email);
      if (!user || !user.activo) {
        return fail('Invalid credentials', 401);
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return fail('Invalid credentials', 401);

      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      const granjas =
        user.rol === 'superadmin'
          ? await repository.findGranjasForSuperadmin()
          : await repository.findGranjasForUser(user.id);

      await repository.logLogin(user.id, user.email);

      return ok({
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
        granjas,
      });
    },

    async logout(userId) {
      await repository.logLogout(userId);
      return ok({ ok: true });
    },

    me({ user, granjas }) {
      return ok({
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
        granjas,
      });
    },
  };
}

module.exports = { createAuthService };
