/**
 * security.js - YANGI fayl. Tashqi paketsiz (helmet/express-rate-limit o'rniga)
 * xavfsizlik middleware'lari. Loyihaning "minimal dependency" uslubiga mos.
 *
 * Ishlatish (server.js):
 *   const security = require('./security');
 *   app.set('trust proxy', 1);              // Railway/Nginx orqasida MAJBURIY
 *   app.use(security.securityHeaders());
 *   app.use('/api/', security.rateLimit({ windowMs: 60000, max: 120 }));
 *   app.post('/api/login', security.rateLimit({ windowMs: 15*60000, max: 10 }), ...);
 */

const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

/* ============ Xavfsizlik sarlavhalari (mini-helmet) ============ */
function securityHeaders(options = {}) {
  const csp = options.contentSecurityPolicy === false ? null : (options.contentSecurityPolicy || [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    // Inline skript/stil hozircha kerak (index.html ichida bor). Keyingi
    // bosqichda ularni faylga chiqarib, bu ikkitasini olib tashlang.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    IS_PROD ? 'upgrade-insecure-requests' : ''
  ].filter(Boolean).join('; '));

  return function (req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.removeHeader('X-Powered-By');
    if (csp) res.setHeader('Content-Security-Policy', csp);
    if (IS_PROD) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  };
}

/* ============ Rate limit (xotirada, sirg'aluvchi oyna) ============
   Bitta instansiya uchun yetarli. Bir nechta instansiyaga o'tsangiz,
   Redis'ga ko'chirish kerak bo'ladi. */
function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message = options.message || { error: "Juda ko'p so'rov yuborildi. Birozdan keyin urinib ko'ring." };
  const keyGen = options.keyGenerator || ((req) => (req.ip || (req.connection && req.connection.remoteAddress) || 'unknown'));
  const skip = options.skip || (() => false);

  const hits = new Map(); // key -> number[] (timestamps)

  // Eskirgan yozuvlarni tozalab turadi (xotira o'sib ketmasin).
  const sweeper = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, arr] of hits) {
      const fresh = arr.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, Math.max(windowMs, 30000));
  if (sweeper.unref) sweeper.unref();

  return function (req, res, next) {
    if (skip(req)) return next();
    const key = keyGen(req);
    const now = Date.now();
    const cutoff = now - windowMs;
    const arr = (hits.get(key) || []).filter((t) => t > cutoff);

    if (arr.length >= max) {
      const retryAfter = Math.ceil((arr[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', '0');
      hits.set(key, arr);
      return res.status(429).json(message);
    }
    arr.push(now);
    hits.set(key, arr);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(max - arr.length, 0)));
    next();
  };
}

/* Login/2FA kabi endpointlar uchun tayyor, qattiqroq limit. */
function authRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => {
      const ip = req.ip || 'unknown';
      const user = (req.body && (req.body.username || req.body.email)) || '';
      return `${ip}|${String(user).toLowerCase()}`;
    },
    message: { error: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring." }
  });
}

/* ============ CSRF (double-submit cookie) ============
   Sessiyaga token yoziladi, frontend uni `X-CSRF-Token` sarlavhasida qaytaradi.
   Webhook yo'llari (Payme/Click) chetlab o'tilishi SHART - ular tashqi tizimdan keladi
   va o'z imzosi bilan tekshiriladi. */
function csrfProtection(options = {}) {
  const exempt = options.exempt || [/^\/api\/payments\//];
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  return function (req, res, next) {
    if (!req.session) return next();
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    res.locals = res.locals || {};
    res.locals.csrfToken = req.session.csrfToken;

    if (safeMethods.has(req.method)) return next();
    if (exempt.some((re) => re.test(req.path))) return next();

    const sent = req.get('X-CSRF-Token') || (req.body && req.body._csrf) || '';
    const a = crypto.createHash('sha256').update(String(sent)).digest();
    const b = crypto.createHash('sha256').update(String(req.session.csrfToken)).digest();
    if (!crypto.timingSafeEqual(a, b)) {
      return res.status(403).json({ error: "So'rov tasdiqlanmadi (CSRF). Sahifani yangilang." });
    }
    next();
  };
}

/* Yuklangan fayl nomini xavfsizlantiradi (path traversal / RTL hiylalari). */
function safeFilename(name, fallbackExt = '') {
  const base = String(name || '').split(/[\\/]/).pop() || '';
  const cleaned = base.replace(/[^\w.\-]/g, '_').replace(/^\.+/, '').slice(-120);
  return cleaned || (crypto.randomBytes(8).toString('hex') + fallbackExt);
}

module.exports = { securityHeaders, rateLimit, authRateLimit, csrfProtection, safeFilename };
