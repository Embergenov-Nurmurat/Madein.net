-- ============================================================================
-- Madein.net — RELYATSION SXEMA (better-sqlite3)
--
-- Bu sxema hozirgi "bitta JSON blob = bitta foydalanuvchi/asar" saqlash
-- usulini (db-sqlite.js) almashtiradi. Maqsad:
--   1. Haqiqiy SQL WHERE/JOIN/INDEX orqali qidirish va filtrlash
--      (hozir /api/feed HAR SO'ROVDA barcha foydalanuvchilarning BARCHA
--      asarlarini xotiraga to'liq yuklab, JS'da filtrlaydi).
--   2. Faqat kerakli qatorni o'qish/yozish — butun bazani xotiraga
--      yuklamasdan.
--   3. Ma'lumotlar yaxlitligi — FOREIGN KEY orqali "yetim" yozuvlarning
--      oldini olish (masalan o'chirilgan foydalanuvchining asari qolib
--      ketishi).
--
-- NIMA ATAYLAB NORMALLASHTIRILMAGAN (JSON ustunlar sifatida qoldirilgan):
--   - orders.payment_meta — Payme/Click provayderlaridan keladigan,
--     tranzaksiya ID'lari bo'yicha KALITLANGAN, provayderga xos hisob-kitob
--     ma'lumotlari (masalan payme.transactions{transId: {...}}). Bu
--     to'lov WEBHOOK'larining o'z ichki holati — ustidan so'rov
--     yuritilmaydi, faqat saqlanadi/o'qiladi, shuning uchun uni alohida
--     jadvalga bo'lish foyda bermaydi, faqat murakkablik qo'shadi.
--   - messages.content — xabar turiga (photo/video/circle/voice/file/
--     order/call) qarab TURLICHA maydonlar (fileName, duration, callId,
--     orderId va h.k.). Bu haqiqiy "polimorf" ma'lumot; har bir tur uchun
--     alohida ustun ochish jadvalni siyraklashtiradi (ko'p ustun NULL
--     bo'lib qoladi) va yangi xabar turi qo'shilganda migratsiya talab
--     qiladi. `type` ustuni orqali filtrlash SQL darajasida ishlaydi,
--     faqat tur-ichi tafsilotlar JSON'da.
--
-- Migratsiya skripti: scripts/migrate-to-relational.js
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- FOYDALANUVCHILAR
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  username              TEXT PRIMARY KEY,
  password_hash         TEXT NOT NULL,
  fullname              TEXT NOT NULL DEFAULT '',
  email                 TEXT NOT NULL DEFAULT '',
  bio                   TEXT NOT NULL DEFAULT '',
  avatar                TEXT,
  phone                 TEXT NOT NULL DEFAULT '',
  social                TEXT NOT NULL DEFAULT '',
  privacy_phone         INTEGER NOT NULL DEFAULT 1,
  privacy_social        INTEGER NOT NULL DEFAULT 1,
  privacy_email         INTEGER NOT NULL DEFAULT 0,
  theme                 TEXT,
  lang                  TEXT NOT NULL DEFAULT 'uz',
  is_admin              INTEGER NOT NULL DEFAULT 0,

  -- moderatsiya (avval: user.moderation.*)
  banned_until          TEXT,
  ban_reason            TEXT NOT NULL DEFAULT '',
  muted_until           TEXT,
  mute_reason           TEXT NOT NULL DEFAULT '',

  -- qo'ng'iroq maxfiyligi (avval: user.callPrivacy.mode; .allowed[] -> call_privacy_allowed)
  call_privacy_mode     TEXT NOT NULL DEFAULT 'everyone' CHECK (call_privacy_mode IN ('everyone','nobody','selected')),

  -- bildirishnoma sozlamalari (avval: user.notifPrefs.*)
  notif_enabled         INTEGER NOT NULL DEFAULT 1,
  notif_likes           INTEGER NOT NULL DEFAULT 1,
  notif_comments        INTEGER NOT NULL DEFAULT 1,
  notif_follows         INTEGER NOT NULL DEFAULT 1,
  notif_orders          INTEGER NOT NULL DEFAULT 1,
  notif_messages        INTEGER NOT NULL DEFAULT 1,

  -- 2FA (avval: user.twoFactor.*)
  twofa_enabled         INTEGER NOT NULL DEFAULT 0,
  twofa_secret          TEXT,
  twofa_enabled_at      TEXT,
  twofa_totp_last_counter INTEGER NOT NULL DEFAULT 0,
  twofa_lock_fails       INTEGER NOT NULL DEFAULT 0,
  twofa_lock_until       INTEGER NOT NULL DEFAULT 0,

  joined_at             TEXT NOT NULL,
  last_active_at        TEXT
);

-- twoFactor.backupCodeHashes[]
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  code_hash   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON user_backup_codes(username);

-- user.pushSubscriptions[]
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  endpoint      TEXT NOT NULL,
  subscription  TEXT NOT NULL,   -- to'liq webpush obyekt (endpoint/keys.p256dh/keys.auth)
  created_at    TEXT NOT NULL,
  UNIQUE(username, endpoint)
);

