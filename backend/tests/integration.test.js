process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'school_management_test';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test_secret_key';

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize, User, Role, Student, Teacher, Class, Section, Subject, Attendance, Exam, ExamSubject, Mark, Invoice, Payment } = require('../src/models');
const seedDatabase = require('../src/utils/seeder');

let app;
let server;
let adminToken;
let teacherToken;
let studentToken;
let parentToken;

let studentId;
let classId;
let subjectId;
let examSubjectId;
let invoiceId;

beforeAll(async () => {
  // Sync clean test database
  await sequelize.sync({ force: true });
  await seedDatabase();

  // Load Express app setup for testing
  app = express();
  app.use(express.json());
  
  // Mount routes
  const { protect } = require('../src/middleware/auth');
  const { verifyTenant } = require('../src/middleware/tenantGuard');

  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/students', protect, verifyTenant, require('../src/routes/studentRoutes'));
  app.use('/api/teachers', protect, verifyTenant, require('../src/routes/teacherRoutes'));
  app.use('/api/academics', protect, verifyTenant, require('../src/routes/academicsRoutes'));
  app.use('/api/attendance', protect, verifyTenant, require('../src/routes/attendanceRoutes'));
  app.use('/api/exams', protect, verifyTenant, require('../src/routes/examRoutes'));
  app.use('/api/fees', protect, verifyTenant, require('../src/routes/feeRoutes'));
  app.use('/api/dashboard', protect, verifyTenant, require('../src/routes/dashboardRoutes'));
  
  const errorHandler = require('../src/middleware/errorHandler');
  app.use(errorHandler);
  
  // Setup local server to keep tests self-contained
  server = app.listen(5001);

  // Generate tokens for testing RBAC
  // Login default Super Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@school.com', password: 'adminpassword' });
  adminToken = adminRes.body.token;

  // Register Teacher
  const teacherRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Teacher',
      email: 'teacher@school.com',
      password: 'password123',
      roleName: 'Teacher',
      department: 'Mathematics'
    });
  teacherToken = teacherRes.body.token;

  // Register Parent
  const parentRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Parent',
      email: 'parent@school.com',
      password: 'password123',
      roleName: 'Parent'
    });
  parentToken = parentRes.body.token;
  const parentUserId = parentRes.body.user.id;

  // Register Student linked to Parent
  const studentRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Student',
      email: 'student@school.com',
      password: 'password123',
      roleName: 'Student',
      parentId: parentUserId
    });
  studentToken = studentRes.body.token;
  studentId = studentRes.body.user.profile.id;
});

afterAll(async () => {
  if (server) await server.close();
  await sequelize.close();
});

describe('School Management System integration tests', () => {
  
  // 1. RBAC Tests
  it('should restrict Master creation routes to Admins', async () => {
    // Attempt creating Class as a Student (should fail)
    const failRes = await request(app)
      .post('/api/academics/classes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Class 10', academicYearId: '2026-2027' });
    
    expect(failRes.status).toBe(403);
    expect(failRes.body.message).toContain('Forbidden');

    // Create Class as Admin (should succeed)
    const successRes = await request(app)
      .post('/api/academics/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Class 10', academicYearId: '2026-2027' });

    expect(successRes.status).toBe(201);
    expect(successRes.body.class.name).toBe('Class 10');
    classId = successRes.body.class.id;
  });

  // 2. Attendance Integrity Tests
  it('should bulk mark attendance and overwrite/prevent duplicate logs', async () => {
    // Assign student to the created class first
    await Student.update({ classId }, { where: { id: studentId } });

    const attendanceDate = '2026-08-28';

    // First bulk mark attendance
    const firstRes = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId,
        date: attendanceDate,
        markings: [{ studentId, status: 'PRESENT' }]
      });

    expect(firstRes.status).toBe(200);
    expect(firstRes.body.records[0].status).toBe('PRESENT');

    // Mark again (should overwrite the existing row, preventing DB index crashes)
    const secondRes = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId,
        date: attendanceDate,
        markings: [{ studentId, status: 'LATE' }]
      });

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.records[0].status).toBe('LATE');

    // Check database row count (must be exactly 1 record for this student on this date)
    const dbCount = await Attendance.count({ where: { studentId, date: attendanceDate } });
    expect(dbCount).toBe(1);
  });

  // 3. Marks Validation Tests
  it('should validate max marks limits during submissions', async () => {
    // Create Subject
    const subRes = await request(app)
      .post('/api/academics/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Algebra', code: 'MATH101' });
    subjectId = subRes.body.subject.id;

    // Create Exam
    const examRes = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Midterm Exam',
        academicYearId: '2026-2027',
        startDate: '2026-09-01',
        endDate: '2026-09-05'
      });
    const examId = examRes.body.exam.id;

    // Add subject schedule to Exam (max marks = 100)
    const schedRes = await request(app)
      .post(`/api/exams/${examId}/schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectId,
        classId,
        examDate: '2026-09-02',
        maxMarks: 100
      });
    examSubjectId = schedRes.body.schedule.id;

    // Try submitting mark = 105 (should be rejected)
    const failMark = await request(app)
      .post(`/api/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        examSubjectId,
        markings: [{ studentId, marksObtained: 105 }]
      });

    expect(failMark.status).toBe(400);
    expect(failMark.body.message).toContain('exceed maximum marks');

    // Submit mark = 85 (should succeed, auto-assign grade B)
    const passMark = await request(app)
      .post(`/api/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        examSubjectId,
        markings: [{ studentId, marksObtained: 85 }]
      });

    expect(passMark.status).toBe(200);
    expect(passMark.body.marks[0].grade).toBe('B');
  });

  // 4. Financial Invoice Payments and Transactional Integrity
  it('should execute fee payments, balance calculations, and invoice transitions', async () => {
    // Create an Invoice manually for testing payments
    const invoice = await Invoice.create({
      studentId,
      totalAmount: 1500.00,
      paidAmount: 0.00,
      dueAmount: 1500.00,
      status: 'UNPAID'
    });
    invoiceId = invoice.id;

    // Try paying $1600 (should fail as it exceeds invoice total)
    const failPay = await request(app)
      .post(`/api/fees/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ amountPaid: 1600.00, paymentMethod: 'Card' });

    expect(failPay.status).toBe(400);
    expect(failPay.body.message).toContain('Overpayment Error');

    // Pay $500 (partial payment, status should become PARTIAL)
    const partialPay = await request(app)
      .post(`/api/fees/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ amountPaid: 500.00, paymentMethod: 'Card' });

    expect(partialPay.status).toBe(200);
    expect(parseFloat(partialPay.body.invoice.paidAmount)).toBe(500.00);
    expect(parseFloat(partialPay.body.invoice.dueAmount)).toBe(1000.00);
    expect(partialPay.body.invoice.status).toBe('PARTIAL');

    // Pay remaining $1000 (final payment, status should become PAID)
    const finalPay = await request(app)
      .post(`/api/fees/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ amountPaid: 1000.00, paymentMethod: 'Card' });

    expect(finalPay.status).toBe(200);
    expect(parseFloat(finalPay.body.invoice.paidAmount)).toBe(1500.00);
    expect(parseFloat(finalPay.body.invoice.dueAmount)).toBe(0.00);
    expect(finalPay.body.invoice.status).toBe('PAID');
  });
});
