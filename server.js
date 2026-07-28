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

const express = require('express');
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

const STORAGE_DIR = path.join(__dirname, 'storage');
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
}

/* db.reports ro'yxati mavjudligini ta'minlaydi (eski db.json fayllar uchun) */
function ensureReportsArray() {
  if (!Array.isArray(db.reports)) db.reports = [];
}

/* Foydalanuvchi nomi (login) shakli to'g'riligini tekshiradi */
function isValidUsername(uname) {
  return !!uname && /^[a-z0-9_]{3,32}$/.test(uname);
}

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
  return changed;
}

function addNotification(uname, notif) {
  const u = db.users[uname];
  if (!u) return;
  ensureModerationFields(u);
  u.notifications.push(Object.assign({
    id: 'n' + Date.now() + crypto.randomBytes(4).toString('hex'),
    createdAt: new Date().toISOString(),
    read: false
  }, notif));
  if (u.notifications.length > 50) u.notifications = u.notifications.slice(-50);
}


/* ===================== JSON FAYL-ASOSLI "BAZA" =====================
   50 kishi uchun to'liq bemalol yetadi. Yozishlar navbatga qo'yiladi,
   shunda ikki so'rov bir vaqtda faylni buzib yozib qo'ymaydi. */
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { users: {}, works: {}, messages: {} };
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.messages) data.messages = {};
    return data;
  } catch (e) {
    console.error('db.json buzilgan, bo\'sh baza bilan boshlanmoqda:', e.message);
    return { users: {}, works: {}, messages: {} };
  }
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
function multerErrCode(err) {
  if (err && err.code === 'LIMIT_FILE_SIZE') return 'fileTooLarge';
  if (err && (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE')) return 'tooManyFiles';
  if (err && err.code && typeof err.code === 'string') return err.code; // bizning fileFilter'dagi o'z kodimiz
  return 'uploadError';
}
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
  writeQueue = writeQueue.then(() => new Promise((resolve, reject) => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFile(tmp, JSON.stringify(db, null, 2), (err) => {
      if (err) return reject(err);
      fs.rename(tmp, DB_FILE, (err2) => err2 ? reject(err2) : resolve());
    });
  }));
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
})();

/* ===================== APP ===================== */
const app = express();
app.set('trust proxy', 1); // ko'p hosting (Render/Railway/Heroku) proxy orqasida ishlaydi

app.use(express.json({ limit: '1mb' }));
app.use(session({
  store: new FileStore({ path: SESSIONS_DIR, logFn: () => {} }),
  secret: process.env.SESSION_SECRET || 'iltimos-buni-production-da-ozgartiring',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 kun
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // HTTPS ostida true bo'ladi
  }
}));

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, 'public')));

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

/* rasm/video yuklash (multer) */
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, crypto.randomBytes(14).toString('hex') + ext);
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
function transcodeVideoToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt yuv420p',       // eski/mobil dekoderlar bilan ham mos
        '-profile:v main',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',   // brauzerda tezroq boshlanishi uchun
        '-vf', "scale='min(1280,iw)':-2"
      ])
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .save(outputPath);
  });
}

/**
 * Video ichidan bitta kadrni JPEG "poster" rasm sifatida ajratib oladi —
 * shunda video hali yuklanmasdan/ijro etilmasdan oldin ham qora ekran
 * emas, balki haqiqiy kadr ko'rinadi (feed va profil kartochkalarida).
 */
function extractVideoPoster(inputPath, outputDir, filename) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .screenshots({
        timestamps: ['0.1'],
        filename,
        folder: outputDir,
        size: '640x?'
      });
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB (qisqa videolarni ham sig'diradi)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    if (ALLOWED_VIDEO_MIMES.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Faqat rasm yoki video (mp4/mov, 10 soniyagacha) fayllari qabul qilinadi');
    err.code = 'invalidWorkMediaType';
    return cb(err);
  }
});

/* ===================== CHATDA FAYL YUBORISH (rasm, video, ovozli xabar,
   "krujok" — Telegramdagi kabi doiraviy video xabar, va istalgan fayl) ===================== */
const ALLOWED_CHAT_VIDEO_MIMES = ALLOWED_VIDEO_MIMES.concat(['video/webm']);
const ALLOWED_AUDIO_MIMES = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/x-m4a'];
const DANGEROUS_FILE_EXT = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.scr', '.ps1', '.vbs', '.js', '.jar', '.app', '.apk'];
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
      if (file.mimetype.startsWith('image/')) return cb(null, true);
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
function transcodeCircleVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-profile:v main',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
        '-vf', "crop='min(iw,ih)':'min(iw,ih)',scale=480:480"
      ])
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .save(outputPath);
  });
}

/**
 * MP4/MOV faylning davomiyligini (soniyalarda) ffmpeg'siz, faylning
 * ISO-BMFF "box" tuzilmasini o'qib chiqadi (moov > mvhd). Bu formatlar
 * (mp4, mov, m4v) bir xil konteyner tuzilmasidan foydalanadi.
 * Agar aniqlab bo'lmasa, null qaytaradi (chaqiruvchi tomon buni xatolik
 * sifatida emas, "tekshirib bo'lmadi" sifatida talqin qilishi kerak).
 */
