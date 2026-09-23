const express = require('express');
const { asyncHandler } = require('../../../shared/utils/helpers');
const { sendResult } = require('../../../shared/kernel/sendResult');
const { authRequired, loadUserFarms, requireFarmAccess } = require('../../../shared/middleware/auth');

function sendExport(res, result) {
  if (!result.ok) return sendResult(res, result);
  const { buffer, filename, contentType } = result.data;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}

function createReportsRoutes(service) {
  const router = express.Router();
  router.use(authRequired, loadUserFarms, requireFarmAccess);

  router.get(
    '/females',
    asyncHandler(async (req, res) => {
      sendExport(
        res,
        await service.exportFemales({ farmId: req.farmId, query: req.query })
      );
    })
  );

  router.get(
    '/males',
    asyncHandler(async (req, res) => {
      sendExport(res, await service.exportMales(req.farmId));
    })
  );

  router.get(
    '/monthly-inventory',
    asyncHandler(async (req, res) => {
      sendExport(
        res,
        await service.exportMonthlyInventory({ farmId: req.farmId, query: req.query })
      );
    })
  );

  router.get(
    '/animals',
    asyncHandler(async (req, res) => {
      sendExport(
        res,
        await service.exportAnimals({ farmId: req.farmId, query: req.query })
      );
    })
  );

  router.get(
    '/consolidated',
    asyncHandler(async (req, res) => {
      sendExport(
        res,
        await service.exportConsolidated({ user: req.user, query: req.query })
      );
    })
  );

  return router;
}

module.exports = { createReportsRoutes };
