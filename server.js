/**
 * Madein.net — oddiy Node.js/Express backend
 * Foydalanuvchilar, ularning profillari va yuklagan asarlarini
 * fayl-asosli JSON bazada (data/db.json) va disk ustida (uploads/) saqlaydi.
 *
 * Ishga tushirish:
 *   npm install
 *   npm start
 *
 * Muhit o'zgaruvchilari (ixtiyoriy, .env faylida yoki hosting panelida):
 *   PORT             - server porti (default: 3000)
 *   SESSION_SECRET   - sessiya cookie'larini shifrlash uchun maxfiy kalit
 *                       (production'da albatta o'zgartiring!)
 */

require('dotenv').config();
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const webpush = require('web-push');
const nodemailer = require('nodemailer');
const payments = require('./payments');
const dbSqlite = require('./db-sqlite');
const twofa = require('./twofa');
const {
  isValidUsername, escapeHtmlAttr, SAFE_EXT_BY_MIME, safeExtFor,
  detectImageSignature, multerErrCode, parseTags, convId, genCallId,
  categoryForNotifType, isUZSOnlyTotals, CART_MAX_QTY, stockLimitFor
} = require('./lib/utils');
const { pushTextFor, pushContentFor, orderStatusText } = require('./lib/push-text');
const { SUPPORTED_LANGS, ensureModerationFields, parseModerationMinutes } = require('./lib/user-defaults');
const { isNotifCategoryAllowed, isNotifAllowed, isEmailWorthyType } = require('./lib/notif-rules');
const { workImages, workThumbs, unreadCountFor, lastMessagePreviewFor, orderHasCompletedItem } = require('./lib/content-helpers');
const {
  verifyImageFileOrDelete, transcodeVideoToMp4, extractVideoPoster,
  transcodeCircleVideo, getMp4DurationSeconds, compressAndThumbnail
} = require('./lib/media');

/* ===================== PUSH XABARNOMALAR (Web Push) =====================
   Brauzer/PWA yopiq bo'lsa ham foydalanuvchiga xabar (masalan "Sizga
   yangi xabar keldi" yoki "Buyurtmangiz holati o'zgardi") yetkazish uchun.
   VAPID kalitlari muhit o'zgaruvchilaridan olinadi — agar sozlanmagan
   bo'lsa, push funksiyasi jimgina o'chirilgan holda ishlaydi (sayt
   o'zi baribir to'liq ishlayveradi, faqat push xabarnomalar borib
   turmaydi). Kalit generatsiya qilish uchun: `npx web-push generate-vapid-keys` */
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@madein.net';
const PUSH_ENABLED = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
/* Push xabarnomalar matnini foydalanuvchi tanlagan tilda yuborish uchun —
   saytning frontend I18N'iga mos 7 til */

/* Email (SMTP) — parolni tiklash va push yetib bormagan taqdirda zaxira
   bildirishnomalar uchun. Sozlanmagan bo'lsa sayt ishlayveradi, faqat
   emailga bog'liq amallar (parolni tiklash so'rovi) aniq xatolik qaytaradi. */
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'Madein.net <no-reply@madein.net>';
const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL_ENABLED = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
const mailTransport = EMAIL_ENABLED ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
}) : null;
if (!EMAIL_ENABLED) {
  console.log("DIQQAT: SMTP sozlanmagan — parolni tiklash xatlari va email bildirishnomalar o'chirilgan holda ishga tushdi.");
}

async function sendMail(to, subject, text, html) {
  if (!EMAIL_ENABLED || !to) return false;
  try {
    await mailTransport.sendMail({ from: SMTP_FROM, to, subject, text, html: html || undefined });
    return true;
  } catch (e) {
    console.error('Email yuborishda xatolik:', e.message);
    return false;
  }
}

if (PUSH_ENABLED) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('DIQQAT: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY sozlanmagan — push xabarnomalar o\'chirilgan holda ishga tushdi.');
}

const STORAGE_DIR = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(__dirname, 'storage');
const DATA_DIR = path.join(STORAGE_DIR, 'data');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const SESSIONS_DIR = path.join(STORAGE_DIR, 'sessions');
const DB_FILE = path.join(DATA_DIR, 'db.json');

