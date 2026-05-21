'use strict';

/**
 * Security Headers & CORS Middleware.
 *
 * - Helmet applies comprehensive HTTP security headers.
 * - CORS is restricted to configured origins only.
 * - A custom middleware enforces HTTPS in production.
 */

const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/security');

// ── CORS ──────────────────────────────────────────────────────────────────────

const allowedOrigins = config.cors.allowedOrigins;

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (e.g. server-to-server, curl) only in non-production
    if (!origin) {
      if (config.env !== 'production') return callback(null, true);
      return callback(new Error('CORS: no origin header'));
    }
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Api-Key',
    'X-Signature',
    'X-Timestamp',
    'X-Nonce',
  ],
  exposedHeaders: ['X-Response-Signature', 'X-Request-Id'],
  credentials: false,
  maxAge: 600, // 10-minute preflight cache
};

// ── Helmet configuration ──────────────────────────────────────────────────────

const helmetOptions = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31_536_000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
});

// ── HTTPS enforcement ─────────────────────────────────────────────────────────

function requireHttps(req, res, next) {
  if (config.env !== 'production') return next();
  // Trust common reverse-proxy headers
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  if (proto !== 'https') {
    return res.status(301).redirect(`https://${req.hostname}${req.originalUrl}`);
  }
  next();
}

// ── Request ID middleware ─────────────────────────────────────────────────────

const crypto = require('crypto');

function requestId(req, res, next) {
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

// ── Strict input size limits ──────────────────────────────────────────────────

/**
 * Returns an express.json() middleware pre-configured with size limits.
 * Import express and call this in server.js.
 */
function jsonBodyParser() {
  const express = require('express');
  return express.json({ limit: '32kb' });
}

module.exports = {
  helmet: helmetOptions,
  cors: cors(corsOptions),
  requireHttps,
  requestId,
  jsonBodyParser,
};
