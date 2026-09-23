const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createWeighingsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor');
  const canConfig = requireRoles('superadmin', 'admin', 'encargado');

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

  router.post(
    '/batch',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.createBatch({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/animal/:id_animal',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.animalTrend({
          farmId: req.farmId,
          animalId: req.params.id_animal,
        })
      );
    })
  );

  router.get(
    '/average',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getAverage({ farmId: req.farmId, query: req.query })
      );
    })
  );

  router.get(
    '/ranges',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getRanges(req.farmId));
    })
  );

  router.put(
    '/ranges',
    canConfig,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.updateRangos({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body || {},
        })
      );
    })
  );

  return router;
}

module.exports = { createWeighingsRoutes };