for (const dir of [DATA_DIR, UPLOADS_DIR, SESSIONS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* ===================== YAGONA ADMINISTRATOR =====================
   Saytda faqat BITTA, oldindan belgilangan administrator akkaunti bo'ladi.
   Boshqa hech qanday foydalanuvchi (na maxfiy parol, na boshqa yo'l bilan)
   o'zini administrator qila olmaydi — bu login/parolli akkauntdan tashqari.
   Parolning o'zi kodda saqlanmaydi, faqat uning bcrypt xeshi (boshqa barcha
   foydalanuvchi parollari kabi) saqlanadi. Server birinchi marta ishga
   tushganda ushbu akkaunt avtomatik yaratiladi (agar mavjud bo'lmasa).

   Kirish ma'lumotlari (buni xavfsiz joyda saqlang):
     Login:  madein_admin
     Parol:  p57q-r4Ubb*XUqkt
   Kirgandan so'ng profil sozlamalaridan login/parolni istalgan vaqtda
   o'zgartirish mumkin (bu holda ham admin huquqi shu akkauntda qoladi).
*/
const FIXED_ADMIN_USERNAME = 'madein_admin';
const FIXED_ADMIN_PASSWORD_HASH = '$2a$10$l6SG8Ho5mbBE4wF822af7OO4vMhhSeNK2a7EkslbS2y7w0rKRsCjq';

/* Har bir foydalanuvchida moderatsiya/admin maydonlari mavjudligini ta'minlaydi
   (eski db.json yozuvlari uchun ham) */

/* db.reports ro'yxati mavjudligini ta'minlaydi (eski db.json fayllar uchun) */
function ensureReportsArray() {
  if (!Array.isArray(db.reports)) db.reports = [];
}

/* Foydalanuvchi nomi (login) shakli to'g'riligini tekshiradi */

/* Foydalanuvchi login (username)ini butun bazada — profili, asarlari,
   xabarlari, layklari, komentlari, obunalari, shikoyatlari, buyurtmalari
   va joriy sessiyasi bo'yicha — xavfsiz almashtiradi. Login o'zgarganda
   eski login boshqa hech kim tomonidan ishlatilmaydi va darhol bo'shab qoladi. */
function renameUsernameEverywhere(oldU, newU) {
  if (oldU === newU) return;

  if (db.users[oldU]) {
    db.users[newU] = db.users[oldU];
    delete db.users[oldU];
  }
  if (db.works[oldU]) {
    db.works[newU] = db.works[oldU];
    delete db.works[oldU];
  }

  // Boshqalarning asarlaridagi layk/komentlar
  for (const uname of Object.keys(db.works)) {
    for (const w of db.works[uname]) {
      if (Array.isArray(w.likes)) {
        const i = w.likes.indexOf(oldU);
        if (i !== -1) w.likes[i] = newU;
      }
      if (Array.isArray(w.comments)) {
        for (const c of w.comments) if (c.username === oldU) c.username = newU;
      }
    }
  }

  // Suhbatlar (ishtirokchilar, xabarlar, o'qilgan belgisi) va ID'larini qayta hisoblash
  const rebuiltMessages = {};
  for (const key of Object.keys(db.messages)) {
    const conv = db.messages[key];
    if (Array.isArray(conv.participants)) {
      conv.participants = conv.participants.map(p => (p === oldU ? newU : p)).sort();
    }
    if (Array.isArray(conv.messages)) {
      for (const m of conv.messages) {
        if (m.from === oldU) m.from = newU;
        if (m.to === oldU) m.to = newU;
      }
    }
    if (conv.readUpto && Object.prototype.hasOwnProperty.call(conv.readUpto, oldU)) {
      conv.readUpto[newU] = conv.readUpto[oldU];
      delete conv.readUpto[oldU];
    }
    const newKey = convId(conv.participants[0], conv.participants[1]);
    conv.id = newKey;
    rebuiltMessages[newKey] = conv;
  }
  db.messages = rebuiltMessages;

  // Obunalar, video qo'ng'iroq ruxsat ro'yxatlari, bildirishnomalar
  for (const uname of Object.keys(db.users)) {
    const u = db.users[uname];
    if (Array.isArray(u.following)) {
      const i = u.following.indexOf(oldU);
      if (i !== -1) u.following[i] = newU;
    }
    if (u.callPrivacy && Array.isArray(u.callPrivacy.allowed)) {
      const i = u.callPrivacy.allowed.indexOf(oldU);
      if (i !== -1) u.callPrivacy.allowed[i] = newU;
    }
    if (Array.isArray(u.notifications)) {
      for (const n of u.notifications) {
        if (n.from === oldU) n.from = newU;
      }
    }
  }

  // Shikoyatlar
  if (Array.isArray(db.reports)) {
    for (const r of db.reports) {
      if (r.reporter === oldU) r.reporter = newU;
      if (r.targetOwner === oldU) r.targetOwner = newU;
      if (r.type === 'user' && r.targetId === oldU) r.targetId = newU;
    }
  }

  // Buyurtmalar
  if (Array.isArray(db.orders)) {
    for (const o of db.orders) {
      if (o.buyer === oldU) o.buyer = newU;
      if (Array.isArray(o.items)) {
        for (const it of o.items) if (it.sellerUsername === oldU) it.sellerUsername = newU;
      }
    }
  }

  // Xotiradagi holat (onlayn, faol qo'ng'iroqlar)
  if (Object.prototype.hasOwnProperty.call(lastActiveMap, oldU)) {
    lastActiveMap[newU] = lastActiveMap[oldU];
    delete lastActiveMap[oldU];
  }
  if (typeof userActiveCall !== 'undefined' && userActiveCall.has(oldU)) {
    userActiveCall.set(newU, userActiveCall.get(oldU));
    userActiveCall.delete(oldU);
  }
  if (typeof activeCalls !== 'undefined') {
    for (const call of activeCalls.values()) {
      if (call.from === oldU) call.from = newU;
      if (call.to === oldU) call.to = newU;
    }
  }
}

/* Ko'rib chiqilgan (resolved) shikoyatlar shu muddatdan keyin ro'yxatdan
   avtomatik o'chiriladi — admin panelini eski shikoyatlar bilan
   to'ldirmaslik uchun. */
const RESOLVED_REPORT_TTL_MS = 3 * 60 * 60 * 1000; // 3 soat

/* Muddati o'tgan ko'rib chiqilgan shikoyatlarni ro'yxatdan olib tashlaydi.
   O'zgarish bo'lsa true qaytaradi (saqlash kerakligini bildiradi). */
function purgeResolvedReports() {
  ensureReportsArray();
  const now = Date.now();
  const before = db.reports.length;
  db.reports = db.reports.filter(r => {
    if (r.status !== 'resolved' || !r.resolvedAt) return true;
    return now - new Date(r.resolvedAt).getTime() < RESOLVED_REPORT_TTL_MS;
  });
  return db.reports.length !== before;
}

/* Muddati o'tgan ban/mutni avtomatik bekor qiladi va foydalanuvchiga xabar qoldiradi.
   true qaytarsa, saqlash kerak. `uname` berilsa, tabiiy tugash haqida bildirishnoma qo'shiladi. */
function refreshModeration(u, uname) {
  if (!u || !u.moderation) return false;
  const now = Date.now();
  let changed = false;
  if (u.moderation.bannedUntil && new Date(u.moderation.bannedUntil).getTime() <= now) {
    u.moderation.bannedUntil = null;
    u.moderation.banReason = '';
    changed = true;
    if (uname) {
      addNotification(uname, { type: 'ban-expired' });
    }
  }
  if (u.moderation.mutedUntil && new Date(u.moderation.mutedUntil).getTime() <= now) {
    u.moderation.mutedUntil = null;
    u.moderation.muteReason = '';
    changed = true;
    if (uname) {
      addNotification(uname, { type: 'mute-expired' });
    }
  }
  if (changed && uname) {
    mirrorToRelationalDb(() => relUsers.setModeration(relDb, uname, u.moderation));
  }
  return changed;
}

/* Bildirishnoma turini granular bildirishnoma sozlamalari (notifPrefs)dagi
   qaysi kategoriyaga tegishli ekanini aniqlaydi. null qaytsa — bu turdagi
   bildirishnoma (masalan ban/mute) hech qachon o'chirib bo'lmaydi, chunki
   u hisob xavfsizligi/holati uchun muhim. */

/* Foydalanuvchi shu KATEGORIYADAGI bildirishnomani olishga rozimi —
   umumiy yoqilgan/o'chirilgan holat va shu kategoriya bo'yicha alohida
   sozlamani tekshiradi. category=null bo'lsa (masalan ban/mute kabi
   hisob xavfsizligi bildirishnomalari) — doim ruxsat etiladi. */

function addNotification(uname, notif) {
  const u = db.users[uname];
  if (!u) return;
  ensureModerationFields(u);
  if (!isNotifAllowed(u, notif.type)) return; // foydalanuvchi bu turdagi bildirishnomani o'chirib qo'ygan
  const fullNotif = Object.assign({
    id: 'n' + Date.now() + crypto.randomBytes(4).toString('hex'),
    createdAt: new Date().toISOString(),
    read: false
  }, notif);
  u.notifications.push(fullNotif);
  if (u.notifications.length > 50) u.notifications = u.notifications.slice(-50);

  // Migratsiya: bildirishnomani relyatsion bazaga ham dublikat qilamiz.
  // ESLATMA: eskisidan farqli, bu yerda 50 talik cheklov qo'llanilmaydi —
  // rout'lar o'qishga o'tkazilganda LIMIT bilan so'raladi, shuning uchun
  // saqlashda kesish shart emas (aksincha, tarixni yo'qotmaslik afzal).
  mirrorToRelationalDb(() => relUsers.addNotification(relDb, uname, fullNotif));

  const content = pushContentFor(notif, u.lang || 'uz');
  if (content) sendPush(uname, content).catch(() => {});

  // Email — faqat MUHIM (tranzaksion) bildirishnomalar uchun, va faqat push
  // haqiqatan yetib bormaydigan holatda (push umuman sozlanmagan yoki
  // foydalanuvchining faol push obunasi yo'q) — email "zaxira kanal" bo'lib qoladi,
  // layk/komment kabi ijtimoiy bildirishnomalar bilan pochta qutisini to'ldirmaydi.
  if (content && EMAIL_ENABLED && u.email && isEmailWorthyType(notif.type)) {
    const pushWillReach = PUSH_ENABLED && Array.isArray(u.pushSubscriptions) && u.pushSubscriptions.length > 0;
    if (!pushWillReach) {
      sendMail(u.email, content.title, content.body).catch(() => {});
    }
  }
}

/* Push xabarnomalar uchun 7 tilli matnlar jadvali — frontenddagi I18N
   lug'atining kichik push-ga tegishli qismi. Bu yerda kerak, chunki push
   xabarnomalar ilova yopiq bo'lsa ham brauzer/OS orqali yetib borishi
   kerak — shu payt frontend JS ishlamayotgan bo'ladi, shuning uchun matn
   SERVERda, foydalanuvchi oxirgi marta tanlagan tilda (u.lang) tayyorlanadi. */

/* Foydalanuvchining barcha ulangan qurilmalariga push xabarnoma yuboradi.
   Yaroqsiz/eskirgan obunalar (410/404) avtomatik ro'yxatdan o'chiriladi. */
async function sendPush(uname, content) {
  if (!PUSH_ENABLED) return;
  const u = db.users[uname];
  if (!u || !Array.isArray(u.pushSubscriptions) || !u.pushSubscriptions.length) return;

  const payload = JSON.stringify({
    title: content.title || 'Madein.net',
    body: content.body || '',
    url: content.url || '/'
  });

  let changed = false;
  const survivors = [];
  await Promise.all(u.pushSubscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, payload);
      survivors.push(sub);
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) {
        changed = true; // obuna eskirgan — tashlab yuboramiz
      } else {
        survivors.push(sub); // vaqtinchalik xatolik (masalan tarmoq) — obunani saqlab qolamiz
      }
    }
  }));
  if (changed) {
    u.pushSubscriptions = survivors;
    await saveDB();
  }
}


/* ===================== SQLite-ASOSLI "BAZA" =====================
   Ilgari bitta db.json fayl to'liq xotiraga o'qilib, har bir yozishda
   qayta butunlay saqlanardi. Endi haqiqiy SQLite bazasi ishlatiladi
   (storage/data/madein.db): yozishlar tranzaksiya ichida amalga oshadi
   (server yozish paytida qulasa ham baza buzilmaydi), va agar eski
   db.json topilsa — birinchi ishga tushganda avtomatik import qilinadi.
   Batafsil izoh: db-sqlite.js */
const sqlite = dbSqlite.openDatabase(DATA_DIR);
dbSqlite.importFromJsonIfNeeded(sqlite, DB_FILE, fs);

