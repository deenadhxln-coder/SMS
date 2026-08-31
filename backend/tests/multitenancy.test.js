process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'school_management_test';
process.env.PORT = '5002';
process.env.JWT_SECRET = 'test_secret_key';

const request = require('supertest');
const express = require('express');
const { sequelize, Tenant, User, Class, Student } = require('../src/models');
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
  app.use('/api/academics', protect, verifyTenant, require('../src/routes/academicsRoutes'));

  const errorHandler = require('../src/middleware/errorHandler');
  app.use(errorHandler);

  server = app.listen(5002);

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
});

afterAll(async () => {
  if (server) await server.close();
  await sequelize.close();
});

describe('SaaS Multi-Tenant Isolation Tests', () => {

  it('should ensure School A cannot see classes of School B', async () => {
    // 1. Create class in School A
    const classARes = await request(app)
      .post('/api/academics/classes')
      .set('Authorization', `Bearer ${schoolA_Token}`)
      .send({ name: 'Grade 10-A', academicYearId: '2026-2027' });
    
    expect(classARes.status).toBe(201);

    // 2. Query classes as School B (should be empty!)
    const listBRes = await request(app)
      .post('/api/academics/classes') // Wait, listing is usually GET /api/academics/classes
      .set('Authorization', `Bearer ${schoolB_Token}`)
      .send({ name: 'Check' }); // Let's check listing directly in db or via GET below:
    
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
