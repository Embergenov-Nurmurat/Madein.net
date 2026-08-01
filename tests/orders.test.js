const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function uploadWork(client, title, price = 60000) {
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

describe('Buyurtmalar (orders)', () => {
  let server, seller, buyer, work, orderId;
  before(async () => {
    server = await startTestServer();
    seller = await registerAndLogin(server.baseUrl, 'seller_ord');
    buyer = await registerAndLogin(server.baseUrl, 'buyer_ord');
    work = await uploadWork(seller, 'Buyurtma sinov asari');
    const buy = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'manual' });
    assert.equal(buy.status, 200);
    orderId = buy.data.orderId;
  });
  after(() => server.stop());

  test('xaridor buyurtmani o\'z tarixida (asBuyer) ko\'radi', async () => {
    const res = await buyer.get('/api/orders/mine');
    const found = res.data.asBuyer.find(o => o.id === orderId);
    assert.ok(found);
    assert.equal(found.status, 'placed');
    assert.equal(found.paymentMethod, 'manual');
  });

  test('sotuvchi ham xuddi shu buyurtmani (asSeller) ko\'radi', async () => {
    const res = await seller.get('/api/orders/mine');
    assert.ok(res.data.asSeller.some(o => o.id === orderId));
  });

  test('begona foydalanuvchi buyurtmalar ro\'yxatida bu buyurtmani ko\'rmaydi', async () => {
    const stranger = await registerAndLogin(server.baseUrl, 'stranger_ord');
    const res = await stranger.get('/api/orders/mine');
    assert.ok(!res.data.asBuyer.some(o => o.id === orderId));
    assert.ok(!res.data.asSeller.some(o => o.id === orderId));
  });

  test('sotuvchi buyurtma holatini yangilay oladi', async () => {
    const res = await seller.patch(`/api/orders/${orderId}/status`, { status: 'confirmed' });
    assert.equal(res.status, 200);
    assert.equal(res.data.order.status, 'confirmed');
  });

  test('begona foydalanuvchi buyurtma holatini o\'zgartira olmaydi', async () => {
    const stranger = await registerAndLogin(server.baseUrl, 'stranger_ord2');
    const res = await stranger.patch(`/api/orders/${orderId}/status`, { status: 'cancelled' });
    assert.notEqual(res.status, 200);
  });

  test('yangilangan holat xaridor tarixida ham ko\'rinadi', async () => {
    const res = await buyer.get('/api/orders/mine');
    const found = res.data.asBuyer.find(o => o.id === orderId);
    assert.equal(found.status, 'confirmed');
  });
});
