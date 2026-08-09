const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const dbSqlite = require('../db-sqlite');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function uploadWork(client, overrides = {}) {
  const fields = Object.assign({
    title: 'Feed sinov asari', type: 'rasm', status: 'sale', price: '10000',
    currency: 'UZS', desc: 'sinov tavsifi', tags: 'keramika'
  }, overrides);
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
  const res = await client.request('POST', '/api/works', form, { isForm: true });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.work;
}

async function preSeedLegacyWork(storageDir) {
  const dataDir = path.join(storageDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = dbSqlite.openDatabase(dataDir);
  dbSqlite.saveUserRow(sqlite, 'legacy_feed_owner', {
    passwordHash: 'x', fullname: 'Legacy Feed Owner', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: false,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: [], wishlist: [], cart: {}
  });
  sqlite.prepare(`INSERT INTO works (username, data) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET data = excluded.data`).run(
    'legacy_feed_owner', JSON.stringify([{
      id: 'legacyfeedwork1', owner: 'legacy_feed_owner', title: 'Legacy Feed Work', type: 'rasm',
      status: 'sale', price: 15000, currency: 'UZS', desc: 'eski qatlamdagi asar', image: '/uploads/legacy.jpg',
      images: ['/uploads/legacy.jpg'], thumbs: ['/uploads/legacy-thumb.jpg'], tags: ['legacy'],
      likes: [], comments: [], reviews: [], createdAt: '2020-01-01T00:00:00.000Z', mediaType: 'image'
    }])
  );
  dbSqlite.closeDatabase(sqlite);
}

describe('GET /api/feed — relyatsion bazadan gibrid o\'qish (asosiy migratsiya maqsadi)', () => {
  let server, seller, viewer;

  before(async () => {
    server = await startTestServer({ preSeed: preSeedLegacyWork });
    seller = await registerAndLogin(server.baseUrl, 'feedseller1');
    viewer = await registerAndLogin(server.baseUrl, 'feedviewer1');
  });
  after(() => server.stop());

  test("faqat eski qatlamdagi asar ham lentada ko'rinadi (relyatsion bazada u UMUMAN yo'q)", async () => {
    const res = await viewer.get('/api/feed');
    assert.equal(res.status, 200);
    const item = res.data.items.find(i => i.id === 'legacyfeedwork1');
    assert.ok(item, "eski qatlamdagi asar lentadan yo'qolmasligi kerak");
    assert.equal(item.title, 'Legacy Feed Work');
    assert.equal(item.username, 'legacy_feed_owner');
  });

  test('yangi (relyatsion bazadagi) va eski asar birga, dublikatsiz ko\'rinadi', async () => {
    const modernWork = await uploadWork(seller, { title: 'Modern Feed Work' });
    const res = await viewer.get('/api/feed?limit=20');
    const ids = res.data.items.map(i => i.id);
    assert.ok(ids.includes('legacyfeedwork1'));
    assert.ok(ids.includes(modernWork.id));
    assert.equal(new Set(ids).size, ids.length, "dublikat bo'lmasligi kerak");
  });

  test('status filtri ikkala qatlamga ham qo\'llanadi', async () => {
    const expoWork = await uploadWork(seller, { title: 'Expo Work', status: 'expo' });
    const res = await viewer.get('/api/feed?status=sale&limit=20');
    const ids = res.data.items.map(i => i.id);
    assert.ok(!ids.includes(expoWork.id), "expo holatidagi asar 'sale' filtrida chiqmasligi kerak");
    assert.ok(ids.includes('legacyfeedwork1'), "eski qatlamdagi 'sale' asar chiqishi kerak");
  });

  test('narx oralig\'i filtri ikkala qatlamga ham qo\'llanadi', async () => {
    const res = await viewer.get('/api/feed?minPrice=14000&maxPrice=16000&limit=20');
    const ids = res.data.items.map(i => i.id);
    assert.ok(ids.includes('legacyfeedwork1'), "narx oralig'iga to'g'ri keladigan eski asar chiqishi kerak (15000)");
  });

  test('teg filtri ikkala qatlamga ham qo\'llanadi', async () => {
    const res = await viewer.get('/api/feed?tag=legacy&limit=20');
    const ids = res.data.items.map(i => i.id);
    assert.deepEqual(ids, ['legacyfeedwork1']);
  });

  test('qidiruv (q) ikkala qatlamda ham ishlaydi', async () => {
    const res = await viewer.get('/api/feed?q=' + encodeURIComponent('eski qatlamdagi') + '&limit=20');
    const ids = res.data.items.map(i => i.id);
    assert.ok(ids.includes('legacyfeedwork1'));
  });

  test('"faqat kuzatilganlar" (following) filtri ikkala qatlamdagi obunalarni hisobga oladi', async () => {
    const follower = await registerAndLogin(server.baseUrl, 'feedfollower1');
    await follower.post('/api/users/legacy_feed_owner/follow');
    await follower.post('/api/users/feedseller1/follow');

    const res = await follower.get('/api/feed?following=1&limit=20');
    const ids = res.data.items.map(i => i.id);
    assert.ok(ids.includes('legacyfeedwork1'), "eski (relyatsion bazada bo'lmagan) sotuvchiga obuna bo'lganda ham uning asari ko'rinishi kerak");
  });

  test('sahifalash (limit/offset) birlashtirilgan ro\'yxat bo\'yicha to\'g\'ri ishlaydi', async () => {
    const res1 = await viewer.get('/api/feed?limit=1&offset=0');
    const res2 = await viewer.get('/api/feed?limit=1&offset=1');
    assert.equal(res1.data.items.length, 1);
    assert.equal(res2.data.items.length, 1);
    assert.notEqual(res1.data.items[0].id, res2.data.items[0].id);
    assert.equal(res1.data.total, res2.data.total);
  });
});