function getMp4DurationSeconds(absPath) {
  try {
    const fd = fs.openSync(absPath, 'r');
    try {
      const fileSize = fs.fstatSync(fd).size;
      const headerBuf = Buffer.alloc(8);

      function findBox(startOffset, endOffset, targetType) {
        let offset = startOffset;
        while (offset + 8 <= endOffset) {
          fs.readSync(fd, headerBuf, 0, 8, offset);
          let size = headerBuf.readUInt32BE(0);
          const type = headerBuf.toString('ascii', 4, 8);
          let headerLen = 8;
          if (size === 1) {
            // 64-bit kengaytirilgan hajm
            const bigBuf = Buffer.alloc(8);
            fs.readSync(fd, bigBuf, 0, 8, offset + 8);
            size = Number(bigBuf.readBigUInt64BE(0));
            headerLen = 16;
          } else if (size === 0) {
            size = endOffset - offset; // oxirigacha
          }
          if (type === targetType) return { offset, size, headerLen };
          offset += size;
        }
        return null;
      }

      const moov = findBox(0, fileSize, 'moov');
      if (!moov) return null;
      const mvhd = findBox(moov.offset + moov.headerLen, moov.offset + moov.size, 'mvhd');
      if (!mvhd) return null;

      const bodyOffset = mvhd.offset + mvhd.headerLen;
      const versionBuf = Buffer.alloc(1);
      fs.readSync(fd, versionBuf, 0, 1, bodyOffset);
      const version = versionBuf[0];

      let timescale, duration;
      if (version === 1) {
        const buf = Buffer.alloc(28);
        fs.readSync(fd, buf, 0, 28, bodyOffset + 4);
        timescale = buf.readUInt32BE(16);
        duration = Number(buf.readBigUInt64BE(20));
      } else {
        const buf = Buffer.alloc(16);
        fs.readSync(fd, buf, 0, 16, bodyOffset + 4);
        timescale = buf.readUInt32BE(8);
        duration = buf.readUInt32BE(12);
      }
      if (!timescale) return null;
      return duration / timescale;
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    return null;
  }
}

function workImages(w) {
  if (Array.isArray(w.images) && w.images.length) return w.images;
  return w.image ? [w.image] : [];
}

/* Eski (thumb'siz) asarlar uchun: agar thumbs bo'lmasa, to'liq rasmni ishlatamiz */
function workThumbs(w) {
  if (Array.isArray(w.thumbs) && w.thumbs.length === workImages(w).length) return w.thumbs;
  return workImages(w);
}

/**
 * Yuklangan rasmni siqadi (katta rasmlarni kichraytiradi, JPEG sifatini
 * pasaytiradi) va lentada tez ko'rsatish uchun kichik "thumbnail" nusxasini
 * yaratadi. Asl fayl o'rniga siqilgan versiya yoziladi — disk va trafik
 * tejaladi, lekin sifat ko'zga sezilarli darajada pasaymaydi.
 */
async function compressAndThumbnail(absPath) {
  const ext = path.extname(absPath);
  const base = absPath.slice(0, -ext.length);
  const thumbPath = base + '-thumb.jpg';

  // Asl rasmni max 1600px eniga siqib, joyida qayta yozamiz
  const buf = await sharp(absPath)
    .rotate() // EXIF orientatsiyasini to'g'irlaydi
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(absPath, buf);

  // Lenta/kolleja uchun kichik nusxa
  await sharp(buf)
    .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toFile(thumbPath);

  return path.basename(thumbPath);
}

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

function publicUser(uname) {
  const u = db.users[uname];
  if (!u) return null;
  ensureModerationFields(u);
  return {
    username: uname,
    fullname: u.fullname || '',
    email: u.email || '',
    bio: u.bio || '',
    avatar: u.avatar || null,
    phone: u.phone || '',
    social: u.social || '',
    privacy: Object.assign({ phone: true, social: true, email: false }, u.privacy || {}),
    callPrivacy: Object.assign({ mode: 'everyone', allowed: [] }, u.callPrivacy || {}),
    joined: u.joined,
    theme: u.theme || null,
    isAdmin: !!u.isAdmin,
    isOnline: isUserOnline(uname),
    followingCount: (u.following || []).length,
    followersCount: countFollowers(uname),
    cartCount: Object.keys(u.cart || {}).length,
    stats: userWorkStats(uname),
    moderation: {
      bannedUntil: u.moderation.bannedUntil,
      banReason: u.moderation.banReason,
      mutedUntil: u.moderation.mutedUntil,
      muteReason: u.moderation.muteReason
    }
  };
}

/* Berilgan foydalanuvchini nechta kishi kuzatib turganini hisoblaydi */
function countFollowers(uname) {
  let n = 0;
  for (const other of Object.values(db.users)) {
    if (Array.isArray(other.following) && other.following.includes(uname)) n++;
  }
  return n;
}

/* Foydalanuvchining barcha asarlari bo'yicha umumiy statistika ("do'kon" sahifasi
   va shaxsiy "Statistika" bo'limi uchun) */
function userWorkStats(uname) {
  const works = db.works[uname] || [];
  let saleCount = 0, totalLikes = 0, totalViews = 0, totalComments = 0;
  for (const w of works) {
    if (w.status === 'sale') saleCount++;
    totalLikes += Array.isArray(w.likes) ? w.likes.length : 0;
    totalViews += Number(w.views) || 0;
    totalComments += Array.isArray(w.comments) ? w.comments.length : 0;
  }
  return {
    worksCount: works.length,
    saleCount,
    expoCount: works.length - saleCount,
    totalLikes,
    totalViews,
    totalComments
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
    followingCount: (u.following || []).length,
    isFollowing: !!(viewerUser && Array.isArray(viewerUser.following) && viewerUser.following.includes(uname)),
    isSelf,
    isOnline: isUserOnline(uname),
    stats: userWorkStats(uname)
  };
}

/* ===================== AUTH ROUTES ===================== */
app.post('/api/register', rateLimit('register', 8, 10 * 60 * 1000), async (req, res) => {
  try {
    const { username, password, fullname, email } = req.body || {};
    const uname = String(username || '').trim().toLowerCase().replace(/\s+/g, '_');

    if (!isValidUsername(uname)) {
      return res.status(400).json({ error: "Foydalanuvchi nomi 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo'lishi kerak", code: 'usernameInvalid' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 belgidan iborat bo'lishi kerak", code: 'passwordTooShort' });
    }
    if (db.users[uname]) {
      return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon band', code: 'usernameTaken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    db.users[uname] = {
      passwordHash,
      fullname: String(fullname || '').slice(0, 100),
      email: String(email || '').slice(0, 150),
      bio: '',
      avatar: null,
      phone: '',
      social: '',
      privacy: { phone: true, social: true, email: false },
      theme: null,
      joined: new Date().toISOString(),
      isAdmin: false,
      moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
      notifications: [],
      following: [],
      cart: {}
    };
    db.works[uname] = [];
    await saveDB();

    req.session.username = uname;
    res.json({ user: publicUser(uname) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ro'yxatdan o'tishda server xatoligi", code: 'registerServerError' });
  }
});

app.post('/api/login', rateLimit('login', 15, 10 * 60 * 1000), async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const uname = String(username || '').trim().toLowerCase();
    const u = db.users[uname];
    const ok = u && await bcrypt.compare(String(password || ''), u.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Foydalanuvchi nomi yoki parol noto'g'ri", code: 'loginInvalid' });
    }

    ensureModerationFields(u);
    if (refreshModeration(u, uname)) await saveDB();
    if (u.moderation.bannedUntil) {
      return res.status(403).json({
        error: 'Hisobingiz vaqtincha bloklangan (ban)', code: 'accountBanned',
        banned: true,
        until: u.moderation.bannedUntil,
        reason: u.moderation.banReason || ''
      });
    }

    req.session.username = uname;
    res.json({ user: publicUser(uname) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Kirishda server xatoligi', code: 'loginServerError' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', async (req, res) => {
  const uname = req.session.username;
  if (!uname || !db.users[uname]) return res.json({ user: null });
  const u = db.users[uname];
  ensureModerationFields(u);
  if (refreshModeration(u, uname)) await saveDB();
  res.json({ user: publicUser(uname) });
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const u = db.users[req.session.username];
  const { fullname, email, bio, phone, social, privacy, callPrivacy } = req.body || {};
  if (fullname !== undefined) u.fullname = String(fullname).slice(0, 100);
  if (email !== undefined) u.email = String(email).slice(0, 150);
  if (bio !== undefined) u.bio = String(bio).slice(0, 500);
  if (phone !== undefined) u.phone = String(phone).slice(0, 40);
  if (social !== undefined) u.social = String(social).slice(0, 300);
  if (privacy && typeof privacy === 'object') {
    u.privacy = Object.assign({ phone: true, social: true, email: false }, u.privacy || {}, {
      phone: !!privacy.phone,
      social: !!privacy.social,
      email: !!privacy.email
    });
  }
  if (callPrivacy && typeof callPrivacy === 'object') {
    const mode = ['everyone', 'nobody', 'selected'].includes(callPrivacy.mode) ? callPrivacy.mode : 'everyone';
    let allowed = [];
    if (Array.isArray(callPrivacy.allowed)) {
      const me = req.session.username;
      allowed = [...new Set(callPrivacy.allowed
        .map(x => String(x || '').trim().toLowerCase())
        .filter(x => x && x !== me && db.users[x]))]
        .slice(0, 100);
    }
    u.callPrivacy = { mode, allowed };
  }
  await saveDB();
  res.json({ user: publicUser(req.session.username) });
});

/* Login (username) va/yoki parolni o'zgartirish.
   Xavfsizlik uchun joriy parol talab qilinadi. Javob xatoliklari qisqa
   kod shaklida qaytariladi (masalan "usernameTaken"), chunki bu matnlar
   frontendda saytning joriy tiliga tarjima qilinadi. */
app.put('/api/profile/credentials', rateLimit('credentials', 10, 10 * 60 * 1000), requireAuth, async (req, res) => {
  const me = req.session.username;
  const u = db.users[me];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

  const { newUsername, currentPassword, newPassword } = req.body || {};
  const wantsUsernameChange = newUsername !== undefined && String(newUsername || '').trim() !== '';
  const wantsPasswordChange = newPassword !== undefined && String(newPassword || '') !== '';

  if (!wantsUsernameChange && !wantsPasswordChange) {
    return res.status(400).json({ error: 'Hech narsa o\'zgartirilmadi', code: 'noChanges' });
  }

  if (!currentPassword) {
    return res.status(400).json({ error: 'Davom etish uchun joriy parolingizni kiriting', code: 'currentPasswordRequired' });
  }
  const passwordOk = await bcrypt.compare(String(currentPassword), u.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Joriy parol noto\'g\'ri', code: 'currentPasswordIncorrect' });
  }

  let uname = me;
  if (wantsUsernameChange) {
    const candidate = String(newUsername).trim().toLowerCase().replace(/\s+/g, '_');
    if (!isValidUsername(candidate)) {
      return res.status(400).json({ error: 'Foydalanuvchi nomi 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo\'lishi kerak', code: 'usernameInvalid' });
    }
    if (candidate !== me) {
      if (db.users[candidate]) {
        return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon band', code: 'usernameTaken' });
      }
      renameUsernameEverywhere(me, candidate);
      uname = candidate;
      req.session.username = candidate;
    }
  }

  if (wantsPasswordChange) {
    if (String(newPassword).length < 4) {
      return res.status(400).json({ error: 'Parol kamida 4 belgidan iborat bo\'lishi kerak', code: 'passwordTooShort' });
    }
    db.users[uname].passwordHash = await bcrypt.hash(String(newPassword), 10);
  }

  await saveDB();
  res.json({ user: publicUser(uname) });
});

/* Profil rasmini (avatar) yuklash */
app.post('/api/profile/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message, code: multerErrCode(err) });
    if (!req.file) return res.status(400).json({ error: 'Rasm talab qilinadi', code: 'imageRequired' });

    // Avatarni 400x400 kvadratga siqamiz — profil doim tez yuklanadi
    try {
      const buf = await sharp(req.file.path)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'cover' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      fs.writeFileSync(req.file.path, buf);
    } catch (e) { /* siqib bo'lmasa, asl faylni qoldiramiz */ }

    const u = db.users[req.session.username];
    const oldAvatar = u.avatar;
    u.avatar = '/uploads/' + req.file.filename;
    await saveDB();

    if (oldAvatar) {
      fs.unlink(path.join(__dirname, oldAvatar), () => {});
    }
    res.json({ user: publicUser(req.session.username) });
  });
});

/* Boshqa foydalanuvchining ochiq profili (maxfiylikka rioya qilib) */
app.get('/api/users/:username', (req, res) => {
  const uname = String(req.params.username || '').trim().toLowerCase();
  if (!db.users[uname]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

  const viewer = req.session && req.session.username;
  const profile = publicProfile(uname, viewer);

  const works = (db.works[uname] || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(w => ({
      id: w.id,
      title: w.title,
      type: w.type,
      typeCustom: w.typeCustom || null,
      status: w.status,
      price: w.price,
      currency: w.currency || 'UZS',
      stockMode: w.stockMode || null,
      stockQty: (typeof w.stockQty === 'number') ? w.stockQty : null,
      desc: w.desc,
      image: w.image,
      images: workImages(w),
      thumbs: workThumbs(w),
      createdAt: w.createdAt,
      likesCount: Array.isArray(w.likes) ? w.likes.length : 0,
      commentsCount: Array.isArray(w.comments) ? w.comments.length : 0
    }));

  res.json({ profile, works });
});

/* ===================== OBUNA (FOLLOW) ===================== */
app.post('/api/users/:username/follow', requireAuth, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const me = req.session.username;
  if (target === me) return res.status(400).json({ error: "O'zingizga obuna bo'la olmaysiz", code: 'cannotFollowSelf' });
  if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

  const u = db.users[me];
  ensureModerationFields(u);
  const idx = u.following.indexOf(target);
  let following;
  if (idx === -1) {
    u.following.push(target);
    following = true;
  } else {
    u.following.splice(idx, 1);
    following = false;
  }
  await saveDB();
  res.json({ following, followersCount: countFollowers(target) });
});

app.get('/api/users/:username/followers', (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  const items = Object.keys(db.users)
    .filter(uname => Array.isArray(db.users[uname].following) && db.users[uname].following.includes(target))
    .map(uname => ({ username: uname, fullname: db.users[uname].fullname || uname, avatar: db.users[uname].avatar || null }));
  res.json({ items });
});

app.get('/api/users/:username/following', (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  ensureModerationFields(u);
  const items = (u.following || [])
    .filter(uname => db.users[uname])
    .map(uname => ({ username: uname, fullname: db.users[uname].fullname || uname, avatar: db.users[uname].avatar || null }));
  res.json({ items });
});

/* ===================== KORZINKA (SAVAT) =====================
   Har bir foydalanuvchining savati u.cart obyektida saqlanadi:
   { workId: miqdor }. Faqat "sotuvda" (status === 'sale') turgan
   asarlarni savatga qo'shish mumkin — ko'rgazma asarlari sotilmaydi. */
const CART_MAX_QTY = 99;

/* Asar "belgilangan miqdor" rejimida bo'lsa — zaxiradagi sondan oshiq
   savatga qo'shib bo'lmaydi. "Buyurtma asosida" bo'lsa — cheklov yo'q. */
function stockLimitFor(work) {
  if (work.stockMode === 'fixed' && typeof work.stockQty === 'number') {
    return Math.max(0, Math.min(work.stockQty, CART_MAX_QTY));
  }
  return CART_MAX_QTY;
}

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

/* Lentada/feedda bosiladigan "savatga qo'shish" tugmasi — mavjud bo'lsa olib
   tashlaydi, bo'lmasa 1 dona qo'shadi (tezkor qo'shish/olib tashlash). */
app.post('/api/works/:id/cart-toggle', requireAuth, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work, owner } = found;
  const me = req.session.username;
  if (owner === me) return res.status(400).json({ error: "O'z asaringizni savatga qo'sha olmaysiz", code: 'cannotCartOwnWork' });
  if (work.status !== 'sale') return res.status(400).json({ error: 'Bu asar sotuvda emas', code: 'workNotForSale' });
  const limit = stockLimitFor(work);
  if (limit <= 0) return res.status(400).json({ error: 'Bu asar tugagan', code: 'workOutOfStock' });
  const u = db.users[me];
  ensureModerationFields(u);
  let inCart;
  if (u.cart[req.params.id]) { delete u.cart[req.params.id]; inCart = false; }
  else { u.cart[req.params.id] = 1; inCart = true; }
  await saveDB();
  res.json({ inCart, qty: inCart ? 1 : 0, cartCount: Object.keys(u.cart).length });
});

/* Savatdagi bitta mahsulot miqdorini aniq songa o'rnatadi (+ / - tugmalari uchun) */
app.put('/api/cart/:id', requireAuth, async (req, res) => {
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  const found = findWork(req.params.id);
  if (!found || !u.cart[req.params.id]) return res.status(404).json({ error: 'Bu asar savatda topilmadi', code: 'workNotInCart' });
  let qty = Math.floor(Number(req.body && req.body.qty));
  if (!Number.isFinite(qty)) return res.status(400).json({ error: "Noto'g'ri miqdor", code: 'invalidQuantity' });
  if (qty <= 0) { delete u.cart[req.params.id]; }
  else {
    const limit = stockLimitFor(found.work);
    if (qty > limit) return res.status(400).json({ error: `Faqat ${limit} dona mavjud`, code: 'notEnoughStock', params: { n: limit } });
    u.cart[req.params.id] = qty;
  }
  await saveDB();
  res.json({ ok: true, qty: u.cart[req.params.id] || 0 });
});

/* Mahsulotni savatdan butunlay olib tashlaydi */
app.delete('/api/cart/:id', requireAuth, async (req, res) => {
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  delete u.cart[req.params.id];
  await saveDB();
  res.json({ ok: true });
});

app.get('/api/cart', requireAuth, (req, res) => {
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  const items = [];
  let changed = false;
  for (const id of Object.keys(u.cart)) {
    const found = findWork(id);
    const qty = u.cart[id];
    if (!found || found.work.status !== 'sale') { delete u.cart[id]; changed = true; continue; }
    const { work, owner } = found;
    const ownerUser = db.users[owner];
    if (!ownerUser) { delete u.cart[id]; changed = true; continue; }
    const limit = stockLimitFor(work);
    let effQty = qty;
    if (limit <= 0) { delete u.cart[id]; changed = true; continue; }
    if (effQty > limit) { effQty = limit; u.cart[id] = effQty; changed = true; }
    items.push(cartItemView(work, owner, ownerUser, effQty));
  }
  if (changed) saveDB().catch(() => {});
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalsByCurrency = {};
  for (const it of items) {
    totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] || 0) + it.lineTotal;
  }
  res.json({ items, totalsByCurrency, count: items.length });
});

