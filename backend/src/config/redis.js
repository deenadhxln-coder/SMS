const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');
const config = require('./config');

let activeClient = new RedisMock();
let hasLoggedFallback = false;

if (process.env.NODE_ENV !== 'test') {
  try {
    const realClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null // Stop retrying quickly to trigger the fallback
    });

    realClient.on('connect', () => {
      console.log('Successfully connected to Redis Server');
      activeClient = realClient;
    });

    realClient.on('error', (err) => {
      if (!hasLoggedFallback) {
        console.warn('Redis connection failed. Falling back to in-memory Redis Mock.');
        hasLoggedFallback = true;
      }
      // Fallback remains activeClient = mockClient (which is already set initially)
    });
  } catch (error) {
    console.warn('Failed to initialize Redis client, using in-memory mock:', error.message);
  }
} else {
  console.log('Redis initialized in TEST mode (using ioredis-mock)');
}

// Proxy all property lookups and method calls to the active client
const proxy = new Proxy({}, {
  get: (target, prop) => {
    const val = activeClient[prop];
    if (typeof val === 'function') {
      return val.bind(activeClient);
    }
    return val;
  }
});

module.exports = proxy;
