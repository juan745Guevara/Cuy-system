const express = require('express');
const { asyncHandler } = require('../../shared/utils/helpers');
const { sendResult } = require('../../shared/kernel/sendResult');
const { authRequired, loadUserFarms } = require('../../shared/middleware/auth');

function createSpeciesRoutes(service) {
  const router = express.Router();

  router.get(
    '/',
    authRequired,
    loadUserFarms,
    asyncHandler(async (req, res) => {
      if (req.user.rol === 'superadmin') {
        sendResult(res, await service.list());
      } else {
        sendResult(res, service.listForUser(req.userFarms));
      }
    })
  );

  return router;
}

module.exports = { createSpeciesRoutes };
