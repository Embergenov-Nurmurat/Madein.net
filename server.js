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

// Eski (bitta rasmli) asarlarni yangi `images` massiviga moslashtirish
for (const uname of Object.keys(db.works || {})) {
  for (const w of db.works[uname] || []) {
    if (!Array.isArray(w.images) || !w.images.length) {
      w.images = w.image ? [w.image] : [];
    }
  }
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
  if (!req.session.username || !db.users[req.session.username]) {
    return res.status(401).json({ error: 'Avval tizimga kiring' });
  }
  next();
}

function publicUser(uname) {
  const u = db.users[uname];
  if (!u) return null;
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
    theme: u.theme || null
  };
}

/* Boshqa foydalanuvchilarga ko'rinadigan (maxfiylik sozlamalariga rioya qiluvchi) profil ma'lumoti */
function publicProfile(uname, viewerUsername) {
  const u = db.users[uname];
  if (!u) return null;
  const privacy = Object.assign({ phone: true, social: true, email: false }, u.privacy || {});
  const isSelf = viewerUsername && viewerUsername === uname;
  return {
    username: uname,
    fullname: u.fullname || '',
    bio: u.bio || '',
    avatar: u.avatar || null,
    joined: u.joined,
    phone: (isSelf || privacy.phone) ? (u.phone || '') : null,
    social: (isSelf || privacy.social) ? (u.social || '') : null,
    email: (isSelf || privacy.email) ? (u.email || '') : null
  };
}

/* ===================== AUTH ROUTES ===================== */
app.post('/api/register', async (req, res) => {
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
      joined: new Date().toISOString()
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

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const uname = String(username || '').trim().toLowerCase();
    const u = db.users[uname];
    const ok = u && await bcrypt.compare(String(password || ''), u.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Foydalanuvchi nomi yoki parol noto'g'ri" });
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

app.get('/api/me', (req, res) => {
  const uname = req.session.username;
  if (!uname || !db.users[uname]) return res.json({ user: null });
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

  const all = [];
  for (const uname of Object.keys(db.works)) {
    const u = db.users[uname];
    if (!u) continue;
    for (const w of db.works[uname] || []) {
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
        commentsCount: comments.length
      });
    }
  }
  all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

app.post('/api/works/:id/comments', requireAuth, async (req, res) => {
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
app.post('/api/conversations/:username/messages', requireAuth, async (req, res) => {
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

/* SPA fallback — noma'lum yo'llarni ham bosh sahifaga yo'naltiradi */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Madein.net serveri ${PORT}-portda ishga tushdi`);
});