/* Savatdagi barcha asarlar bo'yicha buyurtma yaratadi, sotuvchilarga
   bildirishnoma yuboradi va savatni bo'shatadi. */
app.post('/api/cart/checkout', requireAuth, async (req, res) => {
  const me = req.session.username;
  const u = db.users[me];
  ensureModerationFields(u);
  const ids = Object.keys(u.cart);
  if (!ids.length) return res.status(400).json({ error: "Savat bo'sh", code: 'cartEmpty' });

  const orderItems = [];
  for (const id of ids) {
    const found = findWork(id);
    if (!found || found.work.status !== 'sale') { delete u.cart[id]; continue; }
    const { work, owner } = found;
    const limit = stockLimitFor(work);
    if (limit <= 0) { delete u.cart[id]; continue; }
    const qty = Math.min(u.cart[id], limit);
    orderItems.push({
      workId: work.id,
      title: work.title,
      qty,
      price: Number(work.price) || 0,
      currency: work.currency || 'UZS',
      sellerUsername: owner
    });
    if (work.stockMode === 'fixed' && typeof work.stockQty === 'number') {
      work.stockQty = Math.max(0, work.stockQty - qty);
    }
  }
  if (!orderItems.length) { await saveDB(); return res.status(400).json({ error: "Savat bo'sh", code: 'cartEmpty' }); }

  const totalsByCurrency = {};
  for (const it of orderItems) {
    totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] || 0) + it.price * it.qty;
  }

  const order = {
    id: 'ord' + Date.now() + crypto.randomBytes(4).toString('hex'),
    buyer: me,
    items: orderItems,
    totalsByCurrency,
    status: 'placed',
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);

  const sellers = [...new Set(orderItems.map(it => it.sellerUsername))];
  for (const seller of sellers) {
    const sellerItems = orderItems.filter(it => it.sellerUsername === seller);
    addNotification(seller, {
      type: 'order-received',
      from: me,
      orderId: order.id,
      itemsCount: sellerItems.length
    });
  }
  addNotification(me, { type: 'order-placed', orderId: order.id });

  u.cart = {};
  await saveDB();
  res.json({ ok: true, orderId: order.id, totalsByCurrency });
});

