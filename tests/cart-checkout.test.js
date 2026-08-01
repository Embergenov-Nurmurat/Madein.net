const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function uploadWork(client, title, price = 50000) {
  const form = new FormData();
  form.append('title', title);
  form.append('type', 'rasm');
  form.append('status', 'sale');
  form.append('price', String(price));
  form.append('currency', 'UZS');
  form.append('desc', 'Sinov uchun');
  form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
  const res = await client.request('POST', '/api/works', form, { isForm: true });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.work;
}

describe('Savat va checkout', () => {
  let server, seller, buyer, work;
  before(async () => {
    server = await startTestServer();
    seller = await registerAndLogin(server.baseUrl, 'seller_cc');
    buyer = await registerAndLogin(server.baseUrl, 'buyer_cc');
    work = await uploadWork(seller, 'Savat sinov asari', 50000);
  });
  after(() => server.stop());

  test("o'z asarini savatga qo'shib bo'lmaydi", async () => {
    const res = await seller.post(`/api/works/${work.id}/cart-toggle`);
    assert.equal(res.status, 400);
  });

  test("boshqa foydalanuvchi asarni savatga qo'sha oladi", async () => {
    const res = await buyer.post(`/api/works/${work.id}/cart-toggle`);
    assert.equal(res.status, 200);
    assert.equal(res.data.inCart, true);
  });

  test('savat ro\'yxatida asar ko\'rinadi va summa to\'g\'ri hisoblanadi', async () => {
    const res = await buyer.get('/api/cart');
    assert.equal(res.data.count, 1);
    assert.equal(res.data.totalsByCurrency.UZS, 50000);
  });

  test("qayta bosilsa savatdan chiqariladi (toggle)", async () => {
    const res = await buyer.post(`/api/works/${work.id}/cart-toggle`);
    assert.equal(res.data.inCart, false);
    const cart = await buyer.get('/api/cart');
    assert.equal(cart.data.count, 0);
    // keyingi testlar uchun qaytadan qo'shamiz
    await buyer.post(`/api/works/${work.id}/cart-toggle`);
  });

  let orderId;
  test("checkout (qo'lda/manual to'lov) buyurtma yaratadi va savatni bo'shatadi", async () => {
    const res = await buyer.post('/api/cart/checkout', { paymentMethod: 'manual' });
    assert.equal(res.status, 200);
    assert.equal(res.data.paymentMethod, 'manual');
    assert.equal(res.data.totalsByCurrency.UZS, 50000);
    orderId = res.data.orderId;
    assert.ok(orderId);

    const cart = await buyer.get('/api/cart');
    assert.equal(cart.data.count, 0);
  });

  test('checkout\'dan keyin buyurtma xaridor tarixida ko\'rinadi', async () => {
    const res = await buyer.get('/api/orders/mine');
    assert.ok(res.data.asBuyer.some(o => o.id === orderId));
  });

  test("bo'sh savatni checkout qilib bo'lmaydi", async () => {
    const res = await buyer.post('/api/cart/checkout', { paymentMethod: 'manual' });
    assert.notEqual(res.status, 200);
  });
});
