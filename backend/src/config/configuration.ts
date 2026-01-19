export default () => ({
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  database: {
    url: (() => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl && process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL is required in production environment');
      }
      return dbUrl;
    })(),
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true',
  },

  // JWT
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production environment');
      }
      if (secret && secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
      }
      return secret || 'dev-only-secret-change-in-production';
    })(),
    expiresIn: process.env.JWT_EXPIRY || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Yext
  yext: {
    apiKey: process.env.YEXT_API_KEY,
    accountId: process.env.YEXT_ACCOUNT_ID,
    apiUrl: process.env.YEXT_API_URL || 'https://api.yext.com/v2',
    webhookSecret: process.env.YEXT_WEBHOOK_SECRET,
  },

  // Gemini
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    listingsPriceId: process.env.STRIPE_LISTINGS_PRICE_ID,
    listingsProPriceId: process.env.STRIPE_LISTINGS_PRO_PRICE_ID,
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },

  // API
  api: {
    url: process.env.API_URL || 'http://localhost:3000',
  },

  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // 100 requests
  },

  // Worker settings
  worker: {
    syncConcurrency: parseInt(process.env.WORKER_SYNC_CONCURRENCY || '5', 10),
    refreshConcurrency: parseInt(process.env.WORKER_REFRESH_CONCURRENCY || '10', 10),
  },
});
