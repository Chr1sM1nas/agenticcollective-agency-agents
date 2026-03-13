'use strict';

/**
 * Immutable Audit Log Service with blockchain-style hash chain.
 *
 * Every entry contains:
 *  - data_hash    : SHA-256 of the event payload
 *  - previous_hash: hash of the preceding entry (links the chain)
 *  - entry_hash   : SHA-256 of (sequence + timestamp + action + data_hash + previous_hash)
 *  - seal         : HMAC-SHA256 of entry_hash (proves authenticity of each node)
 *
 * Verification walks the entire chain and checks:
 *  1. Each entry_hash matches its recomputed value
 *  2. Each seal is valid
 *  3. Each previous_hash matches the actual previous entry_hash
 */

const { v4: uuidv4 } = require('uuid');
const cryptoSvc = require('./crypto');
const config = require('../config/security');
const db = require('../database/db');

const GENESIS_HASH = '0'.repeat(64); // sentinel previous_hash for the first entry

// ── Append an entry ───────────────────────────────────────────────────────────

/**
 * Append a new tamper-evident entry to the audit log.
 *
 * @param {object} opts
 * @param {string}  opts.action        – e.g. 'VOTE_REGISTERED'
 * @param {string}  [opts.actor]       – who performed the action (API key id, JWT sub, etc.)
 * @param {string}  [opts.resourceType]– e.g. 'vote', 'api_key'
 * @param {string}  [opts.resourceId]  – ID of the affected resource
 * @param {object}  [opts.data]        – arbitrary event payload (JSON-serialisable)
 */
function append({ action, actor, resourceType, resourceId, data }) {
  const id = uuidv4();
  const sequence = db.getNextAuditSequence();
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data || {});
  const dataHash = cryptoSvc.sha256(dataJson);

  const prev = db.getLastAuditEntry();
  const previousHash = prev ? prev.entry_hash : GENESIS_HASH;

  // Canonical string for the entry hash
  const canonical = `${sequence}|${timestamp}|${action}|${dataHash}|${previousHash}`;
  const entryHash = cryptoSvc.sha256(canonical);

  // HMAC seal – proves this node was written by a party that knows the secret
  const seal = cryptoSvc.hmacSign(entryHash, config.auditLog.secret);

  db.insertAuditEntry({
    id,
    sequence,
    timestamp,
    action,
    actor: actor || null,
    resourceType: resourceType || null,
    resourceId: resourceId || null,
    dataJson,
    dataHash,
    previousHash,
    entryHash,
    seal,
  });

  return { id, sequence, entryHash };
}

// ── Verification ──────────────────────────────────────────────────────────────

/**
 * Verify the complete integrity of the audit log hash chain.
 *
 * @returns {{ valid: boolean, checkedEntries: number, firstFailure?: object }}
 */
function verifyChain() {
  const entries = db.getAuditLog(100000, 0);
  let previousHash = GENESIS_HASH;

  for (const entry of entries) {
    // 0. Verify data_hash matches the stored data_json
    const expectedDataHash = cryptoSvc.sha256(entry.data_json);
    if (expectedDataHash !== entry.data_hash) {
      return {
        valid: false,
        checkedEntries: entry.sequence,
        firstFailure: {
          id: entry.id,
          sequence: entry.sequence,
          reason: 'data_hash mismatch – event payload (data_json) was modified',
        },
      };
    }

    // 1. Re-compute expected entry_hash
    const canonical = `${entry.sequence}|${entry.timestamp}|${entry.action}|${entry.data_hash}|${entry.previous_hash}`;
    const expectedEntryHash = cryptoSvc.sha256(canonical);

    if (expectedEntryHash !== entry.entry_hash) {
      return {
        valid: false,
        checkedEntries: entry.sequence,
        firstFailure: {
          id: entry.id,
          sequence: entry.sequence,
          reason: 'entry_hash mismatch – entry data was modified',
        },
      };
    }

    // 2. Verify HMAC seal
    const expectedSeal = cryptoSvc.hmacSign(entry.entry_hash, config.auditLog.secret);
    const sealValid = cryptoSvc.hmacVerify(entry.entry_hash, entry.seal, config.auditLog.secret);
    if (!sealValid) {
      return {
        valid: false,
        checkedEntries: entry.sequence,
        firstFailure: {
          id: entry.id,
          sequence: entry.sequence,
          reason: 'seal verification failed – unauthorised modification detected',
        },
      };
    }

    // 3. Check hash chain linkage
    if (entry.previous_hash !== previousHash) {
      return {
        valid: false,
        checkedEntries: entry.sequence,
        firstFailure: {
          id: entry.id,
          sequence: entry.sequence,
          reason: `previous_hash mismatch – chain broken between sequence ${entry.sequence - 1} and ${entry.sequence}`,
        },
      };
    }

    previousHash = entry.entry_hash;
  }

  return { valid: true, checkedEntries: entries.length };
}

// ── Query helpers ─────────────────────────────────────────────────────────────

function getFullLog(limit, offset) {
  return db.getAuditLog(limit, offset);
}

function getLogForResource(resourceType, resourceId) {
  return db.getAuditLogByResource(resourceType, resourceId);
}

module.exports = {
  append,
  verifyChain,
  getFullLog,
  getLogForResource,
  GENESIS_HASH,
};