/* ===================== RELYATSION QATLAM (MIGRATSIYA, BOSQICHMA-BOSQICH) =====================
   Yangi jadvalli sxema (db/schema.sql) hozircha ESKI JSON-blob saqlashga
   (yuqoridagi `sqlite`) PARALLEL ishlaydi — u hali "haqiqat manbai" emas.
   Bosqich 1: faqat YOZISH dublyaj qilinadi (masalan /api/register), shunda
   yangi bazadagi ma'lumot eskisidan orqada qolmaydi. O'qish hali ham eski
   qatlamdan (`db.users`, `db.works`) davom etadi. Rout'lar birma-bir yangi
   qatlamga o'tkazilgach, eski qatlam butunlay olib tashlanadi.
   Batafsil: lib/db/connection.js, lib/db/users.js, lib/db/works.js */
const relDbConn = require('./lib/db/connection');
const relUsers = require('./lib/db/users');
const relWorks = require('./lib/db/works');
const relOrders = require('./lib/db/orders');
const relMessages = require('./lib/db/messages');
const relReports = require('./lib/db/reports');
const createAdminRouter = require('./routes/admin');
const createWishlistCollectionsRouter = require('./routes/wishlist-collections');
const createCommerceRouter = require('./routes/commerce');
const createUsersRouter = require('./routes/users');
const createWorksRouter = require('./routes/works');
const createConversationsRouter = require('./routes/conversations');
const createAuthRouter = require('./routes/auth');
const createPaymentsRouter = require('./routes/payments');
const createPushRouter = require('./routes/push');
const createCallsRouter = require('./routes/calls');
const relDb = relDbConn.getDatabase(path.join(DATA_DIR, 'madein-relational.db'));

/* Yangi (hali ikkinchi darajali) qatlamga yozish muvaffaqiyatsiz bo'lsa ham,
   ASOSIY (eski) oqim BUZILMASLIGI kerak — shuning uchun xatolik faqat
   logga yoziladi, javobga ta'sir qilmaydi. */
function mirrorToRelationalDb(fn) {
  try {
    fn();
  } catch (e) {
    console.error("DIQQAT: relyatsion bazaga dublikat yozishda xatolik (asosiy oqimga ta'sir qilmadi):", e.message);
  }
}

function loadDB() {
  const data = dbSqlite.readFullDB(sqlite);
  if (!data.messages) data.messages = {};
  return data;
}
let db = loadDB();
if (!Array.isArray(db.reports)) db.reports = [];
if (!Array.isArray(db.orders)) db.orders = [];

/* ===================== ODDIY SO'ROV CHEKLOVCHI (RATE LIMIT) =====================
   Tashqi paketlarsiz, IP + amal turi bo'yicha oynali hisoblagich.
   Ro'yxatdan o'tish, kirish, komment, xabar va shikoyatlarni spamdan himoya qiladi. */
const rateBuckets = new Map();
function rateLimit(key, limit, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    const id = ip + ':' + key;
    const now = Date.now();
    let bucket = rateBuckets.get(id);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
      rateBuckets.set(id, bucket);
    }
    bucket.count++;
    if (bucket.count > limit) {
      return res.status(429).json({ error: "Juda ko'p urinish qilindi, birozdan so'ng qayta urinib ko'ring", code: 'tooManyAttempts' });
    }
    next();
  };
}

/* multer xatoligini (bizning fileFilter'dan yoki multer'ning o'z ichki
   limitlaridan, masalan fayl hajmi) barqaror kod bilan javob shakliga
   o'giradi — shunda upload xatoliklari ham frontendda saytning joriy
   tiliga tarjima qilinadi. */
/* Fayl HAQIQATDA rasmligini uning birinchi baytlaridan ("magic
   number"/signature) tekshiradi — mijoz yuborgan Content-Type sarlavhasi
   (mimetype) soxtalashtirilishi mumkin bo'lgani uchun, bu qo'shimcha,
   soxtalashtirib bo'lmaydigan tekshiruv qatlami hisoblanadi. */
setInterval(() => {
  const now = Date.now();
  for (const [id, bucket] of rateBuckets) {
    if (now - bucket.start > 60 * 60 * 1000) rateBuckets.delete(id);
  }
}, 30 * 60 * 1000).unref();

/* Muddati o'tgan ko'rib chiqilgan shikoyatlarni fon rejimida vaqti-vaqti bilan
   tozalab turadi, admin panelini hech kim ochmasa ham */
setInterval(() => {
  if (purgeResolvedReports()) saveDB();
}, 30 * 60 * 1000).unref();

// Eski (bitta rasmli) asarlarni yangi `images` massiviga moslashtirish
for (const uname of Object.keys(db.works || {})) {
  for (const w of db.works[uname] || []) {
    if (!Array.isArray(w.images) || !w.images.length) {
      w.images = w.image ? [w.image] : [];
    }
  }
}

// Eski foydalanuvchi yozuvlariga admin/moderatsiya maydonlarini qo'shib qo'yish
for (const uname of Object.keys(db.users || {})) {
  ensureModerationFields(db.users[uname]);
}

let writeQueue = Promise.resolve();
function saveDB() {
  writeQueue = writeQueue.then(() => {
    dbSqlite.writeFullDB(sqlite, db);
  });
  return writeQueue;
}

/* ===================== YAGONA ADMIN AKKAUNTINI TAYYORLASH =====================
   Server har safar ishga tushganda tekshiradi: agar FIXED_ADMIN_USERNAME
   akkaunti hali mavjud bo'lmasa — uni yaratadi. Mavjud bo'lsa, isAdmin
   bayrog'i shu akkauntda tiklanadi. Boshqa hech qanday foydalanuvchida
   isAdmin=true qoldirilmaydi — shu orqali saytda doimo faqat BITTA
   administrator bo'lishi ta'minlanadi. Admin keyinchalik profil
   sozlamalaridan o'z login/parolini xohlagancha o'zgartira oladi. */
(function seedFixedAdmin() {
  let changed = false;
  for (const uname of Object.keys(db.users || {})) {
    if (uname === FIXED_ADMIN_USERNAME) continue;
    if (db.users[uname].isAdmin) { db.users[uname].isAdmin = false; changed = true; }
  }
  if (!db.users[FIXED_ADMIN_USERNAME]) {
    db.users[FIXED_ADMIN_USERNAME] = {
      passwordHash: FIXED_ADMIN_PASSWORD_HASH,
      fullname: 'Administrator',
      email: '',
      bio: '',
      avatar: null,
      phone: '',
      social: '',
      privacy: { phone: true, social: true, email: false },
      theme: null,
      joined: new Date().toISOString(),
      isAdmin: true,
      moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
      notifications: [],
      following: [],
      wishlist: [],
      cart: {}
    };
    db.works[FIXED_ADMIN_USERNAME] = db.works[FIXED_ADMIN_USERNAME] || [];
    changed = true;
    console.log("Yagona administrator akkaunti yaratildi (login: " + FIXED_ADMIN_USERNAME + ")");
  } else if (!db.users[FIXED_ADMIN_USERNAME].isAdmin) {
    db.users[FIXED_ADMIN_USERNAME].isAdmin = true;
    changed = true;
  }
  ensureModerationFields(db.users[FIXED_ADMIN_USERNAME]);
  if (changed) saveDB();

  // Relyatsion bazaga ham dublikat qilamiz — u ham "faqat bitta admin"
  // qoidasiga rioya qilishi kerak (boshqa migratsiya qilingan rout'lar
  // buni keyinchalik shu yerdan o'qiydi).
  mirrorToRelationalDb(() => {
    for (const uname of Object.keys(db.users || {})) {
      if (uname === FIXED_ADMIN_USERNAME) continue;
      if (relUsers.userExists(relDb, uname)) relUsers.updateUserFields(relDb, uname, { isAdmin: false });
    }
    if (!relUsers.userExists(relDb, FIXED_ADMIN_USERNAME)) {
      relUsers.createUser(relDb, {
        username: FIXED_ADMIN_USERNAME,
        passwordHash: FIXED_ADMIN_PASSWORD_HASH,
        fullname: 'Administrator',
        isAdmin: true
      });
    } else {
      relUsers.updateUserFields(relDb, FIXED_ADMIN_USERNAME, { isAdmin: true });
    }
  });
})();

/* ===================== APP ===================== */
const app = express();
app.set('trust proxy', 1); // ko'p hosting (Render/Railway/Heroku) proxy orqasida ishlaydi

