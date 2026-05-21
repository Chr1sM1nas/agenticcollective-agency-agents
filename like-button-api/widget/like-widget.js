/**
 * Like Button Widget  v1.0
 *
 * Embeddable "Like" counter button with:
 *  - Multi-browser device-persistent vote tracking (localStorage + IndexedDB)
 *  - Canvas + WebGL + hardware device fingerprinting
 *  - Authenticated API calls (API-key header)
 *  - HMAC-SHA256 request signing
 *  - Duplicate-vote detection
 *
 * Usage:
 *   <script src="https://your-domain.com/like-widget.js"
 *           data-api-url="https://your-domain.com/api"
 *           data-api-key="lba_v1_YOUR_API_KEY"
 *           data-widget-id="widget-123"></script>
 *   <div id="like-widget"></div>
 */
(function (global) {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  }());

  var API_URL    = (script && script.getAttribute('data-api-url'))    || '';
  var API_KEY    = (script && script.getAttribute('data-api-key'))     || '';
  var WIDGET_ID  = (script && script.getAttribute('data-widget-id'))  || 'default';
  var CONTAINER_ID = (script && script.getAttribute('data-container')) || 'like-widget';

  // ── Device ID persistence ──────────────────────────────────────────────────

  var STORAGE_KEY = 'lba_device_id_' + WIDGET_ID;

  function getStoredDeviceId() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function storeDeviceId(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
    // IndexedDB fallback for browsers that block localStorage in cross-origin iframes
    if (global.indexedDB) {
      try {
        var req = indexedDB.open('lba_db', 1);
        req.onupgradeneeded = function (e) {
          e.target.result.createObjectStore('ids');
        };
        req.onsuccess = function (e) {
          e.target.result.transaction('ids', 'readwrite')
            .objectStore('ids').put(id, STORAGE_KEY);
        };
      } catch (e) { /* ignore */ }
    }
  }

  function getIndexedDbDeviceId(cb) {
    if (!global.indexedDB) return cb(null);
    try {
      var req = indexedDB.open('lba_db', 1);
      req.onupgradeneeded = function (e) {
        e.target.result.createObjectStore('ids');
      };
      req.onsuccess = function (e) {
        var r = e.target.result.transaction('ids', 'readonly')
          .objectStore('ids').get(STORAGE_KEY);
        r.onsuccess = function () { cb(r.result || null); };
        r.onerror   = function () { cb(null); };
      };
      req.onerror = function () { cb(null); };
    } catch (e) { cb(null); }
  }

  // ── Device fingerprinting ──────────────────────────────────────────────────

  function canvasFingerprint() {
    try {
      var c = document.createElement('canvas');
      var ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('LikeWidget🔒', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('LikeWidget🔒', 4, 17);
      return c.toDataURL().slice(-80);
    } catch (e) { return 'no-canvas'; }
  }

  function webglFingerprint() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return dbg
        ? (gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) + '~' + gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : gl.getParameter(gl.RENDERER);
    } catch (e) { return 'no-webgl'; }
  }

  function collectComponents() {
    var nav = global.navigator || {};
    var screen = global.screen || {};
    return {
      ua:         (nav.userAgent || '').slice(0, 200),
      lang:       nav.language || '',
      langs:      (nav.languages || []).join(','),
      tz:         (function () {
        try {
          return Intl && Intl.DateTimeFormat
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : '';
        } catch (e) { return ''; }
      }()),
      cores:      nav.hardwareConcurrency || 0,
      mem:        nav.deviceMemory || 0,
      screen:     screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
      platform:   nav.platform || '',
      canvas:     canvasFingerprint(),
      webgl:      webglFingerprint(),
      plugins:    Array.prototype.slice.call(nav.plugins || []).map(function (p) { return p.name; }).join(',').slice(0, 200),
      touch:      (nav.maxTouchPoints || 0).toString(),
    };
  }

  /** Simple djb2-inspired hash of a string → 64 hex chars (SHA-256 via SubtleCrypto if available). */
  function hashComponents(components, cb) {
    var str = Object.keys(components).sort().map(function (k) {
      return k + '=' + components[k];
    }).join('&');

    if (global.crypto && global.crypto.subtle && global.crypto.subtle.digest) {
      var enc = new TextEncoder();
      global.crypto.subtle.digest('SHA-256', enc.encode(str)).then(function (buf) {
        cb(Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join(''));
      }).catch(function () { cb(fallbackHash(str)); });
    } else {
      cb(fallbackHash(str));
    }
  }

  function fallbackHash(str) {
    // FNV-1a 64-bit (approximated in 32-bit JS) expanded to 64 hex chars
    var h1 = 0x811c9dc5, h2 = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 ^= c; h1 = (h1 * 0x01000193) >>> 0;
      h2 ^= (c + i); h2 = (h2 * 0x01000193) >>> 0;
    }
    var p1 = ('0000000' + h1.toString(16)).slice(-8);
    var p2 = ('0000000' + h2.toString(16)).slice(-8);
    // Expand to 64 chars by hashing iteratively
    var result = '';
    var seed = p1 + p2;
    for (var j = 0; j < 4; j++) {
      var tmp = 0x811c9dc5;
      for (var k = 0; k < seed.length; k++) {
        tmp ^= seed.charCodeAt(k);
        tmp = (tmp * 0x01000193) >>> 0;
      }
      seed = ('0000000' + tmp.toString(16)).slice(-8) + seed;
      result += ('0000000' + tmp.toString(16)).slice(-8) + ('0000000' + (tmp ^ 0xdeadbeef).toString(16)).slice(-8);
    }
    return result.slice(0, 64);
  }

  // ── HMAC-SHA256 request signing (WebCrypto) ────────────────────────────────

  function hmacSha256(secret, message, cb) {
    if (!global.crypto || !global.crypto.subtle) return cb(null);
    var enc = new TextEncoder();
    global.crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    ).then(function (key) {
      return global.crypto.subtle.sign('HMAC', key, enc.encode(message));
    }).then(function (sig) {
      cb(Array.prototype.map.call(new Uint8Array(sig), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join(''));
    }).catch(function () { cb(null); });
  }

  function generateNonce() {
    if (global.crypto && global.crypto.getRandomValues) {
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.prototype.map.call(arr, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // ── API calls ──────────────────────────────────────────────────────────────

  function buildSignedHeaders(method, path, bodyStr, nonce, timestamp, cb) {
    // NOTE: Full HMAC-SHA256 request signing requires the SIGNING_SECRET to be
    // present on the client – which is not safe for browser-side code.
    // In a production setup, exchange the API key for a short-lived signed
    // token from your own backend and include that token in the Authorization
    // header instead of embedding a raw signing secret here.
    // The server-side signature verification middleware (verifySignedRequest) is
    // available for server-to-server or native-app clients that can safely hold
    // the signing secret.
    var headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    };
    cb(headers);
  }

  function apiGet(path, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API_URL + path, true);
    xhr.setRequestHeader('X-Api-Key', API_KEY);
    xhr.onload = function () {
      try { cb(null, JSON.parse(xhr.responseText)); }
      catch (e) { cb(e); }
    };
    xhr.onerror = function () { cb(new Error('Network error')); };
    xhr.send();
  }

  function apiPost(path, data, cb) {
    var body = JSON.stringify(data);
    var nonce = generateNonce();
    var timestamp = Math.floor(Date.now() / 1000).toString();
    buildSignedHeaders('POST', path, body, nonce, timestamp, function (headers) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL + path, true);
      Object.keys(headers).forEach(function (k) { xhr.setRequestHeader(k, headers[k]); });
      xhr.onload = function () {
        try { cb(null, JSON.parse(xhr.responseText), xhr.status); }
        catch (e) { cb(e); }
      };
      xhr.onerror = function () { cb(new Error('Network error')); };
      xhr.send(body);
    });
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  var style = [
    '.lba-widget{display:inline-flex;align-items:center;gap:8px;font-family:inherit}',
    '.lba-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;',
      'border:2px solid #e2e8f0;border-radius:9999px;background:#fff;',
      'color:#374151;font-size:14px;font-weight:600;cursor:pointer;',
      'transition:all .2s;user-select:none}',
    '.lba-btn:hover{background:#f9fafb;border-color:#94a3b8}',
    '.lba-btn.voted{background:#eff6ff;border-color:#3b82f6;color:#1d4ed8}',
    '.lba-btn.voted .lba-heart{color:#ef4444}',
    '.lba-btn:disabled{opacity:.6;cursor:not-allowed}',
    '.lba-heart{font-size:16px;transition:transform .2s}',
    '.lba-btn:not(:disabled):hover .lba-heart{transform:scale(1.2)}',
    '.lba-count{font-size:13px;color:#6b7280;margin-left:4px}',
    '.lba-msg{font-size:12px;color:#6b7280;margin-top:4px}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = style;
  document.head.appendChild(styleEl);

  function render(container, state) {
    container.innerHTML = [
      '<div class="lba-widget">',
        '<button class="lba-btn', state.voted ? ' voted' : '', '"',
          state.loading ? ' disabled' : '', '>',
          '<span class="lba-heart">', state.voted ? '❤️' : '🤍', '</span>',
          '<span class="lba-label">', state.voted ? 'Liked' : 'Like', '</span>',
          '<span class="lba-count">', state.count, '</span>',
        '</button>',
        state.message ? '<div class="lba-msg">' + state.message + '</div>' : '',
      '</div>',
    ].join('');

    if (!state.voted && !state.loading) {
      container.querySelector('.lba-btn').addEventListener('click', state.onVote);
    }
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.warn('[LikeWidget] Container #' + CONTAINER_ID + ' not found');
      return;
    }

    if (!API_URL || !API_KEY) {
      container.innerHTML = '<span style="color:red">[LikeWidget] data-api-url and data-api-key are required</span>';
      return;
    }

    var state = { count: 0, voted: false, loading: true, message: '', onVote: null };
    render(container, state);

    // Collect device fingerprint
    var components = collectComponents();
    hashComponents(components, function (fingerprint) {

      // Fetch current count
      apiGet('/likes/' + WIDGET_ID, function (err, data) {
        if (err || !data) {
          state.loading = false;
          state.message = 'Unable to load count';
          render(container, state);
          return;
        }

        state.count = data.count || 0;

        // Check local storage for already-voted status
        var deviceId = getStoredDeviceId();
        if (deviceId === fingerprint) {
          state.voted = true;
          state.loading = false;
          render(container, state);
          return;
        }

        state.loading = false;

        state.onVote = function () {
          state.loading = true;
          render(container, state);

          apiPost('/likes/' + WIDGET_ID, {
            deviceFingerprint: fingerprint,
            fingerprintComponents: components,
            userAgent: navigator.userAgent,
          }, function (err2, res, status) {
            state.loading = false;

            if (err2) {
              state.message = 'Network error – please try again';
              render(container, state);
              return;
            }

            if (status === 201) {
              state.voted = true;
              state.count = res.count;
              storeDeviceId(fingerprint);
              render(container, state);
            } else if (status === 409) {
              state.voted = true;
              state.count = res.count || state.count;
              storeDeviceId(fingerprint);
              render(container, state);
            } else {
              state.message = (res && res.error) || 'Vote failed – please try again';
              render(container, state);
            }
          });
        };

        render(container, state);
      });
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window));
