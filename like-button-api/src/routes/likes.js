'use strict';

/**
 * Like Button API Routes.
 *
 * GET    /api/likes/:widgetId         – return current like count (public)
 * GET    /api/likes/:widgetId/check   – check whether device already voted (auth required)
 * POST   /api/likes/:widgetId         – register a vote (auth required)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { authenticate, requireScope } = require('../middleware/auth');
const { voteLimiter, deviceLimiter } = require('../middleware/rateLimiter');
const { validateWidgetId, validateVoteBody } = require('../middleware/validation');
const { signVote, generateNonce, hmacSign } = require('../services/crypto');
const { validateFingerprint, verifyFingerprintComponents } = require('../services/fingerprint');
const auditLog = require('../services/auditLog');
const db = require('../database/db');
const config = require('../config/security');

// ── GET /api/likes/:widgetId ──────────────────────────────────────────────────

router.get('/:widgetId', validateWidgetId, (req, res) => {
  const { widgetId } = req.params;

  // Auto-create widget on first access (dev convenience; in prod, pre-register widgets)
  let widget = db.getWidget(widgetId);
  if (!widget) {
    widget = db.createWidget(widgetId, widgetId, null);
  }

  const count = db.getVoteCount(widgetId);
  const nonce = generateNonce();

  res.json({
    widgetId,
    count,
    nonce, // widget uses this nonce for the subsequent vote POST
  });
});

// ── GET /api/likes/:widgetId/check ────────────────────────────────────────────

router.get(
  '/:widgetId/check',
  validateWidgetId,
  authenticate,
  requireScope('vote:read'),
  (req, res) => {
    const { widgetId } = req.params;
    const fp = req.query.deviceFingerprint;

    if (!fp) {
      return res.status(400).json({ error: 'Missing deviceFingerprint query parameter' });
    }

    const fpCheck = validateFingerprint(fp);
    if (!fpCheck.valid) {
      return res.status(400).json({ error: fpCheck.reason });
    }

    const voted = db.hasVoted(widgetId, fp);
    res.json({ widgetId, deviceFingerprint: fp, voted });
  },
);

// ── POST /api/likes/:widgetId ─────────────────────────────────────────────────

router.post(
  '/:widgetId',
  validateWidgetId,
  authenticate,
  requireScope('vote:write'),
  voteLimiter,
  deviceLimiter,
  validateVoteBody,
  (req, res) => {
    const { widgetId } = req.params;
    const { deviceFingerprint, fingerprintComponents, userAgent } = req.body;

    // ── 1. Validate device fingerprint ────────────────────────────────────────
    const fpCheck = validateFingerprint(deviceFingerprint);
    if (!fpCheck.valid) {
      auditLog.append({
        action: 'VOTE_REJECTED_INVALID_FINGERPRINT',
        actor: req.auth.sub,
        resourceType: 'vote',
        resourceId: widgetId,
        data: { reason: fpCheck.reason, ip: req.ip },
      });
      return res.status(400).json({ error: fpCheck.reason });
    }

    // ── 2. Optional: verify fingerprint components match the claimed hash ─────
    if (fingerprintComponents) {
      const compCheck = verifyFingerprintComponents(fingerprintComponents, deviceFingerprint);
      if (!compCheck.valid) {
        auditLog.append({
          action: 'VOTE_REJECTED_FINGERPRINT_SPOOFING',
          actor: req.auth.sub,
          resourceType: 'vote',
          resourceId: widgetId,
          data: { reason: compCheck.reason, ip: req.ip },
        });
        return res.status(400).json({ error: compCheck.reason });
      }
    }

    // ── 3. Ensure widget exists ───────────────────────────────────────────────
    let widget = db.getWidget(widgetId);
    if (!widget) {
      widget = db.createWidget(widgetId, widgetId, null);
    }

    // ── 4. Check for duplicate vote ───────────────────────────────────────────
    if (db.hasVoted(widgetId, deviceFingerprint)) {
      auditLog.append({
        action: 'VOTE_REJECTED_DUPLICATE',
        actor: req.auth.sub,
        resourceType: 'vote',
        resourceId: widgetId,
        data: { deviceFingerprint: deviceFingerprint.slice(0, 8) + '…', ip: req.ip },
      });
      const count = db.getVoteCount(widgetId);
      return res.status(409).json({
        error: 'This device has already voted',
        count,
      });
    }

    // ── 5. Build and sign the vote record ─────────────────────────────────────
    const voteId = uuidv4();
    const timestamp = new Date().toISOString();
    const ipAddress = req.ip || 'unknown';
    const effectiveUserAgent = userAgent || req.headers['user-agent'] || '';

    const voteRecord = {
      id: voteId,
      widgetId,
      deviceFingerprint,
      ipAddress,
      timestamp,
    };
    const signature = signVote(voteRecord);

    // ── 6. Persist the vote ───────────────────────────────────────────────────
    db.insertVote({
      id: voteId,
      widgetId,
      deviceFingerprint,
      ipAddress,
      userAgent: effectiveUserAgent.slice(0, 512),
      timestamp,
      signature,
    });

    // ── 7. Append audit log entry ─────────────────────────────────────────────
    auditLog.append({
      action: 'VOTE_REGISTERED',
      actor: req.auth.sub,
      resourceType: 'vote',
      resourceId: widgetId,
      data: {
        voteId,
        deviceFingerprint: deviceFingerprint.slice(0, 8) + '…', // never log full fp
        ip: ipAddress,
        timestamp,
        voteSignature: signature,
      },
    });

    const count = db.getVoteCount(widgetId);

    res.status(201).json({
      success: true,
      voteId,
      count,
      timestamp,
      signature, // client can store this as proof of their vote
    });
  },
);

module.exports = router;