/* Xavfsizlik to'ri: ko'plab route'lar (async handler) o'z ichida try/catch'ga ega emas.
   Express 4 async handlerlardagi rad etilgan promise'larni o'zi ushlamaydi — bu esa
   xatolik yuz berganda so'rovning javobsiz "osilib qolishiga" olib keladi.
   Quyidagi wrapper har bir route metodini avtomatik o'raydi: xatolik chiqsa,
   so'rov osilib qolmaydi, buning o'rniga tozalab 500 javobi qaytariladi. */
['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
  const original = app[method].bind(app);
  app[method] = (routePath, ...handlers) => {
    const wrapped = handlers.map((h) => {
      if (typeof h !== 'function' || h.length > 3) return h; // error-middleware yoki funksiya bo'lmasa, tegilmaydi
      return (req, res, next) => {
        try {
          const result = h(req, res, next);
          if (result && typeof result.catch === 'function') {
            result.catch(next);
          }
        } catch (err) {
          next(err);
        }
      };
    });
    return original(routePath, ...wrapped);
  };
});

app.use(compression()); // javoblarni gzip bilan siqib, sahifalarni tezroq yuklaydi
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' })); // Click webhooklari form-urlencoded yuboradi

/* SESSION_SECRET sessiya cookie'larini kriptografik imzolash uchun
   ishlatiladi — agar u standart/oldindan ma'lum qiymatda qolib ketsa,
   tashqi kishi sessiya cookie'sini soxtalashtirib, boshqa foydalanuvchi
   nomidan kirishi (session hijacking) MUMKIN. Shu sabab:
   - "production"da bu jiddiy xavfsizlik kamchiligi bo'lgani uchun server
     ATAYLAB ishga tushmaydi (xatolik bilan to'xtaydi) — sokin ishlab
     qolishdan ko'ra darhol to'xtatib, e'tiborni tortish afzalroq;
   - boshqa muhitlarda (development/test) esa faqat ogohlantirish chiqadi,
     ishlash davom etadi. */
const SESSION_SECRET_DEFAULT = 'iltimos-buni-production-da-ozgartiring';
const SESSION_SECRET = process.env.SESSION_SECRET || SESSION_SECRET_DEFAULT;
// Aniq "hali almashtirilmagan" ekanini bildiruvchi so'zlar (masalan
// .env.example'dagi tayyor namuna qiymati) — uzunligi yetarli bo'lsa ham,
// bunday matn haqiqiy tasodifiy maxfiy kalit emas, shu sabab alohida
// tekshiriladi.
const SESSION_SECRET_PLACEHOLDER_RE = /replace[_-]?me|change[_-]?me|your[_-]?secret|example|placeholder|o['\u2019]?zgartiring/i;
const SESSION_SECRET_IS_WEAK = !process.env.SESSION_SECRET
  || process.env.SESSION_SECRET === SESSION_SECRET_DEFAULT
  || process.env.SESSION_SECRET.length < 16
  || SESSION_SECRET_PLACEHOLDER_RE.test(process.env.SESSION_SECRET);
if (SESSION_SECRET_IS_WEAK) {
  if (process.env.NODE_ENV === 'production') {
    console.error("XATOLIK: SESSION_SECRET sozlanmagan yoki juda zaif (production'da bu jiddiy xavfsizlik muammosi — sessiyalar soxtalashtirilishi mumkin). .env faylida SESSION_SECRET'ni kamida 32 belgili tasodifiy qatorga o'zgartiring (masalan: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"), so'ng serverni qayta ishga tushiring.");
    process.exit(1);
  } else {
    console.warn('DIQQAT: SESSION_SECRET sozlanmagan yoki zaif — faqat development/test uchun maqbul, production\'ga chiqarishdan oldin albatta o\'zgartiring.');
  }
}

app.use(session({
  store: new FileStore({ path: SESSIONS_DIR, logFn: () => {} }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 kun
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // HTTPS ostida true bo'ladi
  }
}));

/* Yuklangan fayllarni xizmat qilish — XSS'dan himoya:
   - X-Content-Type-Options: nosniff — brauzer faylni "aslida HTML" deb
     hidsanab, uni bajarib yubormasligi uchun (hatto extension noto'g'ri
     bo'lsa ham).
   - .html/.htm/.svg/.xhtml kabi skript ishga tushirishi mumkin bo'lgan
     kengaytmalar to'g'ridan-to'g'ri ochilganda "attachment" sifatida
     yuklab olinadi (brauzerda bajarilmaydi) — chat orqali ixtiyoriy
     fayl yuborish funksiyasi mavjud bo'lgani uchun zarur ehtiyot chorasi. */
const RENDER_UNSAFE_UPLOAD_EXT = ['.html', '.htm', '.xhtml', '.svg', '.shtml'];
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const ext = path.extname(req.path).toLowerCase();
  if (RENDER_UNSAFE_UPLOAD_EXT.includes(ext)) {
    res.setHeader('Content-Disposition', 'attachment');
  }
  next();
}, express.static(UPLOADS_DIR, { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ===================== SEO: sahifaga xos META TEGLAR =====================
   Sayt SPA (bitta index.html) bo'lsa-da, /w/:id va /u/:username manzillari
   uchun index.html'ning <head> qismidagi standart meta teglarini shu
   asar/profilga xos <title>/description/OG/Twitter qiymatlari bilan
   almashtirib beradi — shunda ijtimoiy tarmoqlarda ulashilganda (Telegram,
   WhatsApp, Facebook) to'g'ri sarlavha/rasm ko'rinadi, va qidiruv
   tizimlari har bir asar/profilni alohida sahifa sifatida indekslay oladi. */
const DEFAULT_META_DESC = "Madein.net — hunarmandlar va ijodkorlarning qo'lda yasalgan asarlarini kashf eting, sotib oling yoki o'z ishlaringizni ulashing.";
function renderIndexWithMeta(res, { title, description, image, url }) {
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  } catch (e) {
    return res.status(500).send('Server error');
  }
  const safeTitle = escapeHtmlAttr(title || 'Madein.net');
  const safeDesc = escapeHtmlAttr((description || DEFAULT_META_DESC).slice(0, 300));
  const safeImage = escapeHtmlAttr(image || '/favicon-512.png');
  const safeUrl = escapeHtmlAttr(url || '');
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${safeDesc}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${safeTitle}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${safeDesc}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${safeImage}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${safeTitle}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${safeDesc}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${safeImage}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${safeUrl}">`)
    .replace('</head>', `  <meta property="og:url" content="${safeUrl}">\n</head>`);
  res.set('Cache-Control', 'no-cache'); // ma'lumot (narx/nom) o'zgarishi mumkin — eskirgan kesh ko'rsatilmasin
  res.send(html);
}
function absoluteUrl(req, relPath) {
  return req.protocol + '://' + req.get('host') + relPath;
}

/* Bitta asar sahifasi — Telegram/WhatsApp/Facebook'da ulashilganda asar
   nomi, tavsifi va rasmi bilan chiroyli preview ko'rsatish uchun. */
app.get('/w/:id', (req, res) => {
  const id = req.params.id;
  let work = null;
  for (const uname of Object.keys(db.works)) {
    const found = (db.works[uname] || []).find(w => w.id === id);
    if (found) { work = found; break; }
  }
  if (!work) {
    return renderIndexWithMeta(res, { url: absoluteUrl(req, req.originalUrl) });
  }
  renderIndexWithMeta(res, {
    title: `${work.title} — Madein.net`,
    description: work.desc || DEFAULT_META_DESC,
    image: work.images && work.images[0] ? absoluteUrl(req, work.images[0]) : undefined,
    url: absoluteUrl(req, '/w/' + encodeURIComponent(id))
  });
});

/* Foydalanuvchi profili sahifasi — xuddi shu maqsadda. */
app.get('/u/:username', (req, res) => {
  const uname = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[uname];
  if (!u) {
    return renderIndexWithMeta(res, { url: absoluteUrl(req, req.originalUrl) });
  }
  renderIndexWithMeta(res, {
    title: `${u.fullname || uname} (@${uname}) — Madein.net`,
    description: u.bio || DEFAULT_META_DESC,
    image: u.avatar ? absoluteUrl(req, u.avatar) : undefined,
    url: absoluteUrl(req, '/u/' + encodeURIComponent(uname))
  });
});

app.get('/sitemap.xml', (req, res) => {
  const base = req.protocol + '://' + req.get('host');
  const urls = [`  <url>\n    <loc>${base}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`];

  const now = Date.now();
  for (const uname of Object.keys(db.users)) {
    const u = db.users[uname];
    if (u.moderation && u.moderation.bannedUntil && new Date(u.moderation.bannedUntil).getTime() > now) continue;
    urls.push(`  <url>\n    <loc>${base}/u/${encodeURIComponent(uname)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
  for (const uname of Object.keys(db.works)) {
    for (const w of (db.works[uname] || [])) {
      urls.push(`  <url>\n    <loc>${base}/w/${encodeURIComponent(w.id)}</loc>\n    <lastmod>${new Date(w.createdAt || now).toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
    }
  }

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
});

/* ===================== ONLAYN HOLATNI KUZATISH ===================== */
/* Xotirada saqlanadi (diskka yozilmaydi) — har bir so'rovda yangilanadi.
   Foydalanuvchi oxirgi ONLINE_THRESHOLD_MS ichida so'rov yuborgan bo'lsa, onlayn hisoblanadi. */
const lastActiveMap = Object.create(null);
const ONLINE_THRESHOLD_MS = 90 * 1000; // 90 soniya
app.use((req, res, next) => {
  const uname = req.session && req.session.username;
  if (uname) {
    lastActiveMap[uname] = Date.now();
    if (db.users[uname]) db.users[uname].lastSeenAt = lastActiveMap[uname];
  }
  next();
});
function isUserOnline(uname) {
  const t = lastActiveMap[uname];
  return !!t && (Date.now() - t) < ONLINE_THRESHOLD_MS;
}
function getLastSeen(uname) {
  return lastActiveMap[uname] || (db.users[uname] && db.users[uname].lastSeenAt) || null;
}
/* lastSeenAt vaqti-vaqti bilan diskka yoziladi — har so'rovda emas */
setInterval(() => { saveDB().catch(() => {}); }, 5 * 60 * 1000).unref();

/* Fayl kengaytmasini HECH QACHON mijoz yuborgan originalname'dan
   olmaymiz (masalan "rasm.jpg.exe" deb nomlab, mimetype'ni
   "image/jpeg" deb yolg'on ko'rsatish mumkin) — buning o'rniga faqat
   serverda TASDIQLANGAN mimetype asosida xavfsiz kengaytma tanlaymiz. */

/* rasm/video yuklash (multer) */
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(14).toString('hex') + safeExtFor(file.mimetype));
  }
});

