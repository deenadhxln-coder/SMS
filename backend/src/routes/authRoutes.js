const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { verifyTenant } = require('../middleware/tenantGuard');
const { authLimiter, loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, verifyTenant, getMe);

module.exports = router;

