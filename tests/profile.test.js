const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Database = require('better-sqlite3');
const { startTestServer, Client, registerAndLogin, tinyPngBuffer } = require('./helpers');

function openRelDb(server) {
  return new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
}

describe('Profil yangilash (migratsiya: relyatsion bazaga dublikat yozish)', () => {
  let server;
  before(async () => { server = await startTestServer(); });
  after(() => server.stop());

  test("oddiy maydonlar (bio/telefon/maxfiylik) relyatsion bazaga ham yoziladi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'profuser1');
    const res = await client.put('/api/profile', {
      bio: "Hunarmand ustaman",
      phone: '+998901112233',
      privacy: { phone: false, social: true, email: true }
    });
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT bio, phone, privacy_phone, privacy_social, privacy_email FROM users WHERE username = ?').get('profuser1');
      assert.equal(row.bio, "Hunarmand ustaman");
      assert.equal(row.phone, '+998901112233');
      assert.equal(row.privacy_phone, 0);
      assert.equal(row.privacy_social, 1);
      assert.equal(row.privacy_email, 1);
    } finally {
      relDb.close();
    }
  });

  test("callPrivacy (mode + allowed ro'yxati) relyatsion bazaga to'g'ri yoziladi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'profuser2');
    await registerAndLogin(server.baseUrl, 'profuser2friend');

    const res = await client.put('/api/profile', {
      callPrivacy: { mode: 'selected', allowed: ['profuser2friend'] }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.callPrivacy.mode, 'selected');

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT call_privacy_mode FROM users WHERE username = ?').get('profuser2');
      assert.equal(row.call_privacy_mode, 'selected');
      const allowed = relDb.prepare('SELECT allowed_username FROM call_privacy_allowed WHERE username = ?').all('profuser2');
      assert.deepEqual(allowed.map(a => a.allowed_username), ['profuser2friend']);
    } finally {
      relDb.close();
    }
  });

  test("parol o'zgartirilganda (username o'zgarmasa) relyatsion bazadagi hash ham yangilanadi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'profuser3');
    const res = await client.put('/api/profile/credentials', {
      currentPassword: 'Password123!',
      newPassword: 'NewPassword456!'
    });
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    let oldHash;
    try {
      oldHash = relDb.prepare('SELECT password_hash FROM users WHERE username = ?').get('profuser3').password_hash;
    } finally {
      relDb.close();
    }

    // Eski parol bilan login endi ishlamasligi kerak, yangisi bilan ishlashi kerak
    // (bu ESKI — asosiy — qatlam orqali tekshiriladi, chunki u hali "haqiqat manbai")
    const badLogin = await new Client(server.baseUrl).post('/api/login', { username: 'profuser3', password: 'Password123!' });
    assert.equal(badLogin.status, 401);
    const goodLogin = await new Client(server.baseUrl).post('/api/login', { username: 'profuser3', password: 'NewPassword456!' });
    assert.equal(goodLogin.status, 200);

    assert.ok(oldHash && oldHash.startsWith('$2'), "relyatsion bazadagi hash bcrypt formatida bo'lishi kerak");
  });

  test("username o'zgarishi (rename) relyatsion bazada barcha bog'liq ma'lumotlarni ko'chiradi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'renuser_old');
    const friend = await registerAndLogin(server.baseUrl, 'renuser_friend');

    // renuser_old bir ish yaratadi, friend unga obuna bo'ladi — rename'dan
    // keyin bularning barchasi YANGI nomga to'g'ri ko'chishi kerak
    const form = new FormData();
    form.append('title', 'Rename test asar');
    form.append('type', 'rasm');
    form.append('desc', 'tavsif');
    form.append('price', '5000');
    form.append('currency', 'UZS');
    form.append('status', 'sale');
    form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
    const workRes = await client.request('POST', '/api/works', form, { isForm: true });
    const workId = workRes.data.work.id;

    await friend.post('/api/users/renuser_old/follow');

    const res = await client.put('/api/profile/credentials', {
      currentPassword: 'Password123!',
      newUsername: 'renuser_new'
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.username, 'renuser_new');

    const relDb = openRelDb(server);
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM users WHERE username = ?').get('renuser_old'), undefined,
        "eski username relyatsion bazada qolmasligi kerak");
      assert.ok(relDb.prepare('SELECT 1 FROM users WHERE username = ?').get('renuser_new'));

      const work = relDb.prepare('SELECT owner FROM works WHERE id = ?').get(workId);
      assert.equal(work.owner, 'renuser_new');

      const followRow = relDb.prepare('SELECT 1 FROM follows WHERE follower = ? AND followee = ?')
        .get('renuser_friend', 'renuser_new');
      assert.ok(followRow, "obuna yangi username bilan saqlanishi kerak");
    } finally {
      relDb.close();
    }

    // yangi nom bilan login ishlashi, eskisi bilan ishlamasligi kerak
    const oldLogin = await new Client(server.baseUrl).post('/api/login', { username: 'renuser_old', password: 'Password123!' });
    assert.equal(oldLogin.status, 401);
    const newLogin = await new Client(server.baseUrl).post('/api/login', { username: 'renuser_new', password: 'Password123!' });
    assert.equal(newLogin.status, 200);
  });
});
