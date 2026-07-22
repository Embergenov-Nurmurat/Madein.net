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

/* ===================== ADMINISTRATOR REJIMI =====================
   "Administrator rejimi"ni yoqish uchun maxfiy parol talab qilinadi.
   Parolning o'zi kodda saqlanmaydi — faqat uning scrypt xeshi va tuzi
   saqlanadi, shuning uchun manba kodni ko'rgan odam ham parolni
   o'qiy olmaydi.

   MAXFIY PAROL (buni faqat ishonchli administratorlarga bering):
     Cobalt-Cipher-9492!J
*/
const ADMIN_ACTIVATION_SALT = '800b4b8028b86ca583c2ef910de08560';
const ADMIN_ACTIVATION_HASH = '1e99c0d7a0199bcd9602d4f360a6a686bb80233c9fba166a8b73a5a0b6ddfbc24bbc399f6e2d81f899896c1e4eb4b2e66c77270e7fef789f6e93b7a4370f2e7d';

function checkAdminPassword(pw) {
  if (!pw || typeof pw !== 'string') return false;
  try {
    const attempt = crypto.scryptSync(pw, ADMIN_ACTIVATION_SALT, 64);
    const expected = Buffer.from(ADMIN_ACTIVATION_HASH, 'hex');
    if (attempt.length !== expected.length) return false;
    return crypto.timingSafeEqual(attempt, expected);
  } catch (e) {
    return false;
  }
}

/* ===================== BOSS REJIMI =====================
   Administratordan ham yuqori maxsus rol. Faqat allaqachon administrator
   bo'lgan foydalanuvchi, o'zining "Ma'lumotlarni tahrirlash" bo'limidagi
   maxfiy kod maydoniga quyidagi parolni kiritib, Boss rejimini yoqa oladi.
   Parolning o'zi kodda saqlanmaydi — faqat uning scrypt xeshi va tuzi.

   MAXFIY KOD (buni faqat eng ishonchli shaxsga bering):
     Obsidian-Throne-7731!B
*/
const BOSS_ACTIVATION_SALT = 'e4e4a3a67dc7238bb08ff7739ccc255e';
const BOSS_ACTIVATION_HASH = '6b5c948c2514d08081b4a1145658dc23e04860a180bc9c97d00a44f1eaa1846cc21837c410cc228d60c7f57bd5f1ae5c30ac357a50f5eb3a870ffa7486bd0c6d';

function checkBossPassword(pw) {
  if (!pw || typeof pw !== 'string') return false;
  try {
    const attempt = crypto.scryptSync(pw, BOSS_ACTIVATION_SALT, 64);
    const expected = Buffer.from(BOSS_ACTIVATION_HASH, 'hex');
    if (attempt.length !== expected.length) return false;
    return crypto.timingSafeEqual(attempt, expected);
  } catch (e) {
    return false;
  }
}

/* Har bir foydalanuvchida moderatsiya/admin maydonlari mavjudligini ta'minlaydi
   (eski db.json yozuvlari uchun ham) */
function ensureModerationFields(u) {
  if (!u) return;
  if (typeof u.isAdmin !== 'boolean') u.isAdmin = false;
  if (typeof u.isBoss !== 'boolean') u.isBoss = false;
  if (typeof u.adminAccessRevoked !== 'boolean') u.adminAccessRevoked = false;
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
  if (!Array.isArray(u.savedWorks)) u.savedWorks = [];
}

