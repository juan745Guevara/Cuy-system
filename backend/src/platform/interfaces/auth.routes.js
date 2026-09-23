const express = require('express');
const rateLimit = require('express-rate-limit');
const { asyncHandler } = require('../../shared/utils/helpers');
const { sendResult } = require('../../shared/kernel/sendResult');
const { authRequired, loadUserFarms } = require('../../shared/middleware/auth');

function createAuthRoutes(service) {
  const router = express.Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
  });

  router.post(
    '/login',
    loginLimiter,
    asyncHandler(async (req, res) => {
      sendResult(res, await service.login(req.body || {}));
    })
  );

  router.post(
    '/logout',
    authRequired,
    asyncHandler(async (req, res) => {
      sendResult(res, await service.logout(req.user.id));
    })
  );

  router.get(
    '/me',
    authRequired,
    loadUserFarms,
    asyncHandler(async (req, res) => {
      sendResult(res, service.me({ user: req.user, granjas: req.userFarms }));
    })
  );

  return router;
}

module.exports = { createAuthRoutes };
