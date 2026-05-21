# Like Button API – Security-Hardened Embeddable Counter

A production-ready, enterprise-grade API for an embeddable "Like" counter button
with comprehensive security controls designed to produce legally-admissible vote records.

---

## Architecture

```
like-button-api/
├── server.js                    Main entry point
├── widget/
│   └── like-widget.js           Embeddable frontend widget
├── src/
│   ├── config/
│   │   └── security.js          Centralised security config (reads env vars)
│   ├── database/
│   │   └── db.js                SQLite database layer
│   ├── services/
│   │   ├── crypto.js            HMAC-SHA256 signing, AES-256-GCM encryption
│   │   ├── auditLog.js          Immutable hash-chain audit log
│   │   ├── fingerprint.js       Device fingerprint validation & anti-spoofing
│   │   └── forensics.js         Legal evidence package generator
│   ├── middleware/
│   │   ├── auth.js              JWT + API Key authentication
│   │   ├── rateLimiter.js       Per-IP / per-device rate limiting
│   │   ├── security.js          Helmet headers, CORS, HTTPS enforcement
│   │   └── validation.js        Input sanitisation, replay-attack prevention
│   ├── routes/
│   │   ├── likes.js             Public Like API (GET + POST)
│   │   └── admin.js             Admin, audit log, forensics routes
│   └── tests/
│       ├── crypto.test.js
│       ├── auditLog.test.js
│       ├── fingerprint.test.js
│       └── security.test.js
└── .env.example                 Configuration template
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    Edit .env and fill in all secrets (see "Configuration" below)

# 3. Start the server
npm start
```

The server listens on the port defined by `PORT` (default: 3000).

---

## Embedding the Widget

Add the widget to any page with a single script tag:

```html
<script
  src="https://your-api-domain.com/like-widget.js"
  data-api-url="https://your-api-domain.com/api"
  data-api-key="lba_v1_YOUR_READ_WRITE_API_KEY"
  data-widget-id="my-widget-123">
</script>
<div id="like-widget"></div>
```

The widget automatically:
- Collects a multi-signal device fingerprint (canvas, WebGL, hardware, etc.)
- Hashes it locally with SHA-256 via the WebCrypto API
- Persists the device ID in `localStorage` **and** IndexedDB for cross-browser persistence
- Calls the API to check / register the vote
- Renders a like button with animated counter

---

## API Reference

### Public Endpoints

#### `GET /api/likes/:widgetId`
Returns the current like count. No authentication required.

**Response:**
```json
{ "widgetId": "my-widget", "count": 42, "nonce": "random-hex" }
```

---

#### `POST /api/likes/:widgetId`
Register a like from a device. Requires authentication (`Authorization: Bearer <JWT>` or `X-Api-Key: lba_v1_…`).

**Request body:**
```json
{
  "deviceFingerprint": "<64-char hex>",
  "fingerprintComponents": { "ua": "...", "canvas": "...", ... }
}
```

**Responses:**
- `201 Created` – vote registered; includes `voteId`, `count`, `timestamp`, `signature`
- `409 Conflict` – device already voted
- `400 Bad Request` – invalid / spoofed fingerprint
- `429 Too Many Requests` – rate limit exceeded

---

### Admin Endpoints

All admin endpoints require a JWT with the `admin` scope.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/token` | Issue a JWT (requires `ADMIN_BOOTSTRAP_SECRET` header) |
| `POST` | `/api/admin/api-keys` | Create a new API key |
| `DELETE` | `/api/admin/api-keys/:id` | Revoke an API key |
| `GET` | `/api/admin/api-keys` | List all API keys |
| `POST` | `/api/admin/widgets` | Register a widget |
| `GET` | `/api/admin/audit-log` | Retrieve audit log entries |
| `GET` | `/api/admin/audit-log/verify` | Verify hash-chain integrity |
| `POST` | `/api/admin/forensics/:widgetId` | Generate legal evidence package |
| `POST` | `/api/admin/forensics/verify` | Verify an evidence certificate |

---

## Security Features

### 1. Authentication & Authorisation
- **JWT Bearer tokens** – HMAC-SHA256 signed (HS256), with configurable expiry and key rotation via `JWT_PREVIOUS_SECRETS`
- **API Keys** – prefixed `lba_v1_…`; only the HMAC of the raw key is stored, never the key itself
- **Role-based scopes** – `vote:read`, `vote:write`, `admin`, `audit:read`, `forensics`

### 2. Cryptographic Data Integrity
- **HMAC-SHA256 vote signing** – every vote record is signed at write time; `verifyVote()` detects any field modification
- **AES-256-GCM encryption** – symmetric encryption available for sensitive response payloads
- **SHA-256 content hashing** – all API response bodies can be hashed for verification

### 3. Immutable Audit Log (Hash Chain)
Every action appends a new entry containing:
```json
{
  "sequence": 42,
  "timestamp": "2026-03-13T14:22:00.123Z",
  "action": "VOTE_REGISTERED",
  "actor": "api-key-id",
  "data_hash": "sha256 of payload",
  "previous_hash": "entry_hash of previous record",
  "entry_hash": "sha256(seq|ts|action|data_hash|prev_hash)",
  "seal": "hmac(entry_hash, AUDIT_LOG_SECRET)"
}
```
`GET /api/admin/audit-log/verify` walks the entire chain and verifies:
1. `data_hash` matches `data_json` content
2. `entry_hash` matches its recomputed value
3. HMAC `seal` is valid
4. `previous_hash` links correctly to the prior entry

### 4. Replay Attack Prevention
Optional request signing headers:
- `X-Timestamp` – Unix timestamp in seconds; rejected if outside ±`REQUEST_TIMESTAMP_TOLERANCE_SECS`
- `X-Nonce` – 16-byte random hex; stored in DB and rejected if seen twice
- `X-Signature` – `HMAC-SHA256(METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256(body))`

### 5. Device Fingerprinting & Anti-Spoofing
Server-side validation:
- Minimum entropy check (Shannon entropy ≥ 3.0 bits/char)
- Format validation (32–128 hex characters)
- Known trivial value blocklist (`000...`, `111...`, etc.)
- Optional: re-derive hash from submitted components and compare

### 6. Rate Limiting
- **Global IP limiter** – applied to all routes (`RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MS`)
- **Vote-specific limiter** – tighter limit on POST `/api/likes/:id` (`VOTE_RATE_LIMIT_MAX`)
- **Device fingerprint limiter** – in-memory per-device throttle, resets each window

### 7. Security Headers
Applied via [Helmet](https://helmetjs.github.io/):
- `Strict-Transport-Security` (HSTS, 1 year, preload)
- `Content-Security-Policy` (restrictive defaults)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Request-Id` (every response)