/* db.reports ro'yxati mavjudligini ta'minlaydi (eski db.json fayllar uchun) */
function ensureReportsArray() {
  if (!Array.isArray(db.reports)) db.reports = [];
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
      return res.status(429).json({ error: "Juda ko'p urinish qilindi, birozdan so'ng qayta urinib ko'ring" });
    }
    next();
  };
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
    return cb(new Error('Faqat rasm yoki video (mp4/mov, 10 soniyagacha) fayllari qabul qilinadi'));
  }
});

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
    return res.status(401).json({ error: 'Avval tizimga kiring' });
  }
  const u = db.users[uname];
  ensureModerationFields(u);
  if (refreshModeration(u, uname)) saveDB();
  if (u.moderation.bannedUntil) {
    return res.status(403).json({
      error: 'Hisobingiz vaqtincha bloklangan (ban)',
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
        error: "Siz vaqtincha jimlik jazosidasiz (mut), shuning uchun bu amalni bajara olmaysiz",
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
  if (!u || !(u.isAdmin || u.isBoss)) {
    return res.status(403).json({ error: 'Bu amal uchun administrator huquqi kerak' });
  }
  next();
}

/* Faqat Boss uchun (administratorlarni ishdan bo'shatish/qaytarish va h.k.) */
function requireBoss(req, res, next) {
  const u = db.users[req.session.username];
  if (!u || !u.isBoss) {
    return res.status(403).json({ error: 'Bu amal uchun boss huquqi kerak' });
  }
  next();
}

/* Administrator huquqi bor, lekin Boss shikoyatlar bilan ishlamaydi */
function requireAdminNotBoss(req, res, next) {
  const u = db.users[req.session.username];
  if (!u || !(u.isAdmin || u.isBoss)) {
    return res.status(403).json({ error: 'Bu amal uchun administrator huquqi kerak' });
  }
  if (u.isBoss) {
    return res.status(403).json({ error: 'Boss shikoyatlar bilan ishlamaydi' });
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
    joined: u.joined,
    theme: u.theme || null,
    isAdmin: !!u.isAdmin,
    isBoss: !!u.isBoss,
    adminAccessRevoked: !!u.adminAccessRevoked,
    isOnline: isUserOnline(uname),
    followingCount: (u.following || []).length,
    followersCount: countFollowers(uname),
    savedCount: (u.savedWorks || []).length,
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

    if (!uname || !/^[a-z0-9_]{3,32}$/.test(uname)) {
      return res.status(400).json({ error: "Foydalanuvchi nomi 3-32 belgi, faqat lotin harflari/raqam/pastki chiziq bo'lishi kerak" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 belgidan iborat bo'lishi kerak" });
    }
    if (db.users[uname]) {
      return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon band' });
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
      savedWorks: []
    };
    db.works[uname] = [];
    await saveDB();

    req.session.username = uname;
    res.json({ user: publicUser(uname) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ro'yxatdan o'tishda server xatoligi" });
  }
});

app.post('/api/login', rateLimit('login', 15, 10 * 60 * 1000), async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const uname = String(username || '').trim().toLowerCase();
    const u = db.users[uname];
    const ok = u && await bcrypt.compare(String(password || ''), u.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Foydalanuvchi nomi yoki parol noto'g'ri" });
    }

    ensureModerationFields(u);
    if (refreshModeration(u, uname)) await saveDB();
    if (u.moderation.bannedUntil) {
      return res.status(403).json({
        error: 'Hisobingiz vaqtincha bloklangan (ban)',
        banned: true,
        until: u.moderation.bannedUntil,
        reason: u.moderation.banReason || ''
      });
    }

    req.session.username = uname;
    res.json({ user: publicUser(uname) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Kirishda server xatoligi' });
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
  const { fullname, email, bio, phone, social, privacy } = req.body || {};
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
  await saveDB();
  res.json({ user: publicUser(req.session.username) });
});

/* Profil rasmini (avatar) yuklash */
app.post('/api/profile/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Rasm talab qilinadi' });

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
  if (!db.users[uname]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

  const viewer = req.session && req.session.username;
  const profile = publicProfile(uname, viewer);

  const works = (db.works[uname] || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(w => ({
      id: w.id,
      title: w.title,
      type: w.type,
      status: w.status,
      price: w.price,
      currency: w.currency || 'UZS',
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
  if (target === me) return res.status(400).json({ error: "O'zingizga obuna bo'la olmaysiz" });
  if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

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
  if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  const items = Object.keys(db.users)
    .filter(uname => Array.isArray(db.users[uname].following) && db.users[uname].following.includes(target))
    .map(uname => ({ username: uname, fullname: db.users[uname].fullname || uname, avatar: db.users[uname].avatar || null }));
  res.json({ items });
});

app.get('/api/users/:username/following', (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  ensureModerationFields(u);
  const items = (u.following || [])
    .filter(uname => db.users[uname])
    .map(uname => ({ username: uname, fullname: db.users[uname].fullname || uname, avatar: db.users[uname].avatar || null }));
  res.json({ items });
});

/* ===================== SAQLANGANLAR (BOOKMARK) ===================== */
app.post('/api/works/:id/save', requireAuth, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  const idx = u.savedWorks.indexOf(req.params.id);
  let saved;
  if (idx === -1) { u.savedWorks.push(req.params.id); saved = true; }
  else { u.savedWorks.splice(idx, 1); saved = false; }
  await saveDB();
  res.json({ saved });
});

app.get('/api/saved', requireAuth, (req, res) => {
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  const me = req.session.username;
  const items = [];
  for (const id of u.savedWorks) {
    const found = findWork(id);
    if (!found) continue;
    const { work, owner } = found;
    const ownerUser = db.users[owner];
    if (!ownerUser) continue;
    const likes = Array.isArray(work.likes) ? work.likes : [];
    items.push({
      id: work.id,
      title: work.title,
      type: work.type,
      status: work.status,
      price: work.price,
      currency: work.currency || 'UZS',
      desc: work.desc,
      images: workImages(work),
      thumbs: workThumbs(work),
      video: work.video || null,
      poster: work.poster || null,
      mediaType: work.mediaType || (work.video ? 'video' : 'image'),
      createdAt: work.createdAt,
      username: owner,
      fullname: ownerUser.fullname || owner,
      avatar: ownerUser.avatar || null,
      likesCount: likes.length,
      likedByMe: likes.includes(me),
      commentsCount: Array.isArray(work.comments) ? work.comments.length : 0,
      savedByMe: true,
      isFollowing: !!(u && Array.isArray(u.following) && u.following.includes(owner))
    });
  }
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ items });
});

/* ===================== SHIKOYATLAR (REPORT) ===================== */
app.post('/api/works/:id/report', requireAuth, rateLimit('report', 15, 10 * 60 * 1000), async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
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
  if (!db.users[target]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
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
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Kamida bitta rasm yoki video talab qilinadi' });

    const { title, type, status, price, currency, desc } = req.body || {};
    const isSale = status === 'sale';
    const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];

    const videoFile = req.files.find(f => ALLOWED_VIDEO_MIMES.includes(f.mimetype));
    const imageFiles = req.files.filter(f => f.mimetype.startsWith('image/'));

    // Yordamchi: yuklangan fayllarni diskdan o'chirib, xatolik qaytaradi
    function rejectWithCleanup(status, message) {
      req.files.forEach(f => fs.unlink(f.path, () => {}));
      return res.status(status).json({ error: message });
    }

    if (videoFile) {
      if (req.files.length > 1) {
        return rejectWithCleanup(400, "Video bilan birga boshqa fayl yuklab bo'lmaydi — faqat bitta video tanlang");
      }
      const durationSec = getMp4DurationSeconds(videoFile.path);
      if (durationSec !== null && durationSec > MAX_VIDEO_SECONDS) {
        return rejectWithCleanup(400, 'Video 10 soniyadan uzun bo\'lmasligi kerak');
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
        return rejectWithCleanup(400, "Videoni qayta ishlashda xatolik yuz berdi. Boshqa video tanlab ko'ring.");
      }

      // Asl yuklangan fayl endi kerak emas — qayta kodlangan nusxa saqlanadi
      fs.unlink(videoFile.path, () => {});

      const work = {
        id: 'w' + Date.now() + crypto.randomBytes(4).toString('hex'),
        title: String(title || '').slice(0, 200),
        type: ['rasm', 'haykal', 'mulaj', 'boshqa'].includes(type) ? type : 'boshqa',
        status: isSale ? 'sale' : 'expo',
        price: isSale ? (Number(price) || 0) : 0,
        currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
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

    if (!imageFiles.length) return rejectWithCleanup(400, 'Kamida bitta rasm yoki video talab qilinadi');

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
      type: ['rasm', 'haykal', 'mulaj', 'boshqa'].includes(type) ? type : 'boshqa',
      status: isSale ? 'sale' : 'expo',
      price: isSale ? (Number(price) || 0) : 0,
      currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
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
        status: w.status,
        price: w.price,
        currency: w.currency || 'UZS',
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
        savedByMe: !!(meUser && Array.isArray(meUser.savedWorks) && meUser.savedWorks.includes(w.id)),
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
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
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
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
  const { work } = found;
  work.views = (Number(work.views) || 0) + 1;
  await saveDB();
  res.json({ viewsCount: work.views });
});

/* ===================== KOMENTLAR ===================== */
app.get('/api/works/:id/comments', (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
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
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
  const { work } = found;

  const text = String((req.body && req.body.text) || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'Koment matni bo\'sh bo\'lishi mumkin emas' });

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
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
  const { work } = found;
  if (!Array.isArray(work.comments)) work.comments = [];

  const me = req.session.username;
  const idx = work.comments.findIndex(c => c.id === req.params.commentId);
  if (idx === -1) return res.status(404).json({ error: 'Koment topilmadi' });

  const comment = work.comments[idx];
  const isOwner = comment.username === me;
  const isWorkOwner = found.owner === me;
  if (!isOwner && !isWorkOwner) {
    return res.status(403).json({ error: "Bu komentni o'chirishga ruxsatingiz yo'q" });
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

/* Barcha suhbatlarim ro'yxati (oxirgi xabar va o'qilmagan soni bilan) */
app.get('/api/conversations', requireAuth, (req, res) => {
  const me = req.session.username;
  const items = Object.values(db.messages)
    .filter(c => c.participants.includes(me))
    .map(c => {
      const other = c.participants.find(p => p !== me) || me;
      const u = db.users[other];
      const last = c.messages[c.messages.length - 1] || null;
      return {
        username: other,
        fullname: (u && u.fullname) || other,
        avatar: (u && u.avatar) || null,
        lastMessage: last ? last.text : '',
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
  if (!db.users[other]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (other === me) return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz" });

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
  if (!db.users[other]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (other === me) return res.status(400).json({ error: "O'zingizga xabar yubora olmaysiz" });

  const text = String((req.body && req.body.text) || '').trim().slice(0, 1000);
  if (!text) return res.status(400).json({ error: "Xabar matni bo'sh bo'lishi mumkin emas" });

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

/* ===================== ADMINISTRATOR REJIMI ROUTES ===================== */

/* Maxfiy parol bilan admin rejimini shu foydalanuvchi uchun yoqadi */
app.post('/api/admin/activate', requireAuth, async (req, res) => {
  const u = db.users[req.session.username];
  ensureModerationFields(u);
  if (u.adminAccessRevoked) {
    return res.status(403).json({ error: "Administrator huquqingiz boss tomonidan bekor qilingan. Faqat boss ruxsati bilan qaytadan faollashtira olasiz" });
  }
  const { password } = req.body || {};
  if (!checkAdminPassword(password)) {
    return res.status(403).json({ error: "Maxfiy parol noto'g'ri" });
  }
  u.isAdmin = true;
  await saveDB();
  res.json({ user: publicUser(req.session.username) });
});

/* Boss rejimini yoqish — faqat allaqachon administrator bo'lganlar,
   maxfiy kod orqali (Profil > Ma'lumotlarni tahrirlash bo'limida) */
app.post('/api/admin/boss/activate', requireAuth, requireAdmin, async (req, res) => {
  const { code } = req.body || {};
  if (!checkBossPassword(code)) {
    return res.status(403).json({ error: "Maxfiy kod noto'g'ri" });
  }
  const u = db.users[req.session.username];
  u.isAdmin = true;
  u.isBoss = true;
  await saveDB();
  res.json({ user: publicUser(req.session.username) });
});

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
      isBoss: !!u.isBoss,
      adminAccessRevoked: !!u.adminAccessRevoked,
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
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (target === req.session.username) return res.status(400).json({ error: "O'zingizni ban qila olmaysiz" });
  ensureModerationFields(u);
  const actor = db.users[req.session.username];
  if (u.isBoss) return res.status(400).json({ error: "Boss'ni ban qila olmaysiz" });
  if (u.isAdmin && !(actor && actor.isBoss)) return res.status(400).json({ error: "Boshqa administratorni ban qila olmaysiz" });

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
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

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
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (target === req.session.username) return res.status(400).json({ error: "O'zingizni mut qila olmaysiz" });
  ensureModerationFields(u);
  const actor = db.users[req.session.username];
  if (u.isBoss) return res.status(400).json({ error: "Boss'ni mut qila olmaysiz" });
  if (u.isAdmin && !(actor && actor.isBoss)) return res.status(400).json({ error: "Boshqa administratorni mut qila olmaysiz" });

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
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

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

/* Boss: administratorni ishdan bo'shatish — u oddiy foydalanuvchi bo'lib qoladi
   va Boss ruxsat bermaguncha administrator parolini qayta kirita olmaydi */
app.post('/api/admin/users/:username/fire', requireAuth, requireBoss, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (target === req.session.username) return res.status(400).json({ error: "O'zingizni ishdan bo'shata olmaysiz" });
  ensureModerationFields(u);
  if (u.isBoss) return res.status(400).json({ error: "Boss'ni ishdan bo'shata olmaysiz" });
  if (!u.isAdmin) return res.status(400).json({ error: 'Bu foydalanuvchi administrator emas' });

  u.isAdmin = false;
  u.adminAccessRevoked = true;
  addNotification(target, { type: 'admin-fired' });

  await saveDB();
  res.json({ ok: true });
});

/* Boss: oddiy foydalanuvchini to'g'ridan-to'g'ri administrator qiladi
   (maxfiy parolsiz — boss uni bevosita admin rejimiga o'tkazadi) */
app.post('/api/admin/users/:username/promote', requireAuth, requireBoss, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (target === req.session.username) return res.status(400).json({ error: "O'zingizni admin qila olmaysiz" });
  ensureModerationFields(u);
  if (u.isBoss) return res.status(400).json({ error: "Bu foydalanuvchi allaqachon Boss" });
  if (u.isAdmin) return res.status(400).json({ error: 'Bu foydalanuvchi allaqachon administrator' });

  u.isAdmin = true;
  u.adminAccessRevoked = false;
  addNotification(target, { type: 'admin-promoted' });

  await saveDB();
  res.json({ ok: true, user: publicUser(target) });
});

/* Boss: ilgari ishdan bo'shatilgan administratorga qayta administrator
   parolini kiritish (faollashtirish) imkonini beradi */
app.post('/api/admin/users/:username/rehire', requireAuth, requireBoss, async (req, res) => {
  const target = String(req.params.username || '').trim().toLowerCase();
  const u = db.users[target];
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  ensureModerationFields(u);
  if (!u.adminAccessRevoked) return res.status(400).json({ error: "Bu foydalanuvchi ishdan bo'shatilmagan" });

  u.adminAccessRevoked = false;
  addNotification(target, { type: 'admin-rehired' });

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
app.get('/api/admin/reports', requireAuth, requireAdminNotBoss, async (req, res) => {
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
app.post('/api/admin/reports/:id/resolve', requireAuth, requireAdminNotBoss, async (req, res) => {
  ensureReportsArray();
  const r = db.reports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Shikoyat topilmadi' });
  r.status = 'resolved';
  r.resolvedBy = req.session.username;
  r.resolvedAt = new Date().toISOString();
  await saveDB();
  res.json({ ok: true });
});

/* Admin: shikoyat qilingan asarni (suratni) butunlay o'chirish */
app.delete('/api/admin/works/:id', requireAuth, requireAdminNotBoss, async (req, res) => {
  const found = findWork(req.params.id);
  if (!found) return res.status(404).json({ error: 'Asar topilmadi' });
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

/* ===================== X VA O — ONLAYN O'YIN =====================
   WebSocket kutubxonasisiz, oddiy so'rov (polling) orqali ishlaydi —
   xuddi yuqoridagi xabarlar (messages) tizimi kabi. Faol o'yinlar va
   navbat xotirada saqlanadi (fayl-bazaga yozilmaydi), chunki ular
   davomiy ma'lumot emas — server qayta ishga tushsa, faol o'yinlar
   shunchaki tozalanadi va foydalanuvchilar qayta raqib qidira oladi. */

const tttQueue = []; // [{ username, joinedAt }]
const tttGames = new Map(); // gameId -> game
const tttUserGame = new Map(); // username -> gameId
const TTT_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const TTT_TURN_TIMEOUT_MS = 45 * 1000;      // shu vaqt ichida yurmasa, raqib g'olib deb topiladi
const TTT_QUEUE_STALE_MS = 30 * 1000;       // navbatda shuncha vaqtdan beri "ko'rinmagan" so'rov o'chiriladi
const TTT_GAME_IDLE_MS = 10 * 60 * 1000;    // shuncha vaqt hech kim so'rov yubormasa, o'yin xotiradan tozalanadi

function tttCheckResult(board) {
  for (const line of TTT_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  if (board.every(c => c)) return { winner: 'draw', line: null };
  return null;
}

function tttPublicUser(uname) {
  const u = db.users[uname];
  return { username: uname, fullname: (u && u.fullname) || uname, avatar: (u && u.avatar) || null };
}

function tttCleanupQueue() {
  const now = Date.now();
  for (let i = tttQueue.length - 1; i >= 0; i--) {
    if (now - tttQueue[i].joinedAt > TTT_QUEUE_STALE_MS) tttQueue.splice(i, 1);
  }
}

function tttTouch(game, uname) {
  game.lastSeen[uname] = Date.now();
}

function tttForfeitTo(game, winnerUname, reason) {
  game.status = 'finished';
  game.winner = game.marks[winnerUname];
  game.winLine = null;
  game.endReason = reason;
  game.updatedAt = new Date().toISOString();
}

/* Uzoq vaqt yurmagan/so'rov yubormagan o'yinchi bo'lsa, raqibga g'alaba beriladi */
function tttCheckTimeout(game) {
  if (game.status !== 'playing') return;
  const now = Date.now();
  const players = [game.players.X, game.players.O];
  for (const uname of players) {
    const seen = game.lastSeen[uname] || game.createdAt;
    if (now - seen > TTT_TURN_TIMEOUT_MS) {
      const other = players.find(p => p !== uname);
      tttForfeitTo(game, other, 'timeout');
      return;
    }
  }
}

function tttFreeUsers(game) {
  if (tttUserGame.get(game.players.X) === game.id) tttUserGame.delete(game.players.X);
  if (tttUserGame.get(game.players.O) === game.id) tttUserGame.delete(game.players.O);
}

function tttGameView(game, me) {
  return {
    id: game.id,
    board: game.board,
    turn: game.turn,
    status: game.status,
    winner: game.winner,
    winLine: game.winLine,
    endReason: game.endReason || null,
    you: game.marks[me],
    players: { X: tttPublicUser(game.players.X), O: tttPublicUser(game.players.O) },
    rematch: {
      you: !!game.rematchWanted[me],
      opponent: !!game.rematchWanted[game.players.X === me ? game.players.O : game.players.X]
    }
  };
}

/* Navbatga qo'shiladi; navbatda kutayotgan boshqa foydalanuvchi bo'lsa,
   ikkalasi darhol bir o'yinga bog'lanadi */
app.post('/api/games/tictactoe/queue/join', requireAuth, (req, res) => {
  const me = req.session.username;
  if (tttUserGame.has(me)) return res.json({ status: 'matched', gameId: tttUserGame.get(me) });

  tttCleanupQueue();
  if (tttQueue.some(q => q.username === me)) return res.json({ status: 'waiting' });

  const opponent = tttQueue.find(q => q.username !== me);
  if (opponent) {
    tttQueue.splice(tttQueue.indexOf(opponent), 1);
    const id = 'ttt' + Date.now() + crypto.randomBytes(4).toString('hex');
    const meFirst = Math.random() < 0.5;
    const game = {
      id,
      players: { X: meFirst ? me : opponent.username, O: meFirst ? opponent.username : me },
      marks: {},
      board: Array(9).fill(null),
      turn: 'X',
      status: 'playing',
      winner: null,
      winLine: null,
      endReason: null,
      rematchWanted: {},
      lastSeen: {},
      createdAt: Date.now(),
      updatedAt: new Date().toISOString()
    };
    game.marks[game.players.X] = 'X';
    game.marks[game.players.O] = 'O';
    tttTouch(game, me);
    tttTouch(game, opponent.username);
    tttGames.set(id, game);
    tttUserGame.set(me, id);
    tttUserGame.set(opponent.username, id);
    return res.json({ status: 'matched', gameId: id });
  }

  tttQueue.push({ username: me, joinedAt: Date.now() });
  res.json({ status: 'waiting' });
});

app.post('/api/games/tictactoe/queue/leave', requireAuth, (req, res) => {
  const me = req.session.username;
  const idx = tttQueue.findIndex(q => q.username === me);
  if (idx !== -1) tttQueue.splice(idx, 1);
  res.json({ ok: true });
});

app.get('/api/games/tictactoe/queue/status', requireAuth, (req, res) => {
  const me = req.session.username;
  if (tttUserGame.has(me)) return res.json({ status: 'matched', gameId: tttUserGame.get(me) });
  tttCleanupQueue();
  res.json({ status: tttQueue.some(q => q.username === me) ? 'waiting' : 'idle' });
});

app.get('/api/games/tictactoe/:id', requireAuth, (req, res) => {
  const me = req.session.username;
  const game = tttGames.get(req.params.id);
  if (!game || !game.marks[me]) return res.status(404).json({ error: "O'yin topilmadi" });
  tttTouch(game, me);
  tttCheckTimeout(game);
  res.json(tttGameView(game, me));
});

app.post('/api/games/tictactoe/:id/move', requireAuth, (req, res) => {
  const me = req.session.username;
  const game = tttGames.get(req.params.id);
  if (!game || !game.marks[me]) return res.status(404).json({ error: "O'yin topilmadi" });
  tttTouch(game, me);
  tttCheckTimeout(game);
  if (game.status !== 'playing') return res.status(400).json({ error: "O'yin allaqachon tugagan" });

  const myMark = game.marks[me];
  if (game.turn !== myMark) return res.status(400).json({ error: 'Hozir sizning navbatingiz emas' });

  const index = Number(req.body && req.body.index);
  if (!Number.isInteger(index) || index < 0 || index > 8) return res.status(400).json({ error: "Noto'g'ri katak raqami" });
  if (game.board[index]) return res.status(400).json({ error: 'Bu katak allaqachon band' });

  game.board[index] = myMark;
  const result = tttCheckResult(game.board);
  if (result) {
    game.status = 'finished';
    game.winner = result.winner;
    game.winLine = result.winner === 'draw' ? null : result.line;
  } else {
    game.turn = myMark === 'X' ? 'O' : 'X';
  }
  game.updatedAt = new Date().toISOString();
  res.json(tttGameView(game, me));
});

app.post('/api/games/tictactoe/:id/rematch', requireAuth, (req, res) => {
  const me = req.session.username;
  const game = tttGames.get(req.params.id);
  if (!game || !game.marks[me]) return res.status(404).json({ error: "O'yin topilmadi" });
  if (game.status !== 'finished') return res.status(400).json({ error: "O'yin hali tugamagan" });

  game.rematchWanted[me] = true;
  tttTouch(game, me);
  const other = game.players.X === me ? game.players.O : game.players.X;

  if (game.rematchWanted[me] && game.rematchWanted[other]) {
    const prevX = game.players.X, prevO = game.players.O;
    game.players.X = prevO; // navbatdagi o'yinda X/O almashadi
    game.players.O = prevX;
    game.marks = {};
    game.marks[game.players.X] = 'X';
    game.marks[game.players.O] = 'O';
    game.board = Array(9).fill(null);
    game.turn = 'X';
    game.status = 'playing';
    game.winner = null;
    game.winLine = null;
    game.endReason = null;
    game.rematchWanted = {};
  }
  game.updatedAt = new Date().toISOString();
  res.json(tttGameView(game, me));
});

app.post('/api/games/tictactoe/:id/leave', requireAuth, (req, res) => {
  const me = req.session.username;
  const game = tttGames.get(req.params.id);
  if (!game || !game.marks[me]) return res.json({ ok: true });

  if (game.status === 'playing') {
    const other = game.players.X === me ? game.players.O : game.players.X;
    tttForfeitTo(game, other, 'left');
  }
  tttFreeUsers(game);
  res.json({ ok: true });
});

/* Faol bo'lmagan (uzoq vaqt so'rov kelmagan) o'yinlarni xotiradan tozalab turadi */
setInterval(() => {
  const now = Date.now();
  for (const [id, game] of tttGames) {
    tttCheckTimeout(game);
    const seenTimes = Object.values(game.lastSeen);
    const lastActivity = seenTimes.length ? Math.max(...seenTimes) : game.createdAt;
    if (now - lastActivity > TTT_GAME_IDLE_MS) {
      tttFreeUsers(game);
      tttGames.delete(id);
    }
  }
}, 60 * 1000).unref();

/* ===================== SHAXMAT VA SHASHKA — ONLAYN O'YIN =====================
   Frontendning "do'st bilan / bot" rejimlaridagi soddalashtirilgan qoidalar bilan
   bir xil mantiq (rokirovka/en-passant yo'q, piyoda avtomatik ferzga aylanadi,
   shohni "yeb qo'yish" g'alaba hisoblanadi) — faqat bu safar server tomonda,
   XvaO kabi xotirada saqlanadi va so'rov (polling) orqali ishlaydi. */

function chessInBoundsSrv(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function chessPieceMovesSrv(r, c, board) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0], type = p[1];
  const moves = [];
  const dir = color === 'w' ? -1 : 1;
  function trySlide(rr, cc) {
    if (!chessInBoundsSrv(rr, cc)) return false;
    const target = board[rr][cc];
    if (!target) { moves.push([rr, cc]); return true; }
    if (target[0] !== color) moves.push([rr, cc]);
    return false;
  }
  if (type === 'p') {
    if (chessInBoundsSrv(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      const startRow = color === 'w' ? 6 : 1;
      if (r === startRow && !board[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
    }
    [c - 1, c + 1].forEach(cc => {
      if (chessInBoundsSrv(r + dir, cc) && board[r + dir][cc] && board[r + dir][cc][0] !== color) moves.push([r + dir, cc]);
    });
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      const rr = r + dr, cc = c + dc;
      if (chessInBoundsSrv(rr, cc) && (!board[rr][cc] || board[rr][cc][0] !== color)) moves.push([rr, cc]);
    });
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr, cc = c + dc;
      if (chessInBoundsSrv(rr, cc) && (!board[rr][cc] || board[rr][cc][0] !== color)) moves.push([rr, cc]);
    }
  } else {
    let dirs = [];
    if (type === 'r') dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    if (type === 'b') dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    if (type === 'q') dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    dirs.forEach(([dr, dc]) => {
      let rr = r + dr, cc = c + dc;
      while (chessInBoundsSrv(rr, cc)) {
        if (!trySlide(rr, cc)) break;
        rr += dr; cc += dc;
      }
    });
  }
  return moves;
}

function chessGenerateAllMovesSrv(col, board) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p[0] !== col) continue;
    chessPieceMovesSrv(r, c, board).forEach(([tr, tc]) => out.push({ from: [r, c], to: [tr, tc] }));
  }
  return out;
}

function chessInitBoardSrv() {
  const back = ['r','n','b','q','k','b','n','r'];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = 'b' + back[c];
    board[1][c] = 'bp';
    board[6][c] = 'wp';
    board[7][c] = 'w' + back[c];
  }
  return board;
}

function checkersInBoundsSrv(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function checkersIsKingSrv(p) { return p && p.length === 2; }

function checkersPieceCapturesSrv(r, c, board) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0];
  const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const out = [];
  dirs.forEach(([dr, dc]) => {
    const mr = r + dr, mc = c + dc, jr = r + 2 * dr, jc = c + 2 * dc;
    if (!checkersInBoundsSrv(jr, jc)) return;
    const mid = board[mr] ? board[mr][mc] : null;
    if (mid && mid[0] !== color && !board[jr][jc]) out.push({ to: [jr, jc], captured: [mr, mc] });
  });
  return out;
}

function checkersPieceSimpleMovesSrv(r, c, board) {
  const p = board[r][c];
  if (!p) return [];
  const dirs = checkersIsKingSrv(p) ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (p[0] === 'w' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
  const out = [];
  dirs.forEach(([dr, dc]) => {
    const rr = r + dr, cc = c + dc;
    if (checkersInBoundsSrv(rr, cc) && !board[rr][cc]) out.push({ to: [rr, cc] });
  });
  return out;
}

function checkersAllCapturesForSrv(color, board) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p[0] !== color) continue;
    checkersPieceCapturesSrv(r, c, board).forEach(mv => out.push({ from: [r, c], to: mv.to, captured: mv.captured }));
  }
  return out;
}

function checkersAllSimpleMovesForSrv(color, board) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p[0] !== color) continue;
    checkersPieceSimpleMovesSrv(r, c, board).forEach(mv => out.push({ from: [r, c], to: mv.to }));
  }
  return out;
}

function checkersLegalMovesForPieceSrv(r, c, board) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0];
  const captures = checkersAllCapturesForSrv(color, board);
  if (captures.length > 0) return checkersPieceCapturesSrv(r, c, board).map(mv => ({ to: mv.to, captured: mv.captured, isCapture: true }));
  return checkersPieceSimpleMovesSrv(r, c, board).map(mv => ({ to: mv.to, isCapture: false }));
}

function checkersPlayerHasAnyMoveSrv(color, board) {
  if (checkersAllCapturesForSrv(color, board).length > 0) return true;
  return checkersAllSimpleMovesForSrv(color, board).length > 0;
}

function checkersInitBoardSrv() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) board[r][c] = 'b';
  for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) board[r][c] = 'w';
  return board;
}

/* ---- Ikkala o'yin (shaxmat/shashka) uchun umumiy: navbat, taklif, tayoq (queue), taslim, durang ---- */
const BOARD_GAME_TYPES = ['chess', 'checkers'];
const boardGames = {};       // type -> Map(gameId -> game)
const boardUserGame = {};    // type -> Map(username -> gameId)
const boardQueue = {};       // type -> [{ username, joinedAt }]
BOARD_GAME_TYPES.forEach(t => { boardGames[t] = new Map(); boardUserGame[t] = new Map(); boardQueue[t] = []; });

const BOARD_TURN_TIMEOUT_MS = 5 * 60 * 1000;   // shu vaqt ichida yurmasa, raqib g'olib deb topiladi
const BOARD_QUEUE_STALE_MS = 30 * 1000;
const BOARD_GAME_IDLE_MS = 20 * 60 * 1000;

function boardPublicUser(uname) {
  const u = db.users[uname];
  return { username: uname, fullname: (u && u.fullname) || uname, avatar: (u && u.avatar) || null };
}

function boardTouch(game, uname) { game.lastSeen[uname] = Date.now(); }

function boardForfeitTo(game, winnerUname, reason) {
  game.status = 'finished';
  game.winner = game.players.w === winnerUname ? 'w' : 'b';
  game.endReason = reason;
  game.updatedAt = new Date().toISOString();
}

function boardCheckTimeout(game) {
  if (game.status !== 'playing') return;
  const now = Date.now();
  const players = [game.players.w, game.players.b];
  for (const uname of players) {
    const seen = game.lastSeen[uname] || game.createdAt;
    if (now - seen > BOARD_TURN_TIMEOUT_MS) {
      const other = players.find(p => p !== uname);
      boardForfeitTo(game, other, 'timeout');
      return;
    }
  }
}

function boardFreeUsers(type, game) {
  if (boardUserGame[type].get(game.players.w) === game.id) boardUserGame[type].delete(game.players.w);
  if (boardUserGame[type].get(game.players.b) === game.id) boardUserGame[type].delete(game.players.b);
}

function boardGameView(game, me) {
  const myColor = game.players.w === me ? 'w' : 'b';
  const oppColor = myColor === 'w' ? 'b' : 'w';
  return {
    id: game.id,
    board: game.board,
    turn: game.turn,
    status: game.status,
    winner: game.winner || null,
    endReason: game.endReason || null,
    you: myColor,
    forcedPiece: game.forcedPiece || null,
    players: { w: boardPublicUser(game.players.w), b: boardPublicUser(game.players.b) },
    drawOffer: { you: !!game.drawOffered[myColor], opponent: !!game.drawOffered[oppColor] },
    rematch: { you: !!game.rematchWanted[me], opponent: !!game.rematchWanted[game.players.w === me ? game.players.b : game.players.w] }
  };
}

function boardNewGame(type, id, unameW, unameB) {
  return {
    id, type,
    players: { w: unameW, b: unameB },
    board: type === 'chess' ? chessInitBoardSrv() : checkersInitBoardSrv(),
    turn: 'w',
    status: 'playing',
    winner: null,
    endReason: null,
    drawOffered: {},
    forcedPiece: null,
    rematchWanted: {},
    lastSeen: {},
    createdAt: Date.now(),
    updatedAt: new Date().toISOString()
  };
}

function boardStartGame(type, unameA, unameB) {
  const id = type.slice(0, 2) + Date.now() + crypto.randomBytes(4).toString('hex');
  const aFirst = Math.random() < 0.5;
  const game = boardNewGame(type, id, aFirst ? unameA : unameB, aFirst ? unameB : unameA);
  boardTouch(game, unameA);
  boardTouch(game, unameB);
  boardGames[type].set(id, game);
  boardUserGame[type].set(unameA, id);
  boardUserGame[type].set(unameB, id);
  return id;
}

BOARD_GAME_TYPES.forEach(type => {
  app.post(`/api/games/${type}/queue/join`, requireAuth, (req, res) => {
    const me = req.session.username;
    if (boardUserGame[type].has(me)) return res.json({ status: 'matched', gameId: boardUserGame[type].get(me) });
    const queue = boardQueue[type];
    const now = Date.now();
    for (let i = queue.length - 1; i >= 0; i--) if (now - queue[i].joinedAt > BOARD_QUEUE_STALE_MS) queue.splice(i, 1);
    if (queue.some(q => q.username === me)) return res.json({ status: 'waiting' });
    const opponent = queue.find(q => q.username !== me);
    if (opponent) {
      queue.splice(queue.indexOf(opponent), 1);
      const gameId = boardStartGame(type, me, opponent.username);
      return res.json({ status: 'matched', gameId });
    }
    queue.push({ username: me, joinedAt: now });
    res.json({ status: 'waiting' });
  });

  app.post(`/api/games/${type}/queue/leave`, requireAuth, (req, res) => {
    const me = req.session.username;
    const idx = boardQueue[type].findIndex(q => q.username === me);
    if (idx !== -1) boardQueue[type].splice(idx, 1);
    res.json({ ok: true });
  });

  app.get(`/api/games/${type}/queue/status`, requireAuth, (req, res) => {
    const me = req.session.username;
    if (boardUserGame[type].has(me)) return res.json({ status: 'matched', gameId: boardUserGame[type].get(me) });
    res.json({ status: boardQueue[type].some(q => q.username === me) ? 'waiting' : 'idle' });
  });

  app.get(`/api/games/${type}/:id`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.status(404).json({ error: "O'yin topilmadi" });
    boardTouch(game, me);
    boardCheckTimeout(game);
    res.json(boardGameView(game, me));
  });

  app.post(`/api/games/${type}/:id/move`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.status(404).json({ error: "O'yin topilmadi" });
    boardTouch(game, me);
    boardCheckTimeout(game);
    if (game.status !== 'playing') return res.status(400).json({ error: "O'yin allaqachon tugagan" });

    const myColor = game.players.w === me ? 'w' : 'b';
    if (game.turn !== myColor) return res.status(400).json({ error: 'Hozir sizning navbatingiz emas' });

    const from = req.body && req.body.from, to = req.body && req.body.to;
    if (!Array.isArray(from) || !Array.isArray(to) || from.length !== 2 || to.length !== 2) {
      return res.status(400).json({ error: "Noto'g'ri yurish formati" });
    }
    const [fr, fc] = from.map(Number), [tr, tc] = to.map(Number);
    if (![fr, fc, tr, tc].every(n => Number.isInteger(n) && n >= 0 && n < 8)) {
      return res.status(400).json({ error: "Noto'g'ri katak raqami" });
    }
    const moving = game.board[fr][fc];
    if (!moving || moving[0] !== myColor) return res.status(400).json({ error: "Bu sizning donangiz emas" });
    if (type === 'checkers' && game.forcedPiece && (game.forcedPiece[0] !== fr || game.forcedPiece[1] !== fc)) {
      return res.status(400).json({ error: "Zanjirli yeyishni shu dona bilan davom ettirishingiz kerak" });
    }

    if (type === 'chess') {
      const legal = chessPieceMovesSrv(fr, fc, game.board).some(([r, c]) => r === tr && c === tc);
      if (!legal) return res.status(400).json({ error: "Bu yurish qoida bo'yicha mumkin emas" });
      const capturedPiece = game.board[tr][tc];
      game.board[tr][tc] = moving;
      game.board[fr][fc] = null;
      if (moving[1] === 'p' && (tr === 0 || tr === 7)) game.board[tr][tc] = moving[0] + 'q';
      if (capturedPiece && capturedPiece[1] === 'k') {
        game.status = 'finished';
        game.winner = myColor;
        game.endReason = 'king-captured';
      } else {
        const nextColor = myColor === 'w' ? 'b' : 'w';
        if (chessGenerateAllMovesSrv(nextColor, game.board).length === 0) {
          game.status = 'finished';
          game.winner = myColor;
          game.endReason = 'no-moves';
        } else {
          game.turn = nextColor;
        }
      }
      game.drawOffered = {};
    } else {
      const moveInfo = checkersLegalMovesForPieceSrv(fr, fc, game.board).find(m => m.to[0] === tr && m.to[1] === tc);
      if (!moveInfo) return res.status(400).json({ error: "Bu yurish qoida bo'yicha mumkin emas" });
      game.board[tr][tc] = moving;
      game.board[fr][fc] = null;
      let becameKing = false;
      if (!checkersIsKingSrv(moving)) {
        if ((moving[0] === 'w' && tr === 0) || (moving[0] === 'b' && tr === 7)) { game.board[tr][tc] = moving[0] + 'k'; becameKing = true; }
      }
      let didCapture = false;
      if (moveInfo.captured) {
        const [mr, mc] = moveInfo.captured;
        game.board[mr][mc] = null;
        didCapture = true;
      }
      let mustContinue = false;
      if (didCapture && !becameKing && checkersPieceCapturesSrv(tr, tc, game.board).length > 0) mustContinue = true;

      if (mustContinue) {
        game.forcedPiece = [tr, tc];
      } else {
        game.forcedPiece = null;
        const nextColor = myColor === 'w' ? 'b' : 'w';
        const oppHasPieces = game.board.some(row => row.some(p => p && p[0] === nextColor));
        if (!oppHasPieces || !checkersPlayerHasAnyMoveSrv(nextColor, game.board)) {
          game.status = 'finished';
          game.winner = myColor;
          game.endReason = 'no-moves';
        } else {
          game.turn = nextColor;
        }
        game.drawOffered = {};
      }
      // mustContinue bo'lsa, navbat o'zgarmaydi — o'sha o'yinchi davom ettiradi
    }
    game.updatedAt = new Date().toISOString();
    res.json(boardGameView(game, me));
  });

  app.post(`/api/games/${type}/:id/resign`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.status(404).json({ error: "O'yin topilmadi" });
    if (game.status === 'playing') {
      const other = game.players.w === me ? game.players.b : game.players.w;
      boardForfeitTo(game, other, 'resign');
    }
    res.json(boardGameView(game, me));
  });

  app.post(`/api/games/${type}/:id/draw-offer`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.status(404).json({ error: "O'yin topilmadi" });
    if (game.status !== 'playing') return res.status(400).json({ error: "O'yin allaqachon tugagan" });
    const myColor = game.players.w === me ? 'w' : 'b';
    game.drawOffered[myColor] = true;
    boardTouch(game, me);
    res.json(boardGameView(game, me));
  });

  app.post(`/api/games/${type}/:id/draw-response`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.status(404).json({ error: "O'yin topilmadi" });
    const myColor = game.players.w === me ? 'w' : 'b';
    const oppColor = myColor === 'w' ? 'b' : 'w';
    if (req.body && req.body.accept && game.drawOffered[oppColor]) {
      game.status = 'finished';
      game.winner = 'draw';
      game.endReason = 'draw-agreed';
    } else {
      game.drawOffered = {};
    }
    res.json(boardGameView(game, me));
  });

  app.post(`/api/games/${type}/:id/rematch`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.status(404).json({ error: "O'yin topilmadi" });
    if (game.status !== 'finished') return res.status(400).json({ error: "O'yin hali tugamagan" });
    game.rematchWanted[me] = true;
    boardTouch(game, me);
    const other = game.players.w === me ? game.players.b : game.players.w;
    if (game.rematchWanted[me] && game.rematchWanted[other]) {
      const prevW = game.players.w, prevB = game.players.b;
      Object.assign(game, boardNewGame(type, game.id, prevB, prevW));
    }
    game.updatedAt = new Date().toISOString();
    res.json(boardGameView(game, me));
  });

  app.post(`/api/games/${type}/:id/leave`, requireAuth, (req, res) => {
    const me = req.session.username;
    const game = boardGames[type].get(req.params.id);
    if (!game || (game.players.w !== me && game.players.b !== me)) return res.json({ ok: true });
    if (game.status === 'playing') {
      const other = game.players.w === me ? game.players.b : game.players.w;
      boardForfeitTo(game, other, 'left');
    }
    boardFreeUsers(type, game);
    res.json({ ok: true });
  });
});

