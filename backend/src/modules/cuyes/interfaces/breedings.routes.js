const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createBreedingsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

  router.post(
    '/breeding-females',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.createBreedingFemale({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.post(
    '/breeding-males',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.createBreedingMale({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
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
        await service.createBreeding({
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

  router.patch(
    '/:id/females/:femaleId',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.updateFemaleBreedingResult({
          farmId: req.farmId,
          userId: req.user.id,
          empadreId: req.params.id,
          hembraId: req.params.femaleId,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/breeding-females/:id',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getFemaleBreedingProfile({
          farmId: req.farmId,
          hembraId: Number(req.params.id),
        })
      );
    })
  );

  router.get(
    '/cage/:id/females',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getFemalesInCage({
          farmId: req.farmId,
          jaulaId: req.params.id,
        })
      );
    })
  );

  router.get(
    '/breeding-males/:id',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getMaleBreedingProfile({
          farmId: req.farmId,
          machoId: req.params.id,
        })
      );
    })
  );

  router.post(
    '/:id/close',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.closeBreeding({
          farmId: req.farmId,
          userId: req.user.id,
          empadreId: req.params.id,
          body: req.body,
        })
      );
    })
  );

  return router;
}

module.exports = { createBreedingsRoutes };
