const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Database = require('better-sqlite3');
const { startTestServer, Client, registerAndLogin, tinyPngBuffer } = require('./helpers');

function openRelDb(server) {
  return new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
}

async function createWork(client, overrides = {}) {
  const fields = Object.assign({
    title: 'Test asar', type: 'rasm', desc: 'tavsif', price: '10000', currency: 'UZS',
    status: 'sale', stockMode: 'fixed', stockQty: '5', tags: 'keramika'
  }, overrides);
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
  return client.request('POST', '/api/works', form, { isForm: true });
}

describe('Savat / Xohishlar / To\'plamlar — relyatsion bazaga dublikat yozish', () => {
  describe('savat (cart)', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('cart-toggle qo\'shish/olib tashlash relyatsion "cart_items" jadvaliga yoziladi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'cartowner1');
      const buyer = await registerAndLogin(server.baseUrl, 'cartbuyer1');
      const work = (await createWork(owner)).data.work;

      let res = await buyer.post(`/api/works/${work.id}/cart-toggle`);
      assert.equal(res.data.inCart, true);
      let relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT qty FROM cart_items WHERE username = ? AND work_id = ?').get('cartbuyer1', work.id);
        assert.equal(row.qty, 1);
      } finally { relDb.close(); }

      res = await buyer.post(`/api/works/${work.id}/cart-toggle`);
      assert.equal(res.data.inCart, false);
      relDb = openRelDb(server);
      try {
        assert.equal(relDb.prepare('SELECT 1 FROM cart_items WHERE username = ? AND work_id = ?').get('cartbuyer1', work.id), undefined);
      } finally { relDb.close(); }
    });

    test('PUT /api/cart/:id miqdorni yangilaydi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'cartowner2');
      const buyer = await registerAndLogin(server.baseUrl, 'cartbuyer2');
      const work = (await createWork(owner, { stockQty: '10' })).data.work;
      await buyer.post(`/api/works/${work.id}/cart-toggle`);

      const res = await buyer.put(`/api/cart/${work.id}`, { qty: 4 });
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT qty FROM cart_items WHERE username = ? AND work_id = ?').get('cartbuyer2', work.id);
        assert.equal(row.qty, 4);
      } finally { relDb.close(); }
    });

    test('DELETE /api/cart/:id relyatsion bazadan ham o\'chiradi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'cartowner3');
      const buyer = await registerAndLogin(server.baseUrl, 'cartbuyer3');
      const work = (await createWork(owner)).data.work;
      await buyer.post(`/api/works/${work.id}/cart-toggle`);

      const res = await buyer.delete(`/api/cart/${work.id}`);
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        assert.equal(relDb.prepare('SELECT 1 FROM cart_items WHERE username = ? AND work_id = ?').get('cartbuyer3', work.id), undefined);
      } finally { relDb.close(); }
    });

    test('checkout dan keyin savat relyatsion bazada ham bo\'shaydi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'cartowner4');
      const buyer = await registerAndLogin(server.baseUrl, 'cartbuyer4');
      const work = (await createWork(owner)).data.work;
      await buyer.post(`/api/works/${work.id}/cart-toggle`);

      const res = await buyer.post('/api/cart/checkout', { paymentMethod: 'manual' });
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        const rows = relDb.prepare('SELECT * FROM cart_items WHERE username = ?').all('cartbuyer4');
        assert.equal(rows.length, 0);
      } finally { relDb.close(); }
    });
  });

  describe('xohishlar ro\'yxati (wishlist)', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('wishlist toggle relyatsion bazaga yoziladi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'wishowner1');
      const buyer = await registerAndLogin(server.baseUrl, 'wishbuyer1');
      const work = (await createWork(owner)).data.work;

      let res = await buyer.post(`/api/works/${work.id}/wishlist`);
      assert.equal(res.data.saved, true);
      let relDb = openRelDb(server);
      try {
        assert.ok(relDb.prepare('SELECT 1 FROM wishlist_items WHERE username = ? AND work_id = ?').get('wishbuyer1', work.id));
      } finally { relDb.close(); }

      res = await buyer.post(`/api/works/${work.id}/wishlist`);
      assert.equal(res.data.saved, false);
      relDb = openRelDb(server);
      try {
        assert.equal(relDb.prepare('SELECT 1 FROM wishlist_items WHERE username = ? AND work_id = ?').get('wishbuyer1', work.id), undefined);
      } finally { relDb.close(); }
    });
  });

  describe('to\'plamlar (collections)', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('to\'plam yaratish relyatsion bazaga yoziladi', async () => {
      const client = await registerAndLogin(server.baseUrl, 'coluser1');
      const res = await client.post('/api/collections', { name: 'Sevimlilar' });
      assert.equal(res.status, 200);
      const colId = res.data.collection.id;

      const relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT * FROM collections WHERE id = ?').get(colId);
        assert.ok(row);
        assert.equal(row.name, 'Sevimlilar');
        assert.equal(row.username, 'coluser1');
      } finally { relDb.close(); }
    });

    test('to\'plamga asar qo\'shish/olib tashlash va nomini o\'zgartirish', async () => {
      const client = await registerAndLogin(server.baseUrl, 'coluser2');
      const work = (await createWork(client)).data.work;
      const colRes = await client.post('/api/collections', { name: 'Boshlangich' });
      const colId = colRes.data.collection.id;

      let res = await client.put(`/api/collections/${colId}`, { addWorkId: work.id, name: "Yangilangan nom" });
      assert.equal(res.status, 200);

      let relDb = openRelDb(server);
      try {
        assert.equal(relDb.prepare('SELECT name FROM collections WHERE id = ?').get(colId).name, "Yangilangan nom");
        assert.ok(relDb.prepare('SELECT 1 FROM collection_items WHERE collection_id = ? AND work_id = ?').get(colId, work.id));
      } finally { relDb.close(); }

      res = await client.put(`/api/collections/${colId}`, { removeWorkId: work.id });
      assert.equal(res.status, 200);

      relDb = openRelDb(server);
      try {
        assert.equal(relDb.prepare('SELECT 1 FROM collection_items WHERE collection_id = ? AND work_id = ?').get(colId, work.id), undefined);
      } finally { relDb.close(); }
    });

    test('to\'plamni o\'chirish relyatsion bazadan ham o\'chiradi (CASCADE bilan)', async () => {
      const client = await registerAndLogin(server.baseUrl, 'coluser3');
      const work = (await createWork(client)).data.work;
      const colRes = await client.post('/api/collections', { name: 'Vaqtinchalik' });
      const colId = colRes.data.collection.id;
      await client.put(`/api/collections/${colId}`, { addWorkId: work.id });

      const res = await client.delete(`/api/collections/${colId}`);
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        assert.equal(relDb.prepare('SELECT 1 FROM collections WHERE id = ?').get(colId), undefined);
        assert.equal(relDb.prepare('SELECT COUNT(*) AS n FROM collection_items WHERE collection_id = ?').get(colId).n, 0);
      } finally { relDb.close(); }
    });
  });
});
