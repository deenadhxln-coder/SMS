const crypto = require('crypto');
const config = require('../config/config');

let RazorpayInstance = null;

// Lazy initialization of Razorpay SDK instance
const getRazorpayClient = () => {
  if (!RazorpayInstance) {
    const isMock = config.nodeEnv === 'test' || !config.razorpay.keyId || !config.razorpay.keySecret || config.razorpay.keyId === 'rzp_test_placeholder_key_id';
    if (!isMock) {
      try {
        const Razorpay = require('razorpay');
        RazorpayInstance = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret,
        });
      } catch (err) {
        console.warn('[PAYMENT GATEWAY WARNING] Failed to initialize Razorpay SDK:', err.message);
      }
    }

    if (!RazorpayInstance) {
      // Robust mock adapter for tests & offline sandbox
      RazorpayInstance = {
        subscriptions: {
          create: async (params) => ({
            id: `sub_test_${Date.now().toString().slice(-6)}_${Math.floor(1000 + Math.random() * 9000)}`,
            plan_id: params.plan_id,
            status: 'created',
            current_start: Math.floor(Date.now() / 1000),
            current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
            short_url: `https://rzp.io/i/test_sub_${Date.now().toString().slice(-6)}`,
            notes: params.notes || {},
          }),
          cancel: async (subId) => ({
            id: subId,
            status: 'cancelled',
          }),
          fetch: async (subId) => ({
            id: subId,
            status: 'active',
            current_start: Math.floor(Date.now() / 1000),
            current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          }),
        },
        payments: {
          fetch: async (payId) => ({
            id: payId,
            status: 'captured',
            amount: 9900,
            currency: 'INR',
            method: 'card',
          }),
        },
      };
    }
  }
  return RazorpayInstance;
};

// Set a custom client (useful for unit/integration tests)
const setRazorpayClient = (client) => {
  RazorpayInstance = client;
};

/**
 * Maps application plan tier to configured Razorpay plan ID
 */
const getPlanIdForTier = (planType) => {
  if (planType === 'STANDARD') {
    return config.razorpay.standardPlanId;
  }
  if (planType === 'PREMIUM') {
    return config.razorpay.premiumPlanId;
  }
  throw new Error(`Plan tier [${planType}] does not have an associated Razorpay recurring plan.`);
};

/**
 * Creates a recurring subscription session or standard plan order in Razorpay
 */
const createSubscription = async ({ planType, tenantId, customerEmail, amount = 99, currency = 'INR', totalCount = 12 }) => {
  const planId = getPlanIdForTier(planType);
  const client = getRazorpayClient();

  // Try creating native recurring subscription first
  if (client.subscriptions && typeof client.subscriptions.create === 'function') {
    try {
      const subscriptionParams = {
        plan_id: planId,
        total_count: totalCount,
        customer_notify: 1,
        notes: {
          tenantId,
          planType,
          customerEmail: customerEmail || '',
        },
      };
      const subscription = await client.subscriptions.create(subscriptionParams);
      return subscription;
    } catch (subErr) {
      console.warn(`[PAYMENT GATEWAY] Native Subscriptions API returned (${subErr.statusCode || subErr.message}). Switching to Razorpay Plan Order checkout.`);
    }
  }

  // Standard Razorpay Order Checkout (universally supported on all Razorpay accounts)
  if (client.orders && typeof client.orders.create === 'function') {
    const order = await client.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: currency || 'INR',
      receipt: `sub_${tenantId ? String(tenantId).slice(0, 8) : 'demo'}_${Date.now()}`,
      notes: {
        tenantId,
        planType,
        customerEmail: customerEmail || '',
      },
    });
    return {
      id: order.id,
      order_id: order.id,
      plan_id: planId,
      status: order.status,
      short_url: null,
      notes: order.notes,
    };
  }

  throw new Error('Razorpay client not configured.');
};

/**
 * Cancels a subscription in Razorpay
 */
const cancelSubscription = async (gatewaySubscriptionId, cancelAtCycleEnd = false) => {
  const client = getRazorpayClient();
  const result = await client.subscriptions.cancel(gatewaySubscriptionId, cancelAtCycleEnd);
  return result;
};

/**
 * Fetches subscription details from Razorpay
 */
const fetchSubscription = async (gatewaySubscriptionId) => {
  const client = getRazorpayClient();
  return await client.subscriptions.fetch(gatewaySubscriptionId);
};

/**
 * Fetches payment details from Razorpay
 */
const fetchPayment = async (gatewayPaymentId) => {
  const client = getRazorpayClient();
  return await client.payments.fetch(gatewayPaymentId);
};

/**
 * Cryptographically verifies webhook signature using HMAC-SHA256
 * @param {string|Buffer} rawBody - Raw unparsed request body buffer or string
 * @param {string} signature - x-razorpay-signature header from Razorpay
 * @param {string} secret - Webhook secret key
 */
const verifyWebhookSignature = (rawBody, signature, secret = config.razorpay.webhookSecret) => {
  if (!signature || !rawBody) {
    return false;
  }

  const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');

  // Constant-time buffer comparison to prevent timing attacks
  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    return false;
  }
};

/**
 * Returns public Razorpay key ID for client checkout initialization
 */
const getPublicKey = () => config.razorpay.keyId;

module.exports = {
  getRazorpayClient,
  setRazorpayClient,
  getPlanIdForTier,
  createSubscription,
  cancelSubscription,
  fetchSubscription,
  fetchPayment,
  verifyWebhookSignature,
  getPublicKey,
};
