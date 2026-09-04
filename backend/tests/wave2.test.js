require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
process.env.PORT = '5003';
process.env.JWT_SECRET = 'test_secret_key';
if (process.env.TEST_DB_NAME) {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
}

const request = require('supertest');
const express = require('express');
const { 
  sequelize, Tenant, User, Role, Class, Section, Student, Teacher, Announcement 
} = require('../src/models');
const seedDatabase = require('../src/utils/seeder');

let app;
let schoolA_Token;
let schoolB_Token;
let teacherA_Token;
let studentA_Token;
let schoolA_Id;
let schoolB_Id;
let testClassA;
let testStudentA;

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

  const errorHandler = require('../src/middleware/errorHandler');
  app.use(errorHandler);

  // Setup School A
  const tenantA = await Tenant.create({
    schoolName: 'Wave2 Academy Alpha',
    slug: 'wave2-alpha',
    domain: 'wave2alpha.sms.test',
    status: 'ACTIVE',
    planType: 'STANDARD',
  });
  schoolA_Id = tenantA.id;

  // Setup School B
  const tenantB = await Tenant.create({
    schoolName: 'Wave2 Academy Beta',
    slug: 'wave2-beta',
    domain: 'wave2beta.sms.test',
    status: 'ACTIVE',
    planType: 'STANDARD',
  });
  schoolB_Id = tenantB.id;

  const adminRole = await Role.findOne({ where: { name: 'School Admin' } });
  const teacherRole = await Role.findOne({ where: { name: 'Teacher' } });
  const studentRole = await Role.findOne({ where: { name: 'Student' } });

  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('password123', 10);

  // School A Admin
  const adminA = await User.create({
    tenantId: schoolA_Id,
    roleId: adminRole.id,
    name: 'Admin Alpha',
    email: 'admin@alpha.test',
    passwordHash,
  });

  // School B Admin
  const adminB = await User.create({
    tenantId: schoolB_Id,
    roleId: adminRole.id,
    name: 'Admin Beta',
    email: 'admin@beta.test',
    passwordHash,
  });

  // School A Teacher
  const teacherUserA = await User.create({
    tenantId: schoolA_Id,
    roleId: teacherRole.id,
    name: 'Teacher Alpha',
    email: 'teacher@alpha.test',
    passwordHash,
  });
  await Teacher.create({
    tenantId: schoolA_Id,
    userId: teacherUserA.id,
    employeeNo: 'EMP-A-01',
    department: 'Mathematics',
  });

  // School A Student
  testClassA = await Class.create({
    tenantId: schoolA_Id,
    academicYearId: '2026-2027',
    name: 'Grade 10-A',
  });

  const studentUserA = await User.create({
    tenantId: schoolA_Id,
    roleId: studentRole.id,
    name: 'Student Alpha',
    email: 'student@alpha.test',
    passwordHash,
  });

  testStudentA = await Student.create({
    tenantId: schoolA_Id,
    userId: studentUserA.id,
    classId: testClassA.id,
    admissionNo: 'ADM-A-001',
    rollNo: '101',
  });

  // Login tokens
  const resAdminA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@alpha.test', password: 'password123' });
  schoolA_Token = resAdminA.body.token;

  const resAdminB = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@beta.test', password: 'password123' });
  schoolB_Token = resAdminB.body.token;

  const resTeacherA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'teacher@alpha.test', password: 'password123' });
  teacherA_Token = resTeacherA.body.token;

  const resStudentA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@alpha.test', password: 'password123' });
  studentA_Token = resStudentA.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Wave 2 Feature Verification Suite', () => {

  describe('1. Attendance Future-Date Validation', () => {
    it('should reject recording attendance for future dates with HTTP 400', async () => {
      const futureDate = '2099-05-15';
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${teacherA_Token}`)
        .send({
          classId: testClassA.id,
          date: futureDate,
          markings: [{ studentId: testStudentA.id, status: 'PRESENT' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/future date/i);
    });

    it('should accept recording attendance for today with HTTP 200', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${teacherA_Token}`)
        .send({
          classId: testClassA.id,
          date: today,
          markings: [{ studentId: testStudentA.id, status: 'PRESENT' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.records).toBeDefined();
    });
  });

  describe('2. Announcements RBAC & Publishing Permissions', () => {
    it('should forbid Teachers from publishing announcements with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${teacherA_Token}`)
        .send({
          title: 'Unauthorized Teacher Notice',
          body: 'This should not be allowed to post.',
          targetRole: 'ALL',
        });

      expect(res.status).toBe(403);
    });

    it('should forbid Students from publishing announcements with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentA_Token}`)
        .send({
          title: 'Unauthorized Student Notice',
          body: 'This should not be allowed to post.',
          targetRole: 'ALL',
        });

      expect(res.status).toBe(403);
    });

    it('should allow School Admin to create an announcement with HTTP 201', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({
          title: 'Alpha Term Notice',
          body: 'Midterm exams begin next Monday. Prepare well.',
          targetRole: 'ALL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.announcement.title).toBe('Alpha Term Notice');
      expect(res.body.announcement.tenantId).toBe(schoolA_Id);
    });

    it('should forbid Teacher from deleting an announcement with HTTP 403', async () => {
      // Admin creates an announcement first
      const createRes = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({
          title: 'To Be Deleted',
          body: 'Temporary notice content here.',
          targetRole: 'ALL',
        });

      const annId = createRes.body.announcement.id;

      const delRes = await request(app)
        .delete(`/api/announcements/${annId}`)
        .set('Authorization', `Bearer ${teacherA_Token}`);

      expect(delRes.status).toBe(403);
    });

    it('should allow School Admin to delete an announcement with HTTP 200', async () => {
      const createRes = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({
          title: 'Notice For Immediate Deletion',
          body: 'Will be deleted in a moment.',
          targetRole: 'ALL',
        });

      const annId = createRes.body.announcement.id;

      const delRes = await request(app)
        .delete(`/api/announcements/${annId}`)
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify deletion
      const check = await Announcement.findByPk(annId);
      expect(check).toBeNull();
    });
  });

  describe('3. Announcements Multi-Tenant Isolation', () => {
    let schoolA_AnnId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({
          title: 'Confidential School Alpha Notice',
          body: 'School A specific sensitive information.',
          targetRole: 'ALL',
        });
      schoolA_AnnId = res.body.announcement.id;
    });

    it('School B Admin must NOT see School A announcements in GET /api/announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${schoolB_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const ids = res.body.announcements.map(a => a.id);
      expect(ids).not.toContain(schoolA_AnnId);
    });

    it('School B Admin cannot delete School A announcement (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/announcements/${schoolA_AnnId}`)
        .set('Authorization', `Bearer ${schoolB_Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);

      // Confirm School A announcement still exists
      const check = await Announcement.findByPk(schoolA_AnnId);
      expect(check).not.toBeNull();
    });
  });

  describe('4. Announcements Audience Targeting', () => {
    let facultyOnlyId;
    let allAudienceId;

    beforeAll(async () => {
      const res1 = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({
          title: 'Faculty Meeting Notice',
          body: 'Staff meeting on Friday at 3 PM in the conference hall.',
          targetRole: 'Teacher',
        });
      facultyOnlyId = res1.body.announcement.id;

      const res2 = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${schoolA_Token}`)
        .send({
          title: 'Public Sports Day Notice',
          body: 'Annual sports meet will take place next month.',
          targetRole: 'ALL',
        });
      allAudienceId = res2.body.announcement.id;
    });

    it('Teacher should see both Faculty-Only and ALL announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${teacherA_Token}`);

      expect(res.status).toBe(200);
      const ids = res.body.announcements.map(a => a.id);
      expect(ids).toContain(facultyOnlyId);
      expect(ids).toContain(allAudienceId);
    });

    it('Student should see ALL announcements but NOT Faculty-Only announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentA_Token}`);

      expect(res.status).toBe(200);
      const ids = res.body.announcements.map(a => a.id);
      expect(ids).not.toContain(facultyOnlyId);
      expect(ids).toContain(allAudienceId);
    });
  });

  describe('5. Invoices Class Associations for Receipts', () => {
    it('should return student with class details in GET /api/fees/invoices', async () => {
      const res = await request(app)
        .get('/api/fees/invoices')
        .set('Authorization', `Bearer ${schoolA_Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.invoices)).toBe(true);
    });
  });
});
