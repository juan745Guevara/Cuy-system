const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createAnimalsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.list({ farmId: req.farmId, query: req.query }));
    })
  );

  router.get(
    '/buscar/:codigo',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.findByCode({
          farmId: req.farmId,
          codigoRaw: req.params.codigo,
        })
      );
    })
  );

  router.post(
    '/',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.create({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.patch(
    '/:id',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.update({
          farmId: req.farmId,
          userId: req.user.id,
          id: Number(req.params.id),
          body: req.body,
        })
      );
    })
  );

  return router;
}

module.exports = { createAnimalsRoutes };
