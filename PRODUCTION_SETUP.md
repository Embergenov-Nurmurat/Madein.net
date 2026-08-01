# Madein.net — Production sozlash qo'llanmasi

Bu hujjat saytni ishlab chiqarish (production) muhitida to'liq
funksional holda ishga tushirish uchun kerak bo'ladigan barcha
`.env` qiymatlarini va ularni qanday olishni tushuntiradi. Har bir
bo'lim ixtiyoriy — to'ldirilmasa, tegishli funksiya shunchaki
o'chirilgan holda ishlaydi (sayt baribir buzilmaydi).

## 1. Asosiy sozlamalar (majburiy)

```
PORT=3000
NODE_ENV=production
SESSION_SECRET=<uzun, tasodifiy va maxfiy satr>
SITE_URL=https://sizning-domeningiz.uz
```

- `SESSION_SECRET` — generatsiya qilish: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `NODE_ENV=production` bo'lsa, sessiya cookie'lari `secure: true` bilan
  yuboriladi — bu **HTTPS talab qiladi**. Agar domenda hali SSL
  sertifikat bo'lmasa (masalan lokal sinovda), vaqtincha
  `NODE_ENV=development` qo'ying, aks holda foydalanuvchilar login
  qila olmaydi (brauzer cookie'ni saqlamaydi).

## 2. Push xabarnomalar (VAPID)

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@madein.net
```

Kalitlarni generatsiya qilish uchun loyihada tayyor skript bor:

```bash
npm run generate-vapid
```

Chiqqan qiymatlarni `.env` fayliga joylashtiring. **Har bir muhit
(dev/staging/production) uchun alohida kalit generatsiya qiling** —
xuddi shu private kalitni ikkinchi joyda ishlatmang, va uni hech
qachon reponi yoki chatga joylashtirmang.

Bu sozlangach, brauzer push-xabarnomalarga obuna bo'lgan foydalanuvchilar
yangi xabar, buyurtma holati o'zgarishi va boshqa hodisalar haqida
qurilma darajasidagi bildirishnoma oladi (sayt yopiq bo'lsa ham).

## 3. Email (SMTP) — parolni tiklash va buyurtma xatlari

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Madein.net <no-reply@madein.net>
```

Har qanday standart SMTP provayder ishlaydi (`nodemailer` orqali).
Tavsiya etiladigan variantlar:

| Provayder | Bepul limit | Sozlash |
|---|---|---|
| **Brevo (Sendinblue)** | kuniga 300 xat bepul | brevo.com'da ro'yxatdan o'ting → SMTP & API → "SMTP" bo'limidan login/parol oling. `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587` |
| **Resend** | oyiga 3000 xat bepul | resend.com'da domeningizni tasdiqlang → API key yarating, ularning SMTP integratsiyasidan foydalaning |
| **Gmail** (faqat kichik hajm/sinov uchun) | kuniga ~500 xat | Google akkauntda 2 bosqichli tasdiqni yoqing → "App passwords" orqali maxsus parol yarating. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=sizning@gmail.com`, `SMTP_PASS=<app parol>` |
| **Amazon SES** | katta hajm, arzon | AWS konsolida SES'ni yoqing, domeningizni tasdiqlang, SMTP credentials yarating |

Ishlab chiqarishda **Gmail'dan foydalanmang** — kunlik limit past va
akkaunt bloklanishi mumkin. Kichik-o'rta loyihalar uchun Brevo yoki
Resend yetarli va bepul.

Sozlangach sinab ko'rish:
```bash
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: Number(process.env.SMTP_PORT)===465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
t.sendMail({ from: process.env.SMTP_FROM, to: 'sizning-shaxsiy-emailingiz@example.com', subject: 'Sinov xati', text: 'SMTP ishlayapti!' }).then(() => console.log('Yuborildi!')).catch(e => console.error('Xato:', e.message));
"
```

## 4. To'lov tizimlari (Payme / Click)

Bu qismning to'liq qo'llanmasi `.env.example` faylida izohlangan.
Qisqacha:

1. **Payme**: business.payme.uz'da "Kassa" yarating → Merchant ID va
   maxfiy kalitni `PAYME_MERCHANT_ID` / `PAYME_SECRET_KEY`ga
   joylashtiring. Kassa sozlamalarida webhook manzilini
   `https://SIZNING_DOMENINGIZ/api/payments/payme` deb ko'rsating.
   Avval `PAYME_TEST_MODE=true` bilan checkout.test.paycom.uz orqali
   sinab ko'ring, keyin jonli kalitga o'ting va `PAYME_TEST_MODE=false`
   qiling.
2. **Click**: merchant.click.uz'da shartnoma tuzing → Service ID,
   Merchant ID, Merchant User ID va maxfiy kalitni oling. Webhook
   manzillari: `/api/payments/click/prepare` va `/api/payments/click/complete`.

Ikkalasi ham to'ldirilmasa, checkout'da faqat "qo'lda/offline to'lov"
varianti ko'rsatiladi — sayt baribir to'liq ishlaydi.

## 5. Tekshirish ro'yxati (production'ga chiqarishdan oldin)

- [ ] `SESSION_SECRET` — tasodifiy, hech qayerda oshkor qilinmagan
- [ ] `NODE_ENV=production` va sayt HTTPS orqali xizmat qiladi (masalan
      Nginx + Let's Encrypt yoki hosting provayderning SSL'i orqali)
- [ ] `SITE_URL` haqiqiy domeningizga mos keladi (to'lov qaytish
      havolalari va email xatlaridagi havolalar shundan foydalanadi)
- [ ] VAPID kalitlari generatsiya qilingan va faqat shu muhitda ishlatiladi
- [ ] SMTP sinov xati muvaffaqiyatli yuborilgani tekshirilgan
- [ ] Payme/Click — avval test rejimida, keyin jonli kalitlar bilan
      sinovdan o'tkazilgan
- [ ] `storage/` katalogi (SQLite baza va yuklangan fayllar) muntazam
      zaxira nusxalanadi (backup)
