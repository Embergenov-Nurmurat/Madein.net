const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const dbSqlite = require('../db-sqlite');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function preSeedLegacyCollectionOwner(storageDir) {
  const dataDir = path.join(storageDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = dbSqlite.openDatabase(dataDir);
  const passwordHash = require('bcryptjs').hashSync('Password123!', 10);
  dbSqlite.saveUserRow(sqlite, 'colreaduser', {
    passwordHash, fullname: 'Col Read User', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: false,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: [], wishlist: [], cart: {},
    collections: [
      { id: 'legacycol1', name: "Eski to'plam", workIds: ['legacyworkincol1'], createdAt: new Date().toISOString() }
    ]
  });
  sqlite.prepare(`INSERT INTO works (username, data) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET data = excluded.data`).run(
    'colreaduser', JSON.stringify([{
      id: 'legacyworkincol1', owner: 'colreaduser', title: 'Legacy Collection Work', type: 'rasm',
      status: 'sale', price: 12000, currency: 'UZS', desc: '', image: '/uploads/legacy.jpg',
      images: ['/uploads/legacy.jpg'], thumbs: ['/uploads/legacy-thumb.jpg'], tags: [],
      likes: [], comments: [], reviews: [], createdAt: new Date().toISOString(), mediaType: 'image'
    }])
  );
  dbSqlite.closeDatabase(sqlite);
}

describe("GET /api/collections/:username — relyatsion bazadan gibrid o'qish", () => {
  let server;
  before(async () => { server = await startTestServer({ preSeed: preSeedLegacyCollectionOwner }); });
  after(() => server.stop());

  test("foydalanuvchi va uning to'plami/asari FAQAT eski qatlamda bo'lsa ham, to'g'ri qaytadi", async () => {
    const res = await (await registerAndLogin(server.baseUrl, 'colreadviewer')).get('/api/collections/colreaduser');
    assert.equal(res.status, 200);
    assert.equal(res.data.items.length, 1);
    const col = res.data.items[0];
    assert.equal(col.name, "Eski to'plam");
    assert.equal(col.works.length, 1);
    assert.equal(col.works[0].title, 'Legacy Collection Work');
    assert.equal(col.works[0].price, 12000);
  });

  test("relyatsion bazadagi foydalanuvchi o'z to'plamiga o'z ishini qo'shsa to'g'ri ko'rinadi", async () => {
    const owner = await registerAndLogin(server.baseUrl, 'colreadowner2');
    const colRes = await owner.post('/api/collections', { name: 'Yangi tolam' });
    const colId = colRes.data.collection.id;

    const form = new FormData();
    form.append('title', 'Own work for collection');
    form.append('type', 'rasm');
    form.append('status', 'sale');
    form.append('price', '8000');
    form.append('currency', 'UZS');
    form.append('desc', 'x');
    form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
    const workRes = await owner.request('POST', '/api/works', form, { isForm: true });
    const workId = workRes.data.work.id;

    await owner.put(`/api/collections/${colId}`, { addWorkId: workId });

    const res = await owner.get('/api/collections/colreadowner2');
    assert.equal(res.status, 200);
    const col = res.data.items.find(c => c.id === colId);
    assert.ok(col);
    assert.equal(col.works.length, 1);
    assert.equal(col.works[0].id, workId);
  });

  test("mavjud bo'lmagan foydalanuvchi uchun 404", async () => {
    const res = await (await registerAndLogin(server.baseUrl, 'colreadviewer2')).get('/api/collections/nonexistent_user_xyz');
    assert.equal(res.status, 404);
  });
});
