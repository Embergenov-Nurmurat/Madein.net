/**
 * db-sqlite.js - SQLite saqlash qatlami (TEZLIK TUZATISHLARI BILAN).
 *
 * Nima o'zgardi:
 *  1. `writeFullDB` endi HAMMA narsani qayta yozmaydi. Har bir qator uchun
 *     kontent hash saqlanadi va faqat HAQIQATAN o'zgargan qatorlar yoziladi.
 *  2. `DELETE FROM orders` + hammasini qayta INSERT qilish OLIB TASHLANDI.
 *     Endi buyurtmalar id bo'yicha UPSERT qilinadi, o'chirilganlari esa
 *     faqat yo'q bo'lgan id'lar bo'yicha DELETE qilinadi. (Oldin bitta
 *     like bosilganda butun buyurtmalar jadvali qayta yozilardi.)
 *  3. Jurnal rejimi sozlanadigan bo'ldi: default WAL (tezroq), tarmoq
 *     volume'ida muammo bo'lsa `SQLITE_JOURNAL_MODE=TRUNCATE` qo'ying.
 *     `synchronous=NORMAL` (WAL bilan xavfsiz) - FULL faqat TRUNCATE'da.
 *  4. `busy_timeout` va indekslar qo'shildi, `PRAGMA optimize` yopilishda.
 *  5. Yozishlar debounce qilinadi (`scheduleWrite`) - ketma-ket kelgan
 *     o'zgarishlar bitta tranzaksiyaga birlashadi.
 */

const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const JOURNAL_MODE = (process.env.SQLITE_JOURNAL_MODE || 'WAL').toUpperCase();
const WRITE_DEBOUNCE_MS = Number(process.env.DB_WRITE_DEBOUNCE_MS || 250);

/* sqlite instansiyasi -> oxirgi yozilgan kontent hash'lari */
const hashCache = new WeakMap();

function cacheFor(sqlite) {
  let c = hashCache.get(sqlite);
  if (!c) {
    c = { users: new Map(), works: new Map(), messages: new Map(), orders: new Map(), reports: new Map() };
    hashCache.set(sqlite, c);
  }
  return c;
}

function hash(str) {
  return crypto.createHash('sha1').update(str).digest('base64');
}

