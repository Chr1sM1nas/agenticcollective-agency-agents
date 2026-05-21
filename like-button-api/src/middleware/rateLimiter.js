'use strict';

/**
 * Rate Limiting Middleware.
 *
 * Three layers:
 *  1. Global IP rate limiter      – applied to all routes
 *  2. Vote-specific limiter       – tighter limits on POST /api/likes/:id
 *  3. In-memory device limiter    – per device-fingerprint throttle
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/security');
const auditLog = require('../services/auditLog');

// ── 1. Global IP rate limiter ─────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests – please slow down' },
  handler(req, res, next, options) {
    auditLog.append({
      action: 'RATE_LIMIT_EXCEEDED_IP',
      actor: req.ip,
      data: { path: req.path, method: req.method },
    });
    res.status(429).json(options.message);
  },
});

// ── 2. Vote-specific limiter ──────────────────────────────────────────────────

const voteLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.voteMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    // Key by IP.  Device-level throttling is handled separately below.
    return req.ip || 'unknown';
  },
  message: { error: 'Vote rate limit exceeded – only a limited number of vote attempts are allowed per minute' },
  handler(req, res, next, options) {
    auditLog.append({
      action: 'RATE_LIMIT_EXCEEDED_VOTE',
      actor: req.ip,
      data: { path: req.path, widgetId: req.params.widgetId },
    });
    res.status(429).json(options.message);
  },
});

// ── 3. In-memory device-fingerprint limiter ───────────────────────────────────

// Simple fixed-window map: fingerprint -> { count, windowStart }
const deviceWindows = new Map();

/**
 * Express middleware that rate-limits by device fingerprint.
 * Reads `req.body.deviceFingerprint`.
 */
function deviceLimiter(req, res, next) {
  const fp = req.body && req.body.deviceFingerprint;
  if (!fp) return next(); // fingerprint validation is handled elsewhere

  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const max = config.rateLimit.voteMax;

  let entry = deviceWindows.get(fp);
  if (!entry || now - entry.windowStart > windowMs) {
    entry = { count: 0, windowStart: now };
  }
  entry.count++;
  deviceWindows.set(fp, entry);

  if (entry.count > max) {
    auditLog.append({
      action: 'RATE_LIMIT_EXCEEDED_DEVICE',
      data: { deviceFingerprint: fp.slice(0, 8) + '…', widgetId: req.params.widgetId },
    });
    return res.status(429).json({
      error: 'Vote rate limit exceeded for this device',
    });
  }

  next();
}

// Prune the in-memory map periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [fp, entry] of deviceWindows.entries()) {
    if (now - entry.windowStart > config.rateLimit.windowMs * 2) {
      deviceWindows.delete(fp);
    }
  }
}, 60_000).unref();

module.exports = {
  globalLimiter,
  voteLimiter,
  deviceLimiter,
};
