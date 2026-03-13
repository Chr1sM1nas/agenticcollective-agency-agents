'use strict';

/**
 * Tests for the cryptographic service.
 * Uses Node.js built-in test runner (node --test).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a'.repeat(128);
process.env.API_KEY_SECRET = 'b'.repeat(64);
process.env.SIGNING_SECRET = 'c'.repeat(64);
process.env.ENCRYPTION_KEY = 'd'.repeat(64);
process.env.VOTE_SIGNING_SECRET = 'e'.repeat(64);
process.env.AUDIT_LOG_SECRET = 'f'.repeat(64);

const crypto = require('../services/crypto');

describe('HMAC signing', () => {
  it('produces a 64-char hex digest', () => {
    const sig = crypto.hmacSign('hello', 'secret');
    assert.equal(sig.length, 64);
    assert.match(sig, /^[a-f0-9]+$/);
  });

  it('verifies a valid signature', () => {
    const msg = 'test message';
    const secret = 'my-secret';
    const sig = crypto.hmacSign(msg, secret);
    assert.equal(crypto.hmacVerify(msg, sig, secret), true);
  });

  it('rejects a tampered message', () => {
    const sig = crypto.hmacSign('original', 'secret');
    assert.equal(crypto.hmacVerify('modified', sig, 'secret'), false);
  });

  it('rejects a wrong secret', () => {
    const sig = crypto.hmacSign('message', 'secret1');
    assert.equal(crypto.hmacVerify('message', sig, 'secret2'), false);
  });
});

describe('SHA-256 hashing', () => {
  it('is deterministic', () => {
    assert.equal(crypto.sha256('hello'), crypto.sha256('hello'));
  });

  it('differs for different inputs', () => {
    assert.notEqual(crypto.sha256('hello'), crypto.sha256('world'));
  });

  it('produces a 64-char hex string', () => {
    assert.equal(crypto.sha256('anything').length, 64);
  });
});

describe('AES-256-GCM encryption', () => {
  it('encrypts and decrypts a string', () => {
    const plaintext = 'Secret legal evidence data';
    const enc = crypto.encrypt(plaintext);
    assert.ok(enc.iv);
    assert.ok(enc.tag);
    assert.ok(enc.ciphertext);
    assert.notEqual(enc.ciphertext, plaintext);
    assert.equal(crypto.decrypt(enc), plaintext);
  });

  it('encrypts and decrypts an object', () => {
    const obj = { voteId: 'abc-123', count: 42 };
    const enc = crypto.encrypt(obj);
    assert.equal(crypto.decrypt(enc), JSON.stringify(obj));
  });

  it('throws when tag is tampered', () => {
    const enc = crypto.encrypt('data');
    enc.tag = Buffer.from('badtagbadtagbadt').toString('base64');
    assert.throws(() => crypto.decrypt(enc));
  });
});

describe('API key generation', () => {
  it('generates keys starting with lba_v1_', () => {
    const key = crypto.generateApiKey();
    assert.ok(key.startsWith('lba_v1_'));
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => crypto.generateApiKey()));
    assert.equal(keys.size, 100);
  });

  it('hash is deterministic', () => {
    const key = crypto.generateApiKey();
    assert.equal(crypto.hashApiKey(key), crypto.hashApiKey(key));
  });
});

describe('Vote record signing', () => {
  const vote = {
    id: 'vote-1',
    widgetId: 'widget-1',
    deviceFingerprint: 'a'.repeat(64),
    ipAddress: '192.168.1.1',
    timestamp: '2026-01-01T00:00:00.000Z',
  };

  it('signs a vote and verifies it', () => {
    const sig = crypto.signVote(vote);
    assert.ok(sig);
    assert.equal(crypto.verifyVote({ ...vote, signature: sig }), true);
  });

  it('rejects a tampered vote', () => {
    const sig = crypto.signVote(vote);
    assert.equal(crypto.verifyVote({ ...vote, ipAddress: '10.0.0.1', signature: sig }), false);
  });

  it('rejects missing signature', () => {
    assert.equal(crypto.verifyVote({ ...vote, signature: undefined }), false);
  });
});

describe('Request signature verification', () => {
  it('rejects requests outside the timestamp tolerance', () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
    const result = crypto.verifyRequestSignature(
      'POST', '/api/likes/w1', oldTimestamp, 'nonce12345678', {}, 'fakesig'
    );
    assert.equal(result.valid, false);
    assert.match(result.reason, /timestamp/i);
  });

  it('rejects a missing signature', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const result = crypto.verifyRequestSignature('POST', '/path', ts, 'nonce12345678', {}, undefined);
    assert.equal(result.valid, false);
  });

  it('rejects a short nonce', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const result = crypto.verifyRequestSignature('POST', '/path', ts, 'short', {}, 'sig');
    assert.equal(result.valid, false);
    assert.match(result.reason, /nonce/i);
  });

  it('verifies a correctly signed request', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const nonce = 'a'.repeat(16);
    const body = { deviceFingerprint: 'b'.repeat(64) };
    const sig = crypto.signRequest('POST', '/api/likes/w1', ts, nonce, body);
    const result = crypto.verifyRequestSignature('POST', '/api/likes/w1', ts, nonce, body, sig);
    assert.equal(result.valid, true);
  });
});

describe('Nonce generation', () => {
  it('generates 32-char hex nonces', () => {
    const nonce = crypto.generateNonce();
    assert.equal(nonce.length, 32);
    assert.match(nonce, /^[a-f0-9]+$/);
  });

  it('generates unique nonces', () => {
    const nonces = new Set(Array.from({ length: 100 }, () => crypto.generateNonce()));
    assert.equal(nonces.size, 100);
  });
});
