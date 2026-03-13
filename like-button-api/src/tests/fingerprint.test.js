'use strict';

/**
 * Tests for device fingerprint validation.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { validateFingerprint, verifyFingerprintComponents, shannonEntropy } = require('../services/fingerprint');

describe('Shannon entropy', () => {
  it('returns 0 for a single-character string', () => {
    assert.equal(shannonEntropy('aaaa'), 0);
  });

  it('returns higher entropy for diverse strings', () => {
    assert.ok(shannonEntropy('abcdef1234567890') > 3.0);
  });
});

describe('validateFingerprint', () => {
  it('accepts a valid 64-char hex fingerprint', () => {
    const fp = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
    const result = validateFingerprint(fp);
    assert.equal(result.valid, true);
  });

  it('rejects a missing fingerprint', () => {
    assert.equal(validateFingerprint(null).valid, false);
    assert.equal(validateFingerprint(undefined).valid, false);
    assert.equal(validateFingerprint('').valid, false);
  });

  it('rejects a too-short fingerprint', () => {
    const result = validateFingerprint('abc123');
    assert.equal(result.valid, false);
    assert.match(result.reason, /format/i);
  });

  it('rejects a known trivial fingerprint', () => {
    const result = validateFingerprint('0'.repeat(64));
    assert.equal(result.valid, false);
    assert.match(result.reason, /trivial|spoofed/i);
  });

  it('rejects a low-entropy fingerprint', () => {
    // All same character (but not in BLOCKED_FINGERPRINTS – use 'b')
    const result = validateFingerprint('b'.repeat(64));
    assert.equal(result.valid, false);
    assert.match(result.reason, /entropy/i);
  });

  it('rejects non-hex characters', () => {
    const result = validateFingerprint('z'.repeat(64));
    assert.equal(result.valid, false);
  });
});

describe('verifyFingerprintComponents', () => {
  it('returns valid when no components are provided', () => {
    const result = verifyFingerprintComponents(null, 'anything');
    assert.equal(result.valid, true);
  });

  it('accepts matching components and fingerprint', () => {
    const crypto = require('crypto');
    const components = { ua: 'Mozilla', lang: 'en', screen: '1920x1080' };
    const canonical = JSON.stringify(
      Object.keys(components).sort().reduce((acc, k) => { acc[k] = components[k]; return acc; }, {}),
    );
    const expected = crypto.createHash('sha256').update(canonical).digest('hex');
    const result = verifyFingerprintComponents(components, expected);
    assert.equal(result.valid, true);
  });

  it('rejects mismatched components', () => {
    const components = { ua: 'Mozilla' };
    const result = verifyFingerprintComponents(components, 'a'.repeat(64));
    assert.equal(result.valid, false);
    assert.match(result.reason, /spoofing/i);
  });
});
