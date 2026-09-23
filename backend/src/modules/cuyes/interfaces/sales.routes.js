const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess, requireRoles } = require('../../../shared/middleware/auth');

function createSalesRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canWrite = requireRoles('superadmin', 'admin', 'encargado', 'auxiliar');

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

  router.get(
    '/discards',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.listDiscards(req.farmId));
    })
  );

  router.post(
    '/discards',
    canWrite,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.sellDiscards({
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

  return router;
}

module.exports = { createSalesRoutes };
