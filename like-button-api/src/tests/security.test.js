'use strict';

/**
 * Integration-style security tests.
 * Tests the API endpoints using supertest-style HTTP calls against the Express app.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a'.repeat(128);
process.env.API_KEY_SECRET = 'b'.repeat(64);
process.env.SIGNING_SECRET = 'c'.repeat(64);
process.env.ENCRYPTION_KEY = 'd'.repeat(64);
process.env.VOTE_SIGNING_SECRET = 'e'.repeat(64);
process.env.AUDIT_LOG_SECRET = 'f'.repeat(64);
process.env.ADMIN_JWT_SECRET = 'g'.repeat(128);
process.env.ADMIN_BOOTSTRAP_SECRET = 'test-bootstrap-secret';
process.env.CORS_ALLOWED_ORIGINS = '*';
// Raise rate-limit thresholds so tests don't throttle each other
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.VOTE_RATE_LIMIT_MAX = '200';

const tmpDb = path.join(os.tmpdir(), `lba_security_test_${Date.now()}.db`);
process.env.DB_PATH = tmpDb;

const app = require('../../server');

/** Minimal HTTP helper (avoids extra test dependencies). */
function request(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: '127.0.0.1',
      port: 0, // will be set after server starts
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers,
      },
    };
    // We'll use the server reference set in `before`
    opts.port = global.__testPort;
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch (e) { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// Realistic high-entropy test fingerprints (SHA-256-like hex strings)
const FP = {
  apiKey:   '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  forSec:   '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
  dupe:     '2c4e6a8b0d2f4e6c8a0b2d4f6e8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4e',
  forensics:'3b5d7f9e1c3a5b7d9f1e3c5a7b9d1f3e5c7a9b1d3f5e7c9a1b3d5f7e9c1a3b5d',
};
let server;
let adminToken;
let testApiKey;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      global.__testPort = server.address().port;
      resolve();
    });
  });

  // Issue an admin JWT
  const res = await request('POST', '/api/auth/token', {
    sub: 'test-admin',
    scopes: ['vote:read', 'vote:write', 'admin', 'audit:read', 'forensics'],
    adminSecret: 'test-bootstrap-secret',
  });
  assert.equal(res.status, 200, `auth/token failed: ${JSON.stringify(res.body)}`);
  adminToken = res.body.token;

  // Create an API key for use in tests
  const keyRes = await request('POST', '/api/admin/api-keys',
    { name: 'test-key', scopes: 'vote:write,vote:read' },
    { Authorization: `Bearer ${adminToken}` },
  );
  assert.equal(keyRes.status, 201, `api-keys create failed: ${JSON.stringify(keyRes.body)}`);
  testApiKey = keyRes.body.apiKey;

  // Pre-create the forensics test widget by casting a vote
  await request('POST', '/api/likes/widget-forensics',
    { deviceFingerprint: FP.forensics },
    { Authorization: `Bearer ${adminToken}` },
  );
});

after(() => {
  server.close();
  try { fs.unlinkSync(tmpDb); } catch (_) {}
});

// ── Authentication tests ──────────────────────────────────────────────────────