/* Bitta asarni darhol (savatga qo'shmasdan) sotib olish — bosh betdagi
   lentada narxga bosilganda ishga tushadigan "Hoziroq sotib olish" amali */
app.post('/api/works/:id/buy-now', requireAuth, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work, owner } = found;
  const me = req.session.username;
  if (owner === me) return res.status(400).json({ error: "O'z asaringizni sotib ola olmaysiz", code: 'cannotBuyOwnWork' });
  if (work.status !== 'sale') return res.status(400).json({ error: 'Bu asar sotuvda emas', code: 'workNotForSale' });
  const limit = stockLimitFor(work);
  if (limit <= 0) return res.status(400).json({ error: 'Bu asar tugagan', code: 'workOutOfStock' });

  const u = db.users[me];
  ensureModerationFields(u);

  const qty = 1;
  const price = Number(work.price) || 0;
  const currency = work.currency || 'UZS';
  const order = {
    id: 'ord' + Date.now() + crypto.randomBytes(4).toString('hex'),
    buyer: me,
    items: [{ workId: work.id, title: work.title, qty, price, currency, sellerUsername: owner }],
    totalsByCurrency: { [currency]: price * qty },
    status: 'placed',
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);

  if (work.stockMode === 'fixed' && typeof work.stockQty === 'number') {
    work.stockQty = Math.max(0, work.stockQty - qty);
  }
  delete u.cart[work.id]; // endi sotib olingani uchun savatda qolmasin

  addNotification(owner, { type: 'order-received', from: me, orderId: order.id, itemsCount: 1 });
  addNotification(me, { type: 'order-placed', orderId: order.id });

  await saveDB();
  res.json({ ok: true, orderId: order.id, totalsByCurrency: order.totalsByCurrency });
});

/* ===================== SHIKOYATLAR (REPORT) ===================== */
app.post('/api/works/:id/report', requireAuth, rateLimit('report', 15, 10 * 60 * 1000), async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  ensureReportsArray();
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
  db.reports.push({
    id: 'r' + Date.now() + crypto.randomBytes(4).toString('hex'),
    type: 'work',
    targetId: found.work.id,
    targetTitle: found.work.title,
    targetOwner: found.owner,
    reporter: req.session.username,
    reason,
    createdAt: new Date().toISOString(),
    status: 'open'
  });
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/users/:username/report', requireAuth, rateLimit('report', 15, 10 * 60 * 1000), async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  ensureReportsArray();
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
  db.reports.push({
    id: 'r' + Date.now() + crypto.randomBytes(4).toString('hex'),
    type: 'user',
    targetId: target,
    targetTitle: db.users[target].fullname || target,
    targetOwner: target,
    reporter: req.session.username,
    reason,
    createdAt: new Date().toISOString(),
    status: 'open'
  });
  await saveDB();
  res.json({ ok: true });
});

app.put('/api/theme', requireAuth, async (req, res) => {
  const u = db.users[req.session.username];
  const { mode, custom } = req.body || {};
  u.theme = { mode: String(mode || 'tungi'), custom: String(custom || '#e2543f') };
  await saveDB();
  res.json({ ok: true });
});

/* ===================== WORKS ROUTES ===================== */
app.get('/api/works', requireAuth, (req, res) => {
  res.json({ works: db.works[req.session.username] || [] });
});

app.post('/api/works', requireAuth, requireNotMuted, (req, res) => {
  upload.array('images', 3)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message, code: multerErrCode(err) });
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Kamida bitta rasm yoki video talab qilinadi', code: 'mediaRequired' });

    const { title, type, status, price, currency, desc, stockMode: stockModeRaw, stockQty: stockQtyRaw, typeCustom: typeCustomRaw } = req.body || {};
    const isSale = status === 'sale';
    const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];
    const workType = ['rasm', 'haykal', 'mulaj', 'boshqa'].includes(type) ? type : 'boshqa';
    const typeCustom = workType === 'boshqa' ? String(typeCustomRaw || '').trim().slice(0, 60) : '';
    const stockMode = isSale && stockModeRaw === 'fixed' ? 'fixed' : 'order';
    let stockQty = null;
    if (isSale && stockMode === 'fixed') {
      const n = Math.floor(Number(stockQtyRaw));
      stockQty = Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : 1;
    }

    const videoFile = req.files.find(f => ALLOWED_VIDEO_MIMES.includes(f.mimetype));
    const imageFiles = req.files.filter(f => f.mimetype.startsWith('image/'));

    // Yordamchi: yuklangan fayllarni diskdan o'chirib, xatolik qaytaradi
    function rejectWithCleanup(status, message, code) {
      req.files.forEach(f => fs.unlink(f.path, () => {}));
      return res.status(status).json({ error: message, code });
    }

    if (videoFile) {
      if (req.files.length > 1) {
        return rejectWithCleanup(400, "Video bilan birga boshqa fayl yuklab bo'lmaydi — faqat bitta video tanlang", 'videoWithOtherFiles');
      }
      const durationSec = getMp4DurationSeconds(videoFile.path);
      if (durationSec !== null && durationSec > MAX_VIDEO_SECONDS) {
        return rejectWithCleanup(400, 'Video 10 soniyadan uzun bo\'lmasligi kerak', 'videoTooLong10s');
      }

      // Videoni har doim H.264/AAC MP4'ga qayta kodlaymiz (asl fayl mp4 yoki
      // mov/hevc bo'lishidan qat'iy nazar) — shunda barcha brauzerlarda bir xil
      // ishonchli tarzda ijro etiladi, va bitta poster-kadr ajratib olamiz.
      const transcodedFilename = crypto.randomBytes(14).toString('hex') + '.mp4';
      const transcodedPath = path.join(UPLOADS_DIR, transcodedFilename);
      const posterFilename = crypto.randomBytes(14).toString('hex') + '.jpg';

      try {
        await transcodeVideoToMp4(videoFile.path, transcodedPath);
        await extractVideoPoster(transcodedPath, UPLOADS_DIR, posterFilename);
      } catch (e) {
        fs.unlink(transcodedPath, () => {});
        fs.unlink(path.join(UPLOADS_DIR, posterFilename), () => {});
        return rejectWithCleanup(400, "Videoni qayta ishlashda xatolik yuz berdi. Boshqa video tanlab ko'ring.", 'videoProcessingFailed');
      }

      // Asl yuklangan fayl endi kerak emas — qayta kodlangan nusxa saqlanadi
      fs.unlink(videoFile.path, () => {});

      const work = {
        id: 'w' + Date.now() + crypto.randomBytes(4).toString('hex'),
        title: String(title || '').slice(0, 200),
        type: workType,
        typeCustom: typeCustom || undefined,
        status: isSale ? 'sale' : 'expo',
        price: isSale ? (Number(price) || 0) : 0,
        currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
        stockMode: isSale ? stockMode : null,
        stockQty: isSale ? stockQty : null,
        desc: String(desc || '').slice(0, 2000),
        mediaType: 'video',
        video: '/uploads/' + transcodedFilename,
        poster: '/uploads/' + posterFilename,
        images: [],
        thumbs: [],
        image: null,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        views: 0
      };
      const uname = req.session.username;
      if (!db.works[uname]) db.works[uname] = [];
      db.works[uname].push(work);
      await saveDB();
      return res.json({ work });
    }

    if (!imageFiles.length) return rejectWithCleanup(400, 'Kamida bitta rasm yoki video talab qilinadi', 'mediaRequired');

    // Har bir rasmni siqib, thumbnail yaratamiz (rasm sifati deyarli
    // o'zgarmaydi, lekin fayl hajmi va sahifa yuklanish tezligi yaxshilanadi)
    let thumbs;
    try {
      thumbs = await Promise.all(imageFiles.map(f => compressAndThumbnail(f.path)));
    } catch (e) {
      // Siqishda xatolik bo'lsa ham, asl rasmlar bilan davom etamiz
      thumbs = imageFiles.map(() => null);
    }
    const images = imageFiles.map(f => '/uploads/' + f.filename);
    const thumbImages = thumbs.map((t, i) => t ? '/uploads/' + t : images[i]);

    const work = {
      id: 'w' + Date.now() + crypto.randomBytes(4).toString('hex'),
      title: String(title || '').slice(0, 200),
      type: workType,
      typeCustom: typeCustom || undefined,
      status: isSale ? 'sale' : 'expo',
      price: isSale ? (Number(price) || 0) : 0,
      currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
      stockMode: isSale ? stockMode : null,
      stockQty: isSale ? stockQty : null,
      desc: String(desc || '').slice(0, 2000),
      mediaType: 'image',
      video: null,
      images,
      thumbs: thumbImages,
      image: images[0], // eski frontend/kod bilan moslik uchun
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      views: 0
    };

    const uname = req.session.username;
    if (!db.works[uname]) db.works[uname] = [];
    db.works[uname].push(work);
    await saveDB();
    res.json({ work });
  });
});