/* Faol bo'lmagan shaxmat/shashka o'yinlarini xotiradan tozalab turadi */
setInterval(() => {
  const now = Date.now();
  BOARD_GAME_TYPES.forEach(type => {
    for (const [id, game] of boardGames[type]) {
      boardCheckTimeout(game);
      const seenTimes = Object.values(game.lastSeen);
      const lastActivity = seenTimes.length ? Math.max(...seenTimes) : game.createdAt;
      if (now - lastActivity > BOARD_GAME_IDLE_MS) {
        boardFreeUsers(type, game);
        boardGames[type].delete(id);
      }
    }
  });
}, 60 * 1000).unref();

/* ===================== ADMIN/BOSS — BIR-BIRIGA O'YIN TAKLIFI =====================
   Faqat administrator yoki boss huquqiga ega foydalanuvchilar bir-biriga
   shaxmat yoki shashka o'ynash uchun taklif yubora oladi. Taklif xotirada
   saqlanadi va qabul qilinsa, yuqoridagi onlayn o'yin tizimida yangi
   o'yin ochiladi (xuddi navbatda topilgandek). */
const gameInvites = new Map(); // id -> { id, from, to, type, status, createdAt }
const GAME_INVITE_TTL_MS = 5 * 60 * 1000;

function invitePublicView(inv) {
  return {
    id: inv.id,
    from: boardPublicUser(inv.from),
    to: boardPublicUser(inv.to),
    type: inv.type,
    status: inv.status,
    createdAt: inv.createdAt
  };
}

