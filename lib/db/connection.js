/**
 * lib/db/connection.js — relyatsion (jadvalli) SQLite bazasiga ulanish.
 *
 * Bu eski `db-sqlite.js` (JSON-blob saqlash)dan BUTUNLAY ALOHIDA, PARALLEL
 * qatlam. Hozircha server.js hali eski qatlamdan foydalanmoqda — bu yerdagi
 * modellar (`lib/db/users.js`, `lib/db/works.js`, ...) navbatdagi bosqichda,
 * rout'lar birma-bir shu qatlamga o'tkazilganda ishlatila boshlaydi.
 *
 * Nega alohida fayl: bitta joyda ochilib, bitta joyda sxema qo'llanadi —
 * har bir model fayli buni qayta yozmaydi, faqat shu yerdan import qiladi.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'db', 'schema.sql');

let instance = null;

/**
 * Bazani ochadi (yo'q bo'lsa — sxema bilan yaratadi) va WAL rejimini
 * yoqadi (bir vaqtda o'qish/yozish ishlashi uchun — server.js'da ham
 * db-sqlite.js xuddi shu rejimdan foydalanadi).
 */
function openDatabase(filePath) {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  applyForwardCompatMigrations(db);
  return db;
}

/**
 * schema.sql'dagi `CREATE TABLE IF NOT EXISTS` faqat YANGI bazalarda
 * ishlaydi — allaqachon mavjud fayldagi eski jadvalga yangi ustun
 * qo'shmaydi. To'liq migratsiya frameworksiz, shu yerda eng zarur
 * "ustun yetishmasa qo'sh" tekshiruvlarini qo'lda bajaramiz.
 */
function applyForwardCompatMigrations(db) {
  const reportCols = db.prepare("PRAGMA table_info(reports)").all().map(c => c.name);
  if (!reportCols.includes('target_title')) {
    db.exec('ALTER TABLE reports ADD COLUMN target_title TEXT');
  }
  if (!reportCols.includes('resolved_by')) {
    db.exec('ALTER TABLE reports ADD COLUMN resolved_by TEXT');
  }
}

/**
 * Butun ilova davomida BITTA ulanishni qayta ishlatadi (better-sqlite3
 * sinxron va thread-safe emas — bir nechta ulanish ochish foyda bermaydi,
 * faqat chalkashlik keltirib chiqaradi).
 */
function getDatabase(filePath) {
  if (!instance) {
    if (!filePath) {
      throw new Error('getDatabase: birinchi chaqiruvda filePath berilishi shart');
    }
    instance = openDatabase(filePath);
  }
  return instance;
}

/* Faqat testlar uchun: keshlangan ulanishni tozalaydi, shunda keyingi
   getDatabase() chaqiruvi yangi (masalan vaqtinchalik) faylni ochadi. */
function _resetForTests() {
  if (instance) {
    instance.close();
    instance = null;
  }
}

module.exports = { openDatabase, getDatabase, _resetForTests };
