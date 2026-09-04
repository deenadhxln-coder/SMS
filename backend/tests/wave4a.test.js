const request = require('supertest');
const express = require('express');
const {
  sequelize,
  Tenant,
  User,
  Role,
  SubscriptionPlan,
  AcademicYear,
  Class,
  Exam,
  FeeStructure,
} = require('../src/models');
const { protect } = require('../src/middleware/auth');
const { verifyTenant } = require('../src/middleware/tenantGuard');
const config = require('../src/config/config');
const bcrypt = require('bcryptjs');

let app;
let tenantA, tenantB;
let adminAToken, teacherAToken, studentAToken, parentAToken;
let adminBToken;
let ayA1_Id, ayA2_Id, ayB1_Id;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/students', protect, verifyTenant, require('../src/routes/studentRoutes'));
  app.use('/api/teachers', protect, verifyTenant, require('../src/routes/teacherRoutes'));
  app.use('/api/academics', protect, verifyTenant, require('../src/routes/academicsRoutes'));
  app.use('/api/exams', protect, verifyTenant, require('../src/routes/examRoutes'));
  app.use('/api/fees', protect, verifyTenant, require('../src/routes/feeRoutes'));
  app.use('/api/academic-years', protect, verifyTenant, require('../src/routes/academicYearRoutes'));

  // Ensure DB connection
  await sequelize.authenticate();

  // Create two test tenants
  tenantA = await Tenant.create({
    schoolName: `Wave4A School A ${Date.now()}`,
    slug: `school-a-${Date.now()}`,
    status: 'ACTIVE',
    planType: 'PREMIUM',
  });

  tenantB = await Tenant.create({
    schoolName: `Wave4A School B ${Date.now()}`,
    slug: `school-b-${Date.now()}`,
    status: 'ACTIVE',
    planType: 'STANDARD',
  });

  const adminRole = await Role.findOne({ where: { name: 'School Admin' } });
  const teacherRole = await Role.findOne({ where: { name: 'Teacher' } });
  const studentRole = await Role.findOne({ where: { name: 'Student' } });
  const parentRole = await Role.findOne({ where: { name: 'Parent' } });

  const passwordHash = await bcrypt.hash('password123', 10);

  // Users in Tenant A
  const adminA = await User.create({
    name: 'Admin School A',
    email: `adminA_${Date.now()}@test.com`,
    passwordHash,
    roleId: adminRole.id,
    tenantId: tenantA.id,
    status: 'ACTIVE',
  });

  const teacherA = await User.create({
    name: 'Teacher School A',
    email: `teacherA_${Date.now()}@test.com`,
    passwordHash,
    roleId: teacherRole.id,
    tenantId: tenantA.id,
    status: 'ACTIVE',
  });

  const studentA = await User.create({
    name: 'Student School A',
    email: `studentA_${Date.now()}@test.com`,
    passwordHash,
    roleId: studentRole.id,
    tenantId: tenantA.id,
    status: 'ACTIVE',
  });

  const parentA = await User.create({
    name: 'Parent School A',
    email: `parentA_${Date.now()}@test.com`,
    passwordHash,
    roleId: parentRole.id,
    tenantId: tenantA.id,
    status: 'ACTIVE',
  });

  // Users in Tenant B
  const adminB = await User.create({
    name: 'Admin School B',
    email: `adminB_${Date.now()}@test.com`,
    passwordHash,
    roleId: adminRole.id,
    tenantId: tenantB.id,
    status: 'ACTIVE',
  });

  // Log in users to get tokens
  const login = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    return res.body.token;
  };

  adminAToken = await login(adminA.email);
  teacherAToken = await login(teacherA.email);
  studentAToken = await login(studentA.email);
  parentAToken = await login(parentA.email);
  adminBToken = await login(adminB.email);
});

