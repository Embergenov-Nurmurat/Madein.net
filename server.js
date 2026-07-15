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

/* rasm yuklash (multer) */
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, crypto.randomBytes(14).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Faqat rasm fayllari qabul qilinadi'));
    }
    cb(null, true);
  }
});

function workImages(w) {
  if (Array.isArray(w.images) && w.images.length) return w.images;
  return w.image ? [w.image] : [];
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
    followingCount: (u.following || []).length,
    followersCount: countFollowers(uname),
    savedCount: (u.savedWorks || []).length,
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
    isSelf
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
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Kamida bitta rasm talab qilinadi' });

    const { title, type, status, price, currency, desc } = req.body || {};
    const isSale = status === 'sale';
    const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];
    const images = req.files.map(f => '/uploads/' + f.filename);
    const work = {
      id: 'w' + Date.now() + crypto.randomBytes(4).toString('hex'),
      title: String(title || '').slice(0, 200),
      type: ['rasm', 'haykal', 'mulaj', 'boshqa'].includes(type) ? type : 'boshqa',
      status: isSale ? 'sale' : 'expo',
      price: isSale ? (Number(price) || 0) : 0,
      currency: isSale && CURRENCIES.includes(currency) ? currency : 'UZS',
      desc: String(desc || '').slice(0, 2000),
      images,
      image: images[0], // eski frontend/kod bilan moslik uchun
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
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

  if (onlyFollowing && !meUser) return res.json({ items: [], hasMore: false, total: 0 });
  const followingSet = onlyFollowing ? new Set(meUser.following || []) : null;

  const all = [];
  for (const uname of Object.keys(db.works)) {
    const u = db.users[uname];
    if (!u) continue;
    if (onlyFollowing && !followingSet.has(uname)) continue;
    for (const w of db.works[uname] || []) {
      if (type && type !== 'all' && w.type !== type) continue;
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
        createdAt: w.createdAt,
        username: uname,
        fullname: u.fullname || uname,
        avatar: u.avatar || null,
        likesCount: likes.length,
        likedByMe: likes.includes(me),
        savedByMe: !!(meUser && Array.isArray(meUser.savedWorks) && meUser.savedWorks.includes(w.id)),
        commentsCount: comments.length,
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
    otherUser: { username: other, fullname: (u && u.fullname) || other },
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

/* SPA fallback — noma'lum yo'llarni ham bosh sahifaga yo'naltiradi */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Madein.net serveri ${PORT}-portda ishga tushdi`);
});
