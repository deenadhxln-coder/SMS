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
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API requests
app.use('/api/', apiLimiter);

// 2. Routes mount points
const { protect } = require('./middleware/auth');
const { verifyTenant } = require('./middleware/tenantGuard');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/students', protect, verifyTenant, require('./routes/studentRoutes'));
app.use('/api/teachers', protect, verifyTenant, require('./routes/teacherRoutes'));
app.use('/api/academics', protect, verifyTenant, require('./routes/academicsRoutes'));
app.use('/api/attendance', protect, verifyTenant, require('./routes/attendanceRoutes'));
app.use('/api/exams', protect, verifyTenant, require('./routes/examRoutes'));
app.use('/api/fees', protect, verifyTenant, require('./routes/feeRoutes'));
app.use('/api/dashboard', protect, verifyTenant, require('./routes/dashboardRoutes'));
app.use('/api/reports', protect, verifyTenant, require('./routes/reportsRoutes'));

// Root path diagnostic route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', env: config.nodeEnv, timestamp: new Date() });
});

// 3. Error Handling Middleware
app.use(errorHandler);

// 4. Initialize Database & Start Server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Synchronize models (alter schema to add missing tables/columns safely)
    console.log('Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

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
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle process crashes gracefully
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
