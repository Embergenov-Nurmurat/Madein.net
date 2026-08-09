#!/usr/bin/env node
/**
 * scripts/migrate-to-relational.js
 *
 * Hozirgi "bitta JSON blob = bitta foydalanuvchi/asar" saqlash usulini
 * (storage/data/madein.db, db-sqlite.js orqali) YANGI relyatsion sxemaga
 * (db/schema.sql) ko'chiradi.
 *
 * XAVFSIZLIK: bu skript MANBA bazani HECH QACHON o'zgartirmaydi/o'chirmaydi —
 * faqat o'qiydi. Natija butunlay ALOHIDA fayl sifatida yoziladi, shuning
 * uchun ishlab turgan saytga hech qanday xavf yo'q. Ko'chirish tekshirilib,
 * qoniqarli bo'lgach, ALOHIDA bosqichda (bu skriptda emas) server shu yangi
 * bazadan foydalanadigan qilib almashtiriladi.
 *
 * Ishlatish:
 *   node scripts/migrate-to-relational.js [manba.db] [natija.db]
 *
 * Standart:
 *   manba:  storage/data/madein.db
 *   natija: storage/data/madein-relational.db
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const dbSqlite = require('../db-sqlite');

const SRC_PATH = process.argv[2] || path.join(__dirname, '..', 'storage', 'data', 'madein.db');
const DEST_PATH = process.argv[3] || path.join(__dirname, '..', 'storage', 'data', 'madein-relational.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

function bool01(v) {
  return v ? 1 : 0;
}

function main() {
  if (!fs.existsSync(SRC_PATH)) {
    console.error(`Manba baza topilmadi: ${SRC_PATH}`);
    process.exit(1);
  }
  if (fs.existsSync(DEST_PATH)) {
    console.error(`Natija fayli allaqachon mavjud: ${DEST_PATH}\nAvval uni o'chiring yoki boshqa nom bering — bu skript mavjud faylni ATAYLAB qayta yozmaydi.`);
    process.exit(1);
  }

  console.log(`Manba:  ${SRC_PATH}`);
  console.log(`Natija: ${DEST_PATH}`);

  // 1) Eski JSON-blob bazani to'liq o'qiymiz (db-sqlite.js'dagi mavjud
  //    funksiyadan foydalanamiz — server ishlatadigan HAQIQIY formatni
  //    o'qiydi, shuning uchun ikkalasi orasida farq bo'lish xavfi yo'q)
  const srcSqlite = new Database(SRC_PATH, { readonly: true });
  const data = dbSqlite.readFullDB(srcSqlite);
  srcSqlite.close();

  console.log(`O'qildi: ${Object.keys(data.users).length} foydalanuvchi, ` +
    `${Object.keys(data.works).reduce((s, u) => s + data.works[u].length, 0)} asar, ` +
    `${Object.keys(data.messages).length} suhbat, ` +
    `${data.orders.length} buyurtma, ${data.reports.length} shikoyat.`);

  // 2) Yangi bazani sxema bilan yaratamiz
  const dest = new Database(DEST_PATH);
  dest.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  // MUHIM: schema.sql o'zi "PRAGMA foreign_keys = ON;" bilan boshlanadi,
  // shuning uchun buni FAQAT sxema qo'llanilgandan KEYIN o'chiramiz — aks
  // holda sxemadagi pragma bizning o'chirishimizni bekor qilib qo'yadi.
  // Ko'chirish paytida yozuvlar tartibi (masalan: to'plam ichidagi asar ID'si
  // hali "works" jadvaliga yozilmagan bo'lishi mumkin) muhim emas — oxirida
  // FOREIGN KEY CHECK orqali baribir to'liq tekshiriladi.
  dest.pragma('foreign_keys = OFF');

  const stats = { users: 0, works: 0, images: 0, tags: 0, likes: 0, comments: 0, reviews: 0,
    cart: 0, wishlist: 0, collections: 0, collectionItems: 0, follows: 0, notifications: 0,
    pushSubs: 0, backupCodes: 0, callAllowed: 0, orders: 0, orderItems: 0,
    conversations: 0, messages: 0, readUpto: 0, reports: 0 };

  const tx = dest.transaction(() => {
    // ---------------- USERS ----------------
    const insUser = dest.prepare(`INSERT INTO users (
      username, password_hash, fullname, email, bio, avatar, phone, social,
      privacy_phone, privacy_social, privacy_email, theme, lang, is_admin,
      banned_until, ban_reason, muted_until, mute_reason, call_privacy_mode,
      notif_enabled, notif_likes, notif_comments, notif_follows, notif_orders, notif_messages,
      twofa_enabled, twofa_secret, twofa_enabled_at, twofa_totp_last_counter,
      twofa_lock_fails, twofa_lock_until, joined_at, last_active_at
    ) VALUES (@username, @password_hash, @fullname, @email, @bio, @avatar, @phone, @social,
      @privacy_phone, @privacy_social, @privacy_email, @theme, @lang, @is_admin,
      @banned_until, @ban_reason, @muted_until, @mute_reason, @call_privacy_mode,
      @notif_enabled, @notif_likes, @notif_comments, @notif_follows, @notif_orders, @notif_messages,
      @twofa_enabled, @twofa_secret, @twofa_enabled_at, @twofa_totp_last_counter,
      @twofa_lock_fails, @twofa_lock_until, @joined_at, @last_active_at)`);

    const insBackupCode = dest.prepare('INSERT INTO user_backup_codes (username, code_hash) VALUES (?, ?)');
    const insPushSub = dest.prepare('INSERT INTO push_subscriptions (username, endpoint, subscription, created_at) VALUES (?, ?, ?, ?)');
    const insCallAllowed = dest.prepare('INSERT OR IGNORE INTO call_privacy_allowed (username, allowed_username) VALUES (?, ?)');
    const insFollow = dest.prepare('INSERT OR IGNORE INTO follows (follower, followee, created_at) VALUES (?, ?, ?)');
    const insNotif = dest.prepare(`INSERT INTO notifications (
      id, username, type, from_username, work_id, work_title, order_id,
      items_count, status, comment_id, rating, read, created_at
    ) VALUES (@id, @username, @type, @from_username, @work_id, @work_title, @order_id,
      @items_count, @status, @comment_id, @rating, @read, @created_at)`);
    const insCart = dest.prepare('INSERT OR IGNORE INTO cart_items (username, work_id, qty) VALUES (?, ?, ?)');
    const insWishlist = dest.prepare('INSERT OR IGNORE INTO wishlist_items (username, work_id, created_at) VALUES (?, ?, ?)');
    const insCollection = dest.prepare('INSERT INTO collections (id, username, name, created_at) VALUES (?, ?, ?, ?)');
    const insCollectionItem = dest.prepare('INSERT OR IGNORE INTO collection_items (collection_id, work_id, added_at) VALUES (?, ?, ?)');

    const now = new Date().toISOString();

    for (const uname of Object.keys(data.users)) {
      const u = data.users[uname] || {};
      const mod = u.moderation || {};
      const cp = u.callPrivacy || {};
      const np = u.notifPrefs || {};
      const tf = u.twoFactor || {};

      insUser.run({
        username: uname,
        password_hash: u.passwordHash || '',
        fullname: u.fullname || '',
        email: u.email || '',
        bio: u.bio || '',
        avatar: u.avatar || null,
        phone: u.phone || '',
        social: u.social || '',
        privacy_phone: bool01(!u.privacy || u.privacy.phone !== false),
        privacy_social: bool01(!u.privacy || u.privacy.social !== false),
        privacy_email: bool01(u.privacy && u.privacy.email === true),
        theme: u.theme || null,
        lang: u.lang || 'uz',
        is_admin: bool01(u.isAdmin),
        banned_until: mod.bannedUntil || null,
        ban_reason: mod.banReason || '',
        muted_until: mod.mutedUntil || null,
        mute_reason: mod.muteReason || '',
        call_privacy_mode: ['everyone', 'nobody', 'selected'].includes(cp.mode) ? cp.mode : 'everyone',
        notif_enabled: bool01(np.enabled !== false),
        notif_likes: bool01(np.likes !== false),
        notif_comments: bool01(np.comments !== false),
        notif_follows: bool01(np.follows !== false),
        notif_orders: bool01(np.orders !== false),
        notif_messages: bool01(np.messages !== false),
        twofa_enabled: bool01(tf.enabled),
        twofa_secret: tf.secret || null,
        twofa_enabled_at: tf.enabledAt || null,
        twofa_totp_last_counter: tf.totpLastCounter || 0,
        twofa_lock_fails: (tf.totpLock && tf.totpLock.fails) || 0,
        twofa_lock_until: (tf.totpLock && tf.totpLock.lockedUntil) || 0,
        joined_at: u.joined || now,
        last_active_at: null
      });
      stats.users++;

      for (const codeHash of (tf.backupCodeHashes || [])) {
        insBackupCode.run(uname, codeHash);
        stats.backupCodes++;
      }
      for (const sub of (u.pushSubscriptions || [])) {
        if (!sub || !sub.endpoint) continue;
        insPushSub.run(uname, sub.endpoint, JSON.stringify(sub), now);
        stats.pushSubs++;
      }
      for (const allowed of (cp.allowed || [])) {
        insCallAllowed.run(uname, allowed);
        stats.callAllowed++;
      }
      for (const followee of (u.following || [])) {
        insFollow.run(uname, followee, now); // aniq obuna sanasi manbada saqlanmagan
        stats.follows++;
      }
      for (const n of (u.notifications || [])) {
        insNotif.run({
          id: n.id, username: uname, type: n.type || 'unknown',
          from_username: n.from || null, work_id: n.workId || null,
          work_title: n.workTitle || null, order_id: n.orderId || null,
          items_count: n.itemsCount != null ? n.itemsCount : null,
          status: n.status || null, comment_id: n.commentId || null,
          rating: n.rating != null ? n.rating : null,
          read: bool01(n.read), created_at: n.createdAt || now
        });
        stats.notifications++;
      }
      for (const [workId, qty] of Object.entries(u.cart || {})) {
        insCart.run(uname, workId, qty);
        stats.cart++;
      }
      for (const workId of (u.wishlist || [])) {
        insWishlist.run(uname, workId, now);
        stats.wishlist++;
      }
      for (const col of (u.collections || [])) {
        insCollection.run(col.id, uname, col.name, col.createdAt || now);
        stats.collections++;
        for (const workId of (col.workIds || [])) {
          insCollectionItem.run(col.id, workId, now);
          stats.collectionItems++;
        }
      }
    }

    // ---------------- WORKS ----------------
    const insWork = dest.prepare(`INSERT INTO works (
      id, owner, title, type, type_custom, status, price, currency,
      stock_mode, stock_qty, description, media_type, video, poster, views, created_at
    ) VALUES (@id, @owner, @title, @type, @type_custom, @status, @price, @currency,
      @stock_mode, @stock_qty, @description, @media_type, @video, @poster, @views, @created_at)`);
    const insImage = dest.prepare('INSERT INTO work_images (work_id, position, image_path, thumb_path) VALUES (?, ?, ?, ?)');
    const insTag = dest.prepare('INSERT OR IGNORE INTO work_tags (work_id, tag) VALUES (?, ?)');
    const insLike = dest.prepare('INSERT OR IGNORE INTO likes (work_id, username, created_at) VALUES (?, ?, ?)');
    const insComment = dest.prepare('INSERT INTO comments (id, work_id, username, text, created_at) VALUES (?, ?, ?, ?, ?)');
    const insReview = dest.prepare('INSERT OR IGNORE INTO reviews (id, work_id, username, rating, text, created_at) VALUES (?, ?, ?, ?, ?, ?)');

    for (const owner of Object.keys(data.works)) {
      for (const w of data.works[owner]) {
        insWork.run({
          id: w.id, owner, title: w.title || '', type: w.type || 'boshqa',
          type_custom: w.typeCustom || null, status: w.status === 'sale' ? 'sale' : 'expo',
          price: Number(w.price) || 0, currency: w.currency || 'UZS',
          stock_mode: w.stockMode || null, stock_qty: w.stockQty != null ? w.stockQty : null,
          description: w.desc || '', media_type: w.mediaType === 'video' ? 'video' : 'image',
          video: w.video || null, poster: w.poster || null, views: w.views || 0,
          created_at: w.createdAt || now
        });
        stats.works++;

        const images = Array.isArray(w.images) && w.images.length ? w.images : (w.image ? [w.image] : []);
        const thumbs = Array.isArray(w.thumbs) && w.thumbs.length === images.length ? w.thumbs : images;
        images.forEach((img, i) => {
          insImage.run(w.id, i, img, thumbs[i] || null);
          stats.images++;
        });

        for (const tag of (w.tags || [])) {
          insTag.run(w.id, tag);
          stats.tags++;
        }
        for (const likerUsername of (w.likes || [])) {
          insLike.run(w.id, likerUsername, w.createdAt || now); // aniq layk vaqti manbada saqlanmagan
          stats.likes++;
        }
        for (const c of (w.comments || [])) {
          insComment.run(c.id, w.id, c.username, c.text || '', c.createdAt || now);
          stats.comments++;
        }
        for (const r of (w.reviews || [])) {
          insReview.run(r.id, w.id, r.username, r.rating, r.text || '', r.createdAt || now);
          stats.reviews++;
        }
      }
    }

    // ---------------- ORDERS ----------------
    const insOrder = dest.prepare(`INSERT INTO orders (
      id, buyer, status, payment_method, payment_status, checkout_url,
      paid_at, paid_notified, tracking_number, carrier, payment_meta, created_at, updated_at
    ) VALUES (@id, @buyer, @status, @payment_method, @payment_status, @checkout_url,
      @paid_at, @paid_notified, @tracking_number, @carrier, @payment_meta, @created_at, @updated_at)`);
    const insOrderItem = dest.prepare(`INSERT INTO order_items (
      order_id, work_id, title, qty, price, currency, seller_username
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    for (const o of data.orders) {
      // Provayderga xos maydonlarni (payme{}/click{}) bitta JSON'ga yig'amiz —
      // bular haqiqiy relyatsion ma'lumot emas, webhook hisob-kitobi (yuqoridagi
      // izohga qarang).
      const meta = {};
      if (o.payme) meta.payme = o.payme;
      if (o.click) meta.click = o.click;

      insOrder.run({
        id: o.id, buyer: o.buyer, status: o.status || 'placed',
        payment_method: o.paymentMethod || 'manual', payment_status: o.paymentStatus || 'unpaid',
        checkout_url: o.checkoutUrl || null, paid_at: o.paidAt || null,
        paid_notified: bool01(o.paidNotified), tracking_number: o.trackingNumber || null,
        carrier: o.carrier || null,
        payment_meta: Object.keys(meta).length ? JSON.stringify(meta) : null,
        created_at: o.createdAt || now, updated_at: o.updatedAt || null
      });
      stats.orders++;

      for (const it of (o.items || [])) {
        insOrderItem.run(o.id, it.workId || null, it.title || '', it.qty || 1,
          Number(it.price) || 0, it.currency || 'UZS', it.sellerUsername);
        stats.orderItems++;
      }
    }

    // ---------------- MESSAGES / CONVERSATIONS ----------------
    const insConv = dest.prepare('INSERT INTO conversations (id, user_a, user_b, updated_at) VALUES (?, ?, ?, ?)');
    const insMsg = dest.prepare(`INSERT INTO messages (
      id, conversation_id, from_username, to_username, type, text, file_name, content, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insReadUpto = dest.prepare('INSERT OR IGNORE INTO conversation_read_upto (conversation_id, username, read_upto) VALUES (?, ?, ?)');

    for (const convKey of Object.keys(data.messages)) {
      const conv = data.messages[convKey];
      if (!Array.isArray(conv.participants) || conv.participants.length !== 2) continue;
      const [a, b] = conv.participants;

      insConv.run(conv.id || convKey, a, b, conv.updatedAt || now);
      stats.conversations++;

      for (const m of (conv.messages || [])) {
        // Turga xos qo'shimcha maydonlarni (fileName'dan tashqarisini) content'ga yig'amiz
        const { id, from, to, type, text, fileName, createdAt, ...rest } = m;
        // Ba'zi tizim xabarlarida (masalan "order" turi) `to` maydoni umuman
        // saqlanmaydi — oluvchi conv.participants'dan chiqarib olinadi
        // (suhbatda har doim ANIQ 2 ishtirokchi bo'ladi, shu bois bir qiymatli).
        const toUser = to || (from === a ? b : a);
        insMsg.run(
          id, conv.id || convKey, from, toUser, type || 'text', text || null,
          fileName || null, Object.keys(rest).length ? JSON.stringify(rest) : null,
          createdAt || now
        );
        stats.messages++;
      }
      for (const [uname, ts] of Object.entries(conv.readUpto || {})) {
        insReadUpto.run(conv.id || convKey, uname, ts);
        stats.readUpto++;
      }
    }

    // ---------------- REPORTS ----------------
    const insReport = dest.prepare(`INSERT INTO reports (
      id, reporter, type, target_id, target_title, target_owner, reason, status, resolved_by, resolved_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const r of data.reports) {
      insReport.run(r.id, r.reporter, r.type, r.targetId, r.targetTitle || null, r.targetOwner || null,
        r.reason || null, r.status || 'open', r.resolvedBy || null, r.resolvedAt || null, r.createdAt || now);
      stats.reports++;
    }
  });

  tx();
  dest.pragma('foreign_keys = ON');

  // 3) Yaxlitlikni tekshiramiz — FK buzilishlar bo'lsa ko'rsatamiz
  const fkErrors = dest.pragma('foreign_key_check');
  dest.close();

  console.log('\nKo\'chirildi:');
  for (const [key, count] of Object.entries(stats)) {
    console.log(`  ${key}: ${count}`);
  }

  if (fkErrors.length) {
    console.error(`\n⚠️  FOREIGN KEY buzilishlari topildi (${fkErrors.length} ta) — natija faylni ko'rib chiqing:`);
    console.error(fkErrors.slice(0, 20));
    process.exit(1);
  } else {
    console.log('\n✅ FOREIGN KEY yaxlitligi tekshirildi — muammo topilmadi.');
  }
}

main();
