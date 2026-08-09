const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const crypto = require('crypto');
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

async function paymeRpc(baseUrl, method, params) {
  const auth = 'Basic ' + Buffer.from('Paycom:test-payme-secret').toString('base64');
  const res = await fetch(baseUrl + '/api/payments/payme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  return { status: res.status, data: await res.json() };
}

function md5(str) { return crypto.createHash('md5').update(str).digest('hex'); }

async function clickRequest(baseUrl, path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

describe("To'lov webhook'lari (Payme/Click) — relyatsion bazaga dublikat yozish", () => {
  describe('Payme', () => {
    let server;
    before(async () => {
      server = await startTestServer({ env: { PAYME_MERCHANT_ID: 'test-merchant', PAYME_SECRET_KEY: 'test-payme-secret' } });
    });
    after(() => server.stop());

    test("CreateTransaction va PerformTransaction to'lov holatini relyatsion bazaga yozadi", async () => {
      const owner = await registerAndLogin(server.baseUrl, 'payowner1');
      const buyer = await registerAndLogin(server.baseUrl, 'paybuyer1');
      const work = (await createWork(owner, { price: '10000' })).data.work;
      const checkoutRes = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'payme' });
      const orderId = checkoutRes.data.orderId;
      assert.equal(checkoutRes.data.paymentMethod, 'payme');

      const amountTiyin = 10000 * 100;
      const txId = 'paymetx1';

      const createRes = await paymeRpc(server.baseUrl, 'CreateTransaction', {
        id: txId, time: Date.now(), amount: amountTiyin, account: { order_id: orderId }
      });
      assert.ok(createRes.data.result, JSON.stringify(createRes.data));

      let relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT payment_status, payment_meta FROM orders WHERE id = ?').get(orderId);
        assert.equal(row.payment_status, 'pending');
        const meta = JSON.parse(row.payment_meta);
        assert.ok(meta.payme.transactions[txId], "payme tranzaksiyasi payment_meta ichida bo'lishi kerak");
        assert.equal(meta.payme.transactions[txId].state, 1);
      } finally { relDb.close(); }

      const performRes = await paymeRpc(server.baseUrl, 'PerformTransaction', { id: txId });
      assert.ok(performRes.data.result, JSON.stringify(performRes.data));

      relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT status, payment_status, paid_at, payment_meta FROM orders WHERE id = ?').get(orderId);
        assert.equal(row.payment_status, 'paid');
        assert.equal(row.status, 'confirmed');
        assert.ok(row.paid_at);
        const meta = JSON.parse(row.payment_meta);
        assert.equal(meta.payme.transactions[txId].state, 2);
      } finally { relDb.close(); }
    });

    test('CancelTransaction bekor qilingan holatni relyatsion bazaga yozadi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'payowner2');
      const buyer = await registerAndLogin(server.baseUrl, 'paybuyer2');
      const work = (await createWork(owner, { price: '5000' })).data.work;
      const checkoutRes = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'payme' });
      const orderId = checkoutRes.data.orderId;
      const txId = 'paymetx2';

      await paymeRpc(server.baseUrl, 'CreateTransaction', {
        id: txId, time: Date.now(), amount: 5000 * 100, account: { order_id: orderId }
      });
      const cancelRes = await paymeRpc(server.baseUrl, 'CancelTransaction', { id: txId, reason: 1 });
      assert.ok(cancelRes.data.result, JSON.stringify(cancelRes.data));

      const relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT status, payment_status FROM orders WHERE id = ?').get(orderId);
        assert.equal(row.payment_status, 'failed');
        assert.equal(row.status, 'cancelled');
      } finally { relDb.close(); }
    });
  });

  describe('Click', () => {
    let server;
    before(async () => {
      server = await startTestServer({
        env: {
          CLICK_SERVICE_ID: '1', CLICK_MERCHANT_ID: 'test-click-merchant',
          CLICK_SECRET_KEY: 'test-click-secret', CLICK_MERCHANT_USER_ID: 'test-user'
        }
      });
    });
    after(() => server.stop());

    test("Prepare va Complete to'lov holatini relyatsion bazaga yozadi", async () => {
      const owner = await registerAndLogin(server.baseUrl, 'clickowner1');
      const buyer = await registerAndLogin(server.baseUrl, 'clickbuyer1');
      const work = (await createWork(owner, { price: '20000' })).data.work;
      const checkoutRes = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'click' });
      const orderId = checkoutRes.data.orderId;
      assert.equal(checkoutRes.data.paymentMethod, 'click');

      const clickTransId = '999111';
      const serviceId = '1';
      const amount = '20000';
      const signTime = '2026-01-01 00:00:00';
      const secret = 'test-click-secret';

      const prepareSign = md5(`${clickTransId}${serviceId}${secret}${orderId}${amount}0${signTime}`);
      const prepareRes = await clickRequest(server.baseUrl, '/api/payments/click/prepare', {
        click_trans_id: clickTransId, service_id: serviceId, merchant_trans_id: orderId,
        amount, action: 0, sign_time: signTime, sign_string: prepareSign
      });
      assert.equal(prepareRes.data.error, 0, JSON.stringify(prepareRes.data));

      let relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT payment_status, payment_meta FROM orders WHERE id = ?').get(orderId);
        assert.equal(row.payment_status, 'pending');
        const meta = JSON.parse(row.payment_meta);
        assert.equal(meta.click.prepareId, String(clickTransId));
      } finally { relDb.close(); }

      const mprepId = clickTransId;
      const completeSign = md5(`${clickTransId}${serviceId}${secret}${orderId}${mprepId}${amount}1${signTime}`);
      const completeRes = await clickRequest(server.baseUrl, '/api/payments/click/complete', {
        click_trans_id: clickTransId, service_id: serviceId, merchant_trans_id: orderId,
        merchant_prepare_id: mprepId, amount, action: 1, sign_time: signTime, sign_string: completeSign, error: 0
      });
      assert.equal(completeRes.data.error, 0, JSON.stringify(completeRes.data));

      relDb = openRelDb(server);
      try {
        const row = relDb.prepare('SELECT status, payment_status, paid_at FROM orders WHERE id = ?').get(orderId);
        assert.equal(row.payment_status, 'paid');
        assert.equal(row.status, 'confirmed');
        assert.ok(row.paid_at);
      } finally { relDb.close(); }
    });
  });
});
