const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const tenantStorage = require('../utils/tenantContext');

const Role = require('./Role');
const User = require('./User');
const Teacher = require('./Teacher');
const Student = require('./Student');
const Class = require('./Class');
const Section = require('./Section');
const Subject = require('./Subject');
const ClassSubject = require('./ClassSubject');
const Attendance = require('./Attendance');
const Exam = require('./Exam');
const ExamSubject = require('./ExamSubject');
const Mark = require('./Mark');
const FeeStructure = require('./FeeStructure');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const AuditLog = require('./AuditLog');
const Timetable = require('./Timetable');
const Tenant = require('./Tenant');
const PlatformAdmin = require('./PlatformAdmin');
const SubscriptionPlan = require('./SubscriptionPlan');
const PlatformAuditLog = require('./PlatformAuditLog');
const Announcement = require('./Announcement');
const AcademicYear = require('./AcademicYear');
const TenantSubscription = require('./TenantSubscription');
const PlatformPayment = require('./PlatformPayment');
const PlatformWebhookEvent = require('./PlatformWebhookEvent');

const tenantModels = [
  User, Teacher, Student, Class, Section, Subject, ClassSubject,
  Attendance, Exam, ExamSubject, Mark, FeeStructure, Invoice,
  Payment, AuditLog, Timetable, Announcement, AcademicYear
];

// 2. Query Hooks for Multi-Tenant Isolation (Applied on each tenant model class)
tenantModels.forEach(model => {
  model.addHook('beforeFind', (options) => {
    try {
      const tenantId = tenantStorage.getStore();
      if (tenantId) {
        if (!options.where) {
          options.where = {};
        }
        options.where.tenantId = tenantId;
      }
    } catch (err) {
      console.error(`ERROR IN beforeFind HOOK FOR ${model.name}:`, err);
      throw err;
    }
  });

  model.addHook('beforeValidate', (instance) => {
    try {
      if (!instance.tenantId) {
        const tenantId = tenantStorage.getStore();
        if (tenantId) {
          instance.tenantId = tenantId;
        }
      }
    } catch (err) {
      console.error(`ERROR IN beforeValidate HOOK FOR ${model.name}:`, err);
      throw err;
    }
  });

  model.addHook('beforeBulkCreate', (instances) => {
    try {
      const tenantId = tenantStorage.getStore();
      if (tenantId) {
        instances.forEach(instance => {
          if (!instance.tenantId) {
            instance.tenantId = tenantId;
          }
        });
      }
    } catch (err) {
      console.error(`ERROR IN beforeBulkCreate HOOK FOR ${model.name}:`, err);
      throw err;
    }
  });
});

// 3. Role & User Associations
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// 4. User & Teacher
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacher' });

// 5. User & Student
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Student, { foreignKey: 'userId', as: 'student' });

// 6. Student & Parent (User)
Student.belongsTo(User, { foreignKey: 'parentId', as: 'parent' });
User.hasMany(Student, { foreignKey: 'parentId', as: 'children' });

// 7. Student & Class & Section
Student.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Class.hasMany(Student, { foreignKey: 'classId', as: 'students' });

Student.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
Section.hasMany(Student, { foreignKey: 'sectionId', as: 'students' });

// 8. Class & Section
Section.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Class.hasMany(Section, { foreignKey: 'classId', as: 'sections' });

// 9. Section & Teacher (Class Teacher)
Section.belongsTo(Teacher, { foreignKey: 'classTeacherId', as: 'classTeacher' });
Teacher.hasOne(Section, { foreignKey: 'classTeacherId', as: 'managedSection' });

// 10. Class, Subject, Teacher through ClassSubject
ClassSubject.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
ClassSubject.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
ClassSubject.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

Class.belongsToMany(Subject, { through: ClassSubject, foreignKey: 'classId', otherKey: 'subjectId', as: 'subjects' });
Subject.belongsToMany(Class, { through: ClassSubject, foreignKey: 'subjectId', otherKey: 'classId', as: 'classes' });

