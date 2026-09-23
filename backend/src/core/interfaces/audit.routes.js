const express = require('express');
const { asyncHandler } = require('../../shared/utils/helpers');
const { sendResult } = require('../../shared/kernel/sendResult');
const {
  authRequired,
  loadUserFarms,
  requireFarmAccess,
  requireRoles,
} = require('../../shared/middleware/auth');

function createAuditRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);
  const canAudit = requireRoles('superadmin', 'admin', 'supervisor', 'encargado');

  router.get(
    '/',
    canAudit,
    asyncHandler(async (req, res) => {
      sendResult(res, await service.list(req.farmId, req.query));
    })
  );

  router.post(
    '/void/mortality/:id',
    canAudit,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.voidMortality({
          farmId: req.farmId,
          userId: req.user.id,
          id: req.params.id,
          body: req.body,
        })
      );
    })
  );

  router.post(
    '/void/sale/:id',
    canAudit,
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.voidSale({
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

module.exports = { createAuditRoutes };
