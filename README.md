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
