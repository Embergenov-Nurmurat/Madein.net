const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');
const { startTestServer, Client, registerAndLogin } = require('./helpers');

function openRelDb(server) {
  return new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
}

describe('Bildirishnoma sozlamalari / til / o\'qilgan deb belgilash — relyatsion baza', () => {
  let server;
  before(async () => { server = await startTestServer(); });
  after(() => server.stop());

  test('notification-prefs yangilanishi relyatsion bazaga yoziladi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'notifuser1');
    const res = await client.put('/api/notification-prefs', { likes: false, orders: false });
    assert.equal(res.status, 200);
    assert.equal(res.data.prefs.likes, false);
    assert.equal(res.data.prefs.comments, true); // teginilmagan

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT notif_likes, notif_orders, notif_comments FROM users WHERE username = ?').get('notifuser1');
      assert.equal(row.notif_likes, 0);
      assert.equal(row.notif_orders, 0);
      assert.equal(row.notif_comments, 1); // teginilmagan
    } finally {
      relDb.close();
    }
  });

  test('til (lang) o\'zgarishi relyatsion bazaga yoziladi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'notifuser2');
    const res = await client.put('/api/language', { lang: 'ru' });
    assert.equal(res.status, 200);
    assert.equal(res.data.lang, 'ru');

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT lang FROM users WHERE username = ?').get('notifuser2');
      assert.equal(row.lang, 'ru');
    } finally {
      relDb.close();
    }
  });

  test('bildirishnomalarni o\'qilgan deb belgilash relyatsion bazada ham aks etadi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'notifuser3');
    const other = await registerAndLogin(server.baseUrl, 'notifuser3friend');
    await other.post('/api/users/notifuser3/follow');

    let relDb = openRelDb(server);
    try {
      const before = relDb.prepare('SELECT read FROM notifications WHERE username = ?').all('notifuser3');
      assert.ok(before.length >= 1);
      assert.ok(before.every(n => n.read === 0));
    } finally {
      relDb.close();
    }

    const res = await client.post('/api/notifications/read');
    assert.equal(res.status, 200);

    relDb = openRelDb(server);
    try {
      const after = relDb.prepare('SELECT read FROM notifications WHERE username = ?').all('notifuser3');
      assert.ok(after.length >= 1);
      assert.ok(after.every(n => n.read === 1));
    } finally {
      relDb.close();
    }
  });
});

describe('GET /api/notification-prefs — eski (dual-write dan OLDINGI) foydalanuvchi uchun fallback', () => {
  const OLD_USERNAME = 'legacyuser1';
  const OLD_PASSWORD = 'LegacyPass123!';
  let server;

  before(async () => {
    server = await startTestServer({
      preSeed: async (storageDir) => {
        // Bu foydalanuvchi FAQAT eski (JSON-blob) qatlamda mavjud —
        // xuddi dual-write yoqilishidan OLDIN ro'yxatdan o'tgan
        // haqiqiy foydalanuvchi kabi. Relyatsion bazada u YO'Q.
        const dataDir = path.join(storageDir, 'data');
        fs.mkdirSync(dataDir, { recursive: true });
        const sqlite = dbSqlite.openDatabase(dataDir);
        const passwordHash = await bcrypt.hash(OLD_PASSWORD, 10);
        dbSqlite.saveUserRow(sqlite, OLD_USERNAME, {
          passwordHash, fullname: 'Legacy User', email: '', bio: '', avatar: null,
          phone: '', social: '', privacy: { phone: true, social: true, email: false },
          theme: null, joined: new Date().toISOString(), isAdmin: false,
          moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
          notifPrefs: { enabled: true, likes: false, comments: true, follows: true, orders: true, messages: true },
          notifications: [], following: [], wishlist: [], cart: {}
        });
        dbSqlite.closeDatabase(sqlite);
      }
    });
  });
  after(() => server.stop());

  test('foydalanuvchi relyatsion bazada yo\'q bo\'lsa ham, eski qatlamdan to\'g\'ri javob qaytadi', async () => {
    const client = new Client(server.baseUrl);
    const loginRes = await client.post('/api/login', { username: OLD_USERNAME, password: OLD_PASSWORD });
    assert.equal(loginRes.status, 200);

    // avval tasdiqlaymiz: bu foydalanuvchi haqiqatan ham relyatsion bazada yo'q
    const relDb = openRelDb(server);
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM users WHERE username = ?').get(OLD_USERNAME), undefined);
    } finally {
      relDb.close();
    }

    const res = await client.get('/api/notification-prefs');
    assert.equal(res.status, 200);
    assert.equal(res.data.prefs.likes, false, "eski qatlamdagi maxsus qiymat (likes:false) to'g'ri qaytishi kerak");
    assert.equal(res.data.prefs.comments, true);
  });
});
