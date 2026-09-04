const bcrypt = require('bcryptjs');
const { 
  Tenant, User, Role, Student, Teacher, Class, Section, Subject, 
  ClassSubject, Attendance, Exam, ExamSubject, Mark, FeeStructure, 
  Invoice, Payment, AuditLog, Timetable, SubscriptionPlan, 
  PlatformAdmin, PlatformAuditLog, AcademicYear, TenantSubscription,
  PlatformPayment, PlatformWebhookEvent, Announcement, sequelize 
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
      'subscription_plans', 'platform_admins', 'platform_audit_logs',
      'academic_years', 'announcements', 'tenant_subscriptions',
      'platform_payments', 'platform_webhook_events'
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
    const planFree = await SubscriptionPlan.create({
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'FREE',
      maxStudents: 50,
      maxTeachers: 5,
      price: 0.00,
      featuresJson: JSON.stringify({
        features: ['basic_attendance', 'student_records', 'single_branch', 'community_support'],
        maxStorageMb: 500
      })
    }, { transaction });

    const planStd = await SubscriptionPlan.create({
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'STANDARD',
      maxStudents: 500,
      maxTeachers: 30,
      price: 99.00,
      featuresJson: JSON.stringify({
        features: ['attendance', 'exams_and_marks', 'fee_management', 'timetables', 'reports', 'email_alerts'],
        maxStorageMb: 5000
      })
    }, { transaction });

    const planPrem = await SubscriptionPlan.create({
      id: 'b0000000-0000-0000-0000-000000000003',
      name: 'PREMIUM',
      maxStudents: 5000,
      maxTeachers: 250,
      price: 299.00,
      featuresJson: JSON.stringify({
        features: ['unlimited_students', 'all_modules', 'custom_branding', 'sms_gateway', 'priority_support', 'audit_vault'],
        maxStorageMb: 50000
      })
    }, { transaction });

    // 3. Seed Platform Super Admins in platform_admins table
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
      name: 'Global Operations Admin',
      email: 'superadmin@saasplatform.com',
      passwordHash: hashPassword('superadminpassword'),
      status: 'ACTIVE'
    }, { transaction });

    // 4. Seed Tenants (Schools)
    console.log('🌱 Seeding Tenants (Schools)...');
    const tenantDefault = await Tenant.create({
      id: 'd0000000-0000-0000-0000-000000000000',
      schoolName: 'Apex Demonstration Academy',
      slug: 'default',
      logoUrl: null,
      planType: 'STANDARD',
      status: 'ACTIVE',
      contactEmail: 'schooladmin@school.com',
      createdByAdminId: superAdmin1.id
    }, { transaction });

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
      schoolName: 'Oakridge STEM Academy',
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

    const tenantBeacon = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000004',
      schoolName: 'Beacon Heights Preparatory',
      slug: 'beaconheights',
      logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=128&auto=format&fit=crop&q=80',
      planType: 'STANDARD',
      status: 'ACTIVE',
      contactEmail: 'contact@beaconheights.edu',
      createdByAdminId: superAdmin1.id
    }, { transaction });

    const tenantSilverOak = await Tenant.create({
      id: 'e0000000-0000-0000-0000-000000000005',
      schoolName: 'Silver Oak Grammar School',
      slug: 'silveroak',
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
      planType: 'FREE',
      status: 'ACTIVE',
      contactEmail: 'info@silveroak.edu',
      createdByAdminId: superAdmin2.id
    }, { transaction });

    // Fallback user records with default tenant ID
    await User.create({
      name: 'System Super Admin',
      email: 'admin@school.com',
      passwordHash: hashPassword('adminpassword'),
      roleId: 1,
      status: 'ACTIVE',
      tenantId: tenantDefault.id
    }, { transaction });

    await User.create({
      name: 'Global Operations Admin',
      email: 'superadmin@saasplatform.com',
      passwordHash: hashPassword('superadminpassword'),
      roleId: 1,
      status: 'ACTIVE',
      tenantId: tenantDefault.id
    }, { transaction });

    // 5. Seed Subscriptions & Platform SaaS Payments (Domain B)
    console.log('🌱 Seeding Platform Subscriptions & SaaS Invoices (Domain B)...');
    
    // St. Xavier (PREMIUM)
    const subStX = await TenantSubscription.create({
      tenantId: tenantStX.id,
      planId: planPrem.id,
      planType: 'PREMIUM',
      gatewaySubscriptionId: 'sub_rzp_live_stx_9841',
      gatewayCustomerId: 'cust_rzp_stx_001',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 60 * 86400000),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    }, { transaction });

    await PlatformPayment.bulkCreate([
      {
        tenantId: tenantStX.id,
        subscriptionId: subStX.id,
        gatewayPaymentId: 'pay_rzp_stx_jul_2026',
        amount: 299.00,
        currency: 'INR',
        status: 'SUCCEEDED',
        paymentMethod: 'UPI',
        paidAt: new Date(Date.now() - 60 * 86400000),
      },
      {
        tenantId: tenantStX.id,
        subscriptionId: subStX.id,
        gatewayPaymentId: 'pay_rzp_stx_aug_2026',
        amount: 299.00,
        currency: 'INR',
        status: 'SUCCEEDED',
        paymentMethod: 'CARD',
        paidAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        tenantId: tenantStX.id,
        subscriptionId: subStX.id,
        gatewayPaymentId: 'pay_rzp_stx_sep_2026',
        amount: 299.00,
        currency: 'INR',
        status: 'SUCCEEDED',
        paymentMethod: 'UPI',
        paidAt: new Date(),
      }
    ], { transaction });

    // Oakridge (STANDARD)
    const subOak = await TenantSubscription.create({
      tenantId: tenantOak.id,
      planId: planStd.id,
      planType: 'STANDARD',
      gatewaySubscriptionId: 'sub_rzp_live_oak_5521',
      gatewayCustomerId: 'cust_rzp_oak_002',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 30 * 86400000),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    }, { transaction });

    await PlatformPayment.bulkCreate([
      {
        tenantId: tenantOak.id,
        subscriptionId: subOak.id,
        gatewayPaymentId: 'pay_rzp_oak_aug_2026',
        amount: 99.00,
        currency: 'INR',
        status: 'SUCCEEDED',
        paymentMethod: 'NETBANKING',
        paidAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        tenantId: tenantOak.id,
        subscriptionId: subOak.id,
        gatewayPaymentId: 'pay_rzp_oak_sep_2026',
        amount: 99.00,
        currency: 'INR',
        status: 'SUCCEEDED',
        paymentMethod: 'UPI',
        paidAt: new Date(),
      }
    ], { transaction });

    // Greenwood (PREMIUM)
    const subGwd = await TenantSubscription.create({
      tenantId: tenantGreenwood.id,
      planId: planPrem.id,
      planType: 'PREMIUM',
      gatewaySubscriptionId: 'sub_rzp_live_gwd_3310',
      gatewayCustomerId: 'cust_rzp_gwd_003',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 30 * 86400000),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    }, { transaction });

    await PlatformPayment.create({
      tenantId: tenantGreenwood.id,
      subscriptionId: subGwd.id,
      gatewayPaymentId: 'pay_rzp_gwd_sep_2026',
      amount: 299.00,
      currency: 'INR',
      status: 'SUCCEEDED',
      paymentMethod: 'CARD',
      paidAt: new Date(),
    }, { transaction });

    // Beacon Heights (STANDARD)
    const subBeacon = await TenantSubscription.create({
      tenantId: tenantBeacon.id,
      planId: planStd.id,
      planType: 'STANDARD',
      gatewaySubscriptionId: 'sub_rzp_live_bcn_7720',
      gatewayCustomerId: 'cust_rzp_bcn_004',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    }, { transaction });

    await PlatformPayment.create({
      tenantId: tenantBeacon.id,
      subscriptionId: subBeacon.id,
      gatewayPaymentId: 'pay_rzp_bcn_sep_2026',
      amount: 99.00,
      currency: 'INR',
      status: 'SUCCEEDED',
      paymentMethod: 'UPI',
      paidAt: new Date(),
    }, { transaction });

    // Silver Oak (FREE Tier)
    await TenantSubscription.create({
      tenantId: tenantSilverOak.id,
      planId: planFree.id,
      planType: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
    }, { transaction });

    // Default School (STANDARD)
    const subDef = await TenantSubscription.create({
      tenantId: tenantDefault.id,
      planId: planStd.id,
      planType: 'STANDARD',
      gatewaySubscriptionId: 'sub_rzp_live_def_1001',
      gatewayCustomerId: 'cust_rzp_def_000',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 15 * 86400000),
      currentPeriodEnd: new Date(Date.now() + 15 * 86400000),
    }, { transaction });

    await PlatformPayment.create({
      tenantId: tenantDefault.id,
      subscriptionId: subDef.id,
      gatewayPaymentId: 'pay_rzp_def_sep_2026',
      amount: 99.00,
      currency: 'INR',
      status: 'SUCCEEDED',
      paymentMethod: 'UPI',
      paidAt: new Date(Date.now() - 15 * 86400000),
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
        action: 'PLATFORM_SUBSCRIPTION_ACTIVATED',
        tenantId: tenantStX.id,
        metadata: JSON.stringify({ planType: 'PREMIUM', gatewaySubscriptionId: subStX.gatewaySubscriptionId })
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
        action: 'TENANT_ONBOARDED',
        tenantId: tenantBeacon.id,
        metadata: JSON.stringify({ school: tenantBeacon.schoolName, plan: 'STANDARD' })
      },
      {
        adminId: superAdmin2.id,
        action: 'TENANT_ONBOARDED',
        tenantId: tenantSilverOak.id,
        metadata: JSON.stringify({ school: tenantSilverOak.schoolName, plan: 'FREE' })
      },
      {
        adminId: superAdmin1.id,
        action: 'PLATFORM_INITIALIZED',
        tenantId: null,
        metadata: JSON.stringify({ note: 'DHXLN Multi-Tenant Platform production bootstrap complete' })
      }
    ], { transaction });

    const tenantList = [
      {
        instance: tenantDefault,
        adminEmail: 'schooladmin@school.com',
        adminName: 'School Administrator',
        prefix: 'DEF',
        domain: 'school.com'
      },
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
      }
    ];

    const teacherNames = [
      { name: 'Dr. Robert Langdon', dept: 'Mathematics', email: 'robert.math' },
      { name: 'Sarah Connor, M.Sc', dept: 'Science & Physics', email: 'sarah.physics' },
      { name: 'Prof. Alan Turing', dept: 'Computer Science', email: 'alan.cs' },
      { name: 'Ada Lovelace, M.A', dept: 'English Literature', email: 'ada.english' },
      { name: 'Dr. Priya Sharma', dept: 'Chemistry', email: 'priya.chem' },
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
      console.log(`\n🏫 Seeding rich operational data for: ${tenant.schoolName} (${t.prefix})...`);

      // A. Seed Academic Year
      const academicYear = await AcademicYear.create({
        tenantId: tenant.id,
        name: '2026-2027',
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        isCurrent: true,
        status: 'ACTIVE',
      }, { transaction });

      await AcademicYear.create({
        tenantId: tenant.id,
        name: '2025-2026',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        isCurrent: false,
        status: 'ARCHIVED',
      }, { transaction });

      // B. Seed School Admin (skip if default tenant user already exists)
      const existingUser = await User.findOne({ where: { email: t.adminEmail }, transaction });
      if (!existingUser) {
        await User.create({
          name: t.adminName,
          email: t.adminEmail,
          passwordHash: hashPassword(t.adminEmail === 'schooladmin@school.com' ? 'adminpassword' : 'password123'),
          roleId: 2,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
      }

      // C. Seed Teachers
      const teachers = [];
      for (let i = 0; i < teacherNames.length; i++) {
        const tInfo = teacherNames[i];
        const teacherUser = await User.create({
          name: tInfo.name,
          email: `${tInfo.email}.${t.prefix.toLowerCase()}@${t.domain}`,
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

      // D. Seed Parents
      const parents = [];
      for (let i = 0; i < parentData.length; i++) {
        const pInfo = parentData[i];
        const parentUser = await User.create({
          name: pInfo.name,
          email: `${pInfo.email}.${t.prefix.toLowerCase()}@${t.domain}`,
          passwordHash: hashPassword('password123'),
          roleId: 5,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });
        parents.push(parentUser);
      }

      // E. Seed Classes & Sections
      const classGrades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
      const classes = [];
      const sections = [];

      for (const grade of classGrades) {
        const cls = await Class.create({
          name: grade,
          academicYearId: academicYear.id,
          tenantId: tenant.id
        }, { transaction });
        classes.push(cls);

        const secA = await Section.create({
          name: 'Section A',
          classId: cls.id,
          tenantId: tenant.id
        }, { transaction });

        const secB = await Section.create({
          name: 'Section B',
          classId: cls.id,
          tenantId: tenant.id
        }, { transaction });

        sections.push({ secA, secB, cls });
      }

      // F. Seed Students
      const students = [];
      for (let i = 0; i < studentNames.length; i++) {
        const sName = studentNames[i];
        const sEmail = `student.${sName.toLowerCase().replace(/[^a-z]/g, '')}.${t.prefix.toLowerCase()}@${t.domain}`;
        const parent = parents[i % parents.length];
        const targetSectionInfo = sections[i % sections.length];
        const assignedSection = (i % 2 === 0) ? targetSectionInfo.secA : targetSectionInfo.secB;

        const studentUser = await User.create({
          name: sName,
          email: sEmail,
          passwordHash: hashPassword('password123'),
          roleId: 4,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        const student = await Student.create({
          admissionNo: `ADM-${t.prefix}-${202600 + i + 1}`,
          rollNo: `${101 + (i % 20)}`,
          userId: studentUser.id,
          parentId: parent.id,
          classId: targetSectionInfo.cls.id,
          sectionId: assignedSection.id,
          status: 'ACTIVE',
          tenantId: tenant.id
        }, { transaction });

        students.push({ student, user: studentUser });
      }

      // G. Seed Subjects & Class-Subject mappings
      const subjectCatalog = [
        { name: 'Mathematics', code: 'MATH' },
        { name: 'Physics', code: 'PHYS' },
        { name: 'Chemistry', code: 'CHEM' },
        { name: 'Computer Science', code: 'CS' },
        { name: 'English Literature', code: 'ENG' },
        { name: 'Social Studies & History', code: 'HIST' }
      ];

      const subjects = [];
      for (const sc of subjectCatalog) {
        const subj = await Subject.create({
          name: sc.name,
          code: `${sc.code}-${t.prefix}`,
          tenantId: tenant.id
        }, { transaction });
        subjects.push(subj);
      }

      for (let cIdx = 0; cIdx < classes.length; cIdx++) {
        const cls = classes[cIdx];
        for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
          const subj = subjects[sIdx];
          const teacher = teachers[sIdx % teachers.length].teacher;
          await ClassSubject.create({
            classId: cls.id,
            subjectId: subj.id,
            teacherId: teacher.id,
            tenantId: tenant.id
          }, { transaction });
        }
      }

      // H. Seed Timetables
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const periods = [
        { start: '08:30:00', end: '09:15:00' },
        { start: '09:20:00', end: '10:05:00' },
        { start: '10:20:00', end: '11:05:00' },
        { start: '11:10:00', end: '11:55:00' },
        { start: '12:40:00', end: '01:25:00' }
      ];

      for (const secInfo of sections) {
        for (const day of days) {
          for (let pIdx = 0; pIdx < periods.length; pIdx++) {
            const p = periods[pIdx];
            const subj = subjects[(pIdx + days.indexOf(day)) % subjects.length];
            const teacher = teachers[(pIdx + days.indexOf(day)) % teachers.length].teacher;

            await Timetable.create({
              classId: secInfo.cls.id,
              sectionId: secInfo.secA.id,
              subjectId: subj.id,
              teacherId: teacher.id,
              dayOfWeek: day,
              startTime: p.start,
              endTime: p.end,
              tenantId: tenant.id
            }, { transaction });
          }
        }
      }

      // I. Seed Attendance Records (Past 14 Days)
      const attendanceBatch = [];
      const today = new Date();
      for (let d = 14; d >= 0; d--) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - d);
        if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue; // Skip weekends
        const dateStr = dateObj.toISOString().split('T')[0];

        for (const st of students) {
          const rand = Math.random();
          const status = rand > 0.12 ? 'PRESENT' : (rand > 0.04 ? 'LATE' : 'ABSENT');
          attendanceBatch.push({
            studentId: st.student.id,
            classId: st.student.classId,
            date: dateStr,
            status,
            markedBy: teachers[0].user.id,
            tenantId: tenant.id
          });
        }
      }
      await Attendance.bulkCreate(attendanceBatch, { transaction });

      // J. Seed Exams, Exam Subjects & Marks
      const examMid = await Exam.create({
        name: 'Mid-Term Examination 2026',
        academicYearId: academicYear.id,
        term: 'TERM_1',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        tenantId: tenant.id
      }, { transaction });

      const examFinal = await Exam.create({
        name: 'Annual Board Assessment 2027',
        academicYearId: academicYear.id,
        term: 'TERM_2',
        startDate: '2027-03-10',
        endDate: '2027-03-24',
        tenantId: tenant.id
      }, { transaction });

      const examSubjectsMid = [];
      for (const cls of classes) {
        for (const subj of subjects) {
          const esMid = await ExamSubject.create({
            examId: examMid.id,
            subjectId: subj.id,
            classId: cls.id,
            examDate: '2026-09-18',
            maxMarks: 100.0,
            tenantId: tenant.id
          }, { transaction });
          examSubjectsMid.push(esMid);

          await ExamSubject.create({
            examId: examFinal.id,
            subjectId: subj.id,
            classId: cls.id,
            examDate: '2027-03-15',
            maxMarks: 100.0,
            tenantId: tenant.id
          }, { transaction });
        }
      }

      const marksList = [];
      for (const st of students) {
        const studentExamSubjects = examSubjectsMid.filter(es => es.classId === st.student.classId);
        for (const es of studentExamSubjects) {
          const score = Math.floor(55 + Math.random() * 43);
          let grade = 'A';
          if (score < 60) grade = 'C';
          else if (score < 75) grade = 'B';
          else if (score >= 90) grade = 'A+';

          marksList.push({
            examSubjectId: es.id,
            studentId: st.student.id,
            marksObtained: score,
            maxMarks: 100.0,
            grade,
            tenantId: tenant.id
          });
        }
      }
      await Mark.bulkCreate(marksList, { transaction });

      // K. Seed Fee Structures (Domain A)
      for (const cls of classes) {
        await FeeStructure.create({
          classId: cls.id,
          title: 'Annual Academic Tuition Fee',
          amount: 1500.00,
          academicYearId: academicYear.id,
          tenantId: tenant.id
        }, { transaction });

        await FeeStructure.create({
          classId: cls.id,
          title: 'Science & Computer Lab Fee',
          amount: 250.00,
          academicYearId: academicYear.id,
          tenantId: tenant.id
        }, { transaction });

        await FeeStructure.create({
          classId: cls.id,
          title: 'Transport & Fleet Service Fee',
          amount: 350.00,
          academicYearId: academicYear.id,
          tenantId: tenant.id
        }, { transaction });

        await FeeStructure.create({
          classId: cls.id,
          title: 'Library & Athletics Fee',
          amount: 150.00,
          academicYearId: academicYear.id,
          tenantId: tenant.id
        }, { transaction });
      }

      // L. Seed Invoices & Payments (Domain A)
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

      // M. Seed School Announcements
      await Announcement.bulkCreate([
        {
          tenantId: tenant.id,
          title: 'Annual Science Fair & Robotics Expo 2026',
          body: 'All students from Grades 9-12 are invited to register their robotics and science models by Friday.',
          targetRole: 'ALL',
          createdBy: teachers[0].user.id,
        },
        {
          tenantId: tenant.id,
          title: 'Parent-Teacher Interaction Meet (PTM) Schedule',
          body: 'PTM for Term 1 academic review will be held this Saturday from 09:00 AM to 01:00 PM in the Main Auditorium.',
          targetRole: 'Parent',
          createdBy: teachers[1].user.id,
        },
        {
          tenantId: tenant.id,
          title: 'Term 1 Examination Schedule & Guidelines Released',
          body: 'The finalized timetable for the upcoming Term 1 Examinations has been published in the Academics portal.',
          targetRole: 'Student',
          createdBy: teachers[2].user.id,
        }
      ], { transaction });

      // N. School Audit Logs
      await AuditLog.create({
        userId: teachers[0].user.id,
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
    console.log('🚀 REALISTIC PRODUCTION DATABASE SEEDING COMPLETE!');
    console.log('=======================================================');
    console.log('✅ Subscription Plans (FREE, STANDARD, PREMIUM)');
    console.log('✅ 2 Platform Super Admins:');
    console.log('   - admin@school.com / adminpassword (Super Admin)');
    console.log('   - superadmin@saasplatform.com / superadminpassword');
    console.log('✅ 6 Realistic Schools / Tenants:');
    console.log('   1. Apex Demonstration Academy (schooladmin@school.com / adminpassword) [STANDARD]');
    console.log('   2. St. Xavier International School (admin@stxavier.com / password123) [PREMIUM]');
    console.log('   3. Oakridge STEM Academy (admin@oakridge.com / password123) [STANDARD]');
    console.log('   4. Greenwood Global High School (admin@greenwood.com / password123) [PREMIUM]');
    console.log('   5. Beacon Heights Preparatory (contact@beaconheights.edu) [STANDARD]');
    console.log('   6. Silver Oak Grammar School (info@silveroak.edu) [FREE]');
    console.log('✅ Platform SaaS Subscriptions & Invoices (Domain B)');
    console.log('✅ 24 Faculty / Teachers across 6 Departments');
    console.log('✅ 40 Parents linked to children');
    console.log('✅ 80 Students enrolled with admission & roll numbers');
    console.log('✅ Classes (Grades 9-12), Sections (A & B), Subjects & Timetables');
    console.log('✅ 14 Days of Daily Student Attendance Logs');
    console.log('✅ Academic Years, 2 Exam Terms & Student Gradebooks');
    console.log('✅ Fee Structures, Student Invoices & Payment Receipts (Domain A)');
    console.log('✅ School Announcements & Pinned Broadcasts');
    console.log('✅ Platform & School Security Audit Logs');
    console.log('=======================================================\n');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seed();
