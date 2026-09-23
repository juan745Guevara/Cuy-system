const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createTreatmentsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor');

  router.post(
    '/',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.create({
          farmId: req.farmId,
          userId: req.user.id,
          user: req.user,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.list({ farmId: req.farmId, query: req.query }));
    })
  );

  router.get(
    '/in-progress',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.listActive({ farmId: req.farmId, query: req.query })
      );
    })
  );

  router.patch(
    '/:id/complete',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.complete({
          farmId: req.farmId,
          userId: req.user.id,
          id: req.params.id,
          body: req.body,
        })
      );
    })
  );

  return router;
}

module.exports = { createTreatmentsRoutes };