app.delete('/api/works/:id', requireAuth, async (req, res) => {
  const uname = req.session.username;
  const list = db.works[uname] || [];
  const work = list.find(w => w.id === req.params.id);
  db.works[uname] = list.filter(w => w.id !== req.params.id);
  await saveDB();
  if (work) {
    workImages(work).forEach(img => fs.unlink(path.join(__dirname, img), () => {}));
    if (Array.isArray(work.thumbs)) {
      work.thumbs.forEach(img => {
        if (img && !workImages(work).includes(img)) fs.unlink(path.join(__dirname, img), () => {});
      });
    }
    if (work.video) fs.unlink(path.join(__dirname, work.video), () => {});
    if (work.poster) fs.unlink(path.join(__dirname, work.poster), () => {});
  }
  res.json({ ok: true });
});

/* ===================== FEED (barcha foydalanuvchilar) ===================== */
function findWork(id) {
  for (const uname of Object.keys(db.works)) {
    const list = db.works[uname] || [];
    const work = list.find(w => w.id === id);
    if (work) return { work, owner: uname };
  }
  return null;
}

app.get('/api/feed', (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));
  const me = req.session.username;
  const meUser = me && db.users[me];

  const q = String(req.query.q || '').trim().toLowerCase();
  const type = String(req.query.type || '').trim().toLowerCase();
  const onlyFollowing = req.query.following === '1' || req.query.following === 'true';
  const sort = String(req.query.sort || 'new').trim().toLowerCase(); // 'new' | 'top'
  const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== '' ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : null;

  if (onlyFollowing && !meUser) return res.json({ items: [], hasMore: false, total: 0 });
  const followingSet = onlyFollowing ? new Set(meUser.following || []) : null;

  const all = [];
  for (const uname of Object.keys(db.works)) {
    const u = db.users[uname];
    if (!u) continue;
    if (onlyFollowing && !followingSet.has(uname)) continue;
    for (const w of db.works[uname] || []) {
      if (type && type !== 'all' && w.type !== type) continue;
      if ((minPrice !== null || maxPrice !== null)) {
        if (w.status !== 'sale') continue; // narx filtri faqat sotuvdagi asarlarga tegishli
        if (minPrice !== null && !Number.isNaN(minPrice) && (w.price || 0) < minPrice) continue;
        if (maxPrice !== null && !Number.isNaN(maxPrice) && (w.price || 0) > maxPrice) continue;
      }
      if (q) {
        const hay = (w.title + ' ' + (w.desc || '') + ' ' + (u.fullname || '') + ' ' + uname).toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const likes = Array.isArray(w.likes) ? w.likes : [];
      const comments = Array.isArray(w.comments) ? w.comments : [];
      all.push({
        id: w.id,
        title: w.title,
        type: w.type,
        typeCustom: w.typeCustom || null,
        status: w.status,
        price: w.price,
        currency: w.currency || 'UZS',
        stockMode: w.stockMode || null,
        stockQty: (typeof w.stockQty === 'number') ? w.stockQty : null,
        desc: w.desc,
        image: w.image,
        images: workImages(w),
        thumbs: workThumbs(w),
        video: w.video || null,
        poster: w.poster || null,
        mediaType: w.mediaType || (w.video ? 'video' : 'image'),
        createdAt: w.createdAt,
        username: uname,
        fullname: u.fullname || uname,
        avatar: u.avatar || null,
        likesCount: likes.length,
        likedByMe: likes.includes(me),
        inCart: !!(meUser && meUser.cart && Object.prototype.hasOwnProperty.call(meUser.cart, w.id)),
        commentsCount: comments.length,
        viewsCount: Number(w.views) || 0,
        isFollowing: !!(meUser && Array.isArray(meUser.following) && meUser.following.includes(uname))
      });
    }
  }
  if (sort === 'top') {
    all.sort((a, b) => (b.likesCount - a.likesCount) || (new Date(b.createdAt) - new Date(a.createdAt)));
  } else {
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const page = all.slice(offset, offset + limit);
  res.json({ items: page, hasMore: offset + limit < all.length, total: all.length });
});

app.post('/api/works/:id/like', requireAuth, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work } = found;
  if (!Array.isArray(work.likes)) work.likes = [];

  const me = req.session.username;
  const idx = work.likes.indexOf(me);
  let liked;
  if (idx === -1) { work.likes.push(me); liked = true; }
  else { work.likes.splice(idx, 1); liked = false; }

  await saveDB();
  res.json({ liked, likesCount: work.likes.length });
});

/* Asarni to'liq hajmda ochganda chaqiriladi — statistikada ko'rishlar sonini oshiradi */
app.post('/api/works/:id/view', rateLimit('view', 120, 60 * 1000), async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work } = found;
  work.views = (Number(work.views) || 0) + 1;
  await saveDB();
  res.json({ viewsCount: work.views });
});

/* ===================== KOMENTLAR ===================== */
app.get('/api/works/:id/comments', (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const list = Array.isArray(found.work.comments) ? found.work.comments : [];
  const items = list.map(c => {
    const u = db.users[c.username];
    return {
      id: c.id,
      text: c.text,
      username: c.username,
      fullname: (u && u.fullname) || c.username,
      createdAt: c.createdAt
    };
  });
  res.json({ items });
});

app.post('/api/works/:id/comments', requireAuth, requireNotMuted, rateLimit('comment', 30, 60 * 1000), async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work } = found;

  const text = String((req.body && req.body.text) || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'Koment matni bo\'sh bo\'lishi mumkin emas', code: 'commentEmpty' });

  if (!Array.isArray(work.comments)) work.comments = [];
  const me = req.session.username;
  const comment = {
    id: 'c' + Date.now() + crypto.randomBytes(4).toString('hex'),
    username: me,
    text,
    createdAt: new Date().toISOString()
  };
  work.comments.push(comment);
  await saveDB();

  const u = db.users[me];
  res.json({
    comment: {
      id: comment.id,
      text: comment.text,
      username: comment.username,
      fullname: (u && u.fullname) || me,
      createdAt: comment.createdAt
    },
    commentsCount: work.comments.length
  });
});

app.delete('/api/works/:id/comments/:commentId', requireAuth, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work } = found;
  if (!Array.isArray(work.comments)) work.comments = [];

  const me = req.session.username;
  const idx = work.comments.findIndex(c => c.id === req.params.commentId);
  if (idx === -1) return res.status(404).json({ error: 'Koment topilmadi', code: 'commentNotFound' });

  const comment = work.comments[idx];
  const isOwner = comment.username === me;
  const isWorkOwner = found.owner === me;
  if (!isOwner && !isWorkOwner) {
    return res.status(403).json({ error: "Bu komentni o'chirishga ruxsatingiz yo'q", code: 'commentDeleteForbidden' });
  }

  work.comments.splice(idx, 1);
  await saveDB();
  res.json({ ok: true, commentsCount: work.comments.length });
});

/* ===================== XABARLAR (xaridor <-> sotuvchi aloqasi) ===================== */
function convId(a, b) {
  return [a, b].sort().join('__');
}

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
  }
  return db.messages[id];
}

function unreadCountFor(conv, me) {
  const readUpto = (conv.readUpto && conv.readUpto[me]) || null;
  return conv.messages.filter(m => m.from !== me && (!readUpto || new Date(m.createdAt) > new Date(readUpto))).length;
}

