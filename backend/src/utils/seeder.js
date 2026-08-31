const bcrypt = require('bcryptjs');
const { Role, User, Tenant, SubscriptionPlan, PlatformAdmin } = require('../models');

const seedDatabase = async () => {
  try {
    // 1. Seed Default Tenant for backwards compatibility
    const defaultTenantId = 'd0000000-0000-0000-0000-000000000000';
    await Tenant.findOrCreate({
      where: { id: defaultTenantId },
      defaults: {
        schoolName: 'Default School',
        slug: 'default',
        planType: 'STANDARD',
        status: 'ACTIVE'
      }
    });

    // 2. Seed Roles
    const defaultRoles = [
      { id: 1, name: 'Super Admin' },
      { id: 2, name: 'School Admin' },
      { id: 3, name: 'Teacher' },
      { id: 4, name: 'Student' },
      { id: 5, name: 'Parent' },
    ];

    for (const r of defaultRoles) {
      await Role.findOrCreate({
        where: { id: r.id },
        defaults: { name: r.name },
      });
    }
    console.log('Database roles successfully seeded or verified.');

    // Seed default subscription plans
    const defaultPlans = [
      { name: 'FREE', maxStudents: 10, maxTeachers: 5, price: 0.00, featuresJson: '{"features": ["basic"]}' },
      { name: 'STANDARD', maxStudents: 100, maxTeachers: 20, price: 99.00, featuresJson: '{"features": ["basic", "advanced"]}' },
      { name: 'PREMIUM', maxStudents: 999999, maxTeachers: 999999, price: 299.00, featuresJson: '{"features": ["all"]}' }
    ];

    for (const p of defaultPlans) {
      await SubscriptionPlan.findOrCreate({
        where: { name: p.name },
        defaults: p
      });
    }
    console.log('Database subscription plans successfully seeded or verified.');

    // Seed Default Super Admin User in platform_admins table
    const adminEmail = 'admin@school.com';
    const platformAdmin = await PlatformAdmin.findOne({ where: { email: adminEmail } });

    if (!platformAdmin) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await PlatformAdmin.create({
        name: 'System Super Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
      });
      console.log('Default Platform Super Admin user seeded successfully (admin@school.com / adminpassword).');
    } else {
      console.log('Platform Super Admin user already exists.');
    }

    // Seed Default Super Admin User in users table (for fallback compatibility)
    const adminUser = await User.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await User.create({
        name: 'System Super Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        roleId: 1, // Super Admin
        status: 'ACTIVE',
      });
    }

    // Seed Default School Admin User in users table for default tenant
    const schoolAdminEmail = 'schooladmin@school.com';
    const schoolAdminUser = await User.findOne({ where: { email: schoolAdminEmail } });
    if (!schoolAdminUser) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await User.create({
        name: 'Default School Admin',
        email: schoolAdminEmail,
        passwordHash: hashedPassword,
        roleId: 2, // School Admin
        tenantId: defaultTenantId,
        status: 'ACTIVE',
      });
      console.log('Default School Admin user seeded successfully (schooladmin@school.com / adminpassword).');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
