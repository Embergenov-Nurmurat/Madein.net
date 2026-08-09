const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const dbSqlite = require('../db-sqlite');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function uploadWork(client, title) {
  const form = new FormData();
  form.append('title', title);
  form.append('type', 'rasm');
  form.append('status', 'sale');
  form.append('price', '30000');
  form.append('currency', 'UZS');
  form.append('desc', 'Sinov uchun');
  form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
  const res = await client.request('POST', '/api/works', form, { isForm: true });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.work;
}

/* server ishga tushishidan OLDIN eski (JSON-blob) qatlamga to'g'ridan-to'g'ri
   "legacy" asar qo'shadi — server buni `loadDB()` orqali ishga tushishida
   xotiraga o'qib oladi, lekin relyatsion bazaga HECH QACHON yozilmagan
   bo'ladi (chunki dual-write faqat YANGI amallar uchun ishlaydi). */
async function preSeedLegacyWork(storageDir) {
  const fs = require('fs');
  const dataDir = path.join(storageDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = dbSqlite.openDatabase(dataDir);
  dbSqlite.saveUserRow(sqlite, 'legacy_wl_owner', {
    passwordHash: 'x', fullname: 'Legacy Owner', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: false,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: [], wishlist: [], cart: {}
  });
  sqlite.prepare(`INSERT INTO works (username, data) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET data = excluded.data`).run(
    'legacy_wl_owner', JSON.stringify([{
      id: 'legacywork_wl_1', owner: 'legacy_wl_owner', title: 'Legacy Wishlist Work', type: 'rasm',
      status: 'sale', price: 7000, currency: 'UZS', desc: '', image: '/uploads/legacy.jpg',
      images: ['/uploads/legacy.jpg'], thumbs: ['/uploads/legacy-thumb.jpg'], tags: [],
      likes: [], comments: [], reviews: [], createdAt: new Date().toISOString(), mediaType: 'image'
    }])
  );
  dbSqlite.closeDatabase(sqlite);
}

describe('Saqlanganlar (wishlist)', () => {
  let server, seller, user, work;
  before(async () => {
    server = await startTestServer({ preSeed: preSeedLegacyWork });
    seller = await registerAndLogin(server.baseUrl, 'seller_wl');
    user = await registerAndLogin(server.baseUrl, 'user_wl');
    work = await uploadWork(seller, 'Wishlist sinov asari');
  });
  after(() => server.stop());

  test('boshida wishlist bo\'sh', async () => {
    const res = await user.get('/api/wishlist');
    assert.equal(res.data.items.length, 0);
  });

  test('asarni wishlist\'ga qo\'shish mumkin', async () => {
    const res = await user.post(`/api/works/${work.id}/wishlist`);
    assert.equal(res.status, 200);
    assert.equal(res.data.saved, true);
  });

  test('qo\'shilgan asar wishlist ro\'yxatida ko\'rinadi', async () => {
    const res = await user.get('/api/wishlist');
    assert.equal(res.data.items.length, 1);
    assert.equal(res.data.items[0].id, work.id);
  });

  test('qayta bosilsa wishlist\'dan olib tashlanadi (toggle)', async () => {
    const res = await user.post(`/api/works/${work.id}/wishlist`);
    assert.equal(res.data.saved, false);
    const list = await user.get('/api/wishlist');
    assert.equal(list.data.items.length, 0);
  });

  test('login qilmagan holda wishlist\'ga qo\'shib bo\'lmaydi', async () => {
    const { Client } = require('./helpers');
    const guest = new Client(server.baseUrl);
    const res = await guest.post(`/api/works/${work.id}/wishlist`);
    assert.equal(res.status, 401);
  });

  test("aralash holat: asar faqat eski qatlamda, foydalanuvchi esa relyatsion bazada bor — element yo'qolmasligi kerak", async () => {
    // Bu ssenariy amalda quyidagicha yuzaga kelishi mumkin: asar dual-write
    // yoqilishidan OLDIN yaratilgan (faqat eski qatlamda bor), lekin
    // wishlist'ga qo'shayotgan foydalanuvchi YANGI (relyatsion bazada bor).
    // `user_wl` shu asarni ODATDAGI marshrut orqali wishlist'ga qo'shadi —
    // eski qatlamga muvaffaqiyatli yoziladi, lekin relyatsion "wishlist_items"
    // uchun FOREIGN KEY (works jadvalida bunday asar yo'q) buni jimgina
    // to'xtatadi. GET /api/wishlist shunga qaramay elementni ko'rsata olishi
    // kerak (eski+yangi ro'yxatlar union qilingani uchun).
    const legacyWorkId = 'legacywork_wl_1';
    const res = await user.post(`/api/works/${legacyWorkId}/wishlist`);
    assert.equal(res.status, 200);
    assert.equal(res.data.saved, true);

    // relyatsion bazada ushbu element YO'QLIGINI tasdiqlaymiz (FK to'xtatgan)
    const Database = require('better-sqlite3');
    const relDb = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
    try {
      const row = relDb.prepare('SELECT 1 FROM wishlist_items WHERE username = ? AND work_id = ?').get('user_wl', legacyWorkId);
      assert.equal(row, undefined, "FOREIGN KEY sababli relyatsion bazaga yozilmagan bo'lishi kerak — bu test aynan shu holatni tekshiradi");
    } finally {
      relDb.close();
    }

    const listRes = await user.get('/api/wishlist');
    assert.equal(listRes.status, 200);
    const item = listRes.data.items.find(i => i.id === legacyWorkId);
    assert.ok(item, "eski qatlamdagi asar wishlist javobida yo'qolmasligi kerak");
    assert.equal(item.title, 'Legacy Wishlist Work');
    assert.equal(item.username, 'legacy_wl_owner');
  });
});