describe('Wave 4A — Academic Year Foundation Suite', () => {

  describe('1. Authentication & RBAC Access Controls', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/academic-years');
      expect(res.status).toBe(401);
    });

    it('allows Teacher, Student, and Parent to read academic years (200 OK)', async () => {
      const resTeacher = await request(app)
        .get('/api/academic-years')
        .set('Authorization', `Bearer ${teacherAToken}`);
      expect(resTeacher.status).toBe(200);

      const resStudent = await request(app)
        .get('/api/academic-years')
        .set('Authorization', `Bearer ${studentAToken}`);
      expect(resStudent.status).toBe(200);

      const resParent = await request(app)
        .get('/api/academic-years')
        .set('Authorization', `Bearer ${parentAToken}`);
      expect(resParent.status).toBe(200);
    });

    it('forbids Teacher from creating an academic year (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          name: '2027-2028',
          startDate: '2027-06-01',
          endDate: '2028-05-31',
        });
      expect(res.status).toBe(403);
    });

    it('forbids Student from updating an academic year (403 Forbidden)', async () => {
      const res = await request(app)
        .put('/api/academic-years/some-id')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ name: 'Hacked Year' });
      expect(res.status).toBe(403);
    });

    it('forbids Parent from setting current academic year (403 Forbidden)', async () => {
      const res = await request(app)
        .put('/api/academic-years/some-id/set-current')
        .set('Authorization', `Bearer ${parentAToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Creation, Validation & Tenant Uniqueness', () => {
    it('allows School Admin to create a new academic year with HTTP 201', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2026-2027',
          startDate: '2026-06-01',
          endDate: '2027-05-31',
          isCurrent: true,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.academicYear.name).toBe('2026-2027');
      expect(res.body.academicYear.isCurrent).toBe(true);
      expect(res.body.academicYear.tenantId).toBe(tenantA.id);
      ayA1_Id = res.body.academicYear.id;
    });

    it('rejects duplicate academic year name within the same tenant (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2026-2027',
          startDate: '2026-06-01',
          endDate: '2027-05-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('allows the same academic year name in a different tenant (Tenant B)', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          name: '2026-2027',
          startDate: '2026-06-01',
          endDate: '2027-05-31',
          isCurrent: true,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.academicYear.tenantId).toBe(tenantB.id);
      ayB1_Id = res.body.academicYear.id;
    });

    it('rejects creation when startDate is missing or invalid (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2028-2029',
          startDate: 'invalid-date',
          endDate: '2029-05-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects creation when startDate >= endDate (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2028-2029',
          startDate: '2029-05-31',
          endDate: '2028-06-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/startDate must be strictly before endDate/i);
    });

    it('creates a second academic year for Tenant A (upcoming)', async () => {
      const res = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2027-2028',
          startDate: '2027-06-01',
          endDate: '2028-05-31',
          isCurrent: false,
          status: 'UPCOMING',
        });

      expect(res.status).toBe(201);
      ayA2_Id = res.body.academicYear.id;
    });
  });

  describe('3. Multi-Tenant Isolation Enforcement', () => {
    it('Tenant A cannot read Tenant B academic years', async () => {
      const res = await request(app)
        .get('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.academicYears.map((ay) => ay.id);
      expect(ids).toContain(ayA1_Id);
      expect(ids).toContain(ayA2_Id);
      expect(ids).not.toContain(ayB1_Id);
    });

    it('Tenant A cannot update Tenant B academic year (404 Not Found)', async () => {
      const res = await request(app)
        .put(`/api/academic-years/${ayB1_Id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Hijacked Year' });

      expect(res.status).toBe(404);
    });

    it('Tenant A cannot set Tenant B academic year as current (404 Not Found)', async () => {
      const res = await request(app)
        .put(`/api/academic-years/${ayB1_Id}/set-current`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(404);
    });

    it('Tenant A cannot delete or archive Tenant B academic year (404 Not Found)', async () => {
      const res = await request(app)
        .delete(`/api/academic-years/${ayB1_Id}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('4. Current-Year Atomic Invariant', () => {
    it('setting year 2027-2028 as current atomically clears 2026-2027 from being current', async () => {
      const res = await request(app)
        .put(`/api/academic-years/${ayA2_Id}/set-current`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.academicYear.isCurrent).toBe(true);

      // Verify list: ayA2 is now current, ayA1 is no longer current
      const listRes = await request(app)
        .get('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`);

      const ay1 = listRes.body.academicYears.find((ay) => ay.id === ayA1_Id);
      const ay2 = listRes.body.academicYears.find((ay) => ay.id === ayA2_Id);

      expect(ay2.isCurrent).toBe(true);
      expect(ay1.isCurrent).toBe(false);
    });

    it('switching current year in Tenant A does NOT affect Tenant B current year', async () => {
      const resB = await request(app)
        .get('/api/academic-years')
        .set('Authorization', `Bearer ${adminBToken}`);

      const ayB = resB.body.academicYears.find((ay) => ay.id === ayB1_Id);
      expect(ayB.isCurrent).toBe(true);
    });

    it('forbids setting an ARCHIVED academic year as current (400 Bad Request)', async () => {
      // Archive ayA1
      const archiveRes = await request(app)
        .put(`/api/academic-years/${ayA1_Id}/archive`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.academicYear.status).toBe('ARCHIVED');

      // Attempt to set archived year as current
      const setCurrentRes = await request(app)
        .put(`/api/academic-years/${ayA1_Id}/set-current`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(setCurrentRes.status).toBe(400);
      expect(setCurrentRes.body.message).toMatch(/cannot set an ARCHIVED/i);
    });
  });

  describe('5. Referenced Deletion Protection & Archival', () => {
    let referencedClass;

    it('creates a class referencing the active academic year ayA2', async () => {
      const res = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: `Grade 10-${Date.now()}`,
          academicYearId: ayA2_Id,
        });

      expect(res.status).toBe(201);
      referencedClass = res.body.class;
    });

    it('rejects deletion of an academic year referenced by active classes (400 Bad Request)', async () => {
      const res = await request(app)
        .delete(`/api/academic-years/${ayA2_Id}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/referenced by active classes/i);
    });

    it('allows deleting an unreferenced academic year', async () => {
      // Create temporary year
      const tempRes = await request(app)
        .post('/api/academic-years')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2029-2030-Temp',
          startDate: '2029-06-01',
          endDate: '2030-05-31',
        });
      expect(tempRes.status).toBe(201);
      const tempId = tempRes.body.academicYear.id;

      const deleteRes = await request(app)
        .delete(`/api/academic-years/${tempId}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(deleteRes.status).toBe(200);
    });
  });

  describe('6. Class, Exam & FeeStructure Reference Integrity', () => {
    it('rejects Class creation referencing another tenant academic year (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Cross-Tenant Class',
          academicYearId: ayB1_Id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not exist in this school/i);
    });

    it('rejects Class creation referencing an ARCHIVED academic year (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Archived AY Class',
          academicYearId: ayA1_Id, // ayA1 was archived earlier
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ARCHIVED academic year/i);
    });

    it('rejects Exam creation referencing another tenant academic year (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Cross-Tenant Exam',
          academicYearId: ayB1_Id,
          startDate: '2027-10-01',
          endDate: '2027-10-15',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not exist in this school/i);
    });

    it('rejects Exam creation referencing an ARCHIVED academic year (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Archived AY Exam',
          academicYearId: ayA1_Id,
          startDate: '2026-10-01',
          endDate: '2026-10-15',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ARCHIVED academic year/i);
    });

    it('rejects FeeStructure creation referencing another tenant academic year (400 Bad Request)', async () => {
      // Create valid class in Tenant A
      const classRes = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: `Class For Fee ${Date.now()}`, academicYearId: ayA2_Id });
      expect(classRes.status).toBe(201);
      const testClassId = classRes.body.class.id;

      const res = await request(app)
        .post('/api/fees/structures')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          classId: testClassId,
          title: 'Tuition Fee',
          amount: 500,
          academicYearId: ayB1_Id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not exist in this school/i);
    });

    it('rejects FeeStructure creation referencing an ARCHIVED academic year (400 Bad Request)', async () => {
      const classRes = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: `Class For Fee 2 ${Date.now()}`, academicYearId: ayA2_Id });
      expect(classRes.status).toBe(201);
      const testClassId = classRes.body.class.id;

      const res = await request(app)
        .post('/api/fees/structures')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          classId: testClassId,
          title: 'Tuition Fee',
          amount: 500,
          academicYearId: ayA1_Id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ARCHIVED academic year/i);
    });
  });
});