/* Suhbatlar ro'yxatidagi so'nggi xabar önizlemesi. MUHIM: bu yerda matnni
   tayyor holda (masalan "🎙️ Ovozli xabar") qaytarib bo'lmaydi — u har doim
   o'zbekcha bo'lib qolib, foydalanuvchi boshqa til tanlagan bo'lsa ham
   tarjima qilinmay ko'rinaverardi. Shu sabab faqat TUR (type) qaytariladi;
   emoji+matnni frontend joriy sayt tiliga qarab o'zi hosil qiladi —
   xuddi lastCallStatus'ni chatCallStatusPreviewText() orqali tarjima
   qilgani kabi. */
function lastMessagePreviewFor(last) {
  if (!last || last.type === 'call') return { type: null, text: '' };
  switch (last.type) {
    case 'photo': return { type: 'photo', text: '' };
    case 'video': return { type: 'video', text: '' };
    case 'circle': return { type: 'circle', text: '' };
    case 'voice': return { type: 'voice', text: '' };
    case 'file': return { type: 'file', text: '', fileName: last.fileName || '' };
    default: return { type: 'text', text: last.text || '' };
  }
}

/* Barcha suhbatlarim ro'yxati (oxirgi xabar va o'qilmagan soni bilan) */
app.get('/api/conversations', requireAuth, (req, res) => {
  const me = req.session.username;
  const items = Object.values(db.messages)
    .filter(c => c.participants.includes(me))
    .map(c => {
      const other = c.participants.find(p => p !== me) || me;
      const u = db.users[other];
      const last = c.messages[c.messages.length - 1] || null;
      const preview = lastMessagePreviewFor(last);
      return {
        username: other,
        fullname: (u && u.fullname) || other,
        avatar: (u && u.avatar) || null,
        lastMessage: preview.text,
        lastMessageType: preview.type,
        lastFileName: preview.fileName || null,
        lastCallStatus: last && last.type === 'call' ? (last.callStatus || 'ended') : null,
        lastFrom: last ? last.from : null,
        updatedAt: c.updatedAt,
        unread: unreadCountFor(c, me)
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ items });
});

/* Navbar belgisi uchun jami o'qilmagan xabarlar soni */
app.get('/api/conversations/unread-count', requireAuth, (req, res) => {
  const me = req.session.username;
  let total = 0;
  for (const c of Object.values(db.messages)) {
    if (!c.participants.includes(me)) continue;
    total += unreadCountFor(c, me);
  }
  res.json({ count: total });
});

/* Muayyan foydalanuvchi bilan suhbat tarixi (ochilganda o'qilgan deb belgilanadi) */
app.get('/api/conversations/:username/messages', requireAuth, async (req, res) => {
  const me = req.session.username;
  const other = String(req.params.username || '').trim().toLowerCase();
  if (!db.users[other]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  if (other === me) return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz", code: 'cannotMessageSelf' });

  const conv = getOrCreateConversation(me, other);
  if (!conv.readUpto) conv.readUpto = {};
  conv.readUpto[me] = new Date().toISOString();
  await saveDB();

  const u = db.users[other];
  res.json({
    otherUser: { username: other, fullname: (u && u.fullname) || other, avatar: (u && u.avatar) || null },
    items: conv.messages
  });
});

/* Sotuvchiga (yoki istalgan foydalanuvchiga) yangi xabar yuborish */
app.post('/api/conversations/:username/messages', requireAuth, requireNotMuted, rateLimit('message', 40, 60 * 1000), async (req, res) => {
  const me = req.session.username;
  const other = String(req.params.username || '').trim().toLowerCase();
  if (!db.users[other]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  if (other === me) return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz", code: 'cannotMessageSelf' });

  const text = String((req.body && req.body.text) || '').trim().slice(0, 1000);
  if (!text) return res.status(400).json({ error: "Xabar matni bo'sh bo'lishi mumkin emas", code: 'messageEmpty' });

  const workId = req.body && req.body.workId ? String(req.body.workId).slice(0, 60) : null;
  const workTitle = req.body && req.body.workTitle ? String(req.body.workTitle).slice(0, 200) : null;

  const conv = getOrCreateConversation(me, other);
  const message = {
    id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
    from: me,
    text,
    workId,
    workTitle,
    createdAt: new Date().toISOString()
  };
  conv.messages.push(message);
  conv.updatedAt = message.createdAt;
  if (!conv.readUpto) conv.readUpto = {};
  conv.readUpto[me] = message.createdAt;
  await saveDB();

  res.json({ message });
});

/* Chatga rasm, video, ovozli xabar, "krujok" (doiraviy video xabar) yoki
   istalgan fayl yuborish. `type` maydoni: photo | video | circle | voice | file */
app.post('/api/conversations/:username/messages/media', requireAuth, requireNotMuted, rateLimit('message-media', 30, 60 * 1000), (req, res) => {
  chatUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message, code: multerErrCode(err) });

    const me = req.session.username;
    const other = String(req.params.username || '').trim().toLowerCase();
    const cleanup = () => { if (req.file) fs.unlink(req.file.path, () => {}); };

    if (!db.users[other]) { cleanup(); return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' }); }
    if (other === me) { cleanup(); return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz", code: 'cannotMessageSelf' }); }
    if (!req.file) return res.status(400).json({ error: 'Fayl talab qilinadi', code: 'fileRequired' });

    const kind = String(req.body.type || '').toLowerCase();
    const caption = String(req.body.caption || '').trim().slice(0, 500);

    try {
      const message = {
        id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
        from: me,
        type: kind,
        text: caption,
        createdAt: new Date().toISOString()
      };

      if (kind === 'photo') {
        message.url = '/uploads/' + req.file.filename;

      } else if (kind === 'video' || kind === 'circle') {
        const transcodedFilename = crypto.randomBytes(14).toString('hex') + '.mp4';
        const transcodedPath = path.join(UPLOADS_DIR, transcodedFilename);
        try {
          if (kind === 'circle') await transcodeCircleVideo(req.file.path, transcodedPath);
          else await transcodeVideoToMp4(req.file.path, transcodedPath);
        } catch (e) {
          cleanup();
          return res.status(400).json({ error: "Videoni qayta ishlashda xatolik yuz berdi. Boshqa video tanlab ko'ring.", code: 'videoProcessingFailed' });
        }
        cleanup(); // asl (transkodlanmagan) faylni o'chiramiz

        const realDuration = getMp4DurationSeconds(transcodedPath);
        const maxSec = kind === 'circle' ? MAX_CHAT_CIRCLE_SECONDS : MAX_CHAT_VIDEO_SECONDS;
        if (realDuration && realDuration > maxSec + 1) {
          fs.unlink(transcodedPath, () => {});
          return res.status(400).json({ error: `Video juda uzun (maksimal ${maxSec} soniya)`, code: 'videoTooLong', params: { n: maxSec } });
        }

        const posterFilename = transcodedFilename.replace(/\.mp4$/, '.jpg');
        try {
          await extractVideoPoster(transcodedPath, UPLOADS_DIR, posterFilename);
          message.poster = '/uploads/' + posterFilename;
        } catch (e) { /* poster bo'lmasa ham video ko'rinaveradi */ }

        message.url = '/uploads/' + transcodedFilename;
        message.duration = realDuration || (Number(req.body.duration) || null);

      } else if (kind === 'voice') {
        message.url = '/uploads/' + req.file.filename;
        const dur = Number(req.body.duration);
        message.duration = Number.isFinite(dur) && dur > 0 ? Math.min(Math.round(dur), MAX_CHAT_VOICE_SECONDS) : null;

      } else if (kind === 'file') {
        message.url = '/uploads/' + req.file.filename;
        message.fileName = String(req.body.fileName || req.file.originalname || 'fayl').slice(0, 200);
        message.fileSize = req.file.size;

      } else {
        cleanup();
        return res.status(400).json({ error: "Noma'lum xabar turi", code: 'unknownMessageType' });
      }

      const conv = getOrCreateConversation(me, other);
      conv.messages.push(message);
      conv.updatedAt = message.createdAt;
      if (!conv.readUpto) conv.readUpto = {};
      conv.readUpto[me] = message.createdAt;
      await saveDB();

      res.json({ message });
    } catch (e) {
      cleanup();
      console.error('Chat media xatoligi:', e.message);
      res.status(500).json({ error: 'Server xatoligi', code: 'serverError' });
    }
  });
});

/* ===================== VIDEO QO'NG'IROQLAR (WebRTC signalizatsiya) =====================
   Chatdagi kabi video qo'ng'iroq — brauzer WebRTC orqali to'g'ridan-to'g'ri ulanadi,
   server esa faqat "offer/answer/ICE" xabarlarini bir-biriga yetkazadi (signalizatsiya).
   Chess/checkers online rejimidagi kabi qisqa intervalli so'rov (polling) andozasidan
   foydalaniladi — alohida WebSocket serveri kerak emas. Hech narsa diskka yozilmaydi,
   faqat xotirada, qo'ng'iroq tugagach tez orada tozalanadi. */
const activeCalls = new Map();     // callId -> call obyekti
const userActiveCall = new Map();  // username -> callId (bir vaqtda faqat bitta qo'ng'iroq)
const CALL_RING_TIMEOUT_MS = 45 * 1000;   // shuncha vaqt javob bo'lmasa — "javob berilmadi"
const CALL_STALE_MS = 2 * 60 * 1000;      // tugagan qo'ng'iroq shuncha vaqtdan keyin xotiradan o'chadi

function genCallId() { return 'call' + Date.now() + crypto.randomBytes(5).toString('hex'); }

/* `toUser` kimlardan qo'ng'iroqni qabul qilishini tekshiradi */
function callPrivacyCheck(fromUser, toUser) {
  const target = db.users[toUser];
  if (!target) return { ok: false, reason: 'notfound' };
  ensureModerationFields(target);
  const cp = target.callPrivacy;
  if (cp.mode === 'nobody') return { ok: false, reason: 'blocked' };
  if (cp.mode === 'selected' && !cp.allowed.includes(fromUser)) return { ok: false, reason: 'blocked' };
  return { ok: true };
}

function callView(call, me) {
  const other = call.from === me ? call.to : call.from;
  const ou = db.users[other];
  return {
    id: call.id,
    role: call.from === me ? 'caller' : 'callee',
    status: call.status,
    otherUser: { username: other, fullname: (ou && ou.fullname) || other, avatar: (ou && ou.avatar) || null },
    offer: call.from === me ? undefined : call.offer,   // faqat callee offerni oladi
    answer: call.from === me ? call.answer : undefined, // faqat caller answerni oladi
    cameraOff: !!call.cameraOff[other],   // narigi tomonning kamerasi o'chirilganmi
    myCameraOff: !!call.cameraOff[me],
    createdAt: call.createdAt,
    updatedAt: call.updatedAt
  };
}

function endCallInternal(call, status) {
  call.status = status;
  call.updatedAt = Date.now();
  if (userActiveCall.get(call.from) === call.id) userActiveCall.delete(call.from);
  if (userActiveCall.get(call.to) === call.id) userActiveCall.delete(call.to);

  /* Telegramdagi kabi — suhbatga qo'ng'iroq haqida tizim xabari qo'shamiz
     (masalan: "Video qo'ng'iroq · 3:24" yoki "Javob berilmadi") */
  try {
    const duration = (status === 'ended' && call.acceptedAt)
      ? Math.max(0, Math.round((call.updatedAt - call.acceptedAt) / 1000))
      : 0;
    const conv = getOrCreateConversation(call.from, call.to);
    const message = {
      id: 'm' + Date.now() + crypto.randomBytes(4).toString('hex'),
      from: call.from,
      type: 'call',
      callStatus: status,     // 'ended' | 'declined' | 'missed' | 'cancelled' | 'busy'
      callDuration: duration, // soniyalarda; faqat 'ended' holatida > 0 bo'lishi mumkin
      text: '',
      createdAt: new Date(call.updatedAt).toISOString()
    };
    conv.messages.push(message);
    conv.updatedAt = message.createdAt;
    saveDB().catch(() => {});
  } catch (e) { /* jim o'tkazamiz — xabar qo'shilmasa ham qo'ng'iroq tugashi kerak */ }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, call] of activeCalls) {
    if (call.status === 'ringing' && now - call.createdAt > CALL_RING_TIMEOUT_MS) {
      endCallInternal(call, 'missed');
    }
    if (['ended', 'declined', 'missed', 'cancelled', 'busy'].includes(call.status) && now - call.updatedAt > CALL_STALE_MS) {
      activeCalls.delete(id);
    }
  }
}, 5000).unref();

