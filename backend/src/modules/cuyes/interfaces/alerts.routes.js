const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../../../shared/middleware/auth');

function createAlertsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canAdmin = requireRoles('superadmin', 'admin', 'supervisor');

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
      sendResult(res, await service.list(req.farmId));
    })
  );

  router.post(
    '/discard',
    requireRoles('superadmin', 'admin', 'encargado', 'supervisor', 'auxiliar'),
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.discard({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  return router;
}

module.exports = { createAlertsRoutes };
