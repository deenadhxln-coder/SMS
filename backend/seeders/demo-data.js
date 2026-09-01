const bcrypt = require('bcryptjs');
const { 
  Tenant, User, Role, Student, Teacher, Class, Section, Subject, 
  ClassSubject, Attendance, Exam, ExamSubject, Mark, FeeStructure, 
  Invoice, Payment, AuditLog, Timetable, SubscriptionPlan, 
  PlatformAdmin, PlatformAuditLog, sequelize 
} = require('../src/models');

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const seed = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log('🔄 Resetting and cleaning database tables...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    
    const tables = [
      'payments', 'invoices', 'fee_structures', 'marks', 'exam_subjects', 'exams',
      'attendance', 'timetables', 'class_subjects', 'subjects', 'sections', 'classes', 
      'teachers', 'students', 'users', 'roles', 'tenants', 'audit_logs',
      'subscription_plans', 'platform_admins', 'platform_audit_logs'
    ];
    for (const table of tables) {
      await sequelize.query(`TRUNCATE TABLE \`${table}\``, { transaction });
    }
    console.log('✅ Database tables truncated and prepared.');

    // 1. Seed Roles
    console.log('🌱 Seeding Roles...');
    await Role.bulkCreate([
      { id: 1, name: 'Super Admin' },
      { id: 2, name: 'School Admin' },
      { id: 3, name: 'Teacher' },
      { id: 4, name: 'Student' },
      { id: 5, name: 'Parent' }
    ], { transaction });

    // 2. Seed Subscription Plans
    console.log('🌱 Seeding Subscription Plans...');
    await SubscriptionPlan.bulkCreate([
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'FREE',
        maxStudents: 50,
        maxTeachers: 5,
        price: 0.00,
        featuresJson: JSON.stringify({
          features: ['basic_attendance', 'student_records', 'single_branch', 'community_support'],
          maxStorageMb: 500
        })
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'STANDARD',
        maxStudents: 500,
        maxTeachers: 30,
        price: 99.00,
        featuresJson: JSON.stringify({
          features: ['attendance', 'exams_and_marks', 'fee_management', 'timetables', 'reports', 'email_alerts'],
          maxStorageMb: 5000
        })
      },
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        name: 'PREMIUM',
        maxStudents: 5000,
        maxTeachers: 250,
        price: 299.00,
        featuresJson: JSON.stringify({
          features: ['unlimited_students', 'all_modules', 'custom_branding', 'sms_gateway', 'priority_support', 'audit_vault'],
          maxStorageMb: 50000
        })
      }
    ], { transaction });

    // 3. Seed Platform Super Admins
    console.log('🌱 Seeding Platform Super Admins...');
    const superAdmin1 = await PlatformAdmin.create({
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'System Super Admin',
      email: 'admin@school.com',
      passwordHash: hashPassword('adminpassword'),
      status: 'ACTIVE'
    }, { transaction });

    const superAdmin2 = await PlatformAdmin.create({
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Global Platform Admin',
      email: 'superadmin@saasplatform.com',
      passwordHash: hashPassword('superadminpassword'),
      status: 'ACTIVE'
    }, { transaction });

    // Also seed in users table for backward compatibility
    await User.create({
      name: 'System Super Admin',
      email: 'admin@school.com',
      passwordHash: hashPassword('adminpassword'),
      roleId: 1,
      status: 'ACTIVE',
      tenantId: null
    }, { transaction });

    await User.create({
      name: 'Global Super Admin',
      email: 'superadmin@saasplatform.com',
      passwordHash: hashPassword('superadminpassword'),
      roleId: 1,
      status: 'ACTIVE',
      tenantId: null
    }, { transaction });

    // 4. Seed Tenants (Schools)
    console.log('🌱 Seeding Tenants (Schools)...');
    const tenantStX = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000001',
      schoolName: 'St. Xavier International School',
      slug: 'stxavier',
      logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=128&auto=format&fit=crop&q=80',
      planType: 'PREMIUM',
      status: 'ACTIVE',
      contactEmail: 'contact@stxavier.edu',
      createdByAdminId: superAdmin1.id
    }, { transaction });

    const tenantOak = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000002',
      schoolName: 'Oakridge Academy',
      slug: 'oakridge',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
      planType: 'STANDARD',
      status: 'ACTIVE',
      contactEmail: 'info@oakridge.edu',
      createdByAdminId: superAdmin1.id
    }, { transaction });

    const tenantGreenwood = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000003',
      schoolName: 'Greenwood Global High School',
      slug: 'greenwood',
      logoUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=128&auto=format&fit=crop&q=80',
      planType: 'PREMIUM',
      status: 'ACTIVE',
      contactEmail: 'admissions@greenwoodglobal.edu',
      createdByAdminId: superAdmin2.id
    }, { transaction });

    const tenantDefault = await Tenant.create({
      id: 'd0000000-0000-0000-0000-000000000000',
      schoolName: 'Default School',
      slug: 'default',
      logoUrl: null,
      planType: 'STANDARD',
      status: 'ACTIVE',
      contactEmail: 'schooladmin@school.com',
      createdByAdminId: superAdmin1.id
    }, { transaction });

    // Platform Audit Logs
    await PlatformAuditLog.bulkCreate([
      {
        adminId: superAdmin1.id,
        action: 'TENANT_ONBOARDED',
        tenantId: tenantStX.id,
        metadata: JSON.stringify({ school: tenantStX.schoolName, plan: 'PREMIUM' })
      },
      {
        adminId: superAdmin1.id,
        action: 'TENANT_ONBOARDED',
        tenantId: tenantOak.id,
        metadata: JSON.stringify({ school: tenantOak.schoolName, plan: 'STANDARD' })
      },
      {
        adminId: superAdmin2.id,
        action: 'TENANT_ONBOARDED',
        tenantId: tenantGreenwood.id,
        metadata: JSON.stringify({ school: tenantGreenwood.schoolName, plan: 'PREMIUM' })
      },
      {
        adminId: superAdmin1.id,
        action: 'PLATFORM_INITIALIZED',
        tenantId: null,
        metadata: JSON.stringify({ note: 'Platform bootstrap complete' })
      }
    ], { transaction });

    const tenantList = [
      {
        instance: tenantStX,
        adminEmail: 'admin@stxavier.com',
        adminName: 'Dr. Arthur Vance (Principal)',
        prefix: 'STX',
        domain: 'stxavier.com'
      },
      {
        instance: tenantOak,
        adminEmail: 'admin@oakridge.com',
        adminName: 'Margaret Thatcher (Director)',
        prefix: 'OAK',
        domain: 'oakridge.com'
      },
      {
        instance: tenantGreenwood,
        adminEmail: 'admin@greenwood.com',
        adminName: 'Prof. David Sterling (Dean)',
        prefix: 'GWD',
        domain: 'greenwood.com'
      },
      {
        instance: tenantDefault,
        adminEmail: 'schooladmin@school.com',
        adminName: 'Default School Administrator',
        prefix: 'DEF',
        domain: 'school.com'
      }
    ];

    const teacherNames = [
      { name: 'Dr. Robert Langdon', dept: 'Mathematics', email: 'robert.math' },
      { name: 'Sarah Connor', dept: 'Science & Physics', email: 'sarah.physics' },
      { name: 'Prof. Alan Turing', dept: 'Computer Science', email: 'alan.cs' },
      { name: 'Ada Lovelace', dept: 'English Literature', email: 'ada.english' },
      { name: 'Priya Sharma', dept: 'Chemistry', email: 'priya.chem' },
      { name: 'Marcus Aurelius', dept: 'Social Studies & History', email: 'marcus.history' }
    ];

    const parentData = [
      { name: 'Thomas Smith', email: 'parent.smith' },
      { name: 'Ananya Verma', email: 'parent.verma' },
      { name: 'Carlos Rodriguez', email: 'parent.rodriguez' },
      { name: 'Jennifer Davis', email: 'parent.davis' },
      { name: 'Rajesh Patel', email: 'parent.patel' },
      { name: 'Elena Rostova', email: 'parent.rostova' },
      { name: 'David Kim', email: 'parent.kim' },
      { name: 'Aisha Al-Mansoor', email: 'parent.mansoor' },
      { name: 'Michael Brown', email: 'parent.brown' },
      { name: 'Kavita Nair', email: 'parent.nair' }
    ];

    const studentNames = [
      'Alexander Smith', 'Sneha Verma', 'Diego Rodriguez', 'Emily Davis', 'Aarav Patel',
      'Sofia Rostova', 'Lucas Kim', 'Zayn Al-Mansoor', 'Chloe Brown', 'Rohan Nair',
      'Oliver Smith', 'Ishaan Verma', 'Mateo Rodriguez', 'Grace Davis', 'Diya Patel',
      'Dmitri Rostov', 'Hannah Kim', 'Fatima Mansoor', 'James Brown', 'Anika Nair'
    ];

    // Seed data per tenant
    for (const t of tenantList) {
      const tenant = t.instance;
      console.log(`\n🏫 Seeding rich data for tenant: ${tenant.schoolName} (${t.prefix})...`);

      // A. Seed School Admin
      await User.create({
        name: t.adminName,
        email: t.adminEmail,
        passwordHash: hashPassword(t.adminEmail === 'schooladmin@school.com' ? 'adminpassword' : 'password123'),
        roleId: 2,
        status: 'ACTIVE',
        tenantId: tenant.id
      }, { transaction });

      // B. Seed Teachers
      const teachers = [];
      for (let i = 0; i < teacherNames.length; i++) {
        const tInfo = teacherNames[i];
        const teacherUser = await User.create({
          name: tInfo.name,
          email: `${tInfo.email}@${t.domain}`,
          passwordHash: hashPassword('password123'),
          roleId: 3,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        const teacher = await Teacher.create({
          employeeNo: `EMP-${t.prefix}-${1001 + i}`,
          userId: teacherUser.id,
          department: tInfo.dept,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
        teachers.push({ teacher, user: teacherUser });
      }

      // C. Seed Parents
      const parents = [];
      for (let i = 0; i < parentData.length; i++) {
        const pInfo = parentData[i];
        const parentUser = await User.create({
          name: pInfo.name,
          email: `${pInfo.email}@${t.domain}`,
          passwordHash: hashPassword('password123'),
          roleId: 5,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
        parents.push(parentUser);
      }

      // D. Seed Classes & Sections
      const classNames = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
      const classes = [];
      const sections = [];

      for (let i = 0; i < classNames.length; i++) {
        const cls = await Class.create({
          name: classNames[i],
          academicYearId: '2026-2027',
          tenantId: tenant.id
        }, { transaction });
        classes.push(cls);

        const secA = await Section.create({
          name: 'Section A',
          classId: cls.id,
          classTeacherId: teachers[i % teachers.length].teacher.id,
          tenantId: tenant.id
        }, { transaction });

        const secB = await Section.create({
          name: 'Section B',
          classId: cls.id,
          classTeacherId: teachers[(i + 1) % teachers.length].teacher.id,
          tenantId: tenant.id
        }, { transaction });

        sections.push({ cls, secA, secB });
      }

      // E. Seed Core Subjects
      const subjectDefs = [
        { name: 'Mathematics', code: `MATH-${t.prefix}` },
        { name: 'Science & Physics', code: `SCI-${t.prefix}` },
        { name: 'English Literature', code: `ENG-${t.prefix}` },
        { name: 'Computer Science', code: `CS-${t.prefix}` },
        { name: 'Chemistry & Biology', code: `CHEM-${t.prefix}` },
        { name: 'Social Studies & History', code: `SST-${t.prefix}` }
      ];

      const subjects = [];
      for (const sDef of subjectDefs) {
        const subj = await Subject.create({
          name: sDef.name,
          code: sDef.code,
          tenantId: tenant.id
        }, { transaction });
        subjects.push(subj);
      }

      // F. Map ClassSubjects
      for (const cls of classes) {
        for (let i = 0; i < subjects.length; i++) {
          await ClassSubject.create({
            classId: cls.id,
            subjectId: subjects[i].id,
            teacherId: teachers[i % teachers.length].teacher.id,
            tenantId: tenant.id
          }, { transaction });
        }
      }

      // G. Seed Timetables
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      const periods = [
        { startTime: '09:00', endTime: '10:00', room: 'Room 101' },
        { startTime: '10:00', endTime: '11:00', room: 'Room 102' },
        { startTime: '11:15', endTime: '12:15', room: 'Sci Lab 1' },
        { startTime: '13:00', endTime: '14:00', room: 'CS Lab' },
        { startTime: '14:00', endTime: '15:00', room: 'Room 103' }
      ];

      const timetableRecords = [];
      for (const cls of classes) {
        for (let d = 0; d < days.length; d++) {
          for (let p = 0; p < periods.length; p++) {
            const subjIdx = (d + p) % subjects.length;
            timetableRecords.push({
              classId: cls.id,
              subjectId: subjects[subjIdx].id,
              teacherId: teachers[subjIdx % teachers.length].teacher.id,
              dayOfWeek: days[d],
              startTime: periods[p].startTime,
              endTime: periods[p].endTime,
              roomNumber: periods[p].room,
              tenantId: tenant.id
            });
          }
        }
      }
      await Timetable.bulkCreate(timetableRecords, { transaction });

      // H. Seed Students linked to Parents & Classes/Sections
      const students = [];
      for (let i = 0; i < studentNames.length; i++) {
        const sName = studentNames[i];
        const studentUser = await User.create({
          name: sName,
          email: `student${i + 1}@${t.domain}`,
          passwordHash: hashPassword('password123'),
          roleId: 4,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        const targetGroup = sections[i % sections.length];
        const targetSection = (i % 2 === 0) ? targetGroup.secA : targetGroup.secB;
        const targetParent = parents[i % parents.length];

        const student = await Student.create({
          admissionNo: `ADM-${t.prefix}-2026-${100 + i}`,
          userId: studentUser.id,
          classId: targetGroup.cls.id,
          sectionId: targetSection.id,
          parentId: targetParent.id,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        students.push({ student, user: studentUser });
      }

      // I. Seed 30 Consecutive Days Attendance Records
      const dateList = [];
      const today = new Date();
      for (let i = 30; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Skip weekends
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          dateList.push(d.toISOString().split('T')[0]);
        }
      }

      const attendanceList = [];
      for (const st of students) {
        for (const dateStr of dateList) {
          const rand = Math.random();
          let status = 'PRESENT';
          if (rand > 0.94) status = 'ABSENT';
          else if (rand > 0.88) status = 'LATE';

          attendanceList.push({
            studentId: st.student.id,
            classId: st.student.classId,
            date: dateStr,
            status,
            markedBy: teachers[0].user.id,
            tenantId: tenant.id
          });
        }
      }
      await Attendance.bulkCreate(attendanceList, { transaction });

      // J. Seed Exam Terms & Exam Subjects & Marks
      const examMid = await Exam.create({
        name: 'Mid-Term Examination 2026',
        academicYearId: '2026-2027',
        startDate: '2026-10-10',
        endDate: '2026-10-22',
        status: 'PUBLISHED',
        tenantId: tenant.id
      }, { transaction });

      const examFinal = await Exam.create({
        name: 'Final Board & Annual Examination 2027',
        academicYearId: '2026-2027',
        startDate: '2027-03-05',
        endDate: '2027-03-20',
        status: 'PUBLISHED',
        tenantId: tenant.id
      }, { transaction });

      const exams = [examMid, examFinal];
      const marksList = [];

      for (const ex of exams) {
        for (const cls of classes) {
          for (let i = 0; i < subjects.length; i++) {
            const subj = subjects[i];
            const examSub = await ExamSubject.create({
              examId: ex.id,
              subjectId: subj.id,
              classId: cls.id,
              examDate: ex.startDate,
              maxMarks: 100.0,
              tenantId: tenant.id
            }, { transaction });

            const classStudents = students.filter(s => s.student.classId === cls.id);
            for (const st of classStudents) {
              const score = Math.floor(55 + Math.random() * 44);
              let grade = 'C';
              if (score >= 90) grade = 'A+';
              else if (score >= 80) grade = 'A';
              else if (score >= 70) grade = 'B';

              marksList.push({
                examSubjectId: examSub.id,
                studentId: st.student.id,
                marksObtained: score,
                maxMarks: 100.0,
                grade,
                tenantId: tenant.id
              });
            }
          }
        }
      }
      await Mark.bulkCreate(marksList, { transaction });

      // K. Seed Fee Structures
      for (const cls of classes) {
        await FeeStructure.create({
          classId: cls.id,
          title: 'Annual Academic Tuition Fee',
          amount: 1500.00,
          academicYearId: '2026-2027',
          tenantId: tenant.id
        }, { transaction });

        await FeeStructure.create({
          classId: cls.id,
          title: 'Science & Computer Lab Fee',
          amount: 250.00,
          academicYearId: '2026-2027',
          tenantId: tenant.id
        }, { transaction });

        await FeeStructure.create({
          classId: cls.id,
          title: 'Transport & Fleet Service Fee',
          amount: 350.00,
          academicYearId: '2026-2027',
          tenantId: tenant.id
        }, { transaction });

        await FeeStructure.create({
          classId: cls.id,
          title: 'Library & Athletics Fee',
          amount: 150.00,
          academicYearId: '2026-2027',
          tenantId: tenant.id
        }, { transaction });
      }

      // L. Seed Invoices & Payments
      for (let i = 0; i < students.length; i++) {
        const st = students[i];
        const totalAmount = 2250.00;
        const roll = Math.random();
        let paidAmount = 0.00;
        let status = 'UNPAID';

        if (roll > 0.45) {
          paidAmount = 2250.00;
          status = 'PAID';
        } else if (roll > 0.20) {
          paidAmount = 1000.00;
          status = 'PARTIAL';
        }

        const dueAmount = totalAmount - paidAmount;

        const invoice = await Invoice.create({
          studentId: st.student.id,
          totalAmount,
          paidAmount,
          dueAmount,
          status,
          tenantId: tenant.id
        }, { transaction });

        if (paidAmount > 0) {
          const methods = ['UPI', 'CARD', 'NETBANKING', 'CASH'];
          await Payment.create({
            invoiceId: invoice.id,
            amountPaid: paidAmount,
            paymentMethod: methods[Math.floor(Math.random() * methods.length)],
            transactionRef: `TXN-${t.prefix}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}-${i}`,
            paidAt: new Date(),
            tenantId: tenant.id
          }, { transaction });
        }
      }

      // M. School Audit Logs
      await AuditLog.create({
        userId: null,
        action: 'ONBOARD_TENANT',
        entity: 'Tenant',
        entityId: tenant.id,
        tenantId: tenant.id
      }, { transaction });

      await AuditLog.create({
        userId: teachers[0].user.id,
        action: 'PUBLISH_EXAM_RESULTS',
        entity: 'Exam',
        entityId: examMid.id,
        tenantId: tenant.id
      }, { transaction });
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    await transaction.commit();
    console.log('\n🎉 =======================================================');
    console.log('🚀 DATABASE POPULATION COMPLETED SUCCESSFULLY!');
    console.log('=======================================================');
    console.log('✅ Subscription Plans (FREE, STANDARD, PREMIUM) seeded');
    console.log('✅ Platform Super Admins seeded:');
    console.log('   - admin@school.com / adminpassword');
    console.log('   - superadmin@saasplatform.com / superadminpassword');
    console.log('✅ 4 Schools / Tenants seeded:');
    console.log('   1. St. Xavier International School (admin@stxavier.com / password123)');
    console.log('   2. Oakridge Academy (admin@oakridge.com / password123)');
    console.log('   3. Greenwood Global High School (admin@greenwood.com / password123)');
    console.log('   4. Default School (schooladmin@school.com / adminpassword)');
    console.log('✅ 24 Teachers across 6 specialized departments');
    console.log('✅ 40 Parents linked to children');
    console.log('✅ 80 Students across Grades 7, 8, 9, 10 (Sections A & B)');
    console.log('✅ 24 Subjects and Class-Subject assignments');
    console.log('✅ Full Weekly Timetables (Monday-Friday, 5 periods/day)');
    console.log('✅ 30 Days of realistic daily Attendance records');
    console.log('✅ 2 Exam Terms, Exam Subjects, and Student Marks/Grades');
    console.log('✅ Fee Structures, Student Invoices & Transaction Payments');
    console.log('✅ Platform Audit Logs & School Activity Logs');
    console.log('=======================================================\n');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seed();
