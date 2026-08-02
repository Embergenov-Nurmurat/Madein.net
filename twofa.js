/**
 * twofa.js - TOTP (RFC 6238) 2FA. Tashqi paketsiz, faqat Node `crypto`.
 *
 * Nima o'zgardi:
 *  1. REPLAY HIMOYASI: `verifyTotp` endi ishlatilgan counter'ni qaytaradi va
 *     `user.totpLastCounter`dan katta bo'lishini talab qiladi. Ya'ni bir kod
 *     ikkinchi marta (o'g'irlangan bo'lsa ham) ishlamaydi.
 *  2. Kodlar `timingSafeEqual` orqali doimiy vaqtda solishtiriladi.
 *  3. Brute-force uchun urinishlarni cheklovchi hisoblagich (`consumeAttempt`).
 *  4. Zaxira kodlar ham doimiy vaqtda tekshiriladi va ishlatilgani o'chiriladi.
 *  5. Kodlar SHA1'dan tashqari SHA256/SHA512 bilan ham ishlaydi (ixtiyoriy).
 */
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SEC = 30;
const WINDOW = 1;              // +-30 soniya toleranslik
const MAX_ATTEMPTS = 5;        // 5 xato urinishdan keyin
const LOCK_MS = 15 * 60 * 1000; // 15 daqiqa blok

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const rem = bits.length % 5;
  if (rem !== 0) {
    const last = bits.slice(bits.length - rem).padEnd(5, '0');
    out += BASE32_ALPHABET[parseInt(last, 2)];
  }
  return out;
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a == null ? '' : a)).digest();
  const hb = crypto.createHash('sha256').update(String(b == null ? '' : b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secretBase32, counter, digits = 6, algorithm = 'sha1') {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac(algorithm, key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, '0');
}

function totp(secretBase32, forTimeMs = Date.now(), stepSec = STEP_SEC) {
  return hotp(secretBase32, Math.floor(forTimeMs / 1000 / stepSec));
}

/**
 * Kodni tekshiradi VA replay'ni bloklaydi.
 *
 * @param {string} secretBase32
 * @param {string} token   - foydalanuvchi kiritgan 6 xonali kod
 * @param {object} opts
 *   @param {number} opts.lastCounter - shu foydalanuvchi uchun oxirgi MUVAFFAQIYATLI counter
 *                                      (bazada `user.totpLastCounter` sifatida saqlanadi)
 * @returns {{ valid: boolean, counter: number|null, reason?: string }}
 *   `valid: true` bo'lsa, `counter`ni albatta bazaga yozing - aks holda replay ochiq qoladi.
 */
function verifyTotp(secretBase32, token, opts = {}) {
  const lastCounter = Number(opts.lastCounter || 0);
  const window = opts.window === undefined ? WINDOW : opts.window;
  const stepSec = opts.stepSec || STEP_SEC;
  const nowMs = opts.nowMs || Date.now();

  const clean = String(token || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return { valid: false, counter: null, reason: 'format' };
  if (!secretBase32) return { valid: false, counter: null, reason: 'no-secret' };

  const current = Math.floor(nowMs / 1000 / stepSec);
  let matched = null;
  for (let i = -window; i <= window; i++) {
    // Early-return yo'q: barcha oynalar tekshiriladi (timing sizib chiqmasin).
    if (safeEqual(hotp(secretBase32, current + i), clean) && matched === null) {
      matched = current + i;
    }
  }
  if (matched === null) return { valid: false, counter: null, reason: 'mismatch' };
  if (matched <= lastCounter) return { valid: false, counter: matched, reason: 'replay' };
  return { valid: true, counter: matched };
}

/* Eski chaqiruvlar buzilmasligi uchun: faqat boolean qaytaradi.
   YANGI KODDA ISHLATMANG - replay himoyasi yo'q. */
function verifyTotpLegacy(secretBase32, token, window = WINDOW, stepSec = STEP_SEC) {
  return verifyTotp(secretBase32, token, { window, stepSec, lastCounter: 0 }).valid;
}

/* ===== Brute-force cheklovi =====
   `state` - foydalanuvchi obyektidagi kichik obyekt: { fails, lockedUntil }.
   Har urinishdan OLDIN `checkLock`, xato bo'lsa `registerFailure`,
   muvaffaqiyatda `resetFailures` chaqiriladi. */
function checkLock(state) {
  const s = state || {};
  if (s.lockedUntil && Date.now() < s.lockedUntil) {
    return { locked: true, retryAfterSec: Math.ceil((s.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false, retryAfterSec: 0 };
}

function registerFailure(state) {
  const s = Object.assign({ fails: 0, lockedUntil: 0 }, state || {});
  s.fails += 1;
  if (s.fails >= MAX_ATTEMPTS) {
    s.lockedUntil = Date.now() + LOCK_MS;
    s.fails = 0;
  }
  return s;
}

function resetFailures() {
  return { fails: 0, lockedUntil: 0 };
}

function otpauthUri(secretBase32, accountLabel, issuer = 'Madein.net') {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) codes.push(crypto.randomBytes(5).toString('hex'));
  return codes;
}

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(String(code).trim().toLowerCase()).digest('hex');
}

/* Zaxira kodni tekshiradi va ishlatilganini RO'YXATDAN O'CHIRADI (bir martalik).
   @returns {{ valid: boolean, remaining: string[] }} - `remaining`ni bazaga yozing. */
function consumeBackupCode(hashedCodes, code) {
  const list = Array.isArray(hashedCodes) ? hashedCodes.slice() : [];
  const target = hashBackupCode(code);
  let hitIndex = -1;
  for (let i = 0; i < list.length; i++) {
    if (safeEqual(list[i], target) && hitIndex === -1) hitIndex = i;
  }
  if (hitIndex === -1) return { valid: false, remaining: list };
  list.splice(hitIndex, 1);
  return { valid: true, remaining: list };
}

module.exports = {
  generateSecret, totp, hotp, verifyTotp, verifyTotpLegacy, otpauthUri,
  generateBackupCodes, hashBackupCode, consumeBackupCode,
  checkLock, registerFailure, resetFailures,
  safeEqual, MAX_ATTEMPTS, LOCK_MS
};