/* Sotuvchiga (yoki istalgan foydalanuvchiga) video qo'ng'iroq boshlash */
app.post('/api/calls/start', requireAuth, requireNotMuted, rateLimit('call-start', 20, 60 * 1000), (req, res) => {
  const me = req.session.username;
  const to = String((req.body && req.body.to) || '').trim().toLowerCase();
  if (!to || !db.users[to]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  if (to === me) return res.status(400).json({ error: "O'zingizga qo'ng'iroq qila olmaysiz", code: 'cannotCallSelf' });

  if (userActiveCall.has(me)) return res.status(409).json({ error: "Sizda allaqachon faol qo'ng'iroq bor", code: 'callAlreadyActive' });
  if (userActiveCall.has(to)) return res.status(409).json({ error: "Foydalanuvchi hozir band", code: 'userBusy', busy: true });

  const check = callPrivacyCheck(me, to);
  if (!check.ok) {
    return res.status(403).json({
      error: "Bu foydalanuvchi video qo'ng'iroqlarni cheklagan", code: 'callBlocked',
      blocked: true
    });
  }

  const id = genCallId();
  const call = {
    id,
    from: me,
    to,
    status: 'ringing',
    offer: null,
    answer: null,
    candidates: { [me]: [], [to]: [] },
    cameraOff: { [me]: false, [to]: false },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  activeCalls.set(id, call);
  userActiveCall.set(me, id);
  userActiveCall.set(to, id);
  res.json({ call: callView(call, me) });
});

/* Joriy (faol) qo'ng'iroq holatini kuzatish uchun polling nuqtasi —
   ham chaqiruvchi, ham qabul qiluvchi shu orqali holatni tekshirib turadi */
app.get('/api/calls/current', requireAuth, (req, res) => {
  const me = req.session.username;
  const id = userActiveCall.get(me);
  if (!id || !activeCalls.has(id)) return res.json({ call: null });
  res.json({ call: callView(activeCalls.get(id), me) });
});

function getCallForParticipant(req, res) {
  const me = req.session.username;
  const call = activeCalls.get(req.params.id);
  if (!call || (call.from !== me && call.to !== me)) {
    res.status(404).json({ error: "Qo'ng'iroq topilmadi", code: 'callNotFound' });
    return null;
  }
  return call;
}

app.get('/api/calls/:id', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  res.json({ call: callView(call, req.session.username) });
});

/* Chaqiruvchi tomon WebRTC "offer"ni yuboradi */
app.post('/api/calls/:id/offer', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  if (call.from !== me) return res.status(403).json({ error: 'Faqat chaqiruvchi taklif yubora oladi', code: 'onlyCallerCanOffer' });
  const sdp = req.body && req.body.sdp;
  if (!sdp || typeof sdp !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot", code: 'invalidData' });
  call.offer = sdp;
  call.updatedAt = Date.now();
  res.json({ ok: true });
});

/* Qabul qiluvchi tomon qo'ng'iroqni qabul qilib, WebRTC "answer" yuboradi */
app.post('/api/calls/:id/answer', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  if (call.to !== me) return res.status(403).json({ error: 'Faqat qabul qiluvchi javob bera oladi', code: 'onlyCalleeCanAnswer' });
  if (call.status !== 'ringing') return res.status(400).json({ error: "Qo'ng'iroq allaqachon tugagan", code: 'callAlreadyEnded' });
  const sdp = req.body && req.body.sdp;
  if (!sdp || typeof sdp !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot", code: 'invalidData' });
  call.answer = sdp;
  call.status = 'accepted';
  call.acceptedAt = Date.now();
  call.updatedAt = Date.now();
  res.json({ ok: true });
});

/* ICE kandidatlarini almashish */
app.post('/api/calls/:id/candidate', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  const candidate = req.body && req.body.candidate;
  if (!candidate || typeof candidate !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot", code: 'invalidData' });
  if (!Array.isArray(call.candidates[me])) call.candidates[me] = [];
  call.candidates[me].push(candidate);
  if (call.candidates[me].length > 200) call.candidates[me].shift();
  res.json({ ok: true });
});

app.get('/api/calls/:id/candidates', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  const other = call.from === me ? call.to : call.from;
  res.json({ items: call.candidates[other] || [] });
});

/* Qo'ng'iroqni rad etish (qabul qiluvchi tomonidan) */
app.post('/api/calls/:id/decline', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  if (call.to !== me) return res.status(403).json({ error: 'Faqat qabul qiluvchi rad eta oladi', code: 'onlyCalleeCanDecline' });
  if (call.status === 'ringing') endCallInternal(call, 'declined');
  res.json({ ok: true });
});

