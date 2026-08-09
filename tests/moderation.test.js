const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');
const { startTestServer, Client, registerAndLogin } = require('./helpers');

const ADMIN_USERNAME = 'madein_admin';
const ADMIN_PASSWORD = 'TestAdminPass123!';

/* Productiondagi FIXED_ADMIN_PASSWORD_HASH testlarga noma'lum (qat'iy
   belgilangan hash) — shuning uchun server ishga tushishidan OLDIN
   admin foydalanuvchisini BIZGA MA'LUM parol bilan qo'lda yozib qo'yamiz.
   server.js'dagi seedFixedAdmin() faqat foydalanuvchi YO'Q bo'lsagina
   passwordHash'ni o'rnatadi — mavjud bo'lsa tegmaydi — shuning uchun bu
   usul ishonchli. */
async function preSeedAdmin(storageDir) {
  const dataDir = path.join(storageDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = dbSqlite.openDatabase(dataDir);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  dbSqlite.saveUserRow(sqlite, ADMIN_USERNAME, {
    passwordHash, fullname: 'Administrator', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: true,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: [], wishlist: [], cart: {}
  });
  dbSqlite.closeDatabase(sqlite);
}

function openRelDb(server) {
  return new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
}

describe('Moderatsiya (ban/mute) — relyatsion bazaga dublikat yozish', () => {
  let server;
  let admin;

  before(async () => {
    server = await startTestServer({ preSeed: preSeedAdmin });
    admin = new Client(server.baseUrl);
    const res = await admin.post('/api/login', { username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    assert.equal(res.status, 200, "admin bilan oldindan tayyorlangan parol orqali kirish muvaffaqiyatli bo'lishi kerak");
  });
  after(() => server.stop());

  test('ban qo\'yish relyatsion bazaga ham yoziladi', async () => {
    await registerAndLogin(server.baseUrl, 'modtarget1');
    const res = await admin.post('/api/admin/users/modtarget1/ban', { minutes: 60, reason: "qoidabuzarlik" });
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT banned_until, ban_reason FROM users WHERE username = ?').get('modtarget1');
      assert.ok(row.banned_until, "banned_until o'rnatilishi kerak");
      assert.equal(row.ban_reason, "qoidabuzarlik");
    } finally {
      relDb.close();
    }
  });

  test('ban bekor qilish (unban) relyatsion bazani ham tozalaydi', async () => {
    await registerAndLogin(server.baseUrl, 'modtarget2');
    await admin.post('/api/admin/users/modtarget2/ban', { minutes: 60, reason: 'test' });
    const res = await admin.post('/api/admin/users/modtarget2/unban');
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT banned_until, ban_reason FROM users WHERE username = ?').get('modtarget2');
      assert.equal(row.banned_until, null);
      assert.equal(row.ban_reason, '');
    } finally {
      relDb.close();
    }
  });

  test('mut qilish va bekor qilish relyatsion bazaga yoziladi', async () => {
    await registerAndLogin(server.baseUrl, 'modtarget3');
    await admin.post('/api/admin/users/modtarget3/mute', { minutes: 30, reason: 'spam' });

    let relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT muted_until, mute_reason FROM users WHERE username = ?').get('modtarget3');
      assert.ok(row.muted_until);
      assert.equal(row.mute_reason, 'spam');
    } finally {
      relDb.close();
    }

    await admin.post('/api/admin/users/modtarget3/unmute');
    relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT muted_until, mute_reason FROM users WHERE username = ?').get('modtarget3');
      assert.equal(row.muted_until, null);
      assert.equal(row.mute_reason, '');
    } finally {
      relDb.close();
    }
  });

  test('ban haqidagi bildirishnoma relyatsion "notifications" jadvaliga ham yoziladi (markazlashgan addNotification)', async () => {
    await registerAndLogin(server.baseUrl, 'modtarget4');
    await admin.post('/api/admin/users/modtarget4/ban', { minutes: 60, reason: 'test-notif' });

    const relDb = openRelDb(server);
    try {
      const rows = relDb.prepare('SELECT type, status FROM notifications WHERE username = ? AND type = ?').all('modtarget4', 'ban');
      assert.equal(rows.length, 1, "ban bildirishnomasi relyatsion bazada aynan bitta bo'lishi kerak");
    } finally {
      relDb.close();
    }
  });
});