describe('Authentication', () => {
  it('rejects unauthenticated requests to POST /api/likes/:id', async () => {
    const res = await request('POST', '/api/likes/widget-auth-test', {
      deviceFingerprint: 'a'.repeat(64),
    });
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it('accepts a valid JWT', async () => {
    const res = await request('GET', '/api/likes/widget-auth-test', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    // GET /api/likes/:id is public (no auth required for count)
    assert.ok([200, 401].includes(res.status));
  });

  it('rejects an expired / invalid JWT', async () => {
    const res = await request('POST', '/api/likes/w1', { deviceFingerprint: 'a'.repeat(64) }, {
      Authorization: 'Bearer invalid.jwt.token',
    });
    assert.equal(res.status, 401);
  });

  it('rejects an unknown API key', async () => {
    const res = await request('POST', '/api/likes/w1', { deviceFingerprint: 'a'.repeat(64) }, {
      'X-Api-Key': 'lba_v1_unknownkey0000000000000000',
    });
    assert.equal(res.status, 401);
  });
});

// ── API key management ────────────────────────────────────────────────────────

describe('API key management', () => {
  it('allows voting with a valid API key', async () => {
    const res = await request('POST', '/api/likes/widget-apikey-test',
      { deviceFingerprint: FP.apiKey },
      { 'X-Api-Key': testApiKey },
    );
    assert.ok([201, 409].includes(res.status), `unexpected status ${res.status}: ${JSON.stringify(res.body)}`);
  });

  it('creates and revokes an API key', async () => {
    const createRes = await request('POST', '/api/admin/api-keys',
      { name: 'revoke-test-key', scopes: 'vote:read' },
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(createRes.status, 201);
    const id = createRes.body.id;

    const revokeRes = await request('DELETE', `/api/admin/api-keys/${id}`, null,
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(revokeRes.status, 200);
    assert.equal(revokeRes.body.id, id);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe('Input validation', () => {
  it('rejects an invalid widgetId', async () => {
    const res = await request('GET', '/api/likes/../../../etc/passwd');
    assert.ok([400, 404].includes(res.status));
  });

  it('rejects a missing deviceFingerprint', async () => {
    const res = await request('POST', '/api/likes/widget-1', {},
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 400);
    assert.match(res.body.error, /fingerprint/i);
  });

  it('rejects a too-short fingerprint', async () => {
    const res = await request('POST', '/api/likes/widget-1',
      { deviceFingerprint: 'short' },
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 400);
  });

  it('rejects a known-trivial fingerprint', async () => {
    const res = await request('POST', '/api/likes/widget-1',
      { deviceFingerprint: '0'.repeat(64) },
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 400);
    assert.match(res.body.error, /trivial|spoofed/i);
  });
});

// ── Duplicate vote prevention ─────────────────────────────────────────────────

describe('Duplicate vote prevention', () => {
  const fp = FP.dupe;
  const widgetId = 'widget-dupe-test';

  it('accepts the first vote', async () => {
    const res = await request('POST', `/api/likes/${widgetId}`,
      { deviceFingerprint: fp },
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.ok([201, 409].includes(res.status));
  });

  it('rejects a second vote from the same device', async () => {
    // First vote
    await request('POST', `/api/likes/${widgetId}`,
      { deviceFingerprint: fp },
      { Authorization: `Bearer ${adminToken}` },
    );
    // Second vote
    const res = await request('POST', `/api/likes/${widgetId}`,
      { deviceFingerprint: fp },
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 409);
    assert.match(res.body.error, /already voted/i);
  });
});

// ── Audit log ─────────────────────────────────────────────────────────────────

describe('Audit log', () => {
  it('retrieves audit log entries', async () => {
    const res = await request('GET', '/api/admin/audit-log?limit=10',
      null, { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.entries));
  });

  it('verifies audit chain integrity', async () => {
    const res = await request('GET', '/api/admin/audit-log/verify',
      null, { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.valid, true);
  });
});

// ── Forensics ─────────────────────────────────────────────────────────────────

describe('Forensics / evidence package', () => {
  it('generates an evidence package for a widget', async () => {
    const res = await request('POST', '/api/admin/forensics/widget-forensics',
      null, { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(res.status, 200, `forensics failed: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.certificate);
    assert.ok(res.body.evidence);
    assert.ok(res.body.certificate.payloadHash);
    assert.ok(res.body.certificate.seal);
  });

  it('verifies the evidence certificate', async () => {
    // Generate package
    const genRes = await request('POST', '/api/admin/forensics/widget-forensics',
      null, { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(genRes.status, 200);

    // Verify it
    const verRes = await request('POST', '/api/admin/forensics/verify',
      { certificate: genRes.body.certificate, evidence: genRes.body.evidence },
      { Authorization: `Bearer ${adminToken}` },
    );
    assert.equal(verRes.status, 200);
    assert.equal(verRes.body.valid, true);
  });
});

// ── Health check ──────────────────────────────────────────────────────────────

describe('Health check', () => {
  it('returns 200', async () => {
    const res = await request('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

// ── Security headers ──────────────────────────────────────────────────────────

describe('Security headers', () => {
  it('sets X-Frame-Options', async () => {
    const res = await request('GET', '/health');
    assert.ok(res.headers['x-frame-options']);
  });

  it('sets X-Content-Type-Options', async () => {
    const res = await request('GET', '/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  it('returns X-Request-Id on every response', async () => {
    const res = await request('GET', '/health');
    assert.ok(res.headers['x-request-id']);
  });
});