-- user.callPrivacy.allowed[] ("selected" rejimi uchun ro'yxat)
CREATE TABLE IF NOT EXISTS call_privacy_allowed (
  username          TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  allowed_username  TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (username, allowed_username)
);

-- user.following[]
CREATE TABLE IF NOT EXISTS follows (
  follower    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  followee    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (follower, followee)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee);

-- user.notifications[]
CREATE TABLE IF NOT EXISTS notifications (
  id             TEXT PRIMARY KEY,
  username       TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,  -- qabul qiluvchi
  type           TEXT NOT NULL,
  from_username  TEXT,
  work_id        TEXT,
  work_title     TEXT,
  order_id       TEXT,
  items_count    INTEGER,
  status         TEXT,
  comment_id     TEXT,
  rating         INTEGER,
  read           INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(username, created_at DESC);

-- ============================================================================
-- ASARLAR (WORKS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS works (
  id            TEXT PRIMARY KEY,
  owner         TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'boshqa',
  type_custom   TEXT,
  status        TEXT NOT NULL DEFAULT 'expo' CHECK (status IN ('sale','expo')),
  price         REAL NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'UZS',
  stock_mode    TEXT CHECK (stock_mode IN ('fixed','order') OR stock_mode IS NULL),
  stock_qty     INTEGER,
  description   TEXT NOT NULL DEFAULT '',
  media_type    TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  video         TEXT,
  poster        TEXT,
  views         INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_works_owner ON works(owner);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_created ON works(created_at DESC);

-- work.images[] / work.thumbs[] (indeks bo'yicha bog'langan juftlik)
CREATE TABLE IF NOT EXISTS work_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id     TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  image_path  TEXT NOT NULL,
  thumb_path  TEXT
);
CREATE INDEX IF NOT EXISTS idx_work_images_work ON work_images(work_id, position);

-- work.tags[]
CREATE TABLE IF NOT EXISTS work_tags (
  work_id   TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  tag       TEXT NOT NULL,
  PRIMARY KEY (work_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_work_tags_tag ON work_tags(tag);

-- work.likes[]
CREATE TABLE IF NOT EXISTS likes (
  work_id     TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (work_id, username)
);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(username);

-- work.comments[]
CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  work_id     TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  text        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_work ON comments(work_id, created_at);

-- work.reviews[] (faqat yakunlangan xariddan keyin, foydalanuvchi boshiga bitta)
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  work_id     TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  UNIQUE(work_id, username)
);
CREATE INDEX IF NOT EXISTS idx_reviews_work ON reviews(work_id);

-- ============================================================================
-- SAVAT / SAQLANGANLAR / KOLLEKSIYALAR
-- ============================================================================

-- user.cart {workId: qty}
CREATE TABLE IF NOT EXISTS cart_items (
  username  TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  work_id   TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  qty       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (username, work_id)
);

-- user.wishlist[]
CREATE TABLE IF NOT EXISTS wishlist_items (
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  work_id     TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (username, work_id)
);

-- user.collections[] (nomlangan to'plamlar)
CREATE TABLE IF NOT EXISTS collections (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(username);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id  TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  work_id        TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  added_at       TEXT NOT NULL,
  PRIMARY KEY (collection_id, work_id)
);

-- ============================================================================
-- BUYURTMALAR
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  buyer           TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  status          TEXT NOT NULL DEFAULT 'placed',
  payment_method  TEXT NOT NULL DEFAULT 'manual',
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',
  checkout_url    TEXT,
  paid_at         TEXT,
  paid_notified   INTEGER NOT NULL DEFAULT 0,
  tracking_number TEXT,
  carrier         TEXT,
  payment_meta    TEXT,     -- JSON: provayderga xos ma'lumot (payme.transactions, click{})
  created_at      TEXT NOT NULL,
  updated_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- order.items[] — xarid vaqtidagi NARX/NOM instantanasi saqlanadi (asar
-- keyinchalik o'zgarsa yoki o'chirilsa ham, buyurtma tarixi buzilmasin
-- deb ataylab denormallashtirilgan — work_id shunchaki ma'lumotnoma).
CREATE TABLE IF NOT EXISTS order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  work_id         TEXT REFERENCES works(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  qty             INTEGER NOT NULL,
  price           REAL NOT NULL,
  currency        TEXT NOT NULL,
  seller_username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_username);

-- ============================================================================
-- XABARLAR (CHAT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY,      -- convId(a,b) = [a,b].sort().join('__')
  user_a      TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  user_b      TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversations_a ON conversations(user_a);
CREATE INDEX IF NOT EXISTS idx_conversations_b ON conversations(user_b);

CREATE TABLE IF NOT EXISTS messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  from_username    TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  to_username      TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  type             TEXT NOT NULL DEFAULT 'text',  -- text|photo|video|circle|voice|file|order|call
  text             TEXT,
  file_name        TEXT,
  content          TEXT,      -- JSON: turga xos qo'shimcha maydonlar
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

-- conversation.readUpto {username: timestamp}
CREATE TABLE IF NOT EXISTS conversation_read_upto (
  conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  username         TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  read_upto        TEXT NOT NULL,
  PRIMARY KEY (conversation_id, username)
);

-- ============================================================================
-- SHIKOYATLAR (MODERATSIYA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  reporter      TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
  type          TEXT NOT NULL,        -- work|user|comment|...
  target_id     TEXT NOT NULL,
  target_title  TEXT,                 -- shikoyat qilingan payt saqlangan nom (asar sarlavhasi/foydalanuvchi to'liq ismi)
  target_owner  TEXT,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolved_by   TEXT,
  resolved_at   TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
