/**
 * lib/db/users.js — foydalanuvchilar bilan ishlash uchun SQL qatlami.
 *
 * `getUser()` funksiyasi natijani ATAYLAB eski `db.users[username]`
 * shakliga (moderation/callPrivacy/notifPrefs/twoFactor ichma-ich
 * obyektlar, notifications/following/wishlist massivlari) O'XSHASH
 * qilib qaytaradi. Bu ataylab qilingan qaror: server.js rout'lari
 * navbatma-navbat shu qatlamga o'tkazilganda, ularning ICHKI mantig'ini
 * (`u.moderation.bannedUntil`, `u.notifPrefs.likes` va h.k.) qayta
 * yozishga hojat qolmaydi — faqat ma'lumot QAYERDAN kelishini almashtiramiz.
 */

function bool(v) { return !!v; }

/* ---------------------------------------------------------------------- */
/* O'QISH                                                                  */
/* ---------------------------------------------------------------------- */

function getUser(db, username) {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) return null;
  return hydrateUser(db, row);
}

function userExists(db, username) {
  return !!db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
}

/* Xom SQL qatorni (users jadvalidan) to'liq, ichma-ich obyektli
   foydalanuvchi shakliga aylantiradi — bog'liq jadvallardan (notifications,
   following, wishlist, cart, collections, ...) qo'shimcha o'qiydi. */
function hydrateUser(db, row) {
  const backupCodeHashes = db.prepare('SELECT code_hash FROM user_backup_codes WHERE username = ?')
    .all(row.username).map(r => r.code_hash);

  const pushSubscriptions = db.prepare('SELECT subscription FROM push_subscriptions WHERE username = ?')
    .all(row.username).map(r => JSON.parse(r.subscription));

  const callAllowed = db.prepare('SELECT allowed_username FROM call_privacy_allowed WHERE username = ?')
    .all(row.username).map(r => r.allowed_username);

  const following = db.prepare('SELECT followee FROM follows WHERE follower = ? ORDER BY created_at')
    .all(row.username).map(r => r.followee);

  const notifications = db.prepare('SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC')
    .all(row.username).map(rowToNotification);

  const cartRows = db.prepare('SELECT work_id, qty FROM cart_items WHERE username = ?').all(row.username);
  const cart = {};
  for (const c of cartRows) cart[c.work_id] = c.qty;

  const wishlist = db.prepare('SELECT work_id FROM wishlist_items WHERE username = ? ORDER BY created_at')
    .all(row.username).map(r => r.work_id);

  const collectionRows = db.prepare('SELECT * FROM collections WHERE username = ? ORDER BY created_at')
    .all(row.username);
  const collections = collectionRows.map(c => ({
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    workIds: db.prepare('SELECT work_id FROM collection_items WHERE collection_id = ? ORDER BY added_at')
      .all(c.id).map(r => r.work_id)
  }));

  return {
    username: row.username,
    passwordHash: row.password_hash,
    fullname: row.fullname,
    email: row.email,
    bio: row.bio,
    avatar: row.avatar,
    phone: row.phone,
    social: row.social,
    privacy: {
      phone: bool(row.privacy_phone),
      social: bool(row.privacy_social),
      email: bool(row.privacy_email)
    },
    theme: row.theme,
    lang: row.lang,
    isAdmin: bool(row.is_admin),
    joined: row.joined_at,

    moderation: {
      bannedUntil: row.banned_until,
      banReason: row.ban_reason,
      mutedUntil: row.muted_until,
      muteReason: row.mute_reason
    },
    callPrivacy: {
      mode: row.call_privacy_mode,
      allowed: callAllowed
    },
    notifPrefs: {
      enabled: bool(row.notif_enabled),
      likes: bool(row.notif_likes),
      comments: bool(row.notif_comments),
      follows: bool(row.notif_follows),
      orders: bool(row.notif_orders),
      messages: bool(row.notif_messages)
    },
    twoFactor: {
      enabled: bool(row.twofa_enabled),
      secret: row.twofa_secret,
      backupCodeHashes,
      enabledAt: row.twofa_enabled_at,
      totpLastCounter: row.twofa_totp_last_counter,
      totpLock: { fails: row.twofa_lock_fails, lockedUntil: row.twofa_lock_until }
    },

    pushSubscriptions,
    following,
    notifications,
    cart,
    wishlist,
    collections
  };
}