app.get('/api/games/admins', requireAuth, requireAdmin, (req, res) => {
  const me = req.session.username;
  const list = Object.keys(db.users)
    .filter(uname => uname !== me && (db.users[uname].isAdmin || db.users[uname].isBoss) && !db.users[uname].adminAccessRevoked)
    .map(uname => Object.assign(boardPublicUser(uname), { isOnline: isUserOnline(uname), lastSeenAt: getLastSeen(uname) }));
  res.json({ users: list });
});

app.post('/api/games/invite', requireAuth, requireAdmin, (req, res) => {
  const me = req.session.username;
  const to = req.body && req.body.to;
  const type = req.body && req.body.type;
  if (!BOARD_GAME_TYPES.includes(type)) return res.status(400).json({ error: "Noto'g'ri o'yin turi" });
  const targetUser = db.users[to];
  if (!targetUser || !(targetUser.isAdmin || targetUser.isBoss) || targetUser.adminAccessRevoked) {
    return res.status(400).json({ error: "Bu foydalanuvchiga taklif yuborib bo'lmaydi" });
  }
  if (to === me) return res.status(400).json({ error: "O'zingizga taklif yubora olmaysiz" });
  const already = [...gameInvites.values()].some(inv => inv.status === 'pending' && inv.from === me && inv.to === to && inv.type === type);
  if (already) return res.status(400).json({ error: 'Bu foydalanuvchiga allaqachon taklif yuborilgan' });

  const id = 'inv' + Date.now() + crypto.randomBytes(4).toString('hex');
  const inv = { id, from: me, to, type, status: 'pending', createdAt: Date.now() };
  gameInvites.set(id, inv);
  addNotification(to, { type: 'game-invite', from: me, gameType: type, inviteId: id });
  res.json({ ok: true, invite: invitePublicView(inv) });
});