/* Chaqiruvchi hali javob kelmasdan qo'ng'iroqni bekor qiladi */
app.post('/api/calls/:id/cancel', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  if (call.from !== me) return res.status(403).json({ error: 'Faqat chaqiruvchi bekor qila oladi', code: 'onlyCallerCanCancel' });
  if (call.status === 'ringing') endCallInternal(call, 'cancelled');
  res.json({ ok: true });
});

/* Qo'ng'iroqni yakunlash (ikkala tomon ham qila oladi) */
app.post('/api/calls/:id/end', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  if (!['ended', 'declined', 'missed', 'cancelled', 'busy'].includes(call.status)) endCallInternal(call, 'ended');
  res.json({ ok: true });
});

/* Kamerani yoqish/o'chirish holatini narigi tomonga bildirish
   (video qo'ng'iroqda kamerani o'chirib qo'yish imkoniyati) */
app.post('/api/calls/:id/camera', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  call.cameraOff[me] = !!(req.body && req.body.off);
  call.updatedAt = Date.now();
  res.json({ ok: true });
});

/* ===================== ADMINISTRATOR ===================== */

/* Barcha foydalanuvchilar ro'yxati (Administrator burchagi uchun) */
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  let dirty = false;
  const list = Object.keys(db.users).map(uname => {
    const u = db.users[uname];
    ensureModerationFields(u);
    if (refreshModeration(u, uname)) dirty = true;
    return {
      username: uname,
      fullname: u.fullname || '',
      email: u.email || '',
      avatar: u.avatar || null,
      isAdmin: !!u.isAdmin,
      isOnline: isUserOnline(uname),
      lastSeenAt: getLastSeen(uname),
      joined: u.joined,
      worksCount: (db.works[uname] || []).length,
      bannedUntil: u.moderation.bannedUntil,
      banReason: u.moderation.banReason,
      mutedUntil: u.moderation.mutedUntil,
      muteReason: u.moderation.muteReason
    };
  }).sort((a, b) => new Date(b.joined) - new Date(a.joined));
  if (dirty) await saveDB();
  res.json({ items: list });
});

function parseModerationMinutes(body) {
  const minutes = parseInt(body && body.minutes, 10);
  if (!minutes || minutes < 1) return 60;
  return Math.min(minutes, 60 * 24 * 365); // 1 yildan oshmasin
}

/* Foydalanuvchini ban qilish (kiritilgan vaqtga) */
app.post('/api/admin/users/:username/ban', requireAuth, requireAdmin, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  if (target === req.session.username) return res.status(400).json({ error: "O'zingizni ban qila olmaysiz", code: 'cannotBanSelf' });
  ensureModerationFields(u);
  if (u.isAdmin) return res.status(400).json({ error: "Administratorni ban qila olmaysiz", code: 'cannotBanAdmin' });

  const minutes = parseModerationMinutes(req.body);
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
  const until = new Date(Date.now() + minutes * 60000).toISOString();
  u.moderation.bannedUntil = until;
  u.moderation.banReason = reason;

  addNotification(target, { type: 'ban', until, reason });

  await saveDB();
  res.json({ ok: true, bannedUntil: until });
});

/* Bandan muddatidan avval chiqarish */
app.post('/api/admin/users/:username/unban', requireAuth, requireAdmin, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

  ensureModerationFields(u);
  const wasBanned = !!u.moderation.bannedUntil;
  u.moderation.bannedUntil = null;
  u.moderation.banReason = '';

  if (wasBanned) {
    addNotification(target, { type: 'unban' });
  }

  await saveDB();
  res.json({ ok: true });
});

/* Foydalanuvchini mut qilish (komment/xabar/asar yuklashdan vaqtincha to'xtatish) */
app.post('/api/admin/users/:username/mute', requireAuth, requireAdmin, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });
  if (target === req.session.username) return res.status(400).json({ error: "O'zingizni mut qila olmaysiz", code: 'cannotMuteSelf' });
  ensureModerationFields(u);
  if (u.isAdmin) return res.status(400).json({ error: "Administratorni mut qila olmaysiz", code: 'cannotMuteAdmin' });

  const minutes = parseModerationMinutes(req.body);
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 300);
  const until = new Date(Date.now() + minutes * 60000).toISOString();
  u.moderation.mutedUntil = until;
  u.moderation.muteReason = reason;

  addNotification(target, { type: 'mute', until, reason });

  await saveDB();
  res.json({ ok: true, mutedUntil: until });
});

/* Mutdan muddatidan avval chiqarish */
app.post('/api/admin/users/:username/unmute', requireAuth, requireAdmin, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi', code: 'userNotFound' });

  ensureModerationFields(u);
  const wasMuted = !!u.moderation.mutedUntil;
  u.moderation.mutedUntil = null;
  u.moderation.muteReason = '';

  if (wasMuted) {
    addNotification(target, { type: 'unmute' });
  }

  await saveDB();
  res.json({ ok: true });
});

/* Umumiy statistika (Administrator burchagi uchun) */
app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  ensureReportsArray();
  const usernames = Object.keys(db.users);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let worksCount = 0, likesCount = 0, commentsCount = 0, todayUsers = 0, todayWorks = 0;
  for (const uname of usernames) {
    const joined = new Date(db.users[uname].joined);
    if (joined >= today) todayUsers++;
  }
  for (const uname of Object.keys(db.works)) {
    for (const w of db.works[uname] || []) {
      worksCount++;
      likesCount += Array.isArray(w.likes) ? w.likes.length : 0;
      commentsCount += Array.isArray(w.comments) ? w.comments.length : 0;
      if (new Date(w.createdAt) >= today) todayWorks++;
    }
  }
  res.json({
    usersCount: usernames.length,
    worksCount, likesCount, commentsCount,
    todayUsers, todayWorks,
    openReports: db.reports.filter(r => r.status === 'open').length,
    bannedCount: usernames.filter(u => db.users[u].moderation && db.users[u].moderation.bannedUntil).length,
    mutedCount: usernames.filter(u => db.users[u].moderation && db.users[u].moderation.mutedUntil).length
  });
});

/* Shikoyatlar ro'yxati (Administrator burchagi uchun) */
app.get('/api/admin/reports', requireAuth, requireAdmin, async (req, res) => {
  ensureReportsArray();
  if (purgeResolvedReports()) await saveDB();
  const items = db.reports.slice().reverse().map(r => {
    let targetImage = null;
    let targetExists = true;
    if (r.type === 'work') {
      const found = findWork(r.targetId);
      if (found) targetImage = workImages(found.work)[0] || null;
      else targetExists = false;
    } else if (r.type === 'user') {
      targetExists = !!db.users[r.targetId];
    }
    return Object.assign({}, r, {
      reporterFullname: (db.users[r.reporter] && db.users[r.reporter].fullname) || r.reporter,
      targetImage,
      targetExists
    });
  });
  res.json({ items });
});

/* Shikoyatni ko'rib chiqildi deb belgilash */
app.post('/api/admin/reports/:id/resolve', requireAuth, requireAdmin, async (req, res) => {
  ensureReportsArray();
  const r = db.reports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Shikoyat topilmadi', code: 'reportNotFound' });
  r.status = 'resolved';
  r.resolvedBy = req.session.username;
  r.resolvedAt = new Date().toISOString();
  await saveDB();
  res.json({ ok: true });
});

/* Admin: shikoyat qilingan asarni (suratni) butunlay o'chirish */
app.delete('/api/admin/works/:id', requireAuth, requireAdmin, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi', code: 'workNotFound' });
  const { work, owner } = found;
  db.works[owner] = (db.works[owner] || []).filter(w => w.id !== work.id);
  workImages(work).forEach(img => fs.unlink(path.join(__dirname, img), () => {}));

  ensureReportsArray();
  db.reports.forEach(r => {
    if (r.type === 'work' && r.targetId === work.id && r.status === 'open') {
      r.status = 'resolved';
      r.resolvedBy = req.session.username;
      r.resolvedAt = new Date().toISOString();
      r.action = 'deleted';
    }
  });

  await saveDB();
  res.json({ ok: true });
});

/* ===================== BILDIRISHNOMALAR (ban/mut va h.k.) ===================== */
app.get('/api/notifications', requireAuth, (req, res) => {
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
  res.json({ ok: true });
});

/* SPA fallback — noma'lum yo'llarni ham bosh sahifaga yo'naltiradi */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Madein.net serveri ${PORT}-portda ishga tushdi`);
});
