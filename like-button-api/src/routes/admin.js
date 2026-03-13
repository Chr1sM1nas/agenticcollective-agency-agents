'use strict';

/**
 * Admin API Routes.
 *
 * All endpoints require authentication + 'admin' scope except where noted.
 *
 * POST   /api/admin/api-keys           – create a new API key
 * DELETE /api/admin/api-keys/:id       – revoke an API key
 * GET    /api/admin/api-keys           – list all API keys
 * POST   /api/admin/widgets            – register a new widget
 * GET    /api/admin/audit-log          – retrieve audit log entries
 * GET    /api/admin/audit-log/verify   – verify audit chain integrity
 * POST   /api/admin/forensics/:widgetId – generate legal evidence package
 * POST   /api/admin/forensics/verify   – verify an evidence certificate
 * POST   /api/auth/token               – issue a JWT (uses admin JWT secret)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { authenticate, requireScope, issueJwt, issueAdminJwt } = require('../middleware/auth');
const { validateWidgetId } = require('../middleware/validation');
const { generateApiKey, hashApiKey } = require('../services/crypto');
const auditLog = require('../services/auditLog');
const forensics = require('../services/forensics');
const db = require('../database/db');
const config = require('../config/security');

// ── POST /api/auth/token ──────────────────────────────────────────────────────
// Issues a signed JWT.  In production this endpoint should be protected by
// mTLS or IP allow-listing; here it is protected by an admin secret header.

router.post('/auth/token', (req, res) => {
  const { sub, scopes, adminSecret } = req.body || {};

  if (!adminSecret || adminSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    auditLog.append({
      action: 'AUTH_TOKEN_REJECTED',
      data: { ip: req.ip, reason: 'invalid adminSecret' },
    });
    return res.status(401).json({ error: 'Invalid admin secret' });
  }

  if (!sub) {
    return res.status(400).json({ error: 'Missing sub (subject)' });
  }

  const token = issueJwt(sub, scopes || ['vote:write', 'vote:read']);
  auditLog.append({
    action: 'JWT_ISSUED',
    actor: sub,
    data: { scopes: scopes || ['vote:write', 'vote:read'], ip: req.ip },
  });

  res.json({ token });
});

// All routes below require authentication with 'admin' scope
const adminAuth = [authenticate, requireScope('admin')];

// ── POST /api/admin/api-keys ──────────────────────────────────────────────────

router.post('/admin/api-keys', ...adminAuth, (req, res) => {
  const { name, scopes } = req.body || {};
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const id = uuidv4();

  db.insertApiKey(id, keyHash, name || null, scopes || 'vote:write,vote:read');

  auditLog.append({
    action: 'API_KEY_CREATED',
    actor: req.auth.sub,
    resourceType: 'api_key',
    resourceId: id,
    data: { name, scopes, ip: req.ip },
  });

  // Return the raw key ONCE – it is never stored in plain text
  res.status(201).json({
    id,
    apiKey: rawKey,
    warning: 'Store this key securely – it will not be shown again',
    scopes: scopes || 'vote:write,vote:read',
  });
});

// ── DELETE /api/admin/api-keys/:id ────────────────────────────────────────────

router.delete('/admin/api-keys/:id', ...adminAuth, (req, res) => {
  const { id } = req.params;
  db.revokeApiKey(id);

  auditLog.append({
    action: 'API_KEY_REVOKED',
    actor: req.auth.sub,
    resourceType: 'api_key',
    resourceId: id,
    data: { ip: req.ip },
  });

  res.json({ success: true, id });
});

// ── GET /api/admin/api-keys ───────────────────────────────────────────────────

router.get('/admin/api-keys', ...adminAuth, (req, res) => {
  res.json({ apiKeys: db.listApiKeys() });
});

// ── POST /api/admin/widgets ───────────────────────────────────────────────────

router.post('/admin/widgets', ...adminAuth, (req, res) => {
  const { id, name, owner } = req.body || {};
  if (!id || !name) {
    return res.status(400).json({ error: 'id and name are required' });
  }

  const widget = db.createWidget(id, name, owner || null);

  auditLog.append({
    action: 'WIDGET_CREATED',
    actor: req.auth.sub,
    resourceType: 'widget',
    resourceId: id,
    data: { name, owner, ip: req.ip },
  });

  res.status(201).json({ widget });
});

// ── GET /api/admin/audit-log ──────────────────────────────────────────────────

router.get(
  '/admin/audit-log',
  authenticate,
  requireScope('audit:read'),
  (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const offset = parseInt(req.query.offset || '0', 10);
    const entries = auditLog.getFullLog(limit, offset);
    res.json({ entries, limit, offset });
  },
);

// ── GET /api/admin/audit-log/verify ──────────────────────────────────────────

router.get(
  '/admin/audit-log/verify',
  authenticate,
  requireScope('audit:read'),
  (req, res) => {
    const result = auditLog.verifyChain();
    auditLog.append({
      action: 'AUDIT_CHAIN_VERIFIED',
      actor: req.auth.sub,
      data: { result },
    });
    res.json(result);
  },
);

// ── POST /api/admin/forensics/verify ─────────────────────────────────────────
// IMPORTANT: This route must be defined BEFORE /admin/forensics/:widgetId
//            so that 'verify' is not treated as a wildcard widgetId.

router.post(
  '/admin/forensics/verify',
  authenticate,
  requireScope('forensics'),
  (req, res) => {
    const { certificate, evidence } = req.body || {};
    if (!certificate || !evidence) {
      return res.status(400).json({ error: 'Both certificate and evidence are required' });
    }

    const result = forensics.verifyCertificate(certificate, evidence);
    res.json(result);
  },
);

// ── POST /api/admin/forensics/:widgetId ───────────────────────────────────────

router.post(
  '/admin/forensics/:widgetId',
  validateWidgetId,
  authenticate,
  requireScope('forensics'),
  (req, res) => {
    const { widgetId } = req.params;
    const requestedBy = req.auth.sub;

    try {
      const pkg = forensics.generateEvidencePackage(widgetId, requestedBy);
      res.json(pkg);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },
);

module.exports = router;
