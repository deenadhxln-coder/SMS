const { sequelize } = require('../config/db');

const EXPECTED_TABLES = [
  'tenants',
  'platform_admins',
  'subscription_plans',
  'platform_audit_logs',
  'roles',
  'users',
  'teachers',
  'students',
  'classes',
  'sections',
  'subjects',
  'class_subjects',
  'timetables',
  'attendance',
  'exams',
  'exam_subjects',
  'marks',
  'fee_structures',
  'invoices',
  'payments',
  'audit_logs',
];

const REQUIRED_INDEXES = [
  { table: 'attendance', name: 'idx_attendance_tenant_date' },
  { table: 'attendance', name: 'uniq_attendance_tenant_student_date' },
  { table: 'payments', name: 'uniq_payments_tenant_txn_ref' },
  { table: 'payments', name: 'idx_payments_tenant_invoice' },
  { table: 'marks', name: 'uniq_marks_tenant_exam_sub_student' },
  { table: 'marks', name: 'idx_marks_tenant_exam_sub' },
  { table: 'exams', name: 'idx_exams_tenant_ay' },
  { table: 'invoices', name: 'idx_invoices_tenant_status' },
  { table: 'invoices', name: 'idx_invoices_tenant_student' },
  { table: 'students', name: 'idx_students_tenant_class_sec' },
  { table: 'students', name: 'students_tenant_id_admission_no' },
  { table: 'teachers', name: 'idx_teachers_tenant_dept' },
  { table: 'teachers', name: 'teachers_tenant_id_employee_no' },
  { table: 'subjects', name: 'subjects_tenant_id_code' },
  { table: 'timetables', name: 'idx_timetables_tenant_class_dow' },
  { table: 'audit_logs', name: 'idx_audit_logs_tenant_timestamp' },
  { table: 'platform_audit_logs', name: 'idx_platform_audit_admin_created' },
  { table: 'platform_audit_logs', name: 'idx_platform_audit_tenant_created' },
];

async function verify() {
  let passed = true;
  console.log('================================================================');
  console.log('🔍 RUNNING PRODUCTION DATABASE VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection authenticated.\n');

    // 1. Verify Table Inventory
    console.log('1. Checking Expected Application Tables:');
    const [rawTables] = await sequelize.query('SHOW TABLES');
    const existingTables = rawTables.map(r => Object.values(r)[0].toLowerCase());

    for (const t of EXPECTED_TABLES) {
      if (existingTables.includes(t)) {
        const [countRes] = await sequelize.query(`SELECT COUNT(*) as c FROM \`${t}\``);
        console.log(`  ✓ Table '${t}' exists (row count: ${countRes[0].c})`);
      } else {
        console.error(`  ❌ MISSING TABLE: '${t}'`);
        passed = false;
      }
    }

    // 2. Verify NOT NULL Constraints on tenant_id
    console.log('\n2. Checking NOT NULL Constraints on tenant_id:');
    const [userCol] = await sequelize.query(
      "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'tenant_id' AND TABLE_SCHEMA = DATABASE()"
    );
    if (userCol.length > 0 && userCol[0].IS_NULLABLE === 'NO') {
      console.log("  ✓ users.tenant_id is NOT NULL");
    } else {
      console.error(`  ❌ users.tenant_id is NULLable (${userCol[0]?.IS_NULLABLE})`);
      passed = false;
    }

    const [auditCol] = await sequelize.query(
      "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'tenant_id' AND TABLE_SCHEMA = DATABASE()"
    );
    if (auditCol.length > 0 && auditCol[0].IS_NULLABLE === 'NO') {
      console.log("  ✓ audit_logs.tenant_id is NOT NULL");
    } else {
      console.error(`  ❌ audit_logs.tenant_id is NULLable (${auditCol[0]?.IS_NULLABLE})`);
      passed = false;
    }

    // 3. Verify Composite Indexes & Unique Constraints
    console.log('\n3. Checking Required Composite Indexes & Unique Constraints:');
    for (const item of REQUIRED_INDEXES) {
      const [idxs] = await sequelize.query(`SHOW INDEX FROM \`${item.table}\``);
      const indexNames = idxs.map(i => i.Key_name);
      if (indexNames.includes(item.name)) {
        console.log(`  ✓ Index '${item.name}' found on table '${item.table}'`);
      } else {
        console.error(`  ❌ MISSING INDEX: '${item.name}' on table '${item.table}'`);
        passed = false;
      }
    }

    // 4. Verify No NULL tenant_id rows
    console.log('\n4. Checking Data Integrity (Zero NULL tenant_id):');
    const [nullUsers] = await sequelize.query("SELECT COUNT(*) as c FROM users WHERE tenant_id IS NULL");
    if (nullUsers[0].c === 0) {
      console.log("  ✓ 0 NULL tenant_id in users");
    } else {
      console.error(`  ❌ ${nullUsers[0].c} users have NULL tenant_id`);
      passed = false;
    }

    const [nullAudit] = await sequelize.query("SELECT COUNT(*) as c FROM audit_logs WHERE tenant_id IS NULL");
    if (nullAudit[0].c === 0) {
      console.log("  ✓ 0 NULL tenant_id in audit_logs");
    } else {
      console.error(`  ❌ ${nullAudit[0].c} audit_logs have NULL tenant_id`);
      passed = false;
    }

    console.log('\n================================================================');
    if (passed) {
      console.log('🎉 ALL DATABASE VERIFICATION CHECKS PASSED SUCCESSFULLY!');
      console.log('================================================================');
      process.exit(0);
    } else {
      console.error('❌ DATABASE VERIFICATION FAILED: Issues detected above.');
      console.log('================================================================');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ DATABASE VERIFICATION FATAL ERROR:', error.message);
    process.exit(1);
  }
}

verify();
