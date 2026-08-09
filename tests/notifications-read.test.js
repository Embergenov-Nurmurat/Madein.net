const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');
const { startTestServer, Client, registerAndLogin } = require('./helpers');

describe('GET /api/notifications — relyatsion bazadan o\'qish', () => {
  let server;
  before(async () => { server = await startTestServer(); });
  after(() => server.stop());

  test('yangi bildirishnomalar to\'g\'ri shakl va tartibda qaytadi', async () => {
    const me = await registerAndLogin(server.baseUrl, 'notifreaduser1');
    const friend1 = await registerAndLogin(server.baseUrl, 'notifreadfriend1');
    const friend2 = await registerAndLogin(server.baseUrl, 'notifreadfriend2');

    await friend1.post('/api/users/notifreaduser1/follow');
    await new Promise(r => setTimeout(r, 5)); // createdAt tartibi aniq bo'lishi uchun
    await friend2.post('/api/users/notifreaduser1/follow');

    const res = await me.get('/api/notifications');
    assert.equal(res.status, 200);
    assert.equal(res.data.items.length, 2);
    assert.equal(res.data.unread, 2);
    // eng yangisi birinchi bo'lishi kerak (DESC)
    assert.equal(res.data.items[0].from, 'notifreadfriend2');
    assert.equal(res.data.items[1].from, 'notifreadfriend1');
    assert.ok(res.data.items.every(n => n.type === 'follow' && n.read === false));

    await me.post('/api/notifications/read');
    const res2 = await me.get('/api/notifications');
    assert.equal(res2.data.unread, 0);
  });
});

describe('GET /api/notifications — eski (dual-write dan OLDINGI) foydalanuvchi uchun fallback', () => {
  const OLD_USERNAME = 'legacynotifuser';
  const OLD_PASSWORD = 'LegacyPass123!';
  let server;

  before(async () => {
    server = await startTestServer({
      preSeed: async (storageDir) => {
        const dataDir = path.join(storageDir, 'data');
        fs.mkdirSync(dataDir, { recursive: true });
        const sqlite = dbSqlite.openDatabase(dataDir);
        const passwordHash = await bcrypt.hash(OLD_PASSWORD, 10);
        dbSqlite.saveUserRow(sqlite, OLD_USERNAME, {
          passwordHash, fullname: 'Legacy Notif User', email: '', bio: '', avatar: null,
          phone: '', social: '', privacy: { phone: true, social: true, email: false },
          theme: null, joined: new Date().toISOString(), isAdmin: false,
          moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
          notifications: [
            { id: 'legn1', type: 'like', from: 'someone', workId: 'w1', read: false, createdAt: new Date().toISOString() }
          ],
          following: [], wishlist: [], cart: {}
        });
        dbSqlite.closeDatabase(sqlite);
      }
    });
  });
  after(() => server.stop());

  test('relyatsion bazada yo\'q foydalanuvchi uchun eski qatlamdagi bildirishnoma qaytadi', async () => {
    const client = new Client(server.baseUrl);
    const loginRes = await client.post('/api/login', { username: OLD_USERNAME, password: OLD_PASSWORD });
    assert.equal(loginRes.status, 200);

    const relDb = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM users WHERE username = ?').get(OLD_USERNAME), undefined);
    } finally {
      relDb.close();
    }

    const res = await client.get('/api/notifications');
    assert.equal(res.status, 200);
    assert.equal(res.data.items.length, 1);
    assert.equal(res.data.items[0].id, 'legn1');
    assert.equal(res.data.unread, 1);
  });
});
