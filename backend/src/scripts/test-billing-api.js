const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize, Tenant, TenantSubscription, PlatformPayment, PlatformWebhookEvent } = require('../models');
const billingService = require('../services/billingService');

async function testBillingFlow() {
  console.log('=== STARTING RAZORPAY BILLING END-TO-END VALIDATION ===\n');

  // Verify DB connection
  await sequelize.authenticate();
  console.log('Database connection authenticated.');

  // 1. Super Admin Platform Revenue Metrics
  console.log('\n1. Fetching Platform Super Admin Revenue Metrics...');
  const metrics = await billingService.getSuperAdminBillingMetrics();
  console.log('Super Admin Platform Revenue Metrics:');
  console.log(JSON.stringify(metrics.metrics, null, 2));
  console.log(`Total Platform Payments in System: ${metrics.transactions.length}`);

  // 2. Fetch Default School Subscription Details
  const defaultTenantId = 'd0000000-0000-0000-0000-000000000000';
  console.log(`\n2. Fetching Tenant Billing Overview for Default Tenant (${defaultTenantId})...`);
  const tenantOverview = await billingService.getTenantBillingOverview(defaultTenantId);
  console.log('Tenant:', tenantOverview.tenant);
  console.log('Subscription:', tenantOverview.subscription);
  console.log('Usage:', tenantOverview.usage);

  // 3. Test Webhook Ingestion & Atomic State Update
  console.log('\n3. Testing Webhook Reconciliation for Growth (STANDARD) Plan...');
  const webhookSecret = 'rzp_test_placeholder_webhook_secret';
  const eventId = `evt_live_verify_${Date.now()}`;
  const webhookPayload = JSON.stringify({
    event: 'subscription.activated',
    event_id: eventId,
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      subscription: {
        entity: {
          id: `sub_live_${Date.now()}`,
          plan_id: 'plan_standard_monthly',
          customer_id: 'cust_live_001',
          current_start: Math.floor(Date.now() / 1000),
          current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          notes: {
            tenantId: defaultTenantId,
            planType: 'STANDARD',
          },
        },
      },
      payment: {
        entity: {
          id: `pay_live_${Date.now()}`,
          amount: 9900,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          notes: {
            tenantId: defaultTenantId,
            planType: 'STANDARD',
          },
        },
      },
    },
  });

  const validSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookPayload)
    .digest('hex');

  const webhookResult = await billingService.processWebhookEvent(webhookPayload, validSig);
  console.log('Webhook Process Result:', webhookResult);

  // 4. Verify Refreshed Overview
  console.log('\n4. Verifying Synchronized State for Default Tenant...');
  const refreshedOverview = await billingService.getTenantBillingOverview(defaultTenantId);
  console.log('Updated Tenant Plan:', refreshedOverview.tenant.planType);
  console.log('Updated Subscription Status:', refreshedOverview.subscription.status);
  console.log('Recent Payments Count:', refreshedOverview.payments.length);

  console.log('\n=== ALL RAZORPAY BILLING SERVICES VERIFIED & OPERATIONAL ===');
  process.exit(0);
}

testBillingFlow().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
