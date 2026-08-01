const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
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

describe('Saqlanganlar (wishlist)', () => {
  let server, seller, user, work;
  before(async () => {
    server = await startTestServer();
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
});
