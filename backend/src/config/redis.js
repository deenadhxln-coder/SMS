const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');
const config = require('./config');

let isConnected = false;
let activeClient = new RedisMock();
let hasLoggedFallback = false;

if (process.env.NODE_ENV !== 'test') {
  try {
    const realClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (config.nodeEnv === 'production') {
          // In production, retry up to 3 times with exponential backoff
          return times <= 3 ? Math.min(times * 1000, 3000) : null;
        }
        return null;
      }
    });

    realClient.on('connect', () => {
      console.log('Successfully connected to Redis Server');
      isConnected = true;
      activeClient = realClient;
    });

    realClient.on('error', (err) => {
      isConnected = false;
      if (!hasLoggedFallback) {
        if (config.nodeEnv === 'production') {
          console.warn('[REDIS WARNING] Primary Redis connection unavailable. Caching degraded.');
        } else {
          console.warn('Redis connection failed. Falling back to in-memory Redis Mock.');
        }
        hasLoggedFallback = true;
      }
    });
  } catch (error) {
    isConnected = false;
    console.warn('Failed to initialize Redis client, using in-memory mock:', error.message);
  }
} else {
  console.log('Redis initialized in TEST mode (using ioredis-mock)');
  isConnected = true;
}

// Proxy all property lookups and method calls to the active client
const proxy = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'isRedisConnected') {
      return () => isConnected;
    }
    if (prop === 'closeRedis') {
      return async () => {
        try {
          if (activeClient && typeof activeClient.quit === 'function') {
            await activeClient.quit();
          }
        } catch (_) {
          if (activeClient && typeof activeClient.disconnect === 'function') {
            activeClient.disconnect();
          }
        }
      };
    }
    const val = activeClient[prop];
    if (typeof val === 'function') {
      return val.bind(activeClient);
    }
    return val;
  }
});

module.exports = proxy;

