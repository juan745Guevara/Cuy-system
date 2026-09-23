const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createCagesRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado');

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.list({ farmId: req.farmId, query: req.query }));
    })
  );

  router.get(
    '/occupancy',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getOccupancy(req.farmId));
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

  router.patch(
    '/:id/deactivate',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.deactivate({
          farmId: req.farmId,
          userId: req.user.id,
          id: Number(req.params.id),
        })
      );
    })
  );

  router.get(
    '/:id/animales',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getAnimals({
          farmId: req.farmId,
          jaulaId: req.params.id,
        })
      );
    })
  );

  return router;
}

module.exports = { createCagesRoutes };
