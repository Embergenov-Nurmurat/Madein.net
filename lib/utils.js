/**
 * lib/utils.js — server.js'dan ajratilgan "toza" (pure) yordamchi funksiyalar.
 *
 * Bu yerdagi funksiyalar `db`, `req`/`res` yoki boshqa global holatga BOG'LIQ
 * EMAS — faqat argument qabul qilib, natija qaytaradi. Shu sababli ular
 * server.js'ning qolgan qismidan mustaqil ravishda o'qilishi, tekshirilishi
 * va (kelajakda) unit-test qilinishi mumkin.
 *
 * server.js'dagi bo'lim modullarga ajratilishi davom etar ekan, keyingi
 * navbatdagilar: notifications (push/email matnlari), moderation,
 * media-processing (sharp/ffmpeg) — ular `db`'ga yoki fayl tizimiga
 * bog'liq bo'lgani uchun alohida, ehtiyotkorroq bosqichda ko'chiriladi.
 */

const crypto = require('crypto');

/* ============ Foydalanuvchi nomi ============ */
function isValidUsername(uname) {
  return !!uname && /^[a-z0-9_]{3,32}$/.test(uname);
}

/* ============ HTML xavfsizligi ============ */
function escapeHtmlAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============ Fayl kengaytmasi ============
   Fayl kengaytmasini HECH QACHON mijoz yuborgan originalname'dan
   olmaymiz (masalan "rasm.jpg.exe" deb nomlab, mimetype'ni
   "image/jpeg" deb yolg'on ko'rsatish mumkin) — buning o'rniga faqat
   serverda TASDIQLANGAN mimetype asosida xavfsiz kengaytma tanlaymiz. */
const SAFE_EXT_BY_MIME = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/x-m4v': '.m4v'
};
function safeExtFor(mimetype) {
  return SAFE_EXT_BY_MIME[mimetype] || '.bin';
}

/* ============ Fayl haqiqiyligini tekshirish (magic bytes) ============ */
function detectImageSignature(buf) {
  if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 6 && buf.slice(0, 3).toString('ascii') === 'GIF' && (buf.slice(3, 6).toString('ascii') === '87a' || buf.slice(3, 6).toString('ascii') === '89a')) return 'image/gif';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

/* ============ Multer xatolik kodlari ============ */
function multerErrCode(err) {
  if (err && err.code === 'LIMIT_FILE_SIZE') return 'fileTooLarge';
  if (err && (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE')) return 'tooManyFiles';
  if (err && err.code && typeof err.code === 'string') return err.code; // bizning fileFilter'dagi o'z kodimiz
  return 'uploadError';
}

/* ============ Teglar ============ */
function parseTags(raw) {
  if (!raw) return [];
  const list = String(raw)
    .split(',')
    .map(t => t.trim().toLowerCase().slice(0, 24))
    .filter(Boolean);
  return [...new Set(list)].slice(0, 8);
}

/* ============ Suhbat ID (ikki foydalanuvchi nomidan) ============ */
function convId(a, b) {
  return [a, b].sort().join('__');
}

/* ============ Qo'ng'iroq ID ============ */
function genCallId() {
  return 'call' + Date.now() + crypto.randomBytes(5).toString('hex');
}

/* ============ Bildirishnoma turi -> kategoriya ============ */
function categoryForNotifType(type) {
  switch (type) {
    case 'like': return 'likes';
    case 'comment': return 'comments';
    case 'review': return 'comments';
    case 'follow': return 'follows';
    case 'order-received':
    case 'order-placed':
    case 'order-status':
      return 'orders';
    default: return null;
  }
}

/* ============ To'lov: faqat UZS'da hisoblanganmi ============ */
function isUZSOnlyTotals(totalsByCurrency) {
  const currencies = Object.keys(totalsByCurrency || {});
  return currencies.length === 1 && currencies[0] === 'UZS';
}

/* ============ Savat: bitta asar uchun maksimal miqdor ============ */
const CART_MAX_QTY = 99;
function stockLimitFor(work) {
  if (work.stockMode === 'fixed' && typeof work.stockQty === 'number') {
    return Math.max(0, Math.min(work.stockQty, CART_MAX_QTY));
  }
  return CART_MAX_QTY;
}

module.exports = {
  isValidUsername,
  escapeHtmlAttr,
  SAFE_EXT_BY_MIME,
  safeExtFor,
  detectImageSignature,
  multerErrCode,
  parseTags,
  convId,
  genCallId,
  categoryForNotifType,
  isUZSOnlyTotals,
  CART_MAX_QTY,
  stockLimitFor
};