function openDatabase(dataDir) {
  const dbPath = path.join(dataDir, 'madein.db');
  const sqlite = new Database(dbPath);

  // WAL: o'qish va yozish bir-birini bloklamaydi, yozish sezilarli tez.
  // Tarmoq orqali ulangan (NFS/ba'zi PaaS volume) diskda WAL shared-memory
  // talab qiladi - u yerda TRUNCATE'ga tushib qolamiz.
  let mode = JOURNAL_MODE;
  try {
    sqlite.pragma(`journal_mode = ${mode}`);
  } catch (e) {
    console.warn(`journal_mode=${mode} ishlamadi (${e.message}), TRUNCATE'ga o'tildi.`);
    mode = 'TRUNCATE';
    sqlite.pragma('journal_mode = TRUNCATE');
  }
  const actual = String(sqlite.pragma('journal_mode', { simple: true })).toUpperCase();
  // WAL'da NORMAL yetarli darajada xavfsiz (checkpoint kafolatlaydi),
  // WAL bo'lmasa durability uchun FULL kerak.
  sqlite.pragma(`synchronous = ${actual === 'WAL' ? 'NORMAL' : 'FULL'}`);
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('cache_size = -16000'); // ~16 MB sahifa keshi

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS works (
      username TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      conv_key TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer TEXT,
      created_at TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  `);

  return sqlite;
}

function closeDatabase(sqlite) {
  try { sqlite.pragma('optimize'); } catch (e) { /* ignore */ }
  try { sqlite.close(); } catch (e) { /* ignore */ }
}

function importFromJsonIfNeeded(sqlite, jsonFile, fs) {
  const userCount = sqlite.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return false;
  if (!fs.existsSync(jsonFile)) return false;

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  } catch (e) {
    console.error("db.json o'qib bo'lmadi, SQLite bo'sh holda boshlanadi:", e.message);
    return false;
  }
  writeFullDB(sqlite, {
    users: raw.users || {},
    works: raw.works || {},
    messages: raw.messages || {},
    orders: raw.orders || [],
    reports: raw.reports || []
  });
  console.log(`db.json -> SQLite import qilindi (${Object.keys(raw.users || {}).length} foydalanuvchi, ${(raw.orders || []).length} buyurtma).`);
  return true;
}

function readFullDB(sqlite) {
  const cache = cacheFor(sqlite);
  const users = {};
  for (const row of sqlite.prepare('SELECT username, data FROM users').all()) {
    users[row.username] = JSON.parse(row.data);
    cache.users.set(row.username, hash(row.data));
  }
  const works = {};
  for (const row of sqlite.prepare('SELECT username, data FROM works').all()) {
    works[row.username] = JSON.parse(row.data);
    cache.works.set(row.username, hash(row.data));
  }
  const messages = {};
  for (const row of sqlite.prepare('SELECT conv_key, data FROM messages').all()) {
    messages[row.conv_key] = JSON.parse(row.data);
    cache.messages.set(row.conv_key, hash(row.data));
  }
  const orders = [];
  for (const row of sqlite.prepare('SELECT id, data FROM orders ORDER BY created_at ASC').all()) {
    orders.push(JSON.parse(row.data));
    cache.orders.set(row.id, hash(row.data));
  }
  const reports = [];
  for (const row of sqlite.prepare('SELECT id, data FROM reports').all()) {
    reports.push(JSON.parse(row.data));
    cache.reports.set(row.id, hash(row.data));
  }
  return { users, works, messages, orders, reports };
}

/**
 * Butun `db` obyektini yozadi, LEKIN faqat o'zgargan qatorlarni.
 * Qaytaradi: nechta qator yozilgani (diagnostika uchun).
 */
function writeFullDB(sqlite, db) {
  const cache = cacheFor(sqlite);
  const stats = { users: 0, works: 0, messages: 0, orders: 0, reports: 0, deleted: 0 };

  const upsertUser = sqlite.prepare('INSERT INTO users (username, data) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET data = excluded.data');
  const upsertWork = sqlite.prepare('INSERT INTO works (username, data) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET data = excluded.data');
  const upsertMsg = sqlite.prepare('INSERT INTO messages (conv_key, data) VALUES (?, ?) ON CONFLICT(conv_key) DO UPDATE SET data = excluded.data');
  const upsertOrder = sqlite.prepare(`INSERT INTO orders (id, buyer, created_at, data) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET buyer = excluded.buyer, created_at = excluded.created_at, data = excluded.data`);
  const upsertReport = sqlite.prepare('INSERT INTO reports (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data');
  const delUser = sqlite.prepare('DELETE FROM users WHERE username = ?');
  const delWork = sqlite.prepare('DELETE FROM works WHERE username = ?');
  const delMsg = sqlite.prepare('DELETE FROM messages WHERE conv_key = ?');
  const delOrder = sqlite.prepare('DELETE FROM orders WHERE id = ?');
  const delReport = sqlite.prepare('DELETE FROM reports WHERE id = ?');

  /* Kalit-qiymat jadvallari uchun umumiy diff. */
  function syncMap(obj, cacheMap, upsert, del, counterKey) {
    const seen = new Set();
    for (const key of Object.keys(obj || {})) {
      const json = JSON.stringify(obj[key]);
      const h = hash(json);
      seen.add(key);
      if (cacheMap.get(key) === h) continue; // o'zgarmagan - tegmaymiz
      upsert.run(key, json);
      cacheMap.set(key, h);
      stats[counterKey]++;
    }
    for (const key of Array.from(cacheMap.keys())) {
      if (!seen.has(key)) {
        del.run(key);
        cacheMap.delete(key);
        stats.deleted++;
      }
    }
  }

  const tx = sqlite.transaction((db) => {
    syncMap(db.users, cache.users, upsertUser, delUser, 'users');
    syncMap(db.works, cache.works, upsertWork, delWork, 'works');
    syncMap(db.messages, cache.messages, upsertMsg, delMsg, 'messages');

    // Buyurtmalar: massiv, lekin id bor -> DELETE-hammasi o'rniga diff.
    const seenOrders = new Set();
    for (const order of (db.orders || [])) {
      if (!order || !order.id) continue;
      const json = JSON.stringify(order);
      const h = hash(json);
      seenOrders.add(order.id);
      if (cache.orders.get(order.id) === h) continue;
      upsertOrder.run(order.id, order.buyer || null, order.createdAt || null, json);
      cache.orders.set(order.id, h);
      stats.orders++;
    }
    for (const id of Array.from(cache.orders.keys())) {
      if (!seenOrders.has(id)) {
        delOrder.run(id);
        cache.orders.delete(id);
        stats.deleted++;
      }
    }

    const seenReports = new Set();
    for (const report of (db.reports || [])) {
      if (!report || !report.id) continue;
      const json = JSON.stringify(report);
      const h = hash(json);
      seenReports.add(report.id);
      if (cache.reports.get(report.id) === h) continue;
      upsertReport.run(report.id, json);
      cache.reports.set(report.id, h);
      stats.reports++;
    }
    for (const id of Array.from(cache.reports.keys())) {
      if (!seenReports.has(id)) {
        delReport.run(id);
        cache.reports.delete(id);
        stats.deleted++;
      }
    }
  });

  tx(db);
  return stats;
}

/* Bitta buyurtmani yozish - butun bazani aylanmasdan (webhook'lar uchun eng tez yo'l). */
function saveOrderRow(sqlite, order) {
  if (!order || !order.id) return false;
  const json = JSON.stringify(order);
  const h = hash(json);
  const cache = cacheFor(sqlite);
  if (cache.orders.get(order.id) === h) return false;
  sqlite.prepare(`INSERT INTO orders (id, buyer, created_at, data) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET buyer = excluded.buyer, created_at = excluded.created_at, data = excluded.data`)
    .run(order.id, order.buyer || null, order.createdAt || null, json);
  cache.orders.set(order.id, h);
  return true;
}

/* Bitta foydalanuvchini yozish. */
function saveUserRow(sqlite, username, user) {
  const json = JSON.stringify(user);
  const h = hash(json);
  const cache = cacheFor(sqlite);
  if (cache.users.get(username) === h) return false;
  sqlite.prepare('INSERT INTO users (username, data) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET data = excluded.data')
    .run(username, json);
  cache.users.set(username, h);
  return true;
}

/**
 * Debounce'langan yozuv: 250 ms ichida kelgan barcha chaqiruvlar bitta
 * tranzaksiyaga birlashadi. `flush()` - darhol yozish (masalan SIGTERM'da).
 */
function createWriter(sqlite, getDb) {
  let timer = null;
  let pending = false;

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!pending) return null;
    pending = false;
    try {
      return writeFullDB(sqlite, getDb());
    } catch (e) {
      console.error('Bazaga yozishda xato:', e.message);
      return null;
    }
  }

  function scheduleWrite() {
    pending = true;
    if (timer) return;
    timer = setTimeout(() => { timer = null; flush(); }, WRITE_DEBOUNCE_MS);
    if (timer.unref) timer.unref();
  }

  return { scheduleWrite, flush };
}

module.exports = {
  openDatabase, closeDatabase, importFromJsonIfNeeded,
  readFullDB, writeFullDB, saveOrderRow, saveUserRow, createWriter
};
