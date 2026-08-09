const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Database = require('better-sqlite3');
const { startTestServer, Client, registerAndLogin } = require('./helpers');

describe("Ro'yxatdan o'tish va kirish (auth)", () => {
  let server;
  before(async () => { server = await startTestServer(); });
  after(() => server.stop());

  test("yangi foydalanuvchi muvaffaqiyatli ro'yxatdan o'tadi", async () => {
    const client = new Client(server.baseUrl);
    const res = await client.post('/api/register', { username: 'alice1', password: 'Password123!', fullname: 'Alice One' });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.username, 'alice1');
  });

  test("bir xil username bilan ikkinchi marta ro'yxatdan o'tish rad etiladi", async () => {
    const client = new Client(server.baseUrl);
    await client.post('/api/register', { username: 'bob1', password: 'Password123!', fullname: 'Bob' });
    const res2 = await client.post('/api/register', { username: 'bob1', password: 'Password123!', fullname: 'Bob' });
    assert.notEqual(res2.status, 200);
  });

  test("noto'g'ri parol bilan login rad etiladi", async () => {
    const client = new Client(server.baseUrl);
    await client.post('/api/register', { username: 'carol1', password: 'Password123!', fullname: 'Carol' });
    const res = await client.post('/api/login', { username: 'carol1', password: "noto'g'ri-parol" });
    assert.equal(res.status, 401);
  });

  test("to'g'ri login qilingandan keyin himoyalangan endpoint ishlaydi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'dave1');
    const res = await client.get('/api/orders/mine');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.asBuyer));
  });

  test("logout'dan keyin himoyalangan endpoint endi ishlamaydi", async () => {
    const client = await registerAndLogin(server.baseUrl, 'erin1');
    await client.post('/api/logout');
    const res = await client.get('/api/orders/mine');
    assert.equal(res.status, 401);
  });

  test("login qilmagan holda himoyalangan endpoint 401 qaytaradi", async () => {
    const client = new Client(server.baseUrl);
    const res = await client.get('/api/orders/mine');
    assert.equal(res.status, 401);
  });

  test("ro'yxatdan o'tish yangi relyatsion bazaga ham dublikat yoziladi (migratsiya, bosqich 1)", async () => {
    const client = new Client(server.baseUrl);
    const res = await client.post('/api/register', { username: 'relmirror1', password: 'Password123!', fullname: 'Rel Mirror', email: 'relmirror1@example.com' });
    assert.equal(res.status, 200);

    const relPath = path.join(server.storageDir, 'data', 'madein-relational.db');
    const relDb = new Database(relPath, { readonly: true });
    try {
      const row = relDb.prepare('SELECT username, fullname, email, is_admin FROM users WHERE username = ?').get('relmirror1');
      assert.ok(row, "foydalanuvchi relyatsion bazada topilishi kerak");
      assert.equal(row.fullname, 'Rel Mirror');
      assert.equal(row.email, 'relmirror1@example.com');
      assert.equal(row.is_admin, 0);
    } finally {
      relDb.close();
    }
  });

  test("yagona admin akkaunti relyatsion bazada ham is_admin=1 bilan mavjud", async () => {
    const relPath = path.join(server.storageDir, 'data', 'madein-relational.db');
    const relDb = new Database(relPath, { readonly: true });
    try {
      const row = relDb.prepare('SELECT is_admin FROM users WHERE username = ?').get('madein_admin');
      assert.ok(row, "admin akkaunti relyatsion bazada bo'lishi kerak");
      assert.equal(row.is_admin, 1);
    } finally {
      relDb.close();
    }
  });
});
