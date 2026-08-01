const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
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
});
