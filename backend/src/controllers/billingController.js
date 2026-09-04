const billingService = require('../services/billingService');

// @desc    Get current tenant subscription & plan usage
// @route   GET /api/billing/subscription
// @access  Private (School Admin)
const getSubscription = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const billingData = await billingService.getTenantBillingOverview(tenantId);
    return res.json({ success: true, ...billingData });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Razorpay subscription checkout
// @route   POST /api/billing/create-subscription
// @access  Private (School Admin)
const createSubscription = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { planType } = req.body;
    if (!planType || !['STANDARD', 'PREMIUM'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selection. Please choose STANDARD or PREMIUM.',
      });
    }

    const session = await billingService.initiateSubscriptionCheckout(
      tenantId,
      planType,
      req.user?.email
    );

    return res.json({
      success: true,
      message: `Razorpay subscription initialized for ${planType} plan.`,
      ...session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel tenant subscription
// @route   POST /api/billing/cancel
// @access  Private (School Admin)
const cancelSubscription = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || (req.tenant ? req.tenant.id : null);
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const result = await billingService.cancelTenantSubscription(tenantId, req.user?.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Receive and verify Razorpay webhook events
// @route   POST /api/billing/webhook
// @access  Public (Signature Verified)
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay signature header' });
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const result = await billingService.processWebhookEvent(rawBody, signature);

    return res.status(200).json({
      success: true,
      received: true,
      ...result,
    });
  } catch (error) {
    if (error.status === 400 || error.message.includes('signature')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getSubscription,
  createSubscription,
  cancelSubscription,
  handleWebhook,
};
