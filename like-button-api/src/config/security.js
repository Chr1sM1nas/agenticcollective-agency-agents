'use strict';

/**
 * Centralized security configuration.
 * All secrets are read from environment variables – never hard-coded.
 */

const crypto = require('crypto');

function requireEnv(name) {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Generate a random secret for development (NOT for production). */
function devSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

const isDev = process.env.NODE_ENV !== 'production';

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  jwt: {
    secret: process.env.JWT_SECRET || (isDev ? devSecret(64) : requireEnv('JWT_SECRET')),
    expiry: process.env.JWT_EXPIRY || '1h',
    previousSecrets: (process.env.JWT_PREVIOUS_SECRETS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  },

  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET || (isDev ? devSecret(64) : requireEnv('ADMIN_JWT_SECRET')),
    expiry: process.env.ADMIN_JWT_EXPIRY || '8h',
  },

  apiKey: {
    secret: process.env.API_KEY_SECRET || (isDev ? devSecret(32) : requireEnv('API_KEY_SECRET')),
  },

  signing: {
    secret: process.env.SIGNING_SECRET || (isDev ? devSecret(32) : requireEnv('SIGNING_SECRET')),
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || (isDev ? devSecret(32) : requireEnv('ENCRYPTION_KEY')),
  },

  vote: {
    signingSecret: process.env.VOTE_SIGNING_SECRET || (isDev ? devSecret(32) : requireEnv('VOTE_SIGNING_SECRET')),
  },

  auditLog: {
    secret: process.env.AUDIT_LOG_SECRET || (isDev ? devSecret(32) : requireEnv('AUDIT_LOG_SECRET')),
  },

  db: {
    path: process.env.DB_PATH || './data/likes.db',
  },

  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || (isDev ? '*' : ''))
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
    voteMax: parseInt(process.env.VOTE_RATE_LIMIT_MAX || '5', 10),
  },

  replay: {
    toleranceSecs: parseInt(process.env.REQUEST_TIMESTAMP_TOLERANCE_SECS || '300', 10),
  },
};

module.exports = config;
