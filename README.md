# Madein.net

"Qo'lda yasalgan asarlar" galereya sayti — endi haqiqiy backend (Node.js + Express) bilan.
Ma'lumotlar (foydalanuvchilar, profillar, asarlar) `data/db.json` faylida,
rasmlar esa `uploads/` papkasida saqlanadi — sayt qayta ishga tushsa ham,
boshqa odam ochsa ham hech narsa yo'qolmaydi.

## Papka tuzilishi

```
madein-site/
├── server.js          ← backend (Express server)
├── package.json
├── public/
│   └── index.html      ← frontend (bitta HTML fayl)
├── data/db.json         ← foydalanuvchilar va asarlar (avtomatik yaratiladi)
├── uploads/              ← yuklangan rasmlar (avtomatik yaratiladi)
└── sessions/             ← login sessiyalari (avtomatik yaratiladi)
```

## 1. Kompyuteringizda sinab ko'rish

```bash
cd madein-site
npm install
npm start
```

Keyin brauzerda **http://localhost:3000** ni oching. Ro'yxatdan o'ting, rasm yuklang —
`data/db.json` va `uploads/` papkasida saqlanganini ko'rasiz.

## 2. Internetga yuklash

Bu oddiy Node.js ilova bo'lgani uchun deyarli har qanday hostingda ishlaydi.
Eng oson variantlar:

### A) Railway / Render / Fly.io (bepul tarif bilan boshlash mumkin)
1. Bu papkani GitHub repo qiling (`git init && git add . && git commit -m "init"`).
2. Railway.app yoki Render.com'da "New Web Service" → GitHub repo'ni tanlang.
3. Build buyrug'i: `npm install`, Start buyrug'i: `npm start`.
4. Muhit o'zgaruvchisi qo'shing: `SESSION_SECRET` = uzun tasodifiy matn (masalan
   `openssl rand -hex 32` orqali generatsiya qiling).
5. **Muhim:** Render/Railway'ning bepul tarifida disk vaqti-vaqti bilan
   tozalanishi mumkin (ephemeral filesystem). Agar rasm va ma'lumotlar doim
   saqlanib qolishi kerak bo'lsa, "Persistent Disk / Volume" qo'shing va uni
   `data/` va `uploads/` papkalariga bog'lang (ikkala platforma ham buni
   sozlamalarida taklif qiladi).

### B) Oddiy VPS (masalan DigitalOcean, Timeweb, Hetzner)
```bash
# serverga ulanib:
git clone <repo-url> madein-site
cd madein-site
npm install
npm install -g pm2          # ilovani doim ishlab turishi uchun
SESSION_SECRET=$(openssl rand -hex 32) pm2 start server.js --name madein
pm2 save && pm2 startup     # server qayta yoqilganda avtomatik ishga tushishi uchun
```
Domenni ulash uchun Nginx orqali `localhost:3000` ga reverse proxy sozlang va
Let's Encrypt (`certbot`) bilan HTTPS o'rnating.

## 3. Muhim eslatmalar

- **HTTPS shart.** `server.js` ichida `NODE_ENV=production` bo'lsa, sessiya
  cookie'si faqat HTTPS orqali yuboriladi. Domeningizga SSL sertifikat
  o'rnating (aksariyat hosting/Nginx+certbot buni bepul qiladi).
- **`SESSION_SECRET`ni albatta o'zgartiring** — bu login sessiyalarini
  himoyalaydigan maxfiy kalit.
- **50+ kishi uchun yetarli**, chunki JSON fayl juda kichik (matn ma'lumotlar
  bir necha kilobayt), rasmlar esa alohida fayllar sifatida saqlanadi.
  Agar kelajakda yuzlab-minglab foydalanuvchi kutilsa, `data/db.json` o'rniga
  haqiqiy ma'lumotlar bazasiga (PostgreSQL, MySQL) o'tish tavsiya etiladi —
  lekin hozircha bunga ehtiyoj yo'q.
- **Zaxira nusxa** oling: vaqti-vaqti bilan `data/` va `uploads/` papkalarini
  boshqa joyga nusxalab turing.
- Parollar **bcrypt** bilan xeshlanadi (sanoat standarti), lekin baribir bu —
  soddalashtirilgan tizim: haqiqiy to'lov/bank darajasidagi xavfsizlik audit
  qilinmagan.

## API yo'llari (agar o'zgartirmoqchi bo'lsangiz)

