require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
process.env.PORT = '5004';
process.env.JWT_SECRET = 'test_secret_key';
if (process.env.TEST_DB_NAME) {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
}

const request = require('supertest');
const express = require('express');
const { 
  sequelize, Tenant, User, Role, Class, Section, Student, Teacher, AuditLog 
} = require('../src/models');
const seedDatabase = require('../src/utils/seeder');
const redisClient = require('../src/config/redis');

let app;
let schoolA_Token;
let schoolB_Token;
let teacherA_Token;
let studentA_Token;
let schoolA_Id;
let schoolB_Id;
let adminA_Id;
let adminB_Id;

beforeAll(async () => {
  // Sync test database
  await sequelize.sync({ force: true });
  await seedDatabase();

  app = express();
  app.use(express.json());

  const { protect } = require('../src/middleware/auth');
  const { verifyTenant } = require('../src/middleware/tenantGuard');

  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/superadmin', require('../src/routes/superAdminRoutes'));
  app.use('/api/students', protect, verifyTenant, require('../src/routes/studentRoutes'));
  app.use('/api/teachers', protect, verifyTenant, require('../src/routes/teacherRoutes'));
  app.use('/api/academics', protect, verifyTenant, require('../src/routes/academicsRoutes'));
  app.use('/api/attendance', protect, verifyTenant, require('../src/routes/attendanceRoutes'));
  app.use('/api/exams', protect, verifyTenant, require('../src/routes/examRoutes'));
  app.use('/api/fees', protect, verifyTenant, require('../src/routes/feeRoutes'));
  app.use('/api/dashboard', protect, verifyTenant, require('../src/routes/dashboardRoutes'));
  app.use('/api/reports', protect, verifyTenant, require('../src/routes/reportsRoutes'));
  app.use('/api/announcements', protect, verifyTenant, require('../src/routes/announcementRoutes'));
  app.use('/api/audit-logs', protect, verifyTenant, require('../src/routes/auditRoutes'));

  const errorHandler = require('../src/middleware/errorHandler');
  app.use(errorHandler);

  // Setup School A
  const tenantA = await Tenant.create({
    schoolName: 'Wave3 Academy Alpha',
    slug: 'wave3-alpha',
    domain: 'wave3alpha.sms.test',
    status: 'ACTIVE',
    planType: 'STANDARD',
  });
  schoolA_Id = tenantA.id;

  // Setup School B
  const tenantB = await Tenant.create({
    schoolName: 'Wave3 Academy Beta',
    slug: 'wave3-beta',
    domain: 'wave3beta.sms.test',
    status: 'ACTIVE',
    planType: 'STANDARD',
  });
  schoolB_Id = tenantB.id;

  const schoolAdminRole = await Role.findOne({ where: { name: 'School Admin' } });
  const teacherRole = await Role.findOne({ where: { name: 'Teacher' } });
  const studentRole = await Role.findOne({ where: { name: 'Student' } });

  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Users in School A
  const adminA = await User.create({
    tenantId: schoolA_Id,
    name: 'Admin Alpha',
    email: 'admin@alpha3.com',
    passwordHash,
    roleId: schoolAdminRole.id,
    status: 'ACTIVE',
  });
  adminA_Id = adminA.id;

  const teacherA = await User.create({
    tenantId: schoolA_Id,
    name: 'Teacher Alpha',
    email: 'teacher@alpha3.com',
    passwordHash,
    roleId: teacherRole.id,
    status: 'ACTIVE',
  });

  const studentA = await User.create({
    tenantId: schoolA_Id,
    name: 'Student Alpha',
    email: 'student@alpha3.com',
    passwordHash,
    roleId: studentRole.id,
    status: 'ACTIVE',
  });

  // User in School B
  const adminB = await User.create({
    tenantId: schoolB_Id,
    name: 'Admin Beta',
    email: 'admin@beta3.com',
    passwordHash,
    roleId: schoolAdminRole.id,
    status: 'ACTIVE',
  });
  adminB_Id = adminB.id;

  // Login tokens
  const resAdminA = await request(app).post('/api/auth/login').send({
    email: 'admin@alpha3.com',
    password: 'password123',
  });
  schoolA_Token = resAdminA.body.token;

  const resTeacherA = await request(app).post('/api/auth/login').send({
    email: 'teacher@alpha3.com',
    password: 'password123',
  });
  teacherA_Token = resTeacherA.body.token;

  const resStudentA = await request(app).post('/api/auth/login').send({
    email: 'student@alpha3.com',
    password: 'password123',
  });
  studentA_Token = resStudentA.body.token;

  const resAdminB = await request(app).post('/api/auth/login').send({
    email: 'admin@beta3.com',
    password: 'password123',
  });
  schoolB_Token = resAdminB.body.token;

  // Populate some initial audit records for testing
  await AuditLog.create({
    tenantId: schoolA_Id,
    userId: adminA_Id,
    action: 'CREATE',
    entity: 'Student',
    entityId: 'student-uuid-1',
    timestamp: new Date('2026-09-01T10:00:00Z'),
  });

  await AuditLog.create({
    tenantId: schoolA_Id,
    userId: adminA_Id,
    action: 'UPDATE',
    entity: 'Class',
    entityId: 'class-uuid-1',
    timestamp: new Date('2026-09-02T12:00:00Z'),
  });

  await AuditLog.create({
    tenantId: schoolA_Id,
    userId: adminA_Id,
    action: 'DELETE',
    entity: 'FeeStructure',
    entityId: 'fee-uuid-1',
    timestamp: new Date('2026-09-03T14:00:00Z'),
  });

  // Audit record for School B
  await AuditLog.create({
    tenantId: schoolB_Id,
    userId: adminB_Id,
    action: 'CREATE',
    entity: 'Teacher',
    entityId: 'teacher-uuid-beta',
    timestamp: new Date('2026-09-03T15:00:00Z'),
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Wave 3 Implementation Verification', () => {

  describe('1. Audit Logs API & RBAC Security', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/audit-logs');
      expect(res.status).toBe(401);
    });

    it('rejects requests from Teacher with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${teacherA_Token}`);
      expect(res.status).toBe(403);
    });

    it('rejects requests from Student with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${studentA_Token}`);
      expect(res.status).toBe(403);
    });

    it('allows School Admin to fetch audit logs with 200 and pagination', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.total).toBe(6);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.logs[0].user).toBeDefined();
    });
  });

  describe('2. Multi-Tenant Scoping & Tenant Isolation for Audit Logs', () => {
    it('strictly isolates tenant data: School Admin A cannot see School B audit logs', async () => {
      const resA = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(resA.status).toBe(200);
      const logsA = resA.body.logs;
      // All logs must belong to School A
      logsA.forEach(log => {
        expect(log.tenantId).toBe(schoolA_Id);
        expect(log.entity).not.toBe('Teacher'); // Teacher creation was on School B
      });

      const resB = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${schoolB_Token}`);

      expect(resB.status).toBe(200);
      expect(resB.body.total).toBe(2);
      expect(resB.body.logs[0].tenantId).toBe(schoolB_Id);

      // Verify no School A logs are in School B response
      resB.body.logs.forEach(log => {
        expect(log.tenantId).toBe(schoolB_Id);
      });
    });

    it('ignores client-supplied tenantId query parameter override attempt', async () => {
      // School Admin A attempts to inject ?tenantId=schoolB_Id
      const res = await request(app)
        .get(`/api/audit-logs?tenantId=${schoolB_Id}`)
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBe(6);
      // All returned logs must be School A
      res.body.logs.forEach(log => {
        expect(log.tenantId).toBe(schoolA_Id);
      });
    });
  });

  describe('3. Query Validation & Filtering', () => {
    it('returns 400 when startDate is invalid', async () => {
      const res = await request(app)
        .get('/api/audit-logs?startDate=not-a-valid-date')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/startDate/i);
    });

    it('returns 400 when endDate is invalid', async () => {
      const res = await request(app)
        .get('/api/audit-logs?endDate=invalid-date-string')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/endDate/i);
    });

    it('returns 400 when userId is an invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/audit-logs?userId=not-a-uuid-123')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/userId/i);
    });

    it('filters correctly by action (e.g. CREATE)', async () => {
      const res = await request(app)
        .get('/api/audit-logs?action=CREATE')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.logs[0].action).toBe('CREATE');
      expect(res.body.logs[0].entity).toBe('Student');
    });

    it('filters correctly by entity (e.g. Class)', async () => {
      const res = await request(app)
        .get('/api/audit-logs?entity=Class')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.logs[0].action).toBe('UPDATE');
      expect(res.body.logs[0].entity).toBe('Class');
    });

    it('filters correctly by date range', async () => {
      const res = await request(app)
        .get('/api/audit-logs?startDate=2026-09-02T00:00:00.000Z&endDate=2026-09-02T23:59:59.999Z')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.logs[0].action).toBe('UPDATE');
    });
  });

  describe('4. Performance Safety & Cache Invalidation', () => {
    it('invalidates tenant dashboard cache upon class creation', async () => {
      const cacheKeyA = `tenant:${schoolA_Id}:dashboard:summary`;
      // Pre-set dashboard cache
      await redisClient.set(cacheKeyA, JSON.stringify({ cached: true, totalStudents: 99 }));
      expect(await redisClient.get(cacheKeyA)).toBeDefined();

      // Create a class as School Admin A
      const res = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({ name: 'Grade 10-Wave3', academicYearId: '2026-2027' });

      expect(res.status).toBe(201);

      // Verify that School A dashboard summary cache was deleted/invalidated
      const cachedAfter = await redisClient.get(cacheKeyA);
      expect(cachedAfter).toBeNull();
    });

    it('does NOT invalidate School B cache when School A mutates a class', async () => {
      const cacheKeyA = `tenant:${schoolA_Id}:dashboard:summary`;
      const cacheKeyB = `tenant:${schoolB_Id}:dashboard:summary`;

      // Seed both caches
      await redisClient.set(cacheKeyA, JSON.stringify({ school: 'A' }));
      await redisClient.set(cacheKeyB, JSON.stringify({ school: 'B' }));

      // Create a class in School A
      const res = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({ name: 'Grade 11-Wave3', academicYearId: '2026-2027' });

      expect(res.status).toBe(201);

      // School A cache should be gone, School B cache MUST remain intact
      expect(await redisClient.get(cacheKeyA)).toBeNull();
      const schoolBCache = await redisClient.get(cacheKeyB);
      expect(schoolBCache).not.toBeNull();
      expect(JSON.parse(schoolBCache).school).toBe('B');
    });
  });

});
