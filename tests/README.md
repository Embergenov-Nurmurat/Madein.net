# Madein.net — avtomatlashtirilgan testlar

## Ishga tushirish

```bash
npm install
npm test
```

## Qanday ishlaydi

Testlar Node.js'ning o'rnatilgan test runner'idan (`node:test`, tashqi
paket kerak emas — jest/mocha o'rniga) foydalanadi. Har bir test fayli
(`tests/*.test.js`) **haqiqiy serverni** (`server.js`) alohida
bola-jarayon sifatida, vaqtinchalik/izolyatsiyalangan SQLite baza bilan
ishga tushiradi va unga real HTTP so'rovlar (`fetch`) yuboradi — ya'ni
bular mock emas, to'liq integratsion testlar: routing, validatsiya,
sessiya, SQLite saqlash — hammasi haqiqatan sinaladi.

Har bir test fayli tugagandan so'ng, o'sha testning vaqtinchalik baza
papkasi avtomatik o'chiriladi — development ma'lumotlaringizga
(`storage/`) hech qanday ta'sir qilmaydi.

## Qamrov

| Fayl | Nimani sinaydi |
|---|---|
| `auth.test.js` | Ro'yxatdan o'tish, takroriy username, noto'g'ri parol, login/logout, himoyalangan endpointlar |
| `upload.test.js` | Haqiqiy rasm yuklash, feed'da ko'rinishi, soxta (spoofed) fayl rad etilishi, majburiy maydonlar |
| `cart-checkout.test.js` | Savatga qo'shish/olib tashlash, summalar hisobi, checkout (qo'lda to'lov), bo'sh savatni checkout qilishga urinish |
| `orders.test.js` | Xaridor/sotuvchi buyurtmani ko'rishi, begonalar ko'ra olmasligi, holatni yangilash va ruxsatlar |
| `wishlist.test.js` | Qo'shish/olib tashlash (toggle), login talab qilinishi |
| `collections.test.js` | To'plam yaratish, asar qo'shish/olib tashlash, nom o'zgartirish, o'chirish, begona foydalanuvchidan himoya — **bu aynan avvalgi "kolleksiyalar" bug'ini ochib bergan ssenariy** |

## Yangi test qo'shish

`tests/helpers.js`dagi `startTestServer()` va `registerAndLogin()` dan
foydalaning:

```js
const { startTestServer, registerAndLogin } = require('./helpers');

describe('Mening yangi funksiyam', () => {
  let server, client;
  before(async () => {
    server = await startTestServer();
    client = await registerAndLogin(server.baseUrl, 'testuser1');
  });
  after(() => server.stop());

  test('...', async () => {
    const res = await client.get('/api/...');
    assert.equal(res.status, 200);
  });
});
```
