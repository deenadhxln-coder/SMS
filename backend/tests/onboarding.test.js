const request = require('supertest');
const express = require('express');
const {
  sequelize,
  Tenant,
  User,
  Role,
  SubscriptionPlan,
  AcademicYear,
  PlatformAdmin,
  PlatformAuditLog
} = require('../src/models');
const { protect } = require('../src/middleware/auth');
const { authorize } = require('../src/middleware/roleGuard');
const superAdminRoutes = require('../src/routes/superAdminRoutes');
const config = require('../src/config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let app;
let superAdminToken;
let schoolAdminToken;
let teacherToken;
let superAdminUser;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/superadmin', superAdminRoutes);

  await sequelize.authenticate();

  // Ensure Roles
  const [saRole] = await Role.findOrCreate({ where: { name: 'Super Admin' }, defaults: { description: 'Platform Super Admin' } });
  const [adminRole] = await Role.findOrCreate({ where: { name: 'School Admin' }, defaults: { description: 'School Administrator' } });
  const [teacherRole] = await Role.findOrCreate({ where: { name: 'Teacher' }, defaults: { description: 'School Teacher' } });

  // Create Super Admin Platform User
  const passwordHash = await bcrypt.hash('adminpassword', 10);
  [superAdminUser] = await PlatformAdmin.findOrCreate({
    where: { email: `platform_admin_${Date.now()}@sms.edu` },
    defaults: {
      name: 'Global Platform Admin',
      passwordHash,
      status: 'ACTIVE'
    }
  });

  superAdminToken = jwt.sign(
    { id: superAdminUser.id, role: 'Super Admin', email: superAdminUser.email },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  // Create dummy tenant for normal users
  const dummyTenant = await Tenant.create({
    schoolName: `Dummy School ${Date.now()}`,
    slug: `dummy-${Date.now()}`,
    planType: 'FREE',
    status: 'ACTIVE'
  });

  const schoolAdminUser = await User.create({
    name: 'School Admin Test',
    email: `schooladmin_${Date.now()}@dummy.edu`,
    passwordHash,
    roleId: adminRole.id,
    tenantId: dummyTenant.id,
    status: 'ACTIVE'
  });

  schoolAdminToken = jwt.sign(
    { id: schoolAdminUser.id, role: 'School Admin', tenantId: dummyTenant.id },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const teacherUser = await User.create({
    name: 'Teacher Test',
    email: `teacher_${Date.now()}@dummy.edu`,
    passwordHash,
    roleId: teacherRole.id,
    tenantId: dummyTenant.id,
    status: 'ACTIVE'
  });

  teacherToken = jwt.sign(
    { id: teacherUser.id, role: 'Teacher', tenantId: dummyTenant.id },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
});

describe('Super Admin School Onboarding Suite', () => {

  it('1. Successfully onboards a new school tenant with admin user and default academic year', async () => {
    const ts = Date.now();
    const payload = {
      schoolName: `St. Mary Academy ${ts}`,
      slug: `st-mary-${ts}`,
      contactEmail: `info_${ts}@stmary.edu`,
      planType: 'STANDARD',
      adminName: 'Principal Thomas',
      adminEmail: `principal_${ts}@stmary.edu`,
      adminPassword: 'SecurePassword123!'
    };

    const res = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.tenant).toBeDefined();
    expect(res.body.tenant.schoolName).toBe(payload.schoolName);
    expect(res.body.tenant.slug).toBe(payload.slug);
    expect(res.body.tenant.planType).toBe('STANDARD');
    expect(res.body.admin).toBeDefined();
    expect(res.body.admin.email).toBe(payload.adminEmail);

    // Verify database records
    const dbTenant = await Tenant.findOne({ where: { slug: payload.slug } });
    expect(dbTenant).not.toBeNull();
    expect(dbTenant.schoolName).toBe(payload.schoolName);
    expect(dbTenant.contactEmail).toBe(payload.contactEmail);
    expect(dbTenant.createdByAdminId).toBe(superAdminUser.id);

    // Verify Admin User
    const dbAdmin = await User.findOne({ where: { email: payload.adminEmail } });
    expect(dbAdmin).not.toBeNull();
    expect(dbAdmin.tenantId).toBe(dbTenant.id);
    const passMatch = await bcrypt.compare(payload.adminPassword, dbAdmin.passwordHash);
    expect(passMatch).toBe(true);

    // Verify Default Academic Year
    const dbAy = await AcademicYear.findOne({ where: { tenantId: dbTenant.id, isCurrent: true } });
    expect(dbAy).not.toBeNull();
    expect(dbAy.name).toBe('2026-2027');
    expect(dbAy.status).toBe('ACTIVE');

    // Verify Platform Audit Log
    const auditLog = await PlatformAuditLog.findOne({
      where: { tenantId: dbTenant.id, action: 'CREATE_SCHOOL' }
    });
    expect(auditLog).not.toBeNull();
  });

  it('2. Rejects creation with missing required fields with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ schoolName: 'Incomplete Academy' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('3. Rejects duplicate slug with 400 Bad Request', async () => {
    const ts = Date.now();
    const payload = {
      schoolName: `Duplicate Slug School ${ts}`,
      slug: `dup-slug-${ts}`,
      contactEmail: `dup_${ts}@test.edu`,
      planType: 'FREE',
      adminName: 'Admin One',
      adminEmail: `admin_dup1_${ts}@test.edu`,
      adminPassword: 'Password123!'
    };

    // First creation
    const firstRes = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload);
    expect(firstRes.status).toBe(201);

    // Second creation with same slug
    const dupRes = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        ...payload,
        schoolName: `Different Name ${ts}`,
        adminEmail: `admin_dup2_${ts}@test.edu`
      });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toContain('slug already exists');
  });

  it('4. Rejects duplicate admin email with 400 Bad Request', async () => {
    const ts = Date.now();
    const existingEmail = `shared_email_${ts}@test.edu`;

    const payload1 = {
      schoolName: `School A ${ts}`,
      slug: `school-a-${ts}`,
      contactEmail: `contactA_${ts}@test.edu`,
      planType: 'FREE',
      adminName: 'Admin A',
      adminEmail: existingEmail,
      adminPassword: 'Password123!'
    };

    const firstRes = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload1);
    expect(firstRes.status).toBe(201);

    const payload2 = {
      schoolName: `School B ${ts}`,
      slug: `school-b-${ts}`,
      contactEmail: `contactB_${ts}@test.edu`,
      planType: 'FREE',
      adminName: 'Admin B',
      adminEmail: existingEmail,
      adminPassword: 'Password123!'
    };

    const dupEmailRes = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload2);

    expect(dupEmailRes.status).toBe(400);
    expect(dupEmailRes.body.success).toBe(false);
    expect(dupEmailRes.body.message).toContain('email already in use');
  });

  it('5. Strictly forbids School Admin and Teacher from calling onboarding endpoint', async () => {
    const payload = {
      schoolName: 'Hacker School',
      slug: `hacker-${Date.now()}`,
      adminName: 'Hacker',
      adminEmail: `hacker_${Date.now()}@test.edu`,
      adminPassword: 'Password123!'
    };

    // School Admin
    const adminRes = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send(payload);
    expect(adminRes.status).toBe(403);

    // Teacher
    const teacherRes = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);
    expect(teacherRes.status).toBe(403);

    // Unauthenticated
    const unauthRes = await request(app)
      .post('/api/superadmin/tenants')
      .send(payload);
    expect(unauthRes.status).toBe(401);
  });
});