### 8. Legal Evidence Package
`POST /api/admin/forensics/:widgetId` produces a JSON package containing:
- **Certificate** – `reportId`, `generatedAt`, `payloadHash`, HMAC `seal`, `integrityStatement`
- **Evidence** – widget metadata, all votes with integrity status, audit log, chain verification result

The certificate HMAC seal allows any holder of `AUDIT_LOG_SECRET` to verify the package has not been modified since generation.

---

## Configuration Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | HTTP port | No (default 3000) |
| `NODE_ENV` | `production` / `development` / `test` | No |
| `JWT_SECRET` | 64-byte hex secret for JWT signing | **Yes** |
| `JWT_EXPIRY` | JWT lifetime (e.g. `1h`) | No |
| `JWT_PREVIOUS_SECRETS` | Comma-separated old JWT secrets for rotation | No |
| `ADMIN_JWT_SECRET` | Separate secret for admin JWT | **Yes** |
| `ADMIN_BOOTSTRAP_SECRET` | Bootstrap secret for `POST /api/auth/token` | **Yes** |
| `API_KEY_SECRET` | 32-byte hex HMAC secret for API keys | **Yes** |
| `SIGNING_SECRET` | 32-byte hex secret for request signing | **Yes** |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM | **Yes** |
| `VOTE_SIGNING_SECRET` | 32-byte hex secret for vote record signing | **Yes** |
| `AUDIT_LOG_SECRET` | 32-byte hex secret for audit log HMAC sealing | **Yes** |
| `DB_PATH` | Path to SQLite database file | No (default `./data/likes.db`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins (or `*`) | **Yes** |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | No (default 60000) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per IP per window | No (default 30) |
| `VOTE_RATE_LIMIT_MAX` | Max vote attempts per IP per window | No (default 5) |
| `REQUEST_TIMESTAMP_TOLERANCE_SECS` | Replay window tolerance | No (default 300) |

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Running Tests

```bash
npm test              # All tests (58 tests)
npm run test:crypto   # Cryptographic service tests
npm run test:audit    # Audit log tests (including tamper detection)
npm run test:security # Integration tests (auth, validation, duplicate votes, forensics)
```

---

## Deployment Security Checklist

- [ ] All environment variables set with production secrets (never reuse dev secrets)
- [ ] `NODE_ENV=production`
- [ ] HTTPS/TLS 1.2+ enforced at the load balancer / reverse proxy
- [ ] `CORS_ALLOWED_ORIGINS` set to exact domains (no wildcards in production)
- [ ] Database file stored on encrypted storage
- [ ] Database backup encryption enabled
- [ ] `ADMIN_BOOTSTRAP_SECRET` rotated after initial API key provisioning
- [ ] Log aggregation configured (ship audit log to tamper-proof SIEM)
- [ ] Alert on `AUTH_FAILURE_*`, `RATE_LIMIT_EXCEEDED_*`, `VOTE_REJECTED_FINGERPRINT_SPOOFING`
- [ ] Regular `GET /api/admin/audit-log/verify` scheduled (cron)
- [ ] Evidence package generated and archived before any deployment

---

## Legal Evidence Workflow

1. **Collect votes** – widget records votes; each vote is HMAC-signed and linked in the audit chain.
2. **Generate evidence package** – `POST /api/admin/forensics/:widgetId` produces a tamper-evident package.
3. **Verify chain integrity** – `GET /api/admin/audit-log/verify` confirms no records were altered.
4. **Archive** – store the package JSON with its certificate in a write-once storage system.
5. **Verify archive** – `POST /api/admin/forensics/verify` confirms the archived package is intact.
6. **Expert witness** – the `integrityStatement` field (`ALL_RECORDS_INTACT` / `INTEGRITY_VIOLATIONS_DETECTED`) and HMAC seal provide cryptographic non-repudiation.
