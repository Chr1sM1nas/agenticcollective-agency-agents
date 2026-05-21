'use strict';

/**
 * Device fingerprinting validation.
 *
 * The client widget collects multiple signals and sends them as
 * `deviceFingerprint` (a deterministic hash) and `fingerprintComponents`
 * (the raw signals, optional for server-side validation).
 *
 * Server-side responsibilities:
 *  1. Validate format and minimum entropy of the fingerprint.
 *  2. Detect obvious spoofing patterns (e.g. always the same static value).
 *  3. Track per-fingerprint submission rate to detect distributed voting.
 */

const crypto = require('crypto');

// Minimum Shannon entropy threshold for a fingerprint string (bits/char)
const MIN_ENTROPY = 3.0;

// Regex: accept only hex or base64url fingerprints of reasonable length
const FP_REGEX = /^[a-fA-F0-9]{32,128}$/;

// Known static/trivial values that are clearly fabricated
const BLOCKED_FINGERPRINTS = new Set([
  '0'.repeat(64),
  '1'.repeat(64),
  'a'.repeat(64),
  'deadbeef'.repeat(8),
]);

/**
 * Compute the Shannon entropy (bits per character) of a string.
 */
function shannonEntropy(str) {
  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Validate a device fingerprint string.
 *
 * @param {string} fingerprint
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateFingerprint(fingerprint) {
  if (!fingerprint || typeof fingerprint !== 'string') {
    return { valid: false, reason: 'Missing or non-string fingerprint' };
  }

  if (!FP_REGEX.test(fingerprint)) {
    return { valid: false, reason: 'Fingerprint format invalid (must be 32–128 hex characters)' };
  }

  if (BLOCKED_FINGERPRINTS.has(fingerprint.toLowerCase())) {
    return { valid: false, reason: 'Fingerprint is a known trivial/spoofed value' };
  }

  const entropy = shannonEntropy(fingerprint);
  if (entropy < MIN_ENTROPY) {
    return { valid: false, reason: `Fingerprint entropy too low (${entropy.toFixed(2)} bits/char < ${MIN_ENTROPY})` };
  }

  return { valid: true };
}

/**
 * Optionally re-derive a server-side fingerprint from raw components
 * and compare it to the client-provided value.
 *
 * @param {object} components – raw signals from the client
 * @param {string} providedFingerprint – the client's claimed fingerprint
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyFingerprintComponents(components, providedFingerprint) {
  if (!components || typeof components !== 'object') {
    // Components are optional; skip verification if not provided
    return { valid: true };
  }

  // Derive expected fingerprint from components (must match client-side algorithm)
  const canonical = JSON.stringify(
    Object.keys(components).sort().reduce((acc, k) => {
      acc[k] = components[k];
      return acc;
    }, {}),
  );
  const expected = crypto.createHash('sha256').update(canonical).digest('hex');

  if (expected !== providedFingerprint) {
    return { valid: false, reason: 'Fingerprint does not match submitted components (spoofing suspected)' };
  }

  return { valid: true };
}

module.exports = {
  validateFingerprint,
  verifyFingerprintComponents,
  shannonEntropy,
};
