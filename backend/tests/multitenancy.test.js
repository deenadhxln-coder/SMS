require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.JWT_SECRET = 'test_secret_key';
if (process.env.TEST_DB_NAME) {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
}

const request = require('supertest');
const express = require('express');
const { sequelize, Tenant, User, Class, Student, AuditLog } = require('../src/models');
const seedDatabase = require('../src/utils/seeder');

let app;
let server;
let superAdminToken;
let schoolA_Token;
let schoolB_Token;
let schoolA_Id;
let schoolB_Id;

beforeAll(async () => {
  // Sync clean test database
  await sequelize.sync({ force: true });
  await seedDatabase();

  app = express();
  app.use(express.json());

  // Mount routes
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

  const redisClient = require('../src/config/redis');
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', env: config.nodeEnv, timestamp: new Date() });
  });
  app.get('/health/liveness', (req, res) => {
    res.status(200).json({ status: 'UP', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });
  app.get('/health/readiness', async (req, res) => {
    try {
      await sequelize.authenticate();
      const redisStatus = typeof redisClient.isRedisConnected === 'function'
        ? (redisClient.isRedisConnected() ? 'UP' : 'DEGRADED')
        : 'UP';
      return res.status(200).json({ status: 'READY', db: 'UP', redis: redisStatus, timestamp: new Date().toISOString() });
    } catch (error) {
      return res.status(503).json({ status: 'UNAVAILABLE', db: 'DOWN', message: 'Database connection failure', timestamp: new Date().toISOString() });
    }
  });

  // 404 JSON Catch-All
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
  });

  const errorHandler = require('../src/middleware/errorHandler');
  app.use(errorHandler);

  // Login Super Admin
  const saRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@school.com', password: 'adminpassword' });
  superAdminToken = saRes.body.token;

  // Onboard School A (Free Tier)
  const aRes = await request(app)
    .post('/api/superadmin/tenants')
    .set('Authorization', `Bearer ${superAdminToken}`)
    .send({
      schoolName: 'School A',
      slug: 'school-a',
      planType: 'FREE',
      adminName: 'Admin A',
      adminEmail: 'admin@schoola.com',
      adminPassword: 'password123'
    });
  schoolA_Id = aRes.body.tenant.id;

  // Onboard School B (Premium Tier)
  const bRes = await request(app)
    .post('/api/superadmin/tenants')
    .set('Authorization', `Bearer ${superAdminToken}`)
    .send({
      schoolName: 'School B',
      slug: 'school-b',
      planType: 'PREMIUM',
      adminName: 'Admin B',
      adminEmail: 'admin@schoolb.com',
      adminPassword: 'password123'
    });
  schoolB_Id = bRes.body.tenant.id;

  // Get Admin Tokens
  const loginARes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@schoola.com', password: 'password123' });
  schoolA_Token = loginARes.body.token;

  const loginBRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@schoolb.com', password: 'password123' });
  schoolB_Token = loginBRes.body.token;
}, 60000);



