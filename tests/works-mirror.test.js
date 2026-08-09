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
    status: 'sale', stockMode: 'fixed', stockQty: '5', tags: 'keramika,vaza'
  }, overrides);
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('images', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'test.png');
  return client.request('POST', '/api/works', form, { isForm: true });
}

describe('Asarlar (works) — relyatsion bazaga dublikat yozish', () => {
  let server;
  before(async () => { server = await startTestServer(); });
  after(() => server.stop());

  test('asar yaratish relyatsion bazaga rasm/teg bilan yoziladi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'workowner1');
    const res = await createWork(client);
    assert.equal(res.status, 200);
    const workId = res.data.work.id;

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT * FROM works WHERE id = ?').get(workId);
      assert.ok(row, "asar relyatsion bazada topilishi kerak");
      assert.equal(row.title, 'Test asar');
      assert.equal(row.owner, 'workowner1');
      assert.equal(row.status, 'sale');
      assert.equal(row.stock_qty, 5);

      const tags = relDb.prepare('SELECT tag FROM work_tags WHERE work_id = ?').all(workId).map(t => t.tag).sort();
      assert.deepEqual(tags, ['keramika', 'vaza']);

      const images = relDb.prepare('SELECT * FROM work_images WHERE work_id = ?').all(workId);
      assert.equal(images.length, 1);
    } finally {
      relDb.close();
    }
  });

  test("holat/narx o'zgarishi (PATCH status) relyatsion bazaga yoziladi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'workowner2');
    const res = await createWork(client);
    const workId = res.data.work.id;

    const patchRes = await client.patch(`/api/works/${workId}/status`, { status: 'expo' });
    assert.equal(patchRes.status, 200);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT status, price FROM works WHERE id = ?').get(workId);
      assert.equal(row.status, 'expo');
      assert.equal(row.price, 0);
    } finally {
      relDb.close();
    }
  });

  test('layk bosish/olib tashlash relyatsion bazaga yoziladi', async () => {
    const owner = await registerAndLogin(server.baseUrl, 'workowner3');
    const liker = await registerAndLogin(server.baseUrl, 'workliker3');
    const res = await createWork(owner);
    const workId = res.data.work.id;

    let likeRes = await liker.post(`/api/works/${workId}/like`);
    assert.equal(likeRes.data.liked, true);
    let relDb = openRelDb(server);
    try {
      assert.ok(relDb.prepare('SELECT 1 FROM likes WHERE work_id = ? AND username = ?').get(workId, 'workliker3'));
    } finally { relDb.close(); }

    likeRes = await liker.post(`/api/works/${workId}/like`);
    assert.equal(likeRes.data.liked, false);
    relDb = openRelDb(server);
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM likes WHERE work_id = ? AND username = ?').get(workId, 'workliker3'), undefined);
    } finally { relDb.close(); }
  });

  test('komment qo\'shish va o\'chirish relyatsion bazaga aks etadi', async () => {
    const owner = await registerAndLogin(server.baseUrl, 'workowner4');
    const commenter = await registerAndLogin(server.baseUrl, 'workcommenter4');
    const res = await createWork(owner);
    const workId = res.data.work.id;

    const commentRes = await commenter.post(`/api/works/${workId}/comments`, { text: 'Zo\'r ish!' });
    assert.equal(commentRes.status, 200);
    const commentId = commentRes.data.comment.id;

    let relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
      assert.ok(row);
      assert.equal(row.text, "Zo'r ish!");
    } finally { relDb.close(); }

    const delRes = await commenter.delete(`/api/works/${workId}/comments/${commentId}`);
    assert.equal(delRes.status, 200);

    relDb = openRelDb(server);
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM comments WHERE id = ?').get(commentId), undefined);
    } finally { relDb.close(); }
  });

  test('ko\'rishlar soni (views) relyatsion bazaga yoziladi', async () => {
    const owner = await registerAndLogin(server.baseUrl, 'workowner5');
    const res = await createWork(owner);
    const workId = res.data.work.id;

    const viewer = new Client(server.baseUrl);
    await viewer.post(`/api/works/${workId}/view`);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT views FROM works WHERE id = ?').get(workId);
      assert.equal(row.views, 1);
    } finally { relDb.close(); }
  });

  test('asarni o\'chirish relyatsion bazadan ham o\'chiradi (CASCADE bilan)', async () => {
    const owner = await registerAndLogin(server.baseUrl, 'workowner6');
    const res = await createWork(owner);
    const workId = res.data.work.id;

    const delRes = await owner.delete(`/api/works/${workId}`);
    assert.equal(delRes.status, 200);

    const relDb = openRelDb(server);
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM works WHERE id = ?').get(workId), undefined);
      assert.equal(relDb.prepare('SELECT COUNT(*) AS n FROM work_images WHERE work_id = ?').get(workId).n, 0);
      assert.equal(relDb.prepare('SELECT COUNT(*) AS n FROM work_tags WHERE work_id = ?').get(workId).n, 0);
    } finally { relDb.close(); }
  });
});
