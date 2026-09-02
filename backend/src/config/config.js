require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';

// Production Startup Guard: Fail closed if JWT_SECRET is unconfigured or default
if (nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_jwt_secret_change_in_production')) {
  throw new Error('FATAL CONFIG ERROR: JWT_SECRET must be set to a secure string in production environment.');
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['http://localhost:5173', 'http://localhost:5174'],
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'school_management',
  },
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