function rowToNotification(n) {
  const out = { id: n.id, type: n.type, read: bool(n.read), createdAt: n.created_at };
  if (n.from_username != null) out.from = n.from_username;
  if (n.work_id != null) out.workId = n.work_id;
  if (n.work_title != null) out.workTitle = n.work_title;
  if (n.order_id != null) out.orderId = n.order_id;
  if (n.items_count != null) out.itemsCount = n.items_count;
  if (n.status != null) out.status = n.status;
  if (n.comment_id != null) out.commentId = n.comment_id;
  if (n.rating != null) out.rating = n.rating;
  return out;
}

/* ---------------------------------------------------------------------- */
/* YOZISH                                                                  */
/* ---------------------------------------------------------------------- */

function createUser(db, { username, passwordHash, fullname = '', email = '', lang = 'uz', isAdmin = false }) {
  db.prepare(`INSERT INTO users (
    username, password_hash, fullname, email, lang, is_admin, joined_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    username, passwordHash, fullname, email, lang, isAdmin ? 1 : 0, new Date().toISOString()
  );
  return getUser(db, username);
}

/* Faqat "oddiy" (bevosita ustunga tushadigan) maydonlarni yangilaydi.
   Ichma-ich strukturalar (moderation, notifPrefs, ...) uchun quyidagi
   maxsus funksiyalardan foydalaning — ular tegishli ustunlarni aniq
   nomlab yangilaydi, shunda chaqiruvchi tomon qaysi ustun o'zgarishini
   nazorat qiladi. */
const UPDATABLE_FIELDS = {
  fullname: 'fullname', email: 'email', bio: 'bio', avatar: 'avatar',
  phone: 'phone', social: 'social', theme: 'theme', lang: 'lang',
  passwordHash: 'password_hash', isAdmin: 'is_admin'
};

function updateUserFields(db, username, patch) {
  const sets = [];
  const values = [];
  for (const [key, col] of Object.entries(UPDATABLE_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      sets.push(`${col} = ?`);
      values.push(key === 'isAdmin' ? (patch[key] ? 1 : 0) : patch[key]);
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'privacy')) {
    if (typeof patch.privacy.phone === 'boolean') { sets.push('privacy_phone = ?'); values.push(patch.privacy.phone ? 1 : 0); }
    if (typeof patch.privacy.social === 'boolean') { sets.push('privacy_social = ?'); values.push(patch.privacy.social ? 1 : 0); }
    if (typeof patch.privacy.email === 'boolean') { sets.push('privacy_email = ?'); values.push(patch.privacy.email ? 1 : 0); }
  }
  if (!sets.length) return;
  values.push(username);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE username = ?`).run(...values);
}

function setModeration(db, username, { bannedUntil, banReason, mutedUntil, muteReason } = {}) {
  db.prepare(`UPDATE users SET banned_until = ?, ban_reason = ?, muted_until = ?, mute_reason = ? WHERE username = ?`)
    .run(bannedUntil ?? null, banReason ?? '', mutedUntil ?? null, muteReason ?? '', username);
}