app.get('/api/games/invites', requireAuth, requireAdmin, (req, res) => {
  const me = req.session.username;
  const now = Date.now();
  for (const [id, inv] of gameInvites) {
    if (inv.status === 'pending' && now - inv.createdAt > GAME_INVITE_TTL_MS) inv.status = 'expired';
  }
  const incoming = [...gameInvites.values()].filter(inv => inv.to === me && inv.status === 'pending').map(invitePublicView);
  const outgoing = [...gameInvites.values()].filter(inv => inv.from === me && inv.status === 'pending').map(invitePublicView);
  res.json({ incoming, outgoing });
});

app.post('/api/games/invites/:id/accept', requireAuth, requireAdmin, (req, res) => {
  const me = req.session.username;
  const inv = gameInvites.get(req.params.id);
  if (!inv || inv.to !== me) return res.status(404).json({ error: 'Taklif topilmadi' });
  if (inv.status !== 'pending') return res.status(400).json({ error: 'Bu taklif allaqachon yopilgan' });
  inv.status = 'accepted';
  const gameId = boardStartGame(inv.type, inv.from, inv.to);
  addNotification(inv.from, { type: 'game-invite-accepted', from: me, gameType: inv.type, gameId });
  res.json({ ok: true, gameId, type: inv.type });
});

