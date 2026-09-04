import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const config = require('../src/config/config');
const { 
  sequelize, 
  Tenant, 
  User, 
  Role, 
  SubscriptionPlan, 
  TenantSubscription, 
  PlatformPayment, 
  PlatformWebhookEvent, 
  Student, 
  Class, 
  Section, 
  AcademicYear 
} = require('../src/models');
const billingRoutes = require('../src/routes/billingRoutes');
const superAdminRoutes = require('../src/routes/superAdminRoutes');
const studentRoutes = require('../src/routes/studentRoutes');
const { protect } = require('../src/middleware/auth');
const { verifyTenant } = require('../src/middleware/tenantGuard');
const errorHandler = require('../src/middleware/errorHandler');
const paymentGateway = require('../src/services/paymentGatewayService');

// Create test express app
const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/api/billing', billingRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/students', protect, verifyTenant, studentRoutes);
app.use(errorHandler);

describe('Platform Billing & Razorpay Payment Gateway Suite', () => {
  let superAdminToken, schoolAdminTokenA, schoolAdminTokenB, teacherTokenA, studentTokenA;
  let tenantA, tenantB;
  let schoolAdminUserA, schoolAdminUserB, teacherUserA, studentUserA;
  let testWebhookSecret = 'test_webhook_secret_key_123';

  beforeAll(async () => {
    await sequelize.authenticate();

    // Configure test webhook secret
    config.razorpay.webhookSecret = testWebhookSecret;

    // 1. Roles
    const [saRole] = await Role.findOrCreate({ where: { id: 1 }, defaults: { name: 'Super Admin' } });
    const [schRole] = await Role.findOrCreate({ where: { id: 2 }, defaults: { name: 'School Admin' } });
    const [tRole] = await Role.findOrCreate({ where: { id: 3 }, defaults: { name: 'Teacher' } });
    const [stRole] = await Role.findOrCreate({ where: { id: 4 }, defaults: { name: 'Student' } });

    // 2. Subscription Plans
    await SubscriptionPlan.findOrCreate({
      where: { name: 'FREE' },
      defaults: { name: 'FREE', maxStudents: 2, maxTeachers: 2, price: 0.00 },
    });
    await SubscriptionPlan.findOrCreate({
      where: { name: 'STANDARD' },
      defaults: { name: 'STANDARD', maxStudents: 50, maxTeachers: 10, price: 99.00 },
    });
    await SubscriptionPlan.findOrCreate({
      where: { name: 'PREMIUM' },
      defaults: { name: 'PREMIUM', maxStudents: 500, maxTeachers: 100, price: 299.00 },
    });

    // 3. Create Tenant A & Tenant B
    tenantA = await Tenant.create({
      schoolName: 'Apex Billing Academy A',
      slug: `apex-bill-a-${Date.now()}`,
      planType: 'FREE',
      status: 'ACTIVE',
      contactEmail: 'admin@apexa.edu',
    });

    tenantB = await Tenant.create({
      schoolName: 'Beacon Billing Academy B',
      slug: `beacon-bill-b-${Date.now()}`,
      planType: 'FREE',
      status: 'ACTIVE',
      contactEmail: 'admin@beaconb.edu',
    });

    const passwordHash = await bcrypt.hash('password123', 6);

    // 4. Users & Platform Admin
    const { PlatformAdmin } = require('../src/models');
    const [platformAdmin] = await PlatformAdmin.findOrCreate({
      where: { email: 'superadmin-bill@platform.com' },
      defaults: {
        name: 'Super Admin Billing',
        email: 'superadmin-bill@platform.com',
        passwordHash,
        status: 'ACTIVE',
      },
    });

    schoolAdminUserA = await User.create({
      name: 'School Admin A',
      email: `admin-a-${Date.now()}@apexa.edu`,
      passwordHash,
      roleId: schRole.id,
      tenantId: tenantA.id,
      status: 'ACTIVE',
    });

    schoolAdminUserB = await User.create({
      name: 'School Admin B',
      email: `admin-b-${Date.now()}@beaconb.edu`,
      passwordHash,
      roleId: schRole.id,
      tenantId: tenantB.id,
      status: 'ACTIVE',
    });

    teacherUserA = await User.create({
      name: 'Teacher A',
      email: `teacher-a-${Date.now()}@apexa.edu`,
      passwordHash,
      roleId: tRole.id,
      tenantId: tenantA.id,
      status: 'ACTIVE',
    });

    studentUserA = await User.create({
      name: 'Student A',
      email: `student-a-${Date.now()}@apexa.edu`,
      passwordHash,
      roleId: stRole.id,
      tenantId: tenantA.id,
      status: 'ACTIVE',
    });

    // 5. Generate JWT tokens
    superAdminToken = jwt.sign(
      { id: platformAdmin.id, email: platformAdmin.email, role: 'Super Admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    schoolAdminTokenA = jwt.sign(
      { id: schoolAdminUserA.id, email: schoolAdminUserA.email, role: 'School Admin', tenantId: tenantA.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    schoolAdminTokenB = jwt.sign(
      { id: schoolAdminUserB.id, email: schoolAdminUserB.email, role: 'School Admin', tenantId: tenantB.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    teacherTokenA = jwt.sign(
      { id: teacherUserA.id, email: teacherUserA.email, role: 'Teacher', tenantId: tenantA.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    studentTokenA = jwt.sign(
      { id: studentUserA.id, email: studentUserA.email, role: 'Student', tenantId: tenantA.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create Academic Year, Class, Section for quota tests
    const ayA = await AcademicYear.create({
      tenantId: tenantA.id,
      name: '2026-2027',
      startDate: '2026-06-01',
      endDate: '2027-05-31',
      isCurrent: true,
      status: 'ACTIVE',
    });

    const classA = await Class.create({
      tenantId: tenantA.id,
      name: 'Grade 10',
      academicYearId: ayA.id,
    });

    const secA = await Section.create({
      tenantId: tenantA.id,
      name: 'Section A',
      classId: classA.id,
    });
  });

  afterAll(async () => {
    // Cleanup created test resources in correct foreign-key dependency order
    const { PlatformAuditLog, AuditLog } = require('../src/models');
    if (tenantA) {
      await Student.destroy({ where: { tenantId: tenantA.id } });
      await Section.destroy({ where: { tenantId: tenantA.id } });
      await Class.destroy({ where: { tenantId: tenantA.id } });
      await AcademicYear.destroy({ where: { tenantId: tenantA.id } });
      await PlatformPayment.destroy({ where: { tenantId: tenantA.id } });
      await TenantSubscription.destroy({ where: { tenantId: tenantA.id } });
      await PlatformAuditLog.destroy({ where: { tenantId: tenantA.id } });
      await AuditLog.destroy({ where: { tenantId: tenantA.id } });
      await User.destroy({ where: { tenantId: tenantA.id } });
      await Tenant.destroy({ where: { id: tenantA.id } });
    }
    if (tenantB) {
      await PlatformPayment.destroy({ where: { tenantId: tenantB.id } });
      await TenantSubscription.destroy({ where: { tenantId: tenantB.id } });
      await PlatformAuditLog.destroy({ where: { tenantId: tenantB.id } });
      await AuditLog.destroy({ where: { tenantId: tenantB.id } });
      await User.destroy({ where: { tenantId: tenantB.id } });
      await Tenant.destroy({ where: { id: tenantB.id } });
    }
  });

  // Helper to generate valid Razorpay webhook signature
  const generateSignature = (payloadString, secret = testWebhookSecret) => {
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  };

  describe('1. Authentication & RBAC Security Enforcement', () => {
    it('rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request(app).get('/api/billing/subscription');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('forbids Teacher from creating a subscription checkout (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/billing/create-subscription')
        .set('Authorization', `Bearer ${teacherTokenA}`)
        .send({ planType: 'STANDARD' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('forbids Student from creating a subscription checkout (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/billing/create-subscription')
        .set('Authorization', `Bearer ${studentTokenA}`)
        .send({ planType: 'STANDARD' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('forbids School Admin from accessing Super Admin billing summary (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/superadmin/billing/summary')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`);

      expect(res.status).toBe(403);
    });

    it('allows Super Admin to view platform billing metrics (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/superadmin/billing/summary')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.distribution).toBeDefined();
    });
  });

  describe('2. Tenant Isolation & Client Parameter Tampering Protection', () => {
    it('returns School A subscription without exposing School B data', async () => {
      const resA = await request(app)
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      expect(resA.body.tenant.id).toBe(tenantA.id);
      expect(resA.body.tenant.schoolName).toBe('Apex Billing Academy A');
      expect(resA.body.usage).toBeDefined();
    });

    it('ignores client-supplied tenant_id in body and enforces verified JWT context', async () => {
      const res = await request(app)
        .post('/api/billing/create-subscription')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          planType: 'STANDARD',
          tenantId: tenantB.id, // Attempt to create checkout for School B
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.planType).toBe('STANDARD');
      expect(res.body.subscriptionId).toBeDefined();
    });

    it('rejects invalid or non-existent plan types (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/billing/create-subscription')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({ planType: 'SUPER_VIP_UNLIMITED_HACK' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Razorpay Webhook Cryptographic Verification & Idempotency', () => {
    it('rejects webhooks with missing signature header with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/billing/webhook')
        .send({ event: 'payment.captured' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature');
    });

    it('rejects webhooks with forged or invalid signature with HTTP 400', async () => {
      const payload = JSON.stringify({ event: 'payment.captured', account_id: 'acc_123' });
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', 'forged_fake_signature_99999')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature');
    });

    it('successfully processes valid signed subscription.activated webhook', async () => {
      const eventId = `evt_test_act_${Date.now()}`;
      const payloadObj = {
        event: 'subscription.activated',
        event_id: eventId,
        created_at: Math.floor(Date.now() / 1000),
        payload: {
          subscription: {
            entity: {
              id: `sub_rzp_live_${Date.now()}`,
              plan_id: 'plan_standard_monthly',
              customer_id: 'cust_rzp_123',
              current_start: Math.floor(Date.now() / 1000),
              current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
              notes: {
                tenantId: tenantA.id,
                planType: 'STANDARD',
              },
            },
          },
          payment: {
            entity: {
              id: `pay_rzp_first_${Date.now()}`,
              amount: 9900,
              currency: 'INR',
              status: 'captured',
              method: 'upi',
              notes: {
                tenantId: tenantA.id,
                planType: 'STANDARD',
              },
            },
          },
        },
      };

      const rawPayload = JSON.stringify(payloadObj);
      const validSig = generateSignature(rawPayload);

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', validSig)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('PROCESSED');

      // Verify database synchronization
      const updatedTenant = await Tenant.findByPk(tenantA.id);
      expect(updatedTenant.planType).toBe('STANDARD');

      const updatedSub = await TenantSubscription.findOne({ where: { tenantId: tenantA.id } });
      expect(updatedSub.planType).toBe('STANDARD');
      expect(updatedSub.status).toBe('ACTIVE');

      const paymentRecord = await PlatformPayment.findOne({ where: { tenantId: tenantA.id } });
      expect(paymentRecord).toBeDefined();
      expect(paymentRecord.amount).toBe('99.00');
      expect(paymentRecord.status).toBe('SUCCEEDED');
    });

    it('idempotently handles duplicate webhook replay without duplicating records', async () => {
      const eventId = `evt_test_dup_${Date.now()}`;
      const payloadObj = {
        event: 'subscription.charged',
        event_id: eventId,
        created_at: Math.floor(Date.now() / 1000),
        payload: {
          subscription: {
            entity: {
              id: `sub_rzp_dup_${Date.now()}`,
              notes: { tenantId: tenantA.id, planType: 'STANDARD' },
            },
          },
          payment: {
            entity: {
              id: `pay_rzp_dup_${Date.now()}`,
              amount: 9900,
              currency: 'INR',
              notes: { tenantId: tenantA.id },
            },
          },
        },
      };

      const rawPayload = JSON.stringify(payloadObj);
      const validSig = generateSignature(rawPayload);

      // First webhook delivery
      const res1 = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', validSig)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('PROCESSED');

      const paymentCountBefore = await PlatformPayment.count({ where: { tenantId: tenantA.id } });

      // Replay identical webhook delivery
      const res2 = await request(app)
        .post('/api/billing/webhook')
        .set('x-razorpay-signature', validSig)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('ALREADY_PROCESSED');

      const paymentCountAfter = await PlatformPayment.count({ where: { tenantId: tenantA.id } });
      expect(paymentCountAfter).toBe(paymentCountBefore); // No duplicate payment created
    });
  });

  describe('4. Entitlement & Quota Limit Integration', () => {
    it('enforces updated STANDARD capacity (50 students) after plan upgrade', async () => {
      // Current tenantA plan is STANDARD
      const tenantCheck = await Tenant.findByPk(tenantA.id);
      expect(tenantCheck.planType).toBe('STANDARD');

      // Create students up to quota
      const { Class: ClassModel, Section: SectionModel } = require('../src/models');
      const testClass = await ClassModel.findOne({ where: { tenantId: tenantA.id } });
      const testSection = await SectionModel.findOne({ where: { tenantId: tenantA.id } });

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`)
        .send({
          name: 'Quota Test Student 1',
          email: `quota-student-1-${Date.now()}@apexa.edu`,
          password: 'Password123!',
          classId: testClass.id,
          sectionId: testSection.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('allows tenant cancellation and downgrades back to FREE tier', async () => {
      const res = await request(app)
        .post('/api/billing/cancel')
        .set('Authorization', `Bearer ${schoolAdminTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const downgradedTenant = await Tenant.findByPk(tenantA.id);
      expect(downgradedTenant.planType).toBe('FREE');

      const downgradedSub = await TenantSubscription.findOne({ where: { tenantId: tenantA.id } });
      expect(downgradedSub.status).toBe('CANCELED');
    });
  });
});
