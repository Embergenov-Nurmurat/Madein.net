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

describe('Buyurtmalar (orders) — relyatsion bazaga dublikat yozish', () => {
  describe('savat orqali checkout', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('checkout buyurtma va uning itemlarini relyatsion bazaga yozadi, zaxirani kamaytiradi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'ordowner1');
      const buyer = await registerAndLogin(server.baseUrl, 'ordbuyer1');
      const work = (await createWork(owner, { stockQty: '5' })).data.work;
      await buyer.post(`/api/works/${work.id}/cart-toggle`);

      const res = await buyer.post('/api/cart/checkout', { paymentMethod: 'manual' });
      assert.equal(res.status, 200);
      const orderId = res.data.orderId;

      const relDb = openRelDb(server);
      try {
        const order = relDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        assert.ok(order, "buyurtma relyatsion bazada bo'lishi kerak");
        assert.equal(order.buyer, 'ordbuyer1');
        assert.equal(order.status, 'placed');

        const items = relDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
        assert.equal(items.length, 1);
        assert.equal(items[0].work_id, work.id);
        assert.equal(items[0].seller_username, 'ordowner1');
        assert.equal(items[0].qty, 1);

        const workRow = relDb.prepare('SELECT stock_qty FROM works WHERE id = ?').get(work.id);
        assert.equal(workRow.stock_qty, 4, "zaxira 5 dan 4 ga kamayishi kerak");
      } finally {
        relDb.close();
      }
    });
  });

  describe('hoziroq sotib olish (buy-now)', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('buy-now buyurtmani relyatsion bazaga yozadi va savatdan olib tashlaydi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'ordowner2');
      const buyer = await registerAndLogin(server.baseUrl, 'ordbuyer2');
      const work = (await createWork(owner, { stockQty: '3' })).data.work;

      const res = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'manual' });
      assert.equal(res.status, 200);
      const orderId = res.data.orderId;

      const relDb = openRelDb(server);
      try {
        const order = relDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        assert.ok(order);
        const items = relDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
        assert.equal(items.length, 1);
        assert.equal(items[0].qty, 1);

        const workRow = relDb.prepare('SELECT stock_qty FROM works WHERE id = ?').get(work.id);
        assert.equal(workRow.stock_qty, 2);

        const cartRow = relDb.prepare('SELECT 1 FROM cart_items WHERE username = ? AND work_id = ?').get('ordbuyer2', work.id);
        assert.equal(cartRow, undefined);
      } finally {
        relDb.close();
      }
    });
  });

  describe('buyurtma holatini o\'zgartirish', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('sotuvchi holatni o\'zgartirsa relyatsion bazaga ham yoziladi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'ordowner3');
      const buyer = await registerAndLogin(server.baseUrl, 'ordbuyer3');
      const work = (await createWork(owner)).data.work;
      const checkoutRes = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'manual' });
      const orderId = checkoutRes.data.orderId;

      const res = await owner.patch(`/api/orders/${orderId}/status`, {
        status: 'shipped', trackingNumber: 'TRACK123', carrier: 'UzPost'
      });
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        const order = relDb.prepare('SELECT status, tracking_number, carrier FROM orders WHERE id = ?').get(orderId);
        assert.equal(order.status, 'shipped');
        assert.equal(order.tracking_number, 'TRACK123');
        assert.equal(order.carrier, 'UzPost');
      } finally {
        relDb.close();
      }
    });
  });
});
