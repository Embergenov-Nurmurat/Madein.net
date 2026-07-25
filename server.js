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

/* Har bir foydalanuvchida kerakli maydonlar mavjudligini ta'minlaydi
   (eski db.json yozuvlari uchun ham) */
function ensureModerationFields(u) {
  if (!u) return;
  if (!Array.isArray(u.following)) u.following = [];
  if (!Array.isArray(u.savedWorks)) u.savedWorks = [];
  if (!u.callPrivacy || typeof u.callPrivacy !== 'object') {
    u.callPrivacy = { mode: 'everyone', allowed: [] };
  } else {
    if (!['everyone', 'nobody', 'selected'].includes(u.callPrivacy.mode)) u.callPrivacy.mode = 'everyone';
    if (!Array.isArray(u.callPrivacy.allowed)) u.callPrivacy.allowed = [];
  }
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
  ensureModerationFields(db.users[uname]);
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
    isOnline: isUserOnline(uname),
    followingCount: (u.following || []).length,
    followersCount: countFollowers(uname),
    savedCount: (u.savedWorks || []).length,
    stats: userWorkStats(uname)
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

app.post('/api/works', requireAuth, (req, res) => {
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

app.post('/api/works/:id/comments', requireAuth, rateLimit('comment', 30, 60 * 1000), async (req, res) => {
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

function callPreviewText(m) {
  switch (m.callStatus) {
    case 'ended': return "Video qo'ng'iroq";
    case 'missed': return "O'tkazib yuborilgan qo'ng'iroq";
    case 'declined': return "Rad etilgan qo'ng'iroq";
    case 'cancelled': return "Bekor qilingan qo'ng'iroq";
    case 'busy': return "Foydalanuvchi band edi";
    default: return "Qo'ng'iroq";
  }
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
      const lastPreview = last
        ? (last.type === 'call' ? ('📞 ' + callPreviewText(last)) : last.text)
        : '';
      return {
        username: other,
        fullname: (u && u.fullname) || other,
        avatar: (u && u.avatar) || null,
        lastMessage: lastPreview,
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
app.post('/api/conversations/:username/messages', requireAuth, rateLimit('message', 40, 60 * 1000), async (req, res) => {
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
app.post('/api/calls/start', requireAuth, rateLimit('call-start', 20, 60 * 1000), (req, res) => {
  const me = req.session.username;
  const to = String((req.body && req.body.to) || '').trim().toLowerCase();
  if (!to || !db.users[to]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  if (to === me) return res.status(400).json({ error: "O'zingizga qo'ng'iroq qila olmaysiz" });

  if (userActiveCall.has(me)) return res.status(409).json({ error: "Sizda allaqachon faol qo'ng'iroq bor" });
  if (userActiveCall.has(to)) return res.status(409).json({ error: "Foydalanuvchi hozir band", busy: true });

  const check = callPrivacyCheck(me, to);
  if (!check.ok) {
    return res.status(403).json({
      error: "Bu foydalanuvchi video qo'ng'iroqlarni cheklagan",
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
    res.status(404).json({ error: "Qo'ng'iroq topilmadi" });
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
  if (call.from !== me) return res.status(403).json({ error: 'Faqat chaqiruvchi taklif yubora oladi' });
  const sdp = req.body && req.body.sdp;
  if (!sdp || typeof sdp !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot" });
  call.offer = sdp;
  call.updatedAt = Date.now();
  res.json({ ok: true });
});

/* Qabul qiluvchi tomon qo'ng'iroqni qabul qilib, WebRTC "answer" yuboradi */
app.post('/api/calls/:id/answer', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  if (call.to !== me) return res.status(403).json({ error: 'Faqat qabul qiluvchi javob bera oladi' });
  if (call.status !== 'ringing') return res.status(400).json({ error: "Qo'ng'iroq allaqachon tugagan" });
  const sdp = req.body && req.body.sdp;
  if (!sdp || typeof sdp !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot" });
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
  if (!candidate || typeof candidate !== 'object') return res.status(400).json({ error: "Noto'g'ri ma'lumot" });
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
  if (call.to !== me) return res.status(403).json({ error: 'Faqat qabul qiluvchi rad eta oladi' });
  if (call.status === 'ringing') endCallInternal(call, 'declined');
  res.json({ ok: true });
});

/* Chaqiruvchi hali javob kelmasdan qo'ng'iroqni bekor qiladi */
app.post('/api/calls/:id/cancel', requireAuth, (req, res) => {
  const call = getCallForParticipant(req, res);
  if (!call) return;
  const me = req.session.username;
  if (call.from !== me) return res.status(403).json({ error: 'Faqat chaqiruvchi bekor qila oladi' });
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

/* SPA fallback — noma'lum yo'llarni ham bosh sahifaga yo'naltiradi */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Madein.net serveri ${PORT}-portda ishga tushdi`);
});
