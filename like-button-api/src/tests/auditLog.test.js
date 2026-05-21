'use strict';

/**
 * Tests for the immutable audit log service.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a'.repeat(128);
process.env.API_KEY_SECRET = 'b'.repeat(64);
process.env.SIGNING_SECRET = 'c'.repeat(64);
process.env.ENCRYPTION_KEY = 'd'.repeat(64);
process.env.VOTE_SIGNING_SECRET = 'e'.repeat(64);
process.env.AUDIT_LOG_SECRET = 'f'.repeat(64);

const tmpDb = path.join(require('os').tmpdir(), `lba_test_audit_${Date.now()}.db`);
process.env.DB_PATH = tmpDb;

const auditLog = require('../services/auditLog');
const cryptoSvc = require('../services/crypto');
const db = require('../database/db');

describe('Audit log – append and verify', () => {
  it('appends entries and verifies chain integrity', () => {
    auditLog.append({ action: 'TEST_ACTION_1', data: { x: 1 } });
    auditLog.append({ action: 'TEST_ACTION_2', actor: 'user-1', data: { x: 2 } });
    auditLog.append({ action: 'TEST_ACTION_3', resourceType: 'vote', resourceId: 'w1', data: { x: 3 } });

    const result = auditLog.verifyChain();
    assert.equal(result.valid, true);
    assert.ok(result.checkedEntries >= 3);
  });

  it('detects a tampered data_json field', () => {
    // Append a fresh entry
    auditLog.append({ action: 'PRE_TAMPER', data: { safe: true } });

    // Get last sequence number before appending the one we will tamper
    const before = db.getAuditLog(10000, 0);
    const seqBefore = before.length > 0 ? before[before.length - 1].sequence : 0;

    auditLog.append({ action: 'TO_BE_TAMPERED', data: { original: true } });

    // Tamper the last inserted entry directly in the SQLite database
    const sqliteDb = db.getDb();
    sqliteDb.prepare(
      "UPDATE audit_log SET data_json = '{\"tampered\":true}' WHERE sequence = ?"
    ).run(seqBefore + 1);

    const result = auditLog.verifyChain();
    assert.equal(result.valid, false);
    assert.ok(result.firstFailure, 'firstFailure should be set');
    assert.match(result.firstFailure.reason, /mismatch|modified/i);
  });

  it('detects a tampered entry_hash field', () => {
    // Reset the db to a known-clean state by appending a legitimate entry
    auditLog.append({ action: 'BEFORE_HASH_TAMPER', data: {} });
    const entries = db.getAuditLog(10000, 0);
    const lastSeq = entries[entries.length - 1].sequence;

    // Tamper the entry_hash of this entry directly
    const sqliteDb = db.getDb();
    sqliteDb.prepare(
      "UPDATE audit_log SET entry_hash = 'badhash' || substr(entry_hash, 8) WHERE sequence = ?"
    ).run(lastSeq);

    const result = auditLog.verifyChain();
    assert.equal(result.valid, false);
    assert.ok(result.firstFailure);
  });

  it('detects a broken hash chain link', () => {
    // Append two more entries
    auditLog.append({ action: 'CHAIN_TEST_A', data: {} });
    auditLog.append({ action: 'CHAIN_TEST_B', data: {} });

    const entries = db.getAuditLog(10000, 0);
    const last = entries[entries.length - 1];

    // Tamper previous_hash of the last entry so it no longer links to the one before
    const sqliteDb = db.getDb();
    sqliteDb.prepare(
      "UPDATE audit_log SET previous_hash = 'badf00d' || substr(previous_hash, 8) WHERE sequence = ?"
    ).run(last.sequence);

    const result = auditLog.verifyChain();
    assert.equal(result.valid, false);
    assert.ok(result.firstFailure);
  });
});

describe('Audit log – query helpers', () => {
  it('retrieves entries by resource type and ID', () => {
    auditLog.append({ action: 'WIDGET_EVENT', resourceType: 'widget', resourceId: 'w-query-test', data: {} });
    auditLog.append({ action: 'VOTE_EVENT',   resourceType: 'vote',   resourceId: 'w-query-test', data: {} });
    auditLog.append({ action: 'OTHER_EVENT',  resourceType: 'other',  resourceId: 'other-id',     data: {} });

    const entries = auditLog.getLogForResource('vote', 'w-query-test');
    assert.ok(entries.length >= 1);
    entries.forEach(e => {
      assert.equal(e.resource_type, 'vote');
      assert.equal(e.resource_id, 'w-query-test');
    });

    // Clean up
    try { fs.unlinkSync(tmpDb); } catch (_) {}
  });
});