/* Video sifatida qabul qilinadigan MIME turlari — mp4/mov (ISO-BMFF
   asosidagi konteynerlar), shundagina davomiylikni (duration) serverda
   ffmpeg'siz, tez va ishonchli tekshira olamiz. */
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
const MAX_VIDEO_SECONDS = 10.5; // 10 soniya + kichik tolerantlik

/**
 * Yuklangan videoni (mov/hevc va h.k. bo'lishi mumkin) barcha brauzerlarda
 * ishlaydigan H.264/AAC MP4 formatiga qayta kodlaydi. iPhone'dan
 * "High Efficiency" sozlamasida yuklangan HEVC videolar Chrome/Firefox'da
 * dekodlanmay, ekran butunlay qora bo'lib qolishining oldini oladi.
 */
/**
 * Video ichidan bitta kadrni JPEG "poster" rasm sifatida ajratib oladi —
 * shunda video hali yuklanmasdan/ijro etilmasdan oldin ham qora ekran
 * emas, balki haqiqiy kadr ko'rinadi (feed va profil kartochkalarida).
 */
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB (qisqa videolarni ham sig'diradi)
  fileFilter: (req, file, cb) => {
    // SVG ataylab rad etiladi — u ichida <script> bo'lishi mumkin va
    // to'g'ridan-to'g'ri brauzerda ochilsa bajarilib ketishi mumkin (XSS).
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) return cb(null, true);
    if (ALLOWED_VIDEO_MIMES.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Faqat rasm (jpg/png/webp/gif) yoki video (mp4/mov, 10 soniyagacha) fayllari qabul qilinadi');
    err.code = 'invalidWorkMediaType';
    return cb(err);
  }
});

/* ===================== CHATDA FAYL YUBORISH (rasm, video, ovozli xabar,
   "krujok" — Telegramdagi kabi doiraviy video xabar, va istalgan fayl) ===================== */
const ALLOWED_CHAT_VIDEO_MIMES = ALLOWED_VIDEO_MIMES.concat(['video/webm']);
const ALLOWED_AUDIO_MIMES = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/x-m4a'];
const DANGEROUS_FILE_EXT = [
  // bajariladigan/skript fayllar
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.scr', '.ps1', '.ps1xml', '.psc1', '.vb', '.vbs', '.vbe',
  '.js', '.jse', '.jar', '.app', '.apk', '.ipa', '.dmg', '.pkg', '.deb', '.rpm', '.gadget', '.msp', '.mst',
  '.cpl', '.msc', '.hta', '.reg', '.lnk', '.ws', '.wsf', '.wsc', '.wsh', '.job', '.paf', '.application',
  '.dll', '.sys', '.drv', '.pif', '.action', '.workflow', '.command',
  // server-tarafida bajariladigan skriptlar (agar noto'g'ri sozlangan
  // veb-server /uploads'ni statik emas, dinamik deb xato tushunsa)
  '.php', '.php3', '.php4', '.php5', '.php7', '.phtml', '.phar', '.cgi', '.pl', '.py', '.rb',
  '.asp', '.aspx', '.ashx', '.asmx', '.jsp', '.jspx', '.cfm', '.cfc', '.do', '.action',
  // brauzerda to'g'ridan-to'g'ri ochilganda skript bajarishi mumkin bo'lgan
  // fayllar (stored XSS xavfi — /uploads to'g'ridan-to'g'ri ochilishi mumkin)
  '.html', '.htm', '.xhtml', '.shtml', '.svg', '.xml', '.xsl', '.swf'
];
const MAX_CHAT_VIDEO_SECONDS = 120;   // oddiy video xabar
const MAX_CHAT_CIRCLE_SECONDS = 60;   // "krujok" video xabar
const MAX_CHAT_VOICE_SECONDS = 300;   // ovozli xabar

const chatMediaStorage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase().slice(0, 12);
    cb(null, crypto.randomBytes(14).toString('hex') + ext);
  }
});

const chatUpload = multer({
  storage: chatMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // MUHIM: klient formasida 'type' maydoni 'file' maydonidan OLDIN
    // qo'shilishi kerak — shundagina multer uni req.body.type sifatida
    // shu yerga yetkazib bera oladi (multipart oqim tartibi saqlanadi).
    const kind = String((req.body && req.body.type) || '').toLowerCase();
    if (kind === 'file') {
      const ext = (path.extname(file.originalname) || '').toLowerCase();
      if (DANGEROUS_FILE_EXT.includes(ext)) {
        const err = new Error("Bu turdagi fayllarni yuborib bo'lmaydi");
        err.code = 'dangerousFileType';
        return cb(err);
      }
      return cb(null, true);
    }
    if (kind === 'photo') {
      if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') return cb(null, true);
      const err = new Error('Faqat rasm fayllari qabul qilinadi');
      err.code = 'onlyImagesAllowed';
      return cb(err);
    }
    if (kind === 'circle') {
      // "Krujok" (doiraviy) videolar FAQAT bizning JS MediaRecorder kodimiz
      // orqali yaratiladi — foydalanuvchi bu yerda hech qachon ixtiyoriy
      // fayl tanlamaydi, shu bois mimetype'ga qarab rad etish shart emas.
      //
      // ASOSIY SABAB (nima uchun oldingi "startsWith('video/')" tekshiruvi
      // ham yetarli emas edi): brauzer video+audio uchun IKKITA kodekni
      // vergul bilan ajratib beradi, masalan "video/webm;codecs=vp9,opus".
      // Multer ichida ishlatiladigan Busboy content-type parametrini RFC
      // 7230 "token" qoidasiga qat'iy rioya qilib o'qiydi — vergul esa
      // token belgisi HISOBLANMAYDI. Shu sabab butun content-type qatori
      // "buzilgan" deb topilib, Busboy uni umuman o'qimay, o'zining
      // standart "text/plain" qiymatiga tushib qoladi — ya'ni
      // file.mimetype "video/webm;codecs=..." emas, balki "text/plain"
      // bo'lib keladi, va hech qanday "video/" bilan solishtirish bunga
      // yordam bermaydi. (Ovozli xabar birgina "opus" kodekini yuborgani
      // uchun vergul muammosiga duch kelmaydi — shu bois faqat krujok
      // buzilgan, ovozli xabar esa doim ishlagan.) Haqiqiy himoya keyingi
      // bosqichda: fayl ffmpeg orqali qayta kodlanadi (transcodeCircleVideo)
      // va agar bayt oqimi aslida video bo'lmasa, shu yerda tabiiy ravishda
      // xatolik (videoProcessingFailed) qaytadi.
      return cb(null, true);
    }
    if (kind === 'video') {
      // Bu yerga foydalanuvchi diskdan haqiqiy video fayl tanlaydi (fayl
      // tanlash oynasi orqali), shuning uchun mimetype odatda toza keladi
      // (masalan "video/mp4") — MediaRecorder'ning krujokka xos kodek
      // muammosi bunga tegishli emas. Baribir startsWith tekshiruvi
      // qo'shimcha moslashuvchanlik uchun saqlanadi.
      if (ALLOWED_CHAT_VIDEO_MIMES.includes(file.mimetype) || file.mimetype.startsWith('video/')) return cb(null, true);
      const err = new Error('Faqat video fayllari qabul qilinadi');
      err.code = 'onlyVideosAllowed';
      return cb(err);
    }
    if (kind === 'voice') {
      if (ALLOWED_AUDIO_MIMES.includes(file.mimetype) || file.mimetype.startsWith('audio/')) return cb(null, true);
      const err = new Error('Faqat audio fayllari qabul qilinadi');
      err.code = 'onlyAudioAllowed';
      return cb(err);
    }
    const err = new Error("Noma'lum xabar turi");
    err.code = 'unknownMessageType';
    return cb(err);
  }
});

