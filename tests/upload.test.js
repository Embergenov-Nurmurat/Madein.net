const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

describe('Asar yuklash (upload)', () => {
  let server, seller;
  before(async () => {
    server = await startTestServer();
    seller = await registerAndLogin(server.baseUrl, 'seller_up');
  });
  after(() => server.stop());

  test('haqiqiy rasm bilan asar muvaffaqiyatli yuklanadi', async () => {
    const form = new FormData();
    form.append('title', 'Sinov asari');
    form.append('type', 'rasm');
    form.append('status', 'sale');
    form.append('price', '75000');
    form.append('currency', 'UZS');
    form.append('desc', 'Test uchun yaratilgan asar');
    form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');

    const res = await seller.request('POST', '/api/works', form, { isForm: true });
    assert.equal(res.status, 200);
    assert.equal(res.data.work.title, 'Sinov asari');
    assert.ok(res.data.work.images[0].endsWith('.png'));
  });

  test("yuklangan asar feed ichida ko'rinadi", async () => {
    const res = await seller.get('/api/feed?status=sale');
    assert.ok(res.data.items.some(w => w.title === 'Sinov asari'));
  });

  test('soxta rasm (mimetype spoofing) rad etiladi', async () => {
    const form = new FormData();
    form.append('title', 'Yomon fayl');
    form.append('type', 'rasm');
    form.append('status', 'sale');
    form.append('price', '10000');
    form.append('currency', 'UZS');
    form.append('desc', 'x');
    form.append('images', new Blob([Buffer.from('bu haqiqiy rasm emas, oddiy matn')], { type: 'image/jpeg' }), 'fake.jpg');

    const res = await seller.request('POST', '/api/works', form, { isForm: true });
    assert.equal(res.status, 400);
    assert.equal(res.data.code, 'invalidImageContent');
  });

  test('nom (title) kiritilmasa rad etiladi', async () => {
    const form = new FormData();
    form.append('type', 'rasm');
    form.append('status', 'sale');
    form.append('price', '10000');
    form.append('currency', 'UZS');
    form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');

    const res = await seller.request('POST', '/api/works', form, { isForm: true });
    assert.notEqual(res.status, 200);
  });
});