| Metod  | Yo'l               | Vazifa                              |
|--------|--------------------|--------------------------------------|
| POST   | /api/register       | Ro'yxatdan o'tish                    |
| POST   | /api/login          | Kirish                               |
| POST   | /api/logout         | Chiqish                              |
| GET    | /api/me             | Joriy foydalanuvchi ma'lumoti        |
| PUT    | /api/profile        | Profilni tahrirlash                  |
| PUT    | /api/theme          | Mavzuni saqlash                      |
| GET    | /api/works          | Foydalanuvchining asarlari           |
| POST   | /api/works          | Yangi asar yuklash (multipart/form)  |
| DELETE | /api/works/:id      | Asarni o'chirish                     |
| GET    | /api/feed?q=&type=&sort=&following= | Qidiruv/filtr bilan umumiy lenta |
| POST   | /api/users/:username/follow | Obuna bo'lish / bekor qilish  |
| GET    | /api/users/:username/followers | Obunachilar ro'yxati        |
| GET    | /api/users/:username/following | Kimlarga obuna bo'lgani     |
| POST   | /api/works/:id/save | Asarni saqlash/saqlashdan chiqarish  |
| GET    | /api/saved          | Saqlangan asarlar ro'yxati           |
| POST   | /api/works/:id/report | Asarga shikoyat                    |
| POST   | /api/users/:username/report | Foydalanuvchiga shikoyat      |
| GET    | /api/admin/stats    | Umumiy statistika (admin)            |
| GET    | /api/admin/reports  | Shikoyatlar ro'yxati (admin)         |
| POST   | /api/admin/reports/:id/resolve | Shikoyatni yopish (admin) |

## Yangi qo'shilgan funksiyalar (savdodan tashqari)

- **Rasmni to'liq hajmda ko'rish**: bosh sahifadagi (lentadagi) har qanday asar rasmiga bosilsa, u to'liq hajmda ochiladi (chapga/o'ngga o'tish bilan).
- **Qidiruv va filtr**: lentada nom/tavsif/ijodkor bo'yicha qidirish, kategoriya bo'yicha filtr, "eng yangi/eng ko'p yoqtirilgan" saralash, "faqat kuzatuvchilarim" rejimi.
- **Obuna (follow)**: boshqa foydalanuvchi profilida obuna bo'lish/bekor qilish, obunachilar/kuzatuvchilar soni.
- **Saqlanganlar**: har bir asarni "bookmark" qilib, alohida "Saqlanganlar" bo'limida ko'rish.
- **Ulashish**: asarga havola nusxalash (yoki telefonda tizim ulashish oynasi); havola orqali ochilganda o'sha asar avtomatik to'liq hajmda ochiladi.
- **Shikoyat qilish**: asar yoki foydalanuvchiga shikoyat yuborish, admin panelda ko'rib chiqish/yopish.
- **Admin statistika**: foydalanuvchilar, asarlar, layk/komment, ban/mut sonlari — bir qarashda.
- **Spam himoyasi**: ro'yxatdan o'tish, kirish, komment, xabar va shikoyatlarga oddiy so'rov cheklovi (rate limit) qo'yildi.
- **Rasm siqish va thumbnail**: yuklangan har bir rasm avtomatik siqiladi (max 1600px, JPEG sifat 82%) va lenta/kartalar uchun alohida kichik nusxa (thumbnail, 480px) yaratiladi — sahifalar sezilarli tezroq yuklanadi, disk joyi tejaladi. Buning uchun `sharp` kutubxonasi ishlatiladi (`npm install` paytida avtomatik o'rnatiladi).
- **Narx oralig'i bo'yicha filtr**: lentada "narx, dan" / "narx, gacha" maydonlari orqali faqat shu oraliqdagi sotuvdagi asarlarni ko'rsatish.
- **Kengaytirilgan lenta filtri**: bosh sahifada kategoriya, saralash, faqat kuzatuvchilarim va narx oralig'i — barchasi bitta filtr panelida (avval faqat backend'da tayyor bo'lib, interfeysga chiqarilmagan edi).
- **Ko'rishlar statistikasi**: har bir asar to'liq hajmda ochilganda "ko'rishlar" soni oshadi; bu son profil sahifasida (o'zingiznikida va boshqa foydalanuvchilarnikida) umumiy statistika sifatida ko'rinadi.
- **Kengaytirilgan profil/"do'kon" statistikasi**: har qanday foydalanuvchi profilida jami asarlar, sotuvdagi/ko'rgazmadagi asarlar soni, obunachilar, jami layklar va jami ko'rishlar bir joyda.
- **7 tilning barchasida to'liq tarjima**: yuqoridagi barcha yangi elementlar (filtr, statistika) o'zbek, ingliz, rus, xitoy, hind, ispan va arab tillariga tarjima qilingan.

**Bu safar qo'shilmagan narsalar** (sabab bilan):
- **Parolni email orqali tiklash / email tasdiqlash / push-bildirishnoma** — bular uchun tashqi email/SMS xizmati (masalan SMTP yoki SMS-shlyuz) ulanishi kerak; hozircha loyihada bunday xizmat sozlanmagan.
- **Video yuklash** — server resurslarini ko'proq talab qiladi, alohida so'rovda qo'shsa bo'ladi.
- **Haqiqiy savdo/to'lov tizimi (cart, checkout, Payme/Click)** — asarlarda narx ko'rsatiladi, lekin to'lov integratsiyasi yo'q; bu alohida katta ish.