describe('SaaS Multi-Tenant Isolation Tests', () => {

  it('should ensure School A cannot see classes of School B', async () => {
    // 1. Create class in School A
    const classARes = await request(app)
      .post('/api/academics/classes')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({ name: 'Grade 10-A', academicYearId: '2026-2027' });
    
    expect(classARes.status).toBe(201);

    // 2. Query classes as School B (should be empty!)
    const getBRes = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', `Bearer ${schoolB_Token}`);

    expect(getBRes.status).toBe(200);
    expect(getBRes.body.classes.length).toBe(0); // Cannot see School A's class!
  });

  it('should ensure School B can create its own classes and get isolated results', async () => {
    // Create class in School B
    const classBRes = await request(app)
      .post('/api/academics/classes')
      .set('Authorization', `Bearer ${schoolB_Token}`)
      .send({ name: 'Grade 10-B', academicYearId: '2026-2027' });

    expect(classBRes.status).toBe(201);

    // Query classes as School A (should only see Grade 10-A, not Grade 10-B)
    const getARes = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(getARes.status).toBe(200);
    expect(getARes.body.classes.length).toBe(1);
    expect(getARes.body.classes[0].name).toBe('Grade 10-A');
  });

  it('should enforce student limits for FREE tier tenants', async () => {
    // Enroll 10 students in School A (Free plan allows max 10)
    for (let i = 1; i <= 10; i++) {
      await Student.create({
        admissionNo: `A-ADM-${i}`,
        userId: (await User.create({
          name: `Student A-${i}`,
          email: `student.a.${i}@school.com`,
          passwordHash: 'hashed',
          roleId: 4, // Student role
          tenantId: schoolA_Id
        })).id,
        tenantId: schoolA_Id
      });
    }

    // Attempting to register the 11th student via the API (should block with 403)
    const enrollRes = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({
        name: 'Extra Student',
        email: 'extra@school.com',
        password: 'password123'
      });

    expect(enrollRes.status).toBe(403);
    expect(enrollRes.body.message).toContain('limit reached');
  });

  it('should allow unlimited student creation for PREMIUM tier tenants', async () => {
    // Premium plan is unlimited, so School B can enroll the 11th student easily
    const enrollBRes = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${schoolB_Token}`)
      .send({
        name: 'Premium Student',
        email: 'premium.std@school.com',
        password: 'password123'
      });

    expect(enrollBRes.status).toBe(201);
  });
});

describe('Phase 3 Security & Hardening Tests', () => {
  let studentB_Id;

  beforeAll(async () => {
    // Create a student in School B for IDOR testing
    const createRes = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${schoolB_Token}`)
      .send({
        name: 'School B Student',
        email: 'student.b.target@school.com',
        password: 'password123'
      });
    studentB_Id = createRes.body.student.id;
  });

  it('1. School A cannot GET School B student by ID (IDOR Prevention)', async () => {
    const res = await request(app)
      .get(`/api/students/${studentB_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });

  it('2. School A cannot UPDATE School B student by ID (IDOR Prevention)', async () => {
    const res = await request(app)
      .put(`/api/students/${studentB_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(404);
  });

  it('3. School A cannot DELETE School B student by ID (IDOR Prevention)', async () => {
    const res = await request(app)
      .delete(`/api/students/${studentB_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(res.status).toBe(404);
  });

  it('4. School A cannot access School B nested exam report-card data', async () => {
    const res = await request(app)
      .get(`/api/exams/report-card/${studentB_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found in this school tenant');
  });

  it('5. School user cannot access platform Super Admin routes', async () => {
    const res = await request(app)
      .get('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('6. Forged roleName: "School Admin" in registration is rejected (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({
        name: 'Attacker Admin',
        email: 'attacker.admin@school.com',
        password: 'password123',
        roleName: 'School Admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid or unauthorized role');
  });

  it('7. Forged roleName: "Super Admin" in registration is rejected (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({
        name: 'Attacker Super',
        email: 'attacker.super@school.com',
        password: 'password123',
        roleName: 'Super Admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid or unauthorized role');
  });

  it('8. Unauthenticated registration without trusted tenant context fails closed (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Unauth User',
        email: 'unauth@school.com',
        password: 'password123',
        roleName: 'Student'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Tenant context required');
  });

  it('9. Forged tenantId in request body is ignored and strictly assigned to authenticated tenant', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${schoolB_Token}`)
      .send({
        name: 'Forged Body Student',
        email: 'forged.body@school.com',
        password: 'password123',
        tenantId: schoolA_Id // Attempt to inject into School A
      });

    expect(res.status).toBe(201);
    expect(res.body.student.tenantId).toBe(schoolB_Id); // Must belong to School B!
  });

  it('10. Forged x-tenant-id header from school user is completely ignored', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .set('x-tenant-id', schoolB_Id); // School A attempting to view School B via header

    expect(res.status).toBe(200);
    // Verified that all returned students belong to School A
    res.body.students.forEach(s => {
      expect(s.tenantId).toBe(schoolA_Id);
    });
  });

  it('11. Super Admin with non-existent x-tenant-id returns 404', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Target school tenant not found');
  });

  it('12. Concurrent requests maintain strictly isolated tenant contexts', async () => {
    // Fire 10 interleaved concurrent requests for School A and School B
    const requests = [];
    for (let i = 0; i < 10; i++) {
      const isEven = i % 2 === 0;
      const token = isEven ? schoolA_Token : schoolB_Token;
      const expectedTenantId = isEven ? schoolA_Id : schoolB_Id;

      requests.push(
        request(app)
          .get('/api/academics/classes')
          .set('Authorization', `Bearer ${token}`)
          .then(res => ({ res, expectedTenantId }))
      );
    }

    const results = await Promise.all(requests);
    results.forEach(({ res, expectedTenantId }) => {
      expect(res.status).toBe(200);
      res.body.classes.forEach(c => {
        expect(c.tenantId).toBe(expectedTenantId);
      });
    });
  });
});

describe('Phase 4 Security & Authorization Tests', () => {
  let student1_Id;
  let student2_Id;
  let student1_Token;
  let parent1_Token;
  let teacherA_Token;
  let classB_Id;
  let invoiceB_Id;
  let invoiceStudent2_Id;

  beforeAll(async () => {
    // 1. Create Parent 1 in School A
    const parent1User = await User.create({
      name: 'Parent One',
      email: 'parent1@schoola.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 5, // Parent
      tenantId: schoolA_Id
    });

    // 2. Create Student 1 in School A linked to Parent 1
    const student1User = await User.create({
      name: 'Student One',
      email: 'student1@schoola.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 4, // Student
      tenantId: schoolA_Id
    });
    const s1 = await Student.create({
      admissionNo: 'ADM-S1-TEST',
      userId: student1User.id,
      parentId: parent1User.id,
      tenantId: schoolA_Id
    });
    student1_Id = s1.id;

    // 3. Create Student 2 in School A (unrelated student)
    const student2User = await User.create({
      name: 'Student Two',
      email: 'student2@schoola.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 4, // Student
      tenantId: schoolA_Id
    });
    const s2 = await Student.create({
      admissionNo: 'ADM-S2-TEST',
      userId: student2User.id,
      tenantId: schoolA_Id
    });
    student2_Id = s2.id;

    // 4. Create Teacher in School A
    const teacherUser = await User.create({
      name: 'Teacher One',
      email: 'teacher1@schoola.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 3, // Teacher
      tenantId: schoolA_Id
    });
    await require('../src/models').Teacher.create({
      employeeNo: 'EMP-T1-TEST',
      userId: teacherUser.id,
      department: 'Science',
      tenantId: schoolA_Id
    });

    // 5. Create Class in School B
    const classB = await Class.create({
      name: 'Class B Remote',
      academicYearId: '2026-2027',
      tenantId: schoolB_Id
    });
    classB_Id = classB.id;

    // 6. Create Student & Invoice in School B
    const studentBUser = await User.create({
      name: 'Student B Fee',
      email: 'studentb.fee@schoolb.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 4,
      tenantId: schoolB_Id
    });
    const studentB = await Student.create({
      admissionNo: 'ADM-SB-FEE',
      userId: studentBUser.id,
      tenantId: schoolB_Id
    });
    const invB = await require('../src/models').Invoice.create({
      studentId: studentB.id,
      totalAmount: 1000.00,
      paidAmount: 0.00,
      dueAmount: 1000.00,
      status: 'UNPAID',
      tenantId: schoolB_Id
    });
    invoiceB_Id = invB.id;

    // 7. Create Invoice for Student 2 in School A
    const invS2 = await require('../src/models').Invoice.create({
      studentId: student2_Id,
      totalAmount: 500.00,
      paidAmount: 0.00,
      dueAmount: 500.00,
      status: 'UNPAID',
      tenantId: schoolA_Id
    });
    invoiceStudent2_Id = invS2.id;

    // Login tokens
    const lS1 = await request(app).post('/api/auth/login').send({ email: 'student1@schoola.com', password: 'password123' });
    student1_Token = lS1.body.token;

    const lP1 = await request(app).post('/api/auth/login').send({ email: 'parent1@schoola.com', password: 'password123' });
    parent1_Token = lP1.body.token;

    const lT1 = await request(app).post('/api/auth/login').send({ email: 'teacher1@schoola.com', password: 'password123' });
    teacherA_Token = lT1.body.token;
  });

  it('1. Student cannot access another student profile (BOLA Prevention - 403)', async () => {
    // Student 1 accesses own profile -> 200 OK
    const ownRes = await request(app)
      .get(`/api/students/${student1_Id}`)
      .set('Authorization', `Bearer ${student1_Token}`);
    expect(ownRes.status).toBe(200);

    // Student 1 accesses Student 2 profile -> 403 Forbidden
    const otherRes = await request(app)
      .get(`/api/students/${student2_Id}`)
      .set('Authorization', `Bearer ${student1_Token}`);
    expect(otherRes.status).toBe(403);
    expect(otherRes.body.message).toContain('Unauthorized access to student profile');
  });

  it('2. Parent cannot access unrelated student profile (BOLA Prevention - 403)', async () => {
    // Parent 1 accesses own child (Student 1) -> 200 OK
    const childRes = await request(app)
      .get(`/api/students/${student1_Id}`)
      .set('Authorization', `Bearer ${parent1_Token}`);
    expect(childRes.status).toBe(200);

    // Parent 1 accesses unrelated student (Student 2) -> 403 Forbidden
    const nonChildRes = await request(app)
      .get(`/api/students/${student2_Id}`)
      .set('Authorization', `Bearer ${parent1_Token}`);
    expect(nonChildRes.status).toBe(403);
    expect(nonChildRes.body.message).toContain('Unauthorized access to student profile');
  });

  it('3. School A cannot UPDATE School B class by ID (Academic IDOR - 404)', async () => {
    const res = await request(app)
      .put(`/api/academics/classes/${classB_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({ name: 'Hacked Class Name' });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Class not found');
  });

  it('4. School A cannot DELETE School B class by ID (Academic IDOR - 404)', async () => {
    const res = await request(app)
      .delete(`/api/academics/classes/${classB_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Class not found');
  });

  it('5. School A cannot see School B fee structures', async () => {
    // Create fee structure in School B
    await require('../src/models').FeeStructure.create({
      classId: classB_Id,
      title: 'School B Tuition',
      amount: 2500.00,
      academicYearId: '2026-2027',
      tenantId: schoolB_Id
    });

    // Query fee structures as School A
    const res = await request(app)
      .get('/api/fees/structures')
      .set('Authorization', `Bearer ${schoolA_Token}`);

    expect(res.status).toBe(200);
    const hasSchoolBStructure = res.body.structures.some(s => s.tenantId === schoolB_Id);
    expect(hasSchoolBStructure).toBe(false);
  });

  it('6. School A cannot pay School B invoice (Payment IDOR - 404)', async () => {
    const res = await request(app)
      .post(`/api/fees/invoices/${invoiceB_Id}/payments`)
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({ amountPaid: 100, paymentMethod: 'CASH' });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Invoice not found');
  });

  it('7. Parent cannot pay invoice of an unrelated student (Payment BOLA - 403)', async () => {
    const res = await request(app)
      .post(`/api/fees/invoices/${invoiceStudent2_Id}/payments`)
      .set('Authorization', `Bearer ${parent1_Token}`)
      .send({ amountPaid: 100, paymentMethod: 'ONLINE' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Unauthorized payment attempt');
  });

  it('8. Cross-tenant foreign key injection in student enrollment is rejected (400)', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({
        name: 'Injected Student',
        email: 'injected.student@schoola.com',
        password: 'password123',
        classId: classB_Id // School B's class ID!
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Referenced class not found in this school');
  });

  it('9. Cross-tenant foreign key injection in section creation is rejected (400)', async () => {
    const res = await request(app)
      .post('/api/academics/sections')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({
        name: 'Section Injected',
        classId: classB_Id // School B's class ID!
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Referenced class not found in this school');
  });

  it('10. Cross-tenant attendance marking is rejected (400)', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({
        classId: classB_Id, // School B's class ID!
        date: '2026-09-02',
        markings: [{ studentId: student1_Id, status: 'PRESENT' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Referenced class not found in this school');
  });

  it('11. Role boundary matrix: unauthorized roles are rejected (403)', async () => {
    // Student attempting to create a class
    const res1 = await request(app)
      .post('/api/academics/classes')
      .set('Authorization', `Bearer ${student1_Token}`)
      .send({ name: 'Hacked Class', academicYearId: '2026-2027' });
    expect(res1.status).toBe(403);

    // Parent attempting to enroll a student
    const res2 = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${parent1_Token}`)
      .send({ name: 'Child Extra', email: 'child.extra@schoola.com', password: 'password123' });
    expect(res2.status).toBe(403);

    // Teacher attempting to soft-delete a student
    const res3 = await request(app)
      .delete(`/api/students/${student1_Id}`)
      .set('Authorization', `Bearer ${teacherA_Token}`);
    expect(res3.status).toBe(403);

    // School Admin attempting to access platform audit logs
    const res4 = await request(app)
      .get('/api/superadmin/audit-logs')
      .set('Authorization', `Bearer ${schoolA_Token}`);
    expect(res4.status).toBe(403);
  });

  it('12. Input validation: invalid enum values are rejected safely (400)', async () => {
    // Invalid plan type during tenant onboarding
    const res1 = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        schoolName: 'Invalid Tier School',
        slug: 'invalid-tier-school',
        planType: 'ULTIMATE_MEGA_TIER',
        adminName: 'Admin Bad',
        adminEmail: 'badtier@school.com',
        adminPassword: 'password123'
      });
    expect(res1.status).toBe(400);
    expect(res1.body.message).toContain('Invalid plan type');

    // Invalid status during student update
    const res2 = await request(app)
      .put(`/api/students/${student1_Id}`)
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({ status: 'PURGED' });
    expect(res2.status).toBe(400);
    expect(res2.body.message).toContain('Invalid status value');
  });
});

describe('Phase 5 Reliability, Error Handling & DB Safety Tests', () => {
  const jwt = require('jsonwebtoken');
  const config = require('../src/config/config');
  const { assertDestructiveResetAllowed } = require('../src/utils/resetDb');

  it('1. Missing authentication token returns 401 JSON', async () => {
    const res = await request(app).get('/api/academics/classes');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Not authorized, no token provided');
  });

  it('2. Malformed authentication token returns 401 JSON', async () => {
    const res = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', 'Bearer totally.invalid.malformed.jwt.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Not authorized, token failed');
  });

  it('3. Expired authentication token returns 401 JSON', async () => {
    // Generate expired JWT
    const expiredToken = jwt.sign(
      { id: '00000000-0000-0000-0000-000000000001', role: 'School Admin' },
      config.jwtSecret,
      { expiresIn: '-10s' }
    );

    const res = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Not authorized, token failed');
  });

  it('4. Deactivated (INACTIVE) user token is rejected with 401 JSON', async () => {
    // Create temporary user and deactivate
    const inactiveUser = await User.create({
      name: 'Deactivated User',
      email: 'deactivated.user@schoola.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 2, // School Admin
      status: 'INACTIVE',
      tenantId: schoolA_Id
    });

    const inactiveToken = jwt.sign(
      { id: inactiveUser.id, role: 'School Admin', tenantId: schoolA_Id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', `Bearer ${inactiveToken}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('User account is deactivated');
  });

  it('5. 404 Unknown API Route returns consistent JSON response', async () => {
    const res = await request(app).get('/api/totally-nonexistent-endpoint-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Resource not found: GET /api/totally-nonexistent-endpoint-route');
  });

  it('6. Malformed JSON payload in request body returns 400 JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ malformed_json_body: ');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid JSON payload');
  });

  it('7. Invalid UUID parameter format returns 400 JSON before DB query', async () => {
    const res = await request(app)
      .get('/api/students/not-a-valid-uuid-12345')
      .set('Authorization', `Bearer ${schoolA_Token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid identifier format for parameter 'id'. Expected UUID.");
  });

  it('8. Destructive DB reset multi-factor safety guard rejects unauthorized execution', () => {
    // Save original env
    const origEnv = { ...process.env };

    try {
      // Test 1: Rejection when NODE_ENV=production
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DESTRUCTIVE_DB_RESET = 'true';
      process.env.TEST_DB_NAME = 'test_db';
      expect(() => assertDestructiveResetAllowed()).toThrow(/strictly forbidden in production/i);

      // Test 2: Rejection without ALLOW_DESTRUCTIVE_DB_RESET
      process.env.NODE_ENV = 'test';
      delete process.env.ALLOW_DESTRUCTIVE_DB_RESET;
      expect(() => assertDestructiveResetAllowed()).toThrow(/requires explicit ALLOW_DESTRUCTIVE_DB_RESET=true/i);

      // Test 3: Rejection without TEST_DB_NAME
      process.env.ALLOW_DESTRUCTIVE_DB_RESET = 'true';
      delete process.env.TEST_DB_NAME;
      expect(() => assertDestructiveResetAllowed()).toThrow(/requires explicit TEST_DB_NAME/i);

      // Test 4: Rejection when DB name does not match TEST_DB_NAME
      process.env.TEST_DB_NAME = 'my_other_db_not_matching';
      expect(() => assertDestructiveResetAllowed()).toThrow(/does not match configured TEST_DB_NAME/i);
    } finally {
      process.env = origEnv;
    }
  });

  it('9. Transaction safety: multi-step write rolls back completely on mid-operation failure', async () => {
    const existingUser = await User.create({
      name: 'Existing Unique Email',
      email: 'existing.unique@schoolb.com',
      passwordHash: await require('bcryptjs').hash('password123', 10),
      roleId: 4,
      status: 'ACTIVE',
      tenantId: schoolB_Id
    });

    const studentsBeforeCount = await Student.count({ where: { tenantId: schoolB_Id } });

    // Attempt creating student with duplicate email in School B (PREMIUM tier)
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${schoolB_Token}`)
      .send({
        name: 'Duplicate Student',
        email: 'existing.unique@schoolb.com', // Duplicate!
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('User with this email already exists');

    // Verify student count did not change (transaction rolled back)
    const studentsAfterCount = await Student.count({ where: { tenantId: schoolB_Id } });
    expect(studentsAfterCount).toBe(studentsBeforeCount);
  });
});

describe('Phase 6 Operational, Health Probe & Deployment Readiness Tests', () => {
  it('1. GET /health/liveness returns HTTP 200 with process status and uptime', async () => {
    const res = await request(app).get('/health/liveness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  it('2. GET /health/readiness returns HTTP 200 with DB status when healthy', async () => {
    const res = await request(app).get('/health/readiness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.db).toBe('UP');
    expect(res.body.redis).toBeDefined();
  });

  it('3. GET /health/readiness returns HTTP 503 without leaking credentials if DB is unreachable', async () => {
    // Mock temporary sequelize authenticate failure
    const origAuthenticate = sequelize.authenticate;
    try {
      sequelize.authenticate = async () => {
        throw new Error('ETIMEDOUT: Connection pool exhausted to 10.0.1.25:3306');
      };

      const res = await request(app).get('/health/readiness');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('UNAVAILABLE');
      expect(res.body.db).toBe('DOWN');
      expect(res.body.message).toBe('Database connection failure');
      // Verify zero sensitive hostnames/passwords are leaked
      expect(JSON.stringify(res.body)).not.toContain('10.0.1.25');
      expect(JSON.stringify(res.body)).not.toContain('ETIMEDOUT');
    } finally {
      sequelize.authenticate = origAuthenticate;
    }
  });
});

describe('Phase 7 Security Hardening Tests (SEC-01, SEC-02, SEC-03)', () => {
  it('1. Student listing pagination limit parameter is safely capped at 100 max', async () => {
    const res = await request(app)
      .get('/api/students?limit=500')
      .set('Authorization', `Bearer ${schoolA_Token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });

  it('2. Teacher listing pagination limit parameter is safely capped at 100 max', async () => {
    const res = await request(app)
      .get('/api/teachers?limit=9999')
      .set('Authorization', `Bearer ${schoolA_Token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });

  it('3. Failed login logs LOGIN_FAILED audit event without credential leakage', async () => {
    // Attempt failed login with existing user
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@schoola.com', password: 'wrong_incorrect_password' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');

    // Verify audit log was recorded with action LOGIN_FAILED
    const auditRecord = await AuditLog.findOne({
      where: { action: 'LOGIN_FAILED', tenantId: schoolA_Id },
      order: [['timestamp', 'DESC']]
    });
    expect(auditRecord).not.toBeNull();
    expect(auditRecord.action).toBe('LOGIN_FAILED');
  });

  it('4. Normal valid login remains fully functional', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@schoola.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('School Admin');
  });

  it('5. Login rate limiter throttles excessive login attempts with 429', async () => {
    // Send repeated login requests to trigger the 15-req window limit
    let lastRes;
    for (let i = 0; i < 16; i++) {
      lastRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@schoola.com', password: 'wrong_password_test' });
    }
    expect(lastRes.status).toBe(429);
    expect(lastRes.body.success).toBe(false);
    expect(lastRes.body.message).toContain('Too many login attempts from this IP');
  });
});






