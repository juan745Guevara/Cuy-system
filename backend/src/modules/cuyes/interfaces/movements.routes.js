const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createMovementsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar', 'supervisor');
  const canTransfer = requireRoles('superadmin', 'admin', 'supervisor');

  router.post(
    '/relocate',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.relocate({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/destination-cages/:farm_id',
    canTransfer,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.destinationCages({
          farmId: req.farmId,
          farmIdDestino: req.params.farm_id,
          user: req.user,
          userFarms: req.userFarms,
        })
      );
    })
  );

  router.post(
    '/transfer',
    canTransfer,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.transfer({
          farmId: req.farmId,
          userId: req.user.id,
          user: req.user,
          userFarms: req.userFarms,
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
        await service.animalHistory({
          farmId: req.farmId,
          animalId: req.params.id_animal,
        })
      );
    })
  );

  router.get(
    '/cage/:cage_id',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.cageHistory({
          farmId: req.farmId,
          jaulaId: Number(req.params.cage_id),
          query: req.query,
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

  router.get(
    '/overcapacity',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.listOvercapacity(req.farmId));
    })
  );

  router.get(
    '/out-of-area',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.listOutOfArea(req.farmId));
    })
  );

  return router;
}

module.exports = { createMovementsRoutes };
