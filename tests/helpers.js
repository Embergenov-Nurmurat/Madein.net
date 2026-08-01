/**
 * tests/helpers.js — integratsion testlar uchun umumiy yordamchi.
 *
 * Har bir test fayli HAQIQIY serverni (server.js) alohida bola-jarayon
 * (child process) sifatida, vaqtinchalik/izolyatsiyalangan storage papkasi
 * bilan ishga tushiradi — shunda testlar bir-biriga yoki development
 * ma'lumotlariga (storage/data/madein.db) ta'sir qilmaydi, va real
 * HTTP so'rovlar orqali (fetch) butun stack — routing, validatsiya,
 * SQLite saqlash, sessiya — haqiqatan sinaladi (mock emas).
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SERVER_PATH = path.join(__dirname, '..', 'server.js');

/* Har bir test fayli uchun tasodifiy port — parallel test fayllari
   bir-biriga xalaqit bermasligi uchun. */
function randomPort() {
  return 20000 + Math.floor(Math.random() * 20000);
}

async function waitForServer(baseUrl, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl + '/api/payments/gateways');
      if (res.status) return true;
    } catch (e) { /* hali tayyor emas */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Server ' + timeoutMs + 'ms ichida ishga tushmadi');
}

/* Yangi izolyatsiyalangan server nusxasini ishga tushiradi.
   Qaytaradi: { baseUrl, stop() } */
async function startTestServer() {
  const port = randomPort();
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'madein-test-'));
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: String(port),
      STORAGE_DIR: storageDir,
      NODE_ENV: 'development', // HTTP ustida cookie'lar ishlashi uchun (secure:false)
      SESSION_SECRET: 'test-secret-not-for-production',
      // Tashqi provayderlar sozlanmagan — testlar ularsiz ham to'liq
      // o'tishi kerak (real loyihada ular ixtiyoriy bo'lgani kabi)
      SMTP_HOST: '', PAYME_MERCHANT_ID: '', CLICK_SERVICE_ID: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderrBuf = '';
  child.stderr.on('data', (d) => { stderrBuf += d.toString(); });

  try {
    await waitForServer(baseUrl);
  } catch (e) {
    child.kill();
    throw new Error('Server ishga tushmadi. stderr:\n' + stderrBuf);
  }

  function stop() {
    child.kill();
    try { fs.rmSync(storageDir, { recursive: true, force: true }); } catch (e) { /* muhim emas */ }
  }

  return { baseUrl, stop, port };
}

/* Cookie-jar bilan yengil HTTP klient — bitta "brauzer sessiyasi"ni
   simulyatsiya qiladi (login qilingandan keyin sessiya cookie'si
   keyingi so'rovlarga avtomatik qo'shiladi). */
class Client {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = {};
  }
  _cookieHeader() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }
  _captureCookies(res) {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.raw ? res.headers.raw()['set-cookie'] : []);
    const list = raw || [];
    for (const line of list) {
      const [pair] = line.split(';');
      const idx = pair.indexOf('=');
      if (idx > 0) this.cookies[pair.slice(0, idx)] = pair.slice(idx + 1);
    }
  }
  async request(method, urlPath, body, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (body !== undefined && !opts.isForm) headers['Content-Type'] = 'application/json';
    if (Object.keys(this.cookies).length) headers['Cookie'] = this._cookieHeader();
    const res = await fetch(this.baseUrl + urlPath, {
      method,
      headers,
      body: body === undefined ? undefined : (opts.isForm ? body : JSON.stringify(body))
    });
    this._captureCookies(res);
    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    return { status: res.status, ok: res.ok, data };
  }
  get(p) { return this.request('GET', p); }
  post(p, body, opts) { return this.request('POST', p, body || {}, opts); }
  put(p, body) { return this.request('PUT', p, body || {}); }
  patch(p, body) { return this.request('PATCH', p, body || {}); }
  delete(p) { return this.request('DELETE', p); }
}

/* Ro'yxatdan o'tib, darhol login qilingan Client qaytaradi — ko'p
   testlarda takrorlanadigan boshlang'ich qadam. */
async function registerAndLogin(baseUrl, username, password = 'Password123!') {
  const client = new Client(baseUrl);
  const reg = await client.post('/api/register', { username, password, fullname: username });
  if (reg.status !== 200) throw new Error(`Register failed for ${username}: ${JSON.stringify(reg.data)}`);
  return client;
}

/* 1x1 shaffof PNG — haqiqiy rasm yuklash testlari uchun (magic-byte
   tekshiruvidan real ravishda o'tadi). */
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
function tinyPngBuffer() {
  return Buffer.from(TINY_PNG_BASE64, 'base64');
}

module.exports = { startTestServer, Client, registerAndLogin, tinyPngBuffer };
