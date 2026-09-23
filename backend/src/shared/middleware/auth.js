const jwt = require('jsonwebtoken');
const { getPrisma } = require('../database/prisma');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

async function loadUserFarms(req, res, next) {
  try {
    const prisma = getPrisma();

    if (req.user.rol === 'superadmin') {
      const rows = await prisma.granja.findMany({
        where: { activa: true },
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          id_especie: true,
          especie: { select: { nombre: true } },
        },
      });
      req.userFarms = rows.map((g) => ({
        id: g.id,
        nombre: g.nombre,
        id_especie: g.id_especie,
        especie: g.especie.nombre,
      }));
    } else {
      const rows = await prisma.usuarioGranja.findMany({
        where: {
          id_usuario: req.user.id,
          granja: { activa: true },
        },
        orderBy: { granja: { nombre: 'asc' } },
        select: {
          granja: {
            select: {
              id: true,
              nombre: true,
              id_especie: true,
              especie: { select: { nombre: true } },
            },
          },
        },
      });
      req.userFarms = rows.map(({ granja: g }) => ({
        id: g.id,
        nombre: g.nombre,
        id_especie: g.id_especie,
        especie: g.especie.nombre,
      }));
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function requireSpecies(req, res, next) {
  const speciesId = Number(
    req.headers['x-species-id'] || req.query.species_id
  );
  if (!speciesId) {
    return res.status(400).json({
      error: 'Provide the active species (header x-species-id)',
    });
  }
  try {
    const prisma = getPrisma();
    const species = await prisma.especie.findFirst({
      where: { id: speciesId, activo: true },
      select: { id: true, nombre: true },
    });
    if (!species) return res.status(404).json({ error: 'Species not found' });
    req.speciesId = speciesId;
    req.species = species;
    return next();
  } catch (err) {
    return next(err);
  }
}

async function requireFarmAccess(req, res, next) {
  const farmId = Number(
    req.headers['x-farm-id'] || req.query.farm_id || req.body?.farm_id
  );
  if (!farmId) {
    return res.status(400).json({ error: 'Provide the active farm (header x-farm-id)' });
  }
  const ok =
    req.user.rol === 'superadmin' ||
    (req.userFarms || []).some((g) => Number(g.id) === farmId);
  if (!ok) return res.status(403).json({ error: 'Farm is outside your scope' });

  try {
    const prisma = getPrisma();
    const farm = await prisma.granja.findUnique({
      where: { id: farmId },
      select: { activa: true, id_especie: true },
    });
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    if (req.speciesId && Number(farm.id_especie) !== Number(req.speciesId)) {
      return res.status(403).json({ error: 'Farm does not belong to the active species' });
    }
    const write = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    if (write && farm.activa === false) {
      return res.status(403).json({
        error: 'Farm is deactivated and does not accept new records',
      });
    }
    req.farmId = farmId;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  requireSpecies,
  authRequired,
  requireRoles,
  loadUserFarms,
  requireFarmAccess,
};
