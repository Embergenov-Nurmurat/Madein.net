/**
 * twofa.js — TOTP (Time-based One-Time Password, RFC 6238) asosidagi
 * ikki bosqichli tasdiqlash (2FA). Google Authenticator, Authy, 1Password
 * kabi har qanday standart autentifikator ilova bilan ishlaydi.
 *
 * Tashqi paket ishlatilmagan (loyihaning "build step yo'q, sodda JS"
 * uslubiga mos) — faqat Node'ning o'rnatilgan `crypto` moduli orqali.
 */
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

/* Yangi maxfiy kalit generatsiya qiladi (160 bit — RFC tavsiyasi). */
function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secretBase32, counter, digits = 6) {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, '0');
}

function totp(secretBase32, forTimeMs = Date.now(), stepSec = 30) {
  const counter = Math.floor(forTimeMs / 1000 / stepSec);
  return hotp(secretBase32, counter);
}

/* +-1 qadam (oldingi/keyingi 30 soniya) toleranslik bilan tekshiradi —
   foydalanuvchi va server soati orasida ozgina farq bo'lsa ham ishlaydi. */
function verifyTotp(secretBase32, token, window = 1, stepSec = 30) {
  const clean = String(token || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(Date.now() / 1000 / stepSec);
  for (let i = -window; i <= window; i++) {
    if (hotp(secretBase32, counter + i) === clean) return true;
  }
  return false;
}

/* Autentifikator ilovalari QR-kod sifatida o'qiy oladigan standart URI. */
function otpauthUri(secretBase32, accountLabel, issuer = 'Madein.net') {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/* Autentifikator yo'qolib qolsa ishlatiladigan bir martalik zaxira
   kodlar — foydalanuvchiga ochiq matnda ko'rsatiladi (faqat generatsiya
   paytida), bazada esa faqat hash holida saqlanadi. */
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(5).toString('hex')); // 10 ta belgi
  }
  return codes;
}
function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

module.exports = {
  generateSecret, totp, verifyTotp, otpauthUri,
  generateBackupCodes, hashBackupCode
};
