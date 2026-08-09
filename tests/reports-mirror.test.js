const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');
const { startTestServer, Client, registerAndLogin, tinyPngBuffer } = require('./helpers');

const ADMIN_USERNAME = 'madein_admin';
const ADMIN_PASSWORD = 'TestAdminPass123!';

/* moderation.test.js'dagi bilan bir xil usul: admin parolini oldindan
   MA'LUM qilib qo'yish, chunki productiondagi hash testlarga noma'lum. */
async function preSeedAdmin(storageDir) {
  const dataDir = path.join(storageDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = dbSqlite.openDatabase(dataDir);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  dbSqlite.saveUserRow(sqlite, ADMIN_USERNAME, {
    passwordHash, fullname: 'Administrator', email: '', bio: '', avatar: null,
    phone: '', social: '', privacy: { phone: true, social: true, email: false },
    theme: null, joined: new Date().toISOString(), isAdmin: true,
    moderation: { bannedUntil: null, banReason: '', mutedUntil: null, muteReason: '' },
    notifications: [], following: [], wishlist: [], cart: {}
  });
  dbSqlite.closeDatabase(sqlite);
}

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

describe('Shikoyatlar (reports) — relyatsion bazaga dublikat yozish', () => {
  let server;
  let admin;

  before(async () => {
    server = await startTestServer({ preSeed: preSeedAdmin });
    admin = new Client(server.baseUrl);
    const res = await admin.post('/api/login', { username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    assert.equal(res.status, 200);
  });
  after(() => server.stop());

  test('asar haqida shikoyat relyatsion bazaga yoziladi', async () => {
    const owner = await registerAndLogin(server.baseUrl, 'repowner1');
    const reporter = await registerAndLogin(server.baseUrl, 'repuser1');
    const work = (await createWork(owner)).data.work;

    const res = await reporter.post(`/api/works/${work.id}/report`, { reason: 'Nomaqbul kontent' });
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT * FROM reports WHERE reporter = ? AND type = ?').get('repuser1', 'work');
      assert.ok(row);
      assert.equal(row.target_id, work.id);
      assert.equal(row.target_title, 'Test asar');
      assert.equal(row.target_owner, 'repowner1');
      assert.equal(row.reason, 'Nomaqbul kontent');
      assert.equal(row.status, 'open');
    } finally {
      relDb.close();
    }
  });

  test('foydalanuvchi haqida shikoyat relyatsion bazaga yoziladi', async () => {
    await registerAndLogin(server.baseUrl, 'repowner2');
    const reporter = await registerAndLogin(server.baseUrl, 'repuser2');

    const res = await reporter.post('/api/users/repowner2/report', { reason: 'Spam yozadi' });
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT * FROM reports WHERE reporter = ? AND type = ?').get('repuser2', 'user');
      assert.ok(row);
      assert.equal(row.target_id, 'repowner2');
      assert.equal(row.reason, 'Spam yozadi');
    } finally {
      relDb.close();
    }
  });

  test('admin shikoyatni yopganda relyatsion bazada status va resolved_by yangilanadi', async () => {
    const owner = await registerAndLogin(server.baseUrl, 'repowner3');
    const reporter = await registerAndLogin(server.baseUrl, 'repuser3');
    const work = (await createWork(owner)).data.work;
    await reporter.post(`/api/works/${work.id}/report`, { reason: 'test' });

    let reportId;
    let relDb = openRelDb(server);
    try {
      reportId = relDb.prepare('SELECT id FROM reports WHERE reporter = ? AND type = ?').get('repuser3', 'work').id;
    } finally { relDb.close(); }

    const res = await admin.post(`/api/admin/reports/${reportId}/resolve`);
    assert.equal(res.status, 200);

    relDb = openRelDb(server);
    try {
      const row = relDb.prepare('SELECT status, resolved_by, resolved_at FROM reports WHERE id = ?').get(reportId);
      assert.equal(row.status, 'resolved');
      assert.equal(row.resolved_by, ADMIN_USERNAME);
      assert.ok(row.resolved_at);
    } finally {
      relDb.close();
    }
  });

  test("admin asarni o'chirsa, u relyatsion bazadan ham o'chadi va ochiq shikoyat ham avtomatik yopiladi (avval e'tibordan chetda qolgan bo'shliq)", async () => {
    const owner = await registerAndLogin(server.baseUrl, 'repowner4');
    const reporter = await registerAndLogin(server.baseUrl, 'repuser4');
    const work = (await createWork(owner)).data.work;
    await reporter.post(`/api/works/${work.id}/report`, { reason: 'nomaqbul' });

    const res = await admin.delete(`/api/admin/works/${work.id}`);
    assert.equal(res.status, 200);

    const relDb = openRelDb(server);
    try {
      assert.equal(relDb.prepare('SELECT 1 FROM works WHERE id = ?').get(work.id), undefined,
        "asar relyatsion bazadan ham o'chishi kerak");
      const report = relDb.prepare('SELECT status, resolved_by FROM reports WHERE target_id = ? AND type = ?')
        .get(work.id, 'work');
      assert.ok(report, "shikoyat topilishi kerak");
      assert.equal(report.status, 'resolved', "asar o'chirilganda ochiq shikoyat avtomatik yopilishi kerak");
      assert.equal(report.resolved_by, ADMIN_USERNAME);
    } finally {
      relDb.close();
    }
  });
});