function setNotifPrefs(db, username, prefs) {
  const cols = { enabled: 'notif_enabled', likes: 'notif_likes', comments: 'notif_comments',
    follows: 'notif_follows', orders: 'notif_orders', messages: 'notif_messages' };
  const sets = [];
  const values = [];
  for (const [key, col] of Object.entries(cols)) {
    if (typeof prefs[key] === 'boolean') { sets.push(`${col} = ?`); values.push(prefs[key] ? 1 : 0); }
  }
  if (!sets.length) return;
  values.push(username);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE username = ?`).run(...values);
}

/* mode: 'everyone'|'nobody'|'selected'; allowed: faqat 'selected' rejimida
   ma'noli — ruxsat etilgan foydalanuvchilar ro'yxati TO'LIQ almashtiriladi
   (eskisi o'chirilib, yangisi yoziladi — chunki chaqiruvchi tomon (rout)
   har doim yakuniy ro'yxatni yuboradi, o'sish/qisqarishni emas). */
function setCallPrivacy(db, username, { mode, allowed } = {}) {
  const safeMode = ['everyone', 'nobody', 'selected'].includes(mode) ? mode : 'everyone';
  db.prepare('UPDATE users SET call_privacy_mode = ? WHERE username = ?').run(safeMode, username);
  if (Array.isArray(allowed)) {
    const tx = db.transaction((list) => {
      db.prepare('DELETE FROM call_privacy_allowed WHERE username = ?').run(username);
      const ins = db.prepare('INSERT OR IGNORE INTO call_privacy_allowed (username, allowed_username) VALUES (?, ?)');
      for (const a of list) ins.run(username, a);
    });
    tx(allowed);
  }
}

/* ---------- Bildirishnomalar ---------- */

function addNotification(db, username, notif) {
  db.prepare(`INSERT INTO notifications (
    id, username, type, from_username, work_id, work_title, order_id,
    items_count, status, comment_id, rating, read, created_at
  ) VALUES (@id, @username, @type, @from_username, @work_id, @work_title, @order_id,
    @items_count, @status, @comment_id, @rating, @read, @created_at)`).run({
    id: notif.id,
    username,
    type: notif.type,
    from_username: notif.from ?? null,
    work_id: notif.workId ?? null,
    work_title: notif.workTitle ?? null,
    order_id: notif.orderId ?? null,
    items_count: notif.itemsCount ?? null,
    status: notif.status ?? null,
    comment_id: notif.commentId ?? null,
    rating: notif.rating ?? null,
    read: 0,
    created_at: notif.createdAt || new Date().toISOString()
  });
}

function markNotificationsRead(db, username) {
  db.prepare('UPDATE notifications SET read = 1 WHERE username = ? AND read = 0').run(username);
}

/* ---------- Obunalar ---------- */

function follow(db, follower, followee) {
  db.prepare('INSERT OR IGNORE INTO follows (follower, followee, created_at) VALUES (?, ?, ?)')
    .run(follower, followee, new Date().toISOString());
}

function unfollow(db, follower, followee) {
  db.prepare('DELETE FROM follows WHERE follower = ? AND followee = ?').run(follower, followee);
}

function isFollowing(db, follower, followee) {
  return !!db.prepare('SELECT 1 FROM follows WHERE follower = ? AND followee = ?').get(follower, followee);
}

function followerCount(db, username) {
  return db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee = ?').get(username).n;
}

/**
 * Foydalanuvchi nomini (PRIMARY KEY) o'zgartiradi. `users(username)`ga
 * ishora qiluvchi BARCHA jadvallar (works, likes, comments, reviews,
 * cart_items, wishlist_items, collections, orders, order_items,
 * messages, follows, notifications, ...) `db/schema.sql`da
 * `ON UPDATE CASCADE` bilan belgilangani uchun BITTA UPDATE orqali
 * avtomatik yangilanadi — bu eski JSON-blob usulidagi (server.js,
 * `renameUsernameEverywhere`) o'nlab qo'lda yozilgan sikllar o'rniga.
 *
 * Faqat ikkita joy CASCADE'dan TASHQARIDA, chunki ular FK EMAS
 * (ataylab — bular "voqea vaqtidagi suratlar", jonli bog'lanish emas):
 *   1. reports.target_owner / reports.target_id (type='user' bo'lsa)
 *   2. conversations.id — bu odatiy PK emas, balki ikkala ishtirokchi
 *      username'idan HOSIL QILINGAN qiymat (convId), shuning uchun
 *      user_a/user_b CASCADE orqali yangilangach, id'ni ham QO'LDA
 *      to'g'ri qiymatga o'tkazish kerak (bu esa o'z navbatida
 *      messages.conversation_id / conversation_read_upto.conversation_id'ni
 *      CASCADE orqali avtomatik to'g'irlaydi, chunki ular
 *      conversations(id)ga ON UPDATE CASCADE bilan bog'langan).
 */
function renameUser(db, oldUsername, newUsername) {
  if (oldUsername === newUsername) return;
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET username = ? WHERE username = ?').run(newUsername, oldUsername);

    db.prepare('UPDATE reports SET target_owner = ? WHERE target_owner = ?').run(newUsername, oldUsername);
    db.prepare(`UPDATE reports SET target_id = ? WHERE type = 'user' AND target_id = ?`).run(newUsername, oldUsername);

    // user_a/user_b CASCADE orqali allaqachon yangilangan — endi shu
    // foydalanuvchi ishtirokidagi suhbatlarning ID'sini to'g'ri qiymatga
    // o'tkazamiz (convId = saralangan juftlik).
    const convs = db.prepare('SELECT id, user_a, user_b FROM conversations WHERE user_a = ? OR user_b = ?')
      .all(newUsername, newUsername);
    const updConvId = db.prepare('UPDATE conversations SET id = ? WHERE id = ?');
    for (const c of convs) {
      const correctId = [c.user_a, c.user_b].sort().join('__');
      if (correctId !== c.id) updConvId.run(correctId, c.id);
    }
  });
  tx();
}

/* ---------- Savat (cart) ---------- */

function setCartQty(db, username, workId, qty) {
  if (qty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE username = ? AND work_id = ?').run(username, workId);
    return;
  }
  db.prepare(`INSERT INTO cart_items (username, work_id, qty) VALUES (?, ?, ?)
    ON CONFLICT(username, work_id) DO UPDATE SET qty = excluded.qty`).run(username, workId, qty);
}

function removeFromCart(db, username, workId) {
  db.prepare('DELETE FROM cart_items WHERE username = ? AND work_id = ?').run(username, workId);
}

function clearCart(db, username) {
  db.prepare('DELETE FROM cart_items WHERE username = ?').run(username);
}

/* ---------- Xohishlar ro'yxati (wishlist) ---------- */

function toggleWishlist(db, username, workId) {
  const exists = db.prepare('SELECT 1 FROM wishlist_items WHERE username = ? AND work_id = ?').get(username, workId);
  if (exists) {
    db.prepare('DELETE FROM wishlist_items WHERE username = ? AND work_id = ?').run(username, workId);
    return false;
  }
  db.prepare('INSERT INTO wishlist_items (username, work_id, created_at) VALUES (?, ?, ?)')
    .run(username, workId, new Date().toISOString());
  return true;
}

/* ---------- Kolleksiyalar ---------- */

function createCollection(db, username, collection) {
  db.prepare('INSERT INTO collections (id, username, name, created_at) VALUES (?, ?, ?, ?)')
    .run(collection.id, username, collection.name, collection.createdAt || new Date().toISOString());
}

function renameCollection(db, collectionId, name) {
  db.prepare('UPDATE collections SET name = ? WHERE id = ?').run(name, collectionId);
}

function deleteCollection(db, collectionId) {
  db.prepare('DELETE FROM collections WHERE id = ?').run(collectionId); // CASCADE -> collection_items
}

function addToCollection(db, collectionId, workId) {
  db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, work_id, added_at) VALUES (?, ?, ?)')
    .run(collectionId, workId, new Date().toISOString());
}

function removeFromCollection(db, collectionId, workId) {
  db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND work_id = ?').run(collectionId, workId);
}

module.exports = {
  getUser, userExists, hydrateUser, createUser, updateUserFields,
  setModeration, setNotifPrefs, setCallPrivacy, addNotification, markNotificationsRead,
  follow, unfollow, isFollowing, followerCount, renameUser,
  setCartQty, removeFromCart, clearCart,
  toggleWishlist,
  createCollection, renameCollection, deleteCollection, addToCollection, removeFromCollection
};
