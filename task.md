# SaaS Multi-Tenant Platform - Tasks

## Phase 1: Core Context & Storage
- [ ] Create AsyncLocalStorage context manager (`tenantContext.js`)
- [ ] Implement `verifyTenant` / `tenantGuard` middleware

## Phase 2: Schema Modifications
- [ ] Create `Tenant` database model
- [ ] Update all 16 existing database models to include `tenant_id`
- [ ] Configure relational foreign key constraints for `Tenant` in `models/index.js`
- [ ] Register global Sequelize hooks (`beforeFind`, `beforeCreate`, `beforeBulkCreate`) in `config/db.js`

## Phase 3: Auth & Identity Refactoring
- [ ] Modify login API to return `tenantId` in JWT payload
- [ ] Update seeder to support tenant creation or skip global Super Admin

## Phase 4: Super Admin & Subscription Controls
- [ ] Create Super Admin dashboard routes (`superAdminRoutes.js`)
- [ ] Implement onboarding controller (`POST /api/superadmin/tenants`) that seeds School Admin
- [ ] Enforce student subscription limits (Free tier limit check) before inserts

## Phase 5: Client Branding & Sockets
- [ ] Update Axios client interceptor to forward tenant context if needed
- [ ] Update frontend layout headers to dynamically show tenant school name & logo
- [ ] Build a simple Super Admin dashboard screen for tenant registrations

## Phase 6: Validation & Tests
- [ ] Write integration test verifying multi-tenant query isolation (School A vs School B)
- [ ] Run full build validation to confirm successful bundling
