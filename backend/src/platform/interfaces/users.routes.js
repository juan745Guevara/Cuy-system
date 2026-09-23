const express = require('express');
const { asyncHandler } = require('../../shared/utils/helpers');
const { sendResult } = require('../../shared/kernel/sendResult');
const { authRequired, requireRoles, loadUserFarms } = require('../../shared/middleware/auth');

function createUsersRoutes(service) {
  const router = express.Router();

  router.post(
    '/',
    authRequired,
    loadUserFarms,
    requireRoles('superadmin', 'admin'),
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.create({
          user: req.user,
          farmId: req.farmId,
          body: req.body,
        })
      );
    })
  );

  router.get(
    '/',
    authRequired,
    requireRoles('superadmin', 'admin'),
    asyncHandler(async (req, res) => {
      sendResult(res, await service.list(req.user));
    })
  );

  router.patch(
    '/:id',
    authRequired,
    loadUserFarms,
    requireRoles('superadmin', 'admin'),
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.update({
          user: req.user,
          farmId: req.farmId,
          id: Number(req.params.id),
          body: req.body,
        })
      );
    })
  );

  return router;
}

module.exports = { createUsersRoutes };
