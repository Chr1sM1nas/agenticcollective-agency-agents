'use strict';

/**
 * Cryptographic service.
 *
 * Provides:
 *  - HMAC-SHA256 request/response signing
 *  - AES-256-GCM authenticated encryption / decryption
 *  - SHA-256 content hashing
 *  - API key generation and verification
 *  - Vote record signing
 */

const crypto = require('crypto');
const config = require('../config/security');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;  // 128-bit authentication tag

// ── Key preparation ───────────────────────────────────────────────────────────

/** Derive a fixed-length key buffer from a hex or utf8 string secret. */
function deriveKey(secret, lengthBytes = 32) {
  const buf = Buffer.from(secret, 'hex');
  if (buf.length === lengthBytes) return buf;
  // Use SHA-256 to normalise to 32 bytes
  return crypto.createHash('sha256').update(secret).digest();
}

const encryptionKey = deriveKey(config.encryption.key, 32);

// ── HMAC-SHA256 signing ───────────────────────────────────────────────────────

/**
 * Compute an HMAC-SHA256 hex digest.
 * @param {string} data  The string to sign.
 * @param {string} secret  HMAC secret (hex or utf8).
 */
function hmacSign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Constant-time comparison of two HMAC signatures.
 */
function hmacVerify(data, expected, secret) {
  const actual = hmacSign(data, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(actual, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

// ── Request signing ───────────────────────────────────────────────────────────

/**
 * Build the canonical signing string for a request.
 * Format: METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256(body)
 */
function buildRequestCanonical(method, path, timestamp, nonce, body) {
  const bodyHash = sha256(typeof body === 'string' ? body : JSON.stringify(body || ''));
  return [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n');
}

/**
 * Sign a request and return the hex signature.
 */
function signRequest(method, path, timestamp, nonce, body) {
  const canonical = buildRequestCanonical(method, path, timestamp, nonce, body);
  return hmacSign(canonical, config.signing.secret);
}

/**
 * Verify an incoming request signature.
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyRequestSignature(method, path, timestamp, nonce, body, providedSignature) {
  if (!providedSignature) {
    return { valid: false, reason: 'Missing X-Signature header' };
  }

  const nowSecs = Math.floor(Date.now() / 1000);
  const reqSecs = parseInt(timestamp, 10);
  if (isNaN(reqSecs)) {
    return { valid: false, reason: 'Invalid X-Timestamp header' };
  }
  if (Math.abs(nowSecs - reqSecs) > config.replay.toleranceSecs) {
    return { valid: false, reason: 'Request timestamp outside tolerance window (replay attack?)' };
  }
  if (!nonce || nonce.length < 8) {
    return { valid: false, reason: 'Missing or too-short X-Nonce header' };
  }

  const canonical = buildRequestCanonical(method, path, timestamp, nonce, body);
  const valid = hmacVerify(canonical, providedSignature, config.signing.secret);
  return valid ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
}

// ── SHA-256 hashing ───────────────────────────────────────────────────────────

/**
 * Compute a SHA-256 hex digest.
 */
function sha256(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// ── AES-256-GCM encryption ────────────────────────────────────────────────────

/**
 * Encrypt a string or object with AES-256-GCM.
 * @returns {{ iv, tag, ciphertext }} – all Base64-encoded strings.
 */
function encrypt(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: TAG_LENGTH,
  });
  const input = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const encrypted = Buffer.concat([cipher.update(input, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

/**
 * Decrypt an AES-256-GCM payload.
 * @param {{ iv, tag, ciphertext }} payload – Base64-encoded fields.
 * @returns {string} Decrypted plaintext.
 */
function decrypt(payload) {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// ── API key management ────────────────────────────────────────────────────────

const API_KEY_VERSION = 'v1';

/**
 * Generate a new API key.
 * Format: lba_v1_<16 random bytes hex>
 */
function generateApiKey() {
  const raw = crypto.randomBytes(16).toString('hex');
  return `lba_${API_KEY_VERSION}_${raw}`;
}

/**
 * Compute the HMAC signature of an API key (stored in DB, never the raw key).
 */
function hashApiKey(apiKey) {
  return hmacSign(apiKey, config.apiKey.secret);
}

// ── Vote record signing ───────────────────────────────────────────────────────

/**
 * Build a canonical representation of a vote record for signing.
 */
function buildVoteCanonical(vote) {
  const fields = [
    vote.id,
    vote.widgetId,
    vote.deviceFingerprint,
    vote.ipAddress,
    vote.timestamp,
  ];
  return fields.join('|');
}

/**
 * Sign a vote record.
 * @returns {string} HMAC-SHA256 hex signature.
 */
function signVote(vote) {
  const canonical = buildVoteCanonical(vote);
  return hmacSign(canonical, config.vote.signingSecret);
}

/**
 * Verify the integrity of a stored vote record.
 * @returns {boolean}
 */
function verifyVote(vote) {
  if (!vote.signature) return false;
  const canonical = buildVoteCanonical(vote);
  return hmacVerify(canonical, vote.signature, config.vote.signingSecret);
}

// ── Nonce generation ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random nonce string.
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  hmacSign,
  hmacVerify,
  signRequest,
  verifyRequestSignature,
  sha256,
  encrypt,
  decrypt,
  generateApiKey,
  hashApiKey,
  signVote,
  verifyVote,
  generateNonce,
};
