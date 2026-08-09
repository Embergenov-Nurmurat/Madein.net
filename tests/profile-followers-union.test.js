const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');
const { startTestServer, Client, registerAndLogin } = require('./helpers');

const LEGACY_USERNAME = 'legacyprofileuser';
const LEGACY_PASSWORD = 'LegacyPass123!';

async function preSeedLegacyFollower(storageDir) {
  const dataDir = path.join(storageDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = dbSqlite.openDatabase(dataDir);
  const passwordHash = await bcrypt.hash(LEGACY_PASSWORD, 10);
  dbSqlite.saveUserRow(sqlite, LEGACY_USERNAME, {
    passwordHash, fullname: 'Legacy Profile User', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: false,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: ['modernuser'],
    wishlist: [], cart: {}
  });
  dbSqlite.closeDatabase(sqlite);
}

describe("publicUser/publicProfile — kuzatuvchilar soni ikkala qatlamdan birlashtiriladi", () => {
  let server;
  before(async () => { server = await startTestServer({ preSeed: preSeedLegacyFollower }); });
  after(() => server.stop());

  test("relyatsion bazadagi foydalanuvchi eski qatlamdagi kuzatuvchini ham followersCount'ida ko'radi", async () => {
    const modern = await registerAndLogin(server.baseUrl, 'modernuser');

    const relDb = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
    try {
      const row = relDb.prepare('SELECT 1 FROM follows WHERE follower = ? AND followee = ?')
        .get(LEGACY_USERNAME, 'modernuser');
      assert.equal(row, undefined);
    } finally {
      relDb.close();
    }

    const res = await modern.get('/api/me');
    assert.equal(res.status, 200);
    assert.equal(res.data.user.followersCount, 1, "eski qatlamdagi kuzatuvchi ham hisoblanishi kerak");
  });

  test("eski foydalanuvchining o'zi ham (login qilib) o'z followingCount'ini to'g'ri ko'radi", async () => {
    const client = new Client(server.baseUrl);
    const loginRes = await client.post('/api/login', { username: LEGACY_USERNAME, password: LEGACY_PASSWORD });
    assert.equal(loginRes.status, 200);

    const res = await client.get('/api/me');
    assert.equal(res.status, 200);
    assert.equal(res.data.user.followingCount, 1);
  });

  test("boshqa foydalanuvchi profilini ko'rganda (GET /api/users/:username) followersCount to'g'ri", async () => {
    const viewer = await registerAndLogin(server.baseUrl, 'profileviewer1');
    const res = await viewer.get('/api/users/modernuser');
    assert.equal(res.status, 200);
    assert.equal(res.data.profile.followersCount, 1);
  });
});
