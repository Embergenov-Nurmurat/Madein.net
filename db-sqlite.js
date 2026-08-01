/**
 * db-sqlite.js — bitta katta db.json fayl o'rniga SQLite (fayl-asosli, lekin
 * haqiqiy) bazaga o'tish.
 *
 * MUHIM: server.js'ning qolgan qismi (60dan ortiq route) hamon `db.users`,
 * `db.works`, `db.orders` kabi JS obyektlari bilan xotirada ishlaydi — bu
 * qatnov (contract) o'zgarmaydi. Bu modul faqat DISKKA YOZISH/O'QISH
 * usulini almashtiradi:
 *   - Har bir foydalanuvchi/asar/xabar-tredi/buyurtma/shikoyat SQLite'da
 *     ALOHIDA QATOR (row) sifatida saqlanadi (JSON ustunda) — shu orqali
 *     bitta like/view o'zgarishi endi butun bazani emas, faqat tegishli
 *     qatorlarni qayta yozadi.
 *   - Yozishlar SQLite TRANZAKSIYASI ichida amalga oshiriladi — server
 *     yozish jarayonining o'rtasida qulasa ham, baza yarim yozilgan holatda
 *     qolib ketmaydi (yagona JSON faylni qayta yozishda bo'lgani kabi).
 *   - WAL (Write-Ahead Log) rejimi yoqilgan — bir vaqtda o'qish va yozish
 *     bir-biriga xalaqit bermaydi, va kutilmagan o'chishlardan keyin ham
 *     baza avtomatik tiklanadi.
 *
 * CHEKLOV (halol aytish kerak): bu hamon butun ma'lumotlar to'plamini
 * xotiraga to'liq yuklab ishlaydigan arxitektura (original kod shunday
 * yozilgan edi). Yuzlab-minglab foydalanuvchi/asar darajasida haqiqiy
 * gorizontal masshtablash uchun keyingi bosqichda PostgreSQL'ga o'tib,
 * feed/qidiruv kabi "issiq" so'rovlarni to'g'ridan-to'g'ri SQL orqali
 * (xotiradagi massivlarni aylanmasdan) bajarish kerak bo'ladi. Hozirgi
 * o'zgarish "yiqilishda ma'lumot yo'qolishi xavfi"ni bartaraf etadi va
 * yozish tezligini yaxshilaydi — bu vazifaning "minimal-effort SQLite"
 * varianti sifatida so'ralgan edi.
 */

const path = require('path');
const Database = require('better-sqlite3');

function openDatabase(dataDir) {
  const dbPath = path.join(dataDir, 'madein.db');
  console.log('DB-CHECKPOINT A: fayl yo\'li =', dbPath);
  const sqlite = new Database(dbPath);
  console.log('DB-CHECKPOINT B: new Database() muvaffaqiyatli');
  // MUHIM: WAL rejimi mmap/shared-memory (-shm fayl) talab qiladi. Railway
  // Volume kabi tarmoq orqali ulangan (network-backed) xotiralarda bu
  // to'liq qo'llab-quvvatlanmaydi va better-sqlite3'ni "Segmentation fault"
  // bilan qulatadi. Shu sabab bu yerda WAL emas, oddiy TRUNCATE jurnal
  // rejimi ishlatiladi — u mmap talab qilmaydi va istalgan fayl tizimida
  // (jumladan tarmoq volume'larida ham) ishonchli ishlaydi.
  sqlite.pragma('journal_mode = TRUNCATE');
  console.log('DB-CHECKPOINT C: journal_mode pragma muvaffaqiyatli');
  sqlite.pragma('synchronous = FULL');   // diskka haqiqatan yozilganiga kafolat (durability)
  console.log('DB-CHECKPOINT D: synchronous pragma muvaffaqiyatli');

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
  console.log('DB-CHECKPOINT E: CREATE TABLE/INDEX muvaffaqiyatli');

  return sqlite;
}

/* Agar eski storage/data/db.json mavjud bo'lsa va SQLite baza hali bo'sh
   bo'lsa — bir martalik avtomatik import qiladi (foydalanuvchi qo'lda
   migratsiya skriptini ishga tushirishi shart emas). */
function importFromJsonIfNeeded(sqlite, jsonFile, fs) {
  const userCount = sqlite.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return false; // SQLite'da allaqachon ma'lumot bor — import shart emas
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
  console.log(`db.json → SQLite import qilindi (${Object.keys(raw.users || {}).length} foydalanuvchi, ${(raw.orders || []).length} buyurtma).`);
  return true;
}

function readFullDB(sqlite) {
  const users = {};
  for (const row of sqlite.prepare('SELECT username, data FROM users').all()) {
    users[row.username] = JSON.parse(row.data);
  }
  const works = {};
  for (const row of sqlite.prepare('SELECT username, data FROM works').all()) {
    works[row.username] = JSON.parse(row.data);
  }
  const messages = {};
  for (const row of sqlite.prepare('SELECT conv_key, data FROM messages').all()) {
    messages[row.conv_key] = JSON.parse(row.data);
  }
  const orders = sqlite.prepare('SELECT data FROM orders ORDER BY created_at ASC').all().map(r => JSON.parse(r.data));
  const reports = sqlite.prepare('SELECT data FROM reports').all().map(r => JSON.parse(r.data));
  return { users, works, messages, orders, reports };
}

/* Butun `db` obyektini SQLite'ga yozadi — bitta tranzaksiya ichida (hammasi
   yoki hech narsa). users/works/messages jadvallarida faqat o'zgargan
   qatorlar UPSERT qilinadi (o'zgarmagan foydalanuvchilar qayta yozilmaydi),
   orders/reports esa massiv bo'lgani uchun to'liq almashtiriladi. */
function writeFullDB(sqlite, db) {
  const upsertUser = sqlite.prepare('INSERT INTO users (username, data) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET data = excluded.data');
  const upsertWork = sqlite.prepare('INSERT INTO works (username, data) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET data = excluded.data');
  const upsertMsg = sqlite.prepare('INSERT INTO messages (conv_key, data) VALUES (?, ?) ON CONFLICT(conv_key) DO UPDATE SET data = excluded.data');
  const insertOrder = sqlite.prepare('INSERT INTO orders (id, buyer, created_at, data) VALUES (?, ?, ?, ?)');
  const insertReport = sqlite.prepare('INSERT INTO reports (id, data) VALUES (?, ?)');

  const tx = sqlite.transaction((db) => {
    for (const uname of Object.keys(db.users || {})) {
      upsertUser.run(uname, JSON.stringify(db.users[uname]));
    }
    for (const uname of Object.keys(db.works || {})) {
      upsertWork.run(uname, JSON.stringify(db.works[uname]));
    }
    for (const key of Object.keys(db.messages || {})) {
      upsertMsg.run(key, JSON.stringify(db.messages[key]));
    }
    sqlite.prepare('DELETE FROM orders').run();
    for (const order of (db.orders || [])) {
      insertOrder.run(order.id, order.buyer || null, order.createdAt || null, JSON.stringify(order));
    }
    sqlite.prepare('DELETE FROM reports').run();
    for (const report of (db.reports || [])) {
      insertReport.run(report.id, JSON.stringify(report));
    }
  });
  tx(db);
}

module.exports = { openDatabase, importFromJsonIfNeeded, readFullDB, writeFullDB };
