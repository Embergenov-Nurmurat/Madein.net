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

describe('Xabarlar (messages) — relyatsion bazaga dublikat yozish', () => {
  describe('matnli xabar', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('suhbat va xabar relyatsion bazaga to\'g\'ri yoziladi', async () => {
      const alice = await registerAndLogin(server.baseUrl, 'msgalice1');
      await registerAndLogin(server.baseUrl, 'msgbob1');

      const res = await alice.post('/api/conversations/msgbob1/messages', { text: 'Salom!' });
      assert.equal(res.status, 200);
      const messageId = res.data.message.id;

      const relDb = openRelDb(server);
      try {
        const convId = ['msgalice1', 'msgbob1'].sort().join('__');
        const conv = relDb.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
        assert.ok(conv, "suhbat relyatsion bazada bo'lishi kerak");

        const msg = relDb.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
        assert.ok(msg);
        assert.equal(msg.from_username, 'msgalice1');
        assert.equal(msg.to_username, 'msgbob1');
        assert.equal(msg.text, 'Salom!');
        assert.equal(msg.type, 'text');

        const readUpto = relDb.prepare('SELECT * FROM conversation_read_upto WHERE conversation_id = ? AND username = ?')
          .get(convId, 'msgalice1');
        assert.ok(readUpto, "yuboruvchi uchun readUpto o'rnatilishi kerak");
      } finally {
        relDb.close();
      }
    });

    test('suhbatni ochish (GET messages) readUpto ni yangilaydi', async () => {
      const alice = await registerAndLogin(server.baseUrl, 'msgalice2');
      const bob = await registerAndLogin(server.baseUrl, 'msgbob2');
      await alice.post('/api/conversations/msgbob2/messages', { text: 'Salom Bob!' });

      const res = await bob.get('/api/conversations/msgalice2/messages');
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        const convId = ['msgalice2', 'msgbob2'].sort().join('__');
        const readUpto = relDb.prepare('SELECT * FROM conversation_read_upto WHERE conversation_id = ? AND username = ?')
          .get(convId, 'msgbob2');
        assert.ok(readUpto, "o'quvchi uchun readUpto o'rnatilishi kerak");
      } finally {
        relDb.close();
      }
    });
  });

  describe('media xabar', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('rasm xabari content JSON bilan birga relyatsion bazaga yoziladi', async () => {
      const alice = await registerAndLogin(server.baseUrl, 'msgalice3');
      await registerAndLogin(server.baseUrl, 'msgbob3');

      const form = new FormData();
      form.append('type', 'photo');
      form.append('caption', 'Mana rasm');
      form.append('file', new Blob([tinyPngBuffer()], { type: 'image/png' }), 'photo.png');

      const res = await alice.request('POST', '/api/conversations/msgbob3/messages/media', form, { isForm: true });
      assert.equal(res.status, 200);
      const messageId = res.data.message.id;

      const relDb = openRelDb(server);
      try {
        const msg = relDb.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
        assert.ok(msg);
        assert.equal(msg.type, 'photo');
        assert.equal(msg.text, 'Mana rasm');
        assert.ok(msg.content, "media xabarda content JSON bo'lishi kerak (url va h.k.)");
        const content = JSON.parse(msg.content);
        assert.ok(content.url && content.url.startsWith('/uploads/'));
      } finally {
        relDb.close();
      }
    });
  });

  describe('buyurtma xabari (createOrderChatMessage)', () => {
    let server;
    before(async () => { server = await startTestServer(); });
    after(() => server.stop());

    test('buyurtma berilganda avtomatik "order" turidagi xabar relyatsion bazaga yoziladi', async () => {
      const owner = await registerAndLogin(server.baseUrl, 'msgowner4');
      const buyer = await registerAndLogin(server.baseUrl, 'msgbuyer4');
      const work = (await createWork(owner)).data.work;

      const res = await buyer.post(`/api/works/${work.id}/buy-now`, { paymentMethod: 'manual' });
      assert.equal(res.status, 200);

      const relDb = openRelDb(server);
      try {
        const convId = ['msgowner4', 'msgbuyer4'].sort().join('__');
        const rows = relDb.prepare('SELECT * FROM messages WHERE conversation_id = ? AND type = ?').all(convId, 'order');
        assert.equal(rows.length, 1);
        assert.equal(rows[0].from_username, 'msgbuyer4');
        assert.equal(rows[0].to_username, 'msgowner4');
        const content = JSON.parse(rows[0].content);
        assert.equal(content.orderId, res.data.orderId);
      } finally {
        relDb.close();
      }
    });
  });
});