/* Video xabarni ("krujok") kvadrat shaklga markazdan kesib, keyin
   barcha brauzerlarda ishlaydigan H.264/AAC MP4 ga kodlaydi. Doira
   ko'rinishini interfeys taraf (CSS border-radius) hosil qiladi. */
/**
 * MP4/MOV faylning davomiyligini (soniyalarda) ffmpeg'siz, faylning
 * ISO-BMFF "box" tuzilmasini o'qib chiqadi (moov > mvhd). Bu formatlar
 * (mp4, mov, m4v) bir xil konteyner tuzilmasidan foydalanadi.
 * Agar aniqlab bo'lmasa, null qaytaradi (chaqiruvchi tomon buni xatolik
 * sifatida emas, "tekshirib bo'lmadi" sifatida talqin qilishi kerak).
 */
/**
 * Yuklangan rasmni siqadi (katta rasmlarni kichraytiradi, JPEG sifatini
 * pasaytiradi) va lentada tez ko'rsatish uchun kichik "thumbnail" nusxasini
 * yaratadi. Asl fayl o'rniga siqilgan versiya yoziladi — disk va trafik
 * tejaladi, lekin sifat ko'zga sezilarli darajada pasaymaydi.
 */
function requireAuth(req, res, next) {
  const uname = req.session.username;
  if (!uname || !db.users[uname]) {
    return res.status(401).json({ error: 'Avval tizimga kiring', code: 'authRequired' });
  }
  const u = db.users[uname];
  ensureModerationFields(u);
  if (refreshModeration(u, uname)) saveDB();
  if (u.moderation.bannedUntil) {
    return res.status(403).json({
      error: 'Hisobingiz vaqtincha bloklangan (ban)', code: 'accountBanned',
      banned: true,
      until: u.moderation.bannedUntil,
      reason: u.moderation.banReason || ''
    });
  }
  next();
}

