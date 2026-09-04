const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    console.log('\n--- [MIGRATION 8] CREATE PLATFORM BILLING TABLES (RAZORPAY) ---');

    // 1. Create tenant_subscriptions table
    const [existingSubscriptions] = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_subscriptions'"
    );

    if (existingSubscriptions.length === 0) {
      console.log('Creating tenant_subscriptions table...');
      await queryInterface.createTable('tenant_subscriptions', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        tenant_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'tenants',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        plan_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'subscription_plans',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        plan_type: {
          type: DataTypes.ENUM('FREE', 'STANDARD', 'PREMIUM'),
          defaultValue: 'FREE',
          allowNull: false,
        },
        gateway_customer_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        gateway_subscription_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'AUTHENTICATED'),
          defaultValue: 'ACTIVE',
          allowNull: false,
        },
        current_period_start: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        current_period_end: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        cancel_at_period_end: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      // Indexes
      await queryInterface.addIndex('tenant_subscriptions', ['tenant_id'], {
        name: 'uniq_tenant_subscriptions_tenant_id',
        unique: true,
      });

      await queryInterface.addIndex('tenant_subscriptions', ['gateway_subscription_id'], {
        name: 'uniq_tenant_subscriptions_gateway_sub_id',
        unique: true,
      });

      await queryInterface.addIndex('tenant_subscriptions', ['status'], {
        name: 'idx_tenant_subscriptions_status',
      });
    }

    // 2. Create platform_payments table
    const [existingPayments] = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platform_payments'"
    );

    if (existingPayments.length === 0) {
      console.log('Creating platform_payments table...');
      await queryInterface.createTable('platform_payments', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        tenant_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'tenants',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        subscription_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'tenant_subscriptions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        gateway_payment_id: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        gateway_order_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        gateway_invoice_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING(10),
          defaultValue: 'INR',
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('SUCCEEDED', 'PENDING', 'FAILED', 'REFUNDED'),
          defaultValue: 'PENDING',
          allowNull: false,
        },
        payment_method: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        receipt_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        paid_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      // Indexes
      await queryInterface.addIndex('platform_payments', ['gateway_payment_id'], {
        name: 'uniq_platform_payments_gateway_payment_id',
        unique: true,
      });

      await queryInterface.addIndex('platform_payments', ['tenant_id', 'created_at'], {
        name: 'idx_platform_payments_tenant_created',
      });

      await queryInterface.addIndex('platform_payments', ['status'], {
        name: 'idx_platform_payments_status',
      });
    }

    // 3. Create platform_webhook_events table (Idempotency Store)
    const [existingEvents] = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platform_webhook_events'"
    );

    if (existingEvents.length === 0) {
      console.log('Creating platform_webhook_events table...');
      await queryInterface.createTable('platform_webhook_events', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        gateway_event_id: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        event_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('PROCESSED', 'FAILED', 'IGNORED'),
          defaultValue: 'PROCESSED',
          allowNull: false,
        },
        processed_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('platform_webhook_events', ['gateway_event_id'], {
        name: 'uniq_platform_webhook_events_gateway_event_id',
        unique: true,
      });
    }

    // 4. Backfill initial TenantSubscription for existing tenants (if not present)
    const [existingTenants] = await queryInterface.sequelize.query(
      'SELECT id, plan_type FROM tenants'
    );

    for (const t of existingTenants) {
      const [existingSub] = await queryInterface.sequelize.query(
        `SELECT id FROM tenant_subscriptions WHERE tenant_id = '${t.id}'`
      );
      if (existingSub.length === 0) {
        const crypto = require('crypto');
        const subId = crypto.randomUUID();
        await queryInterface.sequelize.query(
          `INSERT INTO tenant_subscriptions (id, tenant_id, plan_type, status, created_at, updated_at) 
           VALUES ('${subId}', '${t.id}', '${t.plan_type || 'FREE'}', 'ACTIVE', NOW(), NOW())`
        );
      }
    }

    console.log('--- PLATFORM BILLING MIGRATION COMPLETE ---');
  },

  down: async ({ context: queryInterface }) => {
    console.log('\n--- REVERTING PLATFORM BILLING TABLES ---');
    await queryInterface.dropTable('platform_webhook_events');
    await queryInterface.dropTable('platform_payments');
    await queryInterface.dropTable('tenant_subscriptions');
  },
};
