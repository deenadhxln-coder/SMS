const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const { connectDB, sequelize } = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const seedDatabase = require('./utils/seeder');

const app = express();
const server = http.createServer(app);

// 1. Middlewares
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Sanitized HTTP Request Logger (logs method, path, status, latency without exposing bodies, queries or secrets)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (config.nodeEnv !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Apply rate limiting to all API requests
app.use('/api/', apiLimiter);

// 2. Routes mount points
const { protect } = require('./middleware/auth');
const { verifyTenant } = require('./middleware/tenantGuard');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/students', protect, verifyTenant, require('./routes/studentRoutes'));
app.use('/api/teachers', protect, verifyTenant, require('./routes/teacherRoutes'));
app.use('/api/academics', protect, verifyTenant, require('./routes/academicsRoutes'));
app.use('/api/attendance', protect, verifyTenant, require('./routes/attendanceRoutes'));
app.use('/api/exams', protect, verifyTenant, require('./routes/examRoutes'));
app.use('/api/fees', protect, verifyTenant, require('./routes/feeRoutes'));
app.use('/api/dashboard', protect, verifyTenant, require('./routes/dashboardRoutes'));
app.use('/api/reports', protect, verifyTenant, require('./routes/reportsRoutes'));
app.use('/api/announcements', protect, verifyTenant, require('./routes/announcementRoutes'));
app.use('/api/audit-logs', protect, verifyTenant, require('./routes/auditRoutes'));
app.use('/api/academic-years', protect, verifyTenant, require('./routes/academicYearRoutes'));

const redisClient = require('./config/redis');

// Root path diagnostic route (backwards-compatible)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', env: config.nodeEnv, timestamp: new Date() });
});

// Liveness Probe: process is alive and responsive (no DB dependency)
app.get('/health/liveness', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness Probe: checks required DB dependency (Redis is non-critical)
app.get('/health/readiness', async (req, res) => {
  try {
    await sequelize.authenticate();
    const redisStatus = typeof redisClient.isRedisConnected === 'function'
      ? (redisClient.isRedisConnected() ? 'UP' : 'DEGRADED')
      : 'UP';

    return res.status(200).json({
      status: 'READY',
      db: 'UP',
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'UNAVAILABLE',
      db: 'DOWN',
      message: 'Database connection failure',
      timestamp: new Date().toISOString(),
    });
  }
});

// 3. 404 JSON Catch-All Middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// 4. Centralized Error Handling Middleware
app.use(errorHandler);

// 5. Initialize Database & Start Server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Verify database migration status (read-only diagnostic check)
    const { checkPendingMigrations } = require('./migrator');
    const pendingMigrations = await checkPendingMigrations();
    if (pendingMigrations.length > 0) {
      const pendingNames = pendingMigrations.map(m => m.name).join(', ');
      if (config.nodeEnv === 'production') {
        console.error(`\n❌ FATAL DEPLOYMENT ERROR: ${pendingMigrations.length} pending database migration(s) detected: [${pendingNames}].`);
        console.error('In production, migrations must be executed during the release phase via "npm run db:migrate" before starting web workers.');
        process.exit(1);
      } else {
        console.warn(`\n⚠️  WARNING: ${pendingMigrations.length} pending database migration(s) detected: [${pendingNames}].`);
        console.warn('Run "npm run db:migrate" in your terminal to apply pending migrations.\n');
      }
    } else {
      console.log('Database migration status: All migrations applied.');
    }

    // Seed default roles and Super Admin account
    await seedDatabase();

    // Initialize Socket.io
    initSocket(server);

    // Start HTTP Server
    const port = config.port;
    server.listen(port, () => {
      console.log(`========================================`);
      console.log(` SMS Server running in [${config.nodeEnv}] mode`);
      console.log(` API Endpoint: http://localhost:${port}`);
      console.log(` Socket Server initialized & listening`);
      const isRzpKeyConfigured = Boolean(config.razorpay.keyId && config.razorpay.keyId !== 'rzp_test_placeholder_key_id');
      const isRzpSecretConfigured = Boolean(config.razorpay.keySecret && config.razorpay.keySecret !== 'rzp_test_placeholder_key_secret');
      const isRzpWebhookConfigured = Boolean(config.razorpay.webhookSecret && config.razorpay.webhookSecret !== 'rzp_test_placeholder_webhook_secret');
      console.log(` Razorpay Key ID configured: ${isRzpKeyConfigured}`);
      console.log(` Razorpay Key Secret configured: ${isRzpSecretConfigured}`);
      console.log(` Razorpay Webhook Secret configured: ${isRzpWebhookConfigured}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// 6. Graceful Shutdown & Signal Handling
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[SHUTDOWN] Received ${signal}. Draining in-flight requests and shutting down...`);

  // Bounded safety timeout (10s)
  const forceExit = setTimeout(() => {
    console.error('[SHUTDOWN] Hard timeout reached (10s). Forcing process termination.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    // 1. Stop accepting new HTTP requests
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('[SHUTDOWN] Error closing HTTP server:', err.message);
        } else {
          console.log('[SHUTDOWN] HTTP listener closed.');
        }
        resolve();
      });
    });

    // 2. Close Socket.IO cleanly
    try {
      const { getIO } = require('./config/socket');
      const io = getIO();
      if (io) {
        await new Promise((resolve) => {
          io.close(() => {
            console.log('[SHUTDOWN] Socket.IO listener closed.');
            resolve();
          });
        });
      }
    } catch (_) {}

    // 3. Close Sequelize database pool
    try {
      await sequelize.close();
      console.log('[SHUTDOWN] Database connection pool closed.');
    } catch (dbErr) {
      console.error('[SHUTDOWN] Error closing database connection pool:', dbErr.message);
    }

    // 4. Close Redis client
    try {
      if (typeof redisClient.closeRedis === 'function') {
        await redisClient.closeRedis();
        console.log('[SHUTDOWN] Redis connection closed.');
      }
    } catch (redisErr) {
      console.error('[SHUTDOWN] Error closing Redis client:', redisErr.message);
    }

    console.log('[SHUTDOWN] Graceful shutdown completed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[SHUTDOWN] Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle process crashes gracefully
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

