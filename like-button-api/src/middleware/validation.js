'use strict';

/**
 * Input validation & sanitization middleware.
 *
 * Validates and sanitizes:
 *  - widgetId path parameter
 *  - vote request body fields
 *  - replay-prevention headers (X-Timestamp, X-Nonce)
 */

const { verifyRequestSignature } = require('../services/crypto');
const { consumeNonce, pruneNonces } = require('../database/db');
const config = require('../config/security');

// Safe ID pattern – alphanumeric, dash, underscore; max 64 chars
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
// User-agent max length
const UA_MAX = 512;
// Fingerprint pattern (validated more strictly in fingerprint service)
const FP_RE = /^[a-fA-F0-9]{32,128}$/;

/**
 * Sanitize a string: strip NUL bytes and control characters; trim whitespace.
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

// ── Widget ID param validation ────────────────────────────────────────────────

function validateWidgetId(req, res, next) {
  const id = sanitize(req.params.widgetId || '');
  if (!SAFE_ID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid widgetId: must be 1–64 alphanumeric/dash/underscore chars' });
  }
  req.params.widgetId = id;
  next();
}

// ── Vote body validation ──────────────────────────────────────────────────────

function validateVoteBody(req, res, next) {
  const body = req.body || {};

  const fp = sanitize(body.deviceFingerprint || '');
  if (!fp || !FP_RE.test(fp)) {
    return res.status(400).json({ error: 'Invalid or missing deviceFingerprint' });
  }

  // Optional user-agent override (from client widget)
  if (body.userAgent && typeof body.userAgent === 'string') {
    req.body.userAgent = sanitize(body.userAgent).slice(0, UA_MAX);
  }

  req.body.deviceFingerprint = fp;
  next();
}

// ── Replay-attack prevention (optional, activated on signed routes) ───────────

/**
 * Middleware that:
 *  1. Verifies HMAC-SHA256 request signature from X-Signature header
 *  2. Checks X-Timestamp is within tolerance
 *  3. Consumes the nonce from X-Nonce (rejects duplicate nonces)
 *
 * This middleware is OPTIONAL for public vote routes but REQUIRED for admin.
 */
function verifySignedRequest(req, res, next) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const nonce = sanitize(req.headers['x-nonce'] || '');

  const result = verifyRequestSignature(
    req.method,
    req.path,
    timestamp,
    nonce,
    req.body,
    signature,
  );

  if (!result.valid) {
    return res.status(400).json({ error: `Request signature invalid: ${result.reason}` });
  }

  // Consume nonce to prevent replay attacks
  pruneNonces();
  const nonceOk = consumeNonce(nonce, config.replay.toleranceSecs * 2);
  if (!nonceOk) {
    return res.status(400).json({ error: 'Duplicate nonce – potential replay attack' });
  }

  next();
}

module.exports = {
  validateWidgetId,
  validateVoteBody,
  verifySignedRequest,
  sanitize,
};
