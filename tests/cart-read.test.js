const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function uploadWork(client, overrides = {}) {
  const fields = Object.assign({
    title: 'Cart sinov asari', type: 'rasm', status: 'sale', price: '10000',
    currency: 'UZS', desc: 'sinov', stockMode: 'fixed', stockQty: '5'
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
  dbSqlite.saveUserRow(sqlite, 'legacy_cart_owner', {
    passwordHash: 'x', fullname: 'Legacy Owner', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: false,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: [], wishlist: [], cart: {}
  });
  sqlite.prepare(`INSERT INTO works (username, data) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET data = excluded.data`).run(
    'legacy_cart_owner', JSON.stringify([{
      id: 'legacywork_cart_1', owner: 'legacy_cart_owner', title: 'Legacy Cart Work', type: 'rasm',
      status: 'sale', price: 9000, currency: 'UZS', desc: '', image: '/uploads/legacy.jpg',
      images: ['/uploads/legacy.jpg'], thumbs: ['/uploads/legacy-thumb.jpg'], tags: [],
      likes: [], comments: [], reviews: [], createdAt: new Date().toISOString(), mediaType: 'image',
      stockMode: 'fixed', stockQty: 3
    }])
  );
  dbSqlite.closeDatabase(sqlite);
}

describe('GET /api/cart — relyatsion bazadan gibrid o\'qish', () => {
  let server, seller, buyer;

  before(async () => {
    server = await startTestServer({ preSeed: preSeedLegacyWork });
    seller = await registerAndLogin(server.baseUrl, 'cartreadseller');
    buyer = await registerAndLogin(server.baseUrl, 'cartreadbuyer');
  });
  after(() => server.stop());

  test("aralash holat: asar faqat eski qatlamda — savat elementi yo'qolmasligi kerak", async () => {
    const res = await buyer.post('/api/works/legacywork_cart_1/cart-toggle');
    assert.equal(res.status, 200);
    assert.equal(res.data.inCart, true);

    const relDb = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
    try {
      const row = relDb.prepare('SELECT 1 FROM cart_items WHERE username = ? AND work_id = ?')
        .get('cartreadbuyer', 'legacywork_cart_1');
      assert.equal(row, undefined);
    } finally { relDb.close(); }

    const cartRes = await buyer.get('/api/cart');
    assert.equal(cartRes.status, 200);
    const item = cartRes.data.items.find(i => i.id === 'legacywork_cart_1');
    assert.ok(item, "eski qatlamdagi savat elementi yo'qolmasligi kerak");
    assert.equal(item.title, 'Legacy Cart Work');
    assert.equal(item.username, 'legacy_cart_owner');

    await buyer.post('/api/works/legacywork_cart_1/cart-toggle');
  });

  test("miqdor zaxiradan oshib ketsa, avtomatik qisqartiriladi va ikkala bazada ham yangilanadi", async () => {
    const work = await uploadWork(seller, { stockQty: '2' });
    await buyer.post(`/api/works/${work.id}/cart-toggle`);
    await buyer.put(`/api/cart/${work.id}`, { qty: 2 });

    const relDb1 = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'));
    relDb1.prepare('UPDATE works SET stock_qty = 1 WHERE id = ?').run(work.id);
    relDb1.close();

    const res = await buyer.get('/api/cart');
    const item = res.data.items.find(i => i.id === work.id);
    assert.ok(item);
    assert.equal(item.qty, 1, "miqdor yangi zaxira chegarasigacha qisqarishi kerak");

    const relDb2 = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
    try {
      const row = relDb2.prepare('SELECT qty FROM cart_items WHERE username = ? AND work_id = ?')
        .get('cartreadbuyer', work.id);
      assert.equal(row.qty, 1, "relyatsion bazadagi miqdor ham yangilanishi kerak");
    } finally { relDb2.close(); }
  });

  test('sotuvdan olib tashlangan (expo) asar savatdan avtomatik chiqariladi', async () => {
    const work = await uploadWork(seller);
    await buyer.post(`/api/works/${work.id}/cart-toggle`);
    await seller.patch(`/api/works/${work.id}/status`, { status: 'expo' });

    const res = await buyer.get('/api/cart');
    assert.equal(res.data.items.find(i => i.id === work.id), undefined);

    const relDb = new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
    try {
      const row = relDb.prepare('SELECT 1 FROM cart_items WHERE username = ? AND work_id = ?').get('cartreadbuyer', work.id);
      assert.equal(row, undefined, "relyatsion savatdan ham olib tashlanishi kerak");
    } finally { relDb.close(); }
  });
});