// 11. Attendance
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });

Attendance.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Class.hasMany(Attendance, { foreignKey: 'classId', as: 'attendances' });

Attendance.belongsTo(User, { foreignKey: 'markedBy', as: 'marker' });

// 12. Exams & ExamSubjects
ExamSubject.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
Exam.hasMany(ExamSubject, { foreignKey: 'examId', as: 'examSubjects' });

ExamSubject.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
ExamSubject.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// 13. Marks
Mark.belongsTo(ExamSubject, { foreignKey: 'examSubjectId', as: 'examSubject' });
ExamSubject.hasMany(Mark, { foreignKey: 'examSubjectId', as: 'marks' });

Mark.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(Mark, { foreignKey: 'studentId', as: 'marks' });

// 14. Fee Structure
FeeStructure.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Class.hasMany(FeeStructure, { foreignKey: 'classId', as: 'feeStructures' });

// 15. Invoice
Invoice.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(Invoice, { foreignKey: 'studentId', as: 'invoices' });

// 16. Payment
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });

// 17. Audit Logs
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 18. Timetables
Timetable.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Timetable.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Timetable.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Class.hasMany(Timetable, { foreignKey: 'classId', as: 'timetables' });
Subject.hasMany(Timetable, { foreignKey: 'subjectId', as: 'timetables' });
Teacher.hasMany(Timetable, { foreignKey: 'teacherId', as: 'timetables' });

// 19. Tenant Associations
tenantModels.forEach(model => {
  model.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  Tenant.hasMany(model, { foreignKey: 'tenantId', as: model.name.toLowerCase() + 's' });
});

// 20. Platform Admin & Audit Logs Associations
PlatformAuditLog.belongsTo(PlatformAdmin, { foreignKey: 'adminId', as: 'admin' });
PlatformAdmin.hasMany(PlatformAuditLog, { foreignKey: 'adminId', as: 'auditLogs' });

PlatformAuditLog.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Tenant.hasMany(PlatformAuditLog, { foreignKey: 'tenantId', as: 'platformAuditLogs' });

Tenant.belongsTo(SubscriptionPlan, { foreignKey: 'planType', targetKey: 'name', as: 'subscriptionPlan', constraints: false });
SubscriptionPlan.hasMany(Tenant, { foreignKey: 'planType', sourceKey: 'name', as: 'tenants', constraints: false });

// 21. Announcements
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });
User.hasMany(Announcement, { foreignKey: 'createdBy', as: 'announcements' });

// 22. Academic Years
AcademicYear.hasMany(Class, { foreignKey: 'academicYearId', as: 'classes' });
Class.belongsTo(AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });

AcademicYear.hasMany(Exam, { foreignKey: 'academicYearId', as: 'exams' });
Exam.belongsTo(AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });

AcademicYear.hasMany(FeeStructure, { foreignKey: 'academicYearId', as: 'feeStructures' });
FeeStructure.belongsTo(AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });

// 23. Platform Billing & Subscriptions (Razorpay)
Tenant.hasOne(TenantSubscription, { foreignKey: 'tenantId', as: 'subscription' });
TenantSubscription.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

Tenant.hasMany(PlatformPayment, { foreignKey: 'tenantId', as: 'platformPayments' });
PlatformPayment.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

TenantSubscription.hasMany(PlatformPayment, { foreignKey: 'subscriptionId', as: 'payments' });
PlatformPayment.belongsTo(TenantSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

module.exports = {
  sequelize,
  Role,
  User,
  Teacher,
  Student,
  Class,
  Section,
  Subject,
  ClassSubject,
  Attendance,
  Exam,
  ExamSubject,
  Mark,
  FeeStructure,
  Invoice,
  Payment,
  AuditLog,
  Timetable,
  Tenant,
  PlatformAdmin,
  SubscriptionPlan,
  PlatformAuditLog,
  Announcement,
  AcademicYear,
  TenantSubscription,
  PlatformPayment,
  PlatformWebhookEvent,
};
