const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, registerAndLogin, tinyPngBuffer } = require('./helpers');

async function uploadWork(client, title) {
  const form = new FormData();
  form.append('title', title);
  form.append('type', 'rasm');
  form.append('status', 'sale');
  form.append('price', '40000');
  form.append('currency', 'UZS');
  form.append('desc', 'Sinov uchun');
  form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
  const res = await client.request('POST', '/api/works', form, { isForm: true });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.work;
}

describe("To'plamlar (collections) — qo'shish/olib tashlash/o'chirish", () => {
  let server, user, work, work2, collectionId;
  before(async () => {
    server = await startTestServer();
    user = await registerAndLogin(server.baseUrl, 'coluser1');
    work = await uploadWork(user, "To'plam sinov asari 1");
    work2 = await uploadWork(user, "To'plam sinov asari 2");
  });
  after(() => server.stop());

  test("yangi to'plam yaratish", async () => {
    const res = await user.post('/api/collections', { name: 'Mening sevimlilarim' });
    assert.equal(res.status, 200);
    assert.equal(res.data.collection.name, 'Mening sevimlilarim');
    assert.deepEqual(res.data.collection.workIds, []);
    collectionId = res.data.collection.id;
  });

  test("to'plamga asar qo'shish", async () => {
    const res = await user.put(`/api/collections/${collectionId}`, { addWorkId: work.id });
    assert.equal(res.status, 200);
    assert.ok(res.data.collection.workIds.includes(work.id));
  });

  test("to'plam ro'yxatida (GET /api/collections/:username) asar to'g'ri ko'rinadi — bu ilgari frontend integratsiyasi yo'qligi sababli sinalmagan buzilish", async () => {
    const res = await user.get(`/api/collections/coluser1`);
    const col = res.data.items.find(c => c.id === collectionId);
    assert.ok(col, "to'plam ro'yxatda topilmadi");
    assert.equal(col.works.length, 1);
    assert.equal(col.works[0].id, work.id);
  });

  test("to'plamga ikkinchi asarni ham qo'shish mumkin", async () => {
    const res = await user.put(`/api/collections/${collectionId}`, { addWorkId: work2.id });
    assert.equal(res.data.collection.workIds.length, 2);
  });

  test("to'plamdan bitta asarni olib tashlash", async () => {
    const res = await user.put(`/api/collections/${collectionId}`, { removeWorkId: work.id });
    assert.equal(res.status, 200);
    assert.ok(!res.data.collection.workIds.includes(work.id));
    assert.ok(res.data.collection.workIds.includes(work2.id));
  });

  test("to'plam nomini o'zgartirish", async () => {
    const res = await user.put(`/api/collections/${collectionId}`, { name: 'Yangi nom' });
    assert.equal(res.data.collection.name, 'Yangi nom');
  });

  test("to'plamni butunlay o'chirish", async () => {
    const res = await user.delete(`/api/collections/${collectionId}`);
    assert.equal(res.status, 200);
    const list = await user.get('/api/collections/coluser1');
    assert.ok(!list.data.items.some(c => c.id === collectionId));
  });

  test("o'chirilgan to'plamni qayta o'chirishga urinish 404 qaytaradi", async () => {
    const res = await user.delete(`/api/collections/${collectionId}`);
    assert.equal(res.status, 404);
  });

  test("boshqa foydalanuvchi to'plamini o'zgartira olmaydi", async () => {
    const other = await registerAndLogin(server.baseUrl, 'coluser2');
    const create = await user.post('/api/collections', { name: "Himoyalangan to'plam" });
    const res = await other.put(`/api/collections/${create.data.collection.id}`, { name: 'Buzilgan' });
    assert.equal(res.status, 404); // begona foydalanuvchi uchun bunday to'plam "topilmaydi"
  });
});
