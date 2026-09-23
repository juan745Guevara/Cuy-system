const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess } = require('../../../shared/middleware/auth');

function createInventoryRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);

  router.get(
    '/population',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getPopulation({ farmId: req.farmId, query: req.query }));
    })
  );

  router.get(
    '/monthly-summary',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getMonthlySummary({ farmId: req.farmId, query: req.query })
      );
    })
  );

  router.get(
    '/by-area',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getByArea(req.farmId));
    })
  );

  router.get(
    '/by-category-area',
    asyncHandler(async (req, res) => {
      sendResult(res, await service.getByCategoryArea(req.farmId));
    })
  );

  router.get(
    '/consolidated',
    asyncHandler(async (req, res) => {
      sendResult(
        res,
        await service.getConsolidated({ userFarms: req.userFarms, query: req.query })
      );
    })
  );

  return router;
}

module.exports = { createInventoryRoutes };
