const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createCatalogsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canAdmin = requireRoles('superadmin', 'admin');

  router.get(
    '/breeds',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.listBreeds(req.farmId));
    })
  );

  router.post(
    '/breeds',
    canAdmin,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.createBreed({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/categories',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.listCategories(req.farmId));
    })
  );

  router.post(
    '/categories',
    canAdmin,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.createCategory({
          farmId: req.farmId,
          userId: req.user.id,
          body: req.body,
        })
      );
    })
  );

  router.patch(
    '/breeds/:id/deactivate',
    canAdmin,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.deactivateRaza({
          farmId: req.farmId,
          userId: req.user.id,
          id: req.params.id,
        })
      );
    })
  );

  router.patch(
    '/categories/:id/deactivate',
    canAdmin,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.deactivateCategoria({
          farmId: req.farmId,
          userId: req.user.id,
          id: req.params.id,
        })
      );
    })
  );

  router.get(
    '/transitions',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getTransitions(req.farmId));
    })
  );

  return router;
}

module.exports = { createCatalogsRoutes };
