const express = require('express');
const { asyncHandler } = require('../../shared/utils/helpers');
const { sendResult } = require('../../shared/kernel/sendResult');
const { authRequired, requireRoles, loadUserFarms } = require('../../shared/middleware/auth');

function createFarmsRoutes(service) {
  const router = express.Router();

  router.get(
    '/',
    authRequired,
    loadUserFarms,
    asyncHandler(async (req, res) => {
      sendResult(res, service.list(req.userFarms));
    })
  );

  router.post(
    '/',
    authRequired,
    requireRoles('superadmin'),
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.create({
          userId: req.user.id,
          farmId: req.farmId,
          body: req.body,
        })
      );
    })
  );

  router.patch(
    '/:id/deactivate',
    authRequired,
    requireRoles('superadmin'),
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.deactivate({
          userId: req.user.id,
          farmId: req.farmId,
          id: req.params.id,
        })
      );
    })
  );

  router.put(
    '/:id/users',
    authRequired,
    requireRoles('superadmin', 'admin'),
    loadUserFarms,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.assignUsers({
          userId: req.user.id,
          userRol: req.user.rol,
          userFarms: req.userFarms,
          farmId: Number(req.params.id),
          usuario_ids: req.body?.usuario_ids,
        })
      );
    })
  );

  return router;
}

module.exports = { createFarmsRoutes };
