const { 
  Tenant, 
  TenantSubscription, 
  PlatformPayment, 
  PlatformWebhookEvent, 
  SubscriptionPlan, 
  Student, 
  Teacher, 
  PlatformAdmin,
  PlatformAuditLog, 
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const paymentGateway = require('./paymentGatewayService');
const { logPlatformAudit } = require('./auditService');
const { invalidateDashboardCache } = require('../utils/cacheHelper');

// Helper to resolve a valid platform admin ID for automated background/webhook events
const getSystemAdminId = async (transaction = undefined) => {
  const admin = await PlatformAdmin.findOne({ transaction });
  if (admin) return admin.id;
  const fallback = await PlatformAdmin.create({
    name: 'System Admin',
    email: `system-${Date.now()}@platform.com`,
    passwordHash: 'placeholder',
    status: 'ACTIVE',
  }, { transaction });
  return fallback.id;
};

/**
 * Returns structured billing and quota usage overview for an authenticated tenant
 */
const getTenantBillingOverview = async (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Find or create TenantSubscription record
  let [subscription] = await TenantSubscription.findOrCreate({
    where: { tenantId },
    defaults: {
      tenantId,
      planType: tenant.planType || 'FREE',
      status: 'ACTIVE',
    },
  });

  // Load canonical plan specifications
  const plan = await SubscriptionPlan.findOne({ where: { name: tenant.planType || 'FREE' } });

  // Load usage statistics
  const activeStudentsCount = await Student.count({ where: { tenantId, status: 'ACTIVE' } });
  const activeTeachersCount = await Teacher.count({ where: { tenantId, status: 'ACTIVE' } });

  // Load past platform billing invoices/payments
  const recentPayments = await PlatformPayment.findAll({
    where: { tenantId },
    order: [['createdAt', 'DESC']],
    limit: 10,
  });

  return {
    tenant: {
      id: tenant.id,
      schoolName: tenant.schoolName,
      slug: tenant.slug,
      planType: tenant.planType,
      status: tenant.status,
    },
    subscription: {
      id: subscription.id,
      planType: subscription.planType,
      status: subscription.status,
      gatewaySubscriptionId: subscription.gatewaySubscriptionId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    },
    plan: plan ? {
      name: plan.name,
      price: parseFloat(plan.price),
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      features: plan.featuresJson ? JSON.parse(plan.featuresJson) : {},
    } : null,
    usage: {
      students: {
        current: activeStudentsCount,
        limit: plan ? plan.maxStudents : 10,
        percentage: plan && plan.maxStudents < 999999 ? Math.min(Math.round((activeStudentsCount / plan.maxStudents) * 100), 100) : 0,
      },
      teachers: {
        current: activeTeachersCount,
        limit: plan ? plan.maxTeachers : 5,
        percentage: plan && plan.maxTeachers < 999999 ? Math.min(Math.round((activeTeachersCount / plan.maxTeachers) * 100), 100) : 0,
      },
    },
    payments: recentPayments,
    razorpayPublicKey: paymentGateway.getPublicKey(),
  };
};

/**
 * Initiates Razorpay recurring subscription checkout
 */
const initiateSubscriptionCheckout = async (tenantId, planType, userEmail) => {
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  if (!['STANDARD', 'PREMIUM'].includes(planType)) {
    throw new Error('Invalid plan selection. Upgrades are available for STANDARD and PREMIUM tiers.');
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new Error('Tenant school not found');
  }

  const plan = await SubscriptionPlan.findOne({ where: { name: planType } });
  if (!plan) {
    throw new Error(`Plan specification for [${planType}] not found in database.`);
  }

  // Create subscription with Razorpay
  const rzpSub = await paymentGateway.createSubscription({
    planType,
    tenantId,
    customerEmail: userEmail || tenant.contactEmail,
    amount: parseFloat(plan.price),
    currency: 'INR',
  });

  return {
    subscriptionId: rzpSub.id,
    orderId: rzpSub.order_id || rzpSub.id,
    planType,
    planName: plan.name,
    amount: parseFloat(plan.price),
    currency: 'INR',
    shortUrl: rzpSub.short_url,
    keyId: paymentGateway.getPublicKey(),
  };
};

/**
 * Cancels a tenant subscription
 */
const cancelTenantSubscription = async (tenantId, adminUserId) => {
  const subscription = await TenantSubscription.findOne({ where: { tenantId } });
  if (!subscription) {
    throw new Error('No subscription found for this school');
  }

  if (subscription.gatewaySubscriptionId) {
    try {
      await paymentGateway.cancelSubscription(subscription.gatewaySubscriptionId, false);
    } catch (err) {
      console.warn('Razorpay cancel error:', err.message);
    }
  }

  subscription.status = 'CANCELED';
  await subscription.save();

  // Downgrade tenant to FREE
  const tenant = await Tenant.findByPk(tenantId);
  if (tenant) {
    tenant.planType = 'FREE';
    await tenant.save();
  }

  await logPlatformAudit(null, 'CANCEL_SUBSCRIPTION', tenantId, {
    previousPlan: subscription.planType,
    gatewaySubscriptionId: subscription.gatewaySubscriptionId,
    cancelledByUserId: adminUserId || null,
  });

  await invalidateDashboardCache(tenantId);

  return { success: true, message: 'Subscription cancelled successfully and downgraded to FREE tier.' };
};

/**
 * Process incoming Razorpay webhook event with signature verification and atomic idempotency
 */
const processWebhookEvent = async (rawBody, signatureHeader) => {
  // 1. Cryptographic HMAC Signature Verification
  const isValid = paymentGateway.verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValid) {
    const err = new Error('Invalid Razorpay webhook signature');
    err.status = 400;
    throw err;
  }

  const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
  const eventType = payload.event;
  const eventId = payload.event_id || `evt_${payload.created_at || Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 2. Idempotency Check: Don't reprocess already processed events
  const existingEvent = await PlatformWebhookEvent.findOne({ where: { gatewayEventId: eventId } });
  if (existingEvent) {
    return { status: 'ALREADY_PROCESSED', eventId, eventType };
  }

  const transaction = await sequelize.transaction();
  try {
    const subEntity = payload.payload?.subscription?.entity;
    const payEntity = payload.payload?.payment?.entity;

    // Resolve tenantId from notes or existing subscription record
    let tenantId = subEntity?.notes?.tenantId || payEntity?.notes?.tenantId;
    let targetPlanType = subEntity?.notes?.planType || payEntity?.notes?.planType;

    if (!tenantId && subEntity?.id) {
      const existingSub = await TenantSubscription.findOne({
        where: { gatewaySubscriptionId: subEntity.id },
        transaction,
      });
      if (existingSub) {
        tenantId = existingSub.tenantId;
        targetPlanType = targetPlanType || existingSub.planType;
      }
    }

    if (tenantId) {
      if (eventType === 'subscription.authenticated' || eventType === 'subscription.activated' || eventType === 'subscription.charged' || eventType === 'payment.captured' || eventType === 'order.paid') {
        const planName = targetPlanType || 'STANDARD';
        const planRecord = await SubscriptionPlan.findOne({ where: { name: planName }, transaction });

        // Upsert TenantSubscription
        let sub = await TenantSubscription.findOne({ where: { tenantId }, transaction });
        if (!sub) {
          sub = await TenantSubscription.create({
            tenantId,
            planId: planRecord?.id || null,
            planType: planName,
            gatewaySubscriptionId: subEntity?.id || null,
            gatewayCustomerId: subEntity?.customer_id || payEntity?.customer_id || null,
            status: 'ACTIVE',
            currentPeriodStart: subEntity?.current_start ? new Date(subEntity.current_start * 1000) : new Date(),
            currentPeriodEnd: subEntity?.current_end ? new Date(subEntity.current_end * 1000) : new Date(Date.now() + 30 * 86400000),
          }, { transaction });
        } else {
          sub.planType = planName;
          sub.planId = planRecord?.id || sub.planId;
          sub.status = 'ACTIVE';
          if (subEntity?.id) sub.gatewaySubscriptionId = subEntity.id;
          if (subEntity?.customer_id || payEntity?.customer_id) {
            sub.gatewayCustomerId = subEntity?.customer_id || payEntity?.customer_id;
          }
          if (subEntity?.current_start) sub.currentPeriodStart = new Date(subEntity.current_start * 1000);
          if (subEntity?.current_end) sub.currentPeriodEnd = new Date(subEntity.current_end * 1000);
          await sub.save({ transaction });
        }

        // Synchronize Tenant.planType and ensure status is ACTIVE
        const tenant = await Tenant.findByPk(tenantId, { transaction });
        if (tenant) {
          tenant.planType = planName;
          tenant.status = 'ACTIVE';
          await tenant.save({ transaction });
        }

        // Create PlatformPayment record if payment entity present
        if (payEntity && payEntity.id) {
          const paymentAmount = payEntity.amount ? (parseFloat(payEntity.amount) / 100) : (planRecord ? parseFloat(planRecord.price) : 0);
          await PlatformPayment.findOrCreate({
            where: { gatewayPaymentId: payEntity.id },
            defaults: {
              tenantId,
              subscriptionId: sub.id,
              gatewayPaymentId: payEntity.id,
              gatewayOrderId: payEntity.order_id || null,
              gatewayInvoiceId: payEntity.invoice_id || null,
              amount: paymentAmount,
              currency: payEntity.currency || 'INR',
              status: 'SUCCEEDED',
              paymentMethod: payEntity.method || 'card',
              paidAt: new Date(),
            },
            transaction,
          });
        }

        const adminId = await getSystemAdminId(transaction);

        await PlatformAuditLog.create({
          adminId,
          action: 'PLATFORM_SUBSCRIPTION_ACTIVATED',
          tenantId,
          metadata: JSON.stringify({
            planType: planName,
            gatewaySubscriptionId: subEntity?.id,
            gatewayPaymentId: payEntity?.id,
            eventType,
          }),
        }, { transaction });

      } else if (eventType === 'subscription.pending' || eventType === 'payment.failed') {
        const sub = await TenantSubscription.findOne({ where: { tenantId }, transaction });
        if (sub) {
          sub.status = 'PAST_DUE';
          await sub.save({ transaction });
        }

        if (payEntity && payEntity.id) {
          const paymentAmount = payEntity.amount ? (parseFloat(payEntity.amount) / 100) : 0;
          await PlatformPayment.findOrCreate({
            where: { gatewayPaymentId: payEntity.id },
            defaults: {
              tenantId,
              subscriptionId: sub?.id || null,
              gatewayPaymentId: payEntity.id,
              gatewayOrderId: payEntity.order_id || null,
              amount: paymentAmount,
              currency: payEntity.currency || 'INR',
              status: 'FAILED',
              paymentMethod: payEntity.method || null,
              paidAt: new Date(),
            },
            transaction,
          });
        }

        const adminId = await getSystemAdminId(transaction);
        await PlatformAuditLog.create({
          adminId,
          action: 'PLATFORM_PAYMENT_FAILED',
          tenantId,
          metadata: JSON.stringify({ eventType, gatewayPaymentId: payEntity?.id }),
        }, { transaction });

      } else if (eventType === 'subscription.halted' || eventType === 'subscription.cancelled') {
        const sub = await TenantSubscription.findOne({ where: { tenantId }, transaction });
        if (sub) {
          sub.status = eventType === 'subscription.cancelled' ? 'CANCELED' : 'PAST_DUE';
          await sub.save({ transaction });
        }

        if (eventType === 'subscription.cancelled') {
          const tenant = await Tenant.findByPk(tenantId, { transaction });
          if (tenant) {
            tenant.planType = 'FREE';
            await tenant.save({ transaction });
          }
        }

        const adminId = await getSystemAdminId(transaction);
        await PlatformAuditLog.create({
          adminId,
          action: 'PLATFORM_SUBSCRIPTION_CANCELED',
          tenantId,
          metadata: JSON.stringify({ eventType }),
        }, { transaction });
      }
    }

    // 3. Mark Webhook Event as processed for idempotency
    await PlatformWebhookEvent.create({
      gatewayEventId: eventId,
      eventType,
      status: 'PROCESSED',
      processedAt: new Date(),
    }, { transaction });

    await transaction.commit();

    // Cache invalidation & Real-time notice
    if (tenantId) {
      await invalidateDashboardCache(tenantId);
      try {
        const { getIO } = require('../config/socket');
        const io = getIO();
        io.to(`tenant:${tenantId}:role:School Admin`).emit('SUBSCRIPTION_STATUS_CHANGED', {
          tenantId,
          planType: targetPlanType || 'STANDARD',
          eventType,
        });
      } catch (_) {
        // Non-critical if socket not active
      }
    }

    return { status: 'PROCESSED', eventId, eventType };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Super Admin metrics: aggregated platform SaaS revenue, plan breakdown, and payment transactions
 */
const getSuperAdminBillingMetrics = async () => {
  const tenants = await Tenant.findAll({
    include: [{ model: TenantSubscription, as: 'subscription' }],
    order: [['createdAt', 'DESC']],
  });

  const plans = await SubscriptionPlan.findAll();
  const planPriceMap = {};
  plans.forEach(p => {
    planPriceMap[p.name] = parseFloat(p.price) || 0;
  });

  // Calculate real metrics from active tenants and subscriptions
  let totalActiveSubscriptions = 0;
  let totalPastDueSubscriptions = 0;
  let estimatedMonthlyRevenue = 0;
  const distribution = { FREE: 0, STANDARD: 0, PREMIUM: 0 };

  tenants.forEach(t => {
    const tier = t.planType || 'FREE';
    distribution[tier] = (distribution[tier] || 0) + 1;
    if (t.status === 'ACTIVE') {
      if (tier !== 'FREE') {
        totalActiveSubscriptions += 1;
        estimatedMonthlyRevenue += (planPriceMap[tier] || 0);
      }
    }
    if (t.subscription && t.subscription.status === 'PAST_DUE') {
      totalPastDueSubscriptions += 1;
    }
  });

  // Load recent platform payment transactions
  const transactions = await PlatformPayment.findAll({
    limit: 20,
    order: [['createdAt', 'DESC']],
    include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'schoolName', 'slug'] }],
  });

  const totalCollectedRevenue = await PlatformPayment.sum('amount', {
    where: { status: 'SUCCEEDED' },
  }) || 0;

  return {
    metrics: {
      totalTenants: tenants.length,
      totalActiveSubscriptions,
      totalPastDueSubscriptions,
      estimatedMonthlyRevenue,
      totalCollectedRevenue: parseFloat(totalCollectedRevenue),
      distribution,
    },
    transactions,
  };
};

module.exports = {
  getTenantBillingOverview,
  initiateSubscriptionCheckout,
  cancelTenantSubscription,
  processWebhookEvent,
  getSuperAdminBillingMetrics,
};
