const bcrypt = require('bcryptjs');
const { 
  Tenant, User, Role, Student, Teacher, Class, Section, Subject, 
  ClassSubject, Attendance, Exam, ExamSubject, Mark, FeeStructure, 
  Invoice, Payment, AuditLog, sequelize 
} = require('../src/models');

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const seed = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log('Resetting and cleaning database tables...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    
    const tables = [
      'payments', 'invoices', 'fee_structures', 'marks', 'exam_subjects', 'exams',
      'attendance', 'class_subjects', 'subjects', 'sections', 'classes', 'teachers',
      'students', 'users', 'roles', 'tenants', 'audit_logs'
    ];
    for (const table of tables) {
      await sequelize.query(`TRUNCATE TABLE \`${table}\``, { transaction });
    }
    console.log('Database cleaned.');

    // 1. Seed Roles
    await Role.bulkCreate([
      { id: 1, name: 'Super Admin' },
      { id: 2, name: 'School Admin' },
      { id: 3, name: 'Teacher' },
      { id: 4, name: 'Student' },
      { id: 5, name: 'Parent' }
    ], { transaction });
    console.log('Roles seeded.');

    // 2. Seed Super Admin User
    await User.create({
      name: 'Global Super Admin',
      email: 'superadmin@saasplatform.com',
      passwordHash: hashPassword('superadminpassword'),
      roleId: 1,
      status: 'ACTIVE',
      tenantId: null
    }, { transaction });
    console.log('Global Super Admin seeded.');

    // 3. Seed Tenants
    const tenantStX = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000001',
      schoolName: 'St. Xavier International School',
      slug: 'stxavier',
      planType: 'PREMIUM',
      status: 'ACTIVE'
    }, { transaction });

    const tenantOak = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000002',
      schoolName: 'Oakridge Academy',
      slug: 'oakridge',
      planType: 'STANDARD',
      status: 'ACTIVE'
    }, { transaction });
    console.log('Tenants seeded.');

    const tenants = [tenantStX, tenantOak];

    for (const tenant of tenants) {
      console.log(`Seeding data for school tenant: ${tenant.schoolName}...`);
      const suffix = tenant.slug === 'stxavier' ? 'stxavier.com' : 'oakridge.com';
      const shortSuffix = tenant.slug === 'stxavier' ? 'stx' : 'oak';

      // 4. Create School Admin
      await User.create({
        name: `${tenant.schoolName} Admin`,
        email: `admin@${suffix}`,
        passwordHash: hashPassword('password123'),
        roleId: 2,
        status: 'ACTIVE',
        tenantId: tenant.id
      }, { transaction });

      // 5. Create 5 Teachers
      const departments = ['Mathematics', 'Science', 'English', 'History', 'Computer Science'];
      const teachers = [];
      for (let i = 0; i < 5; i++) {
        const user = await User.create({
          name: `Teacher ${i + 1} (${departments[i]})`,
          email: `teacher${i + 1}@${suffix}`,
          passwordHash: hashPassword('password123'),
          roleId: 3,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        const teacher = await Teacher.create({
          employeeNo: `EMP-${shortSuffix.toUpperCase()}-${1000 + i}`,
          userId: user.id,
          department: departments[i],
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
        teachers.push(teacher);
      }

      // 6. Create 15 Parents
      const parents = [];
      for (let i = 0; i < 15; i++) {
        const user = await User.create({
          name: `Parent ${i + 1}`,
          email: `parent${i + 1}@${suffix}`,
          passwordHash: hashPassword('password123'),
          roleId: 5,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
        parents.push(user);
      }

      // 7. Create 3 Classes & 2 Sections per class
      const classNames = ['Grade 8', 'Grade 9', 'Grade 10'];
      const classes = [];
      const sections = [];
      for (let i = 0; i < 3; i++) {
        const cls = await Class.create({
          name: classNames[i],
          academicYearId: '2026-2027',
          tenantId: tenant.id
        }, { transaction });
        classes.push(cls);

        // 2 Sections (A, B)
        const secA = await Section.create({
          name: 'Section A',
          classId: cls.id,
          classTeacherId: teachers[i % 5].id,
          tenantId: tenant.id
        }, { transaction });
        const secB = await Section.create({
          name: 'Section B',
          classId: cls.id,
          classTeacherId: teachers[(i + 1) % 5].id,
          tenantId: tenant.id
        }, { transaction });
        sections.push(secA, secB);
      }

      // 8. Create 20 Students linked to Parents and Classes/Sections
      const students = [];
      for (let i = 0; i < 20; i++) {
        const user = await User.create({
          name: `Student ${i + 1}`,
          email: `student${i + 1}@${suffix}`,
          passwordHash: hashPassword('password123'),
          roleId: 4,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        const targetClass = classes[i % 3];
        const baseSecIndex = (i % 3) * 2;
        const targetSection = sections[baseSecIndex + (i % 2)];
        
        const parent = parents[i % 15];

        const student = await Student.create({
          admissionNo: `ADM-${shortSuffix.toUpperCase()}-${1000 + i}`,
          userId: user.id,
          classId: targetClass.id,
          sectionId: targetSection.id,
          parentId: parent.id,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
        students.push(student);
      }

      // 9. Create 5 Core Subjects
      const subjectNames = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'];
      const subjectCodes = ['MATH', 'SCI', 'ENG', 'SOC', 'COMP'];
      const subjects = [];
      for (let i = 0; i < 5; i++) {
        const subject = await Subject.create({
          code: `${subjectCodes[i]}-${shortSuffix.toUpperCase()}`,
          name: subjectNames[i],
          tenantId: tenant.id
        }, { transaction });
        subjects.push(subject);
      }

      // 10. Map ClassSubjects
      for (const cls of classes) {
        for (let i = 0; i < 5; i++) {
          await ClassSubject.create({
            classId: cls.id,
            subjectId: subjects[i].id,
            teacherId: teachers[i].id,
            tenantId: tenant.id
          }, { transaction });
        }
      }

      // 11. Create 30 consecutive calendar days of Attendance Logs
      const dateList = [];
      const today = new Date();
      for (let i = 30; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        dateList.push(dateString);
      }

      const attendanceRecords = [];
      for (const student of students) {
        for (const dateStr of dateList) {
          const rand = Math.random();
          let status = 'PRESENT';
          if (rand > 0.97) status = 'ABSENT';
          else if (rand > 0.90) status = 'LATE';

          attendanceRecords.push({
            studentId: student.id,
            classId: student.classId,
            date: dateStr,
            status,
            markedBy: teachers[0].userId,
            tenantId: tenant.id
          });
        }
      }
      await Attendance.bulkCreate(attendanceRecords, { transaction });

      // 12. Create 2 Exam Terms
      const examMid = await Exam.create({
        name: 'Mid-Term Examination',
        academicYearId: '2026-2027',
        startDate: '2026-10-10',
        endDate: '2026-10-20',
        status: 'PUBLISHED',
        tenantId: tenant.id
      }, { transaction });

      const examFinal = await Exam.create({
        name: 'Final Examination',
        academicYearId: '2026-2027',
        startDate: '2027-03-10',
        endDate: '2027-03-20',
        status: 'PUBLISHED',
        tenantId: tenant.id
      }, { transaction });

      const exams = [examMid, examFinal];

      // 13. Create Exam Subjects schedule & mark entries
      const marksToInsert = [];
      for (const exam of exams) {
        for (const cls of classes) {
          for (let i = 0; i < 5; i++) {
            const subject = subjects[i];
            const examSub = await ExamSubject.create({
              examId: exam.id,
              subjectId: subject.id,
              classId: cls.id,
              examDate: exam.startDate,
              maxMarks: 100.0,
              tenantId: tenant.id
            }, { transaction });

            const classStudents = students.filter(s => s.classId === cls.id);
            for (const student of classStudents) {
              const score = Math.floor(45 + Math.random() * 54);
              let grade = 'C';
              if (score >= 90) grade = 'A+';
              else if (score >= 80) grade = 'A';
              else if (score >= 65) grade = 'B';

              marksToInsert.push({
                examSubjectId: examSub.id,
                studentId: student.id,
                marksObtained: score,
                maxMarks: 100.0,
                grade,
                tenantId: tenant.id
              });
            }
          }
        }
      }
      await Mark.bulkCreate(marksToInsert, { transaction });

      // 14. Create Fee Structures
      await FeeStructure.create({
        classId: classes[0].id,
        title: 'Tuition Fee',
        amount: 1200.00,
        academicYearId: '2026-2027',
        tenantId: tenant.id
      }, { transaction });

      await FeeStructure.create({
        classId: classes[0].id,
        title: 'Lab Fee',
        amount: 150.00,
        academicYearId: '2026-2027',
        tenantId: tenant.id
      }, { transaction });

      await FeeStructure.create({
        classId: classes[0].id,
        title: 'Transport Fee',
        amount: 250.00,
        academicYearId: '2026-2027',
        tenantId: tenant.id
      }, { transaction });

      // 15. Generate Invoices & Payments
      for (const student of students) {
        const totalAmount = 1600.00;
        const roll = Math.random();
        let paidAmount = 0.00;
        let status = 'UNPAID';
        
        if (roll > 0.6) {
          paidAmount = 1600.00;
          status = 'PAID';
        } else if (roll > 0.2) {
          paidAmount = 600.00;
          status = 'PARTIAL';
        }

        const dueAmount = totalAmount - paidAmount;

        const invoice = await Invoice.create({
          studentId: student.id,
          totalAmount,
          paidAmount,
          dueAmount,
          status,
          tenantId: tenant.id
        }, { transaction });

        if (paidAmount > 0) {
          await Payment.create({
            invoiceId: invoice.id,
            amountPaid: paidAmount,
            paymentMethod: Math.random() > 0.5 ? 'UPI' : 'CARD',
            transactionRef: `TXN-${shortSuffix.toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
            paidAt: new Date(),
            tenantId: tenant.id
          }, { transaction });
        }
      }

      // 16. System Audit Logs
      await AuditLog.create({
        userId: null,
        action: 'ONBOARD_TENANT',
        entity: 'Tenant',
        entityId: tenant.id,
        tenantId: tenant.id
      }, { transaction });
      
      await AuditLog.create({
        userId: teachers[0].userId,
        action: 'MARK_ATTENDANCE',
        entity: 'Class',
        entityId: classes[0].id,
        tenantId: tenant.id
      }, { transaction });
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    await transaction.commit();
    console.log('Database successfully populated with rich multi-tenant demo data!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