app.post('/api/games/invites/:id/decline', requireAuth, requireAdmin, (req, res) => {
  const me = req.session.username;
  const inv = gameInvites.get(req.params.id);
  if (!inv || inv.to !== me) return res.status(404).json({ error: 'Taklif topilmadi' });
  if (inv.status !== 'pending') return res.status(400).json({ error: 'Bu taklif allaqachon yopilgan' });
  inv.status = 'declined';
  addNotification(inv.from, { type: 'game-invite-declined', from: me, gameType: inv.type });
  res.json({ ok: true });
});

app.post('/api/games/invites/:id/cancel', requireAuth, requireAdmin, (req, res) => {
  const me = req.session.username;
  const inv = gameInvites.get(req.params.id);
  if (!inv || inv.from !== me) return res.status(404).json({ error: 'Taklif topilmadi' });
  if (inv.status === 'pending') inv.status = 'cancelled';
  res.json({ ok: true });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, inv] of gameInvites) {
    if (inv.status !== 'pending' && now - inv.createdAt > 60 * 60 * 1000) gameInvites.delete(id);
  }
}, 10 * 60 * 1000).unref();

/* SPA fallback — noma'lum yo'llarni ham bosh sahifaga yo'naltiradi */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Madein.net serveri ${PORT}-portda ishga tushdi`);
});
