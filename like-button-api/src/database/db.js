'use strict';

/**
 * Database layer – SQLite via better-sqlite3.
 *
 * Schema:
 *  - widgets         : registered widget instances
 *  - votes           : one vote per (widgetId, deviceFingerprint), cryptographically signed
 *  - api_keys        : API key registry (stores HMAC of the key, never the raw key)
 *  - nonces          : used nonces for replay-attack prevention
 *  - audit_log       : append-only tamper-evident log with SHA-256 hash chain
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/security');

let db;

function getDb() {
  if (!db) {
    const dbPath = path.resolve(config.db.path);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    initialise(db);
  }
  return db;
}

function initialise(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS widgets (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      owner       TEXT,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      active      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS votes (
      id                  TEXT PRIMARY KEY,
      widget_id           TEXT NOT NULL REFERENCES widgets(id),
      device_fingerprint  TEXT NOT NULL,
      ip_address          TEXT NOT NULL,
      user_agent          TEXT,
      timestamp           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      signature           TEXT NOT NULL,
      UNIQUE(widget_id, device_fingerprint)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id          TEXT PRIMARY KEY,
      key_hash    TEXT NOT NULL UNIQUE,
      name        TEXT,
      scopes      TEXT NOT NULL DEFAULT 'vote:write,vote:read',
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      last_used   TEXT,
      revoked     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS nonces (
      nonce       TEXT PRIMARY KEY,
      expires_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id            TEXT PRIMARY KEY,
      sequence      INTEGER NOT NULL UNIQUE,
      timestamp     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      action        TEXT NOT NULL,
      actor         TEXT,
      resource_type TEXT,
      resource_id   TEXT,
      data_json     TEXT,
      data_hash     TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      entry_hash    TEXT NOT NULL,
      seal          TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_votes_widget ON votes(widget_id);
    CREATE INDEX IF NOT EXISTS idx_votes_fp     ON votes(device_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_audit_seq    ON audit_log(sequence);
    CREATE INDEX IF NOT EXISTS idx_nonces_exp   ON nonces(expires_at);
  `);
}

// ── Widgets ───────────────────────────────────────────────────────────────────

function createWidget(id, name, owner) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO widgets (id, name, owner) VALUES (?, ?, ?)`)
    .run(id, name, owner || null);
  return db.prepare('SELECT * FROM widgets WHERE id = ?').get(id);
}

function getWidget(id) {
  return getDb().prepare('SELECT * FROM widgets WHERE id = ? AND active = 1').get(id);
}

// ── Votes ─────────────────────────────────────────────────────────────────────

function hasVoted(widgetId, deviceFingerprint) {
  const row = getDb()
    .prepare('SELECT id FROM votes WHERE widget_id = ? AND device_fingerprint = ?')
    .get(widgetId, deviceFingerprint);
  return !!row;
}

function insertVote(vote) {
  getDb()
    .prepare(`
      INSERT INTO votes (id, widget_id, device_fingerprint, ip_address, user_agent, timestamp, signature)
      VALUES (@id, @widgetId, @deviceFingerprint, @ipAddress, @userAgent, @timestamp, @signature)
    `)
    .run(vote);
}

function getVoteCount(widgetId) {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS cnt FROM votes WHERE widget_id = ?')
    .get(widgetId);
  return row ? row.cnt : 0;
}

function getVote(id) {
  return getDb().prepare('SELECT * FROM votes WHERE id = ?').get(id);
}

function getAllVotes(widgetId) {
  return getDb()
    .prepare('SELECT * FROM votes WHERE widget_id = ? ORDER BY timestamp ASC')
    .all(widgetId);
}

// ── API keys ──────────────────────────────────────────────────────────────────

function insertApiKey(id, keyHash, name, scopes) {
  getDb()
    .prepare(`INSERT INTO api_keys (id, key_hash, name, scopes) VALUES (?, ?, ?, ?)`)
    .run(id, keyHash, name || null, scopes || 'vote:write,vote:read');
}

function getApiKeyByHash(keyHash) {
  return getDb()
    .prepare('SELECT * FROM api_keys WHERE key_hash = ? AND revoked = 0')
    .get(keyHash);
}

function touchApiKey(id) {
  getDb()
    .prepare(`UPDATE api_keys SET last_used = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
    .run(id);
}

function revokeApiKey(id) {
  getDb().prepare('UPDATE api_keys SET revoked = 1 WHERE id = ?').run(id);
}

function listApiKeys() {
  return getDb().prepare('SELECT id, name, scopes, created_at, last_used, revoked FROM api_keys').all();
}

// ── Nonces (replay prevention) ────────────────────────────────────────────────

function consumeNonce(nonce, ttlSecs) {
  const db = getDb();
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSecs;
  try {
    db.prepare('INSERT INTO nonces (nonce, expires_at) VALUES (?, ?)').run(nonce, expiresAt);
    return true; // new nonce – allow request
  } catch {
    return false; // duplicate – reject
  }
}

function pruneNonces() {
  const now = Math.floor(Date.now() / 1000);
  getDb().prepare('DELETE FROM nonces WHERE expires_at < ?').run(now);
}

// ── Audit log ─────────────────────────────────────────────────────────────────

function getLastAuditEntry() {
  return getDb()
    .prepare('SELECT * FROM audit_log ORDER BY sequence DESC LIMIT 1')
    .get();
}

function getNextAuditSequence() {
  const row = getDb()
    .prepare('SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM audit_log')
    .get();
  return row.next;
}

function insertAuditEntry(entry) {
  getDb()
    .prepare(`
      INSERT INTO audit_log
        (id, sequence, timestamp, action, actor, resource_type, resource_id,
         data_json, data_hash, previous_hash, entry_hash, seal)
      VALUES
        (@id, @sequence, @timestamp, @action, @actor, @resourceType, @resourceId,
         @dataJson, @dataHash, @previousHash, @entryHash, @seal)
    `)
    .run(entry);
}

function getAuditLog(limit = 100, offset = 0) {
  return getDb()
    .prepare('SELECT * FROM audit_log ORDER BY sequence ASC LIMIT ? OFFSET ?')
    .all(limit, offset);
}

function getAuditLogByResource(resourceType, resourceId) {
  return getDb()
    .prepare('SELECT * FROM audit_log WHERE resource_type = ? AND resource_id = ? ORDER BY sequence ASC')
    .all(resourceType, resourceId);
}

module.exports = {
  getDb,
  createWidget,
  getWidget,
  hasVoted,
  insertVote,
  getVoteCount,
  getVote,
  getAllVotes,
  insertApiKey,
  getApiKeyByHash,
  touchApiKey,
  revokeApiKey,
  listApiKeys,
  consumeNonce,
  pruneNonces,
  getLastAuditEntry,
  getNextAuditSequence,
  insertAuditEntry,
  getAuditLog,
  getAuditLogByResource,
};
