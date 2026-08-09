/**
 * lib/user-defaults.js — foydalanuvchi yozuvini normallashtiruvchi va
 * moderatsiya bilan bog'liq TOZA yordamchi funksiyalar (server.js'dan
 * ajratildi).
 *
 * `ensureModerationFields` faqat o'ziga berilgan `u` obyektini o'zgartiradi
 * (mutatsiya) — `db`ning boshqa qismiga yoki tarmoqqa bog'liq emas, shuning
 * uchun bu yerga ko'chirish xavfsiz.
 */

const SUPPORTED_LANGS = ['uz', 'en', 'zh', 'hi', 'es', 'ar', 'ru'];

/* Har bir foydalanuvchida moderatsiya/admin maydonlari mavjudligini ta'minlaydi
   (eski db.json yozuvlari uchun ham) */
function ensureModerationFields(u) {
  if (!u) return;
  if (typeof u.isAdmin !== 'boolean') u.isAdmin = false;
  delete u.isBoss;
  delete u.adminAccessRevoked;
  if (!u.moderation || typeof u.moderation !== 'object') {
    u.moderation = { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' };
  } else {
    if (u.moderation.bannedUntil === undefined) u.moderation.bannedUntil = null;
    if (u.moderation.banReason === undefined) u.moderation.banReason = '';
    if (u.moderation.mutedUntil === undefined) u.moderation.mutedUntil = null;
    if (u.moderation.muteReason === undefined) u.moderation.muteReason = '';
  }
  if (!Array.isArray(u.notifications)) u.notifications = [];
  if (!Array.isArray(u.following)) u.following = [];
  if (!Array.isArray(u.pushSubscriptions)) u.pushSubscriptions = [];
  if (!u.cart || typeof u.cart !== 'object' || Array.isArray(u.cart)) {
    // Eski "saqlanganlar" (savedWorks) ro'yxati bo'lsa, savatga 1 donadan ko'chiriladi
    u.cart = {};
    if (Array.isArray(u.savedWorks)) {
      for (const id of u.savedWorks) u.cart[id] = 1;
    }
  }
  delete u.savedWorks;
  if (!u.callPrivacy || typeof u.callPrivacy !== 'object') {
    u.callPrivacy = { mode: 'everyone', allowed: [] };
  } else {
    if (!['everyone', 'nobody', 'selected'].includes(u.callPrivacy.mode)) u.callPrivacy.mode = 'everyone';
    if (!Array.isArray(u.callPrivacy.allowed)) u.callPrivacy.allowed = [];
  }
  const notifDefaults = { enabled: true, likes: true, comments: true, follows: true, orders: true, messages: true };
  if (!u.notifPrefs || typeof u.notifPrefs !== 'object') {
    u.notifPrefs = Object.assign({}, notifDefaults);
  } else {
    for (const key of Object.keys(notifDefaults)) {
      if (typeof u.notifPrefs[key] !== 'boolean') u.notifPrefs[key] = notifDefaults[key];
    }
  }
  if (!SUPPORTED_LANGS.includes(u.lang)) u.lang = 'uz';
  if (!Array.isArray(u.wishlist)) u.wishlist = [];
  if (!Array.isArray(u.collections)) u.collections = [];

  // 2FA maydonlari: eski foydalanuvchilar uchun ham xavfsiz defaultlar
  if (!u.twoFactor || typeof u.twoFactor !== 'object') {
    u.twoFactor = {
      enabled: false,
      secret: null,
      backupCodeHashes: [],
      enabledAt: null,
      totpLastCounter: 0,
      totpLock: { fails: 0, lockedUntil: 0 }
    };
  } else {
    if (!Array.isArray(u.twoFactor.backupCodeHashes)) u.twoFactor.backupCodeHashes = [];
    if (!Number.isInteger(u.twoFactor.totpLastCounter)) u.twoFactor.totpLastCounter = 0;
    if (!u.twoFactor.totpLock || typeof u.twoFactor.totpLock !== 'object') {
      u.twoFactor.totpLock = { fails: 0, lockedUntil: 0 };
    }
  }
}

/* Admin ban/mut formasidan kelgan "minutes" qiymatini xavfsiz songa aylantiradi
   (1 daqiqadan kam bo'lmasin, 1 yildan oshmasin) */
function parseModerationMinutes(body) {
  const minutes = parseInt(body && body.minutes, 10);
  if (!minutes || minutes < 1) return 60;
  return Math.min(minutes, 60 * 24 * 365); // 1 yildan oshmasin
}

module.exports = { SUPPORTED_LANGS, ensureModerationFields, parseModerationMinutes };
