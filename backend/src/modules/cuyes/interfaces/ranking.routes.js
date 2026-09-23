const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../../../shared/middleware/auth');

function createRankingRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canAdmin = requireRoles('superadmin', 'admin', 'supervisor');
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'supervisor');

  router.get(
    '/config',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getConfig(req.farmId));
    })
  );

  router.put(
    '/config',
    canAdmin,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.updateConfig({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.list({
          farmId: req.farmId,
          query: req.query,
        })
      );
    })
  );

  router.post(
    '/:id_animal/mark',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.mark({
          farmId: req.farmId,
          userId: req.user.id,
          animalId: req.params.id_animal,
          body: req.body,
        })
      );
    })
  );

  return router;
}

module.exports = { createRankingRoutes };