/* Mutga tushgan foydalanuvchi kontent yarata olmaydi (komment, xabar, asar yuklash) */
function requireNotMuted(req, res, next) {
  const u = db.users[req.session.username];
  if (u) {
    ensureModerationFields(u);
    if (refreshModeration(u, req.session.username)) saveDB();
    if (u.moderation.mutedUntil) {
      return res.status(403).json({
        error: "Siz vaqtincha jimlik jazosidasiz (mut), shuning uchun bu amalni bajara olmaysiz", code: 'muted',
        muted: true,
        until: u.moderation.mutedUntil,
        reason: u.moderation.muteReason || ''
      });
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  const u = db.users[req.session.username];
  if (!u || !u.isAdmin) {
    return res.status(403).json({ error: 'Bu amal uchun administrator huquqi kerak', code: 'adminRequired' });
  }
  next();
}

/* Berilgan foydalanuvchini nechta kishi kuzatib turganini hisoblaydi.
   Migratsiya: relyatsion "follows" jadvali ASOSIY manba, lekin eski
   qatlamda (hali ko'chirilmagan) qo'shimcha kuzatuvchilar bo'lishi
   mumkin bo'lgani uchun ikkalasi username bo'yicha BIRLASHTIRILADI —
   aks holda hisob kam chiqishi mumkin edi. */
function followersUnionSet(uname) {
  const set = new Set(relDb.prepare('SELECT follower FROM follows WHERE followee = ?').all(uname).map(r => r.follower));
  for (const [otherName, otherUser] of Object.entries(db.users)) {
    if (Array.isArray(otherUser.following) && otherUser.following.includes(uname)) set.add(otherName);
  }
  return set;
}
function countFollowers(uname) {
  return followersUnionSet(uname).size;
}

function publicUser(uname) {
  const relUser = relUsers.getUser(relDb, uname);
  const oldUser = db.users[uname];
  if (!relUser && !oldUser) return null;
  if (oldUser) ensureModerationFields(oldUser);
  // Har ikkala manbada ham mavjud bo'lsa, ODATDA bir xil qiymatlarga ega
  // bo'lishi kerak (chunki har bir yozish ikkalasiga ham boradi) — lekin
  // eski qatlam hamon "asosiy" hisoblanadi (rout'lar hali unga yozadi),
  // shuning uchun mavjud bo'lganda ASOSIY manba sifatida shu ishlatiladi.
  const src = oldUser || relUser;

  const followingSet = new Set([
    ...(relUser ? relUser.following : []),
    ...(oldUser ? oldUser.following : [])
  ]);
  const cartKeys = new Set([
    ...(relUser ? Object.keys(relUser.cart) : []),
    ...(oldUser ? Object.keys(oldUser.cart) : [])
  ]);

  return {
    username: uname,
    fullname: src.fullname || '',
    email: src.email || '',
    bio: src.bio || '',
    avatar: src.avatar || null,
    phone: src.phone || '',
    social: src.social || '',
    privacy: Object.assign({ phone: true, social: true, email: false }, src.privacy || {}),
    callPrivacy: Object.assign({ mode: 'everyone', allowed: [] }, src.callPrivacy || {}),
    joined: src.joined,
    theme: src.theme || null,
    notifPrefs: src.notifPrefs,
    lang: src.lang || 'uz',
    isAdmin: !!src.isAdmin,
    isOnline: isUserOnline(uname),
    followingCount: followingSet.size,
    followersCount: countFollowers(uname),
    cartCount: cartKeys.size,
    stats: userWorkStats(uname),
    moderation: {
      bannedUntil: src.moderation.bannedUntil,
      banReason: src.moderation.banReason,
      mutedUntil: src.moderation.mutedUntil,
      muteReason: src.moderation.muteReason
    }
  };
}

/* Foydalanuvchining barcha asarlari bo'yicha umumiy statistika ("do'kon" sahifasi
   va shaxsiy "Statistika" bo'limi uchun).
   MIGRATSIYA IZOHI: bu funksiya ATAYLAB eski qatlamdan (`db.works`,
   `db.orders`) o'qishda qoldirilgan. Ular hamon YOZISH uchun ASOSIY manba
   (har bir rout avval shu yerga yozadi, keyin relyatsion bazaga dublikat
   qiladi), shuning uchun bu yerdagi hisob-kitob ALLAQACHON to'liq va aniq —
   relyatsion bazaga o'tkazish esa (agar u to'liq ko'chirilmagan bo'lsa)
   aksincha KAMROQ to'g'ri natija berish xavfini keltirib chiqarardi. */
function userWorkStats(uname) {
  const works = db.works[uname] || [];
  let saleCount = 0, totalLikes = 0, totalViews = 0, totalComments = 0;
  let ratingSum = 0, ratingCount = 0;
  for (const w of works) {
    if (w.status === 'sale') saleCount++;
    totalLikes += Array.isArray(w.likes) ? w.likes.length : 0;
    totalViews += Number(w.views) || 0;
    totalComments += Array.isArray(w.comments) ? w.comments.length : 0;
    if (Array.isArray(w.reviews)) {
      for (const r of w.reviews) { ratingSum += r.rating; ratingCount++; }
    }
  }
  const completedOrdersCount = db.orders.filter(o =>
    o.status === 'completed' && Array.isArray(o.items) && o.items.some(it => it.sellerUsername === uname)
  ).length;
  /* "Ishonchli sotuvchi" nishoni — kamida 5 ta yakunlangan buyurtma va
     o'rtacha baho 4 dan past emas (agar sharhlar mavjud bo'lsa) */
  const avgRating = ratingCount ? ratingSum / ratingCount : 0;
  const trustedSeller = completedOrdersCount >= 5 && (ratingCount === 0 || avgRating >= 4);
  return {
    worksCount: works.length,
    saleCount,
    expoCount: works.length - saleCount,
    totalLikes,
    totalViews,
    totalComments,
    completedOrdersCount,
    avgRating: Math.round(avgRating * 10) / 10,
    ratingCount,
    trustedSeller
  };
}

/* Boshqa foydalanuvchilarga ko'rinadigan (maxfiylik sozlamalariga rioya qiluvchi) profil ma'lumoti */
function publicProfile(uname, viewerUsername) {
  const u = db.users[uname];
  if (!u) return null;
  const privacy = Object.assign({ phone: true, social: true, email: false }, u.privacy || {});
  const isSelf = viewerUsername && viewerUsername === uname;
  ensureModerationFields(u);
  const viewerUser = viewerUsername && db.users[viewerUsername];
  // Migratsiya: kuzatish sonini/holatini hisoblashda eski+yangi qatlamlar
  // birlashtiriladi (yuqoridagi publicUser()dagi izohga qarang — bir
  // tomon "hali ko'chirilmagan" bo'lishi mumkin).
  const relUname = relUsers.getUser(relDb, uname);
  const followingCount = new Set([...(u.following || []), ...(relUname ? relUname.following : [])]).size;
  let isFollowing = false;
  if (viewerUser) {
    isFollowing = Array.isArray(viewerUser.following) && viewerUser.following.includes(uname);
    if (!isFollowing) {
      const relViewer = relUsers.getUser(relDb, viewerUsername);
      isFollowing = !!(relViewer && relViewer.following.includes(uname));
    }
  }
  return {
    username: uname,
    fullname: u.fullname || '',
    bio: u.bio || '',
    avatar: u.avatar || null,
    joined: u.joined,
    phone: (isSelf || privacy.phone) ? (u.phone || '') : null,
    social: (isSelf || privacy.social) ? (u.social || '') : null,
    email: (isSelf || privacy.email) ? (u.email || '') : null,
    followersCount: countFollowers(uname),
    followingCount,
    isFollowing,
    isSelf,
    isOnline: isUserOnline(uname),
    stats: userWorkStats(uname)
  };
}

/* ===================== AUTH ROUTES ===================== */

/* Ro'yxatdan o'tish, kirish, 2FA, parolni tiklash, /api/me, mavzu,
   bildirishnoma sozlamalari va til rout'lari — routes/auth.js'ga ko'chirilgan. */
app.use(createAuthRouter({
  requireAuth, rateLimit,
  db, saveDB, bcrypt, twofa,
  isValidUsername, SUPPORTED_LANGS,
  mirrorToRelationalDb, relDb, relUsers,
  publicUser, ensureModerationFields, refreshModeration,
  EMAIL_ENABLED, sendMail, pushTextFor, SITE_URL
}));

/* To'lov (Payme/Click) rout'lari — routes/payments.js'ga ko'chirilgan. */
app.use(createPaymentsRouter({
  requireAuth,
  db, saveDB,
  mirrorToRelationalDb, relDb, relOrders,
  addNotification,
  payments
}));

/* Web Push obunalari rout'lari — routes/push.js'ga ko'chirilgan. */
app.use(createPushRouter({
  requireAuth, db, saveDB, ensureModerationFields, PUSH_ENABLED, VAPID_PUBLIC_KEY
}));

/* Profil boshqaruvi, ochiq foydalanuvchi profili, obuna (follow),
   foydalanuvchi haqida shikoyat va sotuvchi statistikasi —
   routes/users.js'ga ko'chirilgan. */
app.use(createUsersRouter({
  requireAuth, rateLimit,
  db, saveDB, bcrypt, fs,
  isValidUsername, renameUsernameEverywhere,
  mirrorToRelationalDb, relDb, relUsers, relReports,
  publicUser, publicProfile,
  upload, multerErrCode,
  workImages, workThumbs,
  ensureModerationFields, ensureReportsArray,
  addNotification, countFollowers
}));


/* ===================== KORZINKA (SAVAT) =====================
   Har bir foydalanuvchining savati u.cart obyektida saqlanadi:
   { workId: miqdor }. Faqat "sotuvda" (status === 'sale') turgan
   asarlarni savatga qo'shish mumkin — ko'rgazma asarlari sotilmaydi.
   (CART_MAX_QTY va stockLimitFor endi lib/utils.js'da.) */

function cartItemView(work, owner, ownerUser, qty) {
  return {
    id: work.id,
    title: work.title,
    type: work.type,
    typeCustom: work.typeCustom || null,
    status: work.status,
    price: work.price,
    currency: work.currency || 'UZS',
    stockMode: work.stockMode || null,
    stockQty: (typeof work.stockQty === 'number') ? work.stockQty : null,
    images: workImages(work),
    thumbs: workThumbs(work),
    video: work.video || null,
    poster: work.poster || null,
    mediaType: work.mediaType || (work.video ? 'video' : 'image'),
    createdAt: work.createdAt,
    username: owner,
    fullname: ownerUser.fullname || owner,
    avatar: ownerUser.avatar || null,
    qty,
    limit: stockLimitFor(work),
    lineTotal: Math.round((Number(work.price) || 0) * qty * 100) / 100
  };
}

/* Savat, buyurtma berish va buyurtma holati rout'lari —
   routes/commerce.js'ga ko'chirilgan. */
app.use(createCommerceRouter({
  requireAuth,
  db, saveDB,
  ensureModerationFields, findWork, stockLimitFor, cartItemView,
  mirrorToRelationalDb, relDb, relUsers, relWorks, relOrders,
  addNotification, createOrderChatMessage,
  payments, isUZSOnlyTotals
}));


/* ===================== SHIKOYATLAR (REPORT) ===================== */

/* Asarlar bilan bog'liq barcha rout'lar (CRUD, lenta, teglar, o'xshash
   asarlar, layklar, ko'rishlar, sharhlar, kommentlar) —
   routes/works.js'ga ko'chirilgan. */
app.use(createWorksRouter({
  requireAuth, requireNotMuted, rateLimit,
  db, saveDB, fs,
  upload, multerErrCode,
  ALLOWED_VIDEO_MIMES, MAX_VIDEO_SECONDS, UPLOADS_DIR,
  parseTags,
  verifyImageFileOrDelete, getMp4DurationSeconds, transcodeVideoToMp4, extractVideoPoster, compressAndThumbnail,
  mirrorToRelationalDb, relDb, relUsers, relWorks, relReports,
  workImages, workThumbs,
  ensureReportsArray, findWork,
  addNotification, userWorkStats, orderHasCompletedItem
}));




/* ===================== PUSH XABARNOMALAR (Web Push) ROUTES ===================== */

/* ===================== WORKS ROUTES ===================== */

/* ===================== FEED (barcha foydalanuvchilar) ===================== */
function findWork(id) {
  for (const uname of Object.keys(db.works)) {
    const list = db.works[uname] || [];
    const work = list.find(w => w.id === id);
    if (work) return { work, owner: uname };
  }
  return null;
}

/* "keramika, sovg'a, devor bezagi" kabi vergul bilan ajratilgan matndan
   tozalangan teglar ro'yxatini hosil qiladi — bo'sh, juda uzun yoki
   takrorlanuvchi teglarni olib tashlaydi, ko'pi bilan 8 tagacha. */

/* ===================== TO'PLAMLAR (Collections) =====================
   Sotuvchi o'z asarlarini nomlangan to'plamlarga guruhlaydi (masalan
   "Kuz 2026 kolleksiyasi"). Faqat o'z asarlarini qo'sha oladi. */

/* Sotuvchi paneli — mavjud ma'lumotlardan (ko'rishlar, layklar, buyurtmalar)
   umumiy statistika va eng yaxshi ishlagan asarlar ro'yxatini hisoblaydi. */

/* O'xshash asarlar — teglar mos kelishi asosiy signal, tur (rasm/haykal/...)
   mosligi ikkinchi darajali signal. O'ziga o'xshashlarni chiqarmaydi. */



/* Xohishlar ro'yxati (Wishlist) — savatdan farqli, xarid qilish niyatisiz
   "keyinroq ko'raman" uchun. Sotuvchiga bildirishnoma yubormaydi — bu shaxsiy
   ro'yxat, layk kabi ijtimoiy signal emas. */
/* "Saqlanganlar" (wishlist) va "To'plamlar" (collections) rout'lari —
   routes/wishlist-collections.js'ga ko'chirilgan. */
app.use(createWishlistCollectionsRouter({
  requireAuth,
  db, saveDB,
  ensureModerationFields, findWork,
  workImages, workThumbs,
  mirrorToRelationalDb, relDb, relUsers, relWorks
}));

/* Asarni to'liq hajmda ochganda chaqiriladi — statistikada ko'rishlar sonini oshiradi.
   Bitta odam bitta asarga kuniga faqat 1 marta prosmotr qo'sha oladi (sessiya orqali kuzatiladi). */



/* ===================== XABARLAR (xaridor <-> sotuvchi aloqasi) ===================== */

function getOrCreateConversation(a, b) {
  const id = convId(a, b);
  if (!db.messages[id]) {
    db.messages[id] = {
      id,
      participants: [a, b].sort(),
      messages: [],
      readUpto: {},
      updatedAt: new Date().toISOString()
    };
    mirrorToRelationalDb(() => relMessages.ensureConversation(relDb, a, b));
  }
  return db.messages[id];
}

/* Buyurtma berilganda xaridor <-> sotuvchi suhbatiga avtomatik "buyurtma"
   turidagi xabar qo'shadi — shunda sotuvchi buyurtmani darhol Xabarlar
   bo'limida ham ko'radi, faqat bildirishnomada emas. Matn tayyor holda
   emas (masalan "3 ta mahsulot"), balki struktura sifatida saqlanadi —
   frontend uni har bir foydalanuvchining o'z sayt tilida ko'rsatadi. */
function createOrderChatMessage(buyer, seller, order, sellerItems) {
  if (buyer === seller) return; // xavfsizlik uchun: o'ziga xabar yubormaydi
  const conv = getOrCreateConversation(buyer, seller);
  const currency = sellerItems[0] ? sellerItems[0].currency : 'UZS';
  const sellerTotal = sellerItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const message = {
    id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
    from: buyer,
    type: 'order',
    orderId: order.id,
    items: sellerItems.map(it => ({ workId: it.workId, title: it.title, qty: it.qty })),
    itemsCount: sellerItems.length,
    total: sellerTotal,
    currency,
    createdAt: order.createdAt
  };
  conv.messages.push(message);
  conv.updatedAt = message.createdAt;
  if (!conv.readUpto) conv.readUpto = {};
  conv.readUpto[buyer] = message.createdAt; // xaridor buni o'zi "yuborgani" uchun o'zida o'qilgan deb belgilanadi

  mirrorToRelationalDb(() => {
    relMessages.addMessage(relDb, conv.id, Object.assign({ to: seller }, message));
    relMessages.setReadUpto(relDb, conv.id, buyer, message.createdAt);
  });
}

/* Suhbatlar ro'yxatidagi so'nggi xabar önizlemesi. MUHIM: bu yerda matnni
   tayyor holda (masalan "🎙️ Ovozli xabar") qaytarib bo'lmaydi — u har doim
   o'zbekcha bo'lib qolib, foydalanuvchi boshqa til tanlagan bo'lsa ham
   tarjima qilinmay ko'rinaverardi. Shu sabab faqat TUR (type) qaytariladi;
   emoji+matnni frontend joriy sayt tiliga qarab o'zi hosil qiladi —
   xuddi lastCallStatus'ni chatCallStatusPreviewText() orqali tarjima
   qilgani kabi. */
/* Barcha suhbatlarim ro'yxati (oxirgi xabar va o'qilmagan soni bilan) */
/* Xabarlar (chat) rout'lari — routes/conversations.js'ga ko'chirilgan. */
app.use(createConversationsRouter({
  requireAuth, requireNotMuted, rateLimit,
  db, saveDB, fs,
  getOrCreateConversation, lastMessagePreviewFor, unreadCountFor,
  mirrorToRelationalDb, relDb, relMessages,
  isNotifCategoryAllowed, sendPush, pushTextFor, ensureModerationFields,
  chatUpload, multerErrCode, UPLOADS_DIR,
  transcodeCircleVideo, transcodeVideoToMp4, getMp4DurationSeconds, extractVideoPoster,
  MAX_CHAT_CIRCLE_SECONDS, MAX_CHAT_VIDEO_SECONDS, MAX_CHAT_VOICE_SECONDS
}));

/* ===================== VIDEO QO'NG'IROQLAR (WebRTC signalizatsiya) =====================
   Chatdagi kabi video qo'ng'iroq — brauzer WebRTC orqali to'g'ridan-to'g'ri ulanadi,
   server esa faqat "offer/answer/ICE" xabarlarini bir-biriga yetkazadi (signalizatsiya).
   Chess/checkers online rejimidagi kabi qisqa intervalli so'rov (polling) andozasidan
   foydalaniladi — alohida WebSocket serveri kerak emas. Hech narsa diskka yozilmaydi,
   faqat xotirada, qo'ng'iroq tugagach tez orada tozalanadi. */
const activeCalls = new Map();     // callId -> call obyekti
const userActiveCall = new Map();  // username -> callId (bir vaqtda faqat bitta qo'ng'iroq)

/* Video qo'ng'iroq (WebRTC signalizatsiya) rout'lari — routes/calls.js'ga
   ko'chirilgan. `activeCalls`/`userActiveCall` REFERENS sifatida uzatiladi
   (yuqoridagi izohga qarang). */
app.use(createCallsRouter({
  requireAuth, requireNotMuted, rateLimit,
  db, saveDB, ensureModerationFields,
  getOrCreateConversation, genCallId, crypto,
  mirrorToRelationalDb, relDb, relMessages,
  activeCalls, userActiveCall
}));

/* ===================== ADMINISTRATOR ===================== */

/* Administrator paneli rout'lari — routes/admin.js'ga ko'chirilgan.
   Bog'liqliklar aniq (deps obyekti orqali) uzatiladi — server.js'ning
   qolgan qismidagi o'zgaruvchilarga "sehrli" yopilish orqali emas. */
app.use(createAdminRouter({
  requireAuth, requireAdmin,
  db, saveDB,
  ensureModerationFields, refreshModeration, parseModerationMinutes,
  isUserOnline, getLastSeen,
  findWork, workImages,
  ensureReportsArray, purgeResolvedReports,
  addNotification,
  mirrorToRelationalDb, relDb, relUsers, relWorks, relReports,
  fs
}));

/* ===================== BILDIRISHNOMALAR (ban/mut va h.k.) ===================== */
app.get('/api/notifications', requireAuth, (req, res) => {
  // Migratsiya: yangi bazadan o'qiladi (u yerda notifications.created_at
  // bo'yicha DESC saralangan — eskisidagi .reverse() bilan bir xil ma'no).
  // Fallback: hali ko'chirilmagan (dual-write'dan oldingi) foydalanuvchilar
  // uchun eski qatlamga qaytamiz.
  const relUser = relUsers.getUser(relDb, req.session.username);
  if (relUser) {
    return res.json({ items: relUser.notifications, unread: relUser.notifications.filter(n => !n.read).length });
  }

  const u = db.users[req.session.username];
  ensureModerationFields(u);
  const items = u.notifications.slice().reverse();
  res.json({ items, unread: items.filter(n => !n.read).length });
});

app.post('/api/notifications/read', requireAuth, async (req, res) => {
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  u.notifications.forEach(n => { n.read = true; });
  await saveDB();
  mirrorToRelationalDb(() => relUsers.markNotificationsRead(relDb, req.session.username));
  res.json({ ok: true });
});

/* SPA fallback — noma'lum yo'llarni ham bosh sahifaga yo'naltiradi */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* Global xatolik handleri — yuqoridagi async-wrapper next(err) orqali yuborgan
   har qanday kutilmagan xatolikni shu yerda ushlaydi, logga yozadi va
   mijozga toza JSON 500 javobini qaytaradi (so'rov osilib qolmaydi). */
app.use((err, req, res, next) => {
  console.error('Kutilmagan server xatoligi:', err);
  if (res.headersSent) return next(err);
  const wantsJson = req.path.startsWith('/api/');
  if (wantsJson) {
    res.status(500).json({ error: 'Server xatoligi yuz berdi', code: 'internalServerError' });
  } else {
    res.status(500).send('Server xatoligi yuz berdi');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Madein.net serveri ${PORT}-portda ishga tushdi`);
});
