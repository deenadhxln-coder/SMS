const express = require('express');
const router = express.Router();
const { 
  getSubscription, 
  createSubscription, 
  cancelSubscription, 
  handleWebhook 
} = require('../controllers/billingController');
const { protect } = require('../middleware/auth');
const { verifyTenant } = require('../middleware/tenantGuard');
const { authorize } = require('../middleware/roleGuard');

// Public Webhook Endpoint (Cryptographically Verified via HMAC-SHA256)
router.post('/webhook', handleWebhook);

// Protected School Admin Billing Endpoints
router.get(
  '/subscription',
  protect,
  verifyTenant,
  authorize('School Admin', 'Super Admin'),
  getSubscription
);

router.post(
  '/create-subscription',
  protect,
  verifyTenant,
  authorize('School Admin', 'Super Admin'),
  createSubscription
);

router.post(
  '/cancel',
  protect,
  verifyTenant,
  authorize('School Admin', 'Super Admin'),
  cancelSubscription
);

module.exports = router;
