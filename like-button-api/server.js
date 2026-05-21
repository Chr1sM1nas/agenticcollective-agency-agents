'use strict';

/**
 * Like Button API – Main Server Entry Point
 *
 * Security stack (applied in order):
 *  1. requireHttps    – redirect HTTP → HTTPS in production
 *  2. requestId       – attach X-Request-Id to every response
 *  3. helmet          – comprehensive security headers
 *  4. cors            – origin-restricted CORS
 *  5. globalLimiter   – per-IP rate limiting on all routes
 *  6. jsonBodyParser  – 32 KB body size limit
 *  7. Per-route auth + scope enforcement
 *  8. Per-route input validation
 *  9. Per-route vote-specific rate limiting
 */

// Load environment variables from .env if present (development convenience)
try {
  require('fs').readFileSync('.env');
  // Simple .env loader without external dependency
  const lines = require('fs').readFileSync('.env', 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // No .env file – that's fine in production (use real env vars)
}

const express = require('express');
const securityMiddleware = require('./src/middleware/security');
const { globalLimiter } = require('./src/middleware/rateLimiter');
const likesRouter = require('./src/routes/likes');
const adminRouter = require('./src/routes/admin');
const config = require('./src/config/security');

const app = express();

// Trust the first proxy hop (for correct IP in rate limiting / logging)
app.set('trust proxy', 1);

// ── Security middleware ───────────────────────────────────────────────────────

app.use(securityMiddleware.requireHttps);
app.use(securityMiddleware.requestId);
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(globalLimiter);
app.use(securityMiddleware.jsonBodyParser());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/likes', likesRouter);
app.use('/api', adminRouter);

// ── Health check (unauthenticated) ────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(`[${new Date().toISOString()}] [ERROR] ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const port = config.port;
  app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Like Button API listening on port ${port}`);
    console.log(`[${new Date().toISOString()}] Environment: ${config.env}`);
  });
}

module.exports = app;
