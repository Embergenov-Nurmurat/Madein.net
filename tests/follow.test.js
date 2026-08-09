const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Database = require('better-sqlite3');
const { startTestServer, Client, registerAndLogin } = require('./helpers');

function openRelDb(server) {
  return new Database(path.join(server.storageDir, 'data', 'madein-relational.db'), { readonly: true });
}

describe('Obuna bo\'lish / bekor qilish — relyatsion baza', () => {
  let server;
  before(async () => { server = await startTestServer(); });
  after(() => server.stop());

  test('obuna bo\'lish relyatsion "follows" jadvaliga yoziladi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'followuser1');
    await registerAndLogin(server.baseUrl, 'followuser1target');

    const res = await client.post('/api/users/followuser1target/follow');
    assert.equal(res.status, 200);
    assert.equal(res.data.following, true);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT * FROM follows WHERE follower = ? AND followee = ?')
        .get('followuser1', 'followuser1target');
      assert.ok(row, "follows jadvalida yozuv bo'lishi kerak");
    } finally {
      relDb.close();
    }
  });

  test('qayta bosish obunani bekor qiladi va relyatsion bazadan o\'chiradi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'followuser2');
    await registerAndLogin(server.baseUrl, 'followuser2target');

    await client.post('/api/users/followuser2target/follow'); // obuna bo'lish
    const res = await client.post('/api/users/followuser2target/follow'); // bekor qilish (toggle)
    assert.equal(res.status, 200);
    assert.equal(res.data.following, false);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT * FROM follows WHERE follower = ? AND followee = ?')
        .get('followuser2', 'followuser2target');
      assert.equal(row, undefined, "bekor qilingandan keyin yozuv bo'lmasligi kerak");
    } finally {
      relDb.close();
    }
  });

  test('obuna bo\'lgach follow bildirishnomasi ham relyatsion bazaga yoziladi', async () => {
    const client = await registerAndLogin(server.baseUrl, 'followuser3');
    await registerAndLogin(server.baseUrl, 'followuser3target');
    await client.post('/api/users/followuser3target/follow');

    const relDb = openRelDb(server);
    try {
      const rows = relDb.prepare('SELECT * FROM notifications WHERE username = ? AND type = ?')
        .all('followuser3target', 'follow');
      assert.equal(rows.length, 1);
      assert.equal(rows[0].from_username, 'followuser3');
    } finally {
      relDb.close();
    }
  });
});
